"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrandKit } from "@/lib/api";

const inputClass =
  "w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none";

export default function NewBrandPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [niche, setNiche] = useState("");
  const [industry, setIndustry] = useState("");
  const [icpDescription, setIcpDescription] = useState("");
  const [voiceTone, setVoiceTone] = useState("");
  const [visualStyle, setVisualStyle] = useState("");
  const [primaryCta, setPrimaryCta] = useState("");
  const [guardrailsText, setGuardrailsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSlugFromName = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/\s+/g, "-")) {
      setSlug(val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !niche) {
      setError("Name, slug, and niche are required");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await createBrandKit({
      name,
      slug,
      niche,
      industry: industry || undefined,
      icp: icpDescription ? { description: icpDescription } : undefined,
      voice: voiceTone ? { tone: voiceTone } : undefined,
      visuals: visualStyle ? { style: visualStyle } : undefined,
      cta_defaults: primaryCta ? { primary: primaryCta } : undefined,
      guardrails: guardrailsText
        ? guardrailsText.split("\n").map((s) => s.trim()).filter(Boolean)
        : undefined,
    });
    setLoading(false);
    if ("data" in res) {
      router.push(`/brands/${res.data.id}`);
    } else {
      setError(res.error ?? "Failed to create");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/brands" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Brands
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-zinc-100">New Brand Kit</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Business Name (required)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleSlugFromName(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Slug (required)</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. my-brand"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Niche (required)</label>
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g. baby/parenting"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Industry</label>
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. affiliate"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">ICP (freeform)</label>
          <textarea
            value={icpDescription}
            onChange={(e) => setIcpDescription(e.target.value)}
            rows={3}
            placeholder="Target audience description"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Voice / Tone</label>
          <textarea
            value={voiceTone}
            onChange={(e) => setVoiceTone(e.target.value)}
            rows={2}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Visual Style</label>
          <textarea
            value={visualStyle}
            onChange={(e) => setVisualStyle(e.target.value)}
            rows={2}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Primary CTA</label>
          <input
            type="text"
            value={primaryCta}
            onChange={(e) => setPrimaryCta(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Guardrails (one per line)</label>
          <textarea
            value={guardrailsText}
            onChange={(e) => setGuardrailsText(e.target.value)}
            rows={3}
            placeholder="No fear-based messaging&#10;Always value-first"
            className={inputClass}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save"}
          </button>
          <Link
            href="/brands"
            className="rounded border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
