import type { JobInput } from "../schema/job.js";

export type PipelineStep =
  | { type: "image"; prompt: string }
  | { type: "video"; prompt: string }
  | { type: "kit_plan" };

/**
 * Router: format-based branching only. No brand-specific logic.
 * Returns pipeline description for the worker to execute.
 */
export function getPipeline(payload: JobInput): PipelineStep["type"] {
  const format = payload.format;
  if (format === "image") return "image";
  if (format === "image_kit") return "image"; // kit produces prompt for image
  if (format === "reel" || format === "story" || format === "post") return "video";
  if (format === "reel_kit" || format === "wide_video_kit") return "video"; // kit produces prompt for video
  return "image";
}
