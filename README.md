# AI-Powered Arabic Reels Production Studio

An Arabic-first, modular Remotion production environment for vertical Reels, Shorts, and TikTok videos.

## Implemented foundation

- Typed storyboard project schema with Zod validation
- Version-specific scene approval and revision history
- Atomic project persistence under `projects/`
- Deterministic storyboard compiler that blocks production until every current scene revision is approved
- 1080×1920 / 30 FPS vertical Remotion composition
- Scene-based production model
- RTL Arabic typography with word-level kinetic presets
- Cinematic hooks, diagrams, split layouts, and closing scenes
- Free local Arabic narration via `espeak-ng`
- Optional Gemini TTS provider with local cache
- Mixkit-compatible sound catalog metadata
- H.264 MP4 rendering and FFprobe-based validation

## Reference video

The rendered reference composition is available at:

- [`public/videos/arabic-reels-studio.mp4`](public/videos/arabic-reels-studio.mp4)

It is a 15-second, 1080×1920 H.264 video with AAC narration. This render demonstrates the existing Remotion composition; it is not yet compiled from an approved storyboard project.

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
npm run test:storyboard
npm run build
npm run render
npm run qa
```

Storyboard projects use stable project and asset IDs. A scene edit increments only that scene's version and returns it to review; approvals for unaffected scenes remain intact. The current editor workflow is exposed as typed APIs and is not yet a graphical Storyboard Studio.
