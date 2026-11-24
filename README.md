# AI-Powered Arabic Reels Production Studio

An Arabic-first, modular Remotion production environment for vertical Reels, Shorts, and TikTok videos.

## Implemented foundation

- 1080×1920 / 30 FPS vertical Remotion composition
- Scene-based production model
- RTL Arabic typography with word-level kinetic presets
- Cinematic hooks, diagrams, split layouts, and closing scenes
- Free local Arabic narration via `espeak-ng`
- Optional Gemini TTS provider with local cache
- Mixkit-compatible sound catalog metadata
- H.264 MP4 rendering and FFprobe-based validation

## Reference video

The rendered reference video is available at:

- [`out/arabic-reels-studio.mp4`](out/arabic-reels-studio.mp4)

It is 1080×1920 H.264 video with AAC narration.

## Environment

Copy `.env.example` to `.env` to enable optional Gemini TTS:

```console
cp .env.example .env
```

Without `GEMINI_API_KEY`, `npm run voice -- "النص العربي"` uses the free local `espeak-ng` provider.

## Commands

```console
npm install
npm run dev
npm run lint
npm run build
npm run render
npm run qa
```
