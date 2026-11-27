import React, { useEffect, useState } from 'react';
import { Catalogs } from '../../engine/catalogs';
import { StorageRepository } from '../../engine/storageRepository';
import { LANGUAGE_OPTIONS } from '../../engine/types';
import { useEngineStore } from '../../state/useEngineStore';
import { ActionButton, Card, FilterChip, SwitchRow, TextField } from '../ui/Primitives';

export const StudioServicesTab: React.FC<{
  onRequestImportSave: () => void;
}> = ({ onRequestImportSave }) => {
  const {
    state,
    saveProgress,
    loadProgress,
    deleteSaveSlot,
    addBonusCoinsPotions,
    updateSettings,
    exportFile,
    showBanner
  } = useEngineStore();

  const [displayNameInput, setDisplayNameInput] = useState(state.auth.displayName);

  useEffect(() => {
    setDisplayNameInput(state.auth.displayName);
  }, [state.auth.displayName]);

  return (
    <div className="space-y-4 pb-8">
      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-base font-bold">Offline 3-Slot + Auto Save Storage</h2>
          <ActionButton variant="outline" onClick={onRequestImportSave}>
            Import JSON
          </ActionButton>
        </div>

        <div className="space-y-2">
          {state.saveSummaries.map((slot) => (
            <div
              key={slot.id}
              className="space-y-2 rounded-xl border p-3"
              style={{ backgroundColor: 'var(--me-surface-variant)', borderColor: 'var(--me-border)' }}
            >
              <div className="text-sm font-bold">{slot.id === 'auto' ? 'Auto-Save' : `Slot ${slot.id}`}</div>
              <div className="text-xs" style={{ color: 'var(--me-text-muted)' }}>
                {slot.exists
                  ? `Lv.${slot.level} · HP ${slot.hp} · Score ${slot.score} · Coins ${slot.coins}`
                  : 'Empty slot'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {slot.id !== 'auto' && (
                  <ActionButton
                    className="flex-1"
                    onClick={() => {
                      const [, bytes] = saveProgress(slot.id);
                      showBanner(`Saved Slot ${slot.id} (${bytes} bytes)`);
                    }}
                  >
                    Save
                  </ActionButton>
                )}
                <ActionButton
                  variant="tonal"
                  className="flex-1"
                  disabled={!slot.exists}
                  onClick={() => {
                    if (loadProgress(slot.id, true)) {
                      showBanner(`Loaded Slot ${slot.id}`);
                    }
                  }}
                >
                  Load
                </ActionButton>
                <ActionButton
                  variant="outline"
                  disabled={!slot.exists}
                  onClick={() => {
                    const raw = StorageRepository.exportSlotJson(slot.id);
                    if (raw) {
                      exportFile(`mungil_save_slot_${slot.id}.json`, raw, 'application/json');
                    }
                  }}
                >
                  JSON
                </ActionButton>
                <ActionButton variant="ghost" disabled={!slot.exists} onClick={() => deleteSaveSlot(slot.id)}>
                  Del
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-display text-base font-bold">Language & Local Profile</h2>
        <div className="grid grid-cols-5 gap-1.5">
          {LANGUAGE_OPTIONS.map((lc) => (
            <FilterChip
              key={lc.code}
              selected={state.lang === lc.code}
              onClick={() => updateSettings((s) => ({ ...s, lang: lc.code }))}
            >
              {lc.code.toUpperCase()}
            </FilterChip>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <TextField
            label="Guardian Name"
            value={displayNameInput}
            onChange={setDisplayNameInput}
            className="flex-1"
          />
          <ActionButton
            onClick={() => {
              updateSettings((s) => ({
                ...s,
                auth: { ...s.auth, displayName: displayNameInput.trim() || 'Offline Guest' }
              }));
              showBanner('Profile updated!');
            }}
          >
            Save
          </ActionButton>
        </div>
      </Card>

      <Card className="space-y-2.5">
        <h2 className="font-display text-base font-bold">Local Telemetry & Sandbox Store</h2>
        <p className="tabular-nums text-xs font-medium" style={{ color: 'var(--me-primary)' }}>
          Sessions: {state.analytics.sessions} · Deaths: {state.analytics.deaths} · Cleared Lv1/2/3:{' '}
          {state.analytics.level1Clears}/{state.analytics.level2Clears}/{state.analytics.level3Clears}
        </p>
        <SwitchRow
          label="Record Session Telemetry"
          checked={state.analyticsEnabled}
          onChange={(analyticsEnabled) => updateSettings((s) => ({ ...s, analyticsEnabled }))}
        />
        <div className="space-y-2 pt-1">
          {Catalogs.SANDBOX_SKUS.map((sku) => (
            <div key={sku.id} className="flex items-center justify-between gap-2 py-1">
              <div className="min-w-0">
                <div className="text-sm font-bold">
                  {sku.title} ({sku.price})
                </div>
                <div className="text-xs" style={{ color: 'var(--me-text-muted)' }}>
                  {sku.desc}
                </div>
              </div>
              <ActionButton
                variant="tonal"
                onClick={() => {
                  addBonusCoinsPotions(sku.coins, sku.potions);
                  showBanner(`Granted +${sku.coins} coins & +${sku.potions} potions!`);
                }}
              >
                Claim
              </ActionButton>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
