"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BrandSelector } from "@/components/BrandSelector";
import { StrategyPresetSelect } from "@/components/StrategyPresetSelect";
import { ContextFields } from "@/components/ContextFields";
import { CreativeDirectorBriefPanel } from "@/components/CreativeDirectorBriefPanel";
import { 
  fetchBrands, 
  fetchBrand, 
  fetchTokenEstimate, 
  generateContent,
  fetchBriefPresets,
  generateCompactBrief,
  type CompactCreativeBrief,
  type BriefPreset,
} from "@/lib/api";
import type { BrandProfile } from "@/lib/api";
import { saveToDrive } from "@/lib/saveToDrive";
import { useLastGeneration } from "@/hooks/useLastGeneration";
import { DEFAULT_STRATEGY } from "@/types/strategy";
import { getPresetOptions, presetToStrategy } from "@/lib/presetUtils";
import type { StrategySelection } from "@/types/strategy";
import type { GenerateResponse } from "@/types/generate";

type BriefMode = "full" | "compact";

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
  const { save, load } = useLastGeneration();

  // Compact brief state
  const [briefMode, setBriefMode] = useState<BriefMode>("compact");
  const [briefPresets, setBriefPresets] = useState<BriefPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [compactBrief, setCompactBrief] = useState<CompactCreativeBrief | null>(null);
  const [compactBriefKey, setCompactBriefKey] = useState<string>("");
  const [briefCached, setBriefCached] = useState(false);
  const [briefTokens, setBriefTokens] = useState<number>(0);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefInputs, setBriefInputs] = useState({
    goal: "full reel",
    topic: "",
    audience: "",
    style: "premium cinematic",
  });

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
    fetchBriefPresets().then((r) => {
      if ("data" in r) {
        setBriefPresets(r.data);
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

  useEffect(() => {
    if (!brand) return;
    const presets = getPresetOptions(brand);
    const firstId = presets[0]?.id;
    if (firstId) {
      setSelection((s) => {
        if (s.strategyPreset && presets.some((p) => p.id === s.strategyPreset)) return s;
        const resolved = presetToStrategy(firstId, brand, {
          strategyPreset: firstId,
          directionLevel: "director",
          contextTitle: s.contextTitle,
          contextNotes: s.contextNotes,
        });
        return { ...DEFAULT_STRATEGY, ...resolved, strategyPreset: firstId, directionLevel: "director" as const, contextTitle: s.contextTitle, contextNotes: s.contextNotes };
      });
    }
  }, [brand?.brand_key]);

  const handleGenerate = async () => {
    if (!brandId) return;
    setLoading(true);
    setError(null);
    const result = await generateContent(brandId, {
      ...selection,
      directionLevel: selection.directionLevel || "director",
    });
    setLoading(false);
    if ("data" in result) {
      const data = result.data;
      setOutput(data);
      save(data);
    } else {
      setError(result.error ?? "Failed to generate");
    }
  };

  const handleLoadLast = () => {
    const last = load();
    if (last) setOutput(last);
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

  const handleGenerateCompactBrief = async () => {
    setBriefLoading(true);
    setError(null);
    
    const params = selectedPreset
      ? { usePreset: selectedPreset }
      : {
          brandId,
          goal: briefInputs.goal,
          topic: briefInputs.topic || selection.contextTitle || "brand showcase",
          audience: briefInputs.audience || selection.audienceContext || "target customers",
          style: briefInputs.style,
        };
    
    const result = await generateCompactBrief(params);
    setBriefLoading(false);
    
    if ("data" in result) {
      setCompactBrief(result.data.brief);
      setCompactBriefKey(result.data.briefKey);
      setBriefCached(result.data.cached);
      setBriefTokens(result.data.tokenUsage.total);
    } else {
      setError(result.error);
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
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setBriefMode("compact")}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            briefMode === "compact"
              ? "bg-zinc-100 text-zinc-900"
              : "border border-zinc-700 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Compact Brief (Low Token)
        </button>
        <button
          type="button"
          onClick={() => setBriefMode("full")}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            briefMode === "full"
              ? "bg-zinc-100 text-zinc-900"
              : "border border-zinc-700 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Full Director Brief
        </button>
      </div>

      {briefMode === "compact" ? (
        /* Compact Brief Mode */
        <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
          <div className="rounded border border-blue-900/50 bg-blue-950/30 px-3 py-2 text-xs text-blue-300">
            <strong>Compact Brief:</strong> Ultra-low token (~100-200) creative contract. Use presets for zero-cost testing.
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">Use Preset (Free)</label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
            >
              <option value="">Generate new brief (uses tokens)</option>
              {briefPresets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id}: {p.concept}
                </option>
              ))}
            </select>
          </div>

          {!selectedPreset && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-400">Brand</label>
                <BrandSelector value={brandId} onChange={setBrandId} brands={brands} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Goal</label>
                  <input
                    type="text"
                    value={briefInputs.goal}
                    onChange={(e) => setBriefInputs((s) => ({ ...s, goal: e.target.value }))}
                    placeholder="full reel"
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Style</label>
                  <input
                    type="text"
                    value={briefInputs.style}
                    onChange={(e) => setBriefInputs((s) => ({ ...s, style: e.target.value }))}
                    placeholder="premium cinematic"
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Topic</label>
                  <input
                    type="text"
                    value={briefInputs.topic}
                    onChange={(e) => setBriefInputs((s) => ({ ...s, topic: e.target.value }))}
                    placeholder="e.g. luxury CRM for loan officers"
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Audience</label>
                  <input
                    type="text"
                    value={briefInputs.audience}
                    onChange={(e) => setBriefInputs((s) => ({ ...s, audience: e.target.value }))}
                    placeholder="e.g. loan officers"
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={handleGenerateCompactBrief}
            disabled={briefLoading || (!selectedPreset && !brandId)}
            className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {briefLoading ? "Generating…" : selectedPreset ? "Load Preset" : "Generate Brief"}
          </button>

          {compactBrief && (
            <div className="space-y-3 rounded border border-zinc-700 bg-zinc-950/50 p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-200">Compact Creative Brief</h3>
                <div className="flex items-center gap-2 text-xs">
                  {briefCached && (
                    <span className="rounded bg-green-900/50 px-1.5 py-0.5 text-green-400">cached</span>
                  )}
                  {briefTokens > 0 && (
                    <span className="text-zinc-500">{briefTokens} tokens</span>
                  )}
                  <span className="font-mono text-zinc-500">{compactBriefKey}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-zinc-500">concept:</span>{" "}
                  <span className="text-zinc-200">{compactBrief.concept}</span>
                </div>
                <div>
                  <span className="text-zinc-500">tone:</span>{" "}
                  <span className="text-zinc-200">{compactBrief.tone}</span>
                </div>
                <div>
                  <span className="text-zinc-500">look:</span>{" "}
                  <span className="text-zinc-200">{compactBrief.look}</span>
                </div>
                <div>
                  <span className="text-zinc-500">camera:</span>{" "}
                  <span className="text-zinc-200">{compactBrief.camera}</span>
                </div>
                <div>
                  <span className="text-zinc-500">light:</span>{" "}
                  <span className="text-zinc-200">{compactBrief.light}</span>
                </div>
                <div>
                  <span className="text-zinc-500">music:</span>{" "}
                  <span className="text-zinc-200">{compactBrief.music}</span>
                </div>
                <div>
                  <span className="text-zinc-500">vo:</span>{" "}
                  <span className="text-zinc-200">{compactBrief.vo}</span>
                </div>
                <div>
                  <span className="text-zinc-500">text:</span>{" "}
                  <span className="text-zinc-200">{compactBrief.text}</span>
                </div>
              </div>
              <div className="text-xs">
                <span className="text-zinc-500">rules:</span>
                <ul className="mt-1 list-inside list-disc text-zinc-300">
                  {compactBrief.rules.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
              <details className="text-xs">
                <summary className="cursor-pointer text-zinc-500 hover:text-zinc-400">
                  Raw JSON
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-zinc-900 p-2 text-zinc-400">
                  {JSON.stringify(compactBrief, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      ) : (
        /* Full Director Brief Mode */
        <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
          <div className="rounded border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
            <strong>Full Brief:</strong> Higher token cost (~1000-2000). Generates complete creative director playbook.
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">Brand</label>
            <BrandSelector value={brandId} onChange={setBrandId} brands={brands} />
          </div>
          <StrategyPresetSelect selection={selection} onChange={setSelection} brand={brand} showDirectionLevel={true} />
          <ContextFields
            contextTitle={selection.contextTitle ?? ""}
            contextNotes={selection.contextNotes ?? ""}
            onContextTitleChange={(v) => setSelection((s) => ({ ...s, contextTitle: v }))}
            onContextNotesChange={(v) => setSelection((s) => ({ ...s, contextNotes: v }))}
          />
          {tokenEstimate && (
            <p className="text-xs text-zinc-500">
              ~{tokenEstimate.estimatedTotal} tokens estimated ({tokenEstimate.estimatedInput} in / {tokenEstimate.estimatedOutput} out)
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
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
              onClick={handleLoadLast}
              className="rounded border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Load last generation
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
      )}

      {error && (
        <div className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {briefMode === "full" && (
        <div>
          <CreativeDirectorBriefPanel data={output?.creativeDirectorBrief ?? null} />
        </div>
      )}
    </div>
  );
}
