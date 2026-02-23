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

export function CreativeDirectorBriefPanel({ data }: CreativeDirectorBriefPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(section);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  if (!data) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="mb-3 text-sm font-medium text-zinc-400">Creative Director Brief</h3>
        <p className="text-sm text-zinc-500">
          Select Director or Cinematic direction level and generate to see the brief.
        </p>
      </div>
    );
  }

  const { creativeDirection, artDirection, cameraDirection, lightingDirection, typographySystem, soundDirection, deliverables } = data;

  const section = (title: string, content: string | string[] | Record<string, unknown>, key: string) => {
    const text = typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content.join("\n")
        : JSON.stringify(content, null, 2);
    return (
      <div key={key}>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">{title}</h4>
          <CopyButton onClick={() => handleCopy(text, key)} label={copied === key ? "Copied" : "Copy"} />
        </div>
        <div className="space-y-1 text-sm text-zinc-300">
          {typeof content === "string" && <p>{content}</p>}
          {Array.isArray(content) && (
            <ul className="space-y-1">
              {content.map((item, i) => (
                <li key={i}>• {String(item)}</li>
              ))}
            </ul>
          )}
          {typeof content === "object" && !Array.isArray(content) && (
            <pre className="overflow-x-auto rounded bg-zinc-900/80 p-2 text-xs">{text}</pre>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 overflow-auto">
      {section("Concept", creativeDirection.concept, "concept")}
      {section("Audience Feeling", creativeDirection.audienceFeeling, "audienceFeeling")}
      {section("Visual Metaphor", creativeDirection.visualMetaphor, "visualMetaphor")}
      {section("Pacing Reference", creativeDirection.pacingReference, "pacing")}
      {section("Editing Reference", creativeDirection.editingReference, "editing")}
      {section("Do and Don't", creativeDirection.doAndDontList, "doDont")}
      {section("Location Style", artDirection.locationStyle, "location")}
      {section("Materials", artDirection.materials, "materials")}
      {section("Color Palette", artDirection.colorPalette, "palette")}
      {section("Texture Notes", artDirection.textureNotes, "texture")}
      {section("Window Details", artDirection.windowDetails, "window")}
      {section("Time of Day", artDirection.timeOfDay, "tod")}
      {section("Lens Feel", cameraDirection.lensFeel, "lens")}
      {section("Framing Rules", cameraDirection.framingRules, "framing")}
      {section("Movement Rules", cameraDirection.movementRules, "movement")}
      {section("Composition Rules", cameraDirection.compositionRules, "composition")}
      {section("Must Be Visible", cameraDirection.mustBeVisible, "visible")}
      {section("Exposure Targets", lightingDirection.exposureTargets, "exposure")}
      {section("Glare Behavior", lightingDirection.glareBehavior, "glare")}
      {section("Shadow Behavior", lightingDirection.shadowBehavior, "shadow")}
      {section("Font Type", typographySystem.fontType, "font")}
      {section("Hierarchy", typographySystem.hierarchy, "hierarchy")}
      {section("Max Words Per Frame", String(typographySystem.maxWordsPerFrame), "maxWords")}
      {section("Music Mood", soundDirection.musicMood, "music")}
      {section("SFX List", soundDirection.sfxList, "sfx")}
      {section("Voiceover Style", soundDirection.voiceoverStyle, "voiceover")}
      {section("Deliverables", deliverables as Record<string, unknown>, "deliverables")}
    </div>
  );
}
