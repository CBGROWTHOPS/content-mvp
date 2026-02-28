import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface AnimatedTextProps {
  text: string;
  startFrame?: number;
  style?: React.CSSProperties;
  animation?: "fadeIn" | "slideUp" | "slideDown" | "scaleIn";
  delay?: number;
}

export function AnimatedText({
  text,
  startFrame = 0,
  style = {},
  animation = "fadeIn",
  delay = 0,
}: AnimatedTextProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = frame - startFrame - delay;

  if (adjustedFrame < 0) return null;

  let opacity = 1;
  let translateY = 0;
  let scale = 1;

  switch (animation) {
    case "fadeIn":
      opacity = interpolate(adjustedFrame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
      });
      break;
    case "slideUp":
      opacity = interpolate(adjustedFrame, [0, 12], [0, 1], {
        extrapolateRight: "clamp",
      });
      translateY = interpolate(adjustedFrame, [0, 15], [30, 0], {
        extrapolateRight: "clamp",
      });
      break;
    case "slideDown":
      opacity = interpolate(adjustedFrame, [0, 12], [0, 1], {
        extrapolateRight: "clamp",
      });
      translateY = interpolate(adjustedFrame, [0, 15], [-30, 0], {
        extrapolateRight: "clamp",
      });
      break;
    case "scaleIn":
      opacity = interpolate(adjustedFrame, [0, 10], [0, 1], {
        extrapolateRight: "clamp",
      });
      scale = spring({
        frame: adjustedFrame,
        fps,
        config: { damping: 12, stiffness: 200 },
      });
      break;
  }

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        ...style,
      }}
    >
      {text}
    </div>
  );
}
