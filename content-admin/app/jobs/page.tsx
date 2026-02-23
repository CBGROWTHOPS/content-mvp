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

export default function JobsPage() {
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
        <p className="text-zinc-500">Loading jobs…</p>
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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
      <div className="border-b border-zinc-800 px-6 py-4">
        <h1 className="text-xl font-semibold">Jobs</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {jobs.length} job{jobs.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-sm text-zinc-500">
              <th className="px-6 py-3 font-medium">ID</th>
              <th className="px-6 py-3 font-medium">Brand</th>
              <th className="px-6 py-3 font-medium">Format</th>
              <th className="px-6 py-3 font-medium">Hook</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Created</th>
              <th className="px-6 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                  No jobs yet.{" "}
                  <Link href="/new" className="text-zinc-400 underline hover:text-white">
                    Create one
                  </Link>
                </td>
              </tr>
            ) : (
              jobs.map((j) => (
                <tr
                  key={j.id}
                  className="border-b border-zinc-800/80 transition-colors hover:bg-zinc-800/30"
                >
                  <td className="px-6 py-3 font-mono text-xs text-zinc-400">
                    {j.id.slice(0, 8)}…
                  </td>
                  <td className="px-6 py-3">{j.brand}</td>
                  <td className="px-6 py-3 capitalize">{j.format}</td>
                  <td className="px-6 py-3 capitalize">
                    {j.hook_type ?? "—"}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[j.status as JobStatus] ??
                        "bg-zinc-500/20 text-zinc-400"
                      }`}
                    >
                      {statusLabel(j.status)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-zinc-500">
                    {formatDate(j.created_at)}
                  </td>
                  <td className="px-6 py-3">
                    <Link
                      href={`/jobs/${j.id}`}
                      className="text-sm text-zinc-400 hover:text-white"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
