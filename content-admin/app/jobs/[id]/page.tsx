"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { fetchJob, createJob } from "@/lib/api";
import type { JobDetail, Asset } from "@/types/job";

const POLL_INTERVAL = 3000;

const PROGRESS_STEPS = [
  { key: "queued", label: "Queued", description: "Waiting for worker" },
  { key: "processing", label: "Starting", description: "Job picked up" },
  { key: "generating_voiceover", label: "Voiceover", description: "Generating narration with ElevenLabs" },
  { key: "generating_music", label: "Music", description: "Creating background track" },
  { key: "generating_video", label: "Video", description: "Generating video clips" },
  { key: "rendering", label: "Rendering", description: "Compositing with Remotion" },
  { key: "uploading", label: "Uploading", description: "Saving to storage" },
  { key: "completed", label: "Complete", description: "Ready to download" },
];

const FORMAT_ESTIMATES: Record<string, { min: number; max: number; label: string }> = {
  image: { min: 10, max: 30, label: "10-30 seconds" },
  image_kit: { min: 15, max: 45, label: "15-45 seconds" },
  reel_kit: { min: 60, max: 180, label: "1-3 minutes" },
  wide_video_kit: { min: 60, max: 180, label: "1-3 minutes" },
  reel: { min: 30, max: 90, label: "30-90 seconds" },
};

function getStepIndex(progressStep: string | undefined, status: string): number {
  if (status === "completed") return PROGRESS_STEPS.length - 1;
  if (status === "failed") return -1;
  if (status === "pending") return 0;
  if (!progressStep) return 1;
  const idx = PROGRESS_STEPS.findIndex(s => s.key === progressStep);
  return idx >= 0 ? idx : 1;
}

function ProgressTracker({ progressStep, status, format }: { progressStep?: string; status: string; format: string }) {
  const currentIndex = getStepIndex(progressStep, status);
  const estimate = FORMAT_ESTIMATES[format] ?? FORMAT_ESTIMATES.reel_kit;
  const isActive = status === "pending" || status === "processing";
  
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Progress</h2>
        {isActive && (
          <span className="text-sm text-zinc-500">
            Est. {estimate.label}
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        {PROGRESS_STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex && isActive;
          const isPending = idx > currentIndex;
          const isFailed = status === "failed" && idx === currentIndex;
          
          return (
            <div key={step.key} className="flex items-center gap-3">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                isCompleted
                  ? "bg-emerald-500/20 text-emerald-400"
                  : isCurrent
                    ? "bg-blue-500/20 text-blue-400 animate-pulse"
                    : isFailed
                      ? "bg-red-500/20 text-red-400"
                      : "bg-zinc-800 text-zinc-600"
              }`}>
                {isCompleted ? "✓" : isFailed ? "✕" : isCurrent ? "●" : "○"}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${
                  isCompleted || isCurrent ? "text-zinc-200" : "text-zinc-600"
                }`}>
                  {step.label}
                </div>
                {isCurrent && (
                  <div className="text-xs text-zinc-500">{step.description}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const loadJob = useCallback(async () => {
    const result = await fetchJob(id);
    if ("error" in result) {
      setError(result.error);
      return null;
    }
    return result.data as JobDetail;
  }, [id]);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await loadJob();
      if (cancelled) return;
      setLoading(false);
      if (data) setJob(data);
    })();
    return () => { cancelled = true; };
  }, [loadJob]);

  // Auto-poll while pending/processing
  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") return;
    
    const interval = setInterval(async () => {
      const data = await loadJob();
      if (data) setJob(data);
    }, POLL_INTERVAL);
    
    return () => clearInterval(interval);
  }, [job?.status, loadJob]);

  // Elapsed time counter
  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") return;
    
    const startTime = new Date(job.created_at).getTime();
    const tick = () => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [job?.created_at, job?.status]);

  const handleRegenerate = async () => {
    if (!job?.payload) return;
    setRegenerateError(null);
    setRegenerating(true);

    const basePayload: Record<string, unknown> = {
      brand: job.brand,
      format: job.format,
      objective: job.objective,
      hook_type: job.payload.hook_type ?? "contrast",
      variables: job.payload.variables ?? {},
    };

    if (job.model) {
      basePayload.model_key = job.model;
    }

    if (job.format === "image") {
      basePayload.aspect_ratio = job.payload.aspect_ratio ?? "1:1";
    } else if (job.format === "image_kit") {
      basePayload.aspect_ratio = "4:5";
      basePayload.collection = job.payload.collection;
    } else if (job.format === "reel_kit") {
      basePayload.aspect_ratio = "9:16";
      basePayload.length_seconds = job.payload.length_seconds ?? 6;
      basePayload.reel_kit_hook_type =
        job.payload.reel_kit_hook_type ?? "contrast";
    } else if (job.format === "wide_video_kit") {
      basePayload.aspect_ratio = "16:9";
      basePayload.wide_video_project_type =
        job.payload.wide_video_project_type ?? "single-family";
    } else if (
      job.format === "reel" ||
      job.format === "story" ||
      job.format === "post"
    ) {
      basePayload.length_seconds = job.payload.length_seconds ?? 6;
      basePayload.scene_structure = job.payload.scene_structure ?? 2;
    }

    const payload = basePayload;

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
          ← Back to logs
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
          ← Back to logs
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
            <dd className="mt-1 flex items-center gap-2">
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
              {(job.status === "pending" || job.status === "processing") && (
                <span className="text-xs text-zinc-500">
                  {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, "0")} elapsed
                </span>
              )}
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
          <details className="mt-6">
            <summary className="cursor-pointer text-xs font-medium uppercase tracking-wider text-zinc-500 hover:text-zinc-400">
              Payload / Variables
            </summary>
            <pre className="mt-2 overflow-x-auto rounded border border-zinc-700 bg-zinc-950 p-4 text-xs text-zinc-400">
              {JSON.stringify(job.payload, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* Progress tracker for active jobs */}
      {(job.status === "pending" || job.status === "processing") && (
        <ProgressTracker 
          progressStep={(job as JobDetail & { progress_step?: string }).progress_step}
          status={job.status}
          format={job.format}
        />
      )}

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
