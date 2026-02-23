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
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="mb-3 text-sm font-medium text-zinc-400">
          Marketing Output
        </h3>
        <p className="text-sm text-zinc-500">Select a brand and strategy to generate.</p>
      </div>
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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">Marketing Output</h3>
        <CopyButton
          onClick={() => handleCopy(fullText)}
          label={copied ? "Copied" : "Copy"}
        />
      </div>
      <div className="space-y-3 text-sm">
        {data.primaryText && (
          <div>
            <span className="text-zinc-500">Primary: </span>
            <span className="text-zinc-100">{data.primaryText}</span>
          </div>
        )}
        {data.headline && (
          <div>
            <span className="text-zinc-500">Headline: </span>
            <span className="text-zinc-100 font-medium">{data.headline}</span>
          </div>
        )}
        {data.secondaryLine && (
          <div>
            <span className="text-zinc-500">Secondary: </span>
            <span className="text-zinc-100">{data.secondaryLine}</span>
          </div>
        )}
        {data.cta && (
          <div>
            <span className="text-zinc-500">CTA: </span>
            <span className="text-zinc-100">{data.cta}</span>
          </div>
        )}
        {data.caption && (
          <div>
            <span className="text-zinc-500">Caption: </span>
            <span className="text-zinc-100">{data.caption}</span>
          </div>
        )}
        {data.variations && data.variations.length > 0 && (
          <div>
            <span className="text-zinc-500">Variations:</span>
            <ul className="mt-1 space-y-1 pl-4">
              {data.variations.map((v, i) => (
                <li key={i} className="text-zinc-300">
                  {v}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
