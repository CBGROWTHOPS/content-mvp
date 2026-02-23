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

interface SelectionChipsBarProps {
  selection: StrategySelection;
  brand?: BrandProfile | null;
}

function getLabel(
  id: string,
  options: { id: string; label: string }[]
): string {
  return options.find((o) => o.id === id)?.label ?? id;
}

export function SelectionChipsBar({ selection, brand }: SelectionChipsBarProps) {
  const productCatalog = brand?.kit?.selectors?.productCatalog;
  const categories = productCatalog?.categories ?? [];
  const selectedCategory = categories.find((c) => c.id === selection.productCategory);
  const productTypeLabel = selectedCategory?.types.find(
    (t) => t.id === selection.productType
  )?.label;

  const chips: { label: string; key: string }[] = [
    { key: "objective", label: getLabel(selection.campaignObjective, CAMPAIGN_OBJECTIVE_OPTIONS) },
    { key: "audience", label: getLabel(selection.audienceContext, AUDIENCE_CONTEXT_OPTIONS) },
    { key: "property", label: getLabel(selection.propertyType, PROPERTY_TYPE_OPTIONS) },
    ...(categories.length > 0 && selection.productCategory
      ? [
          {
            key: "category",
            label:
              categories.find((c) => c.id === selection.productCategory)?.label ?? selection.productCategory,
          },
          ...(productTypeLabel ? [{ key: "type", label: productTypeLabel }] : []),
        ]
      : []),
    { key: "energy", label: getLabel(selection.visualEnergy, VISUAL_ENERGY_OPTIONS) },
    { key: "hook", label: getLabel(selection.hookFramework, HOOK_FRAMEWORK_OPTIONS) },
    { key: "format", label: getLabel(selection.platformFormat, PLATFORM_FORMAT_OPTIONS) },
    {
      key: "direction",
      label: getLabel(selection.directionLevel ?? "template", DIRECTION_LEVEL_OPTIONS),
    },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-[11px] text-zinc-300"
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
}
