"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { BrandSelector } from "@/components/BrandSelector";
import { StrategyTilesPanel } from "@/components/StrategyTilesPanel";
import { MarketingOutputPanel } from "@/components/MarketingOutputPanel";
import { fetchBrands, fetchBrand, generateContent } from "@/lib/api";
import type { BrandProfile } from "@/lib/api";
import { saveToDrive } from "@/lib/saveToDrive";
import { DEFAULT_STRATEGY, type StrategySelection } from "@/types/strategy";
import type { GenerateResponse } from "@/types/generate";

const DEBOUNCE_MS = 500;

export default function MarketingToolPage() {
  const [brandId, setBrandId] = useState("");
  const [brands, setBrands] = useState<Array<{ key: string; display_name: string }>>([]);
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [selection, setSelection] = useState<StrategySelection>({
    ...DEFAULT_STRATEGY,
    directionLevel: "template",
  });
  const [output, setOutput] = useState<GenerateResponse | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveToDriveLoading, setSaveToDriveLoading] = useState(false);
  const [saveToDriveStatus, setSaveToDriveStatus] = useState<"idle" | "success" | "error">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchBrands().then((r) => {
      if ("data" in r) {
        setBrands(r.data);
        if (r.data.length > 0 && !brandId) setBrandId(r.data[0]!.key);
      }
    });
  }, []);

  useEffect(() => {
    if (!brandId) {
      setBrand(null);
      return;
    }
    fetchBrand(brandId).then((r) => {
      if ("data" in r) setBrand(r.data);
      else setBrand(null);
    });
  }, [brandId]);

  const runGenerate = useCallback(async (bId: string, sel: StrategySelection) => {
    if (!bId) return;
    setUpdating(true);
    setError(null);
    const result = await generateContent(bId, sel);
    setUpdating(false);
    if ("data" in result) setOutput(result.data);
    else setError(result.error ?? "Failed to generate");
  }, []);

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

  const handleSaveToDrive = async () => {
    if (!output || !brandId) return;
    setSaveToDriveLoading(true);
    setSaveToDriveStatus("idle");
    const result = await saveToDrive(brandId, selection, output);
    setSaveToDriveLoading(false);
    if (result.success) {
      setSaveToDriveStatus("success");
      setTimeout(() => setSaveToDriveStatus("idle"), 3000);
    } else {
      setSaveToDriveStatus("error");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col">
      <div className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/tools" className="hover:text-zinc-300">Tools</Link>
        <span>/</span>
        <span className="text-zinc-300">Marketing Copy</span>
      </div>
      <div className="flex flex-1 gap-6 overflow-hidden">
        <div className="w-72 shrink-0 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Strategy
          </h2>
          <StrategyTilesPanel
            selection={selection}
            onChange={setSelection}
            brand={brand}
            showDirectionLevel={false}
            showAdvanced={false}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <BrandSelector value={brandId} onChange={setBrandId} brands={brands} />
            <button
              type="button"
              onClick={() => runGenerate(brandId, selection)}
              disabled={!brandId || updating}
              className="rounded bg-zinc-100 px-4 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
            >
              {updating ? "Generating…" : "Generate"}
            </button>
            <button
              type="button"
              onClick={handleSaveToDrive}
              disabled={!output || updating || saveToDriveLoading}
              className="rounded border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
            >
              {saveToDriveLoading ? "Saving…" : saveToDriveStatus === "success" ? "Saved" : "Save to Drive"}
            </button>
          </div>
          {error && (
            <div className="mb-3 rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
          <div className="flex-1 overflow-auto rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
            <MarketingOutputPanel data={output?.marketingOutput ?? null} />
          </div>
        </div>
      </div>
    </div>
  );
}
