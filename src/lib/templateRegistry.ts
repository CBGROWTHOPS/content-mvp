import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { pathToFileURL } from "url";
import type { BrandProfile } from "../core/types.js";
import { loadBrand } from "./brandRegistry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getBrandsDir(): string {
  const parent = join(__dirname, "..");
  const distBrands = join(parent, "brands");
  if (existsSync(distBrands)) return distBrands;
  return join(parent, "..", "brands");
}

/**
 * Hook type to template file mapping for kit formats.
 * reel_kit: contrast → contrast_6s, concept → concept, motorized_demo → motorized_demo
 * image_kit: contrast → contrast, default → default
 * wide_video_kit: default → showcase_12s
 */
const HOOK_TO_FILE: Record<string, Record<string, string>> = {
  image_kit: { contrast: "contrast", default: "default" },
  reel_kit: {
    contrast: "contrast_6s",
    concept: "concept",
    motorized_demo: "motorized_demo",
    default: "default",
  },
  wide_video_kit: { default: "showcase_12s" },
};

/**
 * Get template path. Resolution order:
 * 1. brands/<brand_key>/templates/<format>/<hook>.mjs
 * 2. brands/<brand_key>/templates/<format>/default.mjs
 * 3. fallback: use core generator (returns prompt from generic logic)
 */
export async function getTemplate(
  brandKey: string,
  format: string,
  hookType?: string
): Promise<((profile: BrandProfile, variables: Record<string, string | number | boolean>, options?: Record<string, unknown>) => Promise<string>) | null> {
  const brandsDir = getBrandsDir();
  const formatDir = join(brandsDir, brandKey, "templates", format);
  if (!existsSync(formatDir)) return null;

  const hookMap = HOOK_TO_FILE[format];
  const fileBase = hookMap?.[hookType ?? "default"] ?? hookMap?.default ?? "default";
  const candidatePath = join(formatDir, `${fileBase}.mjs`);
  const defaultPath = join(formatDir, "default.mjs");

  const pathToLoad = existsSync(candidatePath) ? candidatePath : existsSync(defaultPath) ? defaultPath : null;
  if (!pathToLoad) return null;

  try {
    const url = pathToFileURL(pathToLoad).href;
    const mod = await import(url);
    const build = mod.build;
    if (typeof build !== "function") return null;
    return async (profile, variables, options) => {
      const result = build(profile, variables, options);
      return typeof result === "string" ? result : String(result);
    };
  } catch {
    return null;
  }
}

/**
 * Run template for a kit format. Falls back to core generator if no brand template.
 */
export async function runTemplate(
  brandKey: string,
  format: string,
  hookType: string | undefined,
  variables: Record<string, string | number | boolean>,
  options?: Record<string, unknown>
): Promise<string> {
  const templateFn = await getTemplate(brandKey, format, hookType);
  if (templateFn) {
    const profile = loadBrand(brandKey);
    return templateFn(profile, variables, options);
  }
  return runFallbackTemplate(format, hookType, variables, brandKey, options);
}

/**
 * Fallback when brand has no template. Uses minimal generic logic.
 */
function runFallbackTemplate(
  format: string,
  hookType: string | undefined,
  variables: Record<string, string | number | boolean>,
  brandKey: string,
  options?: Record<string, unknown>
): string {
  const profile = loadBrand(brandKey);
  const headline = profile.positioning ?? "Premium quality.";
  const cta = profile.primary_cta ?? "Learn more";

  if (format === "image_kit") {
    const body = String(variables?.body ?? "Product in context.");
    return [
      "EDITORIAL PHOTOGRAPHY. Background image for overlay.",
      "Scene: " + body,
      "OVERLAY: HEADLINE: " + headline + " | CTA: " + cta,
      "Do not bake text into the image.",
    ].join("\n");
  }
  if (format === "reel_kit") {
    return [
      "REEL STRUCTURE - 6 second contrast. Static camera.",
      "Scene 1: Uncontrolled. Scene 2: Designed.",
      "End Frame: " + headline + " | " + cta,
    ].join("\n");
  }
  if (format === "wide_video_kit") {
    const theme = String(variables?.theme ?? "Design");
    return [
      "WIDE VIDEO - 16:9 editorial lookbook.",
      "Concept: " + theme + ". CTA: " + cta,
    ].join("\n");
  }
  return `Generate ${format} content. Headline: ${headline}. CTA: ${cta}.`;
}
