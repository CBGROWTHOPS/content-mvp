/**
 * Viral Framework - Unified validation and prompt building.
 * Imports from modular components for clean separation.
 */

import type { CompactCreativeBrief } from "./compactBrief.js";
import type { IntentCategory, Beat } from "./beatFramework.js";
import { REQUIRED_BEATS_BY_INTENT } from "./beatFramework.js";
import { validateBeatCoverage, type BeatValidationResult } from "./beatValidation.js";
import { validatePacing, getPacingForDuration, type PacingValidationResult } from "./pacingRules.js";
import { validateEditRhythm, type RhythmValidationResult, type PatternInterrupt } from "./editRhythm.js";
import { resolveCtaMode, getCtaExample, type CtaMode } from "./ctaModes.js";
import { getCustomerProfile, type CustomerProfile } from "./customerProfiles.js";

// Re-export types for convenience
export type { IntentCategory, Beat, CtaMode, CustomerProfile };
export type { BeatValidationResult, PacingValidationResult, RhythmValidationResult };

// =============================================================================
// UNIFIED VALIDATION
// =============================================================================

export interface ShotForValidation {
  shotId: string;
  beat?: string;
  timeStart: number;
  timeEnd: number;
  interrupt?: PatternInterrupt;
  onScreenText?: { text?: string };
}

export interface ViralValidationResult {
  pass: boolean;
  beats: BeatValidationResult;
  pacing: PacingValidationResult;
  rhythm: RhythmValidationResult;
  issues: string[];
}

export function validateViralFramework(
  shots: ShotForValidation[],
  intentCategory: IntentCategory
): ViralValidationResult {
  const beats = validateBeatCoverage(intentCategory, shots);
  const pacing = validatePacing(intentCategory, shots);
  const totalSec = shots.length > 0 ? shots[shots.length - 1].timeEnd : 0;
  const rhythm = validateEditRhythm(intentCategory, shots, totalSec);

  const issues: string[] = [
    ...beats.missing.map(b => `missing:${b}`),
    ...pacing.issues,
    ...(rhythm.issue ? [rhythm.issue] : []),
  ];

  return {
    pass: beats.pass && pacing.pass,
    beats,
    pacing,
    rhythm,
    issues,
  };
}

// =============================================================================
// STORYBOARD PROMPT BUILDER (minimal tokens)
// =============================================================================

export interface StoryboardPromptInput {
  brief: CompactCreativeBrief;
  durationSeconds: number;
  customerProfileId?: string;
  ctaMode?: CtaMode;
  funnelStage?: string;
  contentIntent?: string;
}

export function buildViralStoryboardPrompt(input: StoryboardPromptInput): string {
  const { brief, durationSeconds, customerProfileId, ctaMode, funnelStage, contentIntent } = input;
  const intent = brief.intentCategory;
  const pacing = getPacingForDuration(Math.min(30, Math.max(15, durationSeconds)));
  const requiredBeats = REQUIRED_BEATS_BY_INTENT[intent];
  const resolvedCta = resolveCtaMode(intent, ctaMode);
  const ctaExample = getCtaExample(resolvedCta);
  const profile = getCustomerProfile(customerProfileId);

  // Music energy: upbeat for lead gen, medium for awareness/growth/education
  const musicEnergy = intent === "lead_gen" ? "upbeat" : "medium";

  // Minimal profile injection (only what's needed for hooks/scenes)
  const profileBlock = `Target: ${profile.label}
Pains: ${profile.pains.slice(0, 3).join(", ")}
Desires: ${profile.desires.slice(0, 2).join(", ")}
Objections: ${profile.objections[0]}
Environment: ${profile.environment}`;

  // Hard constraints - enforce to prevent 60s boring reels
  const constraintsBlock = `HARD CONSTRAINTS (non-negotiable):
- Total reel: 15-30 seconds MAX, NEVER 60+
- Max shots: ${pacing.maxShots} (6 for 15s, 8 for 30s)
- Each shot: 2-4 seconds, never more
- Hook (shot1): MUST be under 2 seconds, pattern interrupt
- Every shot MUST have onScreenText defined (max 6 words)
- Music tempo: ${musicEnergy} (lead_gen=upbeat, awareness=medium)

Beats: ${requiredBeats.join(", ")}, payoff (required)
CTA: ${resolvedCta} ("${ctaExample}")`;

  const funnelBlock =
    funnelStage || contentIntent
      ? `
## FUNNEL
${funnelStage ? `Stage: ${funnelStage} (tof=awareness/cold, mof=consideration/warm, bof=conversion/hot)` : ""}
${contentIntent ? `Intent: ${contentIntent}` : ""}
Adjust shot descriptions, energy, and CTA accordingly:
- TOF: softer hook, educate or entertain
- MOF: social proof, address objections
- BOF: urgency, clear CTA, outcome-focused
`
      : "";

  return `Generate Instagram Reel blueprint.

## INTENT: ${intent}
${profileBlock}
${funnelBlock}

## CONSTRAINTS
${constraintsBlock}

## BRIEF
Look: ${brief.look}
Camera: ${brief.camera}
Light: ${brief.light}
Text: ${brief.text}
Tone: ${brief.tone}

## PAYOFF BEAT
Must be visual outcome, not explanation.
Example: glare gone, soft light, motorized motion, premium interior.

## OUTPUT
{
  "shots": [{
    "shotId": "shot1",
    "beat": "${requiredBeats[0]}",
    "timeStart": 0,
    "timeEnd": 2,
    "shotType": "wide|medium|close",
    "cameraMovement": "string",
    "sceneDescription": "string",
    "visualSource": "generated_video|solid_bg",
    "videoPrompt": "include look, camera, light",
    "onScreenText": {"text": "max 6 words"}
  }],
  "voiceoverScript": {
    "fullScript": "string",
    "segments": [{"shotId": "shot1", "text": "string", "emotion": "string"}]
  },
  "musicTrack": {"mood": "string", "tempo": "${musicEnergy}"}
}`;
}

// =============================================================================
// LEGACY EXPORTS (for compatibility)
// =============================================================================

export const GLOBAL_VIRAL_RULES = {
  maxWordsPerFrame: 6,
  patternInterruptWindow: 1.5,
} as const;
