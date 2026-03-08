/**
 * Pacing Rules - Duration and shot constraints.
 * Hard constraints: 15-30s total, 6 shots for 15s / 8 for 30s, each shot 2-4s, hook < 2s.
 */

import type { IntentCategory } from "./beatFramework.js";

export interface PacingConstraints {
  maxShots: number;
  minShotSec: number;
  maxShotSec: number;
  maxTotalSec: number;
}

/** Duration-based pacing: 6 shots for 15s reel, 8 for 30s. Never 60+. */
export function getPacingForDuration(durationSeconds: number): PacingConstraints {
  const totalSec = Math.min(30, Math.max(15, durationSeconds));
  const maxShots = totalSec <= 15 ? 6 : 8;
  return {
    maxShots,
    minShotSec: 2,
    maxShotSec: 4,
    maxTotalSec: totalSec,
  };
}

/** @deprecated Use getPacingForDuration. Kept for backward compat. */
export const PACING_BY_INTENT: Record<IntentCategory, PacingConstraints> = {
  growth: { maxShots: 6, minShotSec: 2, maxShotSec: 4, maxTotalSec: 20 },
  lead_gen: { maxShots: 6, minShotSec: 2, maxShotSec: 4, maxTotalSec: 20 },
  authority: { maxShots: 6, minShotSec: 2, maxShotSec: 4, maxTotalSec: 20 },
  education: { maxShots: 6, minShotSec: 2, maxShotSec: 4, maxTotalSec: 22 },
  conversion: { maxShots: 6, minShotSec: 2, maxShotSec: 4, maxTotalSec: 18 },
};

export interface PacingValidationResult {
  pass: boolean;
  issues: string[];
}

export function validatePacing(
  intent: IntentCategory,
  shots: Array<{ timeStart: number; timeEnd: number; shotId: string }>
): PacingValidationResult {
  const issues: string[] = [];

  if (shots.length === 0) {
    return { pass: false, issues: ["No shots"] };
  }

  const totalSec = shots[shots.length - 1].timeEnd;
  if (totalSec > 30) {
    issues.push(`Total ${totalSec}s > 30s max (never 60+)`);
  }
  if (totalSec < 15) {
    issues.push(`Total ${totalSec}s < 15s min`);
  }

  const rules = getPacingForDuration(totalSec);

  if (shots.length > rules.maxShots) {
    issues.push(`${shots.length} shots > ${rules.maxShots} max (${totalSec <= 15 ? "6 for 15s" : "8 for 30s"})`);
  }

  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    const dur = shot.timeEnd - shot.timeStart;
    if (i === 0 && dur >= 2) {
      issues.push(`${shot.shotId}: hook must be under 2s (pattern interrupt), got ${dur}s`);
    }
    if (dur < rules.minShotSec && i > 0) {
      issues.push(`${shot.shotId}: ${dur}s < ${rules.minShotSec}s min`);
    }
    if (dur > rules.maxShotSec) {
      issues.push(`${shot.shotId}: ${dur}s > ${rules.maxShotSec}s max (2-4s per shot)`);
    }
  }

  return { pass: issues.length === 0, issues };
}

export function getPacingConstraints(intent: IntentCategory): PacingConstraints {
  return PACING_BY_INTENT[intent];
}
