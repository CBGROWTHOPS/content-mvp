import React from "react";
import { registerRoot } from "remotion";
import { Composition } from "remotion";
import { ReelComposition, reelCompositionConfig } from "./ReelComposition";

const Root: React.FC = () => (
  <>
    <Composition
      id={reelCompositionConfig.id}
      component={ReelComposition}
      durationInFrames={reelCompositionConfig.durationInFrames}
      fps={reelCompositionConfig.fps}
      width={reelCompositionConfig.width}
      height={reelCompositionConfig.height}
      defaultProps={reelCompositionConfig.defaultProps}
      calculateMetadata={({ props }) => {
        const blueprint = props.blueprint as typeof reelCompositionConfig.defaultProps.blueprint;
        const durationSeconds = blueprint?.durationSeconds ?? 30;
        const fps = blueprint?.fps ?? 24;
        const isWide = blueprint?.format === "wide_video_kit";
        return {
          durationInFrames: Math.ceil(durationSeconds * fps),
          fps,
          width: isWide ? 1920 : 1080,
          height: isWide ? 1080 : 1920,
        };
      }}
    />
  </>
);

registerRoot(Root);
