"use client";

import { useState } from "react";
import { TileGroup } from "./TileGroup";
import type { StrategySelection } from "@/types/strategy";
import {
  CAMPAIGN_OBJECTIVE_OPTIONS,
  AUDIENCE_CONTEXT_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  VISUAL_ENERGY_OPTIONS,
  HOOK_FRAMEWORK_OPTIONS,
  PLATFORM_FORMAT_OPTIONS,
  DIRECTION_LEVEL_OPTIONS,
} from "@/types/strategy";
import type { BrandProfile } from "@/lib/api";

interface StrategyTilesPanelProps {
  selection: StrategySelection;
  onChange: (selection: StrategySelection) => void;
  brand?: BrandProfile | null;
  /** Hide Direction Level tile (e.g. for Marketing-only tool) */
  showDirectionLevel?: boolean;
  /** Hide Advanced drawer */
  showAdvanced?: boolean;
}

function updateSelection(
  current: StrategySelection,
  key: keyof StrategySelection,
  value: string | number | boolean | undefined
): StrategySelection {
  return { ...current, [key]: value };
}

const DURATION_OPTIONS = [
  { id: "6", label: "6s" },
  { id: "10", label: "10s" },
  { id: "15", label: "15s" },
  { id: "30", label: "30s" },
];

const CTA_STYLE_OPTIONS = [
  { id: "primary", label: "Primary" },
  { id: "secondary", label: "Secondary" },
  { id: "minimal", label: "Minimal" },
];

export function StrategyTilesPanel({
  selection,
  onChange,
  brand,
  showDirectionLevel = true,
  showAdvanced = true,
}: StrategyTilesPanelProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const productCatalog = brand?.kit?.selectors?.productCatalog;
  const categories = productCatalog?.categories ?? [];
  const selectedCategory = categories.find((c) => c.id === selection.productCategory);
  const typeOptions =
    selectedCategory?.types.map((t) => ({ id: t.id, label: t.label })) ?? [];

  const handleCategoryChange = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    const firstType = cat?.types[0]?.id;
    onChange({ ...selection, productCategory: categoryId, productType: firstType });
  };

  return (
    <div className="space-y-4">
      <TileGroup
        title="Campaign Objective"
        options={CAMPAIGN_OBJECTIVE_OPTIONS}
        value={selection.campaignObjective}
        onChange={(id) => onChange(updateSelection(selection, "campaignObjective", id))}
      />
      <TileGroup
        title="Audience Context"
        options={AUDIENCE_CONTEXT_OPTIONS}
        value={selection.audienceContext}
        onChange={(id) => onChange(updateSelection(selection, "audienceContext", id))}
      />
      <TileGroup
        title="Property Type"
        options={PROPERTY_TYPE_OPTIONS}
        value={selection.propertyType}
        onChange={(id) => onChange(updateSelection(selection, "propertyType", id))}
      />
      {categories.length > 0 && (
        <>
          <TileGroup
            title="Product Category"
            options={categories.map((c) => ({ id: c.id, label: c.label }))}
            value={selection.productCategory ?? categories[0]!.id}
            onChange={handleCategoryChange}
            showDescription={false}
          />
          {typeOptions.length > 0 && (
            <TileGroup
              title="Product Type"
              options={typeOptions}
              value={selection.productType ?? typeOptions[0]!.id}
              onChange={(id) => onChange(updateSelection(selection, "productType", id))}
              showDescription={false}
            />
          )}
        </>
      )}
      <TileGroup
        title="Visual Energy"
        options={VISUAL_ENERGY_OPTIONS}
        value={selection.visualEnergy}
        onChange={(id) => onChange(updateSelection(selection, "visualEnergy", id))}
      />
      <TileGroup
        title="Hook Framework"
        options={HOOK_FRAMEWORK_OPTIONS}
        value={selection.hookFramework}
        onChange={(id) => onChange(updateSelection(selection, "hookFramework", id))}
      />
      <TileGroup
        title="Platform Format"
        options={PLATFORM_FORMAT_OPTIONS}
        value={selection.platformFormat}
        onChange={(id) => onChange(updateSelection(selection, "platformFormat", id))}
      />
      {showDirectionLevel && (
        <TileGroup
          title="Direction Level"
          options={DIRECTION_LEVEL_OPTIONS}
          value={selection.directionLevel ?? "template"}
          onChange={(id) =>
            onChange(updateSelection(selection, "directionLevel", id as StrategySelection["directionLevel"]))
          }
        />
      )}
      {/* Advanced drawer */}
      {showAdvanced && (
      <div className="rounded border border-zinc-800 bg-zinc-900/30">
        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 hover:bg-zinc-800/50"
        >
          Advanced
          <span className="text-zinc-500">{advancedOpen ? "▾" : "▸"}</span>
        </button>
        {advancedOpen && (
          <div className="space-y-3 border-t border-zinc-800 px-3 py-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Duration</label>
              <div className="flex gap-1.5">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onChange(updateSelection(selection, "duration", parseInt(opt.id, 10)))
                    }
                    className={`rounded border px-2 py-1 text-xs ${
                      (selection.duration ?? 6) === parseInt(opt.id, 10)
                        ? "border-zinc-100 bg-zinc-100/10 text-zinc-100"
                        : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Hook count</label>
              <input
                type="number"
                min={1}
                max={10}
                value={selection.hookCount ?? 1}
                onChange={(e) =>
                  onChange(updateSelection(selection, "hookCount", parseInt(e.target.value, 10) || 1))
                }
                className="w-20 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Variant count</label>
              <input
                type="number"
                min={1}
                max={10}
                value={selection.variantCount ?? 1}
                onChange={(e) =>
                  onChange(updateSelection(selection, "variantCount", parseInt(e.target.value, 10) || 1))
                }
                className="w-20 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">CTA style</label>
              <div className="flex gap-1.5">
                {CTA_STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange(updateSelection(selection, "ctaStyle", opt.id))}
                    className={`rounded border px-2 py-1 text-xs ${
                      (selection.ctaStyle ?? "primary") === opt.id
                        ? "border-zinc-100 bg-zinc-100/10 text-zinc-100"
                        : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="offer-toggle"
                checked={selection.offerToggle ?? false}
                onChange={(e) =>
                  onChange(updateSelection(selection, "offerToggle", e.target.checked))
                }
                className="rounded border-zinc-600 bg-zinc-900"
              />
              <label htmlFor="offer-toggle" className="text-xs text-zinc-400">
                Include offer
              </label>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
