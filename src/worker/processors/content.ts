import type { Job } from "bullmq";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildPrompt } from "../../core/prompts.js";
import { runReplicate } from "../../lib/replicate.js";
import { renderReelFromBlueprint, type ReelAssetsInput } from "../../remotion/render.js";
import { supabase, STORAGE_BUCKET, getStoragePath } from "../../lib/supabase.js";
import { generateVoiceoverToFile, VOICE_PRESETS } from "../../lib/elevenlabs.js";
import { selectTrack } from "../../lib/musicLibrary.js";
import type { QueueJobPayload } from "../../types/index.js";

const BLUEPRINT_FORMATS = ["reel_kit", "wide_video_kit"] as const;

type ReelType = "text_overlay" | "voiceover" | "broll" | "talking_head";

interface ExtendedBlueprint {
  format: string;
  reelType?: ReelType;
  durationSeconds: number;
  fps?: number;
  voiceoverScript?: {
    fullScript: string;
    segments?: Array<{ shotId: string; text: string; emotion?: string }>;
  };
  musicTrack?: {
    mood: string;
    tempo?: "slow" | "medium" | "upbeat";
    genre?: string;
  };
  shots: Array<{
    shotId: string;
    timeStart: number;
    timeEnd: number;
    shotType: string;
    cameraMovement: string;
    sceneDescription: string;
    visualSource?: string;
    videoPrompt?: string;
    onScreenText?: { text: string };
    [key: string]: unknown;
  }>;
  endFrame?: { headline?: string; cta?: string; brandName?: string };
}

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

/**
 * Generate audio/video assets based on reel type and blueprint.
 */
async function generateReelAssets(
  blueprint: ExtendedBlueprint,
  jobId: string,
  brandKey: string
): Promise<{ assets: ReelAssetsInput; totalCost: number }> {
  const assets: ReelAssetsInput = {};
  let totalCost = 0;
  const reelType = blueprint.reelType ?? "text_overlay";
  const tmpDir = path.join(os.tmpdir(), `reel-assets-${jobId}`);
  await fs.mkdir(tmpDir, { recursive: true });

  // Generate voiceover for voiceover and broll reels
  if ((reelType === "voiceover" || reelType === "broll") && blueprint.voiceoverScript?.fullScript) {
    console.log(`Generating voiceover for job ${jobId}...`);
    try {
      const voPath = path.join(tmpDir, "voiceover.mp3");
      const result = await generateVoiceoverToFile(
        blueprint.voiceoverScript.fullScript,
        voPath,
        { voiceId: VOICE_PRESETS.professional_female }
      );
      
      // Upload voiceover to Supabase
      const voBuffer = await fs.readFile(voPath);
      const voStoragePath = getStoragePath(brandKey, "audio", jobId, "voiceover.mp3");
      await supabase.storage.from(STORAGE_BUCKET).upload(voStoragePath, voBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });
      const { data: voUrlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(voStoragePath);
      assets.voiceoverUrl = voUrlData.publicUrl;
      totalCost += result.cost;
      console.log(`Voiceover generated: ${result.characterCount} chars, $${result.cost.toFixed(4)}`);
    } catch (err) {
      console.warn(`Voiceover generation failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  // Select music track
  if (blueprint.musicTrack?.mood) {
    console.log(`Selecting music for job ${jobId}...`);
    const selection = selectTrack({
      mood: blueprint.musicTrack.mood,
      tempo: blueprint.musicTrack.tempo,
      genre: blueprint.musicTrack.genre,
      minDurationSeconds: blueprint.durationSeconds,
    });
    
    if (selection) {
      try {
        // Check if file exists
        await fs.access(selection.filePath);
        
        // Upload music to Supabase
        const musicBuffer = await fs.readFile(selection.filePath);
        const musicStoragePath = getStoragePath(brandKey, "audio", jobId, `music-${selection.track.id}.mp3`);
        await supabase.storage.from(STORAGE_BUCKET).upload(musicStoragePath, musicBuffer, {
          contentType: "audio/mpeg",
          upsert: true,
        });
        const { data: musicUrlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(musicStoragePath);
        assets.musicUrl = musicUrlData.publicUrl;
        console.log(`Music selected: ${selection.track.id} (${selection.track.mood})`);
      } catch {
        console.warn(`Music file not found: ${selection.filePath}`);
      }
    }
  }

  // Generate video for broll shots
  if (reelType === "broll") {
    const videosByShot: Record<string, string> = {};
    
    for (const shot of blueprint.shots) {
      if (shot.visualSource === "generated_video" && shot.videoPrompt) {
        console.log(`Generating video for shot ${shot.shotId}...`);
        try {
          const shotDuration = shot.timeEnd - shot.timeStart;
          const { url, cost } = await runReplicate(
            "minimax/video-01",
            shot.videoPrompt,
            { lengthSeconds: Math.ceil(shotDuration), aspectRatio: "9:16" }
          );
          
          // Download and upload to Supabase
          const videoResp = await fetch(url);
          if (videoResp.ok) {
            const videoBuffer = Buffer.from(await videoResp.arrayBuffer());
            const videoStoragePath = getStoragePath(brandKey, "video", jobId, `shot-${shot.shotId}.mp4`);
            await supabase.storage.from(STORAGE_BUCKET).upload(videoStoragePath, videoBuffer, {
              contentType: "video/mp4",
              upsert: true,
            });
            const { data: videoUrlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(videoStoragePath);
            videosByShot[shot.shotId] = videoUrlData.publicUrl;
            totalCost += cost ?? 0;
            console.log(`Shot ${shot.shotId} video generated, cost: $${(cost ?? 0).toFixed(4)}`);
          }
        } catch (err) {
          console.warn(`Video generation failed for shot ${shot.shotId}: ${err instanceof Error ? err.message : err}`);
        }
      }
    }
    
    if (Object.keys(videosByShot).length > 0) {
      assets.videosByShot = videosByShot;
    }
  }

  // Cleanup temp dir
  await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

  return { assets, totalCost };
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
      const blueprint = gen!.reel_blueprint as ExtendedBlueprint;
      const tmpPath = path.join(os.tmpdir(), `remotion-${jobId}.mp4`);
      try {
        // Generate audio/video assets based on reel type
        const { assets, totalCost: assetCost } = await generateReelAssets(
          blueprint,
          jobId,
          payload.brand_key
        );
        cost = assetCost > 0 ? assetCost : null;
        
        // Render with assets (ensure fps has a default)
        const blueprintWithDefaults = {
          ...blueprint,
          fps: blueprint.fps ?? 24,
        };
        await renderReelFromBlueprint(blueprintWithDefaults, tmpPath, assets);
        buffer = await fs.readFile(tmpPath);
        await fs.unlink(tmpPath).catch(() => {});
        usedRemotion = true;
        
        console.log(`Job ${jobId}: Remotion render complete, reelType=${blueprint.reelType ?? "text_overlay"}`);
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
