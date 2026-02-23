import type { Job } from "bullmq";
import { buildPrompt } from "../../prompts/index.js";
import { runReplicate } from "../../lib/replicate.js";
import { supabase, STORAGE_BUCKET, getStoragePath } from "../../lib/supabase.js";
import type { QueueJobPayload } from "../../types/index.js";

export async function processContentJob(job: Job<QueueJobPayload, void, string>): Promise<void> {
  const { jobId, payload } = job.data;

  try {
    await supabase
      .from("jobs")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", jobId);

    const prompt = buildPrompt(payload.format, payload.hook_type, payload.variables);

    const { url: replicateUrl, cost } = await runReplicate(payload.model, prompt, {
      lengthSeconds: payload.length_seconds,
    });

    const ext = replicateUrl.includes(".mp4") ? "mp4" : "mp4";
    const filename = `output.${ext}`;
    const storagePath = getStoragePath(
      payload.brand,
      payload.format,
      jobId,
      filename
    );

    const response = await fetch(replicateUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch output: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    await supabase.from("assets").insert({
      job_id: jobId,
      type: "video",
      url: publicUrl,
      duration_seconds: payload.length_seconds,
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
