import type { Job } from "bullmq";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildPrompt } from "../../core/prompts.js";
import { runReplicate } from "../../lib/replicate.js";
import { renderReelFromBlueprint } from "../../remotion/render.js";
import { supabase, STORAGE_BUCKET, getStoragePath } from "../../lib/supabase.js";
import type { QueueJobPayload } from "../../types/index.js";

const BLUEPRINT_FORMATS = ["reel_kit", "wide_video_kit"] as const;

function mergeGenerationIntoVariables(
  variables: Record<string, string | number | boolean>,
  generation: {
    marketing_output?: { headline?: string; primaryText?: string; cta?: string } | null;
    reel_blueprint?: { shots?: { sceneDescription?: string }[] } | null;
  }
): Record<string, string | number | boolean> {
  const out = { ...variables };
  const mo = generation.marketing_output;
  if (mo) {
    if (mo.headline) out.headline = mo.headline;
    if (mo.primaryText) out.primaryText = mo.primaryText;
    if (mo.cta) out.cta = mo.cta;
  }
  const rb = generation.reel_blueprint;
  if (rb?.shots?.length) {
    rb.shots.forEach((s, i) => {
      if (s.sceneDescription) out[`scene${i + 1}`] = s.sceneDescription;
    });
  }
  return out;
}

export async function processContentJob(job: Job<QueueJobPayload, void, string>): Promise<void> {
  const { jobId, payload } = job.data;

  try {
    await supabase
      .from("jobs")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", jobId);

    let enrichedPayload = payload;
    const genId = (payload as { generation_id?: string }).generation_id;
    type GenRow = {
      marketing_output?: { headline?: string; primaryText?: string; cta?: string } | null;
      reel_blueprint?: { shots?: { sceneDescription?: string }[]; durationSeconds?: number } | null;
    } | null;
    let gen: GenRow = null;
    if (genId) {
      const { data } = await supabase.from("generations").select("*").eq("id", genId).single();
      gen = data as GenRow;
      if (gen) {
        enrichedPayload = {
          ...payload,
          variables: mergeGenerationIntoVariables(payload.variables ?? {}, gen),
        };
      }
    }

    const isVideo = payload.format !== "image" && payload.format !== "image_kit";
    const ext = isVideo ? "mp4" : "png";
    const filename = `output.${ext}`;
    const storagePath = getStoragePath(
      payload.brand_key,
      payload.format,
      jobId,
      filename
    );

    let buffer: Buffer | undefined;
    let cost: number | null = null;

    // Deterministic renderer path: ReelBlueprint → Remotion → MP4 (no AI model)
    const useRemotion =
      isVideo &&
      gen?.reel_blueprint &&
      BLUEPRINT_FORMATS.includes(payload.format as (typeof BLUEPRINT_FORMATS)[number]);

    let usedRemotion = false;
    if (useRemotion) {
      const blueprint = gen!.reel_blueprint as Parameters<typeof renderReelFromBlueprint>[0];
      const tmpPath = path.join(os.tmpdir(), `remotion-${jobId}.mp4`);
      try {
        await renderReelFromBlueprint(blueprint, tmpPath);
        buffer = await fs.readFile(tmpPath);
        await fs.unlink(tmpPath).catch(() => {});
        usedRemotion = true;
      } catch (remotionErr) {
        const errMsg = remotionErr instanceof Error ? remotionErr.message : String(remotionErr);
        console.warn(`Remotion render failed, falling back to Replicate: ${errMsg}`);
      }
    }
    
    if (!usedRemotion) {
      // Generative path: prompt → Replicate → clip
      const prompt = await buildPrompt(enrichedPayload as QueueJobPayload["payload"]);
      const { url: replicateUrl, cost: c } = await runReplicate(
        payload.provider_model_id,
        prompt,
        {
          lengthSeconds: payload.length_seconds,
          aspectRatio: payload.aspect_ratio,
        }
      );
      cost = c ?? null;
      const response = await fetch(replicateUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch output: ${response.status}`);
      }
      buffer = Buffer.from(await response.arrayBuffer());
    }

    if (!buffer) {
      throw new Error("No output buffer generated");
    }

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: isVideo ? "video/mp4" : "image/png",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    const assetType =
      payload.format === "image" || payload.format === "image_kit"
        ? "image"
        : "video";
    const durationSeconds =
      usedRemotion && gen?.reel_blueprint
        ? (gen.reel_blueprint as { durationSeconds?: number }).durationSeconds ?? null
        : payload.length_seconds ?? null;
    await supabase.from("assets").insert({
      job_id: jobId,
      type: assetType,
      url: publicUrl,
      duration_seconds: durationSeconds,
    });

    await supabase
      .from("jobs")
      .update({
        status: "completed",
        cost: cost ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Job ${jobId} failed:`, message);

    await supabase
      .from("jobs")
      .update({
        status: "failed",
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    throw err;
  }
}
