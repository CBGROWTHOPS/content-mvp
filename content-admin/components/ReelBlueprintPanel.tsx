"use client";

import { useState } from "react";
import type { ReelBlueprint } from "@/types/generate";

interface ReelBlueprintPanelProps {
  data: ReelBlueprint | null;
  onCopy?: (text: string) => void;
}

function CopyButton({ onClick, label }: { onClick: () => void; label: string }) {
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

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ReelBlueprintPanel({ data, onCopy }: ReelBlueprintPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      onCopy?.(text);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  if (!data) {
    return (
      <p className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-6 text-sm text-zinc-500">
        Select a brand and strategy, then click Generate.
      </p>
    );
  }

  const { format, durationSeconds, fps, music, colorGrade, shots } = data;

  const fullText = [
    `Format: ${format} · ${durationSeconds}s @ ${fps}fps`,
    music ? `Music: ${music}` : null,
    colorGrade ? `Grade: ${colorGrade}` : null,
    "",
    ...shots.map(
      (s) =>
        `[${formatTime(s.timeStart)}–${formatTime(s.timeEnd)}] ${s.shotType} | ${s.cameraMovement}\n  ${s.sceneDescription}${
          s.onScreenText ? `\n  Text: ${s.onScreenText.text}` : ""
        }${s.lightingNotes ? `\n  Lighting: ${s.lightingNotes}` : ""}`
    ),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {format} · {durationSeconds}s @ {fps}fps
          {music && ` · ${music}`}
        </p>
        <CopyButton
          onClick={() => handleCopy(fullText, "full")}
          label={copied === "full" ? "Copied" : "Copy all"}
        />
      </div>

      <div className="space-y-3">
        {shots.map((shot, i) => (
          <div
            key={shot.shotId}
            className="rounded border border-zinc-800/50 bg-zinc-900/20 px-4 py-3"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-300">
                Shot {i + 1}
              </span>
              <span className="text-xs text-zinc-500">
                {formatTime(shot.timeStart)}–{formatTime(shot.timeEnd)}
              </span>
              <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-400">
                {shot.shotType} · {shot.cameraMovement}
              </span>
            </div>
            <p className="text-sm text-zinc-200">{shot.sceneDescription}</p>
            {(shot.onScreenText || shot.lightingNotes) && (
              <p className="mt-1.5 text-xs text-zinc-500">
                {shot.onScreenText && `Text: ${shot.onScreenText.text}`}
                {shot.onScreenText && shot.lightingNotes && " · "}
                {shot.lightingNotes && `Lighting: ${shot.lightingNotes}`}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
