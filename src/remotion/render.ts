/**
 * Remotion-based deterministic video renderer.
 * Consumes ReelBlueprint and produces MP4 — no AI model, full control.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** ReelBlueprint shape from generations.reel_blueprint */
export interface ReelBlueprintInput {
  format: string;
  reelType?: "text_overlay" | "voiceover" | "broll" | "talking_head";
  durationSeconds: number;
  fps: number;
  voiceoverScript?: {
    fullScript: string;
    segments?: Array<{
      shotId: string;
      text: string;
      emotion?: string;
    }>;
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
    onScreenText?: { text: string; position?: string; animationRules?: string };
    [key: string]: unknown;
  }>;
  endFrame?: {
    headline?: string;
    cta?: string;
    brandName?: string;
  };
  [key: string]: unknown;
}

/** Pre-generated assets for rendering */
export interface ReelAssetsInput {
  voiceoverUrl?: string;
  musicUrl?: string;
  videosByShot?: Record<string, string>;
}

let cachedBundleLocation: string | null = null;

async function getBundle(): Promise<string> {
  if (cachedBundleLocation) return cachedBundleLocation;
  const rootDir = path.resolve(__dirname, "../..");
  const entryPoint = path.join(rootDir, "remotion/index.tsx");
  cachedBundleLocation = await bundle({
    entryPoint,
    rootDir,
    webpackOverride: (config) => config,
  });
  return cachedBundleLocation;
}

export interface RenderOptions {
  debugMode?: boolean;
  debugOutputDir?: string;
}

export interface DebugFrameResult {
  shotId: string;
  framePath: string;
  frameNumber: number;
  hasContent: boolean;
}

/**
 * Render a video from ReelBlueprint to an MP4 file.
 * Uses Remotion (deterministic renderer), not an AI model.
 * Optionally accepts pre-generated assets (voiceover, music, video clips).
 * 
 * @param blueprint - The reel blueprint with shots
 * @param outputPath - Where to save the final MP4
 * @param assets - Pre-generated assets (voiceover, music, video clips)
 * @param options - Render options including debug mode
 */
export async function renderReelFromBlueprint(
  blueprint: ReelBlueprintInput,
  outputPath: string,
  assets?: ReelAssetsInput,
  options?: RenderOptions
): Promise<void> {
  const serveUrl = await getBundle();
  const inputProps = { blueprint, assets: assets ?? {} };

  const composition = await selectComposition({
    serveUrl,
    id: "ReelFromBlueprint",
    inputProps,
  });

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outputPath,
    inputProps,
  });

  if (options?.debugMode && options.debugOutputDir) {
    console.log(`Debug mode: dumping frames to ${options.debugOutputDir}`);
    await dumpDebugFrames(blueprint, outputPath, options.debugOutputDir);
  }
}

/**
 * Debug helper: Extract one frame per shot from the rendered video.
 * Saves PNG files to help diagnose blank/missing content issues.
 */
async function dumpDebugFrames(
  blueprint: ReelBlueprintInput,
  videoPath: string,
  outputDir: string
): Promise<DebugFrameResult[]> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const { mkdir, stat } = await import("fs/promises");
  const execAsync = promisify(exec);

  await mkdir(outputDir, { recursive: true });

  const results: DebugFrameResult[] = [];
  const fps = blueprint.fps || 24;

  for (const shot of blueprint.shots) {
    const midTime = (shot.timeStart + shot.timeEnd) / 2;
    const framePath = path.join(outputDir, `shot-${shot.shotId}-frame.png`);
    
    try {
      const cmd = `ffmpeg -y -ss ${midTime} -i "${videoPath}" -vframes 1 -q:v 2 "${framePath}"`;
      await execAsync(cmd, { timeout: 10000 });
      
      const stats = await stat(framePath).catch(() => null);
      const hasContent = (stats?.size ?? 0) > 1000;
      
      results.push({
        shotId: shot.shotId,
        framePath,
        frameNumber: Math.floor(midTime * fps),
        hasContent,
      });
      
      console.log(`Debug frame: shot ${shot.shotId} @ ${midTime}s -> ${hasContent ? "OK" : "POSSIBLY BLANK"} (${stats?.size ?? 0} bytes)`);
    } catch (err) {
      console.warn(`Failed to extract frame for shot ${shot.shotId}: ${err}`);
      results.push({
        shotId: shot.shotId,
        framePath,
        frameNumber: Math.floor(midTime * fps),
        hasContent: false,
      });
    }
  }

  return results;
}

/**
 * Standalone debug function to analyze an existing video.
 * Call this to diagnose blank video issues without re-rendering.
 */
export async function analyzeVideoFrames(
  videoPath: string,
  outputDir: string,
  timePoints: number[]
): Promise<Array<{ time: number; framePath: string; size: number }>> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const { mkdir, stat } = await import("fs/promises");
  const execAsync = promisify(exec);

  await mkdir(outputDir, { recursive: true });

  const results: Array<{ time: number; framePath: string; size: number }> = [];

  for (let i = 0; i < timePoints.length; i++) {
    const time = timePoints[i];
    const framePath = path.join(outputDir, `frame-${i}-at-${time}s.png`);
    
    try {
      const cmd = `ffmpeg -y -ss ${time} -i "${videoPath}" -vframes 1 -q:v 2 "${framePath}"`;
      await execAsync(cmd, { timeout: 10000 });
      
      const stats = await stat(framePath).catch(() => null);
      results.push({
        time,
        framePath,
        size: stats?.size ?? 0,
      });
      
      console.log(`Frame @ ${time}s: ${stats?.size ?? 0} bytes`);
    } catch (err) {
      console.warn(`Failed to extract frame at ${time}s: ${err}`);
      results.push({ time, framePath, size: 0 });
    }
  }

  return results;
}
