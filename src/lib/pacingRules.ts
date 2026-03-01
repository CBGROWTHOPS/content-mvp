/**
 * Pacing Rules - Duration and shot constraints per intent.
 */

import type { IntentCategory } from "./beatFramework.js";

export interface PacingConstraints {
  maxShots: number;
  minShotSec: number;
  maxShotSec: number;
  maxTotalSec: number;
}

export const PACING_BY_INTENT: Record<IntentCategory, PacingConstraints> = {
  growth: { maxShots: 6, minShotSec: 1.5, maxShotSec: 2.8, maxTotalSec: 20 },
  lead_gen: { maxShots: 6, minShotSec: 1.6, maxShotSec: 3.0, maxTotalSec: 20 },
  authority: { maxShots: 6, minShotSec: 1.8, maxShotSec: 3.0, maxTotalSec: 20 },
  education: { maxShots: 6, minShotSec: 1.6, maxShotSec: 3.0, maxTotalSec: 22 },
  conversion: { maxShots: 6, minShotSec: 1.4, maxShotSec: 2.6, maxTotalSec: 18 },
};

export interface PacingValidationResult {
  pass: boolean;
  issues: string[];
}

export function validatePacing(
  intent: IntentCategory,
  shots: Array<{ timeStart: number; timeEnd: number; shotId: string }>
): PacingValidationResult {
  const rules = PACING_BY_INTENT[intent];
  const issues: string[] = [];

  if (shots.length === 0) {
    return { pass: false, issues: ["No shots"] };
  }

  if (shots.length > rules.maxShots) {
    issues.push(`${shots.length} shots > ${rules.maxShots} max`);
  }

  const totalSec = shots[shots.length - 1].timeEnd;
  if (totalSec > rules.maxTotalSec) {
    issues.push(`${totalSec}s > ${rules.maxTotalSec}s max`);
  }

  for (const shot of shots) {
    const dur = shot.timeEnd - shot.timeStart;
    if (dur < rules.minShotSec) {
      issues.push(`${shot.shotId}: ${dur}s < ${rules.minShotSec}s min`);
    }
    if (dur > rules.maxShotSec) {
      issues.push(`${shot.shotId}: ${dur}s > ${rules.maxShotSec}s max`);
    }
  }

  return { pass: issues.length === 0, issues };
}

export function getPacingConstraints(intent: IntentCategory): PacingConstraints {
  return PACING_BY_INTENT[intent];
}
