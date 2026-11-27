import React from 'react';
import { Play } from 'lucide-react';
import { Catalogs } from '../../engine/catalogs';
import {
  DEVICE_TIERS,
  PHYSICS_MODES,
  RENDER_MODES,
  WEATHER_KINDS
} from '../../engine/types';
import { useEngineStore } from '../../state/useEngineStore';
import { ActionButton, Card, FilterChip, SwitchRow, TextField } from '../ui/Primitives';

export const StudioPlayTab: React.FC = () => {
  const { state, startOrRestartLevel, setDeviceTier, updateSettings } = useEngineStore();

  return (
    <div className="space-y-4 pb-8">
      <Card className="space-y-3">
        <h2 className="font-display text-base font-bold">Project & Chapter Selector</h2>
        <TextField
          label="Game Title"
          value={state.gameName}
          onChange={(next) => updateSettings((s) => ({ ...s, gameName: next }))}
        />

        <div className="grid grid-cols-3 gap-2">
          {[
            { lvl: 1, label: 'Lv.1 Desa Fajar' },
            { lvl: 2, label: 'Lv.2 Badai' },
            { lvl: 3, label: 'Lv.3 Boss Kala' }
          ].map((item) => (
            <FilterChip
              key={item.lvl}
              selected={state.activeLevel === item.lvl}
              onClick={() => startOrRestartLevel(item.lvl)}
            >
              {item.label}
            </FilterChip>
          ))}
        </div>

        <ActionButton fullWidth onClick={() => startOrRestartLevel(state.activeLevel)}>
          <Play className="h-4 w-4 fill-current" />
          <span>Launch Chapter {state.activeLevel}</span>
        </ActionButton>
      </Card>

      <Card className="space-y-3">
        <div>
          <h2 className="font-display text-base font-bold">Itel A70 Performance & Engine Modes</h2>
          <p className="text-xs font-medium" style={{ color: 'var(--me-primary)' }}>
            Active Tier: {state.deviceProfile.activeTier.toUpperCase()} · Target {state.deviceProfile.targetFps} FPS ·
            Max Particles {state.deviceProfile.particleMax}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {DEVICE_TIERS.map((tier) => (
            <FilterChip
              key={tier}
              selected={state.requestedTier === tier}
              onClick={() => setDeviceTier(tier)}
            >
              {tier.toUpperCase()}
            </FilterChip>
          ))}
        </div>

        <SwitchRow
          label="Power Saver Auto-Clamp"
          checked={state.powerSaveAuto}
          onChange={(ps) => setDeviceTier(state.requestedTier, ps)}
        />

        <div className="space-y-1.5">
          <div className="text-xs font-semibold">Render Dimension</div>
          <div className="grid grid-cols-3 gap-1.5">
            {RENDER_MODES.map((rm) => (
              <FilterChip
                key={rm}
                selected={state.renderMode === rm}
                onClick={() => updateSettings((s) => ({ ...s, renderMode: rm }))}
              >
                {rm}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-semibold">Physics Mode</div>
          <div className="grid grid-cols-3 gap-1.5">
            {PHYSICS_MODES.map((pm) => (
              <FilterChip
                key={pm}
                selected={state.physicsMode === pm}
                onClick={() => updateSettings((s) => ({ ...s, physicsMode: pm }))}
              >
                {pm}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-semibold">Weather Atmosphere</div>
          <div className="grid grid-cols-3 gap-1.5">
            {WEATHER_KINDS.map((wk) => (
              <FilterChip
                key={wk}
                selected={state.weather === wk}
                onClick={() => updateSettings((s) => ({ ...s, weather: wk }))}
              >
                {wk}
              </FilterChip>
            ))}
          </div>
        </div>

        <SwitchRow
          label="Practice Mode (Invulnerable)"
          checked={state.practiceMode}
          onChange={(next) => updateSettings((s) => ({ ...s, practiceMode: next }))}
        />
        <SwitchRow
          label="Physics Collider Debug Box"
          checked={state.physicsDebug}
          onChange={(next) => updateSettings((s) => ({ ...s, physicsDebug: next }))}
        />
      </Card>

      <div className="space-y-2.5">
        <h3 className="font-display text-base font-bold">16 Playable Genre Templates (1-Tap Launch)</h3>
        <div className="space-y-2">
          {Catalogs.GENRE_TEMPLATES.map((tpl) => {
            const isCurrent = state.activeGenreId === tpl.id;
            return (
              <Card key={tpl.id} highlighted={isCurrent}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="text-sm font-bold">{tpl.name}</div>
                    <div className="text-xs" style={{ color: 'var(--me-text-muted)' }}>
                      {tpl.desc}
                    </div>
                    <div className="text-[11px] font-semibold" style={{ color: 'var(--me-primary)' }}>
                      {tpl.renderMode} · {tpl.physicsMode} · {tpl.styleId.toUpperCase()} · {tpl.weather}
                    </div>
                  </div>
                  <ActionButton onClick={() => startOrRestartLevel(state.activeLevel, tpl)}>
                    Play
                  </ActionButton>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
