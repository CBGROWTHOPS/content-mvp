/**
 * Viral Framework System - Intent-driven content structure with TAM-style hooks.
 * Enforces global viral rules + category-specific frameworks.
 */

import type { IntentCategory, CompactCreativeBrief } from "./compactBrief.js";

// =============================================================================
// GLOBAL VIRAL FRAMEWORK (applies to ALL categories)
// =============================================================================

export const GLOBAL_VIRAL_RULES = {
  patternInterruptWindow: 1.5,
  minShotDuration: 1.5,
  maxShotDuration: 3.0,
  avgShotDurationTarget: 2.0,
  maxShots: 6,
  minShots: 4,
  maxTotalDuration: 20,
  maxWordsPerFrame: 6,
} as const;

export const GLOBAL_VIRAL_REQUIREMENTS = [
  "Pattern interrupt in first 1.5 seconds",
  "Super hook (TAM-style tension)",
  "Rapid pacing (1.5-2.5s per shot)",
  "Clear narrative arc",
  "Earned CTA",
] as const;

// =============================================================================
// TAM-STYLE SUPER HOOK PATTERNS
// =============================================================================

export type HookPattern = 
  | "expose_mistake"      // Expose hidden mistake
  | "challenge_belief"    // Challenge common belief  
  | "reveal_result"       // Reveal surprising result
  | "callout_audience"    // Call out specific audience
  | "quantify_outcome";   // Quantify outcome

export const HOOK_PATTERN_TRIGGERS: Record<HookPattern, string[]> = {
  expose_mistake: [
    "mistake", "wrong", "actually", "most people", "you're doing it wrong",
    "hidden", "secret", "nobody tells you", "the real reason",
  ],
  challenge_belief: [
    "think", "believe", "assume", "myth", "lie", "truth is",
    "what if", "contrary", "opposite", "not what you think",
  ],
  reveal_result: [
    "result", "outcome", "happened", "discovered", "found",
    "surprising", "unexpected", "shocking", "incredible", "changed",
  ],
  callout_audience: [
    "if you're", "anyone who", "for those", "struggling with",
    "tired of", "ready to", "want to", "need to",
  ],
  quantify_outcome: [
    "in X days", "X%", "doubled", "tripled", "went from",
    "increased", "decreased", "saved", "made", "earned",
  ],
};

export function detectHookPattern(hookText: string): HookPattern | null {
  const lower = hookText.toLowerCase();
  for (const [pattern, triggers] of Object.entries(HOOK_PATTERN_TRIGGERS)) {
    if (triggers.some(t => lower.includes(t))) {
      return pattern as HookPattern;
    }
  }
  return null;
}

export function isValidSuperHook(hookText: string): boolean {
  return detectHookPattern(hookText) !== null;
}

// =============================================================================
// CATEGORY-SPECIFIC FRAMEWORKS
// =============================================================================

export interface CategoryFramework {
  goal: string;
  structure: string[];
  ctaTypes: string[];
  tone: string[];
}

export const CATEGORY_FRAMEWORKS: Record<IntentCategory, CategoryFramework> = {
  growth: {
    goal: "reach + saves + shares",
    structure: [
      "Hook (relatable pain)",
      "Fast solution preview",
      "Proof flash",
      "Engagement CTA",
    ],
    ctaTypes: ["Save this", "Follow for part 2", "Comment your situation", "Share with someone"],
    tone: ["High energy", "Relatable", "Punchy"],
  },
  lead_gen: {
    goal: "DMs or opt-ins",
    structure: [
      "Hook (identify problem)",
      "Introduce mechanism",
      "Show transformation",
      "DM or link CTA",
    ],
    ctaTypes: ["DM keyword", "Book call", "Get audit", "Link in bio", "Comment for link"],
    tone: ["Confident", "Direct", "Outcome focused"],
  },
  authority: {
    goal: "positioning and trust",
    structure: [
      "Hook statement (strong POV)",
      "Evidence or framework",
      "Result proof",
      "Soft authority CTA",
    ],
    ctaTypes: ["We build systems like this", "This is infrastructure, not marketing", "Learn more in bio"],
    tone: ["Calm", "Controlled", "Credible"],
  },
  education: {
    goal: "teach while retaining attention",
    structure: [
      "Hook (myth or mistake)",
      "Breakdown explanation",
      "Quick example",
      "Save CTA",
    ],
    ctaTypes: ["Save for later", "Bookmark this", "Follow for more tips"],
    tone: ["Clear", "Fast", "Value dense"],
  },
  conversion: {
    goal: "push immediate action",
    structure: [
      "Hook pain",
      "Agitate",
      "Solution reveal",
      "Social proof",
      "Direct CTA",
    ],
    ctaTypes: ["Buy now", "Shop link in bio", "Limited time", "Get yours", "Claim offer"],
    tone: ["Urgent", "Outcome driven", "Emotionally charged"],
  },
};

// =============================================================================
// SHOT PURPOSE TYPES
// =============================================================================

export type ShotPurpose = 
  | "hook"           // Pattern interrupt + super hook
  | "problem"        // Pain/problem identification
  | "mechanism"      // Solution mechanism
  | "proof"          // Evidence/transformation
  | "cta";           // Call to action

export interface ShotRequirements {
  purpose: ShotPurpose;
  required: boolean;
  description: string;
}

export function getShotRequirements(intentCategory: IntentCategory): ShotRequirements[] {
  const framework = CATEGORY_FRAMEWORKS[intentCategory];
  const requirements: ShotRequirements[] = [
    { purpose: "hook", required: true, description: "Pattern interrupt + super hook" },
  ];
  
  for (let i = 1; i < framework.structure.length - 1; i++) {
    const step = framework.structure[i];
    let purpose: ShotPurpose = "mechanism";
    if (step.toLowerCase().includes("problem") || step.toLowerCase().includes("pain")) {
      purpose = "problem";
    } else if (step.toLowerCase().includes("proof") || step.toLowerCase().includes("result") || step.toLowerCase().includes("transform")) {
      purpose = "proof";
    }
    requirements.push({ purpose, required: false, description: step });
  }
  
  requirements.push({ purpose: "cta", required: true, description: "Category-aligned CTA" });
  
  return requirements;
}

// =============================================================================
// STORYBOARD PROMPT BUILDER
// =============================================================================

export function buildViralStoryboardPrompt(brief: CompactCreativeBrief, durationSeconds: number): string {
  const framework = CATEGORY_FRAMEWORKS[brief.intentCategory];
  const shotCount = Math.min(6, Math.max(4, Math.ceil(durationSeconds / 2.5)));
  
  return `You are generating a vertical Instagram Reel blueprint.

## GLOBAL VIRAL FRAMEWORK (MANDATORY)
${GLOBAL_VIRAL_REQUIREMENTS.map(r => `- ${r}`).join("\n")}

## HARD CONSTRAINTS
- Max ${GLOBAL_VIRAL_RULES.maxShots} shots
- Each shot: ${GLOBAL_VIRAL_RULES.minShotDuration}-${GLOBAL_VIRAL_RULES.maxShotDuration} seconds
- Max ${GLOBAL_VIRAL_RULES.maxWordsPerFrame} words per text frame
- Total duration: ~${durationSeconds}s (max ${GLOBAL_VIRAL_RULES.maxTotalDuration}s)
- Pattern interrupt MUST happen in first ${GLOBAL_VIRAL_RULES.patternInterruptWindow}s

## INTENT CATEGORY: ${brief.intentCategory.toUpperCase()}
Goal: ${framework.goal}

### Required Structure:
${framework.structure.map((s, i) => `${i + 1}. ${s}`).join("\n")}

### CTA Options (pick one for final shot):
${framework.ctaTypes.map(c => `- "${c}"`).join("\n")}

### Tone:
${framework.tone.join(", ")}

## SUPER HOOK REQUIREMENTS (Shot 1)
The first shot MUST use one of these TAM-style hook patterns:
- Expose hidden mistake ("Most people do X wrong...")
- Challenge common belief ("You think X, but actually...")
- Reveal surprising result ("This changed everything...")
- Call out specific audience ("If you're struggling with X...")
- Quantify outcome ("In 7 days, we...")

## CREATIVE BRIEF CONTRACT
- Look: ${brief.look}
- Camera: ${brief.camera}
- Light: ${brief.light}
- Text style: ${brief.text}
- Tone: ${brief.tone}
- Music: ${brief.music}
- Rules: ${brief.rules.join(", ")}

## OUTPUT REQUIREMENTS
1. Inject brief.look, brief.camera, brief.light into every videoPrompt
2. Use bold readable text (max 6 words per frame)
3. Create tension before resolution
4. Avoid slow cinematic montage pacing
5. Every shot MUST escalate or resolve tension
6. Final shot MUST contain CTA aligned to ${brief.intentCategory}

## JSON SCHEMA
Return ONLY valid JSON matching:
{
  "shots": [{
    "shotId": "shot1",
    "purpose": "hook | problem | mechanism | proof | cta",
    "timeStart": 0,
    "timeEnd": 2,
    "shotType": "wide | medium | close",
    "cameraMovement": "string - from brief.camera",
    "sceneDescription": "string",
    "visualSource": "generated_video | solid_bg",
    "videoPrompt": "string - MUST include brief.look + brief.camera + brief.light",
    "onScreenText": { "text": "string - max 6 words" },
    "hookPattern": "expose_mistake | challenge_belief | reveal_result | callout_audience | quantify_outcome (only for hook shots)"
  }],
  "voiceoverScript": {
    "fullScript": "string",
    "segments": [{ "shotId": "string", "text": "string", "emotion": "string" }]
  },
  "musicTrack": { "mood": "string", "tempo": "slow | medium | upbeat", "genre": "string" }
}`;
}

// =============================================================================
// PACING VALIDATION
// =============================================================================

export interface PacingValidationResult {
  pass: boolean;
  issues: string[];
}

export interface ShotForPacing {
  shotId: string;
  purpose?: string;
  timeStart: number;
  timeEnd: number;
  onScreenText?: { text?: string };
}

export function validatePacing(
  shots: ShotForPacing[],
  intentCategory: IntentCategory
): PacingValidationResult {
  const issues: string[] = [];
  
  if (shots.length === 0) {
    return { pass: false, issues: ["No shots provided"] };
  }
  
  // Calculate total duration
  const lastShot = shots[shots.length - 1];
  const totalDuration = lastShot.timeEnd;
  
  // Check max duration for growth (stricter)
  if (intentCategory === "growth" && totalDuration > 20) {
    issues.push(`Total duration ${totalDuration}s exceeds 20s max for growth content`);
  }
  
  // Check average shot duration
  const avgDuration = totalDuration / shots.length;
  if (avgDuration > 3) {
    issues.push(`Average shot duration ${avgDuration.toFixed(1)}s exceeds 3s max`);
  }
  
  // Check for hook shot
  const hasHook = shots.some(s => s.purpose === "hook" || s.shotId === "shot1");
  if (!hasHook) {
    issues.push("Missing hook shot (first shot must be hook)");
  }
  
  // Check for CTA shot
  const hasCta = shots.some(s => s.purpose === "cta" || s.shotId === shots[shots.length - 1].shotId);
  if (!hasCta) {
    issues.push("Missing CTA shot (last shot must be CTA)");
  }
  
  // Check individual shot durations
  for (const shot of shots) {
    const duration = shot.timeEnd - shot.timeStart;
    if (duration > GLOBAL_VIRAL_RULES.maxShotDuration) {
      issues.push(`Shot ${shot.shotId}: ${duration}s exceeds ${GLOBAL_VIRAL_RULES.maxShotDuration}s max`);
    }
    if (duration < GLOBAL_VIRAL_RULES.minShotDuration) {
      issues.push(`Shot ${shot.shotId}: ${duration}s below ${GLOBAL_VIRAL_RULES.minShotDuration}s min`);
    }
  }
  
  // Check text length
  for (const shot of shots) {
    const text = shot.onScreenText?.text || "";
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount > GLOBAL_VIRAL_RULES.maxWordsPerFrame) {
      issues.push(`Shot ${shot.shotId}: ${wordCount} words exceeds ${GLOBAL_VIRAL_RULES.maxWordsPerFrame} max`);
    }
  }
  
  return {
    pass: issues.length === 0,
    issues,
  };
}

// =============================================================================
// HOOK VALIDATION
// =============================================================================

export interface HookValidationResult {
  pass: boolean;
  pattern: HookPattern | null;
  issue?: string;
}

export function validateHook(hookShot: ShotForPacing): HookValidationResult {
  const text = hookShot.onScreenText?.text || "";
  const pattern = detectHookPattern(text);
  
  if (!pattern) {
    return {
      pass: false,
      pattern: null,
      issue: "Hook does not match any TAM-style pattern. Must expose mistake, challenge belief, reveal result, call out audience, or quantify outcome.",
    };
  }
  
  return { pass: true, pattern };
}

// =============================================================================
// FULL VIRAL VALIDATION
// =============================================================================

export interface ViralValidationResult {
  pass: boolean;
  pacing: PacingValidationResult;
  hook: HookValidationResult;
  allIssues: string[];
}

export function validateViralFramework(
  shots: ShotForPacing[],
  intentCategory: IntentCategory
): ViralValidationResult {
  const pacing = validatePacing(shots, intentCategory);
  const hookShot = shots[0];
  const hook = hookShot ? validateHook(hookShot) : { pass: false, pattern: null, issue: "No hook shot" };
  
  const allIssues = [
    ...pacing.issues,
    ...(hook.issue ? [hook.issue] : []),
  ];
  
  return {
    pass: pacing.pass && hook.pass,
    pacing,
    hook,
    allIssues,
  };
}
