import type { JobInput } from "../../../schema/job.js";

const DURATION_CONSTRAINTS = [
  "TOTAL: 15-30 seconds max, NEVER 60+.",
  "MAX SHOTS: 6 for 15s reel, 8 for 30s reel.",
  "EACH SHOT: 2-4 seconds, never more.",
  "HOOK (shot 1): MUST be under 2 seconds, pattern interrupt.",
  "Every shot MUST have text_overlay / onScreenText defined.",
  "Music: high energy for lead gen, medium for awareness.",
].join(" ");

/**
 * Contrast hook template. Enforces blueprint constraints:
 * 15-30s total, 6/8 shots, 2-4s per shot, hook < 2s, onScreenText required.
 */
export function build(variables: JobInput["variables"]): string {
  const location = String(variables?.location ?? "luxury living space");
  const product = String(variables?.product ?? "premium product");
  const cta = String(variables?.cta ?? "Transform your space today");

  return [
    DURATION_CONSTRAINTS,
    ``,
    `SCENE 1 - UNCONTROLLED (hook, < 2s):`,
    `Raw, authentic footage of ${location} before intervention. Natural lighting, uncurated. Pattern interrupt.`,
    ``,
    `SCENE 2 - DESIGNED:`,
    `The same space reimagined with ${product}. Polished, aspirational, controlled.`,
    ``,
    `END FRAME CTA:`,
    cta,
  ].join("\n");
}
