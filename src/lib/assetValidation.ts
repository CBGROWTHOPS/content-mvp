/**
 * Asset Validation - Enforces hard mandatory rules for creative output.
 * Two gates: Gate A (pre-generation) and Gate B (post-generation).
 * Rejects assets that don't meet quality and consistency standards.
 */
import { CompactCreativeBrief } from "./compactBrief.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface MandatoryRules {
  mustHaveVideoUrl: boolean;
  rejectImageOutputs: boolean;
  rejectBlankFrames: boolean;
  requireOnScreenText: boolean;
}

export const DEFAULT_MANDATORY_RULES: MandatoryRules = {
  mustHaveVideoUrl: true,
  rejectImageOutputs: true,
  rejectBlankFrames: true,
  requireOnScreenText: true,
};

export interface ShotForValidation {
  shotId: string;
  visualSource?: string;
  onScreenText?: { text?: string };
  videoPrompt?: string;
  sceneVideoUrl?: string;
  sceneDescription?: string;
  timeStart?: number;
  timeEnd?: number;
}

export interface ShotContractRequirements {
  requireVideoPrompt: boolean;
  requireDuration: boolean;
  requireOnScreenText: boolean;
  requireSceneDescription: boolean;
}

export interface ValidationResult {
  pass: boolean;
  reason?: string;
  canRetry: boolean;
  shotId?: string;
}

function parseRulesFromBrief(briefRules: string[]): Partial<MandatoryRules> {
  const parsed: Partial<MandatoryRules> = {};
  
  for (const rule of briefRules) {
    const lower = rule.toLowerCase();
    if (lower.includes("real video") || lower.includes("must have video")) {
      parsed.mustHaveVideoUrl = true;
    }
    if (lower.includes("no blank") || lower.includes("no solid color")) {
      parsed.rejectBlankFrames = true;
    }
    if (lower.includes("text every shot") || lower.includes("require text")) {
      parsed.requireOnScreenText = true;
    }
    if (lower.includes("no image") || lower.includes("video only")) {
      parsed.rejectImageOutputs = true;
    }
  }
  
  return parsed;
}

export function getRulesFromBrief(brief?: CompactCreativeBrief): MandatoryRules {
  if (!brief) {
    return DEFAULT_MANDATORY_RULES;
  }
  
  const parsedRules = parseRulesFromBrief(brief.rules);
  return {
    ...DEFAULT_MANDATORY_RULES,
    ...parsedRules,
  };
}

export function validateShotBeforeGeneration(
  shot: ShotForValidation,
  rules: MandatoryRules
): ValidationResult {
  if (rules.requireOnScreenText) {
    const hasText = shot.onScreenText?.text && shot.onScreenText.text.trim().length > 0;
    if (!hasText) {
      return {
        pass: false,
        reason: `Shot ${shot.shotId} missing required onScreenText`,
        canRetry: false,
        shotId: shot.shotId,
      };
    }
  }

  if (rules.mustHaveVideoUrl && shot.visualSource === "solid_bg") {
    return {
      pass: false,
      reason: `Shot ${shot.shotId} uses solid_bg but rules require real video`,
      canRetry: true,
      shotId: shot.shotId,
    };
  }

  return { pass: true, canRetry: false };
}

export function validateShotAsset(
  shot: ShotForValidation,
  assetUrl: string | null,
  contentType: string | null,
  rules: MandatoryRules
): ValidationResult {
  if (rules.mustHaveVideoUrl && !assetUrl) {
    return {
      pass: false,
      reason: `Shot ${shot.shotId} missing video URL`,
      canRetry: true,
      shotId: shot.shotId,
    };
  }

  if (rules.rejectImageOutputs && contentType) {
    if (contentType.startsWith("image/")) {
      return {
        pass: false,
        reason: `Shot ${shot.shotId} returned image instead of video`,
        canRetry: true,
        shotId: shot.shotId,
      };
    }
  }

  if (rules.requireOnScreenText) {
    const hasText = shot.onScreenText?.text && shot.onScreenText.text.trim().length > 0;
    if (!hasText) {
      return {
        pass: false,
        reason: `Shot ${shot.shotId} missing required onScreenText`,
        canRetry: false,
        shotId: shot.shotId,
      };
    }
  }

  return { pass: true, canRetry: false };
}

export interface BlueprintValidationResult {
  pass: boolean;
  failures: ValidationResult[];
}

export function validateBlueprint(
  shots: ShotForValidation[],
  brief?: CompactCreativeBrief
): BlueprintValidationResult {
  const rules = getRulesFromBrief(brief);
  const failures: ValidationResult[] = [];

  for (const shot of shots) {
    const result = validateShotBeforeGeneration(shot, rules);
    if (!result.pass) {
      failures.push(result);
    }
  }

  return {
    pass: failures.length === 0,
    failures,
  };
}

export function validateGeneratedAssets(
  shots: Array<ShotForValidation & { generatedUrl?: string; generatedContentType?: string }>,
  brief?: CompactCreativeBrief
): BlueprintValidationResult {
  const rules = getRulesFromBrief(brief);
  const failures: ValidationResult[] = [];

  for (const shot of shots) {
    const result = validateShotAsset(
      shot,
      shot.generatedUrl ?? null,
      shot.generatedContentType ?? null,
      rules
    );
    if (!result.pass) {
      failures.push(result);
    }
  }

  return {
    pass: failures.length === 0,
    failures,
  };
}

// ============================================================================
// GATE A: Pre-Generation Shot Contract Validation
// Called BEFORE calling Replicate - fails fast if contract is incomplete
// ============================================================================

export const DEFAULT_SHOT_CONTRACT: ShotContractRequirements = {
  requireVideoPrompt: true,
  requireDuration: true,
  requireOnScreenText: true,
  requireSceneDescription: true,
};

export interface GateAResult {
  pass: boolean;
  failures: Array<{
    shotId: string;
    field: string;
    reason: string;
  }>;
}

export function validateShotContractGateA(
  shots: ShotForValidation[],
  requirements: ShotContractRequirements = DEFAULT_SHOT_CONTRACT
): GateAResult {
  const failures: GateAResult["failures"] = [];

  for (const shot of shots) {
    if (requirements.requireVideoPrompt) {
      if (!shot.videoPrompt || shot.videoPrompt.trim().length < 10) {
        failures.push({
          shotId: shot.shotId,
          field: "videoPrompt",
          reason: `Shot ${shot.shotId}: videoPrompt missing or too short (min 10 chars)`,
        });
      }
    }

    if (requirements.requireDuration) {
      const start = shot.timeStart ?? 0;
      const end = shot.timeEnd ?? 0;
      const duration = end - start;
      if (duration <= 0 || duration > 60) {
        failures.push({
          shotId: shot.shotId,
          field: "duration",
          reason: `Shot ${shot.shotId}: invalid duration (${duration}s), must be 0-60s`,
        });
      }
    }

    if (requirements.requireOnScreenText) {
      if (!shot.onScreenText?.text || shot.onScreenText.text.trim().length === 0) {
        failures.push({
          shotId: shot.shotId,
          field: "onScreenText",
          reason: `Shot ${shot.shotId}: onScreenText.text missing`,
        });
      }
    }

    if (requirements.requireSceneDescription) {
      if (!shot.sceneDescription || shot.sceneDescription.trim().length < 5) {
        failures.push({
          shotId: shot.shotId,
          field: "sceneDescription",
          reason: `Shot ${shot.shotId}: sceneDescription missing or too short`,
        });
      }
    }
  }

  return {
    pass: failures.length === 0,
    failures,
  };
}

// ============================================================================
// GATE B: Post-Generation Asset Validation with ffprobe
// Called AFTER Replicate returns - validates the actual video asset
// ============================================================================

export interface VideoProbeResult {
  hasVideoStream: boolean;
  hasFrames: boolean;
  duration: number;
  width: number;
  height: number;
  codec: string;
  error?: string;
}

export async function probeVideoFile(filePath: string): Promise<VideoProbeResult> {
  try {
    const cmd = `ffprobe -v error -print_format json -show_format -show_streams "${filePath}"`;
    const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });
    
    if (stderr) {
      console.log(`ffprobe stderr for ${filePath}: ${stderr}`);
    }
    
    const data = JSON.parse(stdout);

    const videoStream = data.streams?.find(
      (s: { codec_type?: string }) => s.codec_type === "video"
    );

    if (!videoStream) {
      return {
        hasVideoStream: false,
        hasFrames: false,
        duration: 0,
        width: 0,
        height: 0,
        codec: "",
        error: "No video stream found",
      };
    }

    const nbFrames = parseInt(videoStream.nb_frames ?? "0", 10);
    const duration = parseFloat(data.format?.duration ?? "0");

    return {
      hasVideoStream: true,
      hasFrames: nbFrames > 0 || duration > 0,
      duration,
      width: videoStream.width ?? 0,
      height: videoStream.height ?? 0,
      codec: videoStream.codec_name ?? "",
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`ffprobe error for ${filePath}: ${errorMsg}`);
    return {
      hasVideoStream: false,
      hasFrames: false,
      duration: 0,
      width: 0,
      height: 0,
      codec: "",
      error: errorMsg,
    };
  }
}

export async function probeVideoUrl(url: string): Promise<VideoProbeResult> {
  return probeVideoFile(url);
}

export interface GateBResult {
  pass: boolean;
  probe: VideoProbeResult;
  reason?: string;
}

export async function validateAssetGateB(
  assetUrlOrPath: string,
  expectedMinDuration: number = 1
): Promise<GateBResult> {
  const probe = await probeVideoFile(assetUrlOrPath);

  if (!probe.hasVideoStream) {
    return {
      pass: false,
      probe,
      reason: probe.error ?? "No video stream in asset",
    };
  }

  if (!probe.hasFrames) {
    return {
      pass: false,
      probe,
      reason: "Video has no frames (blank/corrupted)",
    };
  }

  if (probe.duration < expectedMinDuration) {
    return {
      pass: false,
      probe,
      reason: `Video duration ${probe.duration}s < expected ${expectedMinDuration}s`,
    };
  }

  return { pass: true, probe };
}

export interface FullAssetValidationResult {
  shotId: string;
  gateB: GateBResult;
  overallPass: boolean;
}

export async function validateGeneratedVideoAsset(
  shotId: string,
  assetUrl: string,
  expectedDuration: number
): Promise<FullAssetValidationResult> {
  const gateB = await validateAssetGateB(assetUrl, expectedDuration * 0.5);
  
  return {
    shotId,
    gateB,
    overallPass: gateB.pass,
  };
}
