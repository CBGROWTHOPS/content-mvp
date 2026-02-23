/**
 * Core prompt builder - used when no brand template exists, or for non-kit formats.
 * Engine never contains brand language. Uses brandRegistry for any brand-specific strings.
 */
import { runTemplate } from "../lib/templateRegistry.js";
import * as reelTemplates from "../prompts/templates/reel/index.js";
import * as imageTemplates from "../prompts/templates/image/index.js";
import type { JobInput } from "../schema/job.js";

export async function buildPrompt(payload: JobInput): Promise<string> {
  const format = payload.format;
  const variables = payload.variables ?? {};
  const brandKey = payload.brand_key ?? (payload as { brand?: string }).brand ?? "default";

  switch (format) {
    case "reel":
      return reelTemplates.build(payload.hook_type ?? "contrast", variables);
    case "story":
    case "post":
      return reelTemplates.build("contrast", variables);
    case "image":
      return imageTemplates.build(variables);
    case "image_kit":
      return runTemplate(brandKey, "image_kit", payload.hook_type ?? "default", variables, {
        collection_key: variables.collection,
      });
    case "reel_kit":
      return runTemplate(brandKey, "reel_kit", payload.hook_type ?? "contrast", variables);
    case "wide_video_kit":
      return runTemplate(brandKey, "wide_video_kit", undefined, variables, {
        project_type: variables.project_type ?? "single-family",
      });
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}
