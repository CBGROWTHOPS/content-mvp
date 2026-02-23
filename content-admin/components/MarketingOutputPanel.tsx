"use client";

import { useState } from "react";
import type { MarketingOutput } from "@/types/generate";

interface MarketingOutputPanelProps {
  data: MarketingOutput | null;
  onCopy?: (text: string) => void;
}

function CopyButton({
  onClick,
  label = "Copy",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
    >
      {label}
    </button>
  );
}

export function MarketingOutputPanel({ data, onCopy }: MarketingOutputPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      onCopy?.(text);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (!data) {
    return (
      <p className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-6 text-sm text-zinc-500">
        Select a brand and strategy, then click Generate.
      </p>
    );
  }

  const fullText = [
    data.primaryText,
    data.headline,
    data.secondaryLine,
    data.cta,
    data.caption,
    data.variations?.length ? data.variations.join("\n") : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">Output</h3>
        <CopyButton
          onClick={() => handleCopy(fullText)}
          label={copied ? "Copied" : "Copy all"}
        />
      </div>
      <div className="space-y-4 text-sm">
        {data.headline && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Headline</p>
            <p className="mt-0.5 font-medium text-zinc-100">{data.headline}</p>
          </div>
        )}
        {data.primaryText && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Primary</p>
            <p className="mt-0.5 text-zinc-200">{data.primaryText}</p>
          </div>
        )}
        {data.secondaryLine && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Secondary</p>
            <p className="mt-0.5 text-zinc-200">{data.secondaryLine}</p>
          </div>
        )}
        {data.cta && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">CTA</p>
            <p className="mt-0.5 text-zinc-200">{data.cta}</p>
          </div>
        )}
        {data.caption && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Caption</p>
            <p className="mt-0.5 text-zinc-200">{data.caption}</p>
          </div>
        )}
        {data.variations && data.variations.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Variations</p>
            <ul className="mt-1 space-y-1 text-zinc-300">
              {data.variations.map((v, i) => (
                <li key={i}>• {v}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
