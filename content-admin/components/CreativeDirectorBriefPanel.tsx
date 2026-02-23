"use client";

import { useState } from "react";
import type { CreativeDirectorBrief } from "@/types/generate";

interface CreativeDirectorBriefPanelProps {
  data: CreativeDirectorBrief | null;
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

function renderContent(
  content: string | string[] | Record<string, unknown>
): React.ReactNode {
  if (typeof content === "string") return <p className="text-zinc-300">{content}</p>;
  if (Array.isArray(content))
    return (
      <ul className="space-y-1 text-zinc-300">
        {content.map((item, i) => (
          <li key={i}>• {String(item)}</li>
        ))}
      </ul>
    );
  return (
    <pre className="overflow-x-auto rounded bg-zinc-900/50 p-2 text-xs text-zinc-300">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}

export function CreativeDirectorBriefPanel({ data }: CreativeDirectorBriefPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = () => {
    if (!data) return;
    const full = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (!data) {
    return (
      <p className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-6 text-sm text-zinc-500">
        Select Director or Cinematic direction level and click Generate.
      </p>
    );
  }

  const {
    creativeDirection,
    artDirection,
    cameraDirection,
    lightingDirection,
    typographySystem,
    soundDirection,
    deliverables,
  } = data;

  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">Output</h3>
        <CopyButton onClick={handleCopyAll} label={copied ? "Copied" : "Copy All"} />
      </div>

      {/* Block 1: Concept */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Concept</p>
        <div className="text-sm">{renderContent(creativeDirection.concept)}</div>
        <div className="text-sm">{renderContent(creativeDirection.visualMetaphor)}</div>
        <div className="text-sm">{renderContent(creativeDirection.audienceFeeling)}</div>
      </div>

      {/* Block 2: Visual Direction (art + lighting) */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Visual Direction</p>
        <div className="space-y-1 text-sm text-zinc-300">
          <p>{artDirection.locationStyle}</p>
          {artDirection.colorPalette?.length ? (
            <p>Colors: {artDirection.colorPalette.join(", ")}</p>
          ) : null}
          {artDirection.materials?.length ? (
            <p>Materials: {artDirection.materials.join(", ")}</p>
          ) : null}
          <div>{renderContent(lightingDirection.exposureTargets)}</div>
        </div>
      </div>

      {/* Block 3: Camera and Lighting */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Camera and Lighting</p>
        <div className="space-y-1 text-sm text-zinc-300">
          <div>{renderContent(cameraDirection.lensFeel)}</div>
          <div>{renderContent(cameraDirection.framingRules)}</div>
          <div>{renderContent(lightingDirection.glareBehavior)}</div>
          <div>{renderContent(lightingDirection.diffusionBehavior)}</div>
        </div>
      </div>

      {/* Block 4: Typography and Sound */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Typography and Sound</p>
        <div className="space-y-1 text-sm text-zinc-300">
          <div>{renderContent(typographySystem.fontType)}</div>
          <div>{renderContent(typographySystem.hierarchy)}</div>
          <div>{renderContent(soundDirection.musicMood)}</div>
          <div>{renderContent(soundDirection.voiceoverStyle)}</div>
        </div>
      </div>

      {/* Detailed Production Notes (collapsed) */}
      <details className="group" open={detailsOpen}>
        <summary
          className="cursor-pointer text-sm font-medium text-zinc-500 hover:text-zinc-400"
          onClick={(e) => { e.preventDefault(); setDetailsOpen(!detailsOpen); }}
        >
          Detailed Production Notes
        </summary>
        <div className="mt-3 space-y-4 border-l-2 border-zinc-800 pl-3 text-sm">
          <div>
            <p className="text-xs font-medium text-zinc-500">Art Direction (full)</p>
            <div className="mt-1 text-zinc-400">{renderContent(artDirection)}</div>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500">Camera Direction (full)</p>
            <div className="mt-1 text-zinc-400">{renderContent(cameraDirection)}</div>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500">Lighting (full)</p>
            <div className="mt-1 text-zinc-400">{renderContent(lightingDirection)}</div>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500">Deliverables</p>
            <div className="mt-1 text-zinc-400">{renderContent(deliverables as Record<string, unknown>)}</div>
          </div>
        </div>
      </details>
    </div>
  );
}
