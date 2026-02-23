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
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="mb-3 text-sm font-medium text-zinc-400">Reel Blueprint</h3>
        <p className="text-sm text-zinc-500">
          Select a brand and strategy to generate.
        </p>
      </div>
    );
  }

  const { format, durationSeconds, fps, music, soundDesign, colorGrade, typography, shots } = data;

  const fullText = [
    `Format: ${format}`,
    `Duration: ${durationSeconds}s @ ${fps}fps`,
    music ? `Music: ${music}` : null,
    soundDesign ? `Sound: ${soundDesign}` : null,
    colorGrade ? `Grade: ${colorGrade}` : null,
    typography ? `Typography: ${typography}` : null,
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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">Reel Blueprint</h3>
        <CopyButton
          onClick={() => handleCopy(fullText, "full")}
          label={copied === "full" ? "Copied" : "Copy All"}
        />
      </div>
      <div className="mb-4 flex flex-wrap gap-4 text-xs text-zinc-500">
        <span>{format}</span>
        <span>{durationSeconds}s @ {fps}fps</span>
        {music && <span>Music: {music}</span>}
        {colorGrade && <span>Grade: {colorGrade}</span>}
      </div>
      <div className="space-y-3">
        {shots.map((shot, i) => (
          <div
            key={shot.shotId}
            className="rounded border border-zinc-800 bg-zinc-900/50 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">
                Shot {i + 1} — {formatTime(shot.timeStart)}–{formatTime(shot.timeEnd)}
              </span>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                {shot.shotType} · {shot.cameraMovement}
              </span>
            </div>
            <p className="text-sm text-zinc-300">{shot.sceneDescription}</p>
            {shot.onScreenText && (
              <p className="mt-1 text-xs text-zinc-500">
                Text: {shot.onScreenText.text}
                {shot.onScreenText.position && ` (${shot.onScreenText.position})`}
              </p>
            )}
            {shot.lightingNotes && (
              <p className="mt-1 text-xs text-zinc-500">Lighting: {shot.lightingNotes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
