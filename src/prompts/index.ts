import type { JobInput } from "../schema/job.js";
import * as reelTemplates from "./templates/reel/index.js";
import * as imageTemplates from "./templates/image/index.js";

export function buildPrompt(format: string, hookType: string, variables: JobInput["variables"]): string {
  switch (format) {
    case "reel":
      return reelTemplates.build(hookType, variables);
    case "story":
    case "post":
      return reelTemplates.build("contrast", variables);
    case "image":
      return imageTemplates.build(variables);
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}
