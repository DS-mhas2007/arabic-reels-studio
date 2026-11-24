import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { staticFile } from "remotion";
import { TypographyConfig } from "./types";

const getStyle = (preset: TypographyConfig["preset"], progress: number) => {
  const opacity = interpolate(progress, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });
  if (preset === "scale-in") {
    return { opacity, transform: `scale(${interpolate(progress, [0, 1], [0.78, 1])})` };
  }
  if (preset === "slide-in") {
    return { opacity, transform: `translateX(${interpolate(progress, [0, 1], [160, 0])}px)` };
  }
  if (preset === "blur-focus") {
    return { opacity, filter: `blur(${interpolate(progress, [0, 1], [18, 0])}px)` };
  }
  return { opacity };
};

export const ArabicTypography: React.FC<{ config: TypographyConfig }> = ({ config }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 140, mass: 0.7 },
  });

  const words = config.text.split(/\s+/);
  const stagger = config.preset === "word-reveal";

  return (
    <>
      <style>{`
        @font-face {
          font-family: "Studio Arabic";
          src: url("${staticFile("fonts/FreeSans.ttf")}") format("truetype");
          font-weight: 400;
        }
        @font-face {
          font-family: "Studio Arabic";
          src: url("${staticFile("fonts/FreeSansBold.ttf")}") format("truetype");
          font-weight: 700;
        }
      `}</style>
      <div
        style={{
          direction: "rtl",
          textAlign: config.align ?? "right",
          fontFamily: "Studio Arabic",
          width: "82%",
          margin: "0 auto",
        }}
      >
      {config.eyebrow ? (
        <div
          style={{
            color: config.accent,
            fontSize: 34,
            letterSpacing: 1,
            marginBottom: 28,
          }}
        >
          {config.eyebrow}
        </div>
      ) : null}
      <div
        style={{
          color: "#f7f4ea",
          fontSize: config.size ?? 82,
          fontWeight: 700,
          lineHeight: 1.28,
          direction: "rtl",
          unicodeBidi: "isolate",
        }}
      >
        {words.map((word, index) => {
          const progress = stagger
            ? spring({
                frame: frame - index * 4,
                fps,
                config: { damping: 16, stiffness: 180 },
              })
            : entrance;
          return (
            <span
              key={`${word}-${index}`}
              style={{
                display: "inline-block",
                marginInlineEnd: "0.22em",
                ...getStyle(config.preset, progress),
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
    </>
  );
};
