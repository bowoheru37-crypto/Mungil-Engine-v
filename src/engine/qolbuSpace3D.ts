import { Camera3DPresetId, HybridRender5Mode } from './types';

export const Space3DConstants = {
  CULL_DISTANCE_M: 35,
  LOD0_MAX_M: 12,
  LOD1_MAX_M: 24,
  REBASE_THRESHOLD_M: 500,
  MAX_DRAW_CALLS: 35,
  CHAR_TRIS_LIMIT: 800,
  MAX_ENTITIES: 256,
  FOG_START_M: 10,
  FOG_END_M: 35
} as const;

export interface Camera3DState {
  preset: Camera3DPresetId;
  eyeX: number;
  eyeY: number;
  eyeZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  fovDeg: number;
  aspect: number;
  near: number;
  far: number;
}

export interface ProjectedPoint {
  sx: number;
  sy: number;
  scale: number;
}

export interface ProjectionOut {
  sx: number;
  sy: number;
  depth: number;
  scale: number;
  visible: boolean;
}

export interface IsoWorldOut {
  wx: number;
  wz: number;
}

export interface DepthSortableItem {
  x: number;
  y: number;
  z: number;
  id?: number;
}

export interface OriginRebaseResult {
  rebased: boolean;
  shiftX: number;
  shiftZ: number;
  newOriginX: number;
  newOriginZ: number;
}

export interface HybridModeSpec {
  id: HybridRender5Mode;
  label: string;
  desc: string;
}

export interface CameraPresetSpec {
  id: Camera3DPresetId;
  label: string;
  desc: string;
}

export const QolbuSpace3DMath = {
  CAMERA_3_PRESETS: [
    { id: 'iso_fixed', label: 'Camera A: Fixed Isometric', desc: 'Locked elevated isometric vantage at (12, 14, 12).' },
    { id: 'follow_3_4', label: 'Camera B: Follow 3/4', desc: 'Smooth damped 3/4 third-person follow camera.' },
    { id: 'fps_raycast', label: 'Camera C: FPS Raycast', desc: '1.65m eye-height yaw-only corridor camera.' }
  ] as CameraPresetSpec[],

  HYBRID_5_MODES: [
    { id: 'hybrid_2_5d_billboard', label: 'Hybrid 2.5D Billboard', desc: 'Depth-scaled sprites + 2.5D parallax background.' },
    { id: 'isometric_painter', label: 'Isometric Painter Sort', desc: 'Painter-sorted diamond prism world.' },
    { id: 'raycast_pseudo3d', label: 'Raycast Pseudo-3D', desc: 'Column DDA corridor with depth darkening fog.' },
    { id: 'mode7_voxel', label: 'Mode-7 & Voxel Space', desc: 'Scanline ground horizon + voxel heightmap hills.' },
    { id: 'real_3d_lowpoly', label: 'Real 3D Low-Poly', desc: 'Projected 3D mesh triangles with Lambert shading.' }
  ] as HybridModeSpec[],

  project3D(
    wx: number,
    wy: number,
    wz: number,
    viewWidth: number,
    viewHeight: number,
    focal = 260
  ): ProjectedPoint {
    const zSafe = Math.max(32, wz + focal);
    const scale = focal / zSafe;
    const sx = viewWidth * 0.5 + wx * scale;
    const sy = viewHeight * 0.5 + wy * scale;
    return { sx, sy, scale };
  },

  projectFake3D(
    wx: number,
    wy: number,
    wz: number,
    cam: { x: number; y: number; z: number; yawRad?: number; focal?: number; near?: number },
    viewWidth: number,
    viewHeight: number,
    out: ProjectionOut = { sx: 0, sy: 0, depth: 0, scale: 0, visible: false }
  ): ProjectionOut {
    if (
      !Number.isFinite(wx) || !Number.isFinite(wy) || !Number.isFinite(wz) ||
      !Number.isFinite(cam.x) || !Number.isFinite(cam.y) || !Number.isFinite(cam.z)
    ) {
      out.visible = false;
      out.scale = 0;
      out.depth = 0;
      return out;
    }
    const dx = wx - cam.x;
    const dy = wy - cam.y;
    const dz = wz - cam.z;
    const yaw = cam.yawRad ?? 0;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const rx = dx * cosY - dz * sinY;
    const rz = dx * sinY + dz * cosY;
    const near = cam.near ?? 0.25;
    if (rz <= near) {
      out.visible = false;
      out.depth = rz;
      out.scale = 0;
      return out;
    }
    const focal = cam.focal ?? 280;
    const scale = focal / rz;
    out.sx = viewWidth * 0.5 + rx * scale;
    out.sy = viewHeight * 0.5 - dy * scale;
    out.depth = rz;
    out.scale = scale;
    out.visible = true;
    return out;
  },

  projectIsometric(
    wx: number,
    wy: number,
    wz: number,
    tileW = 48,
    tileH = 24,
    originX = 0,
    originY = 0,
    out: ProjectionOut = { sx: 0, sy: 0, depth: 0, scale: 1, visible: true }
  ): ProjectionOut {
    if (!Number.isFinite(wx) || !Number.isFinite(wy) || !Number.isFinite(wz)) {
      out.visible = false;
      return out;
    }
    out.sx = originX + (wx - wz) * (tileW * 0.5);
    out.sy = originY + (wx + wz) * (tileH * 0.5) - wy;
    out.depth = wx + wz + wy * 0.01;
    out.scale = 1;
    out.visible = true;
    return out;
  },

  unprojectIsometric(
    sx: number,
    sy: number,
    tileW = 48,
    tileH = 24,
    originX = 0,
    originY = 0,
    out: IsoWorldOut = { wx: 0, wz: 0 }
  ): IsoWorldOut {
    const hw = Math.max(1e-4, tileW * 0.5);
    const hh = Math.max(1e-4, tileH * 0.5);
    const dx = (sx - originX) / hw;
    const dy = (sy - originY) / hh;
    out.wx = (dx + dy) * 0.5;
    out.wz = (dy - dx) * 0.5;
    return out;
  },

  compareDepth(a: DepthSortableItem, b: DepthSortableItem): number {
    const da = a.x + a.z;
    const db = b.x + b.z;
    if (da !== db) return da - db;
    if (a.y !== b.y) return a.y - b.y;
    return (a.id ?? 0) - (b.id ?? 0);
  },

  createCamera3D(preset: Camera3DPresetId = 'follow_3_4', aspect = 16 / 9): Camera3DState {
    if (preset === 'iso_fixed') {
      return { preset, eyeX: 12, eyeY: 14, eyeZ: 12, targetX: 0, targetY: 0, targetZ: 0, fovDeg: 45, aspect, near: 0.2, far: 60 };
    }
    if (preset === 'fps_raycast') {
      return { preset, eyeX: 0, eyeY: 1.65, eyeZ: 0, targetX: 0, targetY: 1.65, targetZ: -4, fovDeg: 65, aspect, near: 0.2, far: 60 };
    }
    return { preset, eyeX: 0, eyeY: 8, eyeZ: 8, targetX: 0, targetY: 0, targetZ: 0, fovDeg: 52, aspect, near: 0.2, far: 60 };
  },

  updateCameraModeAIsometric(cam: Camera3DState): void {
    cam.preset = 'iso_fixed';
    cam.eyeX = 12; cam.eyeY = 14; cam.eyeZ = 12;
    cam.targetX = 0; cam.targetY = 0; cam.targetZ = 0;
  },

  updateCameraModeBFollow34(cam: Camera3DState, px: number, py: number, pz: number, dt: number): void {
    cam.preset = 'follow_3_4';
    const alpha = Math.min(1, Math.max(0, dt * 7));
    cam.targetX += (px - cam.targetX) * alpha;
    cam.targetY += (py - cam.targetY) * alpha;
    cam.targetZ += (pz - cam.targetZ) * alpha;
    cam.eyeX += (px - cam.eyeX) * alpha;
    cam.eyeY += (py + 8 - cam.eyeY) * alpha;
    cam.eyeZ += (pz + 8 - cam.eyeZ) * alpha;
  },

  updateCameraModeCFpsRaycast(cam: Camera3DState, px: number, py: number, pz: number, yawRad: number): void {
    cam.preset = 'fps_raycast';
    const eyeH = py + 1.65;
    cam.eyeX = px; cam.eyeY = eyeH; cam.eyeZ = pz;
    cam.targetX = px + Math.sin(yawRad) * 4;
    cam.targetY = eyeH;
    cam.targetZ = pz - Math.cos(yawRad) * 4;
  },

  evaluateCullAndLod(distM: number, inFrustum: boolean, occluded: boolean): number {
    if (!inFrustum || occluded || distM > Space3DConstants.CULL_DISTANCE_M) return -1;
    if (distM <= Space3DConstants.LOD0_MAX_M) return 0;
    if (distM <= Space3DConstants.LOD1_MAX_M) return 1;
    return 2;
  },

  calcFogFactor(distM: number): number {
    if (distM <= Space3DConstants.FOG_START_M) return 0;
    if (distM >= Space3DConstants.FOG_END_M) return 1;
    return (distM - Space3DConstants.FOG_START_M) / (Space3DConstants.FOG_END_M - Space3DConstants.FOG_START_M);
  },

  evaluateOriginRebase(px: number, pz: number, curOriginX: number, curOriginZ: number): OriginRebaseResult {
    const threshold = Space3DConstants.REBASE_THRESHOLD_M;
    if (Math.abs(px) < threshold && Math.abs(pz) < threshold) {
      return { rebased: false, shiftX: 0, shiftZ: 0, newOriginX: curOriginX, newOriginZ: curOriginZ };
    }
    const shiftX = Math.floor(px / threshold) * threshold;
    const shiftZ = Math.floor(pz / threshold) * threshold;
    return {
      rebased: shiftX !== 0 || shiftZ !== 0,
      shiftX,
      shiftZ,
      newOriginX: curOriginX + shiftX,
      newOriginZ: curOriginZ + shiftZ
    };
  },

  buildLookAtMatrix(
    eyeX: number, eyeY: number, eyeZ: number,
    targetX: number, targetY: number, targetZ: number
  ): Float32Array {
    let fx = targetX - eyeX;
    let fy = targetY - eyeY;
    let fz = targetZ - eyeZ;
    const fLen = Math.max(1e-5, Math.sqrt(fx * fx + fy * fy + fz * fz));
    fx /= fLen; fy /= fLen; fz /= fLen;
    let rx = -fz;
    const ry = 0;
    let rz = fx;
    const rLen = Math.max(1e-5, Math.sqrt(rx * rx + rz * rz));
    rx /= rLen; rz /= rLen;
    const ux = ry * fz - rz * fy;
    const uy = rz * fx - rx * fz;
    const uz = rx * fy - ry * fx;
    return new Float32Array([
      rx, ux, -fx, 0,
      ry, uy, -fy, 0,
      rz, uz, -fz, 0,
      -(rx * eyeX + ry * eyeY + rz * eyeZ),
      -(ux * eyeX + uy * eyeY + uz * eyeZ),
      fx * eyeX + fy * eyeY + fz * eyeZ,
      1
    ]);
  },

  buildPerspectiveMatrix(fovDeg: number, aspect: number, near: number, far: number): Float32Array {
    const f = 1 / Math.tan(((fovDeg * Math.PI) / 180) * 0.5);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0
    ]);
  }
};

export class QolbuSpace3D {
  camera: Camera3DState;
  readonly capacity: number;
  private readonly active: Uint8Array;
  private readonly wx: Float32Array;
  private readonly wy: Float32Array;
  private readonly wz: Float32Array;
  readonly screenX: Float32Array;
  readonly screenY: Float32Array;
  readonly lodLevel: Int32Array;

  constructor(
    preset: Camera3DPresetId = 'follow_3_4',
    aspect = 16 / 9,
    capacity = Space3DConstants.MAX_ENTITIES
  ) {
    this.camera = QolbuSpace3DMath.createCamera3D(preset, aspect);
    this.capacity = capacity;
    this.active = new Uint8Array(capacity);
    this.wx = new Float32Array(capacity);
    this.wy = new Float32Array(capacity);
    this.wz = new Float32Array(capacity);
    this.screenX = new Float32Array(capacity);
    this.screenY = new Float32Array(capacity);
    this.lodLevel = new Int32Array(capacity).fill(-1);
  }

  setEntity(slot: number, x: number, y: number, z: number): void {
    if (slot < 0 || slot >= this.capacity) return;
    this.active[slot] = 1;
    this.wx[slot] = x;
    this.wy[slot] = y;
    this.wz[slot] = z;
  }

  updateAll(viewWidth: number, viewHeight: number): { visible: number; culled: number } {
    this.camera.aspect = Math.max(0.4, viewWidth / Math.max(1, viewHeight));
    const view = QolbuSpace3DMath.buildLookAtMatrix(
      this.camera.eyeX, this.camera.eyeY, this.camera.eyeZ,
      this.camera.targetX, this.camera.targetY, this.camera.targetZ
    );
    const proj = QolbuSpace3DMath.buildPerspectiveMatrix(
      this.camera.fovDeg, this.camera.aspect, this.camera.near, this.camera.far
    );
    let visible = 0;
    let culled = 0;
    for (let i = 0; i < this.capacity; i++) {
      if (!this.active[i]) continue;
      const dx = this.wx[i] - this.camera.eyeX;
      const dy = this.wy[i] - this.camera.eyeY;
      const dz = this.wz[i] - this.camera.eyeZ;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const vx = view[0] * this.wx[i] + view[4] * this.wy[i] + view[8] * this.wz[i] + view[12];
      const vy = view[1] * this.wx[i] + view[5] * this.wy[i] + view[9] * this.wz[i] + view[13];
      const vz = view[2] * this.wx[i] + view[6] * this.wy[i] + view[10] * this.wz[i] + view[14];
      const clipW = -vz;
      const inFrustum = clipW > this.camera.near;
      const lod = QolbuSpace3DMath.evaluateCullAndLod(dist, inFrustum, false);
      this.lodLevel[i] = lod;
      if (lod < 0) {
        culled++;
        continue;
      }
      const ndcX = (proj[0] * vx) / clipW;
      const ndcY = (proj[5] * vy) / clipW;
      this.screenX[i] = (ndcX * 0.5 + 0.5) * viewWidth;
      this.screenY[i] = (0.5 - ndcY * 0.5) * viewHeight;
      visible++;
    }
    return { visible, culled };
  }
}
