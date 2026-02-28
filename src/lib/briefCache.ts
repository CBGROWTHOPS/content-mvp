/**
 * Brief Caching System - Cache creative briefs by SHA1 hash of inputs.
 * Avoids redundant LLM calls when generating similar content.
 */
import crypto from "crypto";
import { supabase } from "./supabase";
import { 
  CompactCreativeBrief, 
  BriefInput, 
  generateCompactBrief, 
  GenerateBriefResult 
} from "./compactBrief";

export function computeBriefKey(input: BriefInput): string {
  const hash = crypto.createHash("sha1");
  hash.update(JSON.stringify({
    brandId: input.brandId,
    goal: input.goal,
    topic: input.topic,
    audience: input.audience,
    style: input.style,
  }));
  return hash.digest("hex").slice(0, 16);
}

export async function getCachedBrief(
  briefKey: string
): Promise<CompactCreativeBrief | null> {
  const { data, error } = await supabase
    .from("creative_briefs")
    .select("brief")
    .eq("brief_key", briefKey)
    .single();

  if (error || !data) {
    return null;
  }
  return data.brief as CompactCreativeBrief;
}

export async function cacheBrief(
  briefKey: string,
  brief: CompactCreativeBrief
): Promise<void> {
  await supabase.from("creative_briefs").upsert(
    {
      brief_key: briefKey,
      brief,
      created_at: new Date().toISOString(),
    },
    { onConflict: "brief_key" }
  );
}

export async function getOrGenerateBrief(
  input: BriefInput,
  options?: { skipCache?: boolean }
): Promise<GenerateBriefResult> {
  const briefKey = computeBriefKey(input);

  if (!options?.skipCache) {
    const cached = await getCachedBrief(briefKey);
    if (cached) {
      return {
        brief: cached,
        tokenUsage: { prompt: 0, completion: 0, total: 0 },
        cached: true,
      };
    }
  }

  const result = await generateCompactBrief(input);

  try {
    await cacheBrief(briefKey, result.brief);
  } catch (err) {
    console.error("Failed to cache brief:", err);
  }

  return result;
}
