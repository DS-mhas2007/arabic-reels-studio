import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { GoogleGenAI, Modality } from "@google/genai";

export interface VoiceRequest {
  text: string;
  model?: string;
  voice?: string;
  language?: string;
  cacheDir?: string;
}

export interface VoiceProvider {
  generate(request: VoiceRequest): Promise<string>;
}

export class EspeakVoiceProvider implements VoiceProvider {
  async generate(request: VoiceRequest): Promise<string> {
    const cacheDir = request.cacheDir ?? path.resolve("public", "audio");
    const key = createHash("sha256").update(request.text).digest("hex");
    const output = path.join(cacheDir, `${key}.wav`);
    await mkdir(cacheDir, { recursive: true });

    try {
      await readFile(output);
      return output;
    } catch {
      // Generate locally when no cached result exists.
    }

    const result = spawnSync(
      "espeak-ng",
      ["-v", "ar", "-s", "145", "-w", output, request.text],
      { stdio: "inherit" },
    );
    if (result.status !== 0) {
      throw new Error("espeak-ng failed to generate Arabic narration");
    }
    return output;
  }
}

export class GeminiVoiceProvider implements VoiceProvider {
  constructor(private readonly apiKey: string) {}

  async generate(request: VoiceRequest): Promise<string> {
    const model = request.model ?? process.env.GEMINI_TTS_MODEL ?? "gemini-2.5-flash-preview-tts";
    const voice = request.voice ?? process.env.GEMINI_TTS_VOICE ?? "Kore";
    const cacheDir = request.cacheDir ?? path.resolve("public", "audio");
    const key = createHash("sha256")
      .update(JSON.stringify({ model, voice, text: request.text }))
      .digest("hex");
    const output = path.join(cacheDir, `${key}.wav`);

    try {
      await readFile(output);
      return output;
    } catch {
      // Generate only when no cached result exists.
    }

    const ai = new GoogleGenAI({ apiKey: this.apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: request.text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const inline = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData?.data,
    )?.inlineData;
    if (!inline?.data) {
      throw new Error("Gemini TTS returned no audio data");
    }

    await mkdir(cacheDir, { recursive: true });
    const bytes = Buffer.from(inline.data, "base64");
    const mimeType = inline.mimeType ?? "";
    if (mimeType.toLowerCase().includes("wav") || mimeType.toLowerCase().includes("mpeg")) {
      await writeFile(output, bytes);
      return output;
    }

    const pcm = output.replace(/\.wav$/, ".pcm");
    await writeFile(pcm, bytes);
    const converted = spawnSync(
      "ffmpeg",
      ["-y", "-v", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", pcm, output],
      { stdio: "inherit" },
    );
    if (converted.status !== 0) {
      throw new Error("Failed to convert Gemini PCM audio to WAV");
    }
    return output;
  }
}

async function main() {
  const text = process.argv.slice(2).join(" ");
  if (!text) {
    throw new Error('Usage: npm run voice -- "النص العربي"');
  }
  const apiKey = process.env.GEMINI_API_KEY;
  const provider: VoiceProvider = apiKey
    ? new GeminiVoiceProvider(apiKey)
    : new EspeakVoiceProvider();
  const output = await provider.generate({ text });
  console.log(output);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
