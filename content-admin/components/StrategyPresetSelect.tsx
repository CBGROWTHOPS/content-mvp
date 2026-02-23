"use client";

import { useState } from "react";
import type { StrategySelection } from "@/types/strategy";
import {
  getPresetOptions,
  presetToStrategy,
} from "@/lib/presetUtils";
import {
  DIRECTION_LEVEL_OPTIONS,
  CAMPAIGN_OBJECTIVE_OPTIONS,
  AUDIENCE_CONTEXT_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  VISUAL_ENERGY_OPTIONS,
  HOOK_FRAMEWORK_OPTIONS,
  PLATFORM_FORMAT_OPTIONS,
} from "@/types/strategy";
import type { BrandProfile } from "@/lib/api";

const selectClass =
  "w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none";

interface StrategyPresetSelectProps {
  brand: BrandProfile | null;
  selection: StrategySelection;
  onChange: (s: StrategySelection) => void;
  showDirectionLevel?: boolean;
}

export function StrategyPresetSelect({
  brand,
  selection,
  onChange,
  showDirectionLevel = false,
}: StrategyPresetSelectProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const presetOptions = getPresetOptions(brand);

  const handlePresetChange = (presetId: string) => {
    const resolved = presetToStrategy(presetId, brand, {
      strategyPreset: presetId,
      directionLevel: selection.directionLevel,
      productCategory: selection.productCategory,
      productType: selection.productType,
    });
    onChange({
      ...DEFAULT_BASE,
      ...resolved,
      strategyPreset: presetId,
      contextTitle: selection.contextTitle,
      contextNotes: selection.contextNotes,
    });
  };

  const update = (key: keyof StrategySelection, value: string | undefined) => {
    onChange({ ...selection, [key]: value });
  };

  const productCatalog = brand?.kit?.selectors?.productCatalog;
  const categories = productCatalog?.categories ?? [];
  const selectedCategory = categories.find((c) => c.id === selection.productCategory);
  const typeOptions = selectedCategory?.types ?? [];

  const handleCategoryChange = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    onChange({
      ...selection,
      productCategory: categoryId,
      productType: cat?.types?.[0]?.id ?? undefined,
    });
  };

  const currentPresetId = selection.strategyPreset ?? presetOptions[0]?.id ?? "";

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">
          Strategy Preset
        </label>
        <select
          value={currentPresetId}
          onChange={(e) => handlePresetChange(e.target.value)}
          className={selectClass}
        >
          {presetOptions.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      <details className="group" open={advancedOpen}>
        <summary
          className="cursor-pointer text-sm font-medium text-zinc-500 hover:text-zinc-400"
          onClick={(e) => { e.preventDefault(); setAdvancedOpen(!advancedOpen); }}
        >
          Advanced
        </summary>
        <div className="mt-3 space-y-3 border-l-2 border-zinc-800 pl-3">
          {showDirectionLevel && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                Direction Level
              </label>
              <select
                value={selection.directionLevel ?? "template"}
                onChange={(e) =>
                  update("directionLevel", e.target.value as StrategySelection["directionLevel"])
                }
                className={selectClass}
              >
                {DIRECTION_LEVEL_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Objective</label>
            <select
              value={selection.campaignObjective}
              onChange={(e) => update("campaignObjective", e.target.value)}
              className={selectClass}
            >
              {CAMPAIGN_OBJECTIVE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Audience</label>
            <select
              value={selection.audienceContext}
              onChange={(e) => update("audienceContext", e.target.value)}
              className={selectClass}
            >
              {AUDIENCE_CONTEXT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Property</label>
            <select
              value={selection.propertyType}
              onChange={(e) => update("propertyType", e.target.value)}
              className={selectClass}
            >
              {PROPERTY_TYPE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          {categories.length > 0 && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Product</label>
                <select
                  value={selection.productCategory ?? categories[0]?.id}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={selectClass}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              {typeOptions.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Type</label>
                  <select
                    value={selection.productType ?? typeOptions[0]?.id}
                    onChange={(e) => update("productType", e.target.value)}
                    className={selectClass}
                  >
                    {typeOptions.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Visual</label>
            <select
              value={selection.visualEnergy}
              onChange={(e) => update("visualEnergy", e.target.value)}
              className={selectClass}
            >
              {VISUAL_ENERGY_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Hook</label>
            <select
              value={selection.hookFramework}
              onChange={(e) => update("hookFramework", e.target.value)}
              className={selectClass}
            >
              {HOOK_FRAMEWORK_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Format</label>
            <select
              value={selection.platformFormat}
              onChange={(e) => update("platformFormat", e.target.value)}
              className={selectClass}
            >
              {PLATFORM_FORMAT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </details>
    </div>
  );
}

const DEFAULT_BASE: StrategySelection = {
  campaignObjective: "lead_generation",
  audienceContext: "affluent_homeowner",
  propertyType: "single_family",
  visualEnergy: "calm",
  hookFramework: "contrast",
  platformFormat: "reel_kit",
};
