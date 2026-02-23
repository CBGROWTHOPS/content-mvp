import type { JobInput } from "../../../schema/job.js";
import { build as buildContrast } from "./contrast.js";

const templates: Record<string, (v: JobInput["variables"]) => string> = {
  contrast: buildContrast,
  question: (v) =>
    `OPEN: Compelling question about ${String(v?.product ?? "the product")}.\nBODY: Show the answer visually.\nCTA: ${String(v?.cta ?? "Discover more")}`,
  pain_point: (v) =>
    `PROBLEM: ${String(v?.pain ?? "Common frustration")}.\nSOLUTION: ${String(v?.product ?? "Your solution")}.\nCTA: ${String(v?.cta ?? "Try today")}`,
  statistic: (v) =>
    `HOOK: ${String(v?.stat ?? "Surprising stat")}.\nPROOF: Visual demonstration.\nCTA: ${String(v?.cta ?? "Learn more")}`,
  story: (v) =>
    `SETUP: ${String(v?.setup ?? "Before")}.\nTRANSFORMATION: ${String(v?.product ?? "After")}.\nCTA: ${String(v?.cta ?? "Your story next")}`,
};

export function build(hookType: string, variables: JobInput["variables"]): string {
  const fn = templates[hookType];
  if (!fn) {
    return buildContrast(variables);
  }
  return fn(variables);
}
