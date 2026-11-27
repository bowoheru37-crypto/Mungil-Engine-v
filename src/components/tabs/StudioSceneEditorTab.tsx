import React, { useMemo, useRef, useState } from 'react';
import { PHYSICS_PRESETS, SceneHierarchy } from '../../engine/sceneHierarchy';
import { COLLIDER_SHAPE_KINDS, PHYSICS_PRESET_IDS } from '../../engine/types';
import { useEngineStore } from '../../state/useEngineStore';
import { ActionButton, Card, FilterChip, HiDpiCanvas, SliderField, SwitchRow, TextField } from '../ui/Primitives';

export const StudioSceneEditorTab: React.FC = () => {
  const { state, updateSettings, showBanner } = useEngineStore();
  const entities = state.sceneEntities;
  const [selectedId, setSelectedId] = useState<string>(() => entities[0]?.id ?? '');
  const [multiSelectedIds, setMultiSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('Squad Container');
  const draggingRef = useRef<{ id: string; lastClientX: number; lastClientY: number } | null>(null);

  const selected = entities.find((e) => e.id === selectedId) ?? entities[0] ?? null;
  const overlaps = useMemo(() => SceneHierarchy.detectEntityOverlaps(entities), [entities]);

  return (
    <div className="space-y-4 pb-8">
      <Card className="space-y-2.5">
        <h2 className="font-display text-base font-bold">Collision Shape & Hierarchy Canvas (Drag Entities)</h2>
        <HiDpiCanvas
          dprCap={state.deviceProfile.dprCap}
          className="h-56 w-full cursor-grab touch-none rounded-xl bg-[#070d19] active:cursor-grabbing"
          onPointerDown={(e, rect) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            const sx = 360 / Math.max(1, rect.width);
            const sy = 240 / Math.max(1, rect.height);
            const wx = (e.clientX - rect.left) * sx;
            const wy = (e.clientY - rect.top) * sy;

            let best = entities[0];
            let bestDist = Infinity;
            for (const ent of entities) {
              const d = Math.hypot(ent.x - wx, ent.y - wy);
              if (d < bestDist) {
                bestDist = d;
                best = ent;
              }
            }
            const targetId = best && bestDist < 48 ? best.id : selected?.id ?? '';
            if (targetId) {
              setSelectedId(targetId);
              draggingRef.current = { id: targetId, lastClientX: e.clientX, lastClientY: e.clientY };
            }
          }}
          onPointerMove={(e, rect) => {
            const drag = draggingRef.current;
            if (!drag) return;
            const dxPx = e.clientX - drag.lastClientX;
            const dyPx = e.clientY - drag.lastClientY;
            drag.lastClientX = e.clientX;
            drag.lastClientY = e.clientY;
            const dx = dxPx * (360 / Math.max(1, rect.width));
            const dy = dyPx * (240 / Math.max(1, rect.height));
            updateSettings((s) => {
              const node = s.sceneEntities.find((ent) => ent.id === drag.id);
              if (!node) return s;
              return {
                ...s,
                sceneEntities: SceneHierarchy.updateEntityTransform(s.sceneEntities, drag.id, {
                  newX: node.x + dx,
                  newY: node.y + dy
                })
              };
            });
          }}
          onPointerUp={() => {
            draggingRef.current = null;
          }}
          onDraw={(ctx, w, h) => {
            ctx.fillStyle = '#070d19';
            ctx.fillRect(0, 0, w, h);
            const sx = w / 360;
            const sy = h / 240;

            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let gx = 1; gx < 9; gx++) {
              ctx.moveTo(gx * 40 * sx, 0);
              ctx.lineTo(gx * 40 * sx, h);
            }
            for (let gy = 1; gy < 6; gy++) {
              ctx.moveTo(0, gy * 40 * sy);
              ctx.lineTo(w, gy * 40 * sy);
            }
            ctx.stroke();

            for (const ent of entities) {
              if (!ent.visible) continue;
              const cx = ent.x * sx;
              const cy = ent.y * sy;
              const isSel = ent.id === selected?.id;
              const isOverlapping = overlaps.some((o) => !o.near && (o.aId === ent.id || o.bId === ent.id));
              const strokeCol = isOverlapping
                ? '#f43f5e'
                : isSel
                  ? '#fbbf24'
                  : ent.physics.isTrigger
                    ? '#38bdf8'
                    : '#34d399';
              const fillCol = isOverlapping
                ? 'rgba(244, 63, 94, 0.2)'
                : isSel
                  ? 'rgba(251, 191, 36, 0.2)'
                  : ent.physics.isTrigger
                    ? 'rgba(56, 189, 248, 0.2)'
                    : 'rgba(52, 211, 153, 0.2)';

              ctx.fillStyle = fillCol;
              ctx.strokeStyle = strokeCol;
              ctx.lineWidth = isSel ? 3 : 2;

              if (ent.collider.kind === 'circle') {
                const rad = ent.collider.radius * ent.scaleX * sx;
                ctx.beginPath();
                ctx.arc(cx, cy, rad, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
              } else if (ent.collider.kind === 'polygon') {
                ctx.beginPath();
                ent.collider.polygonPoints.forEach((pt, idx) => {
                  const px = cx + pt[0] * ent.scaleX * sx;
                  const py = cy + pt[1] * ent.scaleY * sy;
                  if (idx === 0) ctx.moveTo(px, py);
                  else ctx.lineTo(px, py);
                });
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
              } else {
                const bw = ent.collider.width * ent.scaleX * sx;
                const bh = ent.collider.height * ent.scaleY * sy;
                ctx.fillRect(cx - bw * 0.5, cy - bh * 0.5, bw, bh);
                ctx.strokeRect(cx - bw * 0.5, cy - bh * 0.5, bw, bh);
              }

              ctx.fillStyle = isSel ? '#fbbf24' : '#ffffff';
              ctx.beginPath();
              ctx.arc(cx, cy, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          }}
        />

        {overlaps.length === 0 ? (
          <p className="text-xs font-medium" style={{ color: 'var(--me-secondary)' }}>
            Status Kolisi: Aman (tidak ada overlap)
          </p>
        ) : (
          <div className="space-y-1">
            {overlaps.map((ov, i) => (
              <p
                key={i}
                className="text-xs font-medium"
                style={{ color: ov.near ? '#fbbf24' : '#f43f5e' }}
              >
                {ov.near
                  ? `Dekat (<8px): ${ov.aName} <-> ${ov.bName}`
                  : `Overlap (${Math.round(ov.penetrationPx)}px${ov.isTriggerOverlap ? ' Trigger' : ''}): ${ov.aName} <-> ${ov.bName}`}
              </p>
            ))}
          </div>
        )}
      </Card>

      {/* Scene Hierarchy & Grouping */}
      <Card className="space-y-2.5">
        <h2 className="font-display text-base font-bold">Scene Hierarchy & Group Container</h2>
        <div className="flex items-end gap-2">
          <TextField
            label="Container Name"
            value={groupName}
            onChange={setGroupName}
            className="flex-1"
          />
          <ActionButton
            disabled={multiSelectedIds.length < 2}
            onClick={() => {
              const [next, newId] = SceneHierarchy.groupEntitiesIntoContainer(entities, multiSelectedIds, groupName);
              if (newId) {
                updateSettings((s) => ({ ...s, sceneEntities: next }));
                setSelectedId(newId);
                setMultiSelectedIds([]);
                showBanner(`Grouped into ${groupName}`);
              }
            }}
          >
            Group ({multiSelectedIds.length})
          </ActionButton>
        </div>

        <div className="space-y-1">
          {entities.map((node) => {
            const isSel = node.id === selected?.id;
            const checked = multiSelectedIds.includes(node.id);
            return (
              <div
                key={node.id}
                onClick={() => setSelectedId(node.id)}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-2.5 py-2 transition-colors"
                style={{
                  backgroundColor: isSel
                    ? 'color-mix(in srgb, var(--me-primary) 18%, var(--me-surface-variant))'
                    : 'transparent'
                }}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  {node.kind !== 'container' && (
                    <input
                      type="checkbox"
                      checked={checked}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setMultiSelectedIds((prev) =>
                          on ? [...prev, node.id] : prev.filter((id) => id !== node.id)
                        );
                      }}
                      className="h-5 w-5 cursor-pointer accent-sky-400"
                    />
                  )}
                  <div className="min-w-0">
                    <div className={`truncate text-sm ${isSel ? 'font-bold' : 'font-normal'}`}>
                      {node.parentId ? '↳ ' : ''}
                      {node.name}
                    </div>
                    <div className="truncate text-[11px]" style={{ color: 'var(--me-text-muted)' }}>
                      {node.kind.toUpperCase()} · ({Math.round(node.x)}, {Math.round(node.y)}) ·{' '}
                      {PHYSICS_PRESETS[node.physics.presetId].label} · {node.collider.kind.toUpperCase()}
                    </div>
                  </div>
                </div>
                {node.kind === 'container' && (
                  <ActionButton
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = SceneHierarchy.ungroupContainer(entities, node.id);
                      updateSettings((s) => ({ ...s, sceneEntities: next }));
                    }}
                  >
                    Ungroup
                  </ActionButton>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Inspector */}
      {selected && (
        <Card className="space-y-3">
          <h2 className="font-display text-base font-bold">Inspector: {selected.name}</h2>
          <p className="tabular-nums text-xs" style={{ color: 'var(--me-text-muted)' }}>
            Transform: X={Math.round(selected.x)} · Y={Math.round(selected.y)} · Scale={selected.scaleX.toFixed(2)} ·
            Rot={Math.round(selected.rotationDeg)}°
          </p>

          <SliderField
            label="Position X"
            value={selected.x}
            min={16}
            max={344}
            step={1}
            onChange={(nx) =>
              updateSettings((s) => ({
                ...s,
                sceneEntities: SceneHierarchy.updateEntityTransform(s.sceneEntities, selected.id, { newX: nx })
              }))
            }
          />
          <SliderField
            label="Position Y"
            value={selected.y}
            min={16}
            max={224}
            step={1}
            onChange={(ny) =>
              updateSettings((s) => ({
                ...s,
                sceneEntities: SceneHierarchy.updateEntityTransform(s.sceneEntities, selected.id, { newY: ny })
              }))
            }
          />
          <SliderField
            label="Uniform Scale"
            value={selected.scaleX}
            min={0.5}
            max={2.2}
            step={0.05}
            onChange={(ns) =>
              updateSettings((s) => ({
                ...s,
                sceneEntities: SceneHierarchy.updateEntityTransform(s.sceneEntities, selected.id, {
                  newScaleX: ns,
                  newScaleY: ns
                })
              }))
            }
          />

          <div className="space-y-1.5">
            <div className="text-xs font-semibold">6 Physics Presets (1-Tap)</div>
            <div className="grid grid-cols-3 gap-1.5">
              {PHYSICS_PRESET_IDS.map((pid) => (
                <FilterChip
                  key={pid}
                  selected={selected.physics.presetId === pid}
                  onClick={() =>
                    updateSettings((s) => ({
                      ...s,
                      sceneEntities: SceneHierarchy.applyPhysicsPreset(s.sceneEntities, selected.id, pid)
                    }))
                  }
                >
                  {PHYSICS_PRESETS[pid].label}
                </FilterChip>
              ))}
            </div>
          </div>

          <SwitchRow
            label="Sensor Trigger (Pass-Through)"
            checked={selected.physics.isTrigger}
            onChange={(trg) =>
              updateSettings((s) => ({
                ...s,
                sceneEntities: s.sceneEntities.map((ent) =>
                  ent.id === selected.id ? { ...ent, physics: { ...ent.physics, isTrigger: trg } } : ent
                )
              }))
            }
          />

          <div className="space-y-1.5">
            <div className="text-xs font-semibold">Collider Shape</div>
            <div className="grid grid-cols-3 gap-1.5">
              {COLLIDER_SHAPE_KINDS.map((kind) => (
                <FilterChip
                  key={kind}
                  selected={selected.collider.kind === kind}
                  onClick={() =>
                    updateSettings((s) => ({
                      ...s,
                      sceneEntities: SceneHierarchy.updateEntityCollider(s.sceneEntities, selected.id, { kind })
                    }))
                  }
                >
                  {kind.toUpperCase()}
                </FilterChip>
              ))}
            </div>
          </div>

          {selected.collider.kind === 'circle' ? (
            <SliderField
              label={`Radius: ${Math.round(selected.collider.radius)}px`}
              value={selected.collider.radius}
              min={10}
              max={72}
              step={1}
              onChange={(radius) =>
                updateSettings((s) => ({
                  ...s,
                  sceneEntities: SceneHierarchy.updateEntityCollider(s.sceneEntities, selected.id, { radius })
                }))
              }
            />
          ) : (
            <>
              <SliderField
                label={`Width: ${Math.round(selected.collider.width)}px`}
                value={selected.collider.width}
                min={14}
                max={260}
                step={1}
                onChange={(width) =>
                  updateSettings((s) => ({
                    ...s,
                    sceneEntities: SceneHierarchy.updateEntityCollider(s.sceneEntities, selected.id, { width })
                  }))
                }
              />
              <SliderField
                label={`Height: ${Math.round(selected.collider.height)}px`}
                value={selected.collider.height}
                min={14}
                max={140}
                step={1}
                onChange={(height) =>
                  updateSettings((s) => ({
                    ...s,
                    sceneEntities: SceneHierarchy.updateEntityCollider(s.sceneEntities, selected.id, { height })
                  }))
                }
              />
            </>
          )}
        </Card>
      )}
    </div>
  );
};
