"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BrandSelector } from "@/components/BrandSelector";
import { StrategyTilesPanel } from "@/components/StrategyTilesPanel";
import { SelectionChipsBar } from "@/components/SelectionChipsBar";
import { MarketingOutputPanel } from "@/components/MarketingOutputPanel";
import { CreativeDirectorBriefPanel } from "@/components/CreativeDirectorBriefPanel";
import { ReelBlueprintPanel } from "@/components/ReelBlueprintPanel";
import { fetchBrands, fetchBrand, fetchTokenEstimate, generateContent } from "@/lib/api";
import type { BrandProfile } from "@/lib/api";
import { saveToDrive } from "@/lib/saveToDrive";
import {
  DEFAULT_STRATEGY,
  CAMPAIGN_OBJECTIVE_OPTIONS,
  AUDIENCE_CONTEXT_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  VISUAL_ENERGY_OPTIONS,
  HOOK_FRAMEWORK_OPTIONS,
  PLATFORM_FORMAT_OPTIONS,
  DIRECTION_LEVEL_OPTIONS,
  type StrategySelection,
} from "@/types/strategy";
import type { GenerateResponse } from "@/types/generate";

const DEBOUNCE_MS = 500;

type OutputTab = "marketing" | "director" | "blueprint" | "assets";

function formatTimeAgo(ms: number): string {
  if (ms < 1000) return "Just now";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `Updated ${s}s ago`;
  const m = Math.floor(s / 60);
  return `Updated ${m}m ago`;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export default function ConsolePage() {
  const [brandId, setBrandId] = useState("");
  const [brands, setBrands] = useState<Array<{ key: string; display_name: string }>>([]);
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [selection, setSelection] = useState<StrategySelection>(DEFAULT_STRATEGY);
  const [output, setOutput] = useState<GenerateResponse | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OutputTab>("marketing");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [tokenEstimate, setTokenEstimate] = useState<{
    estimatedInput: number;
    estimatedOutput: number;
    estimatedTotal: number;
  } | null>(null);
  const [saveToDriveLoading, setSaveToDriveLoading] = useState(false);
  const [saveToDriveStatus, setSaveToDriveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveToDriveError, setSaveToDriveError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!brandId) {
      setTokenEstimate(null);
      return;
    }
    fetchTokenEstimate(brandId, selection).then((r) => {
      if ("data" in r) {
        setTokenEstimate(r.data);
      } else {
        setTokenEstimate(null);
      }
    });
  }, [brandId, selection]);

  useEffect(() => {
    if (!brandId) {
      setBrand(null);
      return;
    }
    fetchBrand(brandId).then((r) => {
      if ("data" in r) {
        setBrand(r.data);
      } else {
        setBrand(null);
      }
    });
  }, [brandId]);

  const runGenerate = useCallback(
    async (bId: string, sel: StrategySelection) => {
      if (!bId) return;
      setUpdating(true);
      setError(null);
      const result = await generateContent(bId, sel);
      setUpdating(false);
      if ("data" in result) {
        setOutput(result.data);
        setLastUpdatedAt(Date.now());
      } else {
        setError(result.error);
      }
    },
    []
  );

  const handleGenerate = () => {
    runGenerate(brandId, selection);
  };

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
    const productCatalog = brand?.kit?.selectors?.productCatalog;
    const next: StrategySelection = {
      ...DEFAULT_STRATEGY,
      campaignObjective: randomChoice(CAMPAIGN_OBJECTIVE_OPTIONS).id,
      audienceContext: randomChoice(AUDIENCE_CONTEXT_OPTIONS).id,
      propertyType: randomChoice(PROPERTY_TYPE_OPTIONS).id,
      visualEnergy: randomChoice(VISUAL_ENERGY_OPTIONS).id,
      hookFramework: randomChoice(HOOK_FRAMEWORK_OPTIONS).id,
      platformFormat: randomChoice(PLATFORM_FORMAT_OPTIONS).id,
      directionLevel: randomChoice(DIRECTION_LEVEL_OPTIONS).id as StrategySelection["directionLevel"],
    };
    if (productCatalog?.categories?.length) {
      const cat = randomChoice(productCatalog.categories);
      next.productCategory = cat.id;
      next.productType = cat.types[0]?.id;
    }
    setSelection(next);
  };

  const handleReset = () => {
    setSelection(DEFAULT_STRATEGY);
  };

  const handleSaveToDrive = async () => {
    if (!output || !brandId) return;
    setSaveToDriveLoading(true);
    setSaveToDriveStatus("idle");
    setSaveToDriveError(null);
    const result = await saveToDrive(brandId, selection, output);
    setSaveToDriveLoading(false);
    if (result.success) {
      setSaveToDriveStatus("success");
      setTimeout(() => setSaveToDriveStatus("idle"), 3000);
    } else {
      setSaveToDriveStatus("error");
      setSaveToDriveError(result.error ?? "Save failed");
    }
  };

  const tokenUsage = output?.tokenUsage;
  const showEstimate = !tokenUsage && tokenEstimate;
  const showActual = !!tokenUsage;

  const tabs: { id: OutputTab; label: string }[] = [
    { id: "marketing", label: "Marketing Output" },
    { id: "director", label: "Creative Director Brief" },
    { id: "blueprint", label: "Reel Blueprint" },
    { id: "assets", label: "Assets" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-4 border-b border-zinc-800 bg-zinc-900/80 px-4 py-3">
        <h1 className="text-lg font-semibold">Content Console</h1>
        <BrandSelector value={brandId} onChange={setBrandId} brands={brands} />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!brandId || updating}
          className="rounded bg-zinc-100 px-4 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
        >
          Generate
        </button>
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
        {(showEstimate || showActual) && (
          <span
            className="rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1 text-xs text-zinc-400"
            title={showActual ? "Actual token usage" : "Estimated tokens"}
          >
            {showActual && tokenUsage
              ? `Tokens: ${tokenUsage.inputTokens} in / ${tokenUsage.outputTokens} out`
              : tokenEstimate
              ? `Est: ~${tokenEstimate.estimatedTotal} tokens`
              : null}
          </span>
        )}
        <button
          type="button"
          onClick={handleSaveToDrive}
          disabled={!output || updating || saveToDriveLoading}
          className="rounded border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveToDriveLoading ? "Saving…" : saveToDriveStatus === "success" ? "Saved" : "Save to Drive"}
        </button>
        <span className="ml-auto text-xs text-zinc-500">
          {updating
            ? "Updating…"
            : lastUpdatedAt != null
              ? formatTimeAgo(Date.now() - lastUpdatedAt)
              : ""}
        </span>
      </div>

      {error && (
        <div className="border-b border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}
      {saveToDriveStatus === "error" && saveToDriveError && (
        <div className="border-b border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-400">
          Save to Drive: {saveToDriveError}
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - scrollable strategy tiles */}
        <div className="w-80 shrink-0 overflow-y-auto border-r border-zinc-800 bg-zinc-900/30 p-4">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Strategy
          </h2>
          <StrategyTilesPanel
            selection={selection}
            onChange={setSelection}
            brand={brand}
          />
        </div>

        {/* Right panel - sticky with chips + tabs */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-zinc-800 bg-zinc-900/50 px-4 py-2">
            <SelectionChipsBar
              selection={selection}
              brand={brand}
            />
          </div>
          <div className="shrink-0 border-b border-zinc-800">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 px-4 py-2 text-sm ${
                    activeTab === tab.id
                      ? "border-zinc-100 text-zinc-100"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {activeTab === "marketing" && (
              <MarketingOutputPanel data={output?.marketingOutput ?? null} />
            )}
            {activeTab === "director" && (
              <CreativeDirectorBriefPanel data={output?.creativeDirectorBrief ?? null} />
            )}
            {activeTab === "blueprint" && (
              <ReelBlueprintPanel data={output?.reelBlueprint ?? null} />
            )}
            {activeTab === "assets" && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center text-sm text-zinc-500">
                Coming soon
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
