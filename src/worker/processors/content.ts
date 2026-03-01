import type { Job } from "bullmq";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildPrompt } from "../../core/prompts.js";
import { runReplicate } from "../../lib/replicate.js";
import { renderReelFromBlueprint, type ReelAssetsInput } from "../../remotion/render.js";
import { supabase, STORAGE_BUCKET, getStoragePath } from "../../lib/supabase.js";
import { generateVoiceoverToFile, VOICE_PRESETS } from "../../lib/elevenlabs.js";
import { getMusicForReel } from "../../lib/musicLibrary.js";
import { 
  validateBlueprint, 
  validateShotAsset, 
  getRulesFromBrief,
  validateShotContractGateA,
  validateGeneratedVideoAsset,
  type ShotForValidation,
  type GateAResult,
} from "../../lib/assetValidation.js";
import type { CompactCreativeBrief } from "../../lib/compactBrief.js";
import type { QueueJobPayload } from "../../types/index.js";

const BLUEPRINT_FORMATS = ["reel_kit", "wide_video_kit"] as const;

type ProgressStep = 
  | "queued" 
  | "processing" 
  | "validating_contract"
  | "generating_voiceover" 
  | "generating_music" 
  | "generating_video" 
  | "validating_assets"
  | "rendering" 
  | "uploading" 
  | "completed";

async function updateProgress(jobId: string, step: ProgressStep): Promise<void> {
  await supabase
    .from("jobs")
    .update({ progress_step: step, updated_at: new Date().toISOString() })
    .eq("id", jobId);
}

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
 * Validates shots against brief rules before and after generation.
 * 
 * GATE A: Pre-generation contract validation (fails fast)
 * GATE B: Post-generation asset validation (validates actual video)
 */
async function generateReelAssets(
  blueprint: ExtendedBlueprint,
  jobId: string,
  brandKey: string,
  brief?: CompactCreativeBrief
): Promise<{ assets: ReelAssetsInput; totalCost: number }> {
  const rules = getRulesFromBrief(brief);
  const reelType = blueprint.reelType ?? "voiceover";
  
  // =========================================================================
  // GATE A: Pre-Generation Contract Validation
  // Fails fast if shots are missing required fields
  // =========================================================================
  await updateProgress(jobId, "validating_contract");
  
  const shotsForValidation: ShotForValidation[] = blueprint.shots.map(shot => ({
    shotId: shot.shotId,
    visualSource: shot.visualSource,
    onScreenText: shot.onScreenText,
    videoPrompt: shot.videoPrompt,
    sceneDescription: shot.sceneDescription,
    timeStart: shot.timeStart,
    timeEnd: shot.timeEnd,
  }));
  
  const gateA: GateAResult = validateShotContractGateA(shotsForValidation, {
    requireVideoPrompt: reelType === "broll",
    requireDuration: true,
    requireOnScreenText: true,
    requireSceneDescription: true,
  });
  
  if (!gateA.pass) {
    const failureDetails = gateA.failures.map(f => `${f.shotId}:${f.field}`).join(",");
    console.log(`GATE_A fail shots=${failureDetails}`);
    throw new Error(`Shot contract validation failed: ${gateA.failures.map(f => f.reason).join("; ")}`);
  }
  console.log(`GATE_A pass shots=${blueprint.shots.length}`);
  
  const blueprintValidation = validateBlueprint(
    blueprint.shots as ShotForValidation[],
    brief
  );
  
  if (!blueprintValidation.pass) {
    console.log(`blueprint_warn: ${blueprintValidation.failures.length} issues`);
  }
  const assets: ReelAssetsInput = {};
  let totalCost = 0;
  const tmpDir = path.join(os.tmpdir(), `reel-assets-${jobId}`);
  await fs.mkdir(tmpDir, { recursive: true });

  // Generate voiceover for voiceover and broll reels
  if (reelType === "voiceover" || reelType === "broll") {
    // Get voiceover script - use provided script or generate from on-screen text
    let voiceoverText = blueprint.voiceoverScript?.fullScript;
    
    if (!voiceoverText) {
      // Fallback: concatenate on-screen text from shots
      const textParts = blueprint.shots
        .map(shot => shot.onScreenText?.text)
        .filter(Boolean);
      if (textParts.length > 0) {
        voiceoverText = textParts.join(". ");
      }
    }
    
    if (voiceoverText) {
      await updateProgress(jobId, "generating_voiceover");
      try {
        const voPath = path.join(tmpDir, "voiceover.mp3");
        const result = await generateVoiceoverToFile(
          voiceoverText,
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
      } catch (err) {
        console.log(`voiceover_error: ${(err instanceof Error ? err.message : String(err)).slice(0, 60)}`);
      }
    }
  }

  // Get music - tries library first, falls back to AI generation (MusicGen)
  // ALWAYS generate music unless explicitly text_overlay with no audio needed
  await updateProgress(jobId, "generating_music");
  const musicMood = blueprint.musicTrack?.mood ?? "warm";
  const musicTempo = blueprint.musicTrack?.tempo ?? "medium";
  const musicGenre = blueprint.musicTrack?.genre ?? "ambient";
  
  try {
    const musicResult = await getMusicForReel({
      mood: musicMood,
      tempo: musicTempo,
      genre: musicGenre,
      minDurationSeconds: blueprint.durationSeconds,
      generateIfMissing: true,
      brandContext: brandKey,
    });
    
    if (musicResult.source === "library" && musicResult.filePath) {
      // Upload pre-licensed track from library
      const musicBuffer = await fs.readFile(musicResult.filePath);
      const musicStoragePath = getStoragePath(brandKey, "audio", jobId, `music-library.mp3`);
      await supabase.storage.from(STORAGE_BUCKET).upload(musicStoragePath, musicBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });
      const { data: musicUrlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(musicStoragePath);
      assets.musicUrl = musicUrlData.publicUrl;
    } else if (musicResult.source === "generated" && musicResult.audioUrl) {
      // Download AI-generated music and upload to Supabase
      const response = await fetch(musicResult.audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to download music: ${response.status}`);
      }
      const musicBuffer = Buffer.from(await response.arrayBuffer());
      const musicStoragePath = getStoragePath(brandKey, "audio", jobId, `music-generated.mp3`);
      await supabase.storage.from(STORAGE_BUCKET).upload(musicStoragePath, musicBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });
      const { data: musicUrlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(musicStoragePath);
      assets.musicUrl = musicUrlData.publicUrl;
      totalCost += musicResult.cost;
    }
  } catch (err) {
    console.log(`music_error: ${(err instanceof Error ? err.message : String(err)).slice(0, 60)}`);
  }

  // Generate video for ANY shots with visualSource=generated_video
  const shotsNeedingVideo = blueprint.shots.filter(shot => shot.visualSource === "generated_video" && shot.videoPrompt);
  
  if (shotsNeedingVideo.length > 0) {
    await updateProgress(jobId, "generating_video");
    const videosByShot: Record<string, string> = {};
    
    for (const shot of shotsNeedingVideo) {
      const maxRetries = 2;
      let lastError: string | undefined;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const shotDuration = shot.timeEnd - shot.timeStart;
          const prompt = attempt > 1
            ? `${shot.videoPrompt!}. MUST be real video footage, cinematic, no abstract or blank backgrounds.`
            : shot.videoPrompt!;
          
          const { url, cost } = await runReplicate(
            "minimax/video-01",
            prompt,
            { lengthSeconds: Math.ceil(shotDuration), aspectRatio: "9:16" }
          );
          
          const videoResp = await fetch(url);
          if (!videoResp.ok) throw new Error(`fetch_failed:${videoResp.status}`);
          
          const contentType = videoResp.headers.get("content-type");
          const validation = validateShotAsset(shot as ShotForValidation, url, contentType, rules);
          
          if (!validation.pass && validation.canRetry && attempt < maxRetries) {
            lastError = validation.reason;
            continue;
          }
          
          const videoBuffer = Buffer.from(await videoResp.arrayBuffer());
          const localVideoPath = path.join(tmpDir, `shot-${shot.shotId}.mp4`);
          await fs.writeFile(localVideoPath, videoBuffer);
          
          const fileSizeMB = (videoBuffer.length / 1024 / 1024).toFixed(1);
          const expectedDuration = shot.timeEnd - shot.timeStart;
          const gateBResult = await validateGeneratedVideoAsset(shot.shotId, localVideoPath, expectedDuration);
          
          if (!gateBResult.overallPass) {
            const reason = gateBResult.gateB.reason ?? "unknown";
            console.log(`GATE_B fail ${shot.shotId} attempt=${attempt} size=${fileSizeMB}MB reason=${reason}`);
            if (attempt < maxRetries) {
              lastError = reason;
              continue;
            }
            break;
          }
          
          const { duration, codec } = gateBResult.gateB.probe;
          console.log(`GATE_B pass ${shot.shotId} attempt=${attempt} dur=${duration.toFixed(2)}s codec=${codec} size=${fileSizeMB}MB`);
          
          const videoStoragePath = getStoragePath(brandKey, "video", jobId, `shot-${shot.shotId}.mp4`);
          await supabase.storage.from(STORAGE_BUCKET).upload(videoStoragePath, videoBuffer, {
            contentType: "video/mp4",
            upsert: true,
          });
          const { data: videoUrlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(videoStoragePath);
          
          videosByShot[shot.shotId] = videoUrlData.publicUrl;
          totalCost += cost ?? 0;
          break;
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
          if (attempt >= maxRetries) {
            console.log(`GATE_B fail ${shot.shotId} attempt=${attempt} reason=${lastError.slice(0, 80)}`);
          }
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
      .update({ status: "processing", progress_step: "processing", updated_at: new Date().toISOString() })
      .eq("id", jobId);
    
    console.log(`JOB processing id=${jobId.slice(0, 8)} format=${payload.format} brand=${payload.brand_key}`);

    let enrichedPayload = payload;
    const genId = (payload as { generation_id?: string }).generation_id;
    type GenRow = {
      marketing_output?: { headline?: string; primaryText?: string; cta?: string } | null;
      reel_blueprint?: { shots?: { sceneDescription?: string }[]; durationSeconds?: number } | null;
      compact_brief?: CompactCreativeBrief | null;
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
      // Prefer brief from payload (preset/cache), fall back to generation record
      const brief = (payload as { compact_brief?: CompactCreativeBrief }).compact_brief 
        ?? gen!.compact_brief 
        ?? undefined;
      const briefKey = (payload as { brief_key?: string }).brief_key;
      const tmpPath = path.join(os.tmpdir(), `remotion-${jobId}.mp4`);
      try {
        // Generate audio/video assets based on reel type with validation
        const { assets, totalCost: assetCost } = await generateReelAssets(
          blueprint,
          jobId,
          payload.brand_key,
          brief
        );
        cost = assetCost > 0 ? assetCost : null;
        
        // Render with assets (ensure fps has a default)
        await updateProgress(jobId, "rendering");
        const blueprintWithDefaults = {
          ...blueprint,
          fps: blueprint.fps ?? 24,
        };
        await renderReelFromBlueprint(blueprintWithDefaults, tmpPath, assets);
        buffer = await fs.readFile(tmpPath);
        await fs.unlink(tmpPath).catch(() => {});
        usedRemotion = true;
      } catch (remotionErr) {
        const errMsg = remotionErr instanceof Error ? remotionErr.message : String(remotionErr);
        console.log(`render_fallback: ${errMsg.slice(0, 60)}`);
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

    await updateProgress(jobId, "uploading");
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

    const { error: statusError } = await supabase
      .from("jobs")
      .update({
        status: "completed",
        progress_step: "completed",
        cost: cost ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (statusError) {
      console.log(`JOB error id=${jobId.slice(0, 8)} status_update_failed`);
    } else {
      const sizeMB = buffer ? (buffer.length / 1024 / 1024).toFixed(1) : "0";
      console.log(`JOB complete id=${jobId.slice(0, 8)} size=${sizeMB}MB dur=${durationSeconds ?? 0}s cost=$${(cost ?? 0).toFixed(3)}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`JOB failed id=${jobId.slice(0, 8)} error=${message.slice(0, 80)}`);

    await supabase
      .from("jobs")
      .update({
        status: "failed",
        progress_step: "failed",
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    throw err;
  }
}
