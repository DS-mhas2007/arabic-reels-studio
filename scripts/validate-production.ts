import { access, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

async function validate() {
  const output = path.resolve("out", "arabic-reels-studio.mp4");
  const checks: CheckResult[] = [];

  try {
    await access(output);
    const info = await stat(output);
    checks.push({
      name: "Final MP4 exists",
      passed: info.size > 1000,
      detail: `${info.size} bytes`,
    });
  } catch {
    checks.push({ name: "Final MP4 exists", passed: false, detail: "output missing" });
  }

  const ffprobe = spawnSync("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height,r_frame_rate,codec_name",
    "-of",
    "json",
    output,
  ], { encoding: "utf8" });

  if (ffprobe.status === 0) {
    try {
      const stream = JSON.parse(ffprobe.stdout).streams[0];
      checks.push({
        name: "Vertical H.264 video",
        passed:
          stream.codec_name === "h264" &&
          stream.width === 1080 &&
          stream.height === 1920,
        detail: `${stream.width}x${stream.height}, ${stream.codec_name}, ${stream.r_frame_rate}`,
      });
    } catch {
      checks.push({ name: "FFprobe validation", passed: false, detail: "invalid probe output" });
    }
  } else {
    checks.push({ name: "FFprobe validation", passed: false, detail: ffprobe.stderr.trim() });
  }

  const audioProbe = spawnSync("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "a:0",
    "-show_entries",
    "stream=codec_name,channels,sample_rate",
    "-of",
    "json",
    output,
  ], { encoding: "utf8" });

  if (audioProbe.status === 0) {
    try {
      const stream = JSON.parse(audioProbe.stdout).streams?.[0];
      checks.push({
        name: "Narration audio stream",
        passed: Boolean(stream?.codec_name === "aac"),
        detail: stream
          ? `${stream.codec_name}, ${stream.channels} channel(s), ${stream.sample_rate} Hz`
          : "missing audio stream",
      });
    } catch {
      checks.push({ name: "Narration audio stream", passed: false, detail: "invalid probe output" });
    }
  } else {
    checks.push({
      name: "Narration audio stream",
      passed: false,
      detail: audioProbe.stderr.trim(),
    });
  }

  for (const check of checks) {
    console.log(`${check.passed ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`);
  }

  if (checks.some((check) => !check.passed)) {
    process.exit(1);
  }
}

validate();
