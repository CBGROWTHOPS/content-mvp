import type { StrategySelection } from "@/types/strategy";
import { DEFAULT_STRATEGY_PRESETS } from "@/types/strategy";
import type { BrandProfile } from "@/lib/api";

/** Get preset options from brand or fallback. */
export function getPresetOptions(brand: BrandProfile | null): Array<{ id: string; label: string }> {
  const presets = brand?.strategy_presets;
  if (presets && presets.length > 0) {
    return presets.map((p) => ({ id: p.id, label: p.label }));
  }
  return DEFAULT_STRATEGY_PRESETS.map((p) => ({ id: p.id, label: p.label }));
}

/** Resolve strategy from preset. Merges preset strategy with existing overrides. */
export function presetToStrategy(
  presetId: string,
  brand: BrandProfile | null,
  overrides: Partial<StrategySelection> = {}
): Partial<StrategySelection> {
  const presets = brand?.strategy_presets;
  const preset = presets?.find((p) => p.id === presetId)
    ?? DEFAULT_STRATEGY_PRESETS.find((p) => p.id === presetId);
  const base = preset?.strategy ?? {};
  return { ...base, ...overrides };
}
