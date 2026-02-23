import { runTemplate } from "../../lib/templateRegistry.js";
import type { JobInput } from "../../schema/job.js";

/**
 * Kit generator: load brand, pick template, run template to get prompt.
 * Generic - no brand language here.
 */
export async function generateKitPlan(payload: JobInput): Promise<string> {
  const brandKey = payload.brand_key;
  const format = payload.format;
  const hookType = payload.hook_type;
  const variables = payload.variables ?? {};
  const options: Record<string, unknown> = {};

  if (format === "image_kit" && variables.collection) {
    options.collection_key = variables.collection;
  }
  if (format === "wide_video_kit") {
    options.project_type = variables.project_type ?? "single-family";
  }
  if (format === "reel_kit" && (payload.hook_type === "concept" || payload.hook_type === "motorized_demo")) {
    // hook_type already passed
  }

  return runTemplate(brandKey, format, hookType, variables, options);
}
