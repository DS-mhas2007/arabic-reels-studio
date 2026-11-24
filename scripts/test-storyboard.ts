import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  approveScene,
  assertStoryboardApproved,
  updateScene,
} from "../src/storyboard/approval";
import { compileApprovedStoryboard } from "../src/storyboard/compiler";
import {
  loadStoryboardProject,
  saveStoryboardProject,
} from "../src/storyboard/persistence";
import {
  StoryboardProjectSchema,
  type StoryboardProject,
} from "../src/storyboard/schema";

const timestamp = "2026-01-01T00:00:00.000Z";
const project: StoryboardProject = StoryboardProjectSchema.parse({
  projectId: "benchmark",
  revisionId: "revision-1",
  revision: 1,
  createdAt: timestamp,
  updatedAt: timestamp,
  brief: {
    topic: "الذكاء الاصطناعي لا يفكر كما تعتقد",
    audience: "الجمهور العام",
    objective: "التثقيف",
    platform: "reels",
    language: "ar",
    targetDurationSeconds: 15,
    brand: "MahmoudLearns",
  },
  script: "الذكاء الاصطناعي لا يفكر كما تعتقد.",
  artDirection: {
    visualDirection: "Kinetic typography and cinematic motion",
    palette: {
      background: "#010A19",
      secondaryBackgrounds: ["#07152D", "#0D1F3C", "#112547"],
      primaryAccent: "#60F5D2",
      secondaryAccent: "#D6B2FC",
      text: "#EEF2F7",
    },
    typography: "IBM Plex Sans Arabic",
  },
  scenes: [
    {
      id: "opening",
      order: 0,
      durationFrames: 90,
      narrative: {
        purpose: "Hook",
        narration: "الذكاء الاصطناعي لا يفكر كما تعتقد.",
        emotionalIntent: "curiosity",
        keyMessage: "الأنماط ليست تفكيراً",
      },
      visual: {
        mode: "kinetic-typography",
        concept: "A bold statement appears in two beats",
        composition: "Centered, asymmetric line breaks",
        referenceAssetId: "opening-reference",
        background: "#010A19",
        focalPoint: "The highlighted Arabic phrase",
        layers: [],
      },
      typography: {
        text: "الذكاء الاصطناعي لا يفكر",
        fontFamily: "IBM Plex Sans Arabic",
        fontWeight: 700,
        emphasisWords: ["يفكر"],
        direction: "rtl",
        animationPreset: "word-reveal",
      },
      motion: {
        entrance: "word-reveal",
        emphasis: "scale-impact",
        exit: "fade",
        easing: "out-cubic",
        startFrame: 0,
        endFrame: 90,
      },
      audio: { soundEffects: [] },
      transition: "fade",
      assets: [
        {
          assetId: "opening-reference",
          kind: "reference-image",
          source: {
            provider: "test",
            localPath: "images/opening.png",
            license: "test",
          },
        },
      ],
      approval: { status: "review", version: 1 },
    },
    {
      id: "explanation",
      order: 1,
      durationFrames: 90,
      narrative: {
        purpose: "Explain the distinction",
        narration: "إنه يتعلم الأنماط من البيانات.",
        emotionalIntent: "clarity",
        keyMessage: "يتعلم الأنماط",
      },
      visual: {
        mode: "scientific",
        concept: "Patterns connect in a network",
        composition: "Diagram on a dark field",
        referenceAssetId: "explanation-reference",
        background: "#07152D",
        focalPoint: "Mint nodes in the center",
        layers: [],
      },
      typography: {
        text: "يتعلم الأنماط",
        fontFamily: "IBM Plex Sans Arabic",
        fontWeight: 700,
        emphasisWords: [],
        direction: "rtl",
        animationPreset: "scale-in",
      },
      motion: {
        entrance: "fade",
        emphasis: "none",
        exit: "fade",
        easing: "linear",
        startFrame: 0,
        endFrame: 90,
      },
      audio: { soundEffects: [] },
      transition: "fade",
      assets: [
        {
          assetId: "explanation-reference",
          kind: "reference-image",
          source: {
            provider: "test",
            localPath: "images/explanation.png",
            license: "test",
          },
        },
      ],
      approval: { status: "review", version: 1 },
    },
  ],
  approvalHistory: [],
});

assert.throws(
  () => assertStoryboardApproved(project),
  /Pending: opening, explanation/,
);
const firstApproved = approveScene(project, "opening", "human");
assert.throws(
  () => assertStoryboardApproved(firstApproved),
  /Pending: explanation/,
);
const fullyApproved = approveScene(firstApproved, "explanation", "human");
assertStoryboardApproved(fullyApproved);

const changed = updateScene(
  fullyApproved,
  "opening",
  {
    ...fullyApproved.scenes[0],
    typography: { ...fullyApproved.scenes[0].typography, text: "نسخة معدلة" },
  },
  "human",
);
assert.equal(changed.scenes[0].approval.status, "review");
assert.equal(changed.scenes[0].approval.version, 2);
assert.equal(changed.scenes[1].approval.status, "approved");
assert.throws(() => assertStoryboardApproved(changed), /Pending: opening/);

const compiled = compileApprovedStoryboard(fullyApproved, {
  width: 1080,
  height: 1920,
  fps: 30,
  template: "scientific",
});
assert.equal(compiled.durationInFrames, 180);
assert.deepEqual(
  compiled.scenes.map((scene) => scene.id),
  ["opening", "explanation"],
);
assert.equal(compiled.scenes[1].kind, "diagram");

assert.throws(
  () =>
    StoryboardProjectSchema.parse({
      ...project,
      scenes: [
        {
          ...project.scenes[0],
          motion: { ...project.scenes[0].motion, endFrame: 91 },
        },
      ],
    }),
  /Motion must end within the scene duration/,
);

async function testPersistence() {
  const persistenceDirectory = await mkdtemp(
    path.join(tmpdir(), "storyboard-tests-"),
  );
  try {
    await saveStoryboardProject(fullyApproved, persistenceDirectory);
    const loaded = await loadStoryboardProject(
      "benchmark",
      persistenceDirectory,
    );
    assert.deepEqual(loaded, fullyApproved);
  } finally {
    await rm(persistenceDirectory, { recursive: true, force: true });
  }
}

testPersistence()
  .then(() =>
    console.log(
      "Storyboard schema, approval lifecycle, persistence, revision isolation, and compiler checks passed.",
    ),
  )
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
