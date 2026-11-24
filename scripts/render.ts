import { spawnSync } from "node:child_process";
import path from "node:path";

const output = path.resolve("out", "arabic-reels-studio.mp4");
const result = spawnSync(
  "npx",
  [
    "--yes",
    "remotion",
    "render",
    "src/index.ts",
    "ArabicReelsStudio",
    output,
    "--codec=h264",
    "--scale=1",
    "--browser-executable=/usr/bin/google-chrome",
  ],
  { stdio: "inherit" },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
