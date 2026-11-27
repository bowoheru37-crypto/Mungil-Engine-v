import { fastClampDt, isValidMove } from './qolbuCore';
import {
  ArenaCoachDirective,
  ArenaCompanionOrder,
  ArenaDifficulty,
  ArenaMode,
  ColliderShapeKind,
  CollisionOverlapInfo,
  EntityPhysicsProps,
  PhysicsPresetId,
  SceneEntityNode,
  WizardGameSpec
} from './types';

export interface PhysicsPresetSpec {
  id: PhysicsPresetId;
  label: string;
  desc: string;
  config: EntityPhysicsProps;
}

export const PHYSICS_PRESETS: Record<PhysicsPresetId, PhysicsPresetSpec> = {
  normal: {
    id: 'normal',
    label: 'NORMAL',
    desc: 'Balanced hero gravity & friction',
    config: { presetId: 'normal', mass: 1, friction: 0.6, restitution: 0.2, gravityScale: 1, linearDamp: 0.08, isTrigger: false, ccd: false }
  },
  bouncy: {
    id: 'bouncy',
    label: 'BOUNCY',
    desc: 'High restitution spring bounce',
    config: { presetId: 'bouncy', mass: 0.8, friction: 0.35, restitution: 0.88, gravityScale: 0.9, linearDamp: 0.04, isTrigger: false, ccd: false }
  },
  heavy: {
    id: 'heavy',
    label: 'HEAVY',
    desc: 'Armored boss inertia & low bounce',
    config: { presetId: 'heavy', mass: 4.5, friction: 0.85, restitution: 0.05, gravityScale: 1.4, linearDamp: 0.2, isTrigger: false, ccd: false }
  },
  ghost: {
    id: 'ghost',
    label: 'GHOST',
    desc: 'Sensor trigger pass-through',
    config: { presetId: 'ghost', mass: 0.2, friction: 0.05, restitution: 0, gravityScale: 0, linearDamp: 0.02, isTrigger: true, ccd: false }
  },
  slippery: {
    id: 'slippery',
    label: 'SLIPPERY',
    desc: 'Low ice friction glide',
    config: { presetId: 'slippery', mass: 1, friction: 0.08, restitution: 0.15, gravityScale: 1, linearDamp: 0.01, isTrigger: false, ccd: false }
  },
  ball: {
    id: 'ball',
    label: 'BALL',
    desc: 'Continuous collision detection projectile',
    config: { presetId: 'ball', mass: 0.6, friction: 0.2, restitution: 0.72, gravityScale: 0.75, linearDamp: 0.02, isTrigger: false, ccd: true }
  }
};

function defaultPolyPoints(): [number, number][] {
  return [
    [-16, -16],
    [16, -16],
    [16, 16],
    [-16, 16]
  ];
}

function makeNode(partial: Partial<SceneEntityNode> & Pick<SceneEntityNode, 'id' | 'name' | 'kind'>): SceneEntityNode {
  return {
    parentId: null,
    children: [],
    x: 160,
    y: 120,
    localX: 0,
    localY: 0,
    scaleX: 1,
    scaleY: 1,
    localScaleX: 1,
    localScaleY: 1,
    rotationDeg: 0,
    localRotationDeg: 0,
    visible: true,
    physics: { ...PHYSICS_PRESETS.normal.config },
    collider: { kind: 'box', width: 36, height: 36, radius: 18, polygonPoints: defaultPolyPoints() },
    ...partial
  };
}

export const SceneHierarchy = {
  PHYSICS_PRESETS,

  createDefaultSceneEntities(level = 1): SceneEntityNode[] {
    return [
      makeNode({
        id: 'ent_bowo',
        name: 'Bowo Guardian',
        kind: 'player',
        x: 90,
        y: 148,
        collider: { kind: 'box', width: 32, height: 44, radius: 20, polygonPoints: defaultPolyPoints() }
      }),
      makeNode({
        id: 'ent_luma',
        name: 'Luma Companion',
        kind: 'companion',
        x: 58,
        y: 110,
        physics: { ...PHYSICS_PRESETS.ghost.config },
        collider: { kind: 'circle', width: 24, height: 24, radius: 13, polygonPoints: defaultPolyPoints() }
      }),
      makeNode({
        id: 'ent_enemy_1',
        name: level === 3 ? 'Boss Kala' : 'Shadow Slime',
        kind: 'enemy',
        x: 236,
        y: 148,
        physics: { ...(level === 3 ? PHYSICS_PRESETS.heavy.config : PHYSICS_PRESETS.bouncy.config) },
        collider: { kind: 'circle', width: 36, height: 36, radius: level === 3 ? 26 : 18, polygonPoints: defaultPolyPoints() }
      }),
      makeNode({
        id: 'ent_shard_1',
        name: 'Light Shard #1',
        kind: 'pickup',
        x: 165,
        y: 92,
        physics: { ...PHYSICS_PRESETS.ghost.config },
        collider: { kind: 'polygon', width: 24, height: 24, radius: 14, polygonPoints: defaultPolyPoints() }
      }),
      makeNode({
        id: 'ent_platform_1',
        name: 'Stone Bridge',
        kind: 'platform',
        x: 180,
        y: 196,
        physics: { ...PHYSICS_PRESETS.heavy.config },
        collider: { kind: 'box', width: 240, height: 22, radius: 20, polygonPoints: defaultPolyPoints() }
      })
    ];
  },

  groupEntitiesIntoContainer(
    entities: SceneEntityNode[],
    selectedIds: string[],
    containerName = 'Group Container'
  ): [SceneEntityNode[], string | null] {
    const valid = entities.filter((e) => selectedIds.includes(e.id) && e.kind !== 'container');
    if (valid.length < 2) return [entities, null];
    const cx = valid.reduce((s, e) => s + e.x, 0) / valid.length;
    const cy = valid.reduce((s, e) => s + e.y, 0) / valid.length;
    const containerId = `grp_${Date.now().toString(36)}`;
    const container = makeNode({
      id: containerId,
      name: containerName.trim() || 'Group Container',
      kind: 'container',
      children: valid.map((v) => v.id),
      x: cx,
      y: cy,
      collider: { kind: 'box', width: 90, height: 64, radius: 40, polygonPoints: defaultPolyPoints() }
    });
    const updated = entities.map((node) => {
      if (selectedIds.includes(node.id) && node.kind !== 'container') {
        return {
          ...node,
          parentId: containerId,
          localX: node.x - cx,
          localY: node.y - cy,
          localScaleX: node.scaleX,
          localScaleY: node.scaleY,
          localRotationDeg: node.rotationDeg
        };
      }
      return node;
    });
    return [[...updated, container], containerId];
  },

  ungroupContainer(entities: SceneEntityNode[], containerId: string): SceneEntityNode[] {
    return entities
      .filter((e) => e.id !== containerId)
      .map((node) => {
        if (node.parentId === containerId) {
          return {
            ...node,
            parentId: null,
            localX: 0,
            localY: 0,
            localScaleX: 1,
            localScaleY: 1,
            localRotationDeg: 0
          };
        }
        return node;
      });
  },

  updateEntityTransform(
    entities: SceneEntityNode[],
    id: string,
    opts: {
      newX?: number;
      newY?: number;
      newScaleX?: number;
      newScaleY?: number;
      newRotDeg?: number;
    }
  ): SceneEntityNode[] {
    const target = entities.find((e) => e.id === id);
    if (!target) return entities;
    const tx = Math.min(350, Math.max(10, opts.newX ?? target.x));
    const ty = Math.min(230, Math.max(10, opts.newY ?? target.y));
    const tsx = Math.min(2.5, Math.max(0.4, opts.newScaleX ?? target.scaleX));
    const tsy = Math.min(2.5, Math.max(0.4, opts.newScaleY ?? target.scaleY));
    const trot = opts.newRotDeg ?? target.rotationDeg;

    return entities.map((node) => {
      if (node.id === id) {
        return { ...node, x: tx, y: ty, scaleX: tsx, scaleY: tsy, rotationDeg: trot };
      }
      if (node.parentId === id) {
        const rad = (trot * Math.PI) / 180;
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);
        const lx = node.localX * tsx;
        const ly = node.localY * tsy;
        const wx = Math.min(350, Math.max(10, tx + lx * cosA - ly * sinA));
        const wy = Math.min(230, Math.max(10, ty + lx * sinA + ly * cosA));
        return {
          ...node,
          x: wx,
          y: wy,
          scaleX: node.localScaleX * tsx,
          scaleY: node.localScaleY * tsy,
          rotationDeg: node.localRotationDeg + trot
        };
      }
      return node;
    });
  },

  applyPhysicsPreset(
    entities: SceneEntityNode[],
    id: string,
    presetId: PhysicsPresetId
  ): SceneEntityNode[] {
    const preset = PHYSICS_PRESETS[presetId];
    if (!preset) return entities;
    return entities.map((e) => (e.id === id ? { ...e, physics: { ...preset.config } } : e));
  },

  updateEntityCollider(
    entities: SceneEntityNode[],
    id: string,
    opts: { kind?: ColliderShapeKind; width?: number; height?: number; radius?: number }
  ): SceneEntityNode[] {
    return entities.map((node) => {
      if (node.id !== id) return node;
      return {
        ...node,
        collider: {
          ...node.collider,
          kind: opts.kind ?? node.collider.kind,
          width: Math.min(280, Math.max(12, opts.width ?? node.collider.width)),
          height: Math.min(180, Math.max(12, opts.height ?? node.collider.height)),
          radius: Math.min(96, Math.max(8, opts.radius ?? node.collider.radius))
        }
      };
    });
  },

  detectEntityOverlaps(entities: SceneEntityNode[]): CollisionOverlapInfo[] {
    const active = entities.filter((e) => e.visible && e.kind !== 'container');
    const results: CollisionOverlapInfo[] = [];
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i];
        const b = active[j];
        const aw = (a.collider.kind === 'circle' ? a.collider.radius * 2 : a.collider.width) * a.scaleX;
        const ah = (a.collider.kind === 'circle' ? a.collider.radius * 2 : a.collider.height) * a.scaleY;
        const bw = (b.collider.kind === 'circle' ? b.collider.radius * 2 : b.collider.width) * b.scaleX;
        const bh = (b.collider.kind === 'circle' ? b.collider.radius * 2 : b.collider.height) * b.scaleY;

        let pen: number;
        let near: boolean;
        if (a.collider.kind === 'circle' && b.collider.kind === 'circle') {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          const sumR = a.collider.radius * a.scaleX + b.collider.radius * b.scaleX;
          pen = sumR - dist;
          near = pen <= 0 && pen >= -8;
        } else {
          const dx = Math.abs(a.x - b.x);
          const dy = Math.abs(a.y - b.y);
          const px = (aw + bw) * 0.5 - dx;
          const py = (ah + bh) * 0.5 - dy;
          pen = Math.min(px, py);
          near = pen <= 0 && pen >= -8;
        }
        if (pen > 0 || near) {
          results.push({
            aId: a.id,
            aName: a.name,
            bId: b.id,
            bName: b.name,
            penetrationPx: Math.max(0, pen),
            isTriggerOverlap: a.physics.isTrigger || b.physics.isTrigger,
            near
          });
        }
      }
    }
    return results;
  }
};

export interface ArenaActor {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  fsm: string;
  name: string;
  attackCd: number;
  dashCd: number;
  invuln: number;
}

export interface ArenaEnemy {
  id: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  isBoss: boolean;
  phase: number;
  dead: boolean;
  hurtFlash: number;
  telegraph: number;
  cooldown: number;
}

export interface ArenaItem {
  id: string;
  kind: string;
  x: number;
  y: number;
  collected: boolean;
}

export class ArenaWorld {
  mode: ArenaMode;
  difficulty: ArenaDifficulty;
  autoDifficulty: boolean;
  player: ArenaActor = { x: 92, y: 130, hp: 100, maxHp: 100, fsm: 'idle', name: 'Bowo', attackCd: 0, dashCd: 0, invuln: 0 };
  companion: ArenaActor = { x: 62, y: 112, hp: 100, maxHp: 100, fsm: 'idle', name: 'Qolbu', attackCd: 0, dashCd: 0, invuln: 0 };
  companionReviveLeft = 1;
  enemies: ArenaEnemy[] = [];
  items: ArenaItem[] = [];
  score = 0;
  status: 'playing' | 'victory' | 'gameover' = 'playing';
  aiThinkText = 'Scanning arena...';
  adaptiveRule = 'Balanced pattern';
  lastPlayerMoves: string[] = [];
  logText = 'Arena Qolbu aktif!';
  hitFlashTimer = 0;
  aiPath: [number, number][] = [];
  private aiAccum = 0;

  constructor(mode: ArenaMode, difficulty: ArenaDifficulty = 'Normal', autoDifficulty = true) {
    this.mode = mode;
    this.difficulty = difficulty;
    this.autoDifficulty = autoDifficulty;
  }

  step(
    dt: number,
    moveX: number,
    moveY: number,
    coachDirective: ArenaCoachDirective,
    companionOrder: ArenaCompanionOrder,
    speedMul: number
  ): void {
    if (this.status !== 'playing') return;
    const stepDt = fastClampDt(dt) * speedMul;
    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - stepDt);
    this.player.attackCd = Math.max(0, this.player.attackCd - stepDt);
    this.player.dashCd = Math.max(0, this.player.dashCd - stepDt);
    this.player.invuln = Math.max(0, this.player.invuln - stepDt);

    let mx = moveX;
    let my = moveY;
    if (this.mode === 'solo') {
      const targetItem = this.items.find((it) => !it.collected);
      const targetEnemy = this.enemies.find((e) => !e.dead);
      let goal: [number, number] = [180, 120];
      if (this.player.hp < 45 && targetItem?.kind === 'potion') {
        goal = [targetItem.x, targetItem.y];
      } else if (coachDirective === 'Farming' && targetItem) {
        goal = [targetItem.x, targetItem.y];
      } else if (coachDirective === 'Bertahan' && targetEnemy) {
        goal = [this.player.x - (targetEnemy.x - this.player.x), this.player.y];
      } else if (targetEnemy) {
        goal = [targetEnemy.x, targetEnemy.y];
      }
      const dx = goal[0] - this.player.x;
      const dy = goal[1] - this.player.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      mx = dist > 14 ? dx / dist : 0;
      my = dist > 14 ? dy / dist : 0;
      this.aiPath = [[this.player.x, this.player.y], goal];
      if (targetEnemy && Math.hypot(targetEnemy.x - this.player.x, targetEnemy.y - this.player.y) < 42 && this.player.attackCd <= 0) {
        this.triggerPlayerAction('attack');
      }
    }

    const speed = 118;
    const nextX = Math.min(336, Math.max(24, this.player.x + mx * speed * stepDt));
    const nextY = Math.min(216, Math.max(24, this.player.y + my * speed * stepDt));
    if (isValidMove(this.player.x, this.player.y, nextX, nextY)) {
      this.player.x = nextX;
      this.player.y = nextY;
    }
    this.player.fsm =
      this.player.attackCd > 0.15 ? 'attack' : Math.abs(mx) + Math.abs(my) > 0.1 ? 'walk' : 'idle';

    for (const it of this.items) {
      if (!it.collected && Math.hypot(it.x - this.player.x, it.y - this.player.y) < 20) {
        it.collected = true;
        if (it.kind === 'potion') {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25);
          this.logText = 'Potion diambil (+25 HP)';
        } else {
          this.score += 100;
          this.logText = 'Relic Coin (+100)';
        }
      }
    }

    this.aiAccum += stepDt;
    if (this.aiAccum >= 1 / 15) {
      this.aiAccum = 0;
      const aliveEnemy = this.enemies.find((e) => !e.dead);
      if (this.mode === 'coplay' && aliveEnemy) {
        let tx: number;
        let ty: number;
        if (companionOrder === 'Serang') {
          tx = aliveEnemy.x;
          ty = aliveEnemy.y;
          if (Math.hypot(tx - this.companion.x, ty - this.companion.y) < 34) {
            aliveEnemy.hp = Math.max(0, aliveEnemy.hp - 6);
            aliveEnemy.hurtFlash = 0.14;
            if (aliveEnemy.hp === 0) {
              aliveEnemy.dead = true;
              this.score += 150;
            }
          }
          this.aiThinkText = `Qolbu attacking ${aliveEnemy.name}`;
        } else if (companionOrder === 'Heal') {
          tx = this.player.x - 24;
          ty = this.player.y - 12;
          if (this.player.hp < this.player.maxHp) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 4);
            this.aiThinkText = 'Qolbu healing Bowo';
          } else {
            this.aiThinkText = 'Qolbu guarding Bowo';
          }
        } else {
          tx = this.player.x - 28;
          ty = this.player.y - 16;
          this.aiThinkText = `Qolbu formation: ${companionOrder}`;
        }
        const dx = tx - this.companion.x;
        const dy = ty - this.companion.y;
        const d = Math.max(1, Math.hypot(dx, dy));
        this.companion.x = Math.min(338, Math.max(22, this.companion.x + (dx / d) * 14));
        this.companion.y = Math.min(218, Math.max(22, this.companion.y + (dy / d) * 14));
        if (this.player.hp < 40 && this.player.hp > 0) {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 15);
          this.logText = 'Qolbu Auto-Heal darurat (+15 HP)!';
        }
      } else if (this.mode === 'solo') {
        this.aiThinkText = `Solo Utility AI [${coachDirective}]`;
      } else if (this.mode === 'vs') {
        const attackSpam = this.lastPlayerMoves.filter((m) => m === 'Attack').length;
        if (attackSpam >= 4) {
          this.adaptiveRule = 'Counter-Dash: Player sering Attack -> Boss Kala jaga jarak!';
        } else if (this.autoDifficulty && this.player.hp > 80) {
          this.adaptiveRule = 'Adaptive Enrage: HP Bowo tinggi -> Boss cepat!';
        } else {
          this.adaptiveRule = `Reading 10 last player moves (${this.lastPlayerMoves.length}/10)`;
        }
        this.aiThinkText = 'Boss Kala reading player pattern';
      }
    }

    for (const e of this.enemies) {
      if (e.dead) continue;
      e.hurtFlash = Math.max(0, e.hurtFlash - stepDt);
      e.cooldown -= stepDt;
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const mult = this.difficulty === 'Easy' ? 0.8 : this.difficulty === 'Hard' ? 1.25 : 1;
      const spd = (e.isBoss ? 56 : 42) * mult;
      if (dist > 26) {
        e.x = Math.min(336, Math.max(24, e.x + (dx / dist) * spd * stepDt));
        e.y = Math.min(216, Math.max(24, e.y + (dy / dist) * spd * stepDt));
      }
      e.telegraph = e.cooldown < 0.45 && dist < 52 ? 1 : 0;
      if (e.cooldown <= 0) {
        e.cooldown = e.isBoss ? 1.3 : 1.7;
        if (dist < 42 && this.player.invuln <= 0) {
          const dmg = e.isBoss ? 16 : 10;
          this.player.hp = Math.max(0, this.player.hp - dmg);
          this.player.invuln = 0.65;
          this.hitFlashTimer = 0.14;
          this.logText = `${e.name} menyerang (-${dmg} HP)`;
          if (this.player.hp <= 0) {
            if (this.mode === 'coplay' && this.companionReviveLeft > 0) {
              this.companionReviveLeft--;
              this.player.hp = 60;
              this.logText = 'Qolbu Revive aktif! HP dipulihkan ke 60.';
            } else {
              this.status = 'gameover';
              this.logText = 'Bowo tumbang di Arena.';
            }
          }
        }
      }
    }

    if (this.enemies.length > 0 && this.enemies.every((e) => e.dead)) {
      this.status = 'victory';
      this.score += 300;
      this.logText = 'Semua lawan Arena dikalahkan (+300)!';
    }
  }

  triggerPlayerAction(action: 'attack' | 'dash' | 'heal'): boolean {
    if (this.status !== 'playing') return false;
    this.lastPlayerMoves.push(action.charAt(0).toUpperCase() + action.slice(1));
    if (this.lastPlayerMoves.length > 10) this.lastPlayerMoves.shift();

    if (action === 'attack') {
      if (this.player.attackCd > 0) return false;
      this.player.attackCd = 0.36;
      let hitAny = false;
      for (const e of this.enemies) {
        if (!e.dead && Math.hypot(e.x - this.player.x, e.y - this.player.y) < 48) {
          e.hp = Math.max(0, e.hp - 22);
          e.hurtFlash = 0.18;
          hitAny = true;
          if (e.hp === 0) {
            e.dead = true;
            this.score += e.isBoss ? 400 : 120;
          } else if (e.isBoss) {
            e.phase = e.hp <= e.maxHp * 0.34 ? 3 : e.hp <= e.maxHp * 0.67 ? 2 : 1;
          }
        }
      }
      this.logText = hitAny ? 'Serangan telak mengenai lawan!' : 'Ayunan pedang cahaya!';
      return true;
    }
    if (action === 'dash') {
      if (this.player.dashCd > 0) return false;
      this.player.dashCd = 0.7;
      this.player.invuln = 0.4;
      this.player.x = Math.min(336, this.player.x + 36);
      this.logText = 'Dash invulnerable!';
      return true;
    }
    if (action === 'heal') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25);
      this.logText = 'Lantern Heal (+25 HP)';
      return true;
    }
    return false;
  }

  static create(mode: ArenaMode, spec: WizardGameSpec | null = null): ArenaWorld {
    const diff: ArenaDifficulty =
      spec?.difficulty === 'Easy' ? 'Easy' : spec?.difficulty === 'Hard' ? 'Hard' : 'Normal';
    const world = new ArenaWorld(mode, diff, true);
    if (spec) {
      world.player.name = spec.characterName.trim() || 'Bowo';
    }
    if (mode === 'vs') {
      world.enemies.push({
        id: 'kala',
        name: 'Boss Kala',
        x: 268,
        y: 120,
        hp: 160,
        maxHp: 160,
        isBoss: true,
        phase: 1,
        dead: false,
        hurtFlash: 0,
        telegraph: 0,
        cooldown: 1.2
      });
    } else {
      const count = Math.min(5, Math.max(1, spec?.enemies ?? 3));
      for (let i = 0; i < count; i++) {
        world.enemies.push({
          id: `mob_${i}`,
          name: i === count - 1 ? 'Dark Wisp' : `Shadow Slime #${i + 1}`,
          x: 210 + (i % 3) * 44,
          y: 58 + i * 36,
          hp: 60,
          maxHp: 60,
          isBoss: false,
          phase: 1,
          dead: false,
          hurtFlash: 0,
          telegraph: 0,
          cooldown: 1.2
        });
      }
    }
    const itemCount = Math.min(5, Math.max(2, spec?.items ?? 3));
    for (let i = 0; i < itemCount; i++) {
      world.items.push({
        id: `item_${i}`,
        kind: i === 0 ? 'potion' : 'coin',
        x: 130 + i * 48,
        y: i % 2 === 0 ? 64 : 182,
        collected: false
      });
    }
    return world;
  }
}
