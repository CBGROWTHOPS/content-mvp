"use client";

import { useState } from "react";

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  dismissible?: boolean;
  storageKey?: string;
}

export function InfoCard({ title, children, dismissible = true, storageKey }: InfoCardProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined" || !storageKey) return false;
    return localStorage.getItem(storageKey) === "dismissed";
  });

  const dismiss = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, "dismissed");
    }
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="rounded-lg border border-blue-900/30 bg-blue-950/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-blue-400">💡</span>
          <div>
            <h3 className="text-sm font-medium text-blue-300">{title}</h3>
            <div className="mt-1 text-sm text-blue-200/70">{children}</div>
          </div>
        </div>
        {dismissible && (
          <button
            onClick={dismiss}
            className="shrink-0 text-xs text-blue-400/60 hover:text-blue-300"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

export function StepGuide({ steps }: { steps: { step: number; title: string; description: string }[] }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="mb-3 text-sm font-medium text-zinc-300">How it works</h3>
      <div className="space-y-3">
        {steps.map(({ step, title, description }) => (
          <div key={step} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">
              {step}
            </span>
            <div>
              <div className="text-sm font-medium text-zinc-300">{title}</div>
              <div className="text-xs text-zinc-500">{description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CostEstimate({ 
  items 
}: { 
  items: { label: string; cost: string; note?: string }[] 
}) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/30 p-3">
      <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
        Estimated Cost
      </h4>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">{item.label}</span>
            <span className="text-zinc-300">
              {item.cost}
              {item.note && (
                <span className="ml-1 text-zinc-500">({item.note})</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OutputExpectation({ 
  title,
  items,
  warning,
}: { 
  title: string;
  items: { label: string; status: "included" | "not_included" | "optional"; note?: string }[];
  warning?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h4 className="mb-3 text-sm font-medium text-zinc-300">{title}</h4>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
              item.status === "included" 
                ? "bg-emerald-500/20 text-emerald-400" 
                : item.status === "optional"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-zinc-800 text-zinc-500"
            }`}>
              {item.status === "included" ? "✓" : item.status === "optional" ? "?" : "✕"}
            </span>
            <span className={item.status === "not_included" ? "text-zinc-500" : "text-zinc-300"}>
              {item.label}
            </span>
            {item.note && (
              <span className="text-xs text-zinc-500">— {item.note}</span>
            )}
          </div>
        ))}
      </div>
      {warning && (
        <div className="mt-3 rounded border border-amber-900/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-300/80">
          ⚠️ {warning}
        </div>
      )}
    </div>
  );
}
