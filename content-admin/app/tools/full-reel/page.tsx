"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandSelector } from "@/components/BrandSelector";
import { createJob, fetchBrands } from "@/lib/api";
import type { WideVideoProjectType } from "@/types/job";

const PROJECT_TYPES: { value: WideVideoProjectType; label: string }[] = [
  { value: "high-rise", label: "High-rise" },
  { value: "single-family", label: "Single-family" },
  { value: "townhouse", label: "Townhouse" },
];

export default function FullReelToolPage() {
  const router = useRouter();
  const [brandId, setBrandId] = useState("");
  const [brands, setBrands] = useState<Array<{ key: string; display_name: string }>>([]);
  const [projectType, setProjectType] = useState<WideVideoProjectType>("single-family");
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    const result = await createJob({
      brand_key: brandId,
      brand: brandId,
      format: "wide_video_kit",
      objective: "lead_generation",
      hook_type: "contrast",
      aspect_ratio: "16:9",
      wide_video_project_type: projectType,
      variables: { theme: theme || "Design Your Light" },
    });
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
          16:9 showcase video. Uses Wide Video Kit template.
        </p>
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
