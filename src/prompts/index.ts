import type { JobInput } from "../schema/job.js";
import * as reelTemplates from "./templates/reel/index.js";

export function buildPrompt(format: string, hookType: string, variables: JobInput["variables"]): string {
  switch (format) {
    case "reel":
      return reelTemplates.build(hookType, variables);
    case "story":
    case "post":
      // Fallback to reel contrast for now; add story/post templates later
      return reelTemplates.build("contrast", variables);
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}
