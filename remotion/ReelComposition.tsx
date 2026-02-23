import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

/** Mirrors ReelBlueprintShot from content-admin/types/generate.ts */
export interface ReelBlueprintShot {
  shotId: string;
  timeStart: number;
  timeEnd: number;
  shotType: "wide" | "medium" | "close";
  cameraMovement: string;
  sceneDescription: string;
  propsSetDressingNotes?: string;
  lightingNotes?: string;
  talentNotes?: string;
  onScreenText?: {
    text: string;
    position?: string;
    animationRules?: string;
  };
  brollRequirements?: string;
  assetRequirements?: string[];
}

/** Mirrors ReelBlueprint from content-admin/types/generate.ts */
export interface ReelBlueprint {
  format: string;
  durationSeconds: number;
  fps: number;
  music?: string;
  soundDesign?: string;
  colorGrade?: string;
  typography?: string;
  deliverables?: string[];
  shots: ReelBlueprintShot[];
}

const COMPOSITION_ID = "ReelFromBlueprint";

const SHOT_COLORS = [
  "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
  "linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%)",
  "linear-gradient(135deg, #533483 0%, #0f3460 100%)",
  "linear-gradient(135deg, #e94560 0%, #533483 50%)",
  "linear-gradient(135deg, #16213e 0%, #e94560 100%)",
];

function ShotLayer({ blueprint, shotIndex }: { blueprint: ReelBlueprint; shotIndex: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shot = blueprint.shots[shotIndex];
  const startFrame = Math.floor(shot.timeStart * fps);
  const endFrame = Math.floor(shot.timeEnd * fps);

  if (frame < startFrame || frame > endFrame) return null;

  const durationInFrames = endFrame - startFrame;
  const localFrame = frame - startFrame;
  const fadeIn = interpolate(localFrame, [0, Math.min(15, durationInFrames / 3)], [0, 1], {
    extrapolateRight: "clamp",
  });
  const textFadeIn = interpolate(localFrame, [5, 20], [0, 1], { extrapolateRight: "clamp" });

  const bgColor = SHOT_COLORS[shotIndex % SHOT_COLORS.length];
  const textColor = shot.onScreenText?.text ? "#ffffff" : "rgba(255,255,255,0.85)";

  return (
    <AbsoluteFill
      style={{
        background: bgColor,
        opacity: fadeIn,
      }}
    >
      {/* Scene description as subtle caption */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 40,
          right: 40,
          fontSize: 14,
          color: "rgba(255,255,255,0.6)",
          fontFamily: "system-ui, sans-serif",
          opacity: textFadeIn,
        }}
      >
        {shot.sceneDescription}
      </div>

      {/* Primary on-screen text overlay */}
      {shot.onScreenText?.text && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 36,
            fontWeight: 700,
            color: textColor,
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
            textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            opacity: textFadeIn,
          }}
        >
          {shot.onScreenText.text}
        </div>
      )}

      {/* Shot label (debug) */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          fontSize: 12,
          color: "rgba(255,255,255,0.4)",
          fontFamily: "monospace",
        }}
      >
        {shot.shotType} · {shot.cameraMovement}
      </div>
    </AbsoluteFill>
  );
}

export function ReelComposition({ blueprint }: { blueprint: ReelBlueprint }) {
  return (
    <AbsoluteFill>
      {blueprint.shots.map((_, i) => (
        <ShotLayer key={blueprint.shots[i].shotId} blueprint={blueprint} shotIndex={i} />
      ))}
    </AbsoluteFill>
  );
}

export const reelCompositionConfig = {
  id: COMPOSITION_ID,
  durationInFrames: 30 * 24, // default 30s at 24fps, overridden by inputProps
  fps: 24,
  width: 1080,
  height: 1920, // 9:16 default
  defaultProps: {
    blueprint: {
      format: "reel_kit",
      durationSeconds: 30,
      fps: 24,
      shots: [],
    } as ReelBlueprint,
  },
};
