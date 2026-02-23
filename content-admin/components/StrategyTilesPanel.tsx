"use client";

import { TileGroup } from "./TileGroup";
import type { StrategySelection } from "@/types/strategy";
import {
  CAMPAIGN_OBJECTIVE_OPTIONS,
  AUDIENCE_CONTEXT_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  VISUAL_ENERGY_OPTIONS,
  HOOK_FRAMEWORK_OPTIONS,
  PLATFORM_FORMAT_OPTIONS,
} from "@/types/strategy";

interface StrategyTilesPanelProps {
  selection: StrategySelection;
  onChange: (selection: StrategySelection) => void;
}

function updateSelection(
  current: StrategySelection,
  key: keyof StrategySelection,
  value: string
): StrategySelection {
  return { ...current, [key]: value };
}

export function StrategyTilesPanel({ selection, onChange }: StrategyTilesPanelProps) {
  return (
    <div className="space-y-6">
      <TileGroup
        title="Campaign Objective"
        options={CAMPAIGN_OBJECTIVE_OPTIONS}
        value={selection.campaignObjective}
        onChange={(id) =>
          onChange(updateSelection(selection, "campaignObjective", id))
        }
      />
      <TileGroup
        title="Audience Context"
        options={AUDIENCE_CONTEXT_OPTIONS}
        value={selection.audienceContext}
        onChange={(id) =>
          onChange(updateSelection(selection, "audienceContext", id))
        }
      />
      <TileGroup
        title="Property Type"
        options={PROPERTY_TYPE_OPTIONS}
        value={selection.propertyType}
        onChange={(id) =>
          onChange(updateSelection(selection, "propertyType", id))
        }
      />
      <TileGroup
        title="Visual Energy"
        options={VISUAL_ENERGY_OPTIONS}
        value={selection.visualEnergy}
        onChange={(id) =>
          onChange(updateSelection(selection, "visualEnergy", id))
        }
      />
      <TileGroup
        title="Hook Framework"
        options={HOOK_FRAMEWORK_OPTIONS}
        value={selection.hookFramework}
        onChange={(id) =>
          onChange(updateSelection(selection, "hookFramework", id))
        }
      />
      <TileGroup
        title="Platform Format"
        options={PLATFORM_FORMAT_OPTIONS}
        value={selection.platformFormat}
        onChange={(id) =>
          onChange(updateSelection(selection, "platformFormat", id))
        }
      />
    </div>
  );
}
