import React from "react";
import { AbsoluteFill } from "remotion";
import { ShotScene } from "./components/ShotScene";
import { EndFrame } from "./components/EndFrame";

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
  endFrame?: {
    headline?: string;
    cta?: string;
    brandName?: string;
  };
}

const COMPOSITION_ID = "ReelFromBlueprint";

export function ReelComposition({ blueprint }: { blueprint: ReelBlueprint }) {
  const { shots, durationSeconds, fps, endFrame } = blueprint;
  const totalFrames = Math.ceil(durationSeconds * fps);

  // Calculate end frame timing (last 2 seconds or after last shot)
  const lastShot = shots[shots.length - 1];
  const endFrameStart = lastShot
    ? Math.floor(lastShot.timeEnd * fps)
    : totalFrames - Math.floor(2 * fps);
  const endFrameDuration = totalFrames - endFrameStart;

  // Default end frame content
  const headline = endFrame?.headline ?? "Light. Controlled.";
  const cta = endFrame?.cta ?? "Schedule Design Consultation";
  const brandName = endFrame?.brandName ?? "NA BLINDS";

  return (
    <AbsoluteFill style={{ backgroundColor: "#0d0d0d" }}>
      {/* Render each shot scene */}
      {shots.map((shot, i) => (
        <ShotScene
          key={shot.shotId}
          shot={shot}
          shotIndex={i}
          isLastShot={i === shots.length - 1 && !endFrame}
        />
      ))}

      {/* End frame with CTA */}
      {(endFrame || shots.length > 0) && (
        <EndFrame
          headline={headline}
          cta={cta}
          brandName={brandName}
          startFrame={endFrameStart}
          durationFrames={endFrameDuration}
        />
      )}
    </AbsoluteFill>
  );
}

export const reelCompositionConfig = {
  id: COMPOSITION_ID,
  durationInFrames: 30 * 24,
  fps: 24,
  width: 1080,
  height: 1920,
  defaultProps: {
    blueprint: {
      format: "reel_kit",
      durationSeconds: 6,
      fps: 24,
      shots: [
        {
          shotId: "1",
          timeStart: 0,
          timeEnd: 2,
          shotType: "wide" as const,
          cameraMovement: "static",
          sceneDescription: "Uncontrolled light flooding through bare windows",
          onScreenText: { text: "Before" },
        },
        {
          shotId: "2",
          timeStart: 2,
          timeEnd: 4,
          shotType: "wide" as const,
          cameraMovement: "slow_push",
          sceneDescription: "Same space with elegant solar shades installed",
          onScreenText: { text: "After" },
        },
      ],
      endFrame: {
        headline: "Light. Controlled.",
        cta: "Schedule Design Consultation",
        brandName: "NA BLINDS",
      },
    } as ReelBlueprint,
  },
};
