import React, { useEffect, useRef, useState } from 'react';
import { GameCanvasRenderers } from '../../canvas/gameCanvasRenderers';
import { ART_STYLE_SPECS, ArtStyles } from '../../engine/artStyles';
import { useEngineStore } from '../../state/useEngineStore';
import { ActionButton, Card, FilterChip, SliderField, TextField } from '../ui/Primitives';

export const StudioArtTab: React.FC = () => {
  const { state, updateSettings } = useEngineStore();
  const activeSpec = ArtStyles.getStyleSpec(state.styleId, state.customPalettes);

  const [editingPaletteIdx, setEditingPaletteIdx] = useState(1);
  const [hexInput, setHexInput] = useState(() => activeSpec.palette[1] ?? '#38bdf8');
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderConfigRef = useRef({
    activeSpec,
    activeLevel: state.activeLevel,
    ov: state.styleOverrides,
    dprCap: state.deviceProfile.dprCap
  });
  renderConfigRef.current = {
    activeSpec,
    activeLevel: state.activeLevel,
    ov: state.styleOverrides,
    dprCap: state.deviceProfile.dprCap
  };

  useEffect(() => {
    setHexInput(activeSpec.palette[editingPaletteIdx] ?? '#38bdf8');
  }, [activeSpec, editingPaletteIdx]);

  useEffect(() => {
    let rafId = 0;
    let lastMs = performance.now();
    let animSec = 0;
    const tick = (nowMs: number) => {
      const dt = Math.min(0.05, Math.max(0, (nowMs - lastMs) / 1000));
      lastMs = nowMs;
      animSec += dt;
      const canvas = previewCanvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        if (rect.width >= 2 && rect.height >= 2) {
          const cfg = renderConfigRef.current;
          const dpr = Math.min(window.devicePixelRatio || 1, cfg.dprCap);
          const targetW = Math.round(rect.width * dpr);
          const targetH = Math.round(rect.height * dpr);
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.save();
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const w = rect.width;
            const h = rect.height;
            ctx.fillStyle = ArtStyles.applyStyleTint(cfg.activeSpec.palette[0], cfg.ov);
            ctx.fillRect(0, 0, w, h);
            GameCanvasRenderers.drawMode7Horizon(ctx, w, h * 0.45, h * 0.85, animSec * 36, cfg.activeSpec, cfg.activeLevel, cfg.ov);
            GameCanvasRenderers.drawGroundTile(ctx, 0, h * 0.85, w, h * 0.15, cfg.activeSpec, cfg.activeLevel, cfg.ov);
            GameCanvasRenderers.drawBowoCharacter(
              ctx,
              w * 0.35,
              h * 0.65,
              34,
              cfg.activeSpec,
              'walk',
              1,
              animSec,
              true,
              0.25,
              -0.15,
              cfg.ov
            );
            GameCanvasRenderers.drawEnemyEntity(
              ctx,
              'boss_kala',
              w * 0.72,
              h * 0.62,
              22,
              cfg.activeSpec,
              animSec,
              0,
              0.5,
              0,
              1,
              cfg.ov
            );
            ctx.restore();
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const ov = state.styleOverrides;

  return (
    <div className="space-y-4 pb-8">
      <Card className="space-y-2.5">
        <h2 className="font-display text-base font-bold">Live Style Preview: {activeSpec.name}</h2>
        <canvas ref={previewCanvasRef} className="h-36 w-full rounded-xl" />
        <p className="text-xs font-medium" style={{ color: 'var(--me-primary)' }}>
          {activeSpec.shaderHint}
        </p>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-display text-base font-bold">10-Color Palette & Shader Overrides</h2>
        <div className="grid grid-cols-10 gap-1.5">
          {activeSpec.palette.slice(0, 10).map((hex, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Palette slot ${idx}`}
              onClick={() => setEditingPaletteIdx(idx)}
              className="h-8 w-full cursor-pointer rounded-md border"
              style={{
                backgroundColor: hex,
                borderColor: editingPaletteIdx === idx ? '#ffffff' : 'rgba(255,255,255,0.25)',
                borderWidth: editingPaletteIdx === idx ? '2.5px' : '1px'
              }}
            />
          ))}
        </div>

        <div className="flex items-end gap-2">
          <TextField
            label={`Slot #${editingPaletteIdx} Hex`}
            value={hexInput}
            onChange={setHexInput}
            mono
            className="flex-1"
          />
          <ActionButton
            onClick={() => {
              const nextList = [...activeSpec.palette];
              nextList[editingPaletteIdx] = hexInput.trim();
              updateSettings((s) => ({
                ...s,
                customPalettes: { ...s.customPalettes, [s.styleId]: nextList }
              }));
            }}
          >
            Apply
          </ActionButton>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <FilterChip
            selected={ov.outline}
            onClick={() => updateSettings((s) => ({ ...s, styleOverrides: { ...ov, outline: !ov.outline } }))}
          >
            Outline
          </FilterChip>
          <FilterChip
            selected={ov.shadow}
            onClick={() => updateSettings((s) => ({ ...s, styleOverrides: { ...ov, shadow: !ov.shadow } }))}
          >
            Shadow
          </FilterChip>
          <FilterChip
            selected={ov.glow}
            onClick={() => updateSettings((s) => ({ ...s, styleOverrides: { ...ov, glow: !ov.glow } }))}
          >
            Glow
          </FilterChip>
          <FilterChip
            selected={ov.scanline}
            onClick={() => updateSettings((s) => ({ ...s, styleOverrides: { ...ov, scanline: !ov.scanline } }))}
          >
            CRT
          </FilterChip>
        </div>

        <p className="tabular-nums text-xs" style={{ color: 'var(--me-text-muted)' }}>
          Stroke: {ov.strokeWidth.toFixed(1)}px · Brightness: {Math.round(ov.brightness * 100)}% · Contrast:{' '}
          {Math.round(ov.contrast * 100)}%
        </p>
        <SliderField
          label="Stroke Width"
          value={ov.strokeWidth}
          min={1}
          max={4}
          step={0.1}
          onChange={(v) => updateSettings((s) => ({ ...s, styleOverrides: { ...ov, strokeWidth: v } }))}
        />
        <SliderField
          label="Brightness"
          value={ov.brightness}
          min={0.6}
          max={1.5}
          step={0.05}
          onChange={(v) => updateSettings((s) => ({ ...s, styleOverrides: { ...ov, brightness: v } }))}
        />
        <SliderField
          label="Contrast"
          value={ov.contrast}
          min={0.6}
          max={1.5}
          step={0.05}
          onChange={(v) => updateSettings((s) => ({ ...s, styleOverrides: { ...ov, contrast: v } }))}
        />
      </Card>

      <div className="space-y-2">
        <h3 className="font-display text-base font-bold">12 Procedural Art Styles</h3>
        {ART_STYLE_SPECS.map((spec) => {
          const selected = state.styleId === spec.id;
          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => updateSettings((s) => ({ ...s, styleId: spec.id }))}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors"
              style={{
                backgroundColor: selected
                  ? 'color-mix(in srgb, var(--me-primary) 18%, var(--me-surface))'
                  : 'var(--me-surface)',
                borderColor: selected ? 'var(--me-primary)' : 'var(--me-border)'
              }}
            >
              <div className="min-w-0">
                <div className="text-sm font-bold">{spec.name}</div>
                <div className="text-xs" style={{ color: 'var(--me-text-muted)' }}>
                  {spec.subtitle}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {spec.palette.slice(0, 4).map((hex, i) => (
                  <span key={i} className="h-4 w-4 rounded-full" style={{ backgroundColor: hex }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
