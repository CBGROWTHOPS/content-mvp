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

function CollapsibleSection({
  title,
  content,
  copyText,
  onCopy,
  copied,
  defaultOpen = false,
}: {
  title: string;
  content: React.ReactNode;
  copyText: string;
  onCopy: () => void;
  copied: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded border border-zinc-800/50 bg-zinc-900/30">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-zinc-300 hover:bg-zinc-800/50"
      >
        {title}
        <span className="text-zinc-500">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="border-t border-zinc-800/50 px-3 py-3">
          <div className="mb-2 flex justify-end">
            <CopyButton onClick={onCopy} label={copied ? "Copied" : "Copy"} />
          </div>
          <div className="space-y-3 text-sm">{content}</div>
        </div>
      )}
    </div>
  );
}

export function CreativeDirectorBriefPanel({ data }: CreativeDirectorBriefPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
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

  return (
    <div className="space-y-2">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">Output</h3>
      </div>

      <CollapsibleSection
        title="Creative Direction"
        defaultOpen
        content={
          <>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Concept</p>
              <div className="mt-0.5">{renderContent(creativeDirection.concept)}</div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Audience Feeling</p>
              <div className="mt-0.5">{renderContent(creativeDirection.audienceFeeling)}</div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Visual Metaphor</p>
              <div className="mt-0.5">{renderContent(creativeDirection.visualMetaphor)}</div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Pacing</p>
              <div className="mt-0.5">{renderContent(creativeDirection.pacingReference)}</div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Editing</p>
              <div className="mt-0.5">{renderContent(creativeDirection.editingReference)}</div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Do and Don't</p>
              <div className="mt-0.5">{renderContent(creativeDirection.doAndDontList)}</div>
            </div>
          </>
        }
        copyText={JSON.stringify(creativeDirection)}
        onCopy={() => handleCopy(JSON.stringify(creativeDirection, null, 2), "creative")}
        copied={copied === "creative"}
      />

      <CollapsibleSection
        title="Art Direction"
        content={
          <>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Location</p>
              <div className="mt-0.5">{renderContent(artDirection.locationStyle)}</div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Materials</p>
              <div className="mt-0.5">{renderContent(artDirection.materials)}</div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Color Palette</p>
              <div className="mt-0.5">{renderContent(artDirection.colorPalette)}</div>
            </div>
            {artDirection.textureNotes && (
              <div>
                <p className="text-xs text-zinc-500 uppercase">Texture</p>
                <div className="mt-0.5">{renderContent(artDirection.textureNotes)}</div>
              </div>
            )}
            {artDirection.windowDetails && (
              <div>
                <p className="text-xs text-zinc-500 uppercase">Window</p>
                <div className="mt-0.5">{renderContent(artDirection.windowDetails)}</div>
              </div>
            )}
            {artDirection.timeOfDay && (
              <div>
                <p className="text-xs text-zinc-500 uppercase">Time of Day</p>
                <div className="mt-0.5">{renderContent(artDirection.timeOfDay)}</div>
              </div>
            )}
          </>
        }
        copyText={JSON.stringify(artDirection)}
        onCopy={() => handleCopy(JSON.stringify(artDirection, null, 2), "art")}
        copied={copied === "art"}
      />

      <CollapsibleSection
        title="Camera Direction"
        content={
          <>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Lens Feel</p>
              <div className="mt-0.5">{renderContent(cameraDirection.lensFeel)}</div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Framing</p>
              <div className="mt-0.5">{renderContent(cameraDirection.framingRules)}</div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Movement</p>
              <div className="mt-0.5">{renderContent(cameraDirection.movementRules)}</div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Composition</p>
              <div className="mt-0.5">{renderContent(cameraDirection.compositionRules)}</div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Must Be Visible</p>
              <div className="mt-0.5">{renderContent(cameraDirection.mustBeVisible)}</div>
            </div>
          </>
        }
        copyText={JSON.stringify(cameraDirection)}
        onCopy={() => handleCopy(JSON.stringify(cameraDirection, null, 2), "camera")}
        copied={copied === "camera"}
      />

      <CollapsibleSection
        title="Lighting"
        content={
          <>
            <div>{renderContent(lightingDirection.exposureTargets)}</div>
            <div>{renderContent(lightingDirection.glareBehavior)}</div>
            <div>{renderContent(lightingDirection.diffusionBehavior)}</div>
            <div>{renderContent(lightingDirection.shadowBehavior)}</div>
          </>
        }
        copyText={JSON.stringify(lightingDirection)}
        onCopy={() => handleCopy(JSON.stringify(lightingDirection, null, 2), "lighting")}
        copied={copied === "lighting"}
      />

      <CollapsibleSection
        title="Typography"
        content={
          <>
            <div>{renderContent(typographySystem.fontType)}</div>
            <div>{renderContent(typographySystem.hierarchy)}</div>
            <div>{renderContent(String(typographySystem.maxWordsPerFrame))}</div>
          </>
        }
        copyText={JSON.stringify(typographySystem)}
        onCopy={() => handleCopy(JSON.stringify(typographySystem, null, 2), "typography")}
        copied={copied === "typography"}
      />

      <CollapsibleSection
        title="Sound"
        content={
          <>
            <div>{renderContent(soundDirection.musicMood)}</div>
            <div>{renderContent(soundDirection.sfxList)}</div>
            <div>{renderContent(soundDirection.voiceoverStyle)}</div>
          </>
        }
        copyText={JSON.stringify(soundDirection)}
        onCopy={() => handleCopy(JSON.stringify(soundDirection, null, 2), "sound")}
        copied={copied === "sound"}
      />

      <CollapsibleSection
        title="Deliverables"
        content={renderContent(deliverables as Record<string, unknown>)}
        copyText={JSON.stringify(deliverables)}
        onCopy={() => handleCopy(JSON.stringify(deliverables, null, 2), "deliverables")}
        copied={copied === "deliverables"}
      />
    </div>
  );
}
