import { ArtStyles } from '../engine/artStyles';
import {
  ArtStyleSpec,
  GeneratedCutsceneSpec,
  GeneratedMesh3DSpec,
  GeneratedSfxSpec,
  GeneratedTerrainSpec,
  StyleOverrides
} from '../engine/types';
import { GameCanvasRenderers, shadeHexColor } from './gameCanvasRenderers';

export const GeneratorRenderers = {
  drawTerrainCanvas(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    spec: GeneratedTerrainSpec,
    style: ArtStyleSpec
  ): void {
    const bg =
      spec.biome === 'storm' ? '#0f172a' : spec.biome === 'obsidian' ? '#140b24' : '#0b1e2e';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const colW = w / Math.max(1, spec.heights.length);
    const hex =
      spec.biome === 'storm' ? style.palette[1] : spec.biome === 'obsidian' ? style.palette[7] : style.palette[2];

    spec.heights.forEach((ht, idx) => {
      const bh = (ht / 150) * h * 0.78;
      const x = idx * colW;
      const y = h - bh;
      if (spec.mode === '3D-Heightmap') {
        ctx.fillStyle = ArtStyles.applyStyleTint(hex, ArtStyles.DEFAULT_STYLE_OVERRIDES, 0.85);
        ctx.fillRect(x, y, colW + 0.5, bh);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(x, y, colW + 0.5, 4);
      } else {
        ctx.fillStyle = hex;
        ctx.fillRect(x, y, colW + 0.5, bh);
      }
    });

    ctx.fillStyle = '#fbbf24';
    for (const p of spec.platforms) {
      const sx = (p.x / 540) * w;
      const sy = (p.y / 240) * h;
      const sw = (p.w / 540) * w;
      ctx.fillRect(sx, sy, sw, 6);
    }
  },

  drawSfxWaveformCanvas(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    spec: GeneratedSfxSpec
  ): void {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);
    const midY = h * 0.5;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    const steps = 72;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const env = (1 - t) * (1 - t);
      const freq = spec.freqStart + (spec.freqEnd - spec.freqStart) * t;
      const phase = t * (freq / 45);
      let yNorm: number;
      if (spec.wave === 'square') {
        yNorm = Math.sin(phase * 2 * Math.PI) >= 0 ? 1 : -1;
      } else if (spec.wave === 'sawtooth') {
        yNorm = (phase % 1) * 2 - 1;
      } else if (spec.wave === 'triangle') {
        yNorm = 1 - 4 * Math.abs((phase % 1) - 0.5);
      } else {
        yNorm = Math.sin(phase * 2 * Math.PI);
      }
      const px = t * w;
      const py = midY - yNorm * env * h * 0.38;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  },

  drawCutsceneCanvas(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    spec: GeneratedCutsceneSpec,
    playheadSec: number,
    style: ArtStyleSpec,
    overrides: StyleOverrides
  ): void {
    ctx.fillStyle = '#0b1221';
    ctx.fillRect(0, 0, w, h);
    GameCanvasRenderers.drawMode7Horizon(ctx, w, h * 0.52, h * 0.84, playheadSec * 40, style, 1, overrides);
    GameCanvasRenderers.drawGroundTile(ctx, 0, h * 0.84, w, h * 0.16, style, 1, overrides);

    const kfs = spec.keyframes;
    let active = kfs[0];
    for (const kf of kfs) {
      if (kf.timeSec <= playheadSec) active = kf;
    }
    if (active) {
      const shake = active.effect === 'shake' ? Math.sin(playheadSec * 45) * 4 : 0;
      GameCanvasRenderers.drawBowoCharacter(
        ctx,
        active.xNorm * w + shake,
        active.yNorm * h,
        28,
        style,
        active.pose,
        1,
        playheadSec,
        true,
        0.25,
        -0.15,
        overrides
      );
    }
    if (spec.weather === 'Hujan') {
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const wi = Math.max(1, Math.floor(w));
      const hi = Math.max(1, Math.floor(h));
      for (let i = 0; i < 18; i++) {
        const rx = (i * 39 + Math.floor(playheadSec * 220)) % wi;
        const ry = (i * 29 + Math.floor(playheadSec * 420)) % hi;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 5, ry + 14);
      }
      ctx.stroke();
    }
  },

  drawMesh3DPreviewCanvas(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    mesh: GeneratedMesh3DSpec,
    yawRad: number
  ): void {
    ctx.fillStyle = '#070d19';
    ctx.fillRect(0, 0, w, h);
    const cx = w * 0.5;
    const cy = h * 0.52;
    const scale = Math.min(w, h) * 0.36;
    const cosY = Math.cos(yawRad);
    const sinY = Math.sin(yawRad);

    interface ProjectedTri {
      zAvg: number;
      p1: [number, number];
      p2: [number, number];
      p3: [number, number];
      shade: string;
    }

    const projected: ProjectedTri[] = mesh.triangles.map((tri) => {
      const v0 = mesh.vertices[tri.a];
      const v1 = mesh.vertices[tri.b];
      const v2 = mesh.vertices[tri.c];
      const rot = (x: number, y: number, z: number): [number, number, number] => [
        x * cosY - z * sinY,
        y,
        x * sinY + z * cosY
      ];
      const r0 = rot(v0.x, v0.y, v0.z);
      const r1 = rot(v1.x, v1.y, v1.z);
      const r2 = rot(v2.x, v2.y, v2.z);
      const proj = (p: [number, number, number]): [number, number] => {
        const persp = 2.8 / (2.8 - p[2] * 0.6);
        return [cx + p[0] * scale * persp, cy - p[1] * scale * persp];
      };
      const ux = r1[0] - r0[0], uy = r1[1] - r0[1], uz = r1[2] - r0[2];
      const vx = r2[0] - r0[0], vy = r2[1] - r0[1], vz = r2[2] - r0[2];
      const nx = uy * vz - uz * vy;
      const ny = uz * vx - ux * vz;
      const nz = ux * vy - uy * vx;
      const len = Math.max(1e-4, Math.sqrt(nx * nx + ny * ny + nz * nz));
      const ndl = Math.min(1, Math.max(0.25, (nx / len) * 0.4 + (ny / len) * 0.8 + (nz / len) * 0.5));
      const shade = shadeHexColor(tri.color, 0.45 + 0.55 * ndl, 1);
      return {
        zAvg: (r0[2] + r1[2] + r2[2]) / 3,
        p1: proj(r0),
        p2: proj(r1),
        p3: proj(r2),
        shade
      };
    });

    projected.sort((a, b) => a.zAvg - b.zAvg);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 0.8;
    for (const pt of projected) {
      ctx.fillStyle = pt.shade;
      ctx.beginPath();
      ctx.moveTo(pt.p1[0], pt.p1[1]);
      ctx.lineTo(pt.p2[0], pt.p2[1]);
      ctx.lineTo(pt.p3[0], pt.p3[1]);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
};
