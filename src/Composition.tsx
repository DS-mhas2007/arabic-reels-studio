import { Audio, Composition, Sequence, staticFile } from "remotion";
import { z } from "zod";
import { StudioConfig, studioSample } from "./studio/types";
import { Scene } from "./studio/Scene";

const studioSchema = z.object({
  width: z.number(),
  height: z.number(),
  fps: z.number(),
  durationInFrames: z.number(),
  scenes: z.array(z.any()),
  template: z.string(),
  narration: z.object({ src: z.string(), volume: z.number().optional() }).optional(),
  music: z
    .object({ src: z.string(), volume: z.number().optional(), startFrom: z.number().optional() })
    .optional(),
});

export const ArabicReelsStudio = () => {
  return (
    <Composition<typeof studioSchema, StudioConfig>
      id="ArabicReelsStudio"
      schema={studioSchema}
      component={StudioComposition}
      durationInFrames={studioSample.durationInFrames}
      fps={studioSample.fps}
      width={studioSample.width}
      height={studioSample.height}
      defaultProps={studioSample}
      calculateMetadata={({ props }) => ({
        durationInFrames: props.durationInFrames,
        fps: props.fps,
        width: props.width,
        height: props.height,
      })}
    />
  );
};

export const StudioComposition: React.FC<StudioConfig> = (props) => {
  let cursor = 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        direction: "rtl",
        background: "#090d18",
        overflow: "hidden",
      }}
    >
      {props.scenes.map((scene) => {
        const start = cursor;
        cursor += scene.durationInFrames;
        return (
          <Sequence key={scene.id} from={start} durationInFrames={scene.durationInFrames}>
            <Scene scene={scene} />
          </Sequence>
        );
      })}

      {props.narration?.src ? (
        <Audio src={staticFile(props.narration.src)} volume={props.narration.volume ?? 1} />
      ) : null}

      {props.music?.src ? (
        <Audio
          src={staticFile(props.music.src)}
          volume={props.music.volume ?? 0.12}
          startFrom={props.music.startFrom}
        />
      ) : null}
    </div>
  );
};
