"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchJobs } from "@/lib/api";
import type { JobListItem } from "@/types/job";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  processing: "bg-amber-500/20 text-amber-400 border-amber-500/30",
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

const BRAND_OPTIONS = ["all", "bdn", "gth", "rfj"];
const STAGE_OPTIONS = ["all", "tof", "mof", "bof"];

export default function LibraryPage() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    const params: { funnel_stage?: string } = {};
    if (stageFilter !== "all") params.funnel_stage = stageFilter;
    fetchJobs(params).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      let list = (result.data as JobListItem[]) ?? [];
      if (brandFilter !== "all") {
        list = list.filter((j) => j.brand?.toLowerCase() === brandFilter);
      }
      setJobs(list);
    });
    return () => {
      cancelled = true;
    };
  }, [brandFilter, stageFilter]);

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
          Ensure NEXT_PUBLIC_API_URL points to your backend.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Library</h1>
        <p className="mt-1 text-sm text-zinc-500">
          All completed jobs. Click to view or download.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Brand:</span>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-200"
          >
            <option value="all">All brands</option>
            {BRAND_OPTIONS.filter((b) => b !== "all").map((b) => (
              <option key={b} value={b}>{b.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Stage:</span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-200"
          >
            <option value="all">All stages</option>
            {STAGE_OPTIONS.filter((s) => s !== "all").map((s) => (
              <option key={s} value={s}>{s.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <p className="text-zinc-500">No jobs yet.</p>
          <p className="mt-2 text-sm text-zinc-500">
            Use <Link href="/create" className="text-zinc-400 underline hover:text-white">Create</Link> to generate content.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j) => (
            <Link
              key={j.id}
              href={`/jobs/${j.id}`}
              className="flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 transition-colors hover:border-zinc-600 hover:bg-zinc-900/80"
            >
              <div className="aspect-video shrink-0 overflow-hidden bg-zinc-900">
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
                  <div className="flex h-full w-full items-center justify-center text-4xl text-zinc-600">
                    {j.status === "completed" ? "✓" : j.status === "failed" ? "✕" : "…"}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-medium text-zinc-300">{j.brand}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-500 capitalize">{j.format.replace(/_/g, " ")}</span>
                  {j.funnel_stage && (
                    <>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-500">{j.funnel_stage.toUpperCase()}</span>
                    </>
                  )}
                  {j.content_intent && (
                    <>
                      <span className="text-zinc-600">·</span>
                      <span className="truncate text-zinc-500">{j.content_intent}</span>
                    </>
                  )}
                </div>
                <span
                  className={`mt-1 w-fit rounded border px-1.5 py-0.5 text-xs font-medium ${
                    STATUS_COLORS[j.status] ?? "bg-zinc-500/20 text-zinc-400"
                  }`}
                >
                  {statusLabel(j.status)}
                </span>
                <p className="mt-auto text-xs text-zinc-600">{formatDate(j.created_at)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
