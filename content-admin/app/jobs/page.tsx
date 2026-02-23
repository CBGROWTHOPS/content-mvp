"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchJobs } from "@/lib/api";
import type { JobListItem, JobStatus } from "@/types/job";

const STATUS_COLORS: Record<JobStatus, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    pending: "Queued",
    processing: "Processing",
    completed: "Completed",
    failed: "Failed",
  };
  return map[s] ?? s;
};

const formatDate = (d: string) =>
  new Date(d).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });

export default function LogsPage() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchJobs();
      if (cancelled) return;
      setLoading(false);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setJobs((result.data as JobListItem[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-6">
        <p className="text-red-400">{error}</p>
        <p className="mt-2 text-sm text-zinc-500">
          Ensure NEXT_PUBLIC_API_URL points to your Railway backend.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Logs</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Generated images and videos. Click to view or download.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <p className="text-zinc-500">No generations yet.</p>
          <p className="mt-2 text-sm text-zinc-500">
            Use <Link href="/tools" className="text-zinc-400 underline hover:text-white">Tools</Link> to create images or reels.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <Link
              key={j.id}
              href={`/jobs/${j.id}`}
              className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-600 hover:bg-zinc-900/80"
            >
              {/* Preview */}
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded border border-zinc-800 bg-zinc-900">
                {j.primary_asset?.url && j.status === "completed" ? (
                  j.primary_asset.type === "video" ? (
                    <video
                      src={j.primary_asset.url}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={j.primary_asset.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl text-zinc-600">
                    {j.status === "completed" ? "✓" : j.status === "failed" ? "✕" : "…"}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-zinc-200">{j.brand}</span>
                  <span className="text-xs text-zinc-500">·</span>
                  <span className="text-sm text-zinc-400 capitalize">{j.format.replace(/_/g, " ")}</span>
                  {j.hook_type && (
                    <>
                      <span className="text-xs text-zinc-500">·</span>
                      <span className="text-sm text-zinc-500 capitalize">{j.hook_type.replace(/_/g, " ")}</span>
                    </>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">{formatDate(j.created_at)}</p>
              </div>

              {/* Status */}
              <span
                className={`shrink-0 rounded border px-2 py-1 text-xs font-medium ${
                  STATUS_COLORS[j.status as JobStatus] ?? "bg-zinc-500/20 text-zinc-400"
                }`}
              >
                {statusLabel(j.status)}
              </span>

              {/* Link indicator */}
              <span className="shrink-0 text-zinc-500">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
