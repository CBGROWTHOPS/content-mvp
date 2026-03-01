/**
 * Viral Framework System - Intent-driven content with beat coverage (not rigid scripts).
 * Uses customer profiles for hook seeds without bloating prompts.
 */

import type { IntentCategory, CompactCreativeBrief } from "./compactBrief.js";
import { getProfile, getHookSeed, type CustomerProfile } from "./customerProfiles.js";

// =============================================================================
// CTA MODES
// =============================================================================

export type CtaMode = "engage" | "dm" | "link" | "follow" | "soft" | "book";

export const CTA_MODE_EXAMPLES: Record<CtaMode, string[]> = {
  engage: ["Save this", "Comment below", "Share with someone who needs this", "Double tap if you agree"],
  dm: ["DM 'START'", "DM me for access", "Send me a message", "Drop a 🔥 in DMs"],
  link: ["Link in bio", "Tap to shop", "Get yours now", "Claim your spot"],
  follow: ["Follow for more", "Follow for part 2", "Don't miss the next one"],
  soft: ["Learn more in bio", "We build systems like this", "This is what we do"],
  book: ["Book a call", "Schedule your demo", "Grab your slot", "Reserve your spot"],
};

export const INTENT_DEFAULT_CTA: Record<IntentCategory, CtaMode> = {
  growth: "engage",
  lead_gen: "dm",
  authority: "soft",
  education: "follow",
  conversion: "link",
};

// =============================================================================
// DYNAMIC PACING PER INTENT
// =============================================================================

export const INTENT_PACING: Record<IntentCategory, {
  maxDuration: number;
  minShots: number;
  maxShots: number;
  avgShotTarget: number;
}> = {
  growth: { maxDuration: 20, minShots: 4, maxShots: 6, avgShotTarget: 2.0 },
  lead_gen: { maxDuration: 20, minShots: 4, maxShots: 6, avgShotTarget: 2.5 },
  authority: { maxDuration: 20, minShots: 4, maxShots: 5, avgShotTarget: 2.5 },
  education: { maxDuration: 22, minShots: 4, maxShots: 6, avgShotTarget: 2.5 },
  conversion: { maxDuration: 18, minShots: 4, maxShots: 5, avgShotTarget: 2.0 },
};

export const GLOBAL_RULES = {
  patternInterruptWindow: 1.5,
  minShotDuration: 1.5,
  maxShotDuration: 3.0,
  maxWordsPerFrame: 6,
  patternInterruptsPerSeconds: 8, // at least 2 per 8 seconds
} as const;

// =============================================================================
// BEAT SYSTEM (not rigid shot order)
// =============================================================================

export type Beat = "hook" | "pain" | "mechanism" | "proof" | "payoff" | "cta";

export interface BeatRequirements {
  required: Beat[];
  optional: Beat[];
  minCoverage: number; // required.length - allowed missing
}

export const INTENT_BEATS: Record<IntentCategory, BeatRequirements> = {
  growth: {
    required: ["hook", "pain", "payoff", "cta"],
    optional: ["mechanism", "proof"],
    minCoverage: 4,
  },
  lead_gen: {
    required: ["hook", "pain", "mechanism", "payoff", "cta"],
    optional: ["proof"],
    minCoverage: 4,
  },
  authority: {
    required: ["hook", "mechanism", "proof", "payoff", "cta"],
    optional: ["pain"],
    minCoverage: 4,
  },
  education: {
    required: ["hook", "pain", "mechanism", "payoff", "cta"],
    optional: ["proof"],
    minCoverage: 4,
  },
  conversion: {
    required: ["hook", "pain", "mechanism", "proof", "payoff", "cta"],
    optional: [],
    minCoverage: 5,
  },
};

// =============================================================================
// HOOK PATTERNS (global, seeded by profile)
// =============================================================================

export type HookPattern = 
  | "expose_mistake"
  | "challenge_belief"
  | "reveal_result"
  | "callout_audience"
  | "quantify_outcome";

const HOOK_TRIGGERS: Record<HookPattern, string[]> = {
  expose_mistake: ["mistake", "wrong", "actually", "most people", "hidden", "secret"],
  challenge_belief: ["think", "believe", "myth", "lie", "truth is", "what if"],
  reveal_result: ["result", "happened", "discovered", "surprising", "changed"],
  callout_audience: ["if you're", "anyone who", "for those", "struggling with", "tired of"],
  quantify_outcome: ["in X days", "%", "doubled", "tripled", "went from", "saved", "made"],
};

export function detectHookPattern(text: string): HookPattern | null {
  const lower = text.toLowerCase();
  for (const [pattern, triggers] of Object.entries(HOOK_TRIGGERS)) {
    if (triggers.some(t => lower.includes(t))) {
      return pattern as HookPattern;
    }
  }
  return null;
}

// =============================================================================
// EDIT RHYTHM (pattern interrupts)
// =============================================================================

export type PatternInterruptType = "camera_change" | "scene_change" | "text_shift" | "sfx_hit";

export interface EditRhythmResult {
  pass: boolean;
  interruptCount: number;
  required: number;
  issue?: string;
}

export function validateEditRhythm(
  shots: Array<{ shotId: string; timeStart: number; timeEnd: number }>,
  totalDuration: number
): EditRhythmResult {
  const requiredInterrupts = Math.floor(totalDuration / GLOBAL_RULES.patternInterruptsPerSeconds) * 2;
  const interruptCount = shots.length - 1; // each cut is an interrupt
  
  if (interruptCount < requiredInterrupts) {
    return {
      pass: false,
      interruptCount,
      required: requiredInterrupts,
      issue: `Need ${requiredInterrupts} interrupts, have ${interruptCount}`,
    };
  }
  
  return { pass: true, interruptCount, required: requiredInterrupts };
}

// =============================================================================
// BEAT COVERAGE VALIDATION
// =============================================================================

export interface BeatCoverageResult {
  pass: boolean;
  covered: Beat[];
  missing: Beat[];
  hasPayoff: boolean;
  issue?: string;
}

export function validateBeatCoverage(
  shots: Array<{ purpose?: string; beat?: string }>,
  intentCategory: IntentCategory
): BeatCoverageResult {
  const requirements = INTENT_BEATS[intentCategory];
  const covered = new Set<Beat>();
  
  for (const shot of shots) {
    const beat = (shot.beat || shot.purpose) as Beat | undefined;
    if (beat) covered.add(beat);
  }
  
  const missing = requirements.required.filter(b => !covered.has(b));
  const hasPayoff = covered.has("payoff");
  
  // Allow dropping optional beats
  const criticalMissing = missing.filter(b => !requirements.optional.includes(b));
  const coverageCount = requirements.required.length - criticalMissing.length;
  
  if (coverageCount < requirements.minCoverage) {
    return {
      pass: false,
      covered: Array.from(covered),
      missing,
      hasPayoff,
      issue: `Coverage ${coverageCount}/${requirements.minCoverage}, missing: ${criticalMissing.join(",")}`,
    };
  }
  
  if (!hasPayoff) {
    return {
      pass: false,
      covered: Array.from(covered),
      missing,
      hasPayoff: false,
      issue: "Missing required payoff beat (visual outcome)",
    };
  }
  
  return { pass: true, covered: Array.from(covered), missing, hasPayoff: true };
}

// =============================================================================
// PACING VALIDATION
// =============================================================================

export interface ShotForPacing {
  shotId: string;
  purpose?: string;
  beat?: string;
  timeStart: number;
  timeEnd: number;
  onScreenText?: { text?: string };
}

export interface PacingResult {
  pass: boolean;
  issues: string[];
}

export function validatePacing(
  shots: ShotForPacing[],
  intentCategory: IntentCategory
): PacingResult {
  const issues: string[] = [];
  const pacing = INTENT_PACING[intentCategory];
  
  if (shots.length === 0) {
    return { pass: false, issues: ["No shots"] };
  }
  
  const totalDuration = shots[shots.length - 1].timeEnd;
  
  if (totalDuration > pacing.maxDuration) {
    issues.push(`Duration ${totalDuration}s > ${pacing.maxDuration}s max`);
  }
  
  const avgDuration = totalDuration / shots.length;
  if (avgDuration > 3) {
    issues.push(`Avg shot ${avgDuration.toFixed(1)}s > 3s`);
  }
  
  for (const shot of shots) {
    const dur = shot.timeEnd - shot.timeStart;
    if (dur > GLOBAL_RULES.maxShotDuration) {
      issues.push(`${shot.shotId}: ${dur}s > ${GLOBAL_RULES.maxShotDuration}s`);
    }
  }
  
  return { pass: issues.length === 0, issues };
}

// =============================================================================
// FULL VALIDATION
// =============================================================================

export interface ViralValidationResult {
  pass: boolean;
  pacing: PacingResult;
  beatCoverage: BeatCoverageResult;
  editRhythm: EditRhythmResult;
  hookPattern: HookPattern | null;
  issues: string[];
}

export function validateViralFramework(
  shots: ShotForPacing[],
  intentCategory: IntentCategory
): ViralValidationResult {
  const pacing = validatePacing(shots, intentCategory);
  const beatCoverage = validateBeatCoverage(shots, intentCategory);
  const totalDuration = shots.length > 0 ? shots[shots.length - 1].timeEnd : 0;
  const editRhythm = validateEditRhythm(shots, totalDuration);
  
  const hookShot = shots[0];
  const hookPattern = hookShot?.onScreenText?.text 
    ? detectHookPattern(hookShot.onScreenText.text) 
    : null;
  
  const issues = [
    ...pacing.issues,
    ...(beatCoverage.issue ? [beatCoverage.issue] : []),
    ...(editRhythm.issue ? [editRhythm.issue] : []),
  ];
  
  return {
    pass: pacing.pass && beatCoverage.pass,
    pacing,
    beatCoverage,
    editRhythm,
    hookPattern,
    issues,
  };
}

// =============================================================================
// STORYBOARD PROMPT BUILDER
// =============================================================================

export interface StoryboardPromptInput {
  brief: CompactCreativeBrief;
  durationSeconds: number;
  customerProfileId?: string;
  ctaMode?: CtaMode;
}

export function buildViralStoryboardPrompt(input: StoryboardPromptInput): string {
  const { brief, durationSeconds, customerProfileId, ctaMode } = input;
  const pacing = INTENT_PACING[brief.intentCategory];
  const beats = INTENT_BEATS[brief.intentCategory];
  const resolvedCtaMode = ctaMode || INTENT_DEFAULT_CTA[brief.intentCategory];
  const ctaExamples = CTA_MODE_EXAMPLES[resolvedCtaMode];
  
  // Load profile for hook seeds (minimal token injection)
  const profile = customerProfileId ? getProfile(customerProfileId) : null;
  const profileSection = profile ? `
## TARGET AUDIENCE
Label: ${profile.label}
Pains: ${profile.pains.slice(0, 3).join(", ")}
Desires: ${profile.desires.slice(0, 3).join(", ")}
Objections: ${profile.objections.slice(0, 2).join(", ")}
Proof: ${profile.proofAngles.slice(0, 2).join(", ")}
` : "";

  const hookSeeds = profile ? `
## HOOK SEEDS (use one)
- "${getHookSeed("callout_audience", profile)}"
- "${getHookSeed("expose_mistake", profile)}"
- "${getHookSeed("quantify_outcome", profile)}"
` : "";

  return `Generate Instagram Reel blueprint.

## INTENT: ${brief.intentCategory.toUpperCase()}
${profileSection}
## REQUIRED BEATS
${beats.required.map(b => `- ${b}`).join("\n")}
Optional: ${beats.optional.join(", ") || "none"}
Min coverage: ${beats.minCoverage} beats

IMPORTANT: "payoff" beat is REQUIRED. Show visual outcome, not explanation.
${hookSeeds}
## CTA MODE: ${resolvedCtaMode}
Examples: ${ctaExamples.slice(0, 2).join(", ")}

## PACING
Duration: ~${durationSeconds}s (max ${pacing.maxDuration}s)
Shots: ${pacing.minShots}-${pacing.maxShots}
Per shot: 1.5-3s
Max 6 words per frame

## CREATIVE BRIEF
Look: ${brief.look}
Camera: ${brief.camera}
Light: ${brief.light}
Text: ${brief.text}
Tone: ${brief.tone}

## OUTPUT JSON
{
  "shots": [{
    "shotId": "shot1",
    "beat": "hook | pain | mechanism | proof | payoff | cta",
    "timeStart": 0,
    "timeEnd": 2,
    "shotType": "wide | medium | close",
    "cameraMovement": "string",
    "sceneDescription": "string",
    "visualSource": "generated_video | solid_bg",
    "videoPrompt": "string - include look, camera, light",
    "onScreenText": { "text": "max 6 words" }
  }],
  "voiceoverScript": {
    "fullScript": "string",
    "segments": [{ "shotId": "string", "text": "string", "emotion": "string" }]
  },
  "musicTrack": { "mood": "string", "tempo": "slow | medium | upbeat" }
}`;
}

// Re-export for compatibility
export { GLOBAL_RULES as GLOBAL_VIRAL_RULES };
