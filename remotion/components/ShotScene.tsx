import React, { useState } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, OffthreadVideo } from "remotion";
import { AnimatedText } from "./AnimatedText";
import type { ReelBlueprintShot } from "../ReelComposition";

interface ShotSceneProps {
  shot: ReelBlueprintShot;
  shotIndex: number;
  isLastShot?: boolean;
  videoUrl?: string;
}

const SCENE_BACKGROUNDS = [
  "linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)",
  "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
  "linear-gradient(180deg, #292524 0%, #1c1917 100%)",
  "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
  "linear-gradient(180deg, #27272a 0%, #18181b 100%)",
];

export function ShotScene({ shot, shotIndex, isLastShot, videoUrl }: ShotSceneProps) {
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

  const useVideo = shot.visualSource === "generated_video" && videoUrl;
  const [videoError, setVideoError] = useState(false);
  const showVideo = useVideo && !videoError;

  return (
    <AbsoluteFill
      style={{
        background: useVideo ? "transparent" : bgColor,
        opacity,
        transform: `scale(${zoomScale})`,
      }}
    >
      {/* Solid fallback when no video, null videoUrl, or video failed to load */}
      {!showVideo && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: bgColor,
          }}
        />
      )}
      {!showVideo && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, rgba(255,248,240,0.03) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Video background if available and loaded */}
      {showVideo && (
        <AbsoluteFill>
          <OffthreadVideo
            src={videoUrl!}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            startFrom={0}
            muted
            onError={() => setVideoError(true)}
          />
        </AbsoluteFill>
      )}

      {/* Primary on-screen text overlay - dark bg, readable text, min 48px */}
      {(() => {
        const displayText = shot.onScreenText?.text || shot.sceneDescription;
        if (!displayText) return null;
        const fontSize = Math.max(48, shot.shotType === "close" ? 52 : displayText.length > 50 ? 48 : 52);
        return (
          <div
            style={{
              position: "absolute",
              bottom: 80,
              left: 24,
              right: 24,
              backgroundColor: "rgba(0,0,0,0.6)",
              borderRadius: 8,
              padding: "12px 16px",
            }}
          >
            <AnimatedText
              text={displayText}
              startFrame={startFrame}
              delay={8}
              animation="slideUp"
              style={{
                fontSize,
                fontWeight: 800,
                color: "#FFFFFF",
                lineHeight: 1.2,
                textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                fontFamily: "Inter, sans-serif",
              }}
            />
          </div>
        );
      })()}

      {/* Shot number indicator (subtle) */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 40,
          opacity: interpolate(localFrame, [15, 25], [0, 0.3], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontFamily: "system-ui, sans-serif",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {String(shotIndex + 1).padStart(2, "0")}
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
