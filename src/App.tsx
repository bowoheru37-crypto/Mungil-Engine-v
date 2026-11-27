import React, { useRef } from 'react';
import { GameShellScreen } from './components/GameShellScreen';
import { LandingScreen } from './components/LandingScreen';
import { StudioWorkspaceScreen } from './components/StudioWorkspaceScreen';
import { EngineStoreProvider, useEngineStore } from './state/useEngineStore';

const EngineShellRouter: React.FC = () => {
  const { state, clearBanner, importSaveJson, showBanner } = useEngineStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleRequestImportSave = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      showBanner(importSaveJson(text));
    };
    reader.onerror = () => showBanner('Failed to read save JSON file.');
    reader.readAsText(file);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {state.shellState === 'LANDING' && <LandingScreen />}
      {state.shellState === 'STUDIO' && (
        <StudioWorkspaceScreen onRequestImportSave={handleRequestImportSave} />
      )}
      {state.shellState !== 'LANDING' && state.shellState !== 'STUDIO' && <GameShellScreen />}

      {state.statusBanner && (
        <div className="fixed inset-x-0 bottom-3 z-50 flex justify-center px-4 pointer-events-none">
          <div
            role="status"
            className="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border px-4 py-2.5 text-sm shadow-2xl"
            style={{
              backgroundColor: 'var(--me-surface)',
              borderColor: 'var(--me-primary)',
              color: 'var(--me-text)'
            }}
          >
            <span className="flex-1">{state.statusBanner}</span>
            <button
              type="button"
              onClick={clearBanner}
              className="cursor-pointer text-xs font-bold uppercase"
              style={{ color: 'var(--me-primary)' }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export function App() {
  return (
    <EngineStoreProvider>
      <EngineShellRouter />
    </EngineStoreProvider>
  );
}

export default App;
