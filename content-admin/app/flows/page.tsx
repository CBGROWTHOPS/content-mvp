"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BrandSelector } from "@/components/BrandSelector";
import { fetchBrands, fetchBrand, runFlow, type BrandProfile } from "@/lib/api";
import { getPresetOptions } from "@/lib/presetUtils";

const PRESET_IDS = [
  "lead_gen_high_rise",
  "awareness_modern_build",
  "motorized_upgrade",
  "builder_grade_upgrade",
  "waterfront_luxury",
];

const flowSpecs = [
  { id: "image-ad-pack", title: "Image Ad Pack", desc: "Marketing + image job (4:5)", fields: ["creativeAngle"] },
  { id: "reel-campaign", title: "Reel Campaign", desc: "Full content + reel job", fields: ["directionLevel", "templateType"] },
  { id: "content-batch", title: "Content Batch", desc: "N generations at once", fields: ["contentCount"] },
  { id: "landing-hero", title: "Landing Hero Pack", desc: "Hero copy + image prompt", fields: ["pageType"] },
  { id: "seasonal-campaign", title: "Seasonal Campaign", desc: "Multi-channel campaign", fields: ["event", "audience"] },
];

const inputClass =
  "w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none";

export default function FlowsPage() {
  const [brandId, setBrandId] = useState("");
  const [brands, setBrands] = useState<Array<{ key: string; display_name: string }>>([]);
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [presetId, setPresetId] = useState(PRESET_IDS[0] ?? "lead_gen_high_rise");
  const [creativeAngle, setCreativeAngle] = useState("");
  const [contentCount, setContentCount] = useState(3);
  const [event, setEvent] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands().then((r) => {
      if ("data" in r) {
        setBrands(r.data);
        if (r.data.length > 0 && !brandId) setBrandId(r.data[0]!.key);
      }
    });
  }, []);

  useEffect(() => {
    if (!brandId) { setBrand(null); return; }
    fetchBrand(brandId).then((r) => setBrand("data" in r ? r.data : null));
  }, [brandId]);

  const presetOptions = brand ? getPresetOptions(brand) : PRESET_IDS.map((id) => ({ id, label: id.replace(/_/g, " ") }));

  const handleRun = async (flowId: string) => {
    if (!brandId) return;
    setLoading(flowId);
    setError(null);
    setResult(null);
    const body: Record<string, unknown> = { brandId, strategyPresetId: presetId };
    if (flowId === "image-ad-pack" && creativeAngle) body.creativeAngle = creativeAngle;
    if (flowId === "content-batch") body.contentCount = contentCount;
    if (flowId === "seasonal-campaign") {
      if (event) body.event = event;
      body.audience = "affluent_homeowner";
    }
    const res = await runFlow(flowId, body);
    setLoading(null);
    if ("data" in res) setResult(res.data);
    else setError(res.error ?? "Failed");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Flows</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Orchestrated production pipelines. One generationId, optional Jobs and Assets.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Brand</label>
          <BrandSelector value={brandId} onChange={setBrandId} brands={brands} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Strategy Preset</label>
          <select value={presetId} onChange={(e) => setPresetId(e.target.value)} className={inputClass}>
            {presetOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {flowSpecs.map((f) => (
          <div
            key={f.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5"
          >
            <h2 className="font-medium text-zinc-100">{f.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{f.desc}</p>
            {f.fields.includes("creativeAngle") && (
              <input
                type="text"
                value={creativeAngle}
                onChange={(e) => setCreativeAngle(e.target.value)}
                placeholder="Creative angle (optional)"
                className={`${inputClass} mt-3`}
              />
            )}
            {f.fields.includes("contentCount") && (
              <input
                type="number"
                min={1}
                max={10}
                value={contentCount}
                onChange={(e) => setContentCount(Number(e.target.value) || 1)}
                className={`${inputClass} mt-3`}
              />
            )}
            {f.fields.includes("event") && (
              <input
                type="text"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="Event (e.g. Summer Sale)"
                className={`${inputClass} mt-3`}
              />
            )}
            <button
              type="button"
              onClick={() => handleRun(f.id)}
              disabled={!brandId || loading !== null}
              className="mt-4 rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading === f.id ? "Running…" : "Run"}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
          <h3 className="text-sm font-medium text-zinc-400">Result</h3>
          <pre className="overflow-x-auto rounded bg-zinc-900/80 p-3 text-xs text-zinc-300">
            {JSON.stringify(result, null, 2)}
          </pre>
          {result.jobIds && Array.isArray(result.jobIds) && (result.jobIds as string[]).length > 0 ? (
            <p className="text-sm text-zinc-400">
              Jobs: {(result.jobIds as string[]).map((id) => (
                <Link key={id} href={`/jobs/${id}`} className="ml-1 underline hover:text-white">{id}</Link>
              ))}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
