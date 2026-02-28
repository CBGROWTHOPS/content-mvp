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
  durationSeconds: number;
  fps: number;
  shots: Array<{
    shotId: string;
    timeStart: number;
    timeEnd: number;
    shotType: string;
    cameraMovement: string;
    sceneDescription: string;
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
 */
export async function renderReelFromBlueprint(
  blueprint: ReelBlueprintInput,
  outputPath: string
): Promise<void> {
  const serveUrl = await getBundle();
  const inputProps = { blueprint };

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
