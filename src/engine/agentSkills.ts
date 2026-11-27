import { AgentSkillFile } from './types';

export interface ManagedAsset {
  id: string;
  name: string;
  biome: string;
  bytes: number;
  loaded: boolean;
  pinned: boolean;
  lastUsedTick: number;
  refCount: number;
}

export interface AssetLoadResult {
  loaded: string[];
  unloaded: string[];
}

export interface AssetManagerStats {
  usedBytes: number;
  budgetBytes: number;
  loadedCount: number;
  evictions: number;
}

export class AssetManager {
  readonly budgetBytes: number;
  private tick = 0;
  private evictions = 0;
  private readonly assets: ManagedAsset[] = [
    { id: 'player_bowo_rig', name: 'Bowo 3D-Stack Hero Rig', biome: 'shared', bytes: 48_000, loaded: true, pinned: true, lastUsedTick: 1, refCount: 1 },
    { id: 'luma_ai_drone', name: 'Luma Companion Wisp', biome: 'shared', bytes: 16_000, loaded: true, pinned: true, lastUsedTick: 1, refCount: 1 },
    { id: 'ui_touch_atlas', name: 'Touch & HUD Atlas', biome: 'shared', bytes: 28_000, loaded: true, pinned: true, lastUsedTick: 1, refCount: 1 },
    { id: 'env_dawn_village', name: 'Desa Fajar Biome', biome: 'level1', bytes: 180_000, loaded: true, pinned: false, lastUsedTick: 1, refCount: 1 },
    { id: 'mob_slime_pack', name: 'Shadow Slime Sprites', biome: 'level1', bytes: 64_000, loaded: true, pinned: false, lastUsedTick: 1, refCount: 1 },
    { id: 'env_storm_bridge', name: 'Jembatan Badai Biome', biome: 'level2', bytes: 210_000, loaded: false, pinned: false, lastUsedTick: 0, refCount: 0 },
    { id: 'mob_wisp_sentinel', name: 'Wisp & Sentinel Pack', biome: 'level2', bytes: 96_000, loaded: false, pinned: false, lastUsedTick: 0, refCount: 0 },
    { id: 'env_menara_kala', name: 'Menara Kala Obsidian', biome: 'level3', bytes: 260_000, loaded: false, pinned: false, lastUsedTick: 0, refCount: 0 },
    { id: 'boss_kala_3phase', name: 'Boss Kala 3-Phase Rig', biome: 'level3', bytes: 148_000, loaded: false, pinned: false, lastUsedTick: 0, refCount: 0 }
  ];

  constructor(budgetBytes = 2_097_152) {
    this.budgetBytes = budgetBytes;
  }

  listAssets(): ManagedAsset[] {
    return this.assets.map((a) => ({ ...a }));
  }

  getUsedBytes(): number {
    return this.assets.filter((a) => a.loaded).reduce((sum, a) => sum + a.bytes, 0);
  }

  getStats(): AssetManagerStats {
    return {
      usedBytes: this.getUsedBytes(),
      budgetBytes: this.budgetBytes,
      loadedCount: this.assets.filter((a) => a.loaded).length,
      evictions: this.evictions
    };
  }

  setPinned(id: string, pinned: boolean): void {
    const item = this.assets.find((a) => a.id === id);
    if (item) item.pinned = pinned;
  }

  registerGeneratedAsset(id: string, name: string, biome = 'generated', bytes = 24_000): void {
    this.tick++;
    const existing = this.assets.find((a) => a.id === id);
    if (existing) {
      existing.loaded = true;
      existing.lastUsedTick = this.tick;
      existing.refCount++;
    } else {
      this.assets.push({
        id,
        name,
        biome,
        bytes,
        loaded: true,
        pinned: false,
        lastUsedTick: this.tick,
        refCount: 1
      });
    }
    this.enforceBudget();
  }

  loadLevelBundle(level: number): AssetLoadResult {
    this.tick++;
    const targetBiome = `level${Math.min(3, Math.max(1, level))}`;
    const loaded: string[] = [];
    const unloaded: string[] = [];

    for (const asset of this.assets) {
      const isLevelBiome = asset.biome.startsWith('level');
      if (isLevelBiome && asset.biome !== targetBiome && asset.loaded && !asset.pinned) {
        asset.loaded = false;
        asset.refCount = 0;
        unloaded.push(asset.id);
      }
    }
    for (const asset of this.assets) {
      if (asset.biome === 'shared' || asset.biome === targetBiome) {
        asset.loaded = true;
        asset.lastUsedTick = this.tick;
        asset.refCount = Math.max(1, asset.refCount);
        loaded.push(asset.id);
      }
    }
    this.enforceBudget();
    return { loaded, unloaded };
  }

  unloadUnused(): string[] {
    const unloaded: string[] = [];
    for (const asset of this.assets) {
      if (asset.loaded && !asset.pinned && asset.biome !== 'shared') {
        asset.loaded = false;
        asset.refCount = 0;
        unloaded.push(asset.id);
      }
    }
    return unloaded;
  }

  private enforceBudget(): void {
    while (this.getUsedBytes() > this.budgetBytes) {
      const candidates = this.assets.filter((a) => a.loaded && !a.pinned);
      if (candidates.length === 0) break;
      let victim = candidates[0];
      for (const c of candidates) {
        if (c.lastUsedTick < victim.lastUsedTick) victim = c;
      }
      victim.loaded = false;
      victim.refCount = 0;
      this.evictions++;
    }
  }
}

const CORE_SKILL_BODY = `# Mungil Engine V7 — Complete Mobile & Pseudo-3D Game Development Skill

## 1. Core Architecture & Performance Contracts (Itel A70 / Low-Entry Android)
- Fixed-timestep simulation loop: 1/30s (Eco), 1/60s (Mid/HD), clamped dt <= 0.05s, max 3 catch-up steps.
- Zero-GC SoA ECS (SoAWorld): Pre-allocated TypedArrays with O(1) free-list & dense active list.
- Particle ring buffer (ParticlePool, 160 slots): update in-place, never allocate inside frame ticks.
- Dynamic resolution scaling via EMA frame-time tracking (0.60x-1.00x).
- Asset Manager (AssetManager): Ref-counted LRU eviction under 2 MB Eco / 4 MB Standard budget.

## 2. Procedural 2D / 2.5D / Fake-3D Rendering APIs
- drawBowoCharacter(...): 8 animation states (idle | walk | jump | fall | attack | dash | hurt | ko) across 12 Art Styles & 3D-Stack layering.
- drawMode7Horizon(...): Scanline perspective ground strip projection.
- drawTerrainCanvas(...): Column heightmap ray-marching for 2D/3D terrains.

## 3. Procedural Audio (Zero-KB Footprint)
- SoundEngine.startTracker(level): 3-channel Web Audio synthesizer (lead + bass + kick/hi-hat) per level (1-3).
- SoundEngine.playSfx(kind): Movement, Combat, Game Events, and UI feedback.`;

export const AgentSkills = {
  buildAgentSkillPack(): AgentSkillFile[] {
    return [
      {
        filename: 'CLAUDE.md',
        platform: 'claude',
        title: 'Claude Code Project Instructions + Skill Loader',
        summary: 'Place in project root or ~/.claude/skills/mungil-engine/SKILL.md for Claude Code.',
        content: `# CLAUDE.md — Mungil Engine V7 Agent Guide\n\nTarget low-entry Android (Itel A70): <= 24 draw calls/frame, <= 48 MB heap, >= 48px touch hitboxes.\n\n${CORE_SKILL_BODY}`
      },
      {
        filename: 'GEMINI.md',
        platform: 'gemini',
        title: 'Gemini CLI & AI Studio Skill Definition',
        summary: 'Place in project root as GEMINI.md or .gemini/skills/mungil-engine/SKILL.md.',
        content: `---\nname: mungil-engine-v7\ndescription: Mobile-first 2D, 2.5D, and Pseudo-3D game engine skill for Itel A70 optimization.\n---\n\n${CORE_SKILL_BODY}`
      },
      {
        filename: 'GROK_INSTRUCTIONS.md',
        platform: 'grok',
        title: 'Grok Custom System Instructions & Engine Rules',
        summary: 'Paste into Grok Workspaces / Custom Instructions for Mungil Engine V7.',
        content: `# Grok Agent Instructions — Mungil Engine V7\n\nAlways mutate pre-allocated pools in SoAWorld & ParticlePool and pair VFX with SoundEngine.playSfx.\n\n${CORE_SKILL_BODY}`
      },
      {
        filename: 'QWEN_AGENT.md',
        platform: 'qwen',
        title: 'Qwen-Coder / Qwen Agent Tooling & Skill Spec',
        summary: 'Compatible with Qwen-Agent, Cline/RooCode, and Qwen3-Coder workspace rules.',
        content: `# QWEN_AGENT.md — Mungil Engine V7 Specification\n\nruntime_target: android_low_entry_itel_a70\nfps_budget: 30-60\nmemory_budget_mb: 48\n\n${CORE_SKILL_BODY}`
      },
      {
        filename: 'AGENTS.md',
        platform: 'universal',
        title: 'Universal AGENTS.md + MCP Tool Manifest (JSON)',
        summary: 'Standard AGENTS.md + JSON tool schema usable across Claude, Gemini, Grok, Qwen, Codex, and Cursor.',
        content: `# AGENTS.md — Universal AI Agent Contract (Mungil Engine V7)\n\nTools: asset_load_level, gen_character, gen_music, gen_sfx, gen_cutscene, gen_terrain\n\n${CORE_SKILL_BODY}`
      }
    ];
  },

  getInstallCommandSnippet(platform: string): string {
    switch (platform) {
      case 'claude':
        return 'mkdir -p .claude/skills/mungil-engine && cp CLAUDE.md .claude/skills/mungil-engine/SKILL.md';
      case 'gemini':
        return 'mkdir -p .gemini/skills/mungil-engine && cp GEMINI.md .gemini/skills/mungil-engine/SKILL.md';
      case 'grok':
        return '# Copy GROK_INSTRUCTIONS.md into Grok Project / System Instructions';
      case 'qwen':
        return 'mkdir -p .qwen/skills && cp QWEN_AGENT.md .qwen/skills/mungil-engine.md';
      default:
        return 'cp AGENTS.md ./AGENTS.md';
    }
  },

  exportFullAgentBundleJson(): string {
    return JSON.stringify(
      {
        bundle: 'Mungil-Engine-V7-AI-Agent-Skills',
        version: '7.1.0',
        files: this.buildAgentSkillPack().map((f) => ({
          filename: f.filename,
          platform: f.platform,
          title: f.title,
          content: f.content
        }))
      },
      null,
      2
    );
  }
};
