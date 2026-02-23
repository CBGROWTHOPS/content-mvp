"use client";

import { useState } from "react";
import type { CreativeBrief } from "@/types/generate";

interface CreativeBriefPanelProps {
  data: CreativeBrief | null;
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

export function CreativeBriefPanel({ data, onCopy }: CreativeBriefPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(section);
      onCopy?.(text);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  if (!data) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="mb-3 text-sm font-medium text-zinc-400">
          Creative Production Brief
        </h3>
        <p className="text-sm text-zinc-500">Select a brand and strategy to generate.</p>
      </div>
    );
  }

  const { imageDirection, videoDirection, editorGuardrails } = data;

  const imageText = [
    `Scene: ${imageDirection.sceneDescription}`,
    `Camera: ${imageDirection.cameraAngle}`,
    `Framing: ${imageDirection.framing}`,
    `Interior: ${imageDirection.interiorRequirements.join("; ")}`,
    `Exterior: ${imageDirection.exteriorContext}`,
    `Texture: ${imageDirection.textureNotes}`,
    `Lighting: ${imageDirection.lightingNotes}`,
  ].join("\n");

  const videoText = [
    `Scene 1: ${videoDirection.scene1}`,
    `Scene 2: ${videoDirection.scene2}`,
    `Timing: ${videoDirection.timing}`,
    `Text overlay: ${videoDirection.textOverlayRules}`,
    `Motion: ${videoDirection.motionGuidance}`,
    `Color grade: ${videoDirection.colorGrade}`,
  ].join("\n");

  const guardrailsText = editorGuardrails.join("\n");

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      <h3 className="mb-4 text-sm font-medium text-zinc-400">
        Creative Production Brief
      </h3>
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Image Direction
            </h4>
            <CopyButton
              onClick={() => handleCopy(imageText, "image")}
              label={copied === "image" ? "Copied" : "Copy"}
            />
          </div>
          <div className="space-y-1 text-sm text-zinc-300">
            <p>Scene: {imageDirection.sceneDescription}</p>
            <p>Camera: {imageDirection.cameraAngle}</p>
            <p>Framing: {imageDirection.framing}</p>
            <p>Interior: {imageDirection.interiorRequirements.join("; ")}</p>
            <p>Exterior: {imageDirection.exteriorContext}</p>
            <p>Texture: {imageDirection.textureNotes}</p>
            <p>Lighting: {imageDirection.lightingNotes}</p>
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Video Direction
            </h4>
            <CopyButton
              onClick={() => handleCopy(videoText, "video")}
              label={copied === "video" ? "Copied" : "Copy"}
            />
          </div>
          <div className="space-y-1 text-sm text-zinc-300">
            <p>Scene 1: {videoDirection.scene1}</p>
            <p>Scene 2: {videoDirection.scene2}</p>
            <p>Timing: {videoDirection.timing}</p>
            <p>Text overlay: {videoDirection.textOverlayRules}</p>
            <p>Motion: {videoDirection.motionGuidance}</p>
            <p>Color grade: {videoDirection.colorGrade}</p>
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Editor Guardrails
            </h4>
            <CopyButton
              onClick={() => handleCopy(guardrailsText, "guardrails")}
              label={copied === "guardrails" ? "Copied" : "Copy"}
            />
          </div>
          <ul className="space-y-1 text-sm text-zinc-300">
            {editorGuardrails.map((g, i) => (
              <li key={i}>• {g}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
