"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandSelector } from "@/components/BrandSelector";
import { InfoCard, CostEstimate, OutputExpectation } from "@/components/InfoCard";
import { createJob, fetchBrands, fetchModels } from "@/lib/api";
import type { Collection } from "@/types/job";

const COLLECTIONS: { value: Collection; label: string }[] = [
  { value: "sheer", label: "SHEER" },
  { value: "soft", label: "SOFT" },
  { value: "dark", label: "DARK" },
  { value: "smart", label: "SMART" },
];

const ASPECT_RATIOS = [
  { value: "4:5", label: "4:5 — Feed", description: "Instagram/Facebook feed" },
  { value: "9:16", label: "9:16 — Story/Reel", description: "Stories & Reels" },
  { value: "1.91:1", label: "1.91:1 — Landscape", description: "Facebook/Google ads" },
] as const;

type AspectRatio = (typeof ASPECT_RATIOS)[number]["value"];

export default function ImageToolPage() {
  const router = useRouter();
  const [brandId, setBrandId] = useState("");
  const [brands, setBrands] = useState<Array<{ key: string; display_name: string }>>([]);
  const [collection, setCollection] = useState<Collection>("sheer");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4:5");
  const [body, setBody] = useState("");
  const [modelKey, setModelKey] = useState<string>("");
  const [models, setModels] = useState<import("@/lib/api").ApiModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModels().then((r) => {
      if ("data" in r) setModels(r.data.filter((m) => m.formats_supported.includes("image_kit")));
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
      format: "image_kit",
      objective: "lead_generation",
      hook_type: "contrast",
      aspect_ratio: aspectRatio,
      collection,
      variables: { body: body || "Architectural window treatment in modern space" },
    };
    if (modelKey) payload.model_key = modelKey;
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
        <span className="text-zinc-300">Image</span>
      </div>
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Generate Image</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Ad-ready images in multiple formats for feed, stories, and ads.
        </p>
      </div>
      
      <OutputExpectation 
        title="What you'll get"
        items={[
          { label: "Static image (PNG)", status: "included" },
          { label: "Ad-ready aspect ratio", status: "included", note: "4:5, 9:16, or 1.91:1" },
          { label: "Brand-styled visual", status: "included" },
          { label: "Video/animation", status: "not_included" },
          { label: "Text overlays", status: "not_included", note: "image only" },
          { label: "Audio", status: "not_included" },
        ]}
        warning="This generates a static image only. For video with text/audio, use Single Reel Clip or Full Reel."
      />
      
      <CostEstimate items={[
        { label: "Image generation", cost: "~$0.02", note: "Replicate" },
        { label: "Generation time", cost: "15-45 seconds" },
      ]} />
      
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
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Collection</label>
          <select
            value={collection}
            onChange={(e) => setCollection(e.target.value as Collection)}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
          >
            {COLLECTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Aspect Ratio</label>
          <div className="grid grid-cols-3 gap-2">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.value}
                type="button"
                onClick={() => setAspectRatio(ar.value)}
                className={`rounded border px-3 py-2 text-xs transition-colors ${
                  aspectRatio === ar.value
                    ? "border-zinc-500 bg-zinc-800 text-zinc-100"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <div className="font-medium">{ar.value}</div>
                <div className="mt-0.5 text-zinc-500">{ar.description}</div>
              </button>
            ))}
          </div>
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
          <label className="mb-1 block text-sm font-medium text-zinc-400">Description</label>
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Architectural window treatment in modern space"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={!brandId || loading}
          className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Generate Image"}
        </button>
      </form>
    </div>
  );
}
