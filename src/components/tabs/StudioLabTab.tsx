import React, { useMemo, useState } from 'react';
import {
  FixedPointQ16,
  LAYER_54_SYSTEMS_MANIFEST,
  TaskGraphScheduler
} from '../../engine/architecture12Layers';
import { ArtStyles } from '../../engine/artStyles';
import { BytecodeVm, BytecodeVmResult } from '../../engine/bytecodeVm';
import { Catalogs } from '../../engine/catalogs';
import { QolbuCore } from '../../engine/qolbuCore';
import { useEngineStore } from '../../state/useEngineStore';
import { ActionButton, Card, FilterChip, SwitchRow, TextField } from '../ui/Primitives';

export const StudioLabTab: React.FC = () => {
  const { state, updateSettings } = useEngineStore();

  const [compiled, setCompiled] = useState(() => BytecodeVm.compileBytecode(state.customBytecodeSrc));
  const [vmResult, setVmResult] = useState<BytecodeVmResult | null>(() =>
    BytecodeVm.runBytecodeVm(compiled.instructions)
  );
  const [showDisasm, setShowDisasm] = useState(false);

  const [worldSeed, setWorldSeed] = useState('777');
  const [seedWorld, setSeedWorld] = useState(() => BytecodeVm.generateSeedWorld(777));
  const [layerFilter, setLayerFilter] = useState<number | 'all'>('all');
  const [determinismReport, setDeterminismReport] = useState<string | null>(null);

  const [newCond, setNewCond] = useState('shard_collect');
  const [newAct, setNewAct] = useState('score_100');

  const activeStyle = ArtStyles.getStyleSpec(state.styleId, state.customPalettes);
  const checks = useMemo(
    () =>
      ArtStyles.run25ValidatorChecks(
        state.gameName,
        state.touchConfig.buttonSize,
        state.hud.activeEntities,
        state.hud.drawCalls,
        state.hud.heapMb,
        activeStyle,
        state.eventRules.some((r) => r.enabled),
        compiled.errors.length === 0,
        1024,
        state.activeLevel
      ),
    [state, activeStyle, compiled]
  );

  const passedCount = checks.filter((c) => c.passed).length;
  const disasmLines = useMemo(
    () => BytecodeVm.disassembleBytecode(compiled.instructions),
    [compiled.instructions]
  );
  const dagPlan = useMemo(() => TaskGraphScheduler.plan(TaskGraphScheduler.DEFAULT_FRAME_DAG, 4), []);

  const visibleSystems = useMemo(
    () =>
      layerFilter === 'all'
        ? LAYER_54_SYSTEMS_MANIFEST
        : LAYER_54_SYSTEMS_MANIFEST.filter((s) => s.layer === layerFilter),
    [layerFilter]
  );

  return (
    <div className="space-y-4 pb-8">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-bold">16-bit Assembly VM, Compiler &amp; Disassembler</h2>
          <FilterChip selected={showDisasm} onClick={() => setShowDisasm((v) => !v)}>
            {showDisasm ? 'Hide Hex Disasm' : 'Show Hex Disasm'}
          </FilterChip>
        </div>
        <TextField
          label="Bytecode Assembly (NOP SET ADD SUB MUL CMP JMP JZ LOAD STORE SAY SPAWN EMIT END)"
          value={state.customBytecodeSrc}
          onChange={(val) => updateSettings((s) => ({ ...s, customBytecodeSrc: val }))}
          multiline
          rows={5}
          mono
        />
        <ActionButton
          fullWidth
          onClick={() => {
            const nextCompiled = BytecodeVm.compileBytecode(state.customBytecodeSrc);
            setCompiled(nextCompiled);
            setVmResult(
              nextCompiled.errors.length === 0 ? BytecodeVm.runBytecodeVm(nextCompiled.instructions) : null
            );
          }}
        >
          Compile &amp; Run Extended VM
        </ActionButton>

        {compiled.errors.length > 0 ? (
          <pre className="text-xs font-medium text-rose-400">{compiled.errors.join('\n')}</pre>
        ) : vmResult ? (
          <div className="space-y-1.5">
            <p className="font-mono-code text-xs font-semibold" style={{ color: 'var(--me-primary)' }}>
              Halted={String(vmResult.halted)} · Steps={vmResult.steps} · Z={String(vmResult.zeroFlag)} · R0=
              {vmResult.registers[0]} R1={vmResult.registers[1]} R2={vmResult.registers[2]} M[0]={vmResult.memory[0]}
            </p>
            {vmResult.log.length > 0 && (
              <p className="font-mono-code text-xs" style={{ color: 'var(--me-text-muted)' }}>
                {vmResult.log.join(' | ')}
              </p>
            )}
            {showDisasm && (
              <pre
                className="font-mono-code overflow-x-auto rounded-xl p-2.5 text-[11px]"
                style={{ backgroundColor: 'var(--me-bg)', color: 'var(--me-text-muted)' }}
              >
                {disasmLines.join('\n')}
              </pre>
            )}
          </div>
        ) : null}
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold">
              Unified Layers 0–12 Architecture ({LAYER_54_SYSTEMS_MANIFEST.length} Systems Active)
            </h2>
            <p className="tabular-nums text-xs" style={{ color: 'var(--me-text-muted)' }}>
              DAG Pipeline ({dagPlan.workerCap} cores): {dagPlan.order.join(' → ')}
            </p>
          </div>
          <ActionButton
            variant="tonal"
            onClick={() => {
              const inputs = Array.from({ length: 60 }, (_, i) => ({
                mx: i < 20 ? 1 : i < 40 ? -0.5 : 0.8,
                jump: i === 5 || i === 32
              }));
              const runA = FixedPointQ16.stepDeterministicTrajectory(777, inputs);
              const runB = FixedPointQ16.stepDeterministicTrajectory(777, inputs);
              const ok = runA.checksum === runB.checksum && runA.finalX === runB.finalX;
              setDeterminismReport(
                `Q16.16 Replay Verified=${ok} · Pos=(${runA.finalX}, ${runA.finalY}) · CRC=0x${runA.checksum.toString(16)}`
              );
            }}
          >
            Verify Q16.16 Replay
          </ActionButton>
        </div>

        {determinismReport && (
          <p className="font-mono-code text-xs font-semibold text-emerald-400">{determinismReport}</p>
        )}

        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          <FilterChip selected={layerFilter === 'all'} onClick={() => setLayerFilter('all')} className="shrink-0">
            All ({LAYER_54_SYSTEMS_MANIFEST.length})
          </FilterChip>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((l) => (
            <FilterChip
              key={l}
              selected={layerFilter === l}
              onClick={() => setLayerFilter(l)}
              className="shrink-0"
            >
              L{l}
            </FilterChip>
          ))}
        </div>

        <div className="grid max-h-64 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
          {visibleSystems.map((sys) => (
            <div
              key={sys.code}
              className="rounded-xl border p-2.5"
              style={{ backgroundColor: 'var(--me-surface-variant)', borderColor: 'var(--me-border)' }}
            >
              <div className="flex items-center justify-between gap-2 text-xs font-bold">
                <span>
                  {sys.code} {sys.system}
                </span>
                <span className="text-emerald-400">ON</span>
              </div>
              <div className="text-[11px]" style={{ color: 'var(--me-text-muted)' }}>
                {sys.layerName} · {sys.mobileStrategy}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-display text-base font-bold">No-Code WHEN -&gt; THEN Event Sheet</h2>
        <div className="grid grid-cols-3 gap-1.5">
          {['shard_collect', 'enemy_defeated', 'switch_activated'].map((c) => (
            <FilterChip key={c} selected={newCond === c} onClick={() => setNewCond(c)}>
              {c.split('_')[0]}
            </FilterChip>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {['score_100', 'heal_10', 'bonus_coin'].map((a) => (
            <FilterChip key={a} selected={newAct === a} onClick={() => setNewAct(a)}>
              {a}
            </FilterChip>
          ))}
        </div>
        <ActionButton
          fullWidth
          onClick={() => {
            const rule = {
              id: `rule_${Date.now() % 9999}`,
              condition: newCond,
              action: newAct,
              enabled: true
            };
            updateSettings((s) => ({ ...s, eventRules: [...s.eventRules, rule] }));
          }}
        >
          Add Event Rule
        </ActionButton>
        <div className="space-y-1">
          {state.eventRules.map((rule) => (
            <SwitchRow
              key={rule.id}
              label={`WHEN ${rule.condition} -> ${rule.action}`}
              checked={rule.enabled}
              onChange={(enabled) =>
                updateSettings((s) => ({
                  ...s,
                  eventRules: s.eventRules.map((r) => (r.id === rule.id ? { ...r, enabled } : r))
                }))
              }
            />
          ))}
        </div>
      </Card>

      <Card className="space-y-2.5">
        <h2 className="font-display text-base font-bold">Deterministic Seed World (xorshift32)</h2>
        <div className="flex items-end gap-2">
          <TextField label="Seed" value={worldSeed} onChange={setWorldSeed} className="flex-1" />
          <ActionButton
            onClick={() => {
              const parsed = parseInt(worldSeed, 10);
              setSeedWorld(BytecodeVm.generateSeedWorld(Number.isFinite(parsed) ? parsed : 777));
            }}
          >
            Generate
          </ActionButton>
        </div>
        <p className="text-xs">
          Biome: {seedWorld.biome} · Diff {seedWorld.difficulty}/5 · Tiles:{' '}
          {seedWorld.tiles
            .slice(0, 6)
            .map((t) => t.kind)
            .join(', ')}
        </p>
      </Card>

      <Card className="space-y-2">
        <h2 className="font-display text-base font-bold">25 Production Validator Checks ({passedCount}/25 Pass)</h2>
        <div className="space-y-1">
          {checks.map((chk) => (
            <div key={chk.id} className="flex items-center justify-between gap-2 text-xs">
              <span>
                {chk.id}. {chk.label}
              </span>
              <span
                className="font-mono-code font-semibold"
                style={{ color: chk.passed ? '#34d399' : '#f59e0b' }}
              >
                {chk.passed ? `PASS · ${chk.detail}` : 'WARN'}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-1.5">
        <h2 className="font-display text-base font-bold">9 Larangan Mutlak (Hardened Rules)</h2>
        {QolbuCore.HARDENED_RULES_9.map(([id, rule]) => (
          <p key={id} className="text-xs">
            {id}. {rule}
          </p>
        ))}
      </Card>

      <div className="space-y-2">
        <h3 className="font-display text-base font-bold">32 Open-Source Cleanroom Inspiration Credits</h3>
        {Catalogs.REPO_CREDITS.map((rc) => (
          <Card key={rc.name} className="space-y-0.5">
            <div className="text-xs font-bold">
              [Tier {rc.tier}] {rc.name} ({rc.license})
            </div>
            <div className="text-xs" style={{ color: 'var(--me-text-muted)' }}>
              {rc.adoption}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
