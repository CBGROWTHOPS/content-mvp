"use client";

import { useEffect, useState } from "react";
import { fetchHealth } from "@/lib/api";

export default function SettingsPage() {
  const [health, setHealth] = useState<{
    status: string;
    elevenlabs?: string;
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
          API provider status from backend health check.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-sm font-medium text-zinc-400">API Status</h2>
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
        {health && (
          <dl className="mt-3 space-y-2">
            <div className="flex gap-2">
              <dt className="text-zinc-500">Status:</dt>
              <dd className="text-zinc-200">{health.status}</dd>
            </div>
            {health.elevenlabs && (
              <div className="flex gap-2">
                <dt className="text-zinc-500">ElevenLabs:</dt>
                <dd className="text-zinc-200">{health.elevenlabs}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </div>
  );
}
