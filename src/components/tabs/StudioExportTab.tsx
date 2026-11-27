import React, { useMemo, useState } from 'react';
import { ArtStyles } from '../../engine/artStyles';
import { BytecodeVm, MungilEngineApi } from '../../engine/bytecodeVm';
import { Catalogs } from '../../engine/catalogs';
import { Generators } from '../../engine/generators';
import { useEngineStore } from '../../state/useEngineStore';
import { ActionButton, Card } from '../ui/Primitives';

export const buildStandalonePlayableHtml = Generators.buildStandalonePlayableHtml;

export const StudioExportTab: React.FC = () => {
  const { state, exportFile, copyText, showBanner } = useEngineStore();
  const [pakStatus, setPakStatus] = useState('Ready to test lossless MPAK7 RLE compression.');

  const activeStyle = ArtStyles.getStyleSpec(state.styleId, state.customPalettes);

  const projectJson = useMemo(
    () =>
      JSON.stringify(
        {
          engine: 'Mungil-Engine-V7-Web',
          title: state.gameName,
          activeLevel: state.activeLevel,
          artStyle: state.styleId,
          renderMode: state.renderMode,
          physicsMode: state.physicsMode,
          perspective: state.perspectiveConnector,
          hybridMode: state.hybridMode,
          bytecodeSrc: state.customBytecodeSrc,
          eventRulesCount: state.eventRules.length
        },
        null,
        2
      ),
    [
      state.gameName,
      state.activeLevel,
      state.styleId,
      state.renderMode,
      state.physicsMode,
      state.perspectiveConnector,
      state.hybridMode,
      state.customBytecodeSrc,
      state.eventRules.length
    ]
  );

  const targetSpec = useMemo(
    () => Generators.generatePlatformTargetSpec(700, 'apk', state.gameName),
    [state.gameName]
  );

  const seoSpec = useMemo(
    () =>
      Generators.generateSeoOpenGraphSpec(
        state.gameName,
        state.activeGenreId,
        `${state.gameName} — ${state.renderMode} ${state.styleId} game built on Mungil Engine V7.`
      ),
    [state.gameName, state.activeGenreId, state.renderMode, state.styleId]
  );

  return (
    <div className="space-y-4 pb-8">
      <Card className="space-y-3">
        <h2 className="font-display text-base font-bold">Playable HTML5, MPAK7 .PAK &amp; Project Export</h2>
        <div className="grid grid-cols-2 gap-2">
          <ActionButton
            onClick={() => exportFile('mungil_project_v7.json', projectJson, 'application/json')}
          >
            Export JSON
          </ActionButton>
          <ActionButton
            variant="tonal"
            onClick={() => {
              const pak = BytecodeVm.packRleBytes(projectJson);
              const roundtripOk = BytecodeVm.unpackRleBytes(pak.bytes) === projectJson;
              setPakStatus(
                `MPAK7: ${pak.originalBytes}B -> ${pak.packedBytes}B (${pak.ratioPct}%) · Roundtrip=${roundtripOk}`
              );
              exportFile('mungil_bundle.pak', pak.bytes, 'application/octet-stream');
            }}
          >
            MPAK7 .PAK
          </ActionButton>
        </div>
        <p className="tabular-nums text-xs font-medium" style={{ color: 'var(--me-primary)' }}>
          {pakStatus}
        </p>
        <ActionButton
          fullWidth
          onClick={() => {
            const html = buildStandalonePlayableHtml({
              title: state.gameName,
              genreId: state.activeGenreId,
              stylePalette: activeStyle.palette,
              level: state.activeLevel,
              bytecodeSrc: state.customBytecodeSrc
            });
            exportFile('mungil_playable_game.html', html, 'text/html');
          }}
        >
          Export Standalone Playable HTML5 Game
        </ActionButton>
      </Card>

      <Card className="space-y-2.5">
        <h2 className="font-display text-base font-bold">SEO, OpenGraph &amp; Social Share Tags</h2>
        <pre
          className="font-mono-code overflow-x-auto rounded-xl p-2.5 text-[11px]"
          style={{ backgroundColor: 'var(--me-bg)', color: 'var(--me-text-muted)' }}
        >
          {seoSpec}
        </pre>
        <ActionButton variant="outline" fullWidth onClick={() => copyText('SEO & OpenGraph Meta', seoSpec)}>
          Copy SEO / Social Share HTML Tags
        </ActionButton>
      </Card>

      <Card className="space-y-2.5">
        <h2 className="font-display text-base font-bold">Android SDK 24-36 Build Pack (Itel A70)</h2>
        <pre
          className="font-mono-code overflow-x-auto rounded-xl p-2.5 text-[11px]"
          style={{ backgroundColor: 'var(--me-bg)', color: 'var(--me-text-muted)' }}
        >
          {targetSpec.configJson}
        </pre>
        <div className="grid grid-cols-2 gap-2">
          <ActionButton onClick={() => copyText('Android Build Target', targetSpec.configJson)}>
            Copy Android APK Target Spec
          </ActionButton>
          <ActionButton
            variant="outline"
            onClick={() => exportFile('mungil_android_target.json', targetSpec.configJson, 'application/json')}
          >
            Download Target JSON
          </ActionButton>
        </div>
      </Card>

      <div className="space-y-2">
        <h3 className="font-display text-base font-bold">MungilE API Reference</h3>
        {Catalogs.API_REFERENCE_EXAMPLES.map(([sig, ex, desc]) => (
          <Card key={sig} className="space-y-1">
            <div className="font-mono-code text-xs font-bold">{sig}</div>
            <div className="text-xs" style={{ color: 'var(--me-text-muted)' }}>
              {desc}
            </div>
            <ActionButton variant="ghost" onClick={() => showBanner(MungilEngineApi.runCommandSummary(ex))}>
              Test: {ex}
            </ActionButton>
          </Card>
        ))}
      </div>

      <Card className="space-y-2">
        <h2 className="font-display text-base font-bold">Engine Docs &amp; Cleanroom Notices</h2>
        {Catalogs.ENGINE_DOCS_SECTIONS.map(([title, body]) => (
          <div key={title} className="space-y-0.5">
            <div className="text-xs font-bold" style={{ color: 'var(--me-primary)' }}>
              {title}
            </div>
            <p className="text-xs">{body}</p>
          </div>
        ))}
        <hr style={{ borderColor: 'var(--me-border)' }} />
        <pre className="whitespace-pre-wrap text-[11px]" style={{ color: 'var(--me-text-muted)' }}>
          {Catalogs.THIRD_PARTY_NOTICES_TEXT}
        </pre>
      </Card>
    </div>
  );
};
