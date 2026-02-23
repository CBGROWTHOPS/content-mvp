"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandSelector } from "@/components/BrandSelector";
import { createJob, fetchBrands, fetchModels } from "@/lib/api";
import { useLastGeneration } from "@/hooks/useLastGeneration";
import type { ReelKitHookType } from "@/types/job";

const HOOKS: { value: ReelKitHookType; label: string }[] = [
  { value: "contrast", label: "Contrast" },
  { value: "concept", label: "Concept" },
  { value: "motorized_demo", label: "Motorized demo" },
];

type GenerationOption = "none" | "last" | "paste";

export default function SingleReelClipToolPage() {
  const router = useRouter();
  const { lastId } = useLastGeneration();
  const [brandId, setBrandId] = useState("");
  const [brands, setBrands] = useState<Array<{ key: string; display_name: string }>>([]);
  const [hookType, setHookType] = useState<ReelKitHookType>("contrast");
  const [concept, setConcept] = useState("");
  const [modelKey, setModelKey] = useState("");
  const [models, setModels] = useState<import("@/lib/api").ApiModel[]>([]);
  const [useGeneration, setUseGeneration] = useState<GenerationOption>("none");
  const [pasteId, setPasteId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModels().then((r) => {
      if ("data" in r) setModels(r.data.filter((m) => m.formats_supported.includes("reel_kit")));
    });
    fetchBrands().then((r) => {
      if ("data" in r) {
        setBrands(r.data);
        if (r.data.length > 0 && !brandId) setBrandId(r.data[0]!.key);
      }
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
      format: "reel_kit",
      objective: "lead_generation",
      hook_type: "contrast",
      aspect_ratio: "9:16",
      length_seconds: 6,
      reel_kit_hook_type: hookType,
      variables: { concept: concept || "Design Your Light" },
    };
    if (modelKey) payload.model_key = modelKey;
    const genId = useGeneration === "last" ? lastId ?? undefined : useGeneration === "paste" ? pasteId || undefined : undefined;
    if (genId) payload.generation_id = genId;
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
        <span className="text-zinc-300">Single Reel Clip</span>
      </div>
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Generate Single Reel Clip</h1>
        <p className="mt-1 text-sm text-zinc-400">
          6-second 9:16 clip. Uses Reel Kit template.
        </p>
        <div className="mt-3 rounded border border-zinc-800/50 bg-zinc-900/30 px-3 py-2 text-xs text-zinc-500">
          <strong className="text-zinc-400">How it works:</strong> Pick brand, hook type, and concept. Queues a job; result appears in <Link href="/jobs" className="text-zinc-400 underline hover:text-white">Logs</Link>.
        </div>
      </div>
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
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Hook type</label>
          <select
            value={hookType}
            onChange={(e) => setHookType(e.target.value as ReelKitHookType)}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
          >
            {HOOKS.map((h) => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Concept</label>
          <input
            type="text"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Design Your Light"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={!brandId || loading}
          className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Generate Clip"}
        </button>
      </form>
    </div>
  );
}
