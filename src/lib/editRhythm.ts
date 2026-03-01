/**
 * Edit Rhythm Rules - Pattern interrupt requirements per intent.
 */

import type { IntentCategory } from "./beatFramework.js";

export type PatternInterrupt =
  | "scene_change"
  | "camera_change"
  | "text_shift"
  | "sound_hit"
  | "speed_ramp";

export interface RhythmConstraints {
  minInterruptsPerSeconds: number;
  allowed: PatternInterrupt[];
}

export const RHYTHM_RULES_BY_INTENT: Record<IntentCategory, RhythmConstraints> = {
  growth: {
    minInterruptsPerSeconds: 0.25, // 2 per 8s
    allowed: ["scene_change", "camera_change", "text_shift", "sound_hit", "speed_ramp"],
  },
  lead_gen: {
    minInterruptsPerSeconds: 0.2,
    allowed: ["scene_change", "camera_change", "text_shift", "sound_hit"],
  },
  authority: {
    minInterruptsPerSeconds: 0.16,
    allowed: ["scene_change", "camera_change", "text_shift"],
  },
  education: {
    minInterruptsPerSeconds: 0.2,
    allowed: ["scene_change", "text_shift", "sound_hit"],
  },
  conversion: {
    minInterruptsPerSeconds: 0.25,
    allowed: ["scene_change", "camera_change", "text_shift", "sound_hit", "speed_ramp"],
  },
};

export interface RhythmValidationResult {
  pass: boolean;
  interruptCount: number;
  required: number;
  issue?: string;
}

export function validateEditRhythm(
  intent: IntentCategory,
  shots: Array<{ interrupt?: PatternInterrupt }>,
  totalSec: number
): RhythmValidationResult {
  const rules = RHYTHM_RULES_BY_INTENT[intent];
  const required = Math.ceil(totalSec * rules.minInterruptsPerSeconds);
  
  // Count explicit interrupts or assume each cut is an interrupt
  const interruptCount = shots.filter(s => s.interrupt).length || (shots.length - 1);

  if (interruptCount < required) {
    return {
      pass: false,
      interruptCount,
      required,
      issue: `Need ${required} interrupts, have ${interruptCount}`,
    };
  }

  return { pass: true, interruptCount, required };
}

export function getRhythmConstraints(intent: IntentCategory): RhythmConstraints {
  return RHYTHM_RULES_BY_INTENT[intent];
}
