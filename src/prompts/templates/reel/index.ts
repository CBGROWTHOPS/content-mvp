import type { JobInput } from "../../../schema/job.js";
import { build as buildContrast } from "./contrast.js";

const REEL_CONSTRAINTS = "15-30s max, never 60+. Max 6 shots/15s, 8/30s. Each shot 2-4s. Hook < 2s. Every shot: onScreenText required. Music: high for lead gen, medium for awareness.";

/** Reel templates. Blueprint constraints: 15-30s, 6-8 shots, 2-4s/shot, hook < 2s. */
const templates: Record<string, (v: JobInput["variables"]) => string> = {
  contrast: buildContrast,
  question: (v) =>
    `${REEL_CONSTRAINTS}\n\nOPEN: Compelling question about ${String(v?.product ?? "the product")}.\nBODY: Show the answer visually.\nCTA: ${String(v?.cta ?? "Discover more")}`,
  pain_point: (v) =>
    `${REEL_CONSTRAINTS}\n\nPROBLEM: ${String(v?.pain ?? "Common frustration")}.\nSOLUTION: ${String(v?.product ?? "Your solution")}.\nCTA: ${String(v?.cta ?? "Try today")}`,
  statistic: (v) =>
    `${REEL_CONSTRAINTS}\n\nHOOK: ${String(v?.stat ?? "Surprising stat")}.\nPROOF: Visual demonstration.\nCTA: ${String(v?.cta ?? "Learn more")}`,
  story: (v) =>
    `${REEL_CONSTRAINTS}\n\nSETUP: ${String(v?.setup ?? "Before")}.\nTRANSFORMATION: ${String(v?.product ?? "After")}.\nCTA: ${String(v?.cta ?? "Your story next")}`,
};

export function build(hookType: string, variables: JobInput["variables"]): string {
  const fn = templates[hookType];
  if (!fn) {
    return buildContrast(variables);
  }
  return fn(variables);
}
