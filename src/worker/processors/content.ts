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
  console.log(`Job ${jobId}: progress → ${step}`);
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
    const failureDetails = gateA.failures.map(f => f.reason).join("; ");
    console.error(`GATE A FAILED: ${failureDetails}`);
    throw new Error(`Shot contract validation failed: ${failureDetails}`);
  }
  console.log(`GATE A PASSED: All ${blueprint.shots.length} shots have valid contracts`);
  
  const blueprintValidation = validateBlueprint(
    blueprint.shots as ShotForValidation[],
    brief
  );
  
  if (!blueprintValidation.pass) {
    const failureMessages = blueprintValidation.failures
      .map(f => f.reason)
      .join("; ");
    console.warn(`Blueprint validation warnings: ${failureMessages}`);
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
        console.log(`No voiceover script provided, using on-screen text: "${voiceoverText.slice(0, 50)}..."`);
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
        console.log(`Voiceover generated: ${result.characterCount} chars, $${result.cost.toFixed(4)}`);
      } catch (err) {
        console.warn(`Voiceover generation failed: ${err instanceof Error ? err.message : err}`);
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
      console.log(`Library music uploaded (cost: $0)`);
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
      console.log(`AI music generated via MusicGen (cost: $${musicResult.cost.toFixed(3)})`);
    }
  } catch (err) {
    console.warn(`Music selection/generation failed: ${err instanceof Error ? err.message : err}`);
  }

  // Generate video for ANY shots with visualSource=generated_video (not just broll)
  const shotsNeedingVideo = blueprint.shots.filter(shot => shot.visualSource === "generated_video" && shot.videoPrompt);
  
  if (shotsNeedingVideo.length > 0) {
    console.log(`Video generation: ${shotsNeedingVideo.length} shots need video (reelType=${reelType})`);
    await updateProgress(jobId, "generating_video");
    const videosByShot: Record<string, string> = {};
    
    for (const shot of shotsNeedingVideo) {
      console.log(`Generating video for shot ${shot.shotId}...`);
        
        const maxRetries = 2;
        let lastError: string | undefined;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const shotDuration = shot.timeEnd - shot.timeStart;
            const strictMode = attempt > 0;
            const prompt = strictMode 
              ? `${shot.videoPrompt!}. MUST be real video footage, cinematic, no abstract or blank backgrounds.`
              : shot.videoPrompt!;
            
            const { url, cost } = await runReplicate(
              "minimax/video-01",
              prompt,
              { lengthSeconds: Math.ceil(shotDuration), aspectRatio: "9:16" }
            );
            
            const videoResp = await fetch(url);
            if (!videoResp.ok) {
              throw new Error(`Failed to fetch video: ${videoResp.status}`);
            }
            
            const contentType = videoResp.headers.get("content-type");
            const validation = validateShotAsset(
              shot as ShotForValidation,
              url,
              contentType,
              rules
            );
            
            if (!validation.pass) {
              if (validation.canRetry && attempt < maxRetries - 1) {
                console.warn(`Shot ${shot.shotId} failed validation (${validation.reason}), retrying with strict mode...`);
                lastError = validation.reason;
                continue;
              }
              console.warn(`Shot ${shot.shotId} failed validation: ${validation.reason}`);
            }
            
            const videoBuffer = Buffer.from(await videoResp.arrayBuffer());
            
            // =========================================================
            // GATE B: Pre-Upload Local File Validation (ffprobe)
            // Save to temp file, validate locally, then upload if valid
            // =========================================================
            const localVideoPath = path.join(tmpDir, `shot-${shot.shotId}.mp4`);
            await fs.writeFile(localVideoPath, videoBuffer);
            
            const fileSizeKB = Math.round(videoBuffer.length / 1024);
            console.log(`Shot ${shot.shotId}: downloaded ${fileSizeKB}KB, saved to ${localVideoPath}`);
            
            const expectedDuration = shot.timeEnd - shot.timeStart;
            const gateBResult = await validateGeneratedVideoAsset(
              shot.shotId,
              localVideoPath,
              expectedDuration
            );
            
            if (!gateBResult.overallPass) {
              console.warn(`GATE B FAILED for shot ${shot.shotId}: ${gateBResult.gateB.reason}`);
              if (attempt < maxRetries - 1) {
                lastError = `GATE B: ${gateBResult.gateB.reason}`;
                continue;
              }
              console.error(`GATE B: Shot ${shot.shotId} invalid after retries, skipping upload`);
              break;
            }
            
            console.log(`GATE B PASSED for shot ${shot.shotId}: ${gateBResult.gateB.probe.duration}s video, ${gateBResult.gateB.probe.codec}`);
            
            // Only upload if validation passed
            const videoStoragePath = getStoragePath(brandKey, "video", jobId, `shot-${shot.shotId}.mp4`);
            await supabase.storage.from(STORAGE_BUCKET).upload(videoStoragePath, videoBuffer, {
              contentType: "video/mp4",
              upsert: true,
            });
            const { data: videoUrlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(videoStoragePath);
            
            videosByShot[shot.shotId] = videoUrlData.publicUrl;
            totalCost += cost ?? 0;
            console.log(`Shot ${shot.shotId} video generated (attempt ${attempt + 1}), cost: $${(cost ?? 0).toFixed(4)}`);
            break;
          } catch (err) {
            lastError = err instanceof Error ? err.message : String(err);
            if (attempt < maxRetries - 1) {
              console.warn(`Shot ${shot.shotId} generation attempt ${attempt + 1} failed: ${lastError}, retrying...`);
            }
          }
        }
        
        if (!videosByShot[shot.shotId] && lastError) {
          console.warn(`Video generation failed for shot ${shot.shotId} after ${maxRetries} attempts: ${lastError}`);
        }
    }
    
    console.log(`Video generation complete: ${Object.keys(videosByShot).length} videos generated`);
    
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
      if (briefKey) {
        console.log(`Using compact brief from key: ${briefKey}`);
      }
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
        
        console.log(`Job ${jobId}: Remotion render complete, reelType=${blueprint.reelType ?? "voiceover"}`);
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
      console.error(`Job ${jobId}: Failed to update status to completed:`, statusError.message);
    } else {
      console.log(`Job ${jobId}: Status updated to completed`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Job ${jobId} failed:`, message);

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
