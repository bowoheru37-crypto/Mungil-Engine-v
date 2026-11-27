import { CloakSpringState, createCloakSpring } from './qolbuCore';
import {
  CharacterAnimState,
  EventRuleSpec,
  GenreSimulationKind,
  PhysicsMode,
  RenderMode,
  WeatherKind
} from './types';

export interface SimRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LevelPlatform {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EnemySpawnDef {
  archetype: string;
  x: number;
  y: number;
  patrolMinX: number;
  patrolMaxX: number;
  hp: number;
}

export interface LevelDefinition {
  level: number;
  name: string;
  worldWidth: number;
  worldHeight: number;
  groundY: number;
  hasBoss: boolean;
  requiredShards: number;
  requiredSwitches: number;
  playerSpawnX: number;
  playerSpawnY: number;
  gate: SimRect;
  platforms: LevelPlatform[];
  shards: [number, number][];
  coins: [number, number][];
  switches: [number, number][];
  enemies: EnemySpawnDef[];
}

export interface SimPlayer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: number;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  grounded: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  attackTimer: number;
  attackCooldown: number;
  dashTimer: number;
  dashCooldown: number;
  parryTimer: number;
  invulnTimer: number;
  hurtFlash: number;
  animState: CharacterAnimState;
  cloakSpring: CloakSpringState;
}

export function createSimPlayer(x: number, y: number, w = 26, h = 36, hp = 100): SimPlayer {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    w,
    h,
    facing: 1,
    hp,
    maxHp: hp,
    energy: 100,
    maxEnergy: 100,
    grounded: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    attackTimer: 0,
    attackCooldown: 0,
    dashTimer: 0,
    dashCooldown: 0,
    parryTimer: 0,
    invulnTimer: 0,
    hurtFlash: 0,
    animState: 'idle',
    cloakSpring: createCloakSpring()
  };
}

export interface SimEnemy {
  id: number;
  archetype: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  patrolMinX: number;
  patrolMaxX: number;
  hp: number;
  maxHp: number;
  dead: boolean;
  hurtFlash: number;
  attackTimer: number;
  telegraphTimer: number;
  bossPhase: number;
  koProgress: number;
}

export interface SimPickup {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

export interface SimSwitch {
  id: number;
  x: number;
  y: number;
  active: boolean;
}

export interface SimProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fromPlayer: boolean;
  damage: number;
  life: number;
  r: number;
}

export interface SimBeatNote {
  id: number;
  x: number;
  lane: number;
  hit: boolean;
  missed: boolean;
}

export interface SimTurret {
  id: number;
  x: number;
  y: number;
  cooldown: number;
}

export interface SimConfig {
  physicsMode: PhysicsMode;
  renderMode: RenderMode;
  weather: WeatherKind;
  practiceMode: boolean;
  speedMul: number;
  gravityMul: number;
  eventRules: EventRuleSpec[];
}

export interface SimInput {
  moveX: number;
  moveY: number;
  jumpPressed: boolean;
  jumpHeld: boolean;
  attackPressed: boolean;
  dashPressed: boolean;
  burstPressed: boolean;
}

export interface SimEvent {
  type: string;
  panX: number;
  message?: string;
}

export interface VnStoryNode {
  speaker: string;
  text: string;
  choices: [string, number][];
}

export const LEVEL_DEFINITIONS: Record<number, LevelDefinition> = {
  1: {
    level: 1,
    name: 'Desa Fajar',
    worldWidth: 980,
    worldHeight: 420,
    groundY: 336,
    hasBoss: false,
    requiredShards: 2,
    requiredSwitches: 0,
    playerSpawnX: 72,
    playerSpawnY: 280,
    gate: { x: 884, y: 260, w: 44, h: 76 },
    platforms: [
      { x: 180, y: 274, w: 124, h: 16 },
      { x: 370, y: 224, w: 134, h: 16 },
      { x: 585, y: 268, w: 128, h: 16 },
      { x: 748, y: 220, w: 110, h: 16 }
    ],
    shards: [[435, 188], [795, 184]],
    coins: [[220, 240], [255, 240], [415, 190], [640, 234], [710, 300]],
    switches: [],
    enemies: [
      { archetype: 'slime', x: 310, y: 308, patrolMinX: 240, patrolMaxX: 440, hp: 36 },
      { archetype: 'slime', x: 615, y: 240, patrolMinX: 590, patrolMaxX: 698, hp: 36 },
      { archetype: 'wisp', x: 790, y: 152, patrolMinX: 730, patrolMaxX: 860, hp: 42 }
    ]
  },
  2: {
    level: 2,
    name: 'Jembatan Badai',
    worldWidth: 1140,
    worldHeight: 420,
    groundY: 336,
    hasBoss: false,
    requiredShards: 3,
    requiredSwitches: 2,
    playerSpawnX: 72,
    playerSpawnY: 280,
    gate: { x: 1042, y: 260, w: 44, h: 76 },
    platforms: [
      { x: 190, y: 272, w: 116, h: 16 },
      { x: 350, y: 212, w: 140, h: 16 },
      { x: 555, y: 252, w: 132, h: 16 },
      { x: 740, y: 198, w: 130, h: 16 },
      { x: 910, y: 250, w: 108, h: 16 }
    ],
    shards: [[418, 176], [804, 162], [964, 214]],
    coins: [[230, 238], [385, 178], [600, 218], [785, 164], [880, 302]],
    switches: [[245, 272], [620, 252]],
    enemies: [
      { archetype: 'slime', x: 320, y: 308, patrolMinX: 240, patrolMaxX: 480, hp: 42 },
      { archetype: 'wisp', x: 510, y: 150, patrolMinX: 440, patrolMaxX: 610, hp: 48 },
      { archetype: 'sentinel', x: 790, y: 294, patrolMinX: 700, patrolMaxX: 920, hp: 64 }
    ]
  },
  3: {
    level: 3,
    name: 'Menara Kala',
    worldWidth: 1180,
    worldHeight: 420,
    groundY: 336,
    hasBoss: true,
    requiredShards: 2,
    requiredSwitches: 1,
    playerSpawnX: 72,
    playerSpawnY: 280,
    gate: { x: 1082, y: 260, w: 44, h: 76 },
    platforms: [
      { x: 175, y: 268, w: 120, h: 16 },
      { x: 370, y: 214, w: 130, h: 16 },
      { x: 590, y: 224, w: 140, h: 16 },
      { x: 815, y: 214, w: 130, h: 16 }
    ],
    shards: [[430, 178], [875, 178]],
    coins: [[220, 234], [460, 178], [650, 190], [845, 178]],
    switches: [[656, 224]],
    enemies: [
      { archetype: 'wisp', x: 340, y: 152, patrolMinX: 290, patrolMaxX: 460, hp: 48 },
      { archetype: 'sentinel', x: 520, y: 294, patrolMinX: 440, patrolMaxX: 650, hp: 68 },
      { archetype: 'boss_kala', x: 900, y: 272, patrolMinX: 720, patrolMaxX: 1020, hp: 210 }
    ]
  }
};

export const VN_STORY_NODES: VnStoryNode[] = [
  {
    speaker: 'Penjaga Desa',
    text: 'Lentera Cahaya mulai meredup di Desa Fajar. Apa langkah pertama Bowo?',
    choices: [
      ['Nyalakan Lentera Desa (+150 Skor)', 150],
      ['Amati Jejak Bayangan (+120 Skor)', 120]
    ]
  },
  {
    speaker: 'Luma Companion',
    text: 'Dua Light Shard bersembunyi di dekat Jembatan Badai. Bagaimana cara melewatinya?',
    choices: [
      ['Dash Parry Proyektil Wisp (+180 Skor)', 180],
      ['Aktifkan Saklar Batu (+140 Skor)', 140]
    ]
  },
  {
    speaker: 'Boss Kala (Bayangan)',
    text: 'Puncak Menara Kala menunggumu! Pilih jurus pamungkas untuk membuka Gerbang Cahaya.',
    choices: [
      ['Lantern Burst Penuh (+250 Skor)', 250],
      ['Refleksi Cahaya Suci (+220 Skor)', 220]
    ]
  }
];

export function simKindForGenre(genreId: string): GenreSimulationKind {
  switch (genreId) {
    case 'rpg':
    case 'simulation':
      return 'TOPDOWN';
    case 'shooter':
      return 'SHOOTER';
    case 'racing':
      return 'RUNNER';
    case 'rhythm':
      return 'RHYTHM';
    case 'brawler':
    case 'fighting':
      return 'BRAWLER';
    case 'tower_defense':
      return 'DEFENSE';
    case 'idle':
      return 'COLLECTOR';
    case 'visual_novel':
      return 'VISUAL_NOVEL';
    default:
      return 'PLATFORMER';
  }
}

export const GameSimulationData = {
  LEVEL_DEFINITIONS,
  VN_STORY_NODES,
  simKindForGenre
};
