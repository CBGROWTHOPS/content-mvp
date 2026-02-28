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

/**
 * Render a video from ReelBlueprint to an MP4 file.
 * Uses Remotion (deterministic renderer), not an AI model.
 * Optionally accepts pre-generated assets (voiceover, music, video clips).
 */
export async function renderReelFromBlueprint(
  blueprint: ReelBlueprintInput,
  outputPath: string,
  assets?: ReelAssetsInput
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
}
