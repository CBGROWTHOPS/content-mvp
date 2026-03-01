/**
 * Beat Validation - Check that required beats are covered.
 * Flexible: shots can be reordered, combined, and still pass if beats are covered.
 */

import { REQUIRED_BEATS_BY_INTENT, OPTIONAL_BEATS_BY_INTENT, type IntentCategory, type Beat } from "./beatFramework.js";

export interface BeatValidationResult {
  pass: boolean;
  missing: Beat[];
  present: Beat[];
  hasPayoff: boolean;
}

export function validateBeatCoverage(
  intent: IntentCategory,
  shots: Array<{ beat?: string }>
): BeatValidationResult {
  const present = new Set(shots.map(s => s.beat).filter(Boolean) as Beat[]);
  const required = REQUIRED_BEATS_BY_INTENT[intent];

  // Always require payoff beat globally
  const mustHave = new Set<Beat>([...required, "payoff"]);

  const missing = [...mustHave].filter(b => !present.has(b));

  // Allow optional beats to be missing without failing
  const optional = new Set((OPTIONAL_BEATS_BY_INTENT[intent] || []) as Beat[]);
  const hardMissing = missing.filter(b => !optional.has(b));

  return {
    pass: hardMissing.length === 0,
    missing: hardMissing,
    present: [...present],
    hasPayoff: present.has("payoff"),
  };
}

export function isPayoffVisual(sceneDescription: string): boolean {
  const visualKeywords = [
    "glare gone", "soft light", "smooth", "clean", "bright", "dark",
    "before", "after", "result", "transform", "motorized", "drop",
    "premium", "modern", "elegant", "minimal", "controlled",
  ];
  const lower = sceneDescription.toLowerCase();
  return visualKeywords.some(kw => lower.includes(kw));
}
