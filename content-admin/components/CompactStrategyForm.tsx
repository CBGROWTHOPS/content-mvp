"use client";

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

interface CompactStrategyFormProps {
  selection: StrategySelection;
  onChange: (s: StrategySelection) => void;
  brand?: BrandProfile | null;
  showDirectionLevel?: boolean;
}

const selectClass =
  "w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none";

export function CompactStrategyForm({
  selection,
  onChange,
  brand,
  showDirectionLevel = false,
}: CompactStrategyFormProps) {
  const productCatalog = brand?.kit?.selectors?.productCatalog;
  const categories = productCatalog?.categories ?? [];
  const selectedCategory = categories.find((c) => c.id === selection.productCategory);
  const typeOptions = selectedCategory?.types ?? [];

  const update = (key: keyof StrategySelection, value: string | undefined) => {
    onChange({ ...selection, [key]: value });
  };

  const handleCategoryChange = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    const firstType = cat?.types[0]?.id;
    onChange({
      ...selection,
      productCategory: categoryId,
      productType: firstType,
    });
  };

  return (
    <div className="space-y-3">
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
              value={selection.productCategory ?? categories[0]!.id}
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
                value={selection.productType ?? typeOptions[0]!.id}
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
      {showDirectionLevel && (
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Direction</label>
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
    </div>
  );
}
