import React, { useEffect, useState } from 'react';
import { GameCanvasRenderers } from '../../canvas/gameCanvasRenderers';
import { ArtStyles } from '../../engine/artStyles';
import { Catalogs } from '../../engine/catalogs';
import { StorageRepository } from '../../engine/storageRepository';
import { CHARACTER_ANIM_STATES, CharacterAnimState } from '../../engine/types';
import { useEngineStore } from '../../state/useEngineStore';
import { ActionButton, Card, FilterChip, HiDpiCanvas } from '../ui/Primitives';

const SWATCH_COLORS = ['transparent', '#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#f8fafc'];
const TILE_LABELS = ['0: Erase', '1: Ground', '2: Platform', '3: Hazard'];
const TILE_COLORS = ['#0f172a', '#34d399', '#38bdf8', '#f43f5e'];

export const StudioAssetsTab: React.FC = () => {
  const { state, assetManagerRef, showBanner } = useEngineStore();

  const [showcasePose, setShowcasePose] = useState<CharacterAnimState>('idle');
  const [rig3d, setRig3d] = useState(true);
  const [animSec, setAnimSec] = useState(0);

  const [pixelGrid, setPixelGrid] = useState<number[]>(() => StorageRepository.loadPixelGrid(16));
  const [pixelUndo, setPixelUndo] = useState<number[] | null>(null);
  const [activePaletteIdx, setActivePaletteIdx] = useState(1);
  const [paintingPixel, setPaintingPixel] = useState(false);

  const [tileGrid, setTileGrid] = useState<number[]>(() => StorageRepository.loadTilemap());
  const [activeTileBrush, setActiveTileBrush] = useState(1);
  const [paintingTile, setPaintingTile] = useState(false);

  const [assetVersion, setAssetVersion] = useState(0);

  useEffect(() => {
    let rafId = 0;
    let lastMs = performance.now();
    const tick = (nowMs: number) => {
      const dt = Math.min(0.05, Math.max(0, (nowMs - lastMs) / 1000));
      lastMs = nowMs;
      setAnimSec((t) => t + dt);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const style = ArtStyles.getStyleSpec(state.styleId, state.customPalettes);
  const assetStats = assetManagerRef.current.getStats();
  const managedAssets = assetManagerRef.current.listAssets();
  void assetVersion;

  const paintPixelAt = (clientX: number, clientY: number, rect: DOMRect, saveUndo: boolean) => {
    const cellW = rect.width / 16;
    const cellH = rect.height / 16;
    const cx = Math.max(0, Math.min(15, Math.floor((clientX - rect.left) / cellW)));
    const cy = Math.max(0, Math.min(15, Math.floor((clientY - rect.top) / cellH)));
    const idx = cy * 16 + cx;
    setPixelGrid((prev) => {
      if (saveUndo) setPixelUndo(prev);
      if (prev[idx] === activePaletteIdx) return prev;
      const next = [...prev];
      next[idx] = activePaletteIdx;
      return next;
    });
  };

  const paintTileAt = (clientX: number, clientY: number, rect: DOMRect) => {
    const cw = rect.width / 12;
    const ch = rect.height / 8;
    const cx = Math.max(0, Math.min(11, Math.floor((clientX - rect.left) / cw)));
    const cy = Math.max(0, Math.min(7, Math.floor((clientY - rect.top) / ch)));
    const idx = cy * 12 + cx;
    setTileGrid((prev) => {
      if (prev[idx] === activeTileBrush) return prev;
      const next = [...prev];
      next[idx] = activeTileBrush;
      return next;
    });
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Pose Showcase */}
      <Card className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Bowo Character Pose Showcase</h2>
          <FilterChip selected={rig3d} onClick={() => setRig3d((r) => !r)}>
            {rig3d ? '3D-Stack' : '2D Flat'}
          </FilterChip>
        </div>

        <HiDpiCanvas
          dprCap={state.deviceProfile.dprCap}
          className="h-36 w-full rounded-xl bg-[#091122]"
          onDraw={(ctx, w, h) => {
            ctx.fillStyle = '#091122';
            ctx.fillRect(0, 0, w, h);
            GameCanvasRenderers.drawBowoCharacter(
              ctx,
              w * 0.5,
              h * 0.55,
              44,
              style,
              showcasePose,
              1,
              animSec,
              rig3d,
              animSec * 0.9,
              -0.15,
              state.styleOverrides,
              state.customCharacter
            );
          }}
        />

        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {CHARACTER_ANIM_STATES.map((pose) => (
            <FilterChip
              key={pose}
              selected={showcasePose === pose}
              onClick={() => setShowcasePose(pose)}
              className="shrink-0"
            >
              {pose.toUpperCase()}
            </FilterChip>
          ))}
        </div>
      </Card>

      {/* LRU AssetManager */}
      <Card className="space-y-2.5">
        <h2 className="font-display text-base font-bold">Mobile LRU AssetManager (2 MB Budget)</h2>
        <p className="tabular-nums text-xs font-medium" style={{ color: 'var(--me-primary)' }}>
          Used {Math.floor(assetStats.usedBytes / 1024)} KB / {Math.floor(assetStats.budgetBytes / 1024)} KB · Loaded{' '}
          {assetStats.loadedCount} · Evictions {assetStats.evictions}
        </p>

        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3].map((lvl) => (
            <ActionButton
              key={lvl}
              variant="outline"
              onClick={() => {
                assetManagerRef.current.loadLevelBundle(lvl);
                setAssetVersion((v) => v + 1);
                showBanner(`Loaded Level ${lvl} asset bundle`);
              }}
            >
              Load Lv.{lvl}
            </ActionButton>
          ))}
          <ActionButton
            variant="tonal"
            onClick={() => {
              const unloaded = assetManagerRef.current.unloadUnused();
              setAssetVersion((v) => v + 1);
              showBanner(`Unloaded ${unloaded.length} biome packs`);
            }}
          >
            Prune
          </ActionButton>
        </div>

        <div className="space-y-1.5">
          {managedAssets.map((asset) => (
            <div key={asset.id} className="flex items-center justify-between gap-2 py-0.5">
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold">{asset.name}</div>
                <div
                  className="text-[11px]"
                  style={{ color: asset.loaded ? 'var(--me-secondary)' : 'var(--me-text-muted)' }}
                >
                  {asset.biome} · {Math.floor(asset.bytes / 1024)} KB · {asset.loaded ? 'LOADED' : 'UNLOADED'}
                </div>
              </div>
              <ActionButton
                variant="ghost"
                onClick={() => {
                  assetManagerRef.current.setPinned(asset.id, !asset.pinned);
                  setAssetVersion((v) => v + 1);
                }}
              >
                {asset.pinned ? 'Pinned' : 'Pin'}
              </ActionButton>
            </div>
          ))}
        </div>
      </Card>

      {/* 16x16 Pixel Sprite Editor */}
      <Card className="space-y-2.5">
        <h2 className="font-display text-base font-bold">16x16 Pixel Sprite Editor (Aseprite Style)</h2>
        <div className="flex items-center gap-2">
          {SWATCH_COLORS.map((col, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActivePaletteIdx(idx)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 text-xs font-bold text-white"
              style={{
                backgroundColor: idx === 0 ? '#1e293b' : col,
                borderColor: activePaletteIdx === idx ? '#ffffff' : 'rgba(255,255,255,0.25)'
              }}
            >
              {idx === 0 ? 'X' : ''}
            </button>
          ))}
        </div>

        <HiDpiCanvas
          dprCap={state.deviceProfile.dprCap}
          className="aspect-square w-full max-w-sm touch-none rounded-xl bg-[#070c18]"
          onPointerDown={(e, rect) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setPaintingPixel(true);
            paintPixelAt(e.clientX, e.clientY, rect, true);
          }}
          onPointerMove={(e, rect) => {
            if (paintingPixel) paintPixelAt(e.clientX, e.clientY, rect, false);
          }}
          onPointerUp={() => setPaintingPixel(false)}
          onDraw={(ctx, w, h) => {
            ctx.fillStyle = '#070c18';
            ctx.fillRect(0, 0, w, h);
            const cw = w / 16;
            const ch = h / 16;
            for (let r = 0; r < 16; r++) {
              for (let c = 0; c < 16; c++) {
                const v = pixelGrid[r * 16 + c];
                if (v > 0 && v < SWATCH_COLORS.length) {
                  ctx.fillStyle = SWATCH_COLORS[v];
                  ctx.fillRect(c * cw, r * ch, cw, ch);
                }
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.lineWidth = 1;
                ctx.strokeRect(c * cw, r * ch, cw, ch);
              }
            }
          }}
        />

        <div className="grid grid-cols-3 gap-2">
          <ActionButton
            variant="outline"
            disabled={!pixelUndo}
            onClick={() => {
              if (pixelUndo) {
                setPixelGrid(pixelUndo);
                setPixelUndo(null);
              }
            }}
          >
            Undo
          </ActionButton>
          <ActionButton
            variant="outline"
            onClick={() => {
              setPixelUndo(pixelGrid);
              setPixelGrid(new Array(256).fill(0));
            }}
          >
            Clear
          </ActionButton>
          <ActionButton
            onClick={() => {
              StorageRepository.savePixelGrid(pixelGrid);
              showBanner('Saved 16x16 pixel sprite locally!');
            }}
          >
            Save
          </ActionButton>
        </div>
      </Card>

      {/* 12x8 Tilemap Editor */}
      <Card className="space-y-2.5">
        <h2 className="font-display text-base font-bold">12x8 Tilemap Editor (Tiled Schema)</h2>
        <div className="grid grid-cols-4 gap-1.5">
          {TILE_LABELS.map((lbl, idx) => (
            <FilterChip key={lbl} selected={activeTileBrush === idx} onClick={() => setActiveTileBrush(idx)}>
              {lbl}
            </FilterChip>
          ))}
        </div>

        <HiDpiCanvas
          dprCap={state.deviceProfile.dprCap}
          className="aspect-[12/8] w-full touch-none rounded-xl bg-[#060b16]"
          onPointerDown={(e, rect) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setPaintingTile(true);
            paintTileAt(e.clientX, e.clientY, rect);
          }}
          onPointerMove={(e, rect) => {
            if (paintingTile) paintTileAt(e.clientX, e.clientY, rect);
          }}
          onPointerUp={() => setPaintingTile(false)}
          onDraw={(ctx, w, h) => {
            ctx.fillStyle = '#060b16';
            ctx.fillRect(0, 0, w, h);
            const cw = w / 12;
            const ch = h / 8;
            for (let r = 0; r < 8; r++) {
              for (let c = 0; c < 12; c++) {
                const v = Math.min(3, Math.max(0, tileGrid[r * 12 + c]));
                ctx.fillStyle = TILE_COLORS[v];
                ctx.fillRect(c * cw, r * ch, cw, ch);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
                ctx.lineWidth = 1;
                ctx.strokeRect(c * cw, r * ch, cw, ch);
              }
            }
          }}
        />

        <ActionButton
          fullWidth
          onClick={() => {
            StorageRepository.saveTilemap(tileGrid);
            showBanner('Saved 12x8 tilemap!');
          }}
        >
          Save Tilemap
        </ActionButton>
      </Card>

      {/* Asset Catalog */}
      <div className="space-y-2">
        <h3 className="font-display text-base font-bold">Built-In Procedural Asset Catalog (10 Packs)</h3>
        {Catalogs.ASSET_CATALOG.map((item) => (
          <Card key={item.id} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">{item.name}</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--me-primary)' }}>
                {item.category} · {item.memoryKb} KB
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--me-text-muted)' }}>
              {item.desc}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};
