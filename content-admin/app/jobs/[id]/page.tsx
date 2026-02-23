"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchJob, createJob } from "@/lib/api";
import type { JobDetail, Asset } from "@/types/job";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchJob(id);
      if (cancelled) return;
      setLoading(false);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setJob(result.data as JobDetail);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleRegenerate = async () => {
    if (!job?.payload) return;
    setRegenerateError(null);
    setRegenerating(true);

    const payload = {
      brand: job.brand,
      format: job.format,
      length_seconds: job.payload.length_seconds ?? 6,
      objective: job.objective,
      hook_type: job.payload.hook_type ?? "contrast",
      scene_structure: job.payload.scene_structure ?? 2,
      model: job.model,
      variables: job.payload.variables ?? {},
    };

    const result = await createJob(payload);
    setRegenerating(false);

    if ("error" in result) {
      setRegenerateError(result.error);
      return;
    }

    router.push(`/jobs/${result.data.id}`);
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8">
        <p className="text-zinc-500">Loading job…</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-6">
        <p className="text-red-400">{error ?? "Job not found"}</p>
        <Link href="/jobs" className="mt-4 inline-block text-sm text-zinc-400 hover:text-white">
          ← Back to jobs
        </Link>
      </div>
    );
  }

  const primaryAsset = job.assets?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/jobs"
          className="text-sm text-zinc-400 hover:text-white"
        >
          ← Back to jobs
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h1 className="mb-6 text-xl font-semibold">Job {job.id.slice(0, 8)}…</h1>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Brand
            </dt>
            <dd className="mt-1">{job.brand}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Format
            </dt>
            <dd className="mt-1 capitalize">{job.format}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Objective
            </dt>
            <dd className="mt-1 capitalize">
              {String(job.objective).replace(/_/g, " ")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Model
            </dt>
            <dd className="mt-1">{job.model}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Status
            </dt>
            <dd className="mt-1">
              <span
                className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${
                  job.status === "completed"
                    ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                    : job.status === "failed"
                      ? "border-red-500/30 bg-red-500/20 text-red-400"
                      : job.status === "processing"
                        ? "border-blue-500/30 bg-blue-500/20 text-blue-400"
                        : "border-amber-500/30 bg-amber-500/20 text-amber-400"
                }`}
              >
                {job.status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Created
            </dt>
            <dd className="mt-1 text-sm text-zinc-500">
              {new Date(job.created_at).toLocaleString()}
            </dd>
          </div>
        </dl>

        {job.error_message && (
          <div className="mt-4 rounded border border-red-900/50 bg-red-950/30 p-4">
            <dt className="text-xs font-medium uppercase tracking-wider text-red-400">
              Error
            </dt>
            <dd className="mt-1 text-sm text-red-300">{job.error_message}</dd>
          </div>
        )}

        {job.payload && Object.keys(job.payload).length > 0 && (
          <div className="mt-6">
            <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Payload / Variables
            </dt>
            <pre className="mt-2 overflow-x-auto rounded border border-zinc-700 bg-zinc-950 p-4 text-xs text-zinc-400">
              {JSON.stringify(job.payload, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {primaryAsset && (job.status === "completed" || primaryAsset.url) && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-lg font-medium">Output</h2>
          <div className="space-y-4">
            {primaryAsset.type === "video" ? (
              <video
                src={primaryAsset.url}
                controls
                className="max-h-[400px] w-full rounded border border-zinc-700"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={primaryAsset.url}
                alt="Generated content"
                className="max-h-[400px] w-auto rounded border border-zinc-700"
              />
            )}
            <div className="flex gap-3">
              <a
                href={primaryAsset.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}

      {job.status !== "processing" && job.payload && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-lg font-medium">Regenerate</h2>
          {regenerateError && (
            <p className="mb-3 text-sm text-red-400">{regenerateError}</p>
          )}
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="rounded border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
          >
            {regenerating ? "Creating…" : "Regenerate with same payload"}
          </button>
        </div>
      )}
    </div>
  );
}
