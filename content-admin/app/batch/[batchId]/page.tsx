"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchJob } from "@/lib/api";

interface BatchData {
  jobIds: string[];
  headlines: string[];
  hooks: string[];
  brand: string;
  intent: string;
  format: string;
  duration: number;
  count: number;
}

interface JobStatus {
  id: string;
  status: string;
  primary_asset?: { url: string; type: string } | null;
}

function getPrimaryAsset(job: { assets?: Array<{ url: string; type: string }> }): { url: string; type: string } | null {
  const a = job.assets?.[0];
  return a ? { url: a.url, type: a.type } : null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-zinc-500",
  processing: "bg-amber-500",
  completed: "bg-emerald-500",
  failed: "bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Queued",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

export default function BatchPage() {
  const params = useParams();
  const batchId = params.batchId as string;
  const [data, setData] = useState<BatchData | null>(null);
  const [jobs, setJobs] = useState<Record<string, JobStatus>>({});

  useEffect(() => {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem(`batch-${batchId}`) : null;
    if (raw) {
      try {
        setData(JSON.parse(raw) as BatchData);
      } catch {
        setData(null);
      }
    } else {
      setData(null);
    }
  }, [batchId]);

  useEffect(() => {
    if (!data?.jobIds.length) return;
    const fetch = async () => {
      const results: Record<string, JobStatus> = {};
      for (const id of data.jobIds) {
        const res = await fetchJob(id);
        if ("data" in res) {
          const j = res.data as { id: string; status: string; assets?: Array<{ url: string; type: string }> };
          results[id] = {
            id: j.id,
            status: j.status,
            primary_asset: getPrimaryAsset(j),
          };
        }
      }
      setJobs(results);
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [data?.jobIds?.join(",")]);

  if (!data) {
    return (
      <div className="space-y-4">
        <Link href="/create" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Create
        </Link>
        <div className="rounded border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500">
          Batch not found. It may have expired.
        </div>
      </div>
    );
  }

  const title = `${data.count} Variations — ${data.brand || "Brand"} · ${data.intent ? data.intent.replace(/_/g, " ") : ""} · ${data.format?.replace(/_/g, " ")} ${data.duration}s`;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/create" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Create
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-zinc-100">{title}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.jobIds.map((jobId, i) => {
          const job = jobs[jobId];
          const headline = data.headlines[i] ?? "";
          const hook = data.hooks[i] ?? "";
          const status = job?.status ?? "pending";
          return (
            <div
              key={jobId}
              className="flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50"
            >
              <div className="p-4">
                <h2 className="text-sm font-medium text-zinc-400">Variation {i + 1}</h2>
                <div className="mt-2 space-y-2">
                  <div>
                    <div className="text-xs text-zinc-600">Headline</div>
                    <p className="text-sm text-zinc-200 line-clamp-2">{headline || "—"}</p>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-600">Hook</div>
                    <p className="text-sm text-zinc-200 line-clamp-2">{hook || "—"}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${STATUS_COLORS[status] ?? "bg-zinc-600"}`}
                    title={status}
                  />
                  <span className="text-sm text-zinc-500">{STATUS_LABELS[status] ?? status}</span>
                </div>
              </div>
              {job?.primary_asset?.url && job.status === "completed" && (
                <div className="aspect-video shrink-0 overflow-hidden bg-zinc-900">
                  {job.primary_asset.type === "video" ? (
                    <video
                      src={job.primary_asset.url}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={job.primary_asset.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              )}
              <div className="mt-auto border-t border-zinc-800 p-3">
                <Link
                  href={`/jobs/${jobId}`}
                  className="block rounded border border-zinc-600 py-2 text-center text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  View Job
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
