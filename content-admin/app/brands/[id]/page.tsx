"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchBrandKit, updateBrandKit, type BrandKit } from "@/lib/api";

const inputClass =
  "w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none";

export default function EditBrandPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [kit, setKit] = useState<BrandKit | null>(null);
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetchBrandKit(id).then((r) => {
      if ("data" in r) {
        const k = r.data;
        setKit(k);
        setName(k.name);
        setSlug(k.slug);
        setNiche(k.niche);
        setIndustry(k.industry ?? "");
        setIcpDescription(
          k.icp && typeof k.icp === "object" && "description" in k.icp
            ? (k.icp as { description?: string }).description ?? ""
            : ""
        );
        setVoiceTone(
          k.voice && typeof k.voice === "object" && "tone" in k.voice
            ? (k.voice as { tone?: string }).tone ?? ""
            : ""
        );
        setVisualStyle(
          k.visuals && typeof k.visuals === "object" && "style" in k.visuals
            ? (k.visuals as { style?: string }).style ?? ""
            : ""
        );
        setPrimaryCta(
          k.cta_defaults && typeof k.cta_defaults === "object" && "primary" in k.cta_defaults
            ? (k.cta_defaults as { primary?: string }).primary ?? ""
            : ""
        );
        setGuardrailsText(Array.isArray(k.guardrails) ? k.guardrails.join("\n") : "");
      } else {
        setLoadError(r.error ?? "Not found");
      }
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kit || !name || !slug || !niche) return;
    setLoading(true);
    setSaveError(null);
    const res = await updateBrandKit(kit.id, {
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
      setKit(res.data);
    } else {
      setSaveError(res.error ?? "Failed to save");
    }
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link href="/brands" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Brands
        </Link>
        <div className="rounded border border-red-900/50 bg-red-950/30 p-4 text-red-400">
          {loadError}
        </div>
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/brands" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Brands
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-zinc-100">Edit Brand Kit</h1>
        <p className="text-sm text-zinc-500">{kit.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {saveError && (
          <div className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
            {saveError}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Business Name (required)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">ICP (freeform)</label>
          <textarea
            value={icpDescription}
            onChange={(e) => setIcpDescription(e.target.value)}
            rows={3}
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
