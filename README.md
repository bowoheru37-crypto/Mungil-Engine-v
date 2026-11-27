# Mungil Engine V7 — Bowo: Guardian of Light (React Web)

React + TypeScript + Vite + Tailwind CSS rewrite of **Mungil Engine V7**, optimized for low-entry mobile and desktop browsers (target 30–60 FPS, zero-GC SoA/TypedArray simulation loops).

## Features
- **3-Chapter Action RPG (`Bowo: Penjaga Cahaya`)**: Play Desa Fajar, Jembatan Badai, and Menara Kala (3-phase Boss Kala) with customizable Virtual Joystick, keyboard bindings (`WASD`/Arrows, `Space`, `J`/`K`/`L`/`H`), Dash Parry, Burst, coyote time, and 16 playable genre templates.
- **12 Studio Tabs**: Play, Scene & Physics Inspector (6 presets, drag-and-drop Box/Circle/Polygon collision editor, Keep-World grouping), AI & Local 16-Tool MCP Hub, Qolbu Arena AI (Solo Coach, Co-Play Companion, VS Boss Kala), Asset Manager (2 MB LRU + 16x16 Pixel & 12x8 Tilemap editors), Procedural Generators (Character 3D-Stack, Low-Poly 3D Mesh `.obj`/`.gltf`, Music Tracker, SFX/TTS+SRT/VTT, Cutscene, Terrain, Complete Game Forge), Touch Controls & Accessibility (Dark/Light/High Contrast, 5 languages), 12 Art Styles + Palette/Shader editor, Bytecode VM + No-Code Event Sheet + 25 Validators + 8-Stage Security Audit, AI Skills (`CLAUDE.md`, `GEMINI.md`, etc.), Offline 3-Slot+Auto Saves (`localStorage` with FNV-1a checksum & v6.1->v7.0 migration), and File Export (`JSON`, `MPAK7` RLE `.pak`, Standalone `HTML`, Android SDK target config).
- **Zero-KB Procedural Audio**: Web Audio API 3-channel chiptune tracker, stereo-panned SFX synthesizer, and Web Speech API dubbing.

## Development & Build
```bash
npm install
npm run dev
npm run lint
npm run build
```

