#!/usr/bin/env node
/**
 * Verify Remotion composition bundles successfully.
 * Run: node scripts/verify-remotion.mjs
 */
import path from "path";
import { fileURLToPath } from "url";
import { bundle } from "@remotion/bundler";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const entryPoint = path.join(rootDir, "remotion/index.tsx");

console.log("Bundling Remotion composition...");
const serveUrl = await bundle({
  entryPoint,
  rootDir,
});
console.log("Bundle OK:", serveUrl);
