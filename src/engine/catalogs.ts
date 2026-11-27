import { AssetCatalogItem, GenreTemplate, RepoCredit } from './types';

export interface SandboxSku {
  id: string;
  title: string;
  price: string;
  coins: number;
  potions: number;
  desc: string;
}

export interface RepoMatrixEntry {
  name: string;
  license: string;
  what: string;
  adapt: string;
}

export interface GeneratorGroupEntry {
  title: string;
  repos: [string, string, string][];
}

export const GENRE_TEMPLATES: GenreTemplate[] = [
  { id: 'platformer', name: '2D Action Platformer', renderMode: '2.5D', physicsMode: 'Arcade', styleId: 'pixel', weather: 'Cerah', gravityMul: 1, speedMul: 1, desc: 'Classic side-scrolling jump, parry, and Light Shard adventure.' },
  { id: 'rpg', name: 'Top-Down Action RPG', renderMode: '2.5D', physicsMode: 'Arcade', styleId: 'anime', weather: 'Cerah', gravityMul: 0, speedMul: 1.05, desc: 'Free 8-way village & shrine dungeon exploration with melee combos.' },
  { id: 'shooter', name: 'Space Shoot-Em-Up', renderMode: '2D', physicsMode: 'Zero-G', styleId: 'cyberpunk', weather: 'Cerah', gravityMul: 0, speedMul: 1.25, desc: 'Zero-gravity thruster dodging and luminous blaster waves.' },
  { id: 'racing', name: 'Mode-7 Turbo Dash', renderMode: '2.5D', physicsMode: 'Arcade', styleId: 'retro', weather: 'Cerah', gravityMul: 0, speedMul: 1.35, desc: 'Pseudo-3D horizon speed runs with boost rings and obstacles.' },
  { id: 'puzzle', name: 'Light Switch Puzzle', renderMode: '2D', physicsMode: 'Arcade', styleId: 'minimal', weather: 'Cerah', gravityMul: 0.9, speedMul: 0.9, desc: 'Precision switch routing and crystal beam alignment.' },
  { id: 'roguelike', name: 'Procedural Crypt', renderMode: '2D', physicsMode: 'Arcade', styleId: 'silhouette', weather: 'Salju', gravityMul: 1, speedMul: 1.05, desc: 'Seed-driven dungeon waves with randomized loot pickups.' },
  { id: 'rhythm', name: 'Beat Parry Quest', renderMode: '2.5D', physicsMode: 'Arcade', styleId: 'chibi', weather: 'Cerah', gravityMul: 0.95, speedMul: 1, desc: 'Timed parry & dash sync challenges with glowing hit rings.' },
  { id: 'tower_defense', name: 'Lantern Defense', renderMode: '2.5D', physicsMode: 'Arcade', styleId: 'isometric', weather: 'Hujan', gravityMul: 0, speedMul: 0.95, desc: 'Protect the Village Gate from escalating shadow patrols.' },
  { id: 'survival', name: 'Blizzard Survival', renderMode: '2.5D', physicsMode: 'Realistic', styleId: 'watercolor', weather: 'Salju', gravityMul: 1.05, speedMul: 0.9, desc: 'Heavy winter inertia, stamina conservation, and warm shrines.' },
  { id: 'fighting', name: '1v1 Boss Duel', renderMode: '2.5D', physicsMode: 'Arcade', styleId: 'anime', weather: 'Hujan', gravityMul: 1.1, speedMul: 1.15, desc: 'Tight arena combat focused on Dash Parry and Burst counters.' },
  { id: 'brawler', name: 'Street Beat-Em-Up', renderMode: '2.5D', physicsMode: 'Arcade', styleId: 'cartoon', weather: 'Cerah', gravityMul: 0, speedMul: 1.1, desc: 'Lane-based multi-enemy melee waves with knockback combos.' },
  { id: 'metroidvania', name: 'Shadow Keep', renderMode: '2D', physicsMode: 'Arcade', styleId: 'lowpoly', weather: 'Hujan', gravityMul: 1, speedMul: 1, desc: 'Interconnected shrine platforms with double-jump verticality.' },
  { id: 'simulation', name: 'Village Steward', renderMode: '2.5D', physicsMode: 'Realistic', styleId: 'voxel', weather: 'Cerah', gravityMul: 0.85, speedMul: 0.85, desc: 'Calm village patrol, resource gathering, and weather cycles.' },
  { id: 'idle', name: 'Auto-Coin Collector', renderMode: '2D', physicsMode: 'Arcade', styleId: 'chibi', weather: 'Cerah', gravityMul: 0.85, speedMul: 1.15, desc: 'Relaxed coin magnet collection and passive shrine upgrades.' },
  { id: 'visual_novel', name: 'Story Sanctuary', renderMode: '2.5D', physicsMode: 'Arcade', styleId: 'watercolor', weather: 'Cerah', gravityMul: 0.7, speedMul: 0.8, desc: 'Narrative exploration of Desa Fajar with branching choices.' },
  { id: 'ai_arena', name: 'Qolbu AI Co-Op & Autopilot', renderMode: '3D-Stack', physicsMode: 'Arcade', styleId: 'cyberpunk', weather: 'Cerah', gravityMul: 1, speedMul: 1.1, desc: '3D-Stack hero with 15Hz Luma AI Companion or full Autopilot mode.' }
];

export const ASSET_CATALOG: AssetCatalogItem[] = [
  { id: 'bowo_hero', name: 'Bowo Guardian Rig', category: 'Character', memoryKb: 18, desc: 'Procedural animated hero with articulated limbs, cloak sway, and weapon arcs.' },
  { id: 'luma_companion', name: 'Luma Light Wisp', category: 'Companion', memoryKb: 4, desc: 'Floating companion aura sprite that tracks Bowo with spring damping.' },
  { id: 'slime_mob', name: 'Shadow Slime', category: 'Enemy', memoryKb: 6, desc: 'Bouncing patrol enemy with squash-and-stretch deformation.' },
  { id: 'wisp_ranged', name: 'Dark Wisp Shooter', category: 'Enemy', memoryKb: 8, desc: 'Hovering turret firing parry-able energy bolts.' },
  { id: 'sentinel_heavy', name: 'Obsidian Sentinel', category: 'Enemy', memoryKb: 12, desc: 'Armored shield guard with telegraph wind-up ring.' },
  { id: 'boss_kala', name: 'Boss Kala (3-Phase)', category: 'Boss', memoryKb: 24, desc: 'Menara Kala ruler with multi-orb radial bursts and phase enrages.' },
  { id: 'dawn_tiles', name: 'Dawn Village Tileset', category: 'Environment', memoryKb: 14, desc: 'Layered grass, stone brick, wooden bridges, and lantern posts.' },
  { id: 'storm_bridge', name: 'Storm Bridge Props', category: 'Environment', memoryKb: 16, desc: 'Floor pressure switches, rain streaks, and lightning clouds.' },
  { id: 'sfx_pack', name: '4-Channel Synth Audio', category: 'Audio', memoryKb: 0, desc: 'Zero-KB procedural Web Audio tracker BGM + 18 sound effects.' },
  { id: 'particle_pool', name: '160-Slot Particle Ring', category: 'VFX', memoryKb: 6, desc: 'Zero-GC particle pool for slashes, dust, sparks, and healing bursts.' }
];

export const REPO_CREDITS: RepoCredit[] = [
  { tier: 'A', name: 'GDevelop', license: 'MIT', url: 'https://github.com/4ian/GDevelop', adoption: 'No-Code WHEN -> THEN Event Sheet rule engine' },
  { tier: 'A', name: 'LÖVE2D', license: 'zlib', url: 'https://github.com/love2d/love', adoption: 'Fixed-timestep dt clamp & lightweight 2D canvas loop' },
  { tier: 'A', name: 'Phaser', license: 'MIT', url: 'https://github.com/phaserjs/phaser', adoption: 'Arcade AABB physics, coyote time, & jump buffering' },
  { tier: 'A', name: 'Godot Engine', license: 'MIT', url: 'https://github.com/godotengine/godot', adoption: 'Node scene architecture & pause-aware processing' },
  { tier: 'A', name: 'PixiJS', license: 'MIT', url: 'https://github.com/pixijs/pixijs', adoption: 'High-throughput 2D draw batching & DPR resolution cap' },
  { tier: 'A', name: 'Defold', license: 'Defold-1.0', url: 'https://github.com/defold/defold', adoption: 'Under-2 MB memory footprint & zero-GC object pools' },
  { tier: 'A', name: 'bitecs', license: 'MIT', url: 'https://github.com/NateTheGregg/bitecs', adoption: 'Structure-of-Arrays (SoA) TypedArray entity memory' },
  { tier: 'A', name: 'Excalibur.js', license: 'BSD-2-Clause', url: 'https://github.com/excaliburjs/Excalibur', adoption: 'Clean entity lifecycle & debug collider overlay' },
  { tier: 'A', name: 'Kontra.js', license: 'MIT', url: 'https://github.com/straker/kontra', adoption: 'Compact sprite pools & tiny touch-first bundle' },
  { tier: 'A', name: 'Three.js', license: 'MIT', url: 'https://github.com/mrdoob/three.js', adoption: '2.5D depth layering & camera projection math' },
  { tier: 'B', name: 'Aseprite', license: 'EULA/Open', url: 'https://github.com/aseprite/aseprite', adoption: '16x16 / 32x32 indexed pixel sprite editor grid' },
  { tier: 'B', name: 'Tiled', license: 'GPL/BSD', url: 'https://github.com/mapeditor/tiled', adoption: '12x8 tilemap painting & export schema' },
  { tier: 'B', name: 'DragonBones', license: 'MIT', url: 'https://github.com/DragonBones/DragonBonesJS', adoption: 'Procedural articulated limb & cloak animation' },
  { tier: 'B', name: 'Spine-inspired', license: 'Custom', url: 'https://esotericsoftware.com', adoption: 'Keyframe interpolation & hitstop timing curves' },
  { tier: 'B', name: 'ZzFX', license: 'MIT', url: 'https://github.com/KilledByAPixel/ZzFX', adoption: 'Micro procedural sound effect synthesis' },
  { tier: 'B', name: 'Tone.js', license: 'MIT', url: 'https://github.com/Tonejs/Tone.js', adoption: 'Scheduled step-sequencer tracker music timing' },
  { tier: 'B', name: 'Tiny-Canvas', license: 'MIT', url: 'https://github.com/bitnenfer/tiny-canvas', adoption: 'Low-overhead draw call minimization' },
  { tier: 'B', name: 'Matter.js', license: 'MIT', url: 'https://github.com/liabru/matter-js', adoption: 'Physics preset intuition (Arcade / Realistic / Zero-G)' },
  { tier: 'B', name: 'NippleJS', license: 'MIT', url: 'https://github.com/yoannmoinet/nipplejs', adoption: 'Ergonomic virtual analog joystick deadzones' },
  { tier: 'B', name: 'LocalForage', license: 'Apache-2.0', url: 'https://github.com/localForage/localForage', adoption: 'Resilient offline save-slot persistence' },
  { tier: 'B', name: 'Workbox', license: 'MIT', url: 'https://github.com/GoogleChrome/workbox', adoption: 'Offline-first caching & update lifecycle' },
  { tier: 'B', name: 'Seedrandom', license: 'MIT', url: 'https://github.com/davidbau/seedrandom', adoption: 'Deterministic xorshift32 procedural worlds' },
  { tier: 'B', name: 'Box2D-inspired', license: 'MIT', url: 'https://github.com/erincatto/box2d', adoption: 'Swept AABB & impulse separation stability' },
  { tier: 'C', name: 'Colyseus', license: 'MIT', url: 'https://github.com/colyseus/colyseus', adoption: 'Authoritative state snapshot pattern' },
  { tier: 'C', name: 'Nakama', license: 'Apache-2.0', url: 'https://github.com/heroiclabs/nakama', adoption: 'Profile, leaderboard, & cloud-sync contract' },
  { tier: 'C', name: 'i18next', license: 'MIT', url: 'https://github.com/i18next/i18next', adoption: 'Multi-language reactive dictionary design' },
  { tier: 'C', name: 'OpenTelemetry', license: 'Apache-2.0', url: 'https://github.com/open-telemetry', adoption: 'Lightweight session & frame-time telemetry' },
  { tier: 'C', name: 'LuaJIT-inspired', license: 'MIT', url: 'https://github.com/LuaJIT/LuaJIT', adoption: 'Register-based compact 16-bit bytecode VM' },
  { tier: 'C', name: 'RLE-Packer', license: 'Public Domain', url: 'https://en.wikipedia.org/wiki/Run-length_encoding', adoption: 'Deterministic binary .pak compression' },
  { tier: 'C', name: 'FNV-1a', license: 'Public Domain', url: 'https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function', adoption: 'Fast save-file integrity checksum verification' },
  { tier: 'C', name: 'A11y-Focus', license: 'W3C', url: 'https://www.w3.org/WAI/', adoption: 'WCAG touch target (>=48px) & high-contrast rules' },
  { tier: 'C', name: 'React + Canvas 2D', license: 'MIT', url: 'https://react.dev', adoption: 'Portable TypeScript, React, & HTML5 Canvas rendering' }
];

export const THIRD_PARTY_NOTICES_TEXT = `Mungil Engine V7 — Bowo: Guardian of Light
Cleanroom Architectural Attribution & Third-Party Notices

This application does NOT copy external proprietary source code or copyrighted assets.
All visual sprites, procedural audio tracks, bytecode VM instructions, ECS arrays,
physics integrators, and game logic are original cleanroom implementations written
in TypeScript, React, & HTML5 Canvas 2D.

Architectural inspiration credits (Tier A / B / C open-source ecosystem):
- GDevelop, Phaser, Godot, LÖVE2D, PixiJS, Defold, bitecs, Excalibur.js, Kontra.js, Three.js
- Aseprite, Tiled, DragonBones, ZzFX, Tone.js, Matter.js, NippleJS, Workbox, Seedrandom, Box2D
- Colyseus, Nakama, i18next, OpenTelemetry, LuaJIT-style Bytecode, RLE, FNV-1a, WCAG 2.2 AA

License: MIT / Apache-2.0 compatible cleanroom implementation.`;

export const API_REFERENCE_EXAMPLES: [string, string, string][] = [
  ['E.create(name, x, y, hp)', "E.create('Slime', 420, 300, 30)", 'Spawns a tracked entity at world coordinates.'],
  ['E.move(id, dx, dy)', "E.move('Bowo', 4, -8)", 'Applies instant displacement or impulse.'],
  ['E.on(event, action)', "E.on('shard_collect', 'score_100')", 'Registers a No-Code event rule hook.'],
  ['E.playSound(sfx)', "E.playSound('parry')", 'Triggers procedural Web Audio sound effect.'],
  ['E.setMode(mode)', "E.setMode('2.5D')", 'Switches between 2D, 2.5D, and 3D-Stack.'],
  ['E.setPhysics(mode)', "E.setPhysics('Zero-G')", 'Switches Arcade, Realistic, or Zero-G gravity.'],
  ['E.cameraShake(intensity)', 'E.cameraShake(8)', 'Triggers screen shake respecting Reduce Shake.']
];

export const SANDBOX_SKUS: SandboxSku[] = [
  { id: 'starter_pack', title: 'Lantern Starter Pack', price: 'Free Sandbox', coins: 150, potions: 2, desc: 'Adds 150 Light Coins & 2 Healing Potions offline.' },
  { id: 'guardian_relic', title: 'Guardian Relic Bundle', price: 'Demo Token', coins: 400, potions: 4, desc: 'Simulates validated in-app entitlement without billing.' },
  { id: 'kala_challenger', title: 'Menara Kala Elixir', price: 'Demo Token', coins: 250, potions: 5, desc: 'Refills emergency potions for Boss Kala Practice.' }
];

export const ENGINE_DOCS_SECTIONS: [string, string][] = [
  ['Architecture Overview', 'Mungil Engine V7 separates simulation (gameSimulation.ts), zero-GC data storage (SoAWorld & ParticlePool), procedural Canvas rendering (artStyles.ts & qolbuSpace3D.ts), and Web Audio synthesis so the entire engine runs offline with minimal memory overhead.'],
  ['Adding a New Enemy or Level', 'Add a new enemy archetype in gameSimulation.ts, give it a procedural renderer in gameCanvasRenderers.ts, and declare its spawn data in LEVEL_DEFINITIONS.'],
  ['Offline Save & Migration Security', 'All save slots store JSON in localStorage protected with an FNV-1a checksum. Legacy v6.1 saves are migrated automatically to v7.0.0 with tamper clamping on HP, coins, and shards.'],
  ['Low-Entry Mobile Optimization (Itel A70)', 'Eco tier locks 30 FPS fixed timestep, disables expensive blurs, caps particles at 45-60 slots, and keeps heap steady via ring buffers and LRU asset unloading.']
];

export const KEYWORD_TOP5_REPOS: Record<string, RepoMatrixEntry[]> = {
  fake_3d: [
    { name: 'AghlaAbdo/42_Cub3D', license: 'MIT', what: '16x16 DDA raycaster with wall slicing', adapt: 'Cleanroom DDA corridor renderer' },
    { name: 'ssloy/tinyraycaster', license: 'WTFPL/MIT', what: 'Minimal Z-buffer billboard sprite sorting', adapt: 'Billboards + Z-buffer depth fog' },
    { name: 'TheMozg/awk-raycaster', license: 'MIT', what: 'Zero-dependency integer DDA & LUT trig', adapt: 'Low-CPU mobile trig approximation' },
    { name: 'johnatas-henrique/fake-racer', license: 'MIT', what: 'OutRun Mode-7 segment curve projection', adapt: 'Mode-7 horizon road/ground renderer' },
    { name: 'odaymichael/Wurfel-Engine', license: 'Apache-2.0', what: 'Voxel-Space terrain column ray-marching', adapt: 'Voxel heightmap terrain generator' }
  ],
  pseudo_3d: [
    { name: 'metafizzy/zdog', license: 'MIT', what: 'Round-cap pseudo-3D vector modeling', adapt: '3D-Stack capsule limb & cloak layering' },
    { name: 'Pixscape/pixscape', license: 'MIT', what: '2.5D layered sprite stacking & contact shadow', adapt: '5-slice Bowo hero depth stack' },
    { name: 'j03m/trafficcone', license: 'MIT', what: 'Isometric tile picking & painter sort', adapt: 'Isometric diamond sorting order' },
    { name: 'Garebear/MODE-7-FLOORCAST', license: 'MIT', what: 'Scanline perspective floor casting', adapt: 'Zero-WebGL floor strip perspective' },
    { name: 'mrdoob/three.js', license: 'MIT', what: 'Camera projection & fog math', adapt: 'Y-Up LookAt + Perspective matrix' }
  ],
  '2_5d': [
    { name: 'ensisoft/detonator', license: 'GPL-3.0', what: '2.5D scene hierarchy & container transforms', adapt: 'Parent-child Scene Hierarchy + keep-world' },
    { name: 'rbfx/rbfx', license: 'MIT', what: 'Forward mobile 1-shader & LOD pipeline', adapt: '3-level LOD & <=24 draw call budget' },
    { name: 'melonjs/melonJS', license: 'MIT', what: 'Tilemap culling & object pooling', adapt: 'Viewport frustum & circle culling' },
    { name: 'axmolengine/axmol', license: 'MIT', what: 'Auto-batching <35 draw calls for ARM64', adapt: '2D/2.5D batch pass counter' },
    { name: 'skylicht-lab/skylicht-engine', license: 'MIT', what: 'Mobile forward culling & fog', adapt: '35m cull radius & smooth fog curve' }
  ],
  web_engine: [
    { name: 'pixalo/pixalo', license: 'MIT', what: 'Zero-bloat responsive touch 2D loop', adapt: 'Customizable mobile virtual joystick' },
    { name: 'phaserjs/phaser', license: 'MIT', what: 'Arcade AABB, coyote time & jump buffer', adapt: '110ms coyote time & 120ms jump buffer' },
    { name: 'straker/kontra', license: 'MIT', what: 'Tiny sprite pool & modular loop', adapt: 'Fixed-timestep dt clamp accumulator' },
    { name: '4ian/GDevelop', license: 'MIT', what: 'No-Code WHEN -> THEN Event Sheet', adapt: 'Live editable Event Sheet rules' },
    { name: 'NateTheGregg/bitecs', license: 'MIT', what: 'SoA TypedArray zero-GC ECS', adapt: 'Pre-allocated Float32Array/Int32Array SoAWorld' }
  ],
  mobile_engine: [
    { name: 'defold/defold', license: 'Defold-1.0', what: 'Ultra-compact 0-GC collection proxies', adapt: '2 MB Eco LRU AssetManager bundles' },
    { name: 'love2d/love', license: 'zlib', what: 'Simple fixed-step mobile game loop', adapt: '30/60 Hz Eco/HD profiler' },
    { name: 'KilledByAPixel/ZzFX', license: 'MIT', what: 'Procedural 0-KB audio synthesizer', adapt: 'Web Audio procedural SFX & tracker' },
    { name: 'VAST-AI-Research/TripoSR', license: 'MIT', what: 'Decimated <=800 tri character & glTF export', adapt: 'Procedural low-poly mesh + OBJ/glTF' },
    { name: 'mcp-game-deck/mcp-game-deck', license: 'MIT', what: 'Prompt -> playable blueprint & AI driver', adapt: '16-tool Local MCP Hub & Complete Forge' }
  ]
};

export const GENERATOR_TOP3_REPOS: GeneratorGroupEntry[] = [
  {
    title: '1. Image & Sprite Generators',
    repos: [
      ['aseprite/aseprite', 'MIT-inspired', '16x16 & 32x32 indexed grid painter'],
      ['sanderfrenken/Universal-LPC', 'CC-BY-SA', 'Layered humanoid archetype generator'],
      ['pixscape/sprite-stack', 'MIT', 'Symmetrical pixel-to-sprite generator']
    ]
  },
  {
    title: '2. Character Rig & 3D Mesh Generators',
    repos: [
      ['VAST-AI-Research/TripoSR', 'MIT', '<=800 tri stylized silhouette mesh'],
      ['metafizzy/zdog', 'MIT', 'Articulated 3D-Stack vector limbs'],
      ['mrdoob/three.js-exporter-gltf', 'MIT', 'Standard glTF 2.0 & Wavefront OBJ']
    ]
  },
  {
    title: '3. Audio, Tracker & Dubbing Generators',
    repos: [
      ['KilledByAPixel/ZzFX', 'MIT', 'Procedural sweep & envelope SFX'],
      ['Tonejs/Tone.js', 'MIT', '16-step multi-scale music tracker'],
      ['W3C/WebVTT', 'W3C', 'SRT / WebVTT timed dubbing subtitles']
    ]
  },
  {
    title: '4. Video, Cutscene & Terrain Generators',
    repos: [
      ['odaymichael/Wurfel-Engine', 'Apache-2.0', '48-column voxel heightmap terrain'],
      ['johnatas-henrique/fake-racer', 'MIT', 'Mode-7 horizon parallax road'],
      ['esotericsoftware/spine-runtime', 'Custom', 'Verb-driven timeline keyframe sequencer']
    ]
  },
  {
    title: '5. Full Game, FSM & Target Export',
    repos: [
      ['4ian/GDevelop', 'MIT', 'No-Code WHEN -> THEN gameplay bundle'],
      ['mcp-game-deck/mcp-game-deck', 'MIT', '1-prompt Complete Game Blueprint'],
      ['Android/AGP-Kotlin-Compose', 'Apache-2.0', 'Native Itel A70 SDK 24-36 APK target']
    ]
  }
];

export const Catalogs = {
  GENRE_TEMPLATES,
  ASSET_CATALOG,
  REPO_CREDITS,
  THIRD_PARTY_NOTICES_TEXT,
  API_REFERENCE_EXAMPLES,
  SANDBOX_SKUS,
  ENGINE_DOCS_SECTIONS,
  KEYWORD_TOP5_REPOS,
  GENERATOR_TOP3_REPOS
};
