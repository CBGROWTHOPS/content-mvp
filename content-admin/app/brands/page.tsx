"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchBrandKits, type BrandKit } from "@/lib/api";

export default function BrandsPage() {
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBrandKits().then((r) => {
      setLoading(false);
      if ("data" in r) setKits(r.data);
      else setError(r.error);
    });
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Brand Kits</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage brand positioning, ICP, voice, and guardrails.
          </p>
        </div>
        <Link
          href="/brands/new"
          className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          + New Brand Kit
        </Link>
      </div>

      <div className="space-y-2">
        {kits.map((kit) => {
          const icpDesc =
            kit.icp && typeof kit.icp === "object" && "description" in kit.icp
              ? (kit.icp as { description?: string }).description
              : null;
          const initial = kit.name.charAt(0).toUpperCase();
          return (
            <div
              key={kit.id}
              className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-medium text-zinc-200">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-zinc-200">{kit.name}</div>
                <div className="text-sm text-zinc-500">{kit.niche}</div>
                {icpDesc && (
                  <div className="mt-0.5 truncate text-xs text-zinc-600">{icpDesc}</div>
                )}
              </div>
              <Link
                href={`/brands/${kit.id}`}
                className="shrink-0 rounded border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Edit
              </Link>
            </div>
          );
        })}
      </div>

      {kits.length === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <p className="text-zinc-500">No brand kits yet.</p>
          <Link href="/brands/new" className="mt-2 inline-block text-sm text-zinc-400 underline hover:text-white">
            Create one
          </Link>
        </div>
      )}
    </div>
  );
}
