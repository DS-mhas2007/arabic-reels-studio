export type TypographyPreset =
  | "word-reveal"
  | "character-reveal"
  | "scale-in"
  | "slide-in"
  | "blur-focus";

export type SceneKind =
  | "hook"
  | "story"
  | "visual"
  | "diagram"
  | "split"
  | "closing";

export interface TypographyConfig {
  text: string;
  eyebrow?: string;
  preset: TypographyPreset;
  accent?: string;
  align?: "right" | "center" | "left";
  size?: number;
}

export interface SoundEffectConfig {
  src: string;
  frame: number;
  volume?: number;
}

export interface SceneConfig {
  id: string;
  kind: SceneKind;
  durationInFrames: number;
  narration?: string;
  typography: TypographyConfig;
  background: string;
  accent: string;
  soundEffects?: SoundEffectConfig[];
  transition?: "fade" | "wipe" | "glitch" | "none";
}

export interface StudioConfig extends Record<string, unknown> {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  scenes: SceneConfig[];
  narration?: { src: string; volume?: number };
  music?: { src: string; volume?: number; startFrom?: number };
  template: "cinematic-knowledge" | "premium-tech" | "scientific" | "medical" | "kinetic" | "minimal";
}

export const studioSample: StudioConfig = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 450,
  template: "premium-tech",
  narration: {
    src: "audio/narration.wav",
    volume: 0.92,
  },
  scenes: [
    {
      id: "hook",
      kind: "hook",
      durationInFrames: 90,
      typography: {
        text: "نموذج ذكي لا يعني طبيباً ذكياً",
        eyebrow: "سؤال واحد يغيّر الفهم",
        preset: "word-reveal",
        accent: "#69e5c4",
      },
      background: "#090d18",
      accent: "#69e5c4",
      transition: "wipe",
    },
    {
      id: "contrast",
      kind: "split",
      durationInFrames: 120,
      typography: {
        text: "الذكاء الاصطناعي يعالج النمط... والطبيب يفهم المريض",
        preset: "slide-in",
        accent: "#ffbe55",
      },
      background: "#10182a",
      accent: "#ffbe55",
      transition: "fade",
    },
    {
      id: "network",
      kind: "diagram",
      durationInFrames: 150,
      typography: {
        text: "السياق هو الفرق",
        eyebrow: "بيانات • تجربة • حوار",
        preset: "blur-focus",
        accent: "#8ea7ff",
      },
      background: "#080b14",
      accent: "#8ea7ff",
      transition: "glitch",
    },
    {
      id: "closing",
      kind: "closing",
      durationInFrames: 90,
      typography: {
        text: "الذكاء الحقيقي في التعاون",
        preset: "scale-in",
        accent: "#69e5c4",
      },
      background: "#090d18",
      accent: "#69e5c4",
      transition: "fade",
    },
  ],
};
