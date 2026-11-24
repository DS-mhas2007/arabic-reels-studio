import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { StoryboardProjectSchema, type StoryboardProject } from "./schema";

export async function saveStoryboardProject(
  project: StoryboardProject,
  directory = path.resolve("projects"),
): Promise<string> {
  const validated = StoryboardProjectSchema.parse(project);
  await mkdir(directory, { recursive: true });

  const output = path.join(directory, `${validated.projectId}.json`);
  const temporary = `${output}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
  await rename(temporary, output);
  return output;
}

export async function loadStoryboardProject(
  projectId: string,
  directory = path.resolve("projects"),
): Promise<StoryboardProject> {
  if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) {
    throw new Error("Invalid project ID.");
  }
  const contents = await readFile(
    path.join(directory, `${projectId}.json`),
    "utf8",
  );
  return StoryboardProjectSchema.parse(JSON.parse(contents));
}
