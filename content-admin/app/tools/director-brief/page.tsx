"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BrandSelector } from "@/components/BrandSelector";
import { CompactStrategyForm } from "@/components/CompactStrategyForm";
import { CreativeDirectorBriefPanel } from "@/components/CreativeDirectorBriefPanel";
import { fetchBrands, fetchBrand, fetchTokenEstimate, generateContent } from "@/lib/api";
import type { BrandProfile } from "@/lib/api";
import { saveToDrive } from "@/lib/saveToDrive";
import { DEFAULT_STRATEGY, type StrategySelection } from "@/types/strategy";
import type { GenerateResponse } from "@/types/generate";

export default function DirectorBriefToolPage() {
  const [brandId, setBrandId] = useState("");
  const [brands, setBrands] = useState<Array<{ key: string; display_name: string }>>([]);
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [selection, setSelection] = useState<StrategySelection>({
    ...DEFAULT_STRATEGY,
    directionLevel: "director",
  });
  const [output, setOutput] = useState<GenerateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [tokenEstimate, setTokenEstimate] = useState<{
    estimatedInput: number;
    estimatedOutput: number;
    estimatedTotal: number;
  } | null>(null);

  useEffect(() => {
    if (!brandId) {
      setTokenEstimate(null);
      return;
    }
    fetchTokenEstimate(brandId, { ...selection, directionLevel: selection.directionLevel || "director" }).then((r) => {
      if ("data" in r) setTokenEstimate(r.data);
      else setTokenEstimate(null);
    });
  }, [brandId, selection]);

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

  const handleGenerate = async () => {
    if (!brandId) return;
    setLoading(true);
    setError(null);
    const result = await generateContent(brandId, {
      ...selection,
      directionLevel: selection.directionLevel || "director",
    });
    setLoading(false);
    if ("data" in result) setOutput(result.data);
    else setError(result.error ?? "Failed to generate");
  };

  const handleSaveToDrive = async () => {
    if (!output || !brandId) return;
    setSaveLoading(true);
    setSaveStatus("idle");
    const result = await saveToDrive(brandId, selection, output);
    setSaveLoading(false);
    if (result.success) {
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } else {
      setSaveStatus("error");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/tools" className="hover:text-zinc-300">Tools</Link>
        <span>/</span>
        <span className="text-zinc-300">Director Brief</span>
      </div>
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Director Brief</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Creative direction: concept, art, camera, lighting, typography, sound.
        </p>
        <div className="mt-3 rounded border border-zinc-800/50 bg-zinc-900/30 px-3 py-2 text-xs text-zinc-500">
          <strong className="text-zinc-400">How it works:</strong> Uses Director or Cinematic level. Generate, then expand sections to see details. Copy per section or Save to Drive.
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Brand</label>
          <BrandSelector value={brandId} onChange={setBrandId} brands={brands} />
        </div>
        <details className="group" open>
          <summary className="cursor-pointer text-sm font-medium text-zinc-400 hover:text-zinc-300">
            Strategy
          </summary>
          <div className="mt-3">
          <CompactStrategyForm
            selection={selection}
            onChange={setSelection}
            brand={brand}
            showDirectionLevel={true}
          />
          </div>
        </details>
        {tokenEstimate && (
          <p className="text-xs text-zinc-500">
            ~{tokenEstimate.estimatedTotal} tokens estimated ({tokenEstimate.estimatedInput} in / {tokenEstimate.estimatedOutput} out)
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!brandId || loading}
            className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate"}
          </button>
          <button
            type="button"
            onClick={handleSaveToDrive}
            disabled={!output || loading || saveLoading}
            className="rounded border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            {saveLoading ? "Saving…" : saveStatus === "success" ? "Saved" : "Save to Drive"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div>
        <CreativeDirectorBriefPanel data={output?.creativeDirectorBrief ?? null} />
      </div>
    </div>
  );
}
