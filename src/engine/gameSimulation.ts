import {
  createSimPlayer,
  LEVEL_DEFINITIONS,
  LevelDefinition,
  SimBeatNote,
  SimConfig,
  SimEnemy,
  SimEvent,
  SimInput,
  SimPickup,
  SimPlayer,
  SimProjectile,
  SimRect,
  SimSwitch,
  SimTurret,
  simKindForGenre,
  VN_STORY_NODES
} from './gameSimulationData';
import { AttackTokenPool } from './architecture12Layers';
import {
  fastClampDt,
  ParticlePool,
  QolbuCore,
  SpatialHashGrid,
  validateMoveBounds
} from './qolbuCore';
import {
  AiPlayMode,
  GeneratedCharacterSpec,
  GenreSimulationKind,
  HudSnapshot,
  SaveSlotData,
  WorldSaveProgress
} from './types';

export interface AiCompanionState {
  active: boolean;
  x: number;
  y: number;
  healCooldown: number;
  thinkTimer: number;
  lastActionText: string;
}

export class GameWorld {
  readonly level: number;
  readonly def: LevelDefinition;
  readonly genreId: string;
  readonly simKind: GenreSimulationKind;
  readonly customCharacter: GeneratedCharacterSpec | null;
  readonly player: SimPlayer;
  readonly enemies: SimEnemy[];
  readonly shards: SimPickup[];
  readonly coins: SimPickup[];
  readonly switches: SimSwitch[];
  readonly projectiles: SimProjectile[] = [];
  readonly obstacles: SimRect[];
  readonly beatNotes: SimBeatNote[];
  readonly turrets: SimTurret[] = [];
  readonly particles = new ParticlePool(160);
  readonly spatial = new SpatialHashGrid(32);
  readonly attackTokens = new AttackTokenPool(2);
  readonly companion: AiCompanionState;

  lane = 1;
  trackDist = 0;
  speedKmh = 120;
  comboCount = 0;
  waveNumber = 1;
  doubleJumpsLeft: number;
  vnStep = 0;
  status: 'playing' | 'level_clear' | 'victory' | 'gameover' = 'playing';
  time = 0;
  cameraX = 0;
  shakeTimer = 0;
  hitstopTimer = 0;
  coinsTotal = 0;
  shardsTotal = 0;
  kills = 0;
  score = 0;
  potions = 2;
  gateUnlocked = false;
  nextProjId = 1;
  aiTickAccum = 0;
  laneSwitchCd = 0;

  constructor(
    level: number,
    def: LevelDefinition,
    genreId: string,
    simKind: GenreSimulationKind,
    customCharacter: GeneratedCharacterSpec | null = null
  ) {
    this.level = level;
    this.def = def;
    this.genreId = genreId;
    this.simKind = simKind;
    this.customCharacter = customCharacter;
    const bonusHp = customCharacter?.hpBonus ?? 0;
    this.player = createSimPlayer(
      def.playerSpawnX,
      def.playerSpawnY,
      simKind === 'SHOOTER' ? 16 : 26,
      simKind === 'SHOOTER' ? 16 : 36,
      100 + bonusHp
    );
    this.enemies = def.enemies.map((e, idx) => ({
      id: idx,
      archetype: e.archetype,
      x: e.x,
      y: e.y,
      vx: 0,
      vy: 0,
      w: e.archetype === 'boss_kala' ? 46 : e.archetype === 'sentinel' ? 34 : 28,
      h: e.archetype === 'boss_kala' ? 56 : e.archetype === 'sentinel' ? 42 : 28,
      patrolMinX: e.patrolMinX,
      patrolMaxX: e.patrolMaxX,
      hp: e.hp,
      maxHp: e.hp,
      dead: false,
      hurtFlash: 0,
      attackTimer: 1.4,
      telegraphTimer: 0,
      bossPhase: 1,
      koProgress: 0
    }));
    this.shards = def.shards.map(([x, y], id) => ({ id, x, y, collected: false }));
    this.coins = def.coins.map(([x, y], id) => ({ id, x, y, collected: false }));
    this.switches = def.switches.map(([x, y], id) => ({ id, x, y, active: false }));
    this.obstacles =
      simKind === 'TOPDOWN'
        ? [
            { x: 240, y: 160, w: 56, h: 56 },
            { x: 420, y: 220, w: 64, h: 48 },
            { x: 620, y: 140, w: 56, h: 64 },
            { x: 780, y: 230, w: 54, h: 54 }
          ]
        : [];
    this.beatNotes =
      simKind === 'RHYTHM'
        ? Array.from({ length: 8 }, (_, i) => ({
            id: i,
            x: 360 + i * 110,
            lane: i % 3,
            hit: false,
            missed: false
          }))
        : [];
    this.companion = {
      active: false,
      x: def.playerSpawnX - 28,
      y: def.playerSpawnY - 26,
      healCooldown: 4,
      thinkTimer: 0,
      lastActionText: 'Standby'
    };
    this.doubleJumpsLeft = genreId === 'metroidvania' ? 1 : 0;
  }
}

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function applyEventRule(world: GameWorld, condition: string, cfg: SimConfig): void {
  for (const rule of cfg.eventRules) {
    if (!rule.enabled || rule.condition !== condition) continue;
    if (rule.action === 'score_100') world.score += 100;
    else if (rule.action === 'heal_10') world.player.hp = Math.min(world.player.maxHp, world.player.hp + 10);
    else if (rule.action === 'bonus_coin') world.coinsTotal += 5;
  }
}

function damageEnemy(
  world: GameWorld,
  e: SimEnemy,
  dmg: number,
  events: SimEvent[],
  cfg: SimConfig
): void {
  e.hp = Math.max(0, e.hp - dmg);
  e.hurtFlash = 0.16;
  world.hitstopTimer = 0.035;
  world.shakeTimer = Math.max(world.shakeTimer, 0.12);
  events.push({ type: 'hit', panX: e.x - world.cameraX });
  if (e.hp <= 0 && !e.dead) {
    e.dead = true;
    world.kills++;
    world.score += e.archetype === 'boss_kala' ? 400 : 100;
    applyEventRule(world, 'enemy_defeated', cfg);
  }
}

function damagePlayer(world: GameWorld, dmg: number, events: SimEvent[]): void {
  world.player.hp = Math.max(0, world.player.hp - dmg);
  world.player.invulnTimer = 1.1;
  world.player.hurtFlash = 0.22;
  world.shakeTimer = 0.2;
  events.push({ type: 'hurt', panX: 0 });
  if (world.player.hp <= 0) {
    world.status = 'gameover';
    events.push({ type: 'gameover', panX: 0 });
  }
}

export const GameSimulation = {
  createLevelWorld(
    level: number,
    customChar: GeneratedCharacterSpec | null = null,
    genreId = 'platformer'
  ): GameWorld {
    const lvl = Math.min(3, Math.max(1, level));
    const def = LEVEL_DEFINITIONS[lvl] ?? LEVEL_DEFINITIONS[1];
    const simKind = simKindForGenre(genreId);
    return new GameWorld(lvl, def, genreId, simKind, customChar);
  },

  usePotion(world: GameWorld): boolean {
    if (world.potions <= 0 || world.player.hp >= world.player.maxHp || world.status !== 'playing') {
      return false;
    }
    world.potions--;
    world.player.hp = Math.min(world.player.maxHp, world.player.hp + 40);
    return true;
  },

  selectVisualNovelChoice(world: GameWorld, choiceIndex: number): boolean {
    if (world.simKind !== 'VISUAL_NOVEL' || world.status !== 'playing') return false;
    const node = VN_STORY_NODES[world.vnStep];
    if (!node) return false;
    const bonus = node.choices[choiceIndex]?.[1] ?? 100;
    world.score += bonus;
    if (world.vnStep < world.shards.length && !world.shards[world.vnStep].collected) {
      world.shards[world.vnStep].collected = true;
      world.shardsTotal++;
    }
    world.vnStep++;
    if (world.vnStep >= VN_STORY_NODES.length) {
      world.gateUnlocked = true;
    }
    return true;
  },

  stepAi15Hz(world: GameWorld, mode: AiPlayMode, dt: number): SimInput | null {
    if (mode === 'off') {
      world.companion.active = false;
      return null;
    }
    world.companion.active = true;
    world.companion.healCooldown = Math.max(0, world.companion.healCooldown - dt);
    world.companion.thinkTimer += dt;
    if (world.companion.thinkTimer < 1 / 15) return null;
    world.companion.thinkTimer = 0;

    const tx = world.player.x - world.player.facing * 26;
    const ty = world.player.y - 22;
    world.companion.x += (tx - world.companion.x) * 0.35;
    world.companion.y += (ty - world.companion.y) * 0.35;

    if (mode === 'coop') {
      if (world.player.hp <= 40 && world.companion.healCooldown <= 0) {
        world.player.hp = Math.min(world.player.maxHp, world.player.hp + 15);
        world.companion.healCooldown = 6;
        world.companion.lastActionText = 'Luma Auto-Heal (+15 HP)';
      } else {
        const threat = world.projectiles.find(
          (pr) => !pr.fromPlayer && Math.hypot(pr.x - world.player.x, pr.y - world.player.y) < 88
        );
        if (threat) {
          threat.fromPlayer = true;
          threat.vx = -threat.vx * 1.3;
          world.companion.lastActionText = 'Luma Reflected Bolt';
        } else {
          world.companion.lastActionText = 'Luma Escorting Bowo';
        }
      }
      return null;
    }

    // Autopilot mode
    const incoming = world.projectiles.some(
      (pr) => !pr.fromPlayer && Math.hypot(pr.x - world.player.x, pr.y - world.player.y) < 60
    );
    const targetShard = world.shards.find((s) => !s.collected);
    const targetSwitch = world.switches.find((sw) => !sw.active);
    const targetEnemy = world.enemies.find((e) => !e.dead);
    let goalX = world.def.gate.x + 12;
    if (world.gateUnlocked) goalX = world.def.gate.x + 12;
    else if (targetSwitch) goalX = targetSwitch.x;
    else if (targetShard) goalX = targetShard.x;
    else if (targetEnemy) goalX = targetEnemy.x;

    const dx = goalX - world.player.x;
    const moveX = dx > 12 ? 1 : dx < -12 ? -1 : 0;
    const needJump =
      ((targetShard && targetShard.y < world.player.y - 28) || incoming) && world.player.grounded;
    const needAttack = Boolean(targetEnemy && Math.abs(targetEnemy.x - world.player.x) < 64);
    world.companion.lastActionText = incoming ? 'Autopilot Dash Parry!' : 'Autopilot -> Gate';

    return {
      moveX,
      moveY: world.simKind === 'TOPDOWN' ? -0.2 : 0,
      jumpPressed: Boolean(needJump),
      jumpHeld: Boolean(needJump),
      attackPressed: needAttack,
      dashPressed: incoming,
      burstPressed: world.player.energy >= 80 && needAttack
    };
  },

  stepGameWorld(
    world: GameWorld,
    rawInput: SimInput,
    rawDt: number,
    cfg: SimConfig,
    aiMode: AiPlayMode = 'off'
  ): SimEvent[] {
    const events: SimEvent[] = [];
    if (world.status !== 'playing') return events;
    const dt = fastClampDt(rawDt);
    if (world.hitstopTimer > 0) {
      world.hitstopTimer = Math.max(0, world.hitstopTimer - dt);
      return events;
    }

    const aiOverride = this.stepAi15Hz(world, aiMode, dt);
    const input = aiOverride ?? rawInput;

    world.time += dt;
    world.shakeTimer = Math.max(0, world.shakeTimer - dt);
    world.laneSwitchCd = Math.max(0, world.laneSwitchCd - dt);

    const p = world.player;
    p.attackTimer = Math.max(0, p.attackTimer - dt);
    p.attackCooldown = Math.max(0, p.attackCooldown - dt);
    p.dashTimer = Math.max(0, p.dashTimer - dt);
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.parryTimer = Math.max(0, p.parryTimer - dt);
    p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    p.hurtFlash = Math.max(0, p.hurtFlash - dt);
    p.energy = Math.min(p.maxEnergy, p.energy + 12 * dt);

    const speedBase = 215 * cfg.speedMul * (world.customCharacter?.speedMul ?? 1);

    if (world.simKind === 'RUNNER') {
      if (world.laneSwitchCd <= 0 && Math.abs(input.moveY) > 0.45) {
        world.lane = Math.min(2, Math.max(0, world.lane + (input.moveY > 0 ? 1 : -1)));
        world.laneSwitchCd = 0.18;
      }
      world.trackDist += 180 * cfg.speedMul * dt;
      world.speedKmh = Math.min(320, Math.floor(120 + world.trackDist * 0.04));
      p.x = Math.min(world.def.worldWidth - 48, Math.max(36, p.x + (95 + input.moveX * 140) * dt));
      p.y = 220 + world.lane * 48;
    } else if (world.simKind === 'RHYTHM') {
      if (world.laneSwitchCd <= 0 && Math.abs(input.moveY) > 0.45) {
        world.lane = Math.min(2, Math.max(0, world.lane + (input.moveY > 0 ? 1 : -1)));
        world.laneSwitchCd = 0.16;
      }
      p.y = 200 + world.lane * 52;
      p.x = Math.min(world.def.worldWidth - 64, Math.max(48, p.x + input.moveX * 120 * dt));
      for (const note of world.beatNotes) {
        if (note.hit || note.missed) continue;
        note.x -= 155 * dt;
        if (input.attackPressed && note.lane === world.lane && Math.abs(note.x - p.x) < 42) {
          note.hit = true;
          world.comboCount++;
          world.score += 160 + world.comboCount * 20;
          events.push({ type: 'parry', panX: p.x - world.cameraX });
        } else if (note.x < p.x - 48) {
          note.missed = true;
          world.comboCount = 0;
        }
      }
    } else if (
      world.simKind === 'TOPDOWN' ||
      world.simKind === 'SHOOTER' ||
      world.simKind === 'BRAWLER' ||
      world.simKind === 'DEFENSE'
    ) {
      p.vx = input.moveX * speedBase;
      p.vy = input.moveY * speedBase;
      p.x = Math.min(world.def.worldWidth - p.w - 16, Math.max(16, p.x + p.vx * dt));
      p.y = Math.min(world.def.groundY - p.h, Math.max(48, p.y + p.vy * dt));
      for (const obs of world.obstacles) {
        if (rectsOverlap(p.x, p.y, p.w, p.h, obs.x, obs.y, obs.w, obs.h)) {
          const cx = p.x + p.w * 0.5;
          const cy = p.y + p.h * 0.5;
          const ox = obs.x + obs.w * 0.5;
          const oy = obs.y + obs.h * 0.5;
          const dx = cx - ox;
          const dy = cy - oy;
          const pxOverlap = (p.w + obs.w) * 0.5 - Math.abs(dx);
          const pyOverlap = (p.h + obs.h) * 0.5 - Math.abs(dy);
          if (pxOverlap < pyOverlap) {
            p.x += dx >= 0 ? pxOverlap : -pxOverlap;
          } else {
            p.y += dy >= 0 ? pyOverlap : -pyOverlap;
          }
        }
      }
      if (input.moveX > 0.1) p.facing = 1;
      else if (input.moveX < -0.1) p.facing = -1;
    } else {
      const prevX = p.x;
      const prevY = p.y;
      if (Math.abs(input.moveX) > 0.08) {
        p.facing = input.moveX > 0 ? 1 : -1;
      }
      if (p.dashTimer > 0) {
        p.vx = p.facing * 420;
      } else {
        const accel = cfg.physicsMode === 'Realistic' ? 0.18 : 0.35;
        p.vx += (input.moveX * speedBase - p.vx) * accel;
      }
      const grav =
        cfg.physicsMode === 'Zero-G'
          ? 180 * cfg.gravityMul
          : cfg.physicsMode === 'Realistic'
            ? 980 * cfg.gravityMul
            : 860 * cfg.gravityMul;
      p.vy += grav * dt;

      if (p.grounded) {
        p.coyoteTimer = 0.11;
        if (world.genreId === 'metroidvania') world.doubleJumpsLeft = 1;
      } else {
        p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
      }

      if (input.jumpPressed) {
        p.jumpBufferTimer = 0.12;
      } else {
        p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
      }

      if (p.jumpBufferTimer > 0 && (p.coyoteTimer > 0 || world.doubleJumpsLeft > 0)) {
        if (p.coyoteTimer <= 0) world.doubleJumpsLeft = Math.max(0, world.doubleJumpsLeft - 1);
        p.vy = -375;
        p.grounded = false;
        p.coyoteTimer = 0;
        p.jumpBufferTimer = 0;
        for (let d = 0; d < 4; d++) {
          world.particles.spawn(p.x + p.w * 0.5, p.y + p.h, (d - 1.5) * 45, -35 - d * 10, 0.28, 3, 0);
        }
        events.push({ type: 'jump', panX: p.x - world.cameraX });
      }
      if (!input.jumpHeld && p.vy < -150) {
        p.vy *= 0.85;
      }

      const wasGrounded = p.grounded;
      const candX = Math.min(world.def.worldWidth - p.w - 12, Math.max(12, p.x + p.vx * dt));
      const candY = p.y + p.vy * dt;
      const [vx, vy] = validateMoveBounds(prevX, prevY, candX, candY);
      p.x = vx;
      p.y = vy;

      p.grounded = false;
      if (p.y + p.h >= world.def.groundY) {
        p.y = world.def.groundY - p.h;
        p.vy = 0;
        p.grounded = true;
      }
      for (const plat of world.def.platforms) {
        const prevBottom = prevY + p.h;
        const curBottom = p.y + p.h;
        if (
          p.vy >= 0 &&
          prevBottom <= plat.y + 8 &&
          curBottom >= plat.y &&
          p.x + p.w > plat.x + 4 &&
          p.x < plat.x + plat.w - 4
        ) {
          p.y = plat.y - p.h;
          p.vy = 0;
          p.grounded = true;
        }
      }
      if (!wasGrounded && p.grounded) {
        for (let d = 0; d < 4; d++) {
          world.particles.spawn(p.x + p.w * 0.5, p.y + p.h, (d - 1.5) * 55, -24, 0.24, 2.5, 0);
        }
        events.push({ type: 'land', panX: p.x - world.cameraX });
      }
    }

    // Actions: Dash & Attack & Burst
    if (input.dashPressed && p.dashCooldown <= 0) {
      p.dashTimer = 0.18;
      p.dashCooldown = 0.65;
      p.parryTimer = 0.24;
      p.invulnTimer = 0.22;
      events.push({ type: 'dash', panX: p.x - world.cameraX });
    }

    if (input.attackPressed && p.attackCooldown <= 0) {
      p.attackTimer = 0.22;
      p.attackCooldown = 0.34;
      events.push({ type: 'attack', panX: p.x - world.cameraX });
      if (world.simKind === 'SHOOTER') {
        for (const ang of [-0.22, 0, 0.22]) {
          world.projectiles.push({
            id: world.nextProjId++,
            x: p.x + p.w * 0.5,
            y: p.y + p.h * 0.5,
            vx: Math.cos(ang) * 380 * p.facing,
            vy: Math.sin(ang) * 240,
            fromPlayer: true,
            damage: 18,
            life: 1.4,
            r: 5
          });
        }
      }
    }

    if (input.burstPressed && p.energy >= 45) {
      p.energy -= 45;
      world.shakeTimer = 0.28;
      events.push({ type: 'burst', panX: p.x - world.cameraX });
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        world.particles.spawn(
          p.x + p.w * 0.5,
          p.y + p.h * 0.5,
          Math.cos(a) * 140,
          Math.sin(a) * 140,
          0.45,
          4,
          1
        );
      }
      for (const e of world.enemies) {
        if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 120) {
          damageEnemy(world, e, 36, events, cfg);
        }
      }
    }

    if (world.simKind === 'DEFENSE' && input.burstPressed && world.turrets.length < 4) {
      world.turrets.push({ id: world.turrets.length + 1, x: p.x, y: p.y, cooldown: 0.6 });
    }

    // Melee hit check
    if (p.attackTimer > 0.12) {
      const atkX = p.facing > 0 ? p.x + p.w * 0.5 : p.x - 42;
      const atkY = p.y - 6;
      for (const e of world.enemies) {
        if (
          !e.dead &&
          e.hurtFlash <= 0 &&
          rectsOverlap(atkX, atkY, 46, p.h + 12, e.x - e.w * 0.5, e.y - e.h * 0.5, e.w, e.h)
        ) {
          damageEnemy(world, e, 22, events, cfg);
        }
      }
    }

    // Pickups: Shards & Coins
    for (const sh of world.shards) {
      if (!sh.collected && Math.hypot(sh.x - (p.x + p.w * 0.5), sh.y - (p.y + p.h * 0.5)) < 28) {
        sh.collected = true;
        world.shardsTotal++;
        world.score += 100;
        events.push({ type: 'shard', panX: sh.x - world.cameraX });
        applyEventRule(world, 'shard_collect', cfg);
      }
    }
    for (const coin of world.coins) {
      if (coin.collected) continue;
      if (world.simKind === 'COLLECTOR') {
        const dx = p.x + p.w * 0.5 - coin.x;
        const dy = p.y + p.h * 0.5 - coin.y;
        const d = Math.hypot(dx, dy);
        if (d < 160 && d > 1) {
          coin.x += (dx / d) * 170 * dt;
          coin.y += (dy / d) * 170 * dt;
        }
      }
      if (Math.hypot(coin.x - (p.x + p.w * 0.5), coin.y - (p.y + p.h * 0.5)) < 24) {
        coin.collected = true;
        world.coinsTotal++;
        world.score += 25;
        events.push({ type: 'coin', panX: coin.x - world.cameraX });
      }
    }

    // Switches
    for (const sw of world.switches) {
      if (!sw.active && Math.hypot(sw.x - (p.x + p.w * 0.5), sw.y - (p.y + p.h)) < 30) {
        sw.active = true;
        world.score += 75;
        events.push({ type: 'switch', panX: sw.x - world.cameraX });
        applyEventRule(world, 'switch_activated', cfg);
      }
    }

    // Turrets (Defense)
    for (const t of world.turrets) {
      t.cooldown -= dt;
      if (t.cooldown <= 0) {
        t.cooldown = 0.9;
        const target = world.enemies.find((e) => !e.dead);
        if (target) {
          const dx = target.x - t.x;
          const dy = target.y - t.y;
          const d = Math.max(1, Math.hypot(dx, dy));
          world.projectiles.push({
            id: world.nextProjId++,
            x: t.x,
            y: t.y,
            vx: (dx / d) * 260,
            vy: (dy / d) * 260,
            fromPlayer: true,
            damage: 16,
            life: 1.5,
            r: 5
          });
        }
      }
    }

    // Enemies update with AttackTokenPool + archetype-specific behaviors
    for (const e of world.enemies) {
      if (e.dead) {
        world.attackTokens.release(e.id);
        e.koProgress = Math.min(1, e.koProgress + dt * 2.5);
        continue;
      }
      e.hurtFlash = Math.max(0, e.hurtFlash - dt);
      if (e.archetype === 'boss_kala') {
        const hpRatio = e.hp / e.maxHp;
        const newPhase = hpRatio <= 0.34 ? 3 : hpRatio <= 0.67 ? 2 : 1;
        if (newPhase !== e.bossPhase) {
          e.bossPhase = newPhase;
          events.push({ type: 'boss_phase', panX: e.x - world.cameraX });
        }
      }

      const distToPlayer = Math.abs(p.x + p.w * 0.5 - e.x);
      const baseSpd = e.archetype === 'boss_kala' ? 58 + e.bossPhase * 18 : e.archetype === 'sentinel' ? 68 : 48;
      if (e.archetype === 'sentinel' && distToPlayer < 135) {
        // Sentinel accelerates toward Bowo when in sight range
        const dir = p.x + p.w * 0.5 >= e.x ? 1 : -1;
        e.vx = dir * baseSpd * 1.35;
      } else if (e.vx === 0) {
        e.vx = baseSpd;
      }

      e.x += e.vx * dt;
      if (e.x < e.patrolMinX) {
        e.x = e.patrolMinX;
        e.vx = baseSpd;
      }
      if (e.x > e.patrolMaxX) {
        e.x = e.patrolMaxX;
        e.vx = -baseSpd;
      }

      e.attackTimer -= dt;
      const canShoot = e.archetype === 'wisp' || e.archetype === 'boss_kala';
      const hasToken = canShoot && e.attackTimer < 0.55 ? world.attackTokens.tryAcquire(e.id) : false;
      e.telegraphTimer = (canShoot && e.attackTimer < 0.45 && hasToken) || (e.archetype === 'sentinel' && distToPlayer < 110) ? 1 : 0;

      if (e.attackTimer <= 0 && canShoot) {
        if (hasToken || e.archetype === 'boss_kala') {
          e.attackTimer = e.archetype === 'boss_kala' ? Math.max(1.1, 2.2 - e.bossPhase * 0.35) : 2.2;
          const dx = p.x + p.w * 0.5 - e.x;
          const dy = p.y + p.h * 0.5 - e.y;
          const count = e.archetype === 'boss_kala' ? e.bossPhase : 1;
          for (let c = 0; c < count; c++) {
            const spread = (c - (count - 1) * 0.5) * 0.25;
            const baseAngle = Math.atan2(dy, dx) + spread;
            world.projectiles.push({
              id: world.nextProjId++,
              x: e.x,
              y: e.y,
              vx: Math.cos(baseAngle) * 185,
              vy: Math.sin(baseAngle) * 185,
              fromPlayer: false,
              damage: e.archetype === 'boss_kala' ? 16 : 12,
              life: 2.6,
              r: 5
            });
          }
          world.attackTokens.release(e.id);
        } else {
          e.attackTimer = 0.45;
        }
      }

      if (
        !cfg.practiceMode &&
        p.invulnTimer <= 0 &&
        rectsOverlap(p.x, p.y, p.w, p.h, e.x - e.w * 0.5, e.y - e.h * 0.5, e.w, e.h)
      ) {
        if (p.parryTimer > 0) {
          damageEnemy(world, e, 16, events, cfg);
          events.push({ type: 'parry', panX: p.x - world.cameraX });
        } else {
          damagePlayer(world, e.archetype === 'boss_kala' ? 22 : 14, events);
        }
      }
    }

    // Projectiles update
    for (let i = world.projectiles.length - 1; i >= 0; i--) {
      const pr = world.projectiles[i];
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.life -= dt;
      if (pr.life <= 0) {
        world.projectiles.splice(i, 1);
        continue;
      }
      if (pr.fromPlayer) {
        const hitEnemy = world.enemies.find(
          (e) => !e.dead && Math.hypot(e.x - pr.x, e.y - pr.y) < e.w * 0.6 + pr.r
        );
        if (hitEnemy) {
          damageEnemy(world, hitEnemy, pr.damage, events, cfg);
          world.projectiles.splice(i, 1);
        }
      } else if (rectsOverlap(pr.x - pr.r, pr.y - pr.r, pr.r * 2, pr.r * 2, p.x, p.y, p.w, p.h)) {
        if (p.parryTimer > 0) {
          pr.fromPlayer = true;
          pr.vx = -pr.vx * 1.4;
          pr.vy = -pr.vy * 1.4;
          world.score += 60;
          events.push({ type: 'parry', panX: p.x - world.cameraX });
        } else if (!cfg.practiceMode && p.invulnTimer <= 0) {
          damagePlayer(world, pr.damage, events);
          world.projectiles.splice(i, 1);
        }
      }
    }

    // Unlock Gate check
    const bossAlive = world.def.hasBoss && world.enemies.some((e) => e.archetype === 'boss_kala' && !e.dead);
    const activeSwitches = world.switches.filter((sw) => sw.active).length;
    const wasUnlocked = world.gateUnlocked;
    if (world.shardsTotal >= world.def.requiredShards && activeSwitches >= world.def.requiredSwitches && !bossAlive) {
      world.gateUnlocked = true;
    }
    if (!wasUnlocked && world.gateUnlocked) {
      events.push({ type: 'gate', panX: world.def.gate.x - world.cameraX });
    }

    // Gate enter -> Level Clear / Victory
    if (
      world.gateUnlocked &&
      rectsOverlap(p.x, p.y, p.w, p.h, world.def.gate.x, world.def.gate.y, world.def.gate.w, world.def.gate.h)
    ) {
      if (world.level >= 3) {
        world.status = 'victory';
        world.score += 500;
        events.push({ type: 'victory', panX: 0 });
      } else {
        world.status = 'level_clear';
        world.score += 300;
        events.push({ type: 'level_clear', panX: 0 });
      }
    }

    // Animation FSM + Cloak Spring
    if (p.hp <= 0) p.animState = 'ko';
    else if (p.hurtFlash > 0) p.animState = 'hurt';
    else if (p.dashTimer > 0) p.animState = 'dash';
    else if (p.attackTimer > 0) p.animState = 'attack';
    else if (!p.grounded && p.vy < -20) p.animState = 'jump';
    else if (!p.grounded && p.vy > 20) p.animState = 'fall';
    else if (Math.abs(p.vx) > 22 || Math.abs(p.vy) > 22) p.animState = 'walk';
    else p.animState = 'idle';

    const fsmTarget =
      QolbuCore.CHARACTER_FSM_TABLE.find((f) => f.state === p.animState)?.cloakTargetAngle ?? -0.1;
    QolbuCore.stepCloakSpring(p.cloakSpring, fsmTarget, p.vx, dt);
    world.particles.step(dt);
    world.cameraX = Math.min(Math.max(0, world.def.worldWidth - 520), Math.max(0, p.x - 220));
    return events;
  },

  extractWorldSaveProgress(world: GameWorld): WorldSaveProgress {
    return {
      genreId: world.genreId,
      playerX: world.player.x,
      playerY: world.player.y,
      facing: world.player.facing,
      time: world.time,
      collectedShards: world.shards.filter((s) => s.collected).map((s) => s.id),
      collectedCoins: world.coins.filter((c) => c.collected).map((c) => c.id),
      activeSwitches: world.switches.filter((sw) => sw.active).map((sw) => sw.id),
      defeatedEnemies: world.enemies.filter((e) => e.dead).map((e) => e.id),
      vnStep: world.vnStep
    };
  },

  restoreWorldFromSave(save: SaveSlotData, customChar: GeneratedCharacterSpec | null = null): GameWorld {
    const genreId = save.worldState?.genreId ?? 'platformer';
    const world = this.createLevelWorld(save.level, customChar, genreId);
    world.player.hp = Math.min(world.player.maxHp, Math.max(1, save.hp));
    world.player.energy = Math.min(world.player.maxEnergy, Math.max(0, save.energy));
    world.coinsTotal = save.coins;
    world.score = save.score;
    world.kills = save.kills;
    world.potions = save.potions;
    const ws = save.worldState;
    if (!ws) return world;
    world.player.x = ws.playerX;
    world.player.y = ws.playerY;
    world.player.facing = ws.facing;
    world.time = ws.time;
    world.vnStep = ws.vnStep;
    ws.collectedShards.forEach((id) => {
      const s = world.shards.find((it) => it.id === id);
      if (s) s.collected = true;
    });
    ws.collectedCoins.forEach((id) => {
      const c = world.coins.find((it) => it.id === id);
      if (c) c.collected = true;
    });
    ws.activeSwitches.forEach((id) => {
      const sw = world.switches.find((it) => it.id === id);
      if (sw) sw.active = true;
    });
    ws.defeatedEnemies.forEach((id) => {
      const e = world.enemies.find((it) => it.id === id);
      if (e) {
        e.dead = true;
        e.hp = 0;
      }
    });
    world.shardsTotal = world.shards.filter((s) => s.collected).length;
    const bossAlive = world.def.hasBoss && world.enemies.some((e) => e.archetype === 'boss_kala' && !e.dead);
    if (
      world.shardsTotal >= world.def.requiredShards &&
      world.switches.filter((sw) => sw.active).length >= world.def.requiredSwitches &&
      !bossAlive
    ) {
      world.gateUnlocked = true;
    }
    return world;
  },

  toHudSnapshot(world: GameWorld, fps: number, dynamicScale: number, aiMode: AiPlayMode): HudSnapshot {
    const boss = world.enemies.find((e) => e.archetype === 'boss_kala' && !e.dead);
    const vnNode = world.simKind === 'VISUAL_NOVEL' ? VN_STORY_NODES[world.vnStep] : undefined;
    let obj: string;
    if (world.gateUnlocked) {
      obj = 'Masuk ke Gerbang Cahaya Timur!';
    } else if (world.def.hasBoss && boss) {
      obj = `Kalahkan Boss Kala & kumpulkan Light Shard (${world.shardsTotal}/${world.def.requiredShards})`;
    } else if (world.def.requiredSwitches > 0) {
      obj = `Aktifkan ${world.def.requiredSwitches} saklar & ambil ${world.def.requiredShards} Shard`;
    } else {
      obj = `Kumpulkan ${world.def.requiredShards} Light Shard untuk buka Gerbang`;
    }

    return {
      level: world.level,
      levelName: world.def.name,
      hp: world.player.hp,
      maxHp: world.player.maxHp,
      energy: Math.floor(world.player.energy),
      maxEnergy: Math.floor(world.player.maxEnergy),
      coins: world.coinsTotal,
      shards: world.shardsTotal,
      requiredShards: world.def.requiredShards,
      switchesActive: world.switches.filter((s) => s.active).length,
      requiredSwitches: world.def.requiredSwitches,
      potions: world.potions,
      score: world.score,
      kills: world.kills,
      gateUnlocked: world.gateUnlocked,
      fps,
      dynamicScale,
      drawCalls: 11 + world.enemies.filter((e) => !e.dead).length + world.projectiles.length,
      culledCount: 0,
      activeEntities: 4 + world.enemies.length + world.projectiles.length,
      heapMb: 16.4 + world.projectiles.length * 0.08,
      bossHp: boss?.hp ?? 0,
      bossMaxHp: boss?.maxHp ?? 0,
      bossPhase: boss?.bossPhase ?? 1,
      objective: obj,
      parryFlash: world.player.parryTimer > 0,
      genreId: world.genreId,
      simKind: world.simKind,
      aiMode,
      aiCompanionActive: world.companion.active,
      aiStatusText: world.companion.lastActionText,
      comboCount: world.comboCount,
      waveNumber: world.waveNumber,
      trackDist: Math.floor(world.trackDist),
      speedKmh: Math.floor(world.speedKmh),
      vnDialog: vnNode
        ? {
            speaker: vnNode.speaker,
            text: vnNode.text,
            step: world.vnStep + 1,
            totalSteps: VN_STORY_NODES.length,
            choices: vnNode.choices.map((c) => c[0])
          }
        : null
    };
  }
};
