import { runReplicate } from "../../lib/replicate.js";
import { selectModel } from "../../lib/models.js";
import type { JobInput } from "../../schema/job.js";

/**
 * Image generator: select model, send prompt, return asset url.
 * Generic - receives prompts from kit plan or direct job.
 */
export async function generateImage(
  prompt: string,
  payload: Pick<JobInput, "format" | "quality" | "model_key" | "aspect_ratio">
): Promise<{ url: string; cost?: number | null }> {
  const selected = selectModel(
    payload.format,
    payload.quality,
    payload.model_key
  );
  const { url, cost } = await runReplicate(selected.provider_model_id, prompt, {
    aspectRatio: payload.aspect_ratio,
  });
  return { url, cost };
}
