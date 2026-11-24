import type { StudioConfig, SceneConfig } from "../studio/types";
import { assertStoryboardApproved } from "./approval";
import { StoryboardProjectSchema, type StoryboardProject } from "./schema";

function resolveAudioAssetPath(
  scene: StoryboardProject["scenes"][number],
  assetId: string,
): string {
  const asset = scene.assets.find((candidate) => candidate.assetId === assetId);
  if (!asset || asset.kind !== "audio" || !asset.source.localPath) {
    throw new Error(
      `Scene ${scene.id} references an unresolved audio asset: ${assetId}`,
    );
  }
  return asset.source.localPath;
}

export function compileApprovedStoryboard(
  project: StoryboardProject,
  options: Pick<StudioConfig, "width" | "height" | "fps" | "template">,
): StudioConfig {
  const validatedProject = StoryboardProjectSchema.parse(project);
  assertStoryboardApproved(validatedProject);

  const scenes: SceneConfig[] = [...validatedProject.scenes]
    .sort((a, b) => a.order - b.order)
    .map((scene) => ({
      id: scene.id,
      kind: scene.visual.mode === "scientific" ? "diagram" : "visual",
      durationInFrames: scene.durationFrames,
      narration: scene.narrative.narration,
      typography: {
        text: scene.typography.text,
        preset: scene.typography.animationPreset,
        accent: validatedProject.artDirection.palette.primaryAccent,
        align: scene.typography.direction === "rtl" ? "right" : "left",
        size: 82,
      },
      background: scene.visual.background,
      accent: validatedProject.artDirection.palette.primaryAccent,
      soundEffects: scene.audio.soundEffects.map((effect) => ({
        src: resolveAudioAssetPath(scene, effect.assetId),
        frame: effect.startFrame,
        volume: effect.volume,
      })),
      transition: scene.transition,
    }));

  return {
    ...options,
    durationInFrames: scenes.reduce(
      (total, scene) => total + scene.durationInFrames,
      0,
    ),
    scenes,
    template: options.template,
  };
}
