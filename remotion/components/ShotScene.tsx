import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { AnimatedText } from "./AnimatedText";
import type { ReelBlueprintShot } from "../ReelComposition";

interface ShotSceneProps {
  shot: ReelBlueprintShot;
  shotIndex: number;
  isLastShot?: boolean;
}

const SCENE_BACKGROUNDS = [
  "linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)",
  "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
  "linear-gradient(180deg, #292524 0%, #1c1917 100%)",
  "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
  "linear-gradient(180deg, #27272a 0%, #18181b 100%)",
];

export function ShotScene({ shot, shotIndex, isLastShot }: ShotSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = Math.floor(shot.timeStart * fps);
  const endFrame = Math.floor(shot.timeEnd * fps);

  if (frame < startFrame || frame > endFrame) return null;

  const durationInFrames = endFrame - startFrame;
  const localFrame = frame - startFrame;

  // Fade in
  const fadeIn = interpolate(localFrame, [0, Math.min(12, durationInFrames / 4)], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Fade out (only if not last shot)
  const fadeOut = isLastShot
    ? 1
    : interpolate(
        localFrame,
        [durationInFrames - 12, durationInFrames],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );

  const opacity = Math.min(fadeIn, fadeOut);
  const bgColor = SCENE_BACKGROUNDS[shotIndex % SCENE_BACKGROUNDS.length];

  // Subtle zoom effect based on camera movement
  const zoomScale =
    shot.cameraMovement === "slow_push"
      ? interpolate(localFrame, [0, durationInFrames], [1, 1.05], {
          extrapolateRight: "clamp",
        })
      : 1;

  return (
    <AbsoluteFill
      style={{
        background: bgColor,
        opacity,
        transform: `scale(${zoomScale})`,
      }}
    >
      {/* Scene visual placeholder - warm neutral overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(255,248,240,0.03) 0%, transparent 70%)",
        }}
      />

      {/* Primary on-screen text overlay */}
      {shot.onScreenText?.text && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            textAlign: "center",
          }}
        >
          <AnimatedText
            text={shot.onScreenText.text}
            startFrame={startFrame}
            delay={8}
            animation="slideUp"
            style={{
              fontSize: shot.shotType === "close" ? 42 : 36,
              fontFamily: "Georgia, serif",
              fontWeight: 400,
              color: "#ffffff",
              textShadow: "0 4px 30px rgba(0,0,0,0.4)",
              lineHeight: 1.3,
            }}
          />
        </div>
      )}

      {/* Scene description as subtle caption (optional - can be removed for production) */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 40,
          right: 40,
          opacity: interpolate(localFrame, [15, 25], [0, 0.4], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontFamily: "system-ui, sans-serif",
            color: "rgba(255,255,255,0.5)",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {shot.sceneDescription}
        </div>
      </div>

      {/* Shot type indicator (debug - remove for production) */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            fontSize: 10,
            fontFamily: "monospace",
            color: "rgba(255,255,255,0.2)",
            letterSpacing: 1,
          }}
        >
          {shot.shotType.toUpperCase()} · {shot.cameraMovement.toUpperCase()}
        </div>
      )}
    </AbsoluteFill>
  );
}
