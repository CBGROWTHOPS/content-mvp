"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandSelector } from "@/components/BrandSelector";
import { InfoCard, CostEstimate, OutputExpectation } from "@/components/InfoCard";
import { 
  createJob, 
  fetchBrands, 
  fetchModels, 
  fetchBriefPresets,
  type BriefPreset,
} from "@/lib/api";
import { useLastGeneration } from "@/hooks/useLastGeneration";
import type { WideVideoProjectType } from "@/types/job";

type GenerationOption = "none" | "last" | "paste";
type BriefOption = "none" | "preset" | "key";

const PROJECT_TYPES: { value: WideVideoProjectType; label: string }[] = [
  { value: "high-rise", label: "High-rise" },
  { value: "single-family", label: "Single-family" },
  { value: "townhouse", label: "Townhouse" },
];

export default function FullReelToolPage() {
  const router = useRouter();
  const { lastId } = useLastGeneration();
  const [brandId, setBrandId] = useState("");
  const [brands, setBrands] = useState<Array<{ key: string; display_name: string }>>([]);
  const [projectType, setProjectType] = useState<WideVideoProjectType>("single-family");
  const [theme, setTheme] = useState("");
  const [useGeneration, setUseGeneration] = useState<GenerationOption>("none");
  const [pasteId, setPasteId] = useState("");
  const [modelKey, setModelKey] = useState("");
  const [models, setModels] = useState<import("@/lib/api").ApiModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Brief mode state
  const [briefOption, setBriefOption] = useState<BriefOption>("none");
  const [briefPresets, setBriefPresets] = useState<BriefPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [briefKey, setBriefKey] = useState("");

  useEffect(() => {
    fetchModels().then((r) => {
      if ("data" in r) setModels(r.data.filter((m) => m.formats_supported.includes("wide_video_kit")));
    });
    fetchBrands().then((r) => {
      if ("data" in r) {
        setBrands(r.data);
        if (r.data.length > 0 && !brandId) setBrandId(r.data[0]!.key);
      }
    });
    fetchBriefPresets().then((r) => {
      if ("data" in r) setBriefPresets(r.data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandId) {
      setError("Select a brand");
      return;
    }
    setLoading(true);
    setError(null);
    const payload: Record<string, unknown> = {
      brand_key: brandId,
      brand: brandId,
      format: "wide_video_kit",
      objective: "lead_generation",
      hook_type: "contrast",
      aspect_ratio: "16:9",
      wide_video_project_type: projectType,
      variables: { theme: theme || "Design Your Light" },
    };
    if (modelKey) payload.model_key = modelKey;
    const genId = useGeneration === "last" ? lastId ?? undefined : useGeneration === "paste" ? pasteId || undefined : undefined;
    if (genId) payload.generation_id = genId;
    
    // Add brief mode to payload
    if (briefOption === "preset" && selectedPreset) {
      payload.preset_id = selectedPreset;
    } else if (briefOption === "key" && briefKey) {
      payload.brief_key = briefKey;
    }
    
    const result = await createJob(payload);
    setLoading(false);
    if ("data" in result) {
      router.push(`/jobs/${result.data.id}`);
    } else {
      setError(result.error ?? "Failed to create job");
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/tools" className="hover:text-zinc-300">Tools</Link>
        <span>/</span>
        <span className="text-zinc-300">Full Reel</span>
      </div>
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Generate Full Reel</h1>
        <p className="mt-1 text-sm text-zinc-400">
          16:9 showcase video with voiceover and music. Uses Wide Video Kit template.
        </p>
      </div>
      
      <OutputExpectation 
        title="What you'll get"
        items={[
          { label: "16:9 landscape video (MP4)", status: "included" },
          { label: "Text overlays on each shot", status: "included", note: "auto-generated" },
          { label: "Background music", status: "included", note: "AI-generated" },
          { label: "Voiceover narration", status: "included", note: "ElevenLabs" },
          { label: "Branded end frame with CTA", status: "included" },
        ]}
      />
      
      <CostEstimate items={[
        { label: "Voiceover (ElevenLabs)", cost: "~$0.03" },
        { label: "Music (MusicGen)", cost: "~$0.08" },
        { label: "Video rendering", cost: "Free", note: "Remotion" },
      ]} />
      
      <InfoCard title="Generation time" storageKey="full-reel-time-dismissed">
        Takes 1-3 minutes. You can track progress in real-time on the job page.
      </InfoCard>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Brand</label>
          <BrandSelector value={brandId} onChange={setBrandId} brands={brands} />
        </div>
        {models.length > 1 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">Model</label>
            <select
              value={modelKey}
              onChange={(e) => setModelKey(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
            >
              <option value="">Default</option>
              {models.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.key} — {m.short_description} · {m.cost_tier}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Use generation</label>
          <select
            value={useGeneration}
            onChange={(e) => setUseGeneration(e.target.value as GenerationOption)}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
          >
            <option value="none">None</option>
            <option value="last" disabled={!lastId}>Last generation</option>
            <option value="paste">Paste ID</option>
          </select>
          {useGeneration === "paste" && (
            <input
              type="text"
              value={pasteId}
              onChange={(e) => setPasteId(e.target.value)}
              placeholder="Generation ID"
              className="mt-2 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
            />
          )}
        </div>
        
        {/* Brief Mode - Testing without full LLM generation */}
        <div className="rounded border border-zinc-700/50 bg-zinc-900/30 p-3">
          <label className="mb-2 block text-sm font-medium text-zinc-400">
            Creative Brief Mode
            <span className="ml-2 text-xs font-normal text-zinc-500">(Testing)</span>
          </label>
          <select
            value={briefOption}
            onChange={(e) => setBriefOption(e.target.value as BriefOption)}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
          >
            <option value="none">Use full LLM generation</option>
            <option value="preset">Use preset brief (free)</option>
            <option value="key">Use cached brief key</option>
          </select>
          
          {briefOption === "preset" && (
            <div className="mt-2">
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
              >
                <option value="">Select a preset</option>
                {briefPresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id}: {p.concept}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-zinc-500">
                Presets are free - no LLM tokens used
              </p>
            </div>
          )}
          
          {briefOption === "key" && (
            <div className="mt-2">
              <input
                type="text"
                value={briefKey}
                onChange={(e) => setBriefKey(e.target.value)}
                placeholder="e.g., abc123def456"
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none font-mono"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Use a cached brief from a previous generation
              </p>
            </div>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Project type</label>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value as WideVideoProjectType)}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
          >
            {PROJECT_TYPES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Theme</label>
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Design Your Light"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={!brandId || loading}
          className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Generate Reel"}
        </button>
      </form>
    </div>
  );
}
