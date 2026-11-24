import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ArabicTypography } from "./ArabicTypography";
import { SceneConfig } from "./types";

const Grid: React.FC<{ accent: string }> = ({ accent }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      opacity: 0.12,
      backgroundImage:
        `linear-gradient(${accent}33 1px, transparent 1px),` +
        `linear-gradient(90deg, ${accent}33 1px, transparent 1px)`,
      backgroundSize: "72px 72px",
    }}
  />
);

export const Scene: React.FC<{ scene: SceneConfig }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: scene.background,
        opacity: scene.transition === "fade" ? exit : 1,
      }}
    >
      {scene.kind === "diagram" ? <Grid accent={scene.accent} /> : null}
      {scene.kind === "visual" || scene.kind === "diagram" ? (
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            border: `2px solid ${scene.accent}`,
            left: -150,
            bottom: 220,
            opacity: 0.18,
            transform: `scale(${1 + frame * 0.002})`,
          }}
        />
      ) : null}
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <ArabicTypography config={scene.typography} />
      </div>
    </AbsoluteFill>
  );
};
