import {
  StoryboardProjectSchema,
  type StoryboardProject,
  type StoryboardScene,
} from "./schema";

type SceneContent = Omit<StoryboardScene, "approval">;
type ApprovalAction = "approved" | "rejected" | "revised";

const now = () => new Date().toISOString();

function reviseProject(
  project: StoryboardProject,
  scenes: StoryboardScene[],
  historyEntry?: {
    sceneId: string;
    sceneVersion: number;
    action: ApprovalAction;
    actor: string;
    feedback?: string;
  },
): StoryboardProject {
  const timestamp = now();
  return StoryboardProjectSchema.parse({
    ...project,
    revision: project.revision + 1,
    revisionId: `revision-${project.revision + 1}`,
    updatedAt: timestamp,
    scenes,
    approvalHistory: historyEntry
      ? [
          ...project.approvalHistory,
          { ...historyEntry, id: crypto.randomUUID(), timestamp },
        ]
      : project.approvalHistory,
  });
}

export function updateScene(
  project: StoryboardProject,
  sceneId: string,
  content: SceneContent,
  actor: string,
): StoryboardProject {
  const current = project.scenes.find((scene) => scene.id === sceneId);
  if (!current) throw new Error(`Unknown scene: ${sceneId}`);
  if (!actor.trim())
    throw new Error("An actor is required to record a scene change.");

  const updated: StoryboardScene = {
    ...content,
    id: current.id,
    order: current.order,
    approval: {
      status: "review",
      feedback: undefined,
      version: current.approval.version + 1,
    },
  };
  const scenes = project.scenes.map((scene) =>
    scene.id === sceneId ? updated : scene,
  );
  return reviseProject(project, scenes, {
    sceneId,
    sceneVersion: updated.approval.version,
    action: "revised",
    actor,
  });
}

export function approveScene(
  project: StoryboardProject,
  sceneId: string,
  actor: string,
): StoryboardProject {
  const current = project.scenes.find((scene) => scene.id === sceneId);
  if (!current) throw new Error(`Unknown scene: ${sceneId}`);
  if (!actor.trim())
    throw new Error("An actor is required to approve a scene.");
  if (current.approval.status !== "review") {
    throw new Error(
      `Scene ${sceneId} must be in review before it can be approved.`,
    );
  }

  const updated: StoryboardScene = {
    ...current,
    approval: {
      status: "approved",
      approvedAt: now(),
      approvedVersion: current.approval.version,
      version: current.approval.version,
    },
  };
  return reviseProject(
    project,
    project.scenes.map((scene) => (scene.id === sceneId ? updated : scene)),
    {
      sceneId,
      sceneVersion: updated.approval.version,
      action: "approved",
      actor,
    },
  );
}

export function rejectScene(
  project: StoryboardProject,
  sceneId: string,
  feedback: string,
  actor: string,
): StoryboardProject {
  const current = project.scenes.find((scene) => scene.id === sceneId);
  if (!current) throw new Error(`Unknown scene: ${sceneId}`);
  if (!feedback.trim())
    throw new Error("Feedback is required when rejecting a scene.");
  if (!actor.trim()) throw new Error("An actor is required to reject a scene.");

  const updated: StoryboardScene = {
    ...current,
    approval: {
      status: "rejected",
      feedback,
      version: current.approval.version,
    },
  };
  return reviseProject(
    project,
    project.scenes.map((scene) => (scene.id === sceneId ? updated : scene)),
    {
      sceneId,
      sceneVersion: updated.approval.version,
      action: "rejected",
      actor,
      feedback,
    },
  );
}

export function assertStoryboardApproved(project: StoryboardProject): void {
  const pending = project.scenes.filter(
    (scene) =>
      scene.approval.status !== "approved" ||
      scene.approval.approvedVersion !== scene.approval.version,
  );
  if (pending.length > 0) {
    throw new Error(
      `Production requires current approval for every scene. Pending: ${pending
        .map((scene) => scene.id)
        .join(", ")}`,
    );
  }
}
