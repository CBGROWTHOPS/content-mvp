/**
 * Test Remotion render with a sample ReelBlueprint
 */
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const testBlueprint = {
  format: "reel_kit",
  durationSeconds: 6,
  fps: 24,
  shots: [
    {
      shotId: "1",
      timeStart: 0,
      timeEnd: 2,
      shotType: "wide",
      cameraMovement: "static",
      sceneDescription: "Harsh sunlight flooding through bare windows, overexposed",
      onScreenText: { text: "Uncontrolled" },
    },
    {
      shotId: "2",
      timeStart: 2,
      timeEnd: 4,
      shotType: "wide",
      cameraMovement: "slow_push",
      sceneDescription: "Same room with elegant solar shades, soft diffused light",
      onScreenText: { text: "Designed" },
    },
  ],
  endFrame: {
    headline: "Light. Controlled.",
    cta: "Schedule Design Consultation",
    brandName: "NA BLINDS",
  },
};

async function main() {
  console.log("Bundling Remotion composition...");
  const entryPoint = join(rootDir, "remotion/index.tsx");
  const serveUrl = await bundle({
    entryPoint,
    rootDir,
    webpackOverride: (config) => config,
  });
  console.log("Bundle OK");

  console.log("Selecting composition...");
  const composition = await selectComposition({
    serveUrl,
    id: "ReelFromBlueprint",
    inputProps: { blueprint: testBlueprint },
  });
  console.log(`Composition: ${composition.width}x${composition.height}, ${composition.durationInFrames} frames @ ${composition.fps}fps`);

  const outputPath = join(rootDir, "test-output.mp4");
  console.log(`Rendering to ${outputPath}...`);
  
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: { blueprint: testBlueprint },
    onProgress: ({ progress }) => {
      process.stdout.write(`\rProgress: ${Math.round(progress * 100)}%`);
    },
  });

  console.log("\n✓ Render complete!");
  const stats = fs.statSync(outputPath);
  console.log(`Output: ${outputPath} (${Math.round(stats.size / 1024)}KB)`);
}

main().catch((err) => {
  console.error("Render failed:", err);
  process.exit(1);
});
