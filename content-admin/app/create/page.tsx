"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  fetchBrandKits,
  generateContent,
  createJob,
  type BrandKit,
} from "@/lib/api";

const FUNNEL_STAGES = [
  {
    id: "tof",
    label: "TOF",
    desc: "Cold audience, build awareness",
    color: "bg-emerald-500",
  },
  {
    id: "mof",
    label: "MOF",
    desc: "Warm audience, build consideration",
    color: "bg-amber-500",
  },
  {
    id: "bof",
    label: "BOF",
    desc: "Hot audience, drive action",
    color: "bg-rose-500",
  },
];

const CONTENT_INTENTS: Record<
  string,
  Array<{ id: string; label: string; desc: string; icon: string }>
> = {
  tof: [
    { id: "tof_awareness", label: "Awareness", desc: "Introduce brand", icon: "👁" },
    { id: "tof_education", label: "Education", desc: "Teach value", icon: "📚" },
    { id: "tof_entertainment", label: "Entertainment", desc: "Engage & delight", icon: "✨" },
    { id: "tof_authority", label: "Authority", desc: "Establish expertise", icon: "🏆" },
  ],
  mof: [
    { id: "mof_consideration", label: "Consideration", desc: "Compare options", icon: "⚖" },
    { id: "mof_social_proof", label: "Social Proof", desc: "Reviews & testimonials", icon: "💬" },
    { id: "mof_retargeting", label: "Retargeting", desc: "Re-engage visitors", icon: "🔄" },
  ],
  bof: [
    { id: "bof_lead_gen", label: "Lead Gen", desc: "Capture contacts", icon: "📧" },
    { id: "bof_conversion", label: "Conversion", desc: "Drive purchase", icon: "🛒" },
    { id: "bof_urgency", label: "Urgency", desc: "Limited offer", icon: "⏰" },
  ],
};

const FORMATS = [
  { id: "reel_kit", label: "Reel (9:16)", showDuration: true },
  { id: "static_ad", label: "Static Ad (4:5)", showDuration: false },
  { id: "image_kit", label: "Image Kit", showDuration: false },
  { id: "wide_video_kit", label: "Wide Video (16:9)", showDuration: true },
];

const inputClass =
  "w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none";

export default function CreatePage() {
  const [step, setStep] = useState(1);
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [selectedKit, setSelectedKit] = useState<BrandKit | null>(null);
  const [quickMode, setQuickMode] = useState({ name: "", niche: "" });
  const [funnelStage, setFunnelStage] = useState<string | null>(null);
  const [contentIntent, setContentIntent] = useState<string | null>(null);
  const [format, setFormat] = useState<string | null>(null);
  const [duration, setDuration] = useState<15 | 30>(15);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    jobId: string;
    estimatedTime?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBrandKits().then((r) => {
      if ("data" in r) setBrandKits(r.data);
    });
  }, []);

  const useBrandKit = !!selectedKit;
  const brandKey = useBrandKit ? selectedKit?.slug ?? "" : quickMode.name ? quickMode.name.toLowerCase().replace(/\s+/g, "-") : "";

  const canProceedStep1 =
    (selectedKit !== null) ||
    (quickMode.name.trim() !== "" && quickMode.niche.trim() !== "");

  const canProceedStep2 = !!funnelStage;
  const canProceedStep3 = !!contentIntent;
  const canProceedStep4 = !!format;

  const handleGenerate = async () => {
    if (!brandKey) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const strategySelection = {
        campaignObjective: funnelStage === "bof" ? "lead_generation" : "awareness",
        audienceContext: "default",
        propertyType: "single_family",
        visualEnergy: "calm",
        hookFramework: "contrast",
        platformFormat: format === "static_ad" ? "image_kit" : (format ?? "reel_kit"),
        directionLevel: "director" as const,
        funnelStage: funnelStage ?? undefined,
        contentIntent: contentIntent ?? undefined,
      };

      const contentRes = await generateContent(
        brandKey,
        strategySelection,
        { funnel_stage: funnelStage ?? undefined, content_intent: contentIntent ?? undefined }
      );
      if ("error" in contentRes) {
        setError(contentRes.error);
        setLoading(false);
        return;
      }
      const gen = contentRes.data as { generationId?: string };
      const generationId = gen.generationId ?? null;

      const payload: Record<string, unknown> = {
        brand_key: brandKey,
        format: format === "static_ad" ? "image_kit" : format ?? "reel_kit",
        objective: funnelStage === "bof" ? "lead_generation" : "awareness",
        hook_type: "contrast",
        length_seconds: (format === "reel_kit" || format === "wide_video_kit") ? duration : undefined,
        variables: {},
        funnel_stage: funnelStage ?? undefined,
        content_intent: contentIntent ?? undefined,
      };
      if (format === "image_kit" || format === "static_ad") {
        payload.aspect_ratio = "4:5";
      }
      if (format === "wide_video_kit") {
        payload.aspect_ratio = "16:9";
      }
      if (generationId) {
        payload.generation_id = generationId;
      }
      if (format === "reel_kit" || format === "wide_video_kit") {
        payload.length_seconds = duration;
        payload.scene_structure = duration === 15 ? 6 : 8;
      }

      const jobRes = await createJob(payload);
      if ("error" in jobRes) {
        setError(jobRes.error);
        setLoading(false);
        return;
      }
      setResult({
        jobId: jobRes.data.id,
        estimatedTime: "2–5 min",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Create Content</h1>
        <p className="mt-1 text-sm text-zinc-500">
          5-step wizard. Select brand, funnel stage, intent, format, then generate.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(s)}
            className={`h-2 flex-1 rounded ${
              s === step ? "bg-zinc-400" : s < step ? "bg-zinc-600" : "bg-zinc-800"
            }`}
            aria-label={`Step ${s}`}
          />
        ))}
      </div>

      {/* Step 1 — Brand & Audience */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-200">Brand & Audience</h2>
          <p className="text-sm text-zinc-500">Choose a brand kit or use Quick Mode.</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {brandKits.map((kit) => (
              <button
                key={kit.id}
                type="button"
                onClick={() => {
                  setSelectedKit(kit);
                  setQuickMode({ name: "", niche: "" });
                }}
                className={`rounded-lg border p-4 text-left transition ${
                  selectedKit?.id === kit.id
                    ? "border-zinc-500 bg-zinc-800"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                }`}
              >
                <div className="font-medium text-zinc-100">{kit.name}</div>
                <div className="mt-0.5 text-sm text-zinc-500">{kit.niche}</div>
                {kit.icp && typeof kit.icp === "object" && "description" in kit.icp && (
                  <div className="mt-1 text-xs text-zinc-600">
                    {(kit.icp as { description?: string }).description}
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="mb-2 text-sm font-medium text-zinc-400">Quick Mode</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Business Name"
                value={quickMode.name}
                onChange={(e) => {
                  setQuickMode((p) => ({ ...p, name: e.target.value }));
                  setSelectedKit(null);
                }}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Niche"
                value={quickMode.niche}
                onChange={(e) => {
                  setQuickMode((p) => ({ ...p, niche: e.target.value }));
                  setSelectedKit(null);
                }}
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Step 2 — Funnel Stage */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-200">Funnel Stage</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {FUNNEL_STAGES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setFunnelStage(s.id);
                  setContentIntent(null);
                }}
                className={`flex items-start gap-3 rounded-lg border p-4 text-left transition ${
                  funnelStage === s.id
                    ? "border-zinc-500 bg-zinc-800"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                }`}
              >
                <span className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${s.color}`} />
                <div>
                  <div className="font-medium text-zinc-100">{s.label}</div>
                  <div className="text-sm text-zinc-500">{s.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Content Intent */}
      {step === 3 && funnelStage && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-200">Content Intent</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(CONTENT_INTENTS[funnelStage] ?? []).map((intent) => (
              <button
                key={intent.id}
                type="button"
                onClick={() => setContentIntent(intent.id)}
                className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                  contentIntent === intent.id
                    ? "border-zinc-500 bg-zinc-800"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                }`}
              >
                <span className="text-xl">{intent.icon}</span>
                <div>
                  <div className="font-medium text-zinc-100">{intent.label}</div>
                  <div className="text-xs text-zinc-500">{intent.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              disabled={!canProceedStep3}
              className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Format */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-200">Format</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id)}
                className={`rounded-lg border p-4 text-left transition ${
                  format === f.id
                    ? "border-zinc-500 bg-zinc-800"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                }`}
              >
                <div className="font-medium text-zinc-100">{f.label}</div>
                {f.showDuration && format === f.id && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDuration(15);
                      }}
                      className={`rounded px-3 py-1 text-sm ${
                        duration === 15 ? "bg-zinc-600 text-white" : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      15s
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDuration(30);
                      }}
                      className={`rounded px-3 py-1 text-sm ${
                        duration === 30 ? "bg-zinc-600 text-white" : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      30s
                    </button>
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(5)}
              disabled={!canProceedStep4}
              className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 5 — Review & Generate */}
      {step === 5 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-200">Review & Generate</h2>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <dl className="space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="text-zinc-500">Brand:</dt>
                <dd className="text-zinc-200">{useBrandKit ? selectedKit?.name : quickMode.name || "(Quick)"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-zinc-500">Funnel:</dt>
                <dd className="text-zinc-200">{funnelStage?.toUpperCase()}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-zinc-500">Intent:</dt>
                <dd className="text-zinc-200">{contentIntent}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-zinc-500">Format:</dt>
                <dd className="text-zinc-200">
                  {format}
                  {(format === "reel_kit" || format === "wide_video_kit") && ` · ${duration}s`}
                </dd>
              </div>
            </dl>
          </div>

          {error && (
            <div className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded border border-emerald-900/50 bg-emerald-950/30 px-3 py-4 text-sm">
              <p className="font-medium text-emerald-400">Job queued</p>
              <p className="mt-1 text-zinc-400">
                ID: <Link href={`/jobs/${result.jobId}`} className="underline hover:text-white">{result.jobId}</Link>
              </p>
              <p className="text-zinc-500">Est. {result.estimatedTime}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="rounded border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? "Generating…" : "Generate Content"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
