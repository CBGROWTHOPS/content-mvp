import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { AnimatedText } from "./AnimatedText";

interface EndFrameProps {
  headline: string;
  cta: string;
  brandName?: string;
  startFrame: number;
  durationFrames: number;
}

export function EndFrame({
  headline,
  cta,
  brandName = "NA BLINDS",
  startFrame,
  durationFrames,
}: EndFrameProps) {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame > durationFrames) return null;

  const fadeIn = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)",
        opacity: fadeIn,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
      }}
    >
      {/* Brand micro label */}
      <AnimatedText
        text={brandName}
        startFrame={startFrame}
        delay={10}
        animation="fadeIn"
        style={{
          fontSize: 14,
          fontFamily: "system-ui, sans-serif",
          fontWeight: 500,
          letterSpacing: 4,
          color: "rgba(255, 255, 255, 0.5)",
          marginBottom: 24,
          textTransform: "uppercase",
        }}
      />

      {/* Main headline */}
      <AnimatedText
        text={headline}
        startFrame={startFrame}
        delay={20}
        animation="slideUp"
        style={{
          fontSize: 48,
          fontFamily: "Georgia, serif",
          fontWeight: 400,
          color: "#ffffff",
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: 800,
          marginBottom: 40,
        }}
      />

      {/* CTA button */}
      <div
        style={{
          opacity: interpolate(localFrame, [30, 45], [0, 1], {
            extrapolateRight: "clamp",
          }),
          transform: `translateY(${interpolate(localFrame, [30, 45], [20, 0], {
            extrapolateRight: "clamp",
          })}px)`,
        }}
      >
        <div
          style={{
            padding: "16px 40px",
            background: "transparent",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            borderRadius: 2,
            fontSize: 14,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 500,
            letterSpacing: 2,
            color: "#ffffff",
            textTransform: "uppercase",
          }}
        >
          {cta}
        </div>
      </div>
    </AbsoluteFill>
  );
}
