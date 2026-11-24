import { z } from "zod";

export const ApprovalStatusSchema = z.enum([
  "draft",
  "generating",
  "review",
  "approved",
  "rejected",
  "production",
  "rendered",
  "failed",
]);

export const VisualModeSchema = z.enum([
  "kinetic-typography",
  "cinematic",
  "scientific",
  "data-visualization",
  "hybrid",
]);

export const TypographyPresetSchema = z.enum([
  "word-reveal",
  "character-reveal",
  "scale-in",
  "slide-in",
  "blur-focus",
]);

const AssetIdSchema = z.string().regex(/^[a-zA-Z0-9_-]+$/);
const ColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const AssetSourceSchema = z.object({
  provider: z.string().min(1),
  localPath: z.string().min(1).optional(),
  sourceUrl: z.string().url().optional(),
  license: z.string().min(1),
  attribution: z.string().optional(),
});

export const StoryboardSceneSchema = z
  .object({
    id: z.string().min(1),
    order: z.number().int().nonnegative(),
    durationFrames: z.number().int().positive(),
    narrative: z.object({
      purpose: z.string().min(1),
      narration: z.string(),
      emotionalIntent: z.string(),
      keyMessage: z.string().min(1),
    }),
    visual: z.object({
      mode: VisualModeSchema,
      concept: z.string().min(1),
      composition: z.string().min(1),
      referenceAssetId: AssetIdSchema,
      background: z.string().min(1),
      focalPoint: z.string().min(1),
      layers: z.array(
        z.object({
          id: z.string().min(1),
          type: z.string().min(1),
          description: z.string().min(1),
          zIndex: z.number().int(),
        }),
      ),
    }),
    typography: z.object({
      text: z.string().min(1),
      fontFamily: z.string().min(1),
      fontWeight: z.number().int().min(100).max(900),
      emphasisWords: z.array(z.string()),
      direction: z.enum(["rtl", "ltr"]),
      animationPreset: TypographyPresetSchema,
    }),
    motion: z.object({
      entrance: z.string().min(1),
      emphasis: z.string(),
      exit: z.string().min(1),
      easing: z.string().min(1),
      startFrame: z.number().int().nonnegative(),
      endFrame: z.number().int().positive(),
    }),
    audio: z.object({
      narrationSegmentId: z.string().optional(),
      soundEffects: z.array(
        z.object({
          assetId: z.string().min(1),
          startFrame: z.number().int().nonnegative(),
          volume: z.number().min(0).max(1),
        }),
      ),
    }),
    transition: z.enum(["fade", "wipe", "glitch", "none"]),
    assets: z.array(
      z.object({
        assetId: AssetIdSchema,
        kind: z.enum(["reference-image", "image", "audio", "graphic"]),
        source: AssetSourceSchema,
      }),
    ),
    approval: z.object({
      status: ApprovalStatusSchema,
      approvedAt: z.string().datetime().optional(),
      approvedVersion: z.number().int().positive().optional(),
      feedback: z.string().optional(),
      version: z.number().int().positive(),
    }),
  })
  .superRefine((scene, context) => {
    if (scene.motion.endFrame > scene.durationFrames) {
      context.addIssue({
        code: "custom",
        path: ["motion", "endFrame"],
        message: "Motion must end within the scene duration.",
      });
    }
    if (scene.motion.startFrame >= scene.motion.endFrame) {
      context.addIssue({
        code: "custom",
        path: ["motion", "startFrame"],
        message: "Motion must start before it ends.",
      });
    }
    if (
      scene.approval.status === "approved" &&
      scene.approval.approvedVersion !== scene.approval.version
    ) {
      context.addIssue({
        code: "custom",
        path: ["approval", "approvedVersion"],
        message: "An approved scene must be approved at its current version.",
      });
    }
    if (
      !scene.assets.some(
        (asset) =>
          asset.assetId === scene.visual.referenceAssetId &&
          asset.kind === "reference-image",
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["visual", "referenceAssetId"],
        message:
          "The reference image ID must resolve to a scene reference-image asset.",
      });
    }
    for (const [index, effect] of scene.audio.soundEffects.entries()) {
      const asset = scene.assets.find(
        (candidate) => candidate.assetId === effect.assetId,
      );
      if (!asset || asset.kind !== "audio" || !asset.source.localPath) {
        context.addIssue({
          code: "custom",
          path: ["audio", "soundEffects", index, "assetId"],
          message:
            "Sound effects must resolve to an audio asset with a stable local path.",
        });
      }
      if (effect.startFrame >= scene.durationFrames) {
        context.addIssue({
          code: "custom",
          path: ["audio", "soundEffects", index, "startFrame"],
          message: "Sound effects must start within the scene duration.",
        });
      }
    }
    if (
      new Set(scene.assets.map((asset) => asset.assetId)).size !==
      scene.assets.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["assets"],
        message: "Asset IDs must be unique within a scene.",
      });
    }
  });

export const StoryboardProjectSchema = z
  .object({
    projectId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    revisionId: z.string().min(1),
    revision: z.number().int().positive(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    brief: z.object({
      topic: z.string().min(1),
      audience: z.string().min(1),
      objective: z.string().min(1),
      platform: z.string().min(1),
      language: z.string().min(1),
      targetDurationSeconds: z.number().positive(),
      brand: z.string().min(1),
    }),
    script: z.string().min(1),
    artDirection: z.object({
      visualDirection: z.string().min(1),
      palette: z.object({
        background: ColorSchema,
        secondaryBackgrounds: z.array(ColorSchema),
        primaryAccent: ColorSchema,
        secondaryAccent: ColorSchema,
        text: ColorSchema,
      }),
      typography: z.string().min(1),
    }),
    scenes: z.array(StoryboardSceneSchema).min(1),
    approvalHistory: z.array(
      z.object({
        id: z.string().min(1),
        sceneId: z.string().min(1),
        sceneVersion: z.number().int().positive(),
        action: z.enum(["approved", "rejected", "revised"]),
        actor: z.string().min(1),
        timestamp: z.string().datetime(),
        feedback: z.string().optional(),
      }),
    ),
  })
  .superRefine((project, context) => {
    const sceneIds = project.scenes.map((scene) => scene.id);
    if (new Set(sceneIds).size !== sceneIds.length) {
      context.addIssue({
        code: "custom",
        path: ["scenes"],
        message: "Scene IDs must be unique within a project.",
      });
    }
    const orders = project.scenes.map((scene) => scene.order);
    if (new Set(orders).size !== orders.length) {
      context.addIssue({
        code: "custom",
        path: ["scenes"],
        message: "Scene order values must be unique within a project.",
      });
    }
  });

export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;
export type VisualMode = z.infer<typeof VisualModeSchema>;
export type StoryboardScene = z.infer<typeof StoryboardSceneSchema>;
export type StoryboardProject = z.infer<typeof StoryboardProjectSchema>;
