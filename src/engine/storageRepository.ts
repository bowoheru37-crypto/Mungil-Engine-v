import { STARTER_WIZARD_GAMES } from './aiMcpAgent';
import { BytecodeVm } from './bytecodeVm';
import {
  AnalyticsSummary,
  ArtStyleId,
  AuthProfile,
  EventRuleSpec,
  SaveSlotData,
  SaveSlotSummary,
  TouchControlConfig,
  WizardGameSpec,
  WorldSaveProgress
} from './types';

const KEY_SAVE_PREFIX = 'mungil_v7_save_';
const KEY_TOUCH = 'mungil_v7_touch';
const KEY_ANALYTICS = 'mungil_v7_analytics';
const KEY_AUTH = 'mungil_v7_auth';
const KEY_PIXEL_GRID = 'mungil_v7_pixel_grid';
const KEY_TILEMAP = 'mungil_v7_tilemap';
const KEY_EVENT_RULES = 'mungil_v7_event_rules';
const KEY_WIZARD_GAMES = 'mungil_v7_wizard_games';

export interface ParsedSaveResult {
  data: SaveSlotData;
  migrated: boolean;
  checksumValid: boolean;
}

export const DEFAULT_TOUCH_CONFIG: TouchControlConfig = {
  joystickSide: 'left',
  joystickOffsetX: 16,
  joystickOffsetY: 16,
  joystickDiameter: 112,
  buttonSize: 54,
  opacity: 0.78,
  deadzone: 0.14,
  haptics: true,
  showLabels: true
};

export const DEFAULT_ANALYTICS: AnalyticsSummary = {
  sessions: 0,
  totalPlaySec: 0,
  level1Clears: 0,
  level2Clears: 0,
  level3Clears: 0,
  enemiesDefeated: 0,
  shardsCollected: 0,
  deaths: 0,
  activeSeconds: 0
};

export const DEFAULT_AUTH: AuthProfile = {
  provider: 'guest',
  uid: 'guest-bowo-v7',
  displayName: 'Bowo Guardian',
  syncedAt: ''
};

function readItem(key: string): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function writeItem(key: string, val: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, val);
  } catch {
    // Ignore storage quota issues gracefully
  }
}

function removeItem(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export const StorageRepository = {
  buildSavePayload(params: {
    slotId: string;
    gameTitle: string;
    level: number;
    hp: number;
    energy: number;
    coins: number;
    shards: number;
    score: number;
    kills: number;
    potions: number;
    styleId: ArtStyleId;
    worldState?: WorldSaveProgress | null;
  }): SaveSlotData {
    const raw: SaveSlotData = {
      version: '7.0.0',
      slotId: params.slotId,
      updatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      gameTitle: (params.gameTitle || 'Bowo: Penjaga Cahaya').slice(0, 64),
      level: clamp(Math.floor(params.level), 1, 3),
      hp: clamp(Math.floor(params.hp), 0, 100),
      energy: clamp(Math.floor(params.energy), 0, 100),
      coins: clamp(Math.floor(params.coins), 0, 9999),
      shards: clamp(Math.floor(params.shards), 0, 7),
      score: Math.max(0, Math.floor(params.score)),
      kills: Math.max(0, Math.floor(params.kills)),
      potions: clamp(Math.floor(params.potions), 0, 9),
      styleId: params.styleId,
      checksum: '',
      worldState: params.worldState ?? null
    };
    raw.checksum = BytecodeVm.computeChecksum(
      `${raw.version}|${raw.slotId}|${raw.level}|${raw.hp}|${raw.coins}|${raw.shards}|${raw.score}`
    );
    return raw;
  },

  parseAndMigrateSave(rawJson: string, fallbackSlotId = '1'): ParsedSaveResult {
    const obj = JSON.parse(rawJson) as Record<string, unknown>;
    const ver = typeof obj.version === 'string' ? obj.version : '6.1.0';
    const migrated = !ver.startsWith('7.');
    if (migrated) {
      const chapter = clamp(Number(obj.chapter ?? obj.level ?? 1) || 1, 1, 3);
      const hp = clamp(Number(obj.hp ?? 100) || 100, 0, 100);
      const coins = clamp(Number(obj.coins ?? 0) || 0, 0, 9999);
      const shards = clamp(Number(obj.shards ?? 0) || 0, 0, 7);
      const score = Math.max(0, Number(obj.score ?? 0) || 0);
      const converted = this.buildSavePayload({
        slotId: fallbackSlotId,
        gameTitle: 'Bowo: Penjaga Cahaya',
        level: chapter,
        hp,
        energy: 100,
        coins,
        shards,
        score,
        kills: 0,
        potions: 2,
        styleId: 'pixel'
      });
      return { data: converted, migrated: true, checksumValid: true };
    }

    const decoded = obj as unknown as SaveSlotData;
    const expected = BytecodeVm.computeChecksum(
      `${decoded.version}|${decoded.slotId}|${decoded.level}|${decoded.hp}|${decoded.coins}|${decoded.shards}|${decoded.score}`
    );
    const checksumValid = decoded.checksum === expected;
    const clamped: SaveSlotData = {
      ...decoded,
      level: clamp(Number(decoded.level) || 1, 1, 3),
      hp: clamp(Number(decoded.hp) || 0, 0, 100),
      energy: clamp(Number(decoded.energy) || 0, 0, 100),
      coins: clamp(Number(decoded.coins) || 0, 0, 9999),
      shards: clamp(Number(decoded.shards) || 0, 0, 7),
      potions: clamp(Number(decoded.potions) || 0, 0, 9),
      score: Math.max(0, Number(decoded.score) || 0)
    };
    return { data: clamped, migrated: false, checksumValid };
  },

  saveSlotLocal(slotId: string, payload: SaveSlotData): [boolean, number] {
    const text = JSON.stringify(payload);
    writeItem(`${KEY_SAVE_PREFIX}${slotId}`, text);
    return [true, new TextEncoder().encode(text).length];
  },

  loadSlotLocal(slotId: string): ParsedSaveResult | null {
    const raw = readItem(`${KEY_SAVE_PREFIX}${slotId}`);
    if (!raw) return null;
    try {
      return this.parseAndMigrateSave(raw, slotId);
    } catch {
      return null;
    }
  },

  deleteSlotLocal(slotId: string): void {
    removeItem(`${KEY_SAVE_PREFIX}${slotId}`);
  },

  exportSlotJson(slotId: string): string | null {
    return readItem(`${KEY_SAVE_PREFIX}${slotId}`);
  },

  listSaveSummaries(): SaveSlotSummary[] {
    return ['auto', '1', '2', '3'].map((id) => {
      const loaded = this.loadSlotLocal(id);
      if (!loaded) {
        return {
          id,
          exists: false,
          updatedAt: '',
          level: 1,
          hp: 100,
          score: 0,
          coins: 0,
          gameTitle: 'Empty'
        };
      }
      const d = loaded.data;
      return {
        id,
        exists: true,
        updatedAt: d.updatedAt,
        level: d.level,
        hp: d.hp,
        score: d.score,
        coins: d.coins,
        gameTitle: d.gameTitle
      };
    });
  },

  getLatestSaveSlot(): SaveSlotSummary | null {
    const existing = this.listSaveSummaries().filter((s) => s.exists);
    if (existing.length === 0) return null;
    return existing.reduce((best, cur) => (cur.updatedAt > best.updatedAt ? cur : best));
  },

  loadTouchConfig(): TouchControlConfig {
    const raw = readItem(KEY_TOUCH);
    if (!raw) return { ...DEFAULT_TOUCH_CONFIG };
    try {
      return { ...DEFAULT_TOUCH_CONFIG, ...(JSON.parse(raw) as Partial<TouchControlConfig>) };
    } catch {
      return { ...DEFAULT_TOUCH_CONFIG };
    }
  },

  saveTouchConfig(cfg: TouchControlConfig): void {
    writeItem(KEY_TOUCH, JSON.stringify(cfg));
  },

  loadAnalytics(): AnalyticsSummary {
    const raw = readItem(KEY_ANALYTICS);
    if (!raw) return { ...DEFAULT_ANALYTICS };
    try {
      return { ...DEFAULT_ANALYTICS, ...(JSON.parse(raw) as Partial<AnalyticsSummary>) };
    } catch {
      return { ...DEFAULT_ANALYTICS };
    }
  },

  saveAnalytics(summary: AnalyticsSummary): void {
    writeItem(KEY_ANALYTICS, JSON.stringify(summary));
  },

  loadAuthProfile(): AuthProfile {
    const raw = readItem(KEY_AUTH);
    if (!raw) return { ...DEFAULT_AUTH };
    try {
      return { ...DEFAULT_AUTH, ...(JSON.parse(raw) as Partial<AuthProfile>) };
    } catch {
      return { ...DEFAULT_AUTH };
    }
  },

  saveAuthProfile(profile: AuthProfile): void {
    writeItem(KEY_AUTH, JSON.stringify(profile));
  },

  loadEventRules(): EventRuleSpec[] {
    const raw = readItem(KEY_EVENT_RULES);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as EventRuleSpec[];
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Fallback
      }
    }
    return [
      { id: 'r1', condition: 'shard_collect', action: 'score_100', enabled: true },
      { id: 'r2', condition: 'enemy_defeated', action: 'heal_10', enabled: true },
      { id: 'r3', condition: 'switch_activated', action: 'play_gate', enabled: true }
    ];
  },

  saveEventRules(rules: EventRuleSpec[]): void {
    writeItem(KEY_EVENT_RULES, JSON.stringify(rules));
  },

  loadWizardGames(): WizardGameSpec[] {
    const raw = readItem(KEY_WIZARD_GAMES);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as WizardGameSpec[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // Fallback
      }
    }
    return [...STARTER_WIZARD_GAMES];
  },

  saveWizardGames(games: WizardGameSpec[]): void {
    writeItem(KEY_WIZARD_GAMES, JSON.stringify(games));
  },

  loadPixelGrid(size = 16): number[] {
    const raw = readItem(KEY_PIXEL_GRID);
    if (raw) {
      const parts = raw.split(',').map((s) => Number.parseInt(s, 10)).filter((n) => !Number.isNaN(n));
      if (parts.length === size * size) return parts;
    }
    return Array.from({ length: size * size }, (_, idx) => {
      const x = idx % size;
      const y = Math.floor(idx / size);
      return x >= 5 && x <= 10 && y >= 4 && y <= 11 ? 1 : 0;
    });
  },

  savePixelGrid(grid: number[]): void {
    writeItem(KEY_PIXEL_GRID, grid.join(','));
  },

  loadTilemap(): number[] {
    const raw = readItem(KEY_TILEMAP);
    if (raw) {
      const parts = raw.split(',').map((s) => Number.parseInt(s, 10)).filter((n) => !Number.isNaN(n));
      if (parts.length === 12 * 8) return parts;
    }
    return Array.from({ length: 12 * 8 }, (_, idx) => {
      const y = Math.floor(idx / 12);
      const x = idx % 12;
      if (y === 7) return 1;
      if (y === 5 && x >= 3 && x <= 5) return 2;
      if (y === 6 && x === 9) return 3;
      return 0;
    });
  },

  saveTilemap(tiles: number[]): void {
    writeItem(KEY_TILEMAP, tiles.join(','));
  }
};
