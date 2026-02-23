"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createJob, fetchModels, type ApiModel } from "@/lib/api";
import type {
  JobInput,
  JobFormat,
  JobObjective,
  HookType,
  AspectRatio,
  Collection,
  ReelKitHookType,
  WideVideoProjectType,
} from "@/types/job";

const FORMATS: { value: JobFormat; label: string }[] = [
  { value: "reel", label: "Reel" },
  { value: "image", label: "Image" },
  { value: "image_kit", label: "Image Kit (4:5)" },
  { value: "reel_kit", label: "Reel Kit (9:16)" },
  { value: "wide_video_kit", label: "Wide Video Kit (16:9)" },
];

const COLLECTIONS: { value: Collection; label: string }[] = [
  { value: "sheer", label: "SHEER" },
  { value: "soft", label: "SOFT" },
  { value: "dark", label: "DARK" },
  { value: "smart", label: "SMART" },
];

const REEL_KIT_HOOKS: { value: ReelKitHookType; label: string }[] = [
  { value: "contrast", label: "Contrast" },
  { value: "concept", label: "Concept" },
  { value: "motorized_demo", label: "Motorized demo" },
];

const WIDE_VIDEO_PROJECTS: { value: WideVideoProjectType; label: string }[] = [
  { value: "high-rise", label: "High-rise" },
  { value: "single-family", label: "Single-family" },
  { value: "townhouse", label: "Townhouse" },
];

const OBJECTIVES: { value: JobObjective; label: string }[] = [
  { value: "lead_generation", label: "Lead Generation" },
  { value: "engagement", label: "Engagement" },
  { value: "awareness", label: "Awareness" },
  { value: "conversion", label: "Conversion" },
];

const HOOK_TYPES: { value: HookType; label: string }[] = [
  { value: "contrast", label: "Contrast" },
  { value: "question", label: "Question" },
  { value: "pain_point", label: "Pain Point" },
  { value: "statistic", label: "Statistic" },
  { value: "story", label: "Story" },
];

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "1:1", label: "1:1" },
  { value: "4:5", label: "4:5" },
  { value: "9:16", label: "9:16" },
  { value: "16:9", label: "16:9" },
];

const REEL_VARIABLES = { location: "", product: "", cta: "" };
const IMAGE_VARIABLES = { product: "", style: "", cta: "" };
const IMAGE_KIT_VARIABLES = { body: "" };
const REEL_KIT_VARIABLES = { concept: "" };
const WIDE_VIDEO_KIT_VARIABLES = { theme: "" };

const REEL_VARIABLES_JSON = JSON.stringify(REEL_VARIABLES, null, 2);
const IMAGE_VARIABLES_JSON = JSON.stringify(IMAGE_VARIABLES, null, 2);
const IMAGE_KIT_VARIABLES_JSON = JSON.stringify(IMAGE_KIT_VARIABLES, null, 2);
const REEL_KIT_VARIABLES_JSON = JSON.stringify(REEL_KIT_VARIABLES, null, 2);
const WIDE_VIDEO_KIT_VARIABLES_JSON = JSON.stringify(
  WIDE_VIDEO_KIT_VARIABLES,
  null,
  2
);

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variablesError, setVariablesError] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<JobInput>>({
    brand: "",
    format: "reel",
    length_seconds: 6,
    scene_structure: 2,
    aspect_ratio: "1:1",
    objective: "lead_generation",
    hook_type: "contrast",
    model_key: undefined,
    variables: {},
  });
  const [variablesRaw, setVariablesRaw] = useState(REEL_VARIABLES_JSON);
  const [models, setModels] = useState<ApiModel[]>([]);
  const [useDefaultModel, setUseDefaultModel] = useState(true);

  useEffect(() => {
    fetchModels().then((r) => {
      if ("data" in r) setModels(r.data);
    });
  }, []);

  useEffect(() => {
    const v =
      form.format === "image"
        ? IMAGE_VARIABLES_JSON
        : form.format === "image_kit"
          ? IMAGE_KIT_VARIABLES_JSON
          : form.format === "reel_kit"
            ? REEL_KIT_VARIABLES_JSON
            : form.format === "wide_video_kit"
              ? WIDE_VIDEO_KIT_VARIABLES_JSON
              : REEL_VARIABLES_JSON;
    setVariablesRaw(v);
  }, [form.format]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVariablesError(null);

    let variables: Record<string, string | number | boolean>;
    try {
      variables = JSON.parse(variablesRaw);
      if (typeof variables !== "object" || variables === null || Array.isArray(variables)) {
        setVariablesError("Must be a JSON object");
        return;
      }
    } catch {
      setVariablesError("Invalid JSON");
      return;
    }

    const basePayload: Partial<JobInput> = {
      brand: form.brand ?? "",
      format: form.format ?? "reel",
      objective: form.objective ?? "lead_generation",
      hook_type: form.hook_type ?? "contrast",
      variables,
    };

    const fmt = form.format ?? "reel";
    if (fmt !== "reel" && fmt !== "image" && fmt !== "story" && fmt !== "post") {
      basePayload.objective = "lead_generation";
      basePayload.hook_type = "contrast";
    }

    if (!useDefaultModel && form.model_key) {
      basePayload.model_key = form.model_key;
    }

    let payload: Record<string, unknown>;
    if (form.format === "image") {
      payload = {
        ...basePayload,
        aspect_ratio: form.aspect_ratio ?? "1:1",
      };
    } else if (form.format === "image_kit") {
      payload = {
        ...basePayload,
        aspect_ratio: "4:5",
        collection: form.collection,
      };
    } else if (form.format === "reel_kit") {
      payload = {
        ...basePayload,
        aspect_ratio: "9:16",
        length_seconds: Number(form.length_seconds) || 6,
        reel_kit_hook_type: form.reel_kit_hook_type ?? "contrast",
      };
    } else if (form.format === "wide_video_kit") {
      payload = {
        ...basePayload,
        aspect_ratio: "16:9",
        wide_video_project_type: form.wide_video_project_type ?? "single-family",
      };
    } else {
      payload = {
        ...basePayload,
        length_seconds: Number(form.length_seconds) || 6,
        scene_structure: Number(form.scene_structure) || 2,
      };
    }

    if (!payload.brand) {
      setError("Brand is required");
      return;
    }

    setLoading(true);
    const result = await createJob(payload as object);
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    router.push(`/jobs/${result.data.id}`);
  };

  const isReel = form.format === "reel";
  const isImage = form.format === "image";
  const isImageKit = form.format === "image_kit";
  const isReelKit = form.format === "reel_kit";
  const isWideVideoKit = form.format === "wide_video_kit";
  const isMvpFormat = isReel || isImage;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      <h1 className="mb-6 text-xl font-semibold">New Job</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">
            Brand
          </label>
          <input
            type="text"
            value={form.brand}
            onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            placeholder="e.g. NA Blinds"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">
            Format
          </label>
          <select
            value={form.format}
            onChange={(e) =>
              setForm((p) => ({ ...p, format: e.target.value as JobFormat }))
            }
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          >
            {FORMATS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {isImageKit && (
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">
              Collection
            </label>
            <select
              value={form.collection ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  collection: (e.target.value || undefined) as Collection | undefined,
                }))
              }
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            >
              <option value="">None</option>
              {COLLECTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {isReelKit && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                Length (seconds)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={form.length_seconds ?? 6}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    length_seconds: parseInt(e.target.value, 10) || 6,
                  }))
                }
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                Hook type
              </label>
              <select
                value={form.reel_kit_hook_type ?? "contrast"}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    reel_kit_hook_type: e.target.value as ReelKitHookType,
                  }))
                }
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              >
                {REEL_KIT_HOOKS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {isWideVideoKit && (
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">
              Project type
            </label>
            <select
              value={form.wide_video_project_type ?? "single-family"}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  wide_video_project_type: e.target.value as WideVideoProjectType,
                }))
              }
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            >
              {WIDE_VIDEO_PROJECTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {isReel && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                Length (seconds)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={form.length_seconds}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    length_seconds: parseInt(e.target.value, 10) || 6,
                  }))
                }
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                Scene count
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.scene_structure}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    scene_structure: parseInt(e.target.value, 10) || 2,
                  }))
                }
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
          </>
        )}

        {isImage && (
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">
              Aspect ratio
            </label>
            <select
              value={form.aspect_ratio}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  aspect_ratio: e.target.value as AspectRatio,
                }))
              }
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            >
              {ASPECT_RATIOS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {isMvpFormat && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                Objective
              </label>
              <select
                value={form.objective}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    objective: e.target.value as JobObjective,
                  }))
                }
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              >
                {OBJECTIVES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                Hook Type
              </label>
              <select
                value={form.hook_type}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    hook_type: e.target.value as HookType,
                  }))
                }
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              >
                {HOOK_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div>
          <div className="mb-2 flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="model-mode"
                checked={useDefaultModel}
                onChange={() => setUseDefaultModel(true)}
                className="rounded-full border-zinc-600 bg-zinc-800 text-zinc-100 focus:ring-zinc-500"
              />
              <span className="text-sm text-zinc-300">Use default model</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="model-mode"
                checked={!useDefaultModel}
                onChange={() => setUseDefaultModel(false)}
                className="rounded-full border-zinc-600 bg-zinc-800 text-zinc-100 focus:ring-zinc-500"
              />
              <span className="text-sm text-zinc-300">Advanced: Choose model</span>
            </label>
          </div>
          {!useDefaultModel && (
            <div className="space-y-1.5">
              <select
                value={form.model_key ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    model_key: e.target.value || undefined,
                  }))
                }
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              >
                <option value="">Select model…</option>
                {models
                  .filter((m) => m.formats_supported.includes(form.format ?? "reel"))
                  .map((m) => {
                    const isDefault =
                      m.default_for_format[form.format ?? "reel"] ?? false;
                    return (
                      <option key={m.key} value={m.key}>
                        {m.key} — {m.short_description} · {m.cost_tier}
                        {isDefault ? " (recommended)" : ""}
                      </option>
                    );
                  })}
              </select>
              {form.model_key && (() => {
                const m = models.find((x) => x.key === form.model_key);
                return m?.replicate_page_url ? (
                  <a
                    href={m.replicate_page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    view model →
                  </a>
                ) : null;
              })()}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">
            Variables (JSON)
          </label>
          <textarea
            value={variablesRaw}
            onChange={(e) => setVariablesRaw(e.target.value)}
            rows={6}
            className={`w-full font-mono text-sm rounded border bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 ${
              variablesError
                ? "border-red-700 focus:border-red-600 focus:ring-red-600"
                : "border-zinc-700 focus:border-zinc-600 focus:ring-zinc-600"
            }`}
            placeholder={
              isImage
                ? '{"product": "...", "style": "...", "cta": "..."}'
                : isImageKit
                  ? '{"body": "Architectural window treatment in modern space"}'
                  : isReelKit
                    ? '{"concept": "Design Your Light"}'
                    : isWideVideoKit
                      ? '{"theme": "Design Your Light"}'
                      : '{"location": "...", "product": "...", "cta": "..."}'
            }
          />
          {variablesError && (
            <p className="mt-1 text-sm text-red-400">{variablesError}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Create Job"}
          </button>
          <a
            href="/jobs"
            className="rounded border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
