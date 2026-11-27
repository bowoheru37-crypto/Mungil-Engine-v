import React, { useEffect, useRef, useState } from 'react';
import { GameCanvasRenderers } from '../../canvas/gameCanvasRenderers';
import { ArtStyles } from '../../engine/artStyles';
import { ArenaWorld } from '../../engine/sceneHierarchy';
import {
  ARENA_COACH_DIRECTIVES,
  ARENA_COMPANION_ORDERS,
  ARENA_DIFFICULTIES,
  ARENA_MODES,
  ArenaCoachDirective,
  ArenaCompanionOrder,
  ArenaDifficulty,
  ArenaMode,
  CharacterAnimState
} from '../../engine/types';
import { useEngineStore } from '../../state/useEngineStore';
import { ActionButton, Card, FilterChip } from '../ui/Primitives';

export const StudioArenaAiTab: React.FC = () => {
  const { state } = useEngineStore();

  const [mode, setMode] = useState<ArenaMode>(() => state.forcedArenaMode ?? 'coplay');
  const [coachDirective, setCoachDirective] = useState<ArenaCoachDirective>('Seimbang');
  const [companionOrder, setCompanionOrder] = useState<ArenaCompanionOrder>('Serang');
  const [difficulty, setDifficulty] = useState<ArenaDifficulty>('Normal');
  const [speedMul, setSpeedMul] = useState<1 | 2>(1);
  const [showPath, setShowPath] = useState(true);
  const [, setTick] = useState(0);

  const moveRef = useRef({ x: 0, y: 0 });
  const arenaWorldRef = useRef<ArenaWorld>(ArenaWorld.create(mode, state.activeArenaSpec));
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeSecRef = useRef(0);

  // Sync forcedArenaMode or activeArenaSpec changes
  useEffect(() => {
    const nextMode = state.forcedArenaMode ?? mode;
    setMode(nextMode);
    arenaWorldRef.current = ArenaWorld.create(nextMode, state.activeArenaSpec);
  }, [state.forcedArenaMode, state.activeArenaSpec]);

  const paramsRef = useRef({ coachDirective, companionOrder, difficulty, speedMul, showPath, mode, state });
  paramsRef.current = { coachDirective, companionOrder, difficulty, speedMul, showPath, mode, state };

  useEffect(() => {
    let rafId = 0;
    let lastMs = performance.now();
    let uiAccum = 0;

    const tickLoop = (nowMs: number) => {
      const dt = Math.min(0.05, Math.max(0, (nowMs - lastMs) / 1000));
      lastMs = nowMs;
      timeSecRef.current += dt;
      const p = paramsRef.current;
      const w = arenaWorldRef.current;
      w.difficulty = p.difficulty;
      w.autoDifficulty = true;
      w.step(dt, moveRef.current.x, moveRef.current.y, p.coachDirective, p.companionOrder, p.speedMul);

      // Draw canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        if (rect.width >= 1 && rect.height >= 1) {
          const dpr = Math.min(window.devicePixelRatio || 1, p.state.deviceProfile.dprCap);
          const tw = Math.round(rect.width * dpr);
          const th = Math.round(rect.height * dpr);
          if (canvas.width !== tw || canvas.height !== th) {
            canvas.width = tw;
            canvas.height = th;
          }
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const style = ArtStyles.getStyleSpec(p.state.styleId, p.state.customPalettes);
            ctx.save();
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const cw = rect.width;
            const ch = rect.height;
            const sx = cw / 360;
            const sy = ch / 240;

            ctx.fillStyle = '#070e1c';
            ctx.fillRect(0, 0, cw, ch);

            ctx.strokeStyle = '#17253d';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let gx = 1; gx <= 8; gx++) {
              ctx.moveTo(gx * 40 * sx, 0);
              ctx.lineTo(gx * 40 * sx, ch);
            }
            for (let gy = 1; gy <= 5; gy++) {
              ctx.moveTo(0, gy * 40 * sy);
              ctx.lineTo(cw, gy * 40 * sy);
            }
            ctx.stroke();

            if (p.showPath && w.aiPath.length >= 2) {
              ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(w.aiPath[0][0] * sx, w.aiPath[0][1] * sy);
              ctx.lineTo(w.aiPath[1][0] * sx, w.aiPath[1][1] * sy);
              ctx.stroke();
            }

            for (const item of w.items) {
              if (item.collected) continue;
              ctx.fillStyle = item.kind === 'potion' ? '#f43f5e' : '#fbbf24';
              ctx.beginPath();
              ctx.arc(item.x * sx, item.y * sy, 7 * sx, 0, Math.PI * 2);
              ctx.fill();
            }

            for (const e of w.enemies) {
              if (e.dead) continue;
              GameCanvasRenderers.drawEnemyEntity(
                ctx,
                e.isBoss ? 'boss_kala' : 'slime',
                e.x * sx,
                e.y * sy,
                (e.isBoss ? 22 : 14) * sx,
                style,
                timeSecRef.current,
                e.hurtFlash,
                e.telegraph,
                0,
                e.phase
              );
            }

            if (p.mode === 'coplay') {
              ctx.fillStyle = 'rgba(52, 211, 153, 0.3)';
              ctx.beginPath();
              ctx.arc(w.companion.x * sx, w.companion.y * sy, 16 * sx, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#6ee7b7';
              ctx.beginPath();
              ctx.arc(w.companion.x * sx, w.companion.y * sy, 8 * sx, 0, Math.PI * 2);
              ctx.fill();
            }

            const pose: CharacterAnimState =
              w.player.fsm === 'attack' ? 'attack' : w.player.fsm === 'walk' ? 'walk' : 'idle';
            GameCanvasRenderers.drawBowoCharacter(
              ctx,
              w.player.x * sx,
              w.player.y * sy,
              20 * sx,
              style,
              pose,
              1,
              timeSecRef.current,
              true,
              0.25,
              -0.15,
              ArtStyles.DEFAULT_STYLE_OVERRIDES,
              p.state.customCharacter
            );

            if (w.hitFlashTimer > 0) {
              ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
              ctx.lineWidth = 8;
              ctx.strokeRect(0, 0, cw, ch);
            }

            ctx.restore();
          }
        }
      }

      uiAccum += dt;
      if (uiAccum >= 0.1) {
        uiAccum = 0;
        setTick((t) => (t + 1) % 100000);
      }

      rafId = requestAnimationFrame(tickLoop);
    };

    rafId = requestAnimationFrame(tickLoop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const world = arenaWorldRef.current;

  return (
    <div className="space-y-4 pb-8">
      <Card className="space-y-3">
        <h2 className="font-display text-base font-bold">
          {state.activeArenaSpec
            ? `Arena AI: ${state.activeArenaSpec.name} (${state.activeArenaSpec.genre})`
            : 'Qolbu Arena AI Sandbox (15Hz)'}
        </h2>

        <div className="grid grid-cols-3 gap-1.5">
          {ARENA_MODES.map((m) => (
            <FilterChip
              key={m.id}
              selected={mode === m.id}
              onClick={() => {
                setMode(m.id);
                arenaWorldRef.current = ArenaWorld.create(m.id, state.activeArenaSpec);
                setTick((t) => t + 1);
              }}
            >
              {m.id.toUpperCase()}
            </FilterChip>
          ))}
        </div>

        <canvas ref={canvasRef} className="h-56 w-full rounded-xl bg-[#070e1c]" />

        <div className="flex items-center justify-between text-xs font-bold">
          <span style={{ color: 'var(--me-primary)' }}>
            HP Bowo: {world.player.hp}/{world.player.maxHp} · Score: {world.score}
          </span>
          <span
            style={{
              color: world.status === 'victory' ? '#34d399' : world.status === 'gameover' ? '#f43f5e' : 'var(--me-text)'
            }}
          >
            {world.status.toUpperCase()}
          </span>
        </div>

        <p className="text-xs">Otak AI: {world.aiThinkText}</p>
        <p className="text-xs" style={{ color: 'var(--me-text-muted)' }}>
          Adaptive Rule: {world.adaptiveRule} · Log: {world.logText}
        </p>
      </Card>

      <Card className="space-y-3">
        <h3 className="font-display text-sm font-bold">Arena Touch Controls & AI Directives</h3>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1">
            {[
              { lbl: 'L', mx: -1, my: 0 },
              { lbl: 'U', mx: 0, my: -1 },
              { lbl: 'D', mx: 0, my: 1 },
              { lbl: 'R', mx: 1, my: 0 },
              { lbl: '•', mx: 0, my: 0 }
            ].map((b) => (
              <ActionButton
                key={b.lbl}
                variant="outline"
                onClick={() => {
                  moveRef.current = { x: b.mx, y: b.my };
                }}
              >
                {b.lbl}
              </ActionButton>
            ))}
          </div>

          <div className="flex gap-1.5">
            <ActionButton
              onClick={() => {
                world.triggerPlayerAction('attack');
                setTick((t) => t + 1);
              }}
            >
              ATK
            </ActionButton>
            <ActionButton
              variant="tonal"
              onClick={() => {
                world.triggerPlayerAction('dash');
                setTick((t) => t + 1);
              }}
            >
              DASH
            </ActionButton>
            <ActionButton
              variant="outline"
              onClick={() => {
                world.triggerPlayerAction('heal');
                setTick((t) => t + 1);
              }}
            >
              HEAL
            </ActionButton>
          </div>
        </div>

        {mode === 'solo' && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold">Coach Directive:</div>
            <div className="grid grid-cols-4 gap-1.5">
              {ARENA_COACH_DIRECTIVES.map((d) => (
                <FilterChip key={d} selected={coachDirective === d} onClick={() => setCoachDirective(d)}>
                  {d}
                </FilterChip>
              ))}
            </div>
          </div>
        )}

        {mode === 'coplay' && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold">
              Qolbu Companion Order (Revives left: {world.companionReviveLeft}):
            </div>
            <div className="grid grid-cols-5 gap-1">
              {ARENA_COMPANION_ORDERS.map((ord) => (
                <FilterChip key={ord} selected={companionOrder === ord} onClick={() => setCompanionOrder(ord)}>
                  {ord}
                </FilterChip>
              ))}
            </div>
          </div>
        )}

        {mode === 'vs' && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold">Difficulty & Adaptive Boss Kala:</div>
            <div className="grid grid-cols-3 gap-1.5">
              {ARENA_DIFFICULTIES.map((df) => (
                <FilterChip key={df} selected={difficulty === df} onClick={() => setDifficulty(df)}>
                  {df}
                </FilterChip>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <FilterChip selected={speedMul === 2} onClick={() => setSpeedMul((s) => (s === 1 ? 2 : 1))}>
            Speed {speedMul}x
          </FilterChip>
          <FilterChip selected={showPath} onClick={() => setShowPath((p) => !p)}>
            AI Path
          </FilterChip>
          <ActionButton
            onClick={() => {
              arenaWorldRef.current = ArenaWorld.create(mode, state.activeArenaSpec);
              setTick((t) => t + 1);
            }}
          >
            Reset Match
          </ActionButton>
        </div>

        <p className="text-xs" style={{ color: 'var(--me-text-muted)' }}>
          Last 10 Player Moves:{' '}
          {world.lastPlayerMoves.length === 0 ? 'None yet' : world.lastPlayerMoves.join(' → ')}
        </p>
      </Card>
    </div>
  );
};
