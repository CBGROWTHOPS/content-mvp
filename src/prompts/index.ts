import type { JobInput } from "../schema/job.js";
import * as reelTemplates from "./templates/reel/index.js";
import * as imageTemplates from "./templates/image/index.js";
import * as imageKitTemplates from "./templates/image_kit/index.js";
import * as reelKitTemplates from "./templates/reel_kit/index.js";
import * as wideVideoKitTemplates from "./templates/wide_video_kit/index.js";

export function buildPrompt(
  format: string,
  hookType: string,
  variables: JobInput["variables"],
  payload?: Partial<JobInput>
): string {
  const brand = payload?.brand ?? "nablinds";

  switch (format) {
    case "reel":
      return reelTemplates.build(hookType, variables);
    case "story":
    case "post":
      return reelTemplates.build("contrast", variables);
    case "image":
      return imageTemplates.build(variables);
    case "image_kit":
      return imageKitTemplates.build(variables, brand, payload?.collection ?? null);
    case "reel_kit":
      return reelKitTemplates.build(
        variables,
        brand,
        (payload?.reel_kit_hook_type ?? "contrast") as "contrast" | "concept" | "motorized_demo"
      );
    case "wide_video_kit":
      return wideVideoKitTemplates.build(
        variables,
        brand,
        (payload?.wide_video_project_type ?? "single-family") as
          | "high-rise"
          | "single-family"
          | "townhouse"
      );
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}
