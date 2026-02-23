"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/api";
import type { JobInput, JobFormat, JobObjective, HookType } from "@/types/job";

const FORMATS: { value: JobFormat; label: string }[] = [
  { value: "reel", label: "Reel" },
  { value: "image", label: "Image" },
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

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variablesError, setVariablesError] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<JobInput>>({
    brand: "",
    format: "reel",
    length_seconds: 6,
    objective: "lead_generation",
    hook_type: "contrast",
    scene_structure: 2,
    model: "video-model-x",
    variables: {},
  });
  const [variablesRaw, setVariablesRaw] = useState("{\n  \"location\": \"\",\n  \"product\": \"\",\n  \"cta\": \"\"\n}");

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

    const payload: JobInput = {
      brand: form.brand ?? "",
      format: form.format ?? "reel",
      length_seconds: Number(form.length_seconds) || 6,
      objective: form.objective ?? "lead_generation",
      hook_type: form.hook_type ?? "contrast",
      scene_structure: Number(form.scene_structure) || 2,
      model: form.model ?? "",
      variables,
    };

    if (!payload.brand || !payload.model) {
      setError("Brand and model are required");
      return;
    }

    setLoading(true);
    const result = await createJob(payload);
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    router.push(`/jobs/${result.data.id}`);
  };

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
              setForm((p) => ({ ...p, hook_type: e.target.value as HookType }))
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

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">
            Model
          </label>
          <input
            type="text"
            value={form.model}
            onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            placeholder="e.g. video-model-x"
            required
          />
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
            placeholder='{"location": "...", "product": "...", "cta": "..."}'
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
