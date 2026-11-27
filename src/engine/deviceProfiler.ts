import { DeviceProfile, DeviceTierId } from './types';

export interface ViewportBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface DynamicResUpdate {
  nextScale: number;
  emaMs: number;
}

export const Culling = {
  isRectInViewport(
    x: number,
    y: number,
    w: number,
    h: number,
    vp: ViewportBounds,
    margin = 48
  ): boolean {
    return (
      x + w >= vp.left - margin &&
      x <= vp.right + margin &&
      y + h >= vp.top - margin &&
      y <= vp.bottom + margin
    );
  },

  isCircleInViewport(
    cx: number,
    cy: number,
    r: number,
    vp: ViewportBounds,
    margin = 48
  ): boolean {
    return (
      cx + r >= vp.left - margin &&
      cx - r <= vp.right + margin &&
      cy + r >= vp.top - margin &&
      cy - r <= vp.bottom + margin
    );
  },

  isPointInViewport(
    x: number,
    y: number,
    vp: ViewportBounds,
    margin = 32
  ): boolean {
    return (
      x >= vp.left - margin &&
      x <= vp.right + margin &&
      y >= vp.top - margin &&
      y <= vp.bottom + margin
    );
  }
};

export const DeviceProfiler = {
  detectHardwareTier(): DeviceTierId {
    if (typeof navigator === 'undefined') return 'eco';
    const nav = navigator as Navigator & { deviceMemory?: number };
    const memGb = nav.deviceMemory ?? 3;
    const cores = nav.hardwareConcurrency ?? 4;
    if (memGb <= 3.5 || cores <= 4) return 'eco';
    if (memGb <= 6) return 'mid';
    return 'hd';
  },

  createDeviceProfile(
    requestedTier: DeviceTierId,
    powerSaveAuto: boolean
  ): DeviceProfile {
    const activeTier = requestedTier === 'auto' ? this.detectHardwareTier() : requestedTier;
    if (activeTier === 'eco') {
      return {
        requestedTier,
        activeTier: 'eco',
        targetFps: 30,
        dprCap: 1.25,
        dynamicScale: 0.8,
        shadowBlur: 0,
        particleMax: 45,
        powerSaveAuto,
        renderer: 'HTML5 Canvas 2D (Itel A70 Eco)'
      };
    }
    if (activeTier === 'mid') {
      return {
        requestedTier,
        activeTier: 'mid',
        targetFps: powerSaveAuto ? 45 : 60,
        dprCap: 1.6,
        dynamicScale: 0.92,
        shadowBlur: 2,
        particleMax: 96,
        powerSaveAuto,
        renderer: 'HTML5 Canvas 2D (Mid Tier)'
      };
    }
    return {
      requestedTier,
      activeTier: 'hd',
      targetFps: 60,
      dprCap: 2.0,
      dynamicScale: 1.0,
      shadowBlur: 6,
      particleMax: 160,
      powerSaveAuto,
      renderer: 'HTML5 Canvas 2D (HD 60Hz)'
    };
  },

  updateDynamicResolution(
    profile: DeviceProfile,
    frameMs: number,
    currentScale: number
  ): DynamicResUpdate {
    const budgetMs = 1000 / profile.targetFps;
    let next = currentScale;
    if (frameMs > budgetMs * 1.18) {
      next = Math.max(0.6, currentScale - 0.04);
    } else if (frameMs < budgetMs * 0.78) {
      next = Math.min(1.0, currentScale + 0.02);
    }
    return { nextScale: next, emaMs: frameMs };
  }
};
