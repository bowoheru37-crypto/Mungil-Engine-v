import React from 'react';
import { DEFAULT_TOUCH_CONFIG } from '../../engine/storageRepository';
import { useEngineStore } from '../../state/useEngineStore';
import { ActionButton, Card, FilterChip, SliderField, SwitchRow } from '../ui/Primitives';

export const StudioControlsTab: React.FC = () => {
  const { state, updateSettings } = useEngineStore();
  const cfg = state.touchConfig;

  return (
    <div className="space-y-4 pb-8">
      <Card className="space-y-3">
        <h2 className="font-display text-base font-bold">Customizable Touch Controls (Itel A70 Ergonomics)</h2>

        <div className="grid grid-cols-2 gap-2">
          {[
            { side: 'left' as const, label: 'Joystick Left' },
            { side: 'right' as const, label: 'Joystick Right' }
          ].map((item) => (
            <FilterChip
              key={item.side}
              selected={cfg.joystickSide === item.side}
              onClick={() => updateSettings((s) => ({ ...s, touchConfig: { ...cfg, joystickSide: item.side } }))}
            >
              {item.label}
            </FilterChip>
          ))}
        </div>

        <SliderField
          label={`Joystick Diameter: ${cfg.joystickDiameter}px`}
          value={cfg.joystickDiameter}
          min={88}
          max={150}
          step={1}
          onChange={(v) =>
            updateSettings((s) => ({ ...s, touchConfig: { ...cfg, joystickDiameter: Math.round(v) } }))
          }
        />

        <SliderField
          label={`Action Button Size: ${cfg.buttonSize}px (min 48px accessible)`}
          value={cfg.buttonSize}
          min={48}
          max={76}
          step={1}
          onChange={(v) =>
            updateSettings((s) => ({ ...s, touchConfig: { ...cfg, buttonSize: Math.round(v) } }))
          }
        />

        <SliderField
          label={`Horizontal Offset: ${cfg.joystickOffsetX}px`}
          value={cfg.joystickOffsetX}
          min={8}
          max={56}
          step={1}
          onChange={(v) =>
            updateSettings((s) => ({ ...s, touchConfig: { ...cfg, joystickOffsetX: Math.round(v) } }))
          }
        />

        <SliderField
          label={`Vertical Offset: ${cfg.joystickOffsetY}px`}
          value={cfg.joystickOffsetY}
          min={8}
          max={56}
          step={1}
          onChange={(v) =>
            updateSettings((s) => ({ ...s, touchConfig: { ...cfg, joystickOffsetY: Math.round(v) } }))
          }
        />

        <SliderField
          label={`Opacity: ${Math.round(cfg.opacity * 100)}%`}
          value={cfg.opacity}
          min={0.35}
          max={1}
          step={0.05}
          onChange={(v) => updateSettings((s) => ({ ...s, touchConfig: { ...cfg, opacity: v } }))}
        />

        <SliderField
          label={`Deadzone: ${Math.round(cfg.deadzone * 100)}%`}
          value={cfg.deadzone}
          min={0.05}
          max={0.35}
          step={0.01}
          onChange={(v) => updateSettings((s) => ({ ...s, touchConfig: { ...cfg, deadzone: v } }))}
        />

        <SwitchRow
          label="Haptic Feedback"
          checked={cfg.haptics}
          onChange={(haptics) => updateSettings((s) => ({ ...s, touchConfig: { ...cfg, haptics } }))}
        />
        <SwitchRow
          label="Show Button Labels"
          checked={cfg.showLabels}
          onChange={(showLabels) => updateSettings((s) => ({ ...s, touchConfig: { ...cfg, showLabels } }))}
        />

        <ActionButton
          variant="outline"
          fullWidth
          onClick={() => updateSettings((s) => ({ ...s, touchConfig: { ...DEFAULT_TOUCH_CONFIG } }))}
        >
          Reset Touch Layout to Default
        </ActionButton>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-display text-base font-bold">Accessibility & Display</h2>
        <SwitchRow
          label="Dark Theme"
          checked={state.darkTheme}
          onChange={(darkTheme) => updateSettings((s) => ({ ...s, darkTheme }))}
        />
        <SwitchRow
          label="High Contrast Mode"
          checked={state.highContrast}
          onChange={(highContrast) => updateSettings((s) => ({ ...s, highContrast }))}
        />
        <SwitchRow
          label="Reduce Camera Shake"
          checked={state.reduceShake}
          onChange={(reduceShake) => updateSettings((s) => ({ ...s, reduceShake }))}
        />
        <SliderField
          label={`Base Font Size: ${state.fontSizePx}px`}
          value={state.fontSizePx}
          min={12}
          max={18}
          step={1}
          onChange={(sz) => updateSettings((s) => ({ ...s, fontSizePx: Math.round(sz) }))}
        />
      </Card>
    </div>
  );
};
