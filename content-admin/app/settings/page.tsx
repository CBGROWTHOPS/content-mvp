"use client";

import { useEffect, useState } from "react";
import { fetchHealth, type HealthApiStatus } from "@/lib/api";

function statusBadge(status: "connected" | "missing" | "invalid") {
  const cls =
    status === "connected"
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : status === "invalid"
        ? "bg-red-500/20 text-red-400 border-red-500/30"
        : "bg-zinc-500/20 text-zinc-500 border-zinc-500/30";
  return (
    <span className={`rounded border px-1.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

export default function SettingsPage() {
  const [health, setHealth] = useState<{
    status: string;
    apis?: HealthApiStatus;
    models?: Array<{ use: string; provider: string; model: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth().then((r) => {
      if ("data" in r) setHealth(r.data);
      else setError(r.error ?? "Failed to fetch");
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          API provider status and models in use.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-sm font-medium text-zinc-400">API Status</h2>
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
        {health?.apis && (
          <div className="mt-3 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">ElevenLabs</span>
              {statusBadge(health.apis.elevenlabs ?? "missing")}
              <span className="text-xs text-zinc-600">voiceover</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Replicate</span>
              {statusBadge(health.apis.replicate ?? "missing")}
              <span className="text-xs text-zinc-600">images, video fallback</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Higgsfield</span>
              {statusBadge(health.apis.higgsfield ?? "missing")}
              <span className="text-xs text-zinc-600">images, video primary</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">OpenAI</span>
              {statusBadge(health.apis.openai ?? "missing")}
              <span className="text-xs text-zinc-600">copy, briefs</span>
            </div>
          </div>
        )}
      </div>

      {health?.models && health.models.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-sm font-medium text-zinc-400">Models in Use</h2>
          <p className="mt-0.5 text-xs text-zinc-600">
            What each model is used for.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700 text-left">
                  <th className="py-2 pr-4 font-medium text-zinc-400">Use</th>
                  <th className="py-2 pr-4 font-medium text-zinc-400">Provider</th>
                  <th className="py-2 font-medium text-zinc-400">Model</th>
                </tr>
              </thead>
              <tbody>
                {health.models.map((row, i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    <td className="py-2 pr-4 text-zinc-200">{row.use}</td>
                    <td className="py-2 pr-4 text-zinc-400">{row.provider}</td>
                    <td className="py-2 font-mono text-xs text-zinc-500">
                      {row.model}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
