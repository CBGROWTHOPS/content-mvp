"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BrandSelector } from "@/components/BrandSelector";
import { StrategyTilesPanel } from "@/components/StrategyTilesPanel";
import { MarketingOutputPanel } from "@/components/MarketingOutputPanel";
import { CreativeBriefPanel } from "@/components/CreativeBriefPanel";
import { fetchBrands, generateContent } from "@/lib/api";
import {
  DEFAULT_STRATEGY,
  CAMPAIGN_OBJECTIVE_OPTIONS,
  AUDIENCE_CONTEXT_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  VISUAL_ENERGY_OPTIONS,
  HOOK_FRAMEWORK_OPTIONS,
  PLATFORM_FORMAT_OPTIONS,
  type StrategySelection,
} from "@/types/strategy";
import type { GenerateResponse } from "@/types/generate";

const DEBOUNCE_MS = 500;

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export default function ConsolePage() {
  const [brandId, setBrandId] = useState("");
  const [brands, setBrands] = useState<Array<{ key: string; display_name: string }>>([]);
  const [selection, setSelection] = useState<StrategySelection>(DEFAULT_STRATEGY);
  const [output, setOutput] = useState<GenerateResponse | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchBrands().then((r) => {
      if ("data" in r) {
        setBrands(r.data);
        if (r.data.length > 0 && !brandId) {
          setBrandId(r.data[0]!.key);
        }
      }
    });
  }, []);

  const runGenerate = useCallback(
    async (bId: string, sel: StrategySelection) => {
      if (!bId) return;
      setUpdating(true);
      setError(null);
      const result = await generateContent(bId, sel);
      setUpdating(false);
      if ("data" in result) {
        setOutput(result.data);
      } else {
        setError(result.error);
      }
    },
    []
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!brandId) return;
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      runGenerate(brandId, selection);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [brandId, selection, runGenerate]);

  const handleRandomize = () => {
    setSelection({
      campaignObjective: randomChoice(CAMPAIGN_OBJECTIVE_OPTIONS).id,
      audienceContext: randomChoice(AUDIENCE_CONTEXT_OPTIONS).id,
      propertyType: randomChoice(PROPERTY_TYPE_OPTIONS).id,
      visualEnergy: randomChoice(VISUAL_ENERGY_OPTIONS).id,
      hookFramework: randomChoice(HOOK_FRAMEWORK_OPTIONS).id,
      platformFormat: randomChoice(PLATFORM_FORMAT_OPTIONS).id,
    });
  };

  const handleReset = () => {
    setSelection(DEFAULT_STRATEGY);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Content Console</h1>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <BrandSelector
          value={brandId}
          onChange={setBrandId}
          brands={brands}
        />
        <button
          type="button"
          onClick={handleRandomize}
          className="rounded border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          Randomize
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          Reset
        </button>
        {updating && (
          <span className="text-xs text-zinc-500">Updating</span>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="mb-4 text-sm font-medium text-zinc-400">
              Strategy Tiles
            </h2>
            <StrategyTilesPanel selection={selection} onChange={setSelection} />
          </div>
        </div>
        <div className="space-y-6 lg:col-span-3">
          <MarketingOutputPanel data={output?.marketingOutput ?? null} />
          <CreativeBriefPanel data={output?.creativeBrief ?? null} />
        </div>
      </div>
    </div>
  );
}
