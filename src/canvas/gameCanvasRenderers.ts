import { evaluateDiurnalClimate } from '../engine/architecture12Layers';
import { ArtStyles } from '../engine/artStyles';
import { GameWorld } from '../engine/gameSimulation';
import {
  ArtStyleSpec,
  CharacterAnimState,
  GeneratedCharacterSpec,
  HybridRender5Mode,
  PerspectiveConnectorId,
  RenderMode,
  StyleOverrides,
  WeatherKind
} from '../engine/types';

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

export function shadeHexColor(hex: string, factor: number, alpha = 1): string {
  const [r, g, b] = ArtStyles.parseHexRgb(hex);
  const clamp = (v: number) => Math.round(Math.min(255, Math.max(0, v)));
  return `rgba(${clamp(r * factor)}, ${clamp(g * factor)}, ${clamp(b * factor)}, ${alpha.toFixed(3)})`;
}

export const GameCanvasRenderers = {
  drawMode7Horizon(
    ctx: CanvasRenderingContext2D,
    width: number,
    horizonY: number,
    bottomY: number,
    scrollX: number,
    style: ArtStyleSpec,
    level: number,
    overrides: StyleOverrides = ArtStyles.DEFAULT_STYLE_OVERRIDES
  ): void {
    const cA = ArtStyles.applyStyleTint(style.palette[5], overrides);
    const cB = ArtStyles.applyStyleTint(style.palette[8], overrides);
    const accent = ArtStyles.applyStyleTint(style.palette[1], overrides, 0.35);
    const strips = 7;
    const bandH = Math.max(2, (bottomY - horizonY) / strips);
    for (let i = 0; i < strips; i++) {
      const y = horizonY + i * bandH;
      const ratio = (i + 1) / strips;
      ctx.fillStyle = i % 2 === 0 ? cA : cB;
      ctx.fillRect(0, y, width, bandH + 1);
      const spacing = 36 + ratio * 64;
      const shift = ((scrollX * (0.4 + ratio)) % spacing + spacing) % spacing;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let gx = -shift; gx < width; gx += spacing) {
        ctx.moveTo(gx, y);
        ctx.lineTo(gx + (gx - width * 0.5) * 0.14, y + bandH);
      }
      ctx.stroke();
    }
    ctx.fillStyle = ArtStyles.applyStyleTint(style.palette[3], overrides, level === 3 ? 0.45 : 0.7);
    ctx.beginPath();
    ctx.arc(width * 0.78, horizonY - 22, 24, 0, Math.PI * 2);
    ctx.fill();
  },

  drawGroundTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    style: ArtStyleSpec,
    level: number,
    overrides: StyleOverrides = ArtStyles.DEFAULT_STYLE_OVERRIDES
  ): void {
    const topCol = ArtStyles.applyStyleTint(level === 3 ? style.palette[7] : style.palette[2], overrides);
    const bodyCol = ArtStyles.applyStyleTint(style.palette[5], overrides);
    ctx.fillStyle = bodyCol;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = topCol;
    ctx.fillRect(x, y, w, 6);
    if (overrides.outline) {
      ctx.strokeStyle = ArtStyles.applyStyleTint(style.palette[6], overrides, 0.4);
      ctx.lineWidth = overrides.strokeWidth;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.stroke();
    }
  },

  drawTreeAsset(
    ctx: CanvasRenderingContext2D,
    cx: number,
    groundY: number,
    scale: number,
    style: ArtStyleSpec,
    overrides: StyleOverrides = ArtStyles.DEFAULT_STYLE_OVERRIDES
  ): void {
    const trunk = ArtStyles.applyStyleTint(style.palette[3], overrides, 0.75);
    const leaf = ArtStyles.applyStyleTint(style.palette[2], overrides);
    ctx.fillStyle = trunk;
    ctx.fillRect(cx - 5 * scale, groundY - 30 * scale, 10 * scale, 30 * scale);
    ctx.fillStyle = leaf;
    ctx.beginPath();
    ctx.arc(cx, groundY - 40 * scale, 18 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ArtStyles.applyStyleTint(style.palette[1], overrides, 0.6);
    ctx.beginPath();
    ctx.arc(cx - 6 * scale, groundY - 46 * scale, 11 * scale, 0, Math.PI * 2);
    ctx.fill();
  },

  drawGateAsset(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    unlocked: boolean,
    style: ArtStyleSpec,
    timeSec: number,
    overrides: StyleOverrides = ArtStyles.DEFAULT_STYLE_OVERRIDES
  ): void {
    const frame = ArtStyles.applyStyleTint(style.palette[9], overrides);
    const pulse = unlocked ? 0.7 + 0.3 * Math.sin(timeSec * 5) : 0.35;
    const portal = ArtStyles.applyStyleTint(unlocked ? style.palette[2] : style.palette[4], overrides, pulse);
    ctx.fillStyle = frame;
    roundRectPath(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.fillStyle = portal;
    roundRectPath(ctx, x + 6, y + 8, w - 12, h - 10, 8);
    ctx.fill();
  },

  drawBowoCharacter(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    style: ArtStyleSpec,
    pose: CharacterAnimState,
    facing: number,
    timeSec: number,
    rig3d: boolean,
    yawRad = 0.25,
    cloakAngle = -0.15,
    overrides: StyleOverrides = ArtStyles.DEFAULT_STYLE_OVERRIDES,
    customChar: GeneratedCharacterSpec | null = null
  ): void {
    const primaryHex = customChar?.primaryColor ?? style.palette[1];
    const cloakHex = customChar?.cloakColor ?? style.palette[2];
    const accentHex = customChar?.accentColor ?? style.palette[3];

    const bodyCol = ArtStyles.applyStyleTint(primaryHex, overrides);
    const bodyColDepth = ArtStyles.applyStyleTint(primaryHex, overrides, 0.78);
    const cloakCol = ArtStyles.applyStyleTint(cloakHex, overrides);
    const accentCol = ArtStyles.applyStyleTint(accentHex, overrides);
    const rimCol = ArtStyles.applyStyleTint(style.palette[6], overrides);

    let bob = 0;
    if (pose === 'walk') bob = Math.abs(Math.sin(timeSec * 10)) * -4;
    else if (pose === 'idle') bob = Math.sin(timeSec * 3.5) * 2;
    else if (pose === 'jump') bob = -4;
    else if (pose === 'dash') bob = 1;
    const yPos = cy + bob;

    if (overrides.shadow) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + size * 0.61, size * 0.55, size * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (customChar && customChar.spriteGrid.length === 12 && !rig3d) {
      const cell = (size * 1.15) / 12;
      const startX = cx - cell * 6;
      const startY = yPos - cell * 6;
      for (let r = 0; r < customChar.spriteGrid.length; r++) {
        const row = customChar.spriteGrid[r];
        for (let c = 0; c < row.length; c++) {
          const ch = row[c];
          if (ch === '.') continue;
          ctx.fillStyle = ch === 'H' ? accentCol : ch === 'C' ? cloakCol : bodyCol;
          const drawC = facing < 0 ? 11 - c : c;
          ctx.fillRect(startX + drawC * cell, startY + r * cell, cell + 0.5, cell + 0.5);
        }
      }
      return;
    }

    // Cloak with spring angle
    const cloakShift = Math.sin(cloakAngle) * size * 0.45;
    ctx.fillStyle = cloakCol;
    ctx.beginPath();
    ctx.moveTo(cx - facing * size * 0.1, yPos - size * 0.1);
    ctx.lineTo(cx - facing * (size * 0.65 + Math.abs(cloakShift)), yPos + size * 0.48);
    ctx.lineTo(cx + facing * size * 0.15, yPos + size * 0.42);
    ctx.closePath();
    ctx.fill();

    // 3D-Stack Torso Slices or 2D Torso
    const slices = rig3d ? 5 : 1;
    const yawShift = rig3d ? Math.sin(yawRad) * 4.5 : 0;
    for (let s = 0; s < slices; s++) {
      const depth = s - (slices - 1) * 0.5;
      const sx = cx + depth * yawShift * 0.4;
      const sy = yPos - depth * 1.4;
      ctx.fillStyle = s === slices - 1 ? bodyCol : bodyColDepth;
      roundRectPath(ctx, sx - size * 0.32, sy - size * 0.18, size * 0.64, size * 0.58, 6);
      ctx.fill();
    }

    // Head
    const headScale = style.id === 'chibi' ? 1.3 : 1;
    const headR = size * 0.32 * headScale;
    const headX = cx + yawShift * 0.5;
    const headY = yPos - size * 0.44;
    ctx.fillStyle = rimCol;
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    if (overrides.outline) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.lineWidth = overrides.strokeWidth;
      ctx.beginPath();
      ctx.arc(headX, headY, headR, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Visor / Eyes
    ctx.fillStyle = pose === 'hurt' ? '#f43f5e' : accentCol;
    ctx.beginPath();
    ctx.arc(cx + facing * headR * 0.36 + yawShift * 0.5, headY, headR * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Lantern Weapon / Attack Arc
    const atkDeg = pose === 'attack' ? facing * 58 : facing * 12;
    const pivotX = cx + facing * size * 0.24;
    const pivotY = yPos;
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate((atkDeg * Math.PI) / 180);
    ctx.fillStyle = accentCol;
    roundRectPath(ctx, -2.5, -size * 0.42, 5, size * 0.62, 3);
    ctx.fill();
    ctx.restore();

    if (pose === 'attack') {
      ctx.strokeStyle = ArtStyles.applyStyleTint(accentHex, overrides, 0.75);
      ctx.lineWidth = 4;
      ctx.beginPath();
      const startRad = ((facing > 0 ? -60 : 120) * Math.PI) / 180;
      const endRad = ((facing > 0 ? 60 : 240) * Math.PI) / 180;
      ctx.ellipse(cx, yPos - size * 0.05, size * 0.85, size * 0.7, 0, startRad, endRad);
      ctx.stroke();
    }
  },

  drawEnemyEntity(
    ctx: CanvasRenderingContext2D,
    archetype: string,
    cx: number,
    cy: number,
    r: number,
    style: ArtStyleSpec,
    timeSec: number,
    flash: number,
    telegraphRatio: number,
    koProgress: number,
    bossPhase: number,
    overrides: StyleOverrides = ArtStyles.DEFAULT_STYLE_OVERRIDES
  ): void {
    if (koProgress >= 0.99) return;
    const alpha = Math.min(1, Math.max(0, 1 - koProgress));
    let colHex = style.palette[4];
    if (archetype === 'boss_kala') colHex = bossPhase >= 3 ? style.palette[4] : style.palette[7];
    else if (archetype === 'sentinel') colHex = style.palette[3];
    else if (archetype === 'wisp') colHex = style.palette[1];

    const fill =
      flash > 0
        ? `rgba(255, 255, 255, ${alpha.toFixed(3)})`
        : ArtStyles.applyStyleTint(colHex, overrides, alpha);

    if (telegraphRatio > 0) {
      ctx.strokeStyle = `rgba(251, 191, 36, ${(telegraphRatio * 0.8).toFixed(3)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 7, 0, Math.PI * 2);
      ctx.stroke();
    }

    const bob = Math.sin(timeSec * 5 + cx * 0.03) * 3;
    ctx.fillStyle = fill;
    if (archetype === 'boss_kala') {
      ctx.beginPath();
      ctx.arc(cx, cy + bob, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(253, 224, 71, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(cx, cy + bob - r * 0.2, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      if (overrides.outline) {
        ctx.strokeStyle = `rgba(0, 0, 0, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy + bob, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (archetype === 'sentinel') {
      roundRectPath(ctx, cx - r, cy - r, r * 2, r * 2, 6);
      ctx.fill();
    } else if (archetype === 'wisp') {
      ctx.beginPath();
      ctx.arc(cx, cy + bob, r * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 255, 255, ${(0.7 * alpha).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(cx, cy + bob, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(cx, cy + bob * 0.5, r, r * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  drawGameWorld(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    world: GameWorld,
    style: ArtStyleSpec,
    renderMode: RenderMode,
    weather: WeatherKind,
    physicsDebug: boolean,
    overrides: StyleOverrides,
    hybridMode: HybridRender5Mode = 'hybrid_2_5d_billboard',
    perspective: PerspectiveConnectorId = '2_5d_parallax'
  ): void {
    const isPortrait = h > w * 1.1;
    const scale = isPortrait
      ? Math.max(0.76, w / 440)
      : Math.max(0.84, Math.min(w / 540, h / 380));
    const bottomReserve = isPortrait ? 142 : 42;
    const worldGroundY = world.def.groundY;
    const groundScreenY = Math.min(
      h - bottomReserve,
      Math.max(h * 0.66, worldGroundY * scale)
    );
    const offsetY = groundScreenY - worldGroundY * scale;
    const sx = (wx: number) => (wx - world.cameraX) * scale;
    const sy = (wy: number) => offsetY + wy * scale;
    const camX = world.cameraX;
    const tSec = world.time;
    const diurnal = evaluateDiurnalClimate(tSec, weather);

    const skyTopHex = world.level === 3 ? '#090414' : world.level === 2 ? '#0c192c' : style.palette[0];
    const skyBotHex = world.level === 3 ? '#1e1038' : world.level === 2 ? '#1b365d' : style.palette[5];
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, ArtStyles.applyStyleTint(skyTopHex, overrides));
    grad.addColorStop(1, ArtStyles.applyStyleTint(skyBotHex, overrides));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    if (hybridMode === 'raycast_pseudo3d' || perspective === 'fake_3d_raycast') {
      const cols = 24;
      const colW = w / cols;
      for (let c = 0; c < cols; c++) {
        const depth = 0.35 + 0.55 * Math.abs(Math.sin(c * 0.32 + camX * 0.008));
        const wallH = Math.min(groundScreenY * 0.8, h * 0.48 * depth);
        const topY = groundScreenY - wallH;
        ctx.fillStyle = ArtStyles.applyStyleTint(
          style.palette[5],
          overrides,
          Math.min(0.9, Math.max(0.25, 1 - depth * 0.5))
        );
        ctx.fillRect(c * colW, topY, colW + 1, wallH);
      }
    } else if (renderMode !== '2D') {
      const horizonY = Math.max(68, groundScreenY - 138 * scale);
      this.drawMode7Horizon(ctx, w, horizonY, groundScreenY, camX * scale, style, world.level, overrides);
    }

    // Hemisphere bounce light glow at horizon + subtle reflective puddle shimmer (Layer 3)
    ctx.fillStyle = shadeHexColor(diurnal.bounceTintHex, 1, 0.08);
    ctx.fillRect(0, groundScreenY - 14, w, 14);

    // Ground & decorative trees
    this.drawGroundTile(ctx, 0, groundScreenY, w, h - groundScreenY, style, world.level, overrides);
    // Subtle reflective water shimmer strip
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    const shimmerX = ((180 - camX * 0.7) * scale) % (w + 120);
    ctx.fillRect(shimmerX < -80 ? shimmerX + w : shimmerX, groundScreenY + 8, 92 * scale, 4);

    this.drawTreeAsset(ctx, sx(120), groundScreenY, scale * 0.9, style, overrides);
    this.drawTreeAsset(ctx, sx(520), groundScreenY, scale * 1.05, style, overrides);

    // Platforms
    ctx.fillStyle = ArtStyles.applyStyleTint(style.palette[2], overrides);
    for (const plat of world.def.platforms) {
      const px = sx(plat.x);
      const py = sy(plat.y);
      const pw = plat.w * scale;
      const ph = plat.h * scale;
      if (px + pw < -32 || px > w + 32) continue;
      roundRectPath(ctx, px, py, pw, ph, 4);
      ctx.fill();
    }

    // Obstacles (Top-Down)
    ctx.fillStyle = ArtStyles.applyStyleTint(style.palette[7], overrides, 0.85);
    for (const obs of world.obstacles) {
      roundRectPath(ctx, sx(obs.x), sy(obs.y), obs.w * scale, obs.h * scale, 6);
      ctx.fill();
    }

    // Gate
    this.drawGateAsset(
      ctx,
      sx(world.def.gate.x),
      sy(world.def.gate.y),
      world.def.gate.w * scale,
      world.def.gate.h * scale,
      world.gateUnlocked,
      style,
      tSec,
      overrides
    );

    // Switches
    for (const sw of world.switches) {
      const swX = sx(sw.x);
      const swY = sy(sw.y);
      ctx.fillStyle = sw.active ? '#34d399' : '#f59e0b';
      roundRectPath(ctx, swX - 14 * scale, swY - 8 * scale, 28 * scale, 8 * scale, 3);
      ctx.fill();
    }

    // Shards & Coins
    for (const sh of world.shards) {
      if (sh.collected) continue;
      const shX = sx(sh.x);
      const shY = sy(sh.y + Math.sin(tSec * 4 + sh.id) * 4);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(shX, shY, 9 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(shX, shY, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fbbf24';
    for (const coin of world.coins) {
      if (coin.collected) continue;
      ctx.beginPath();
      ctx.arc(sx(coin.x), sy(coin.y), 6 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rhythm Beat Notes
    for (const note of world.beatNotes) {
      if (note.hit || note.missed) continue;
      const nx = sx(note.x);
      const ny = sy(200 + note.lane * 52);
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(nx, ny, 11 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(nx, ny, 5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Defense Turrets
    ctx.fillStyle = '#38bdf8';
    for (const t of world.turrets) {
      ctx.beginPath();
      ctx.arc(sx(t.x), sy(t.y), 12 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Enemies
    for (const e of world.enemies) {
      const ex = sx(e.x);
      const ey = sy(e.y);
      if (ex < -60 || ex > w + 60) continue;
      this.drawEnemyEntity(
        ctx,
        e.archetype,
        ex,
        ey,
        e.w * 0.5 * scale,
        style,
        tSec,
        e.hurtFlash,
        e.telegraphTimer,
        e.koProgress,
        e.bossPhase,
        overrides
      );
    }

    // Companion Luma AI
    if (world.companion.active) {
      const lx = sx(world.companion.x);
      const ly = sy(world.companion.y + Math.sin(tSec * 6) * 5);
      ctx.fillStyle = 'rgba(52, 211, 153, 0.35)';
      ctx.beginPath();
      ctx.arc(lx, ly, 14 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6ee7b7';
      ctx.beginPath();
      ctx.arc(lx, ly, 7 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player Bowo with subtle squash-and-stretch on jump/dash
    const px = sx(world.player.x + world.player.w * 0.5);
    const py = sy(world.player.y + world.player.h * 0.5);
    const stretchY = world.player.animState === 'jump' ? 1.08 : world.player.animState === 'dash' ? 0.92 : 1;
    const squashX = 2 - stretchY;
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(squashX, stretchY);
    this.drawBowoCharacter(
      ctx,
      0,
      0,
      28 * scale,
      style,
      world.player.animState,
      world.player.facing,
      tSec,
      renderMode === '3D-Stack',
      Math.sin(tSec * 2) * 0.35,
      world.player.cloakSpring.angle1,
      overrides,
      world.customCharacter
    );
    ctx.restore();

    // Projectiles
    for (const pr of world.projectiles) {
      ctx.fillStyle = pr.fromPlayer ? '#38bdf8' : '#f43f5e';
      ctx.beginPath();
      ctx.arc(sx(pr.x), sy(pr.y), pr.r * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Particles (colorKind 0 = dust, 1 = golden burst sparks)
    for (let i = 0; i < world.particles.capacity; i++) {
      if (!world.particles.active[i]) continue;
      const a = Math.min(1, Math.max(0, world.particles.life[i] / world.particles.maxLife[i]));
      ctx.fillStyle =
        world.particles.colorKind[i] === 0
          ? `rgba(203, 213, 225, ${(a * 0.72).toFixed(3)})`
          : `rgba(253, 224, 71, ${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx(world.particles.x[i]), sy(world.particles.y[i]), world.particles.size[i] * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Weather overlay
    if (weather === 'Hujan') {
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const wi = Math.max(1, Math.floor(w));
      const hi = Math.max(1, Math.floor(h));
      for (let i = 0; i < 24; i++) {
        const rx = (i * 53 + Math.floor(tSec * 260)) % wi;
        const ry = (i * 37 + Math.floor(tSec * 480)) % hi;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 6, ry + 16);
      }
      ctx.stroke();
    } else if (weather === 'Salju') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      const wi = Math.max(1, Math.floor(w));
      const hi = Math.max(1, Math.floor(h));
      for (let i = 0; i < 24; i++) {
        const rx = (i * 61 + Math.floor(tSec * 45)) % wi;
        const ry = (i * 41 + Math.floor(tSec * 90)) % hi;
        ctx.beginPath();
        ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Physics Debug overlay
    if (physicsDebug) {
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx(world.player.x), sy(world.player.y), world.player.w * scale, world.player.h * scale);
      ctx.strokeStyle = '#f43f5e';
      for (const e of world.enemies) {
        if (e.dead) continue;
        ctx.strokeRect(sx(e.x - e.w * 0.5), sy(e.y - e.h * 0.5), e.w * scale, e.h * scale);
      }
    }

    if (overrides.scanline) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
      for (let lineY = 0; lineY < h; lineY += 4) {
        ctx.fillRect(0, lineY, w, 1);
      }
    }
  }
};
