import type { JobInput } from "../../../schema/job.js";
import { build as buildContrast } from "./contrast.js";

const templates: Record<string, (v: JobInput["variables"]) => string> = {
  contrast: buildContrast,
};

export function build(hookType: string, variables: JobInput["variables"]): string {
  const fn = templates[hookType];
  if (!fn) {
    throw new Error(`Unknown reel hook type: ${hookType}`);
  }
  return fn(variables);
}
