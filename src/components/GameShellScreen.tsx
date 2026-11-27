import React, { useEffect, useRef, useState } from 'react';
import { Activity, Camera, Pause, Play, RefreshCw, Wrench, X } from 'lucide-react';
import { GameCanvasRenderers } from '../canvas/gameCanvasRenderers';
import { FramePacingProbe, FramePacingReport } from '../engine/architecture12Layers';
import { ArtStyles } from '../engine/artStyles';
import { GameSimulation } from '../engine/gameSimulation';
import { SimConfig, SimEvent, SimInput } from '../engine/gameSimulationData';
import { I18n } from '../engine/i18n';
import { QolbuConstants } from '../engine/qolbuCore';
import { SoundEngine } from '../engine/soundEngine';
import { useEngineStore } from '../state/useEngineStore';
import { ActionButton } from './ui/Primitives';

const VirtualJoystick: React.FC<{
  diameterPx: number;
  deadzone: number;
  opacity: number;
  onMove: (dx: number, dy: number) => void;
}> = ({ diameterPx, deadzone, opacity, onMove }) => {
  const knobRef = useRef<HTMLDivElement | null>(null);
  const activePointerId = useRef<number | null>(null);
  const centerRef = useRef<{ x: number; y: number; maxR: number }>({ x: 0, y: 0, maxR: 1 });

  const setKnobTransform = (cx: number, cy: number) => {
    if (knobRef.current) {
      knobRef.current.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
    }
  };

  const updateFromClient = (clientX: number, clientY: number) => {
    const { x, y, maxR } = centerRef.current;
    const dx = clientX - x;
    const dy = clientY - y;
    const dist = Math.hypot(dx, dy);
    const scale = dist > maxR ? maxR / dist : 1;
    const cx = dx * scale;
    const cy = dy * scale;
    setKnobTransform(cx, cy);
    const nx = Math.max(-1, Math.min(1, cx / maxR));
    const ny = Math.max(-1, Math.min(1, cy / maxR));
    onMove(Math.abs(nx) < deadzone ? 0 : nx, Math.abs(ny) < deadzone ? 0 : ny);
  };

  const reset = () => {
    activePointerId.current = null;
    setKnobTransform(0, 0);
    onMove(0, 0);
  };

  return (
    <div
      role="slider"
      aria-label="Virtual Joystick"
      aria-valuenow={0}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        activePointerId.current = e.pointerId;
        const rect = e.currentTarget.getBoundingClientRect();
        centerRef.current = {
          x: rect.left + rect.width * 0.5,
          y: rect.top + rect.height * 0.5,
          maxR: rect.width * 0.38
        };
        updateFromClient(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activePointerId.current === e.pointerId) {
          updateFromClient(e.clientX, e.clientY);
        }
      }}
      onPointerUp={(e) => {
        if (activePointerId.current === e.pointerId) reset();
      }}
      onPointerCancel={(e) => {
        if (activePointerId.current === e.pointerId) reset();
      }}
      onLostPointerCapture={() => reset()}
      className="relative flex touch-none items-center justify-center rounded-full border-2 select-none"
      style={{
        width: `${diameterPx}px`,
        height: `${diameterPx}px`,
        opacity,
        backgroundColor: 'rgba(11, 18, 33, 0.55)',
        borderColor: 'rgba(56, 189, 248, 0.78)'
      }}
    >
      <div
        ref={knobRef}
        className="pointer-events-none rounded-full"
        style={{
          width: `${Math.round(diameterPx * 0.42)}px`,
          height: `${Math.round(diameterPx * 0.42)}px`,
          transform: 'translate3d(0px, 0px, 0)',
          backgroundColor: 'rgba(56, 189, 248, 0.92)'
        }}
      />
    </div>
  );
};

const ActionTouchButton: React.FC<{
  label: string;
  color: string;
  sizePx: number;
  showLabel: boolean;
  onTrigger: () => void;
}> = ({ label, color, sizePx, showLabel, onTrigger }) => {
  const safeSize = Math.max(48, sizePx);
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        onTrigger();
      }}
      onClick={(e) => {
        if (e.detail === 0) onTrigger();
      }}
      className="flex cursor-pointer touch-none items-center justify-center rounded-full text-[11px] font-extrabold shadow-md transition-transform active:scale-90 select-none"
      style={{
        width: `${safeSize}px`,
        height: `${safeSize}px`,
        backgroundColor: color,
        color: '#090f1d'
      }}
    >
      {showLabel ? label : label.slice(0, 1)}
    </button>
  );
};

export const GameShellScreen: React.FC = () => {
  const {
    state,
    activeWorldRef,
    openStudioTab,
    backToLanding,
    startOrRestartLevel,
    pauseGame,
    resumeGame,
    syncWorldEventsAndHud,
    triggerPotion,
    chooseVnOption,
    saveProgress,
    loadProgress,
    showBanner
  } = useEngineStore();

  const tr = I18n.t(state.lang);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const probeRef = useRef<FramePacingProbe>(new FramePacingProbe(120));

  const [showProfiler, setShowProfiler] = useState(false);
  const [profilerStats, setProfilerStats] = useState<FramePacingReport>(() => probeRef.current.getReport());
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  // Zero-allocation simulation refs
  const touchMoveRef = useRef({ x: 0, y: 0 });
  const keyStateRef = useRef({ left: false, right: false, up: false, down: false });
  const queuedRef = useRef({
    jumpPressed: false,
    jumpHoldFrames: 0,
    attackPressed: false,
    dashPressed: false,
    burstPressed: false
  });
  const latestStateRef = useRef(state);
  latestStateRef.current = state;

  const vibe = (ms = 12) => {
    if (state.touchConfig.haptics && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  // Clear stuck inputs on blur or tab switch; pause probe cleanly
  useEffect(() => {
    const clearInputs = () => {
      keyStateRef.current.left = false;
      keyStateRef.current.right = false;
      keyStateRef.current.up = false;
      keyStateRef.current.down = false;
      touchMoveRef.current.x = 0;
      touchMoveRef.current.y = 0;
      probeRef.current.markPaused();
    };
    const onVisibility = () => {
      if (document.hidden) clearInputs();
    };
    window.addEventListener('blur', clearInputs);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', clearInputs);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Keyboard bindings including Title Enter/Space launch
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (latestStateRef.current.shellState === 'TITLE') {
        if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat) {
          e.preventDefault();
          (document.activeElement as HTMLElement | null)?.blur?.();
          startOrRestartLevel(latestStateRef.current.activeLevel, null, 'off');
        }
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (photoPreviewUrl) {
          setPhotoPreviewUrl(null);
          resumeGame();
          return;
        }
        if (latestStateRef.current.shellState === 'PLAYING') pauseGame();
        else if (latestStateRef.current.shellState === 'PAUSED') resumeGame();
        return;
      }

      if (latestStateRef.current.shellState !== 'PLAYING') return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keyStateRef.current.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keyStateRef.current.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        keyStateRef.current.up = true;
        if (!e.repeat) {
          queuedRef.current.jumpPressed = true;
          queuedRef.current.jumpHoldFrames = 8;
        }
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') keyStateRef.current.down = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) {
          queuedRef.current.jumpPressed = true;
          queuedRef.current.jumpHoldFrames = 8;
        }
      }
      if ((e.code === 'KeyJ' || e.code === 'KeyZ') && !e.repeat) queuedRef.current.attackPressed = true;
      if ((e.code === 'KeyK' || e.code === 'KeyX') && !e.repeat) queuedRef.current.dashPressed = true;
      if ((e.code === 'KeyL' || e.code === 'KeyC') && !e.repeat) queuedRef.current.burstPressed = true;
      if (e.code === 'KeyH' && !e.repeat) triggerPotion();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keyStateRef.current.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keyStateRef.current.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') keyStateRef.current.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') keyStateRef.current.down = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [pauseGame, resumeGame, triggerPotion, startOrRestartLevel, photoPreviewUrl]);

  // Fixed-timestep simulation + canvas draw loop with throttled ~10Hz HUD React sync
  useEffect(() => {
    let rafId = 0;
    let lastMs = performance.now();
    let lastDrawMs = 0;
    let accum = 0;
    let fpsFrames = 0;
    let fpsTimer = 0;
    let lastHudSyncMs = 0;
    let lastHudSig = '';
    let lastStaticDrawSig = '';
    let currentFps = latestStateRef.current.deviceProfile.targetFps;

    const drawCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const cur = latestStateRef.current;
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const dpr =
        Math.min(window.devicePixelRatio || 1, cur.deviceProfile.dprCap) *
        Math.max(0.6, Math.min(1, cur.deviceProfile.dynamicScale));
      const targetW = Math.max(1, Math.round(rect.width * dpr));
      const targetH = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const activeStyle = ArtStyles.getStyleSpec(cur.styleId, cur.customPalettes);
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      GameCanvasRenderers.drawGameWorld(
        ctx,
        rect.width,
        rect.height,
        activeWorldRef.current,
        activeStyle,
        cur.renderMode,
        cur.weather,
        cur.physicsDebug,
        cur.styleOverrides,
        cur.hybridMode,
        cur.perspectiveConnector
      );
      ctx.restore();
    };

    const tick = (nowMs: number) => {
      const cur = latestStateRef.current;
      const rawDt = Math.min(0.05, Math.max(0, (nowMs - lastMs) / 1000));
      lastMs = nowMs;

      if (cur.shellState === 'PLAYING') {
        lastStaticDrawSig = '';
        probeRef.current.record(nowMs);
        const fixedDt = cur.deviceProfile.targetFps <= 35 ? 1 / 30 : 1 / 60;
        const minDrawIntervalMs = 1000 / Math.max(24, cur.deviceProfile.targetFps);
        accum += rawDt;
        fpsFrames++;
        fpsTimer += rawDt;
        if (fpsTimer >= 0.5) {
          currentFps = Math.max(1, Math.min(120, Math.round(fpsFrames / fpsTimer)));
          fpsFrames = 0;
          fpsTimer = 0;
          if (showProfiler) {
            setProfilerStats(probeRef.current.getReport());
          }
        }

        const cfg: SimConfig = {
          physicsMode: cur.physicsMode,
          renderMode: cur.renderMode,
          weather: cur.weather,
          practiceMode: cur.practiceMode,
          speedMul: cur.speedMul,
          gravityMul: cur.gravityMul,
          eventRules: cur.eventRules
        };

        let steps = 0;
        const allEvents: SimEvent[] = [];
        while (accum >= fixedDt && steps < QolbuConstants.MAX_CATCHUP_STEPS) {
          const kx = (keyStateRef.current.right ? 1 : 0) - (keyStateRef.current.left ? 1 : 0);
          const ky = (keyStateRef.current.down ? 1 : 0) - (keyStateRef.current.up ? 1 : 0);
          const mx = Math.abs(kx) > 0 ? kx : touchMoveRef.current.x;
          const my = Math.abs(ky) > 0 ? ky : touchMoveRef.current.y;

          const input: SimInput = {
            moveX: mx,
            moveY: my,
            jumpPressed: queuedRef.current.jumpPressed,
            jumpHeld: queuedRef.current.jumpHoldFrames > 0,
            attackPressed: queuedRef.current.attackPressed,
            dashPressed: queuedRef.current.dashPressed,
            burstPressed: queuedRef.current.burstPressed
          };
          queuedRef.current.jumpPressed = false;
          if (queuedRef.current.jumpHoldFrames > 0) queuedRef.current.jumpHoldFrames--;
          queuedRef.current.attackPressed = false;
          queuedRef.current.dashPressed = false;
          queuedRef.current.burstPressed = false;

          allEvents.push(
            ...GameSimulation.stepGameWorld(activeWorldRef.current, input, fixedDt, cfg, cur.aiMode)
          );
          accum -= fixedDt;
          steps++;
        }

        const wRef = activeWorldRef.current;
        const hudSig = `${wRef.level}|${wRef.player.hp}|${Math.floor(wRef.player.energy)}|${wRef.shardsTotal}|${wRef.coinsTotal}|${wRef.score}|${wRef.gateUnlocked}|${wRef.vnStep}|${currentFps}`;
        const discreteChange = allEvents.length > 0 || wRef.status !== 'playing';
        if (discreteChange || (hudSig !== lastHudSig && nowMs - lastHudSyncMs >= 160)) {
          lastHudSyncMs = nowMs;
          lastHudSig = hudSig;
          syncWorldEventsAndHud(allEvents, currentFps);
        }

        if (nowMs - lastDrawMs >= minDrawIntervalMs - 2) {
          lastDrawMs = nowMs;
          drawCanvas();
        }
      } else {
        probeRef.current.markPaused();
        const canvas = canvasRef.current;
        const cw = canvas?.clientWidth ?? 0;
        const ch = canvas?.clientHeight ?? 0;
        const staticSig = `${cur.shellState}|${cur.activeLevel}|${cur.styleId}|${cur.renderMode}|${cur.weather}|${cw}x${ch}`;
        if (staticSig !== lastStaticDrawSig) {
          lastStaticDrawSig = staticSig;
          drawCanvas();
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [activeWorldRef, syncWorldEventsAndHud, showProfiler]);

  const capturePhotoFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    pauseGame();
    try {
      setPhotoPreviewUrl(canvas.toDataURL('image/png'));
      SoundEngine.playSfx('ui_chime');
    } catch {
      showBanner('Photo capture unavailable in this browser.');
    }
  };

  const downloadCapturedPhoto = () => {
    if (!photoPreviewUrl) return;
    const a = document.createElement('a');
    a.href = photoPreviewUrl;
    a.download = `mungil_photo_lv${state.activeLevel}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showBanner('Saved Photo Mode PNG!');
  };

  const hud = state.hud;
  const vn = hud.vnDialog;
  const cfg = state.touchConfig;
  const joyLeft = cfg.joystickSide !== 'right';

  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden select-none"
      style={{ backgroundColor: 'var(--me-bg)', color: 'var(--me-text)' }}
    >
      {/* Live Game Stage Canvas */}
      <canvas ref={canvasRef} className="block h-full w-full" />

      {/* Top Compact Solid-Surface HUD (Zero backdrop-blur over live canvas) */}
      {(state.shellState === 'PLAYING' || state.shellState === 'PAUSED') && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-2 sm:p-3">
          <div className="mx-auto max-w-4xl space-y-1.5">
            <div
              className="pointer-events-auto flex flex-col gap-2 rounded-xl border px-3 py-2 shadow-lg sm:flex-row sm:items-center sm:justify-between"
              style={{
                backgroundColor: 'rgba(11, 18, 33, 0.92)',
                borderColor: 'var(--me-border)'
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="tabular-nums text-xs font-bold text-slate-100 sm:text-sm">
                  Lv.{hud.level} {hud.levelName} · HP {hud.hp}/{hud.maxHp} · EN {hud.energy}
                </div>
                <div className="tabular-nums text-[11px] font-medium" style={{ color: 'var(--me-primary)' }}>
                  Shards {hud.shards}/{hud.requiredShards} · Sw {hud.switchesActive}/{hud.requiredSwitches} · Coins{' '}
                  {hud.coins} · Score {hud.score} · {hud.fps} FPS
                </div>
                <div
                  className="hidden truncate text-xs sm:block"
                  style={{ color: hud.gateUnlocked ? 'var(--me-secondary)' : '#cbd5e1' }}
                >
                  {hud.objective}
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-end gap-1.5">
                <button
                  type="button"
                  aria-label="Toggle Frame Profiler"
                  onClick={() => {
                    setShowProfiler((p) => !p);
                    setProfilerStats(probeRef.current.getReport());
                  }}
                  className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border"
                  style={{
                    backgroundColor: showProfiler ? 'var(--me-primary)' : 'var(--me-surface-variant)',
                    borderColor: 'var(--me-border)',
                    color: showProfiler ? 'var(--me-on-primary)' : 'var(--me-text)'
                  }}
                >
                  <Activity className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Photo Mode"
                  onClick={capturePhotoFrame}
                  className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border"
                  style={{
                    backgroundColor: 'var(--me-surface-variant)',
                    borderColor: 'var(--me-border)',
                    color: 'var(--me-text)'
                  }}
                >
                  <Camera className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Open Studio"
                  onClick={() => openStudioTab('play')}
                  className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border"
                  style={{
                    backgroundColor: 'var(--me-surface-variant)',
                    borderColor: 'var(--me-border)',
                    color: 'var(--me-text)'
                  }}
                >
                  <Wrench className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Pause Game"
                  onClick={pauseGame}
                  className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border"
                  style={{
                    backgroundColor: 'var(--me-surface-variant)',
                    borderColor: 'var(--me-border)',
                    color: 'var(--me-text)'
                  }}
                >
                  <Pause className="h-4 w-4" />
                </button>
              </div>
            </div>

            {showProfiler && (
              <div
                className="tabular-nums rounded-xl border px-3 py-1.5 font-mono-code text-[11px] text-slate-200 shadow"
                style={{ backgroundColor: 'rgba(11, 18, 33, 0.94)', borderColor: 'var(--me-primary)' }}
              >
                Avg {profilerStats.avgMs}ms · p95 {profilerStats.p95Ms}ms · Worst {profilerStats.worstMs}ms ·
                Long(&gt;=50ms) {profilerStats.longFrames50Ms} · DC {hud.drawCalls}/35 · Heap {hud.heapMb.toFixed(1)} MB
              </div>
            )}

            {hud.bossMaxHp > 0 && (
              <div
                className="rounded-xl border px-3 py-1.5 shadow"
                style={{ backgroundColor: 'rgba(30, 11, 43, 0.95)', borderColor: '#f43f5e' }}
              >
                <div className="tabular-nums mb-1 text-[11px] font-bold text-yellow-300">
                  BOSS KALA · PHASE {hud.bossPhase} ({hud.bossHp}/{hud.bossMaxHp})
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, (hud.bossHp / hud.bossMaxHp) * 100))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual Novel Overlay */}
      {state.shellState === 'PLAYING' && vn && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <div
            className="w-full max-w-md space-y-2.5 rounded-2xl border p-4 shadow-2xl"
            style={{
              backgroundColor: 'var(--me-surface)',
              borderColor: 'var(--me-border)'
            }}
          >
            <div className="text-xs font-bold" style={{ color: 'var(--me-primary)' }}>
              {vn.speaker} ({vn.step}/{vn.totalSteps})
            </div>
            <p className="text-sm">{vn.text}</p>
            <div className="space-y-2">
              {vn.choices.map((label, idx) => (
                <ActionButton key={idx} fullWidth onClick={() => chooseVnOption(idx)}>
                  {label}
                </ActionButton>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Photo Mode Preview Overlay */}
      {photoPreviewUrl && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(5, 8, 16, 0.88)' }}
        >
          <div
            className="w-full max-w-lg space-y-3 rounded-2xl border p-4 shadow-2xl"
            style={{ backgroundColor: 'var(--me-surface)', borderColor: 'var(--me-border)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Photo Mode Capture (Lv.{state.activeLevel})</h2>
              <button
                type="button"
                aria-label="Close Photo Mode"
                onClick={() => {
                  setPhotoPreviewUrl(null);
                  resumeGame();
                }}
                className="inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-lg border"
                style={{ borderColor: 'var(--me-border)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={photoPreviewUrl}
              alt="Captured Game Frame"
              className="w-full rounded-xl border object-contain"
              style={{ borderColor: 'var(--me-border)' }}
            />
            <div className="grid grid-cols-2 gap-2">
              <ActionButton onClick={downloadCapturedPhoto}>Download PNG</ActionButton>
              <ActionButton
                variant="outline"
                onClick={() => {
                  setPhotoPreviewUrl(null);
                  resumeGame();
                }}
              >
                Resume Play
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Customizable Touch Controls */}
      {state.shellState === 'PLAYING' && (
        <>
          <div
            className="absolute bottom-0 z-10"
            style={{
              [joyLeft ? 'left' : 'right']: `${cfg.joystickOffsetX}px`,
              bottom: `${cfg.joystickOffsetY}px`
            }}
          >
            <VirtualJoystick
              diameterPx={cfg.joystickDiameter}
              deadzone={cfg.deadzone}
              opacity={cfg.opacity}
              onMove={(dx, dy) => {
                touchMoveRef.current.x = dx;
                touchMoveRef.current.y = dy;
              }}
            />
          </div>

          <div
            className="absolute bottom-0 z-10 flex flex-col items-end gap-2"
            style={{
              [joyLeft ? 'right' : 'left']: '16px',
              bottom: `${cfg.joystickOffsetY}px`,
              opacity: cfg.opacity
            }}
          >
            <div className="flex items-center gap-2">
              <ActionTouchButton
                label={`POT(${hud.potions})`}
                color="#10b981"
                sizePx={cfg.buttonSize}
                showLabel={cfg.showLabels}
                onTrigger={() => {
                  vibe(12);
                  triggerPotion();
                }}
              />
              <ActionTouchButton
                label="BURST"
                color="#a855f7"
                sizePx={cfg.buttonSize}
                showLabel={cfg.showLabels}
                onTrigger={() => {
                  vibe(24);
                  queuedRef.current.burstPressed = true;
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <ActionTouchButton
                label="DASH"
                color="#38bdf8"
                sizePx={cfg.buttonSize}
                showLabel={cfg.showLabels}
                onTrigger={() => {
                  vibe(12);
                  queuedRef.current.dashPressed = true;
                }}
              />
              <ActionTouchButton
                label="ATK"
                color="#f43f5e"
                sizePx={cfg.buttonSize}
                showLabel={cfg.showLabels}
                onTrigger={() => {
                  vibe(12);
                  queuedRef.current.attackPressed = true;
                }}
              />
              <ActionTouchButton
                label="JUMP"
                color="#fbbf24"
                sizePx={cfg.buttonSize}
                showLabel={cfg.showLabels}
                onTrigger={() => {
                  vibe(12);
                  queuedRef.current.jumpPressed = true;
                  queuedRef.current.jumpHoldFrames = 8;
                }}
              />
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-1.5 left-1/2 hidden -translate-x-1/2 rounded-lg bg-slate-950/90 px-3 py-0.5 text-[10px] text-slate-300 md:block">
            Keys: WASD/Arrows Move · Space/W Jump · J/Z Atk · K/X Dash · L/C Burst · H Potion · Esc Pause
          </div>
        </>
      )}

      {/* Title / Pause / Victory / GameOver Modals */}
      {state.shellState === 'TITLE' && (
        <OverlayModal title={state.gameName} subtitle={`Select Mode & Start Chapter ${state.activeLevel}`}>
          <ActionButton
            data-start="true"
            fullWidth
            onClick={(e) => {
              e.currentTarget.blur();
              startOrRestartLevel(state.activeLevel, null, 'off');
            }}
          >
            Play Solo (Enter / Space)
          </ActionButton>
          <ActionButton
            variant="tonal"
            fullWidth
            onClick={() => startOrRestartLevel(state.activeLevel, null, 'coop')}
          >
            Play With Luma AI Co-Op
          </ActionButton>
          <ActionButton
            variant="outline"
            fullWidth
            onClick={() => startOrRestartLevel(state.activeLevel, null, 'autopilot')}
          >
            Watch AI Autopilot Play
          </ActionButton>
          {state.latestSave?.exists && (
            <ActionButton variant="outline" fullWidth onClick={() => loadProgress(state.latestSave!.id, true)}>
              {tr.continueSaved} (Lv.{state.latestSave.level})
            </ActionButton>
          )}
          <ActionButton variant="ghost" fullWidth onClick={backToLanding}>
            Back to Home
          </ActionButton>
        </OverlayModal>
      )}

      {state.shellState === 'PAUSED' && !photoPreviewUrl && (
        <OverlayModal title={tr.pausedTitle} subtitle={`Lv.${state.activeLevel} · Score ${state.hud.score}`}>
          <ActionButton fullWidth onClick={resumeGame}>
            <Play className="h-4 w-4 fill-current" />
            <span>{tr.resumeGame}</span>
          </ActionButton>
          <ActionButton variant="outline" fullWidth onClick={() => startOrRestartLevel(state.activeLevel)}>
            <RefreshCw className="h-4 w-4" />
            <span>{tr.restartLevel}</span>
          </ActionButton>
          <div className="grid w-full grid-cols-3 gap-1.5">
            {['1', '2', '3'].map((slot) => (
              <ActionButton
                key={slot}
                variant="outline"
                onClick={() => {
                  const [, bytes] = saveProgress(slot);
                  showBanner(`Saved Slot ${slot} (${bytes} bytes)`);
                }}
              >
                Save {slot}
              </ActionButton>
            ))}
          </div>
          <div className="grid w-full grid-cols-3 gap-1.5">
            {['1', '2', '3'].map((slot) => (
              <ActionButton key={slot} variant="tonal" onClick={() => loadProgress(slot, true)}>
                Load {slot}
              </ActionButton>
            ))}
          </div>
          <div className="grid w-full grid-cols-2 gap-2">
            <ActionButton variant="outline" onClick={() => openStudioTab('play')}>
              {tr.openStudio}
            </ActionButton>
            <ActionButton variant="ghost" onClick={backToLanding}>
              Home
            </ActionButton>
          </div>
        </OverlayModal>
      )}

      {(state.shellState === 'VICTORY' || state.shellState === 'GAMEOVER') && (
        <OverlayModal
          title={state.shellState === 'VICTORY' ? tr.victoryTitle : tr.gameoverTitle}
          subtitle={`Score ${state.hud.score} · Coins ${state.hud.coins} · Kills ${state.hud.kills}`}
        >
          <ActionButton
            data-start="true"
            fullWidth
            onClick={() => startOrRestartLevel(state.shellState === 'VICTORY' ? 1 : state.activeLevel)}
          >
            {state.shellState === 'VICTORY' ? 'Play Again (Ch. 1)' : tr.restartLevel}
          </ActionButton>
          <ActionButton variant="outline" fullWidth onClick={() => openStudioTab('play')}>
            {tr.openStudio}
          </ActionButton>
          <ActionButton variant="ghost" fullWidth onClick={backToLanding}>
            Back to Home
          </ActionButton>
        </OverlayModal>
      )}
    </div>
  );
};

const OverlayModal: React.FC<{
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <div
    className="fixed inset-0 z-30 flex items-center justify-center p-4"
    style={{ backgroundColor: 'rgba(5, 8, 16, 0.78)' }}
  >
    <div
      className="w-full max-w-md space-y-2.5 rounded-2xl border p-5 text-center shadow-2xl"
      style={{ backgroundColor: 'var(--me-surface)', borderColor: 'var(--me-border)' }}
    >
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <p className="tabular-nums text-xs" style={{ color: 'var(--me-text-muted)' }}>
        {subtitle}
      </p>
      <div className="space-y-2 pt-1">{children}</div>
    </div>
  </div>
);
