import React from 'react';
import { Home, Play } from 'lucide-react';
import { I18n } from '../engine/i18n';
import { STUDIO_TABS, StudioTab } from '../engine/types';
import { useEngineStore } from '../state/useEngineStore';
import { ActionButton, FilterChip } from './ui/Primitives';
import { StudioPlayTab } from './tabs/StudioPlayTab';
import { StudioSceneEditorTab } from './tabs/StudioSceneEditorTab';
import { StudioAgentTab } from './tabs/StudioAgentTab';
import { StudioArenaAiTab } from './tabs/StudioArenaAiTab';
import { StudioAssetsTab } from './tabs/StudioAssetsTab';
import { StudioGeneratorsTab } from './tabs/StudioGeneratorsTab';
import { StudioControlsTab } from './tabs/StudioControlsTab';
import { StudioArtTab } from './tabs/StudioArtTab';
import { StudioLabTab } from './tabs/StudioLabTab';
import { StudioSkillsTab } from './tabs/StudioSkillsTab';
import { StudioServicesTab } from './tabs/StudioServicesTab';
import { StudioExportTab } from './tabs/StudioExportTab';

export const StudioWorkspaceScreen: React.FC<{
  onRequestImportSave: () => void;
}> = ({ onRequestImportSave }) => {
  const { state, backToLanding, openStudioTab, openTitleStage, startOrRestartLevel } = useEngineStore();
  const tr = I18n.t(state.lang);

  const tabLabels: Record<StudioTab, string> = {
    play: tr.tabs.play,
    scene: tr.tabs.scene,
    agent: tr.tabs.agent,
    arena: tr.tabs.arena,
    assets: tr.tabs.assets,
    generators: tr.tabs.generators,
    controls: tr.tabs.controls,
    art: tr.tabs.art,
    lab: tr.tabs.lab,
    skills: tr.tabs.skills,
    services: tr.tabs.services,
    export: tr.tabs.export
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: 'var(--me-bg)', color: 'var(--me-text)' }}>
      {/* Top Studio Header & Scrollable 12-Tab Strip */}
      <header
        className="sticky top-0 z-20 border-b"
        style={{
          backgroundColor: 'var(--me-surface)',
          borderColor: 'var(--me-border)'
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              aria-label="Back to Home"
              onClick={backToLanding}
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border"
              style={{
                backgroundColor: 'var(--me-surface-variant)',
                borderColor: 'var(--me-border)',
                color: 'var(--me-text)'
              }}
            >
              <Home className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="font-display truncate text-sm font-bold sm:text-base">{state.gameName}</div>
              <div className="truncate text-[11px] font-medium" style={{ color: 'var(--me-primary)' }}>
                Studio · {state.deviceProfile.activeTier.toUpperCase()} · Lv.{state.activeLevel}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <ActionButton variant="outline" onClick={openTitleStage}>
              Title
            </ActionButton>
            <ActionButton onClick={() => startOrRestartLevel(state.activeLevel)}>
              <Play className="h-4 w-4 fill-current" />
              <span>{tr.playGame}</span>
            </ActionButton>
          </div>
        </div>

        <nav className="no-scrollbar mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-3 pb-2.5">
          {STUDIO_TABS.map((tab) => (
            <FilterChip
              key={tab}
              selected={state.studioTab === tab}
              onClick={() => openStudioTab(tab)}
              className="shrink-0"
            >
              {tabLabels[tab] ?? tab.toUpperCase()}
            </FilterChip>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-3.5 py-4">
        {state.studioTab === 'play' && <StudioPlayTab />}
        {state.studioTab === 'scene' && <StudioSceneEditorTab />}
        {state.studioTab === 'agent' && <StudioAgentTab />}
        {state.studioTab === 'arena' && <StudioArenaAiTab />}
        {state.studioTab === 'assets' && <StudioAssetsTab />}
        {state.studioTab === 'generators' && <StudioGeneratorsTab />}
        {state.studioTab === 'controls' && <StudioControlsTab />}
        {state.studioTab === 'art' && <StudioArtTab />}
        {state.studioTab === 'lab' && <StudioLabTab />}
        {state.studioTab === 'skills' && <StudioSkillsTab />}
        {state.studioTab === 'services' && <StudioServicesTab onRequestImportSave={onRequestImportSave} />}
        {state.studioTab === 'export' && <StudioExportTab />}
      </main>
    </div>
  );
};
