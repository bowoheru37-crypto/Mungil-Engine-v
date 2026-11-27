import React, { useEffect, useRef, useState } from 'react';
import { GameCanvasRenderers } from '../../canvas/gameCanvasRenderers';
import { GeneratorRenderers } from '../../canvas/generatorRenderers';
import {
  ScannedSpriteAsset,
  scanPixelBufferToSprite,
  validateMeshAndAsset
} from '../../engine/architecture12Layers';
import { ArtStyles } from '../../engine/artStyles';
import { Generators } from '../../engine/generators';
import { MeshAndBlueprintGenerators } from '../../engine/meshAndBlueprintGenerators';
import { SoundEngine } from '../../engine/soundEngine';
import { useEngineStore } from '../../state/useEngineStore';
import { ActionButton, Card, FilterChip, HiDpiCanvas, SliderField, TextField } from '../ui/Primitives';

const SUB_TABS = [
  'Character & Rig',
  '3D Mesh',
  'Sprite & Props',
  'Music',
  'SFX & Dub',
  'Cutscene',
  'Terrain',
  'Forge & FSM'
];

export const StudioGeneratorsTab: React.FC = () => {
  const { state, updateSettings, launchBlueprint, exportFile, showBanner } = useEngineStore();
  const [subTab, setSubTab] = useState(0);
  const style = ArtStyles.getStyleSpec(state.styleId, state.customPalettes);

  // 0: Character & Rig
  const [charSeed, setCharSeed] = useState(101);
  const [charPrompt, setCharPrompt] = useState('Ksatria Lentera');
  const [presetId, setPresetId] = useState('guardian_mint');
  const [rigSpec, setRigSpec] = useState(() =>
    Generators.generateRig3DFromPrompt(101, 'Ksatria Lentera', 'guardian_mint')
  );
  const [atelierJson, setAtelierJson] = useState(rigSpec.atelier.rawJson);
  const [charYaw, setCharYaw] = useState(0.3);

  // 1: 3D Mesh
  const [meshSeed, setMeshSeed] = useState(404);
  const [meshPrompt, setMeshPrompt] = useState('Bowo Crystal Guardian');
  const [meshCategory, setMeshCategory] = useState<'character' | 'prop'>('character');
  const [boxOnly, setBoxOnly] = useState(false);
  const [mesh, setMesh] = useState(() =>
    MeshAndBlueprintGenerators.generateMesh3DFromPrompt(404, 'Bowo Crystal Guardian')
  );
  const [meshYaw, setMeshYaw] = useState(0.4);

  useEffect(() => {
    if (subTab !== 1) return;
    const id = window.setInterval(() => setMeshYaw((y) => y + 0.025), 33);
    return () => window.clearInterval(id);
  }, [subTab]);

  // 2: Sprite & Props + On-Device Photo-to-Sprite Scan (Layer 1.1)
  const [spriteSeed, setSpriteSeed] = useState(202);
  const [spritePrompt, setSpritePrompt] = useState('Lantern Crystal');
  const [imgSpec, setImgSpec] = useState(() =>
    Generators.generateImageSpriteFromPrompt(202, 'Lantern Crystal', state.styleId)
  );
  const [propSpec, setPropSpec] = useState(() => Generators.generatePropAsset(202, 'crystal'));
  const [scannedAsset, setScannedAsset] = useState<ScannedSpriteAsset | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const handleScanPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const off = document.createElement('canvas');
        off.width = 32;
        off.height = 32;
        const ctx = off.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 32, 32);
          const data = ctx.getImageData(0, 0, 32, 32).data;
          const scanned = scanPixelBufferToSprite(data, 32, 32, 16);
          setScannedAsset(scanned);
          showBanner(`Scanned photo -> 16x16 sprite (${scanned.palette.length} colors)`);
        }
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      showBanner('Unable to decode image file');
    };
    img.src = url;
  };

  // 3: Music
  const [musicSeed, setMusicSeed] = useState(303);
  const [scale, setScale] = useState('pentatonic');
  const [bpm, setBpm] = useState(128);
  const [track, setTrack] = useState(() => Generators.generateMusicTrack(303, 'pentatonic', 128));

  // 4: SFX & Dubbing
  const [sfxSeed] = useState(505);
  const [sfxPreset, setSfxPreset] = useState('slash');
  const [sfx, setSfx] = useState(() => Generators.generateSfxSpec(505, 'slash'));
  const [speaker, setSpeaker] = useState('Bowo');
  const [line, setLine] = useState('Nyalakan Lentera Cahaya sekarang!');
  const [dub, setDub] = useState(() =>
    Generators.generateDubbingSubtitleSpec(505, 'Bowo', 'Nyalakan Lentera Cahaya sekarang!', state.lang)
  );

  // 5: Cutscene
  const [verbPrompt, setVerbPrompt] = useState('jalan lompat dash serang');
  const [cutscene, setCutscene] = useState(() =>
    Generators.composeMovieFromPrompt('jalan lompat dash serang', 606, state.weather)
  );
  const [cutPlaying, setCutPlaying] = useState(true);
  const [playhead, setPlayhead] = useState(0);

  useEffect(() => {
    if (subTab !== 5 || !cutPlaying) return;
    const id = window.setInterval(() => {
      setPlayhead((p) => (p + 0.033) % Math.max(1, cutscene.durationSec));
    }, 33);
    return () => window.clearInterval(id);
  }, [subTab, cutPlaying, cutscene.durationSec]);

  // 6: Terrain
  const [terrainSeed, setTerrainSeed] = useState(707);
  const [terrainMode, setTerrainMode] = useState<'2D-Ridge' | '3D-Heightmap'>('3D-Heightmap');
  const [terrainBiome, setTerrainBiome] = useState<'dawn' | 'storm' | 'obsidian'>('dawn');
  const [terrain, setTerrain] = useState(() => Generators.generateTerrainSpec(707, '3D-Heightmap', 'dawn'));

  // 7: Forge & FSM
  const [forgePrompt, setForgePrompt] = useState('Cyber Guardian Isometric Boss Quest');
  const [blueprint, setBlueprint] = useState(() =>
    MeshAndBlueprintGenerators.generateCompleteGameBlueprint(
      808,
      'Cyber Guardian Isometric Boss Quest',
      state.activeGitHubRepoId
    )
  );
  const [fsmSpec, setFsmSpec] = useState(() =>
    Generators.generateStateMachineSpec(808, 'behavior', 'Cyber Guardian Isometric Boss Quest')
  );

  const activeCaption = [...cutscene.keyframes].reverse().find((k) => k.timeSec <= playhead)?.caption ?? '';

  return (
    <div className="space-y-4 pb-8">
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {SUB_TABS.map((lbl, idx) => (
          <FilterChip key={lbl} selected={subTab === idx} onClick={() => setSubTab(idx)} className="shrink-0">
            {lbl}
          </FilterChip>
        ))}
      </div>

      {subTab === 0 && (
        <Card className="space-y-3">
          <h2 className="font-display text-base font-bold">Procedural Character & 3D-Stack Rig Generator</h2>
          <TextField label="Character Archetype / Prompt" value={charPrompt} onChange={setCharPrompt} />
          <div className="grid grid-cols-3 gap-1.5">
            {Generators.listAtelierPresets().map((ap) => (
              <FilterChip key={ap.presetId} selected={presetId === ap.presetId} onClick={() => setPresetId(ap.presetId)}>
                {ap.label}
              </FilterChip>
            ))}
          </div>
          <HiDpiCanvas
            dprCap={state.deviceProfile.dprCap}
            className="h-36 w-full rounded-xl bg-[#070d19]"
            onDraw={(ctx, w, h) => {
              ctx.fillStyle = '#070d19';
              ctx.fillRect(0, 0, w, h);
              GameCanvasRenderers.drawBowoCharacter(
                ctx,
                w * 0.5,
                h * 0.58,
                38,
                style,
                'idle',
                1,
                0,
                true,
                charYaw,
                -0.15,
                state.styleOverrides,
                rigSpec.character
              );
            }}
          />
          <SliderField label={`Preview Yaw: ${charYaw.toFixed(2)} rad`} value={charYaw} min={-1.6} max={1.6} step={0.05} onChange={setCharYaw} />
          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              onClick={() => {
                const nextSeed = charSeed + 7;
                setCharSeed(nextSeed);
                const next = Generators.generateRig3DFromPrompt(nextSeed, charPrompt, presetId);
                setRigSpec(next);
                setAtelierJson(next.atelier.rawJson);
              }}
            >
              Generate
            </ActionButton>
            <ActionButton
              variant="tonal"
              onClick={() => {
                updateSettings((s) => ({ ...s, customCharacter: rigSpec.character }));
                showBanner(`Applied ${rigSpec.character.name} to Bowo!`);
              }}
            >
              Apply Hero
            </ActionButton>
          </div>
          <TextField label="Atelier Setup JSON" value={atelierJson} onChange={setAtelierJson} multiline rows={3} mono />
          <ActionButton
            variant="outline"
            fullWidth
            onClick={() => {
              const [ok, parsed] = Generators.parseAtelierSetupJson(atelierJson);
              if (ok && parsed) {
                updateSettings((s) => ({ ...s, customCharacter: parsed }));
                showBanner('Loaded Atelier JSON to Bowo');
              } else {
                showBanner('Invalid Atelier JSON format');
              }
            }}
          >
            Import Atelier JSON
          </ActionButton>
        </Card>
      )}

      {subTab === 1 && (
        <Card className="space-y-3">
          <h2 className="font-display text-base font-bold">TripoSR / Meshy Low-Poly 3D Mesh Generator</h2>
          <TextField label="3D Mesh Prompt" value={meshPrompt} onChange={setMeshPrompt} />
          <div className="grid grid-cols-3 gap-1.5">
            <FilterChip selected={meshCategory === 'character'} onClick={() => setMeshCategory('character')}>
              Character
            </FilterChip>
            <FilterChip selected={meshCategory === 'prop'} onClick={() => setMeshCategory('prop')}>
              Prop
            </FilterChip>
            <FilterChip selected={boxOnly} onClick={() => setBoxOnly((b) => !b)}>
              {boxOnly ? 'Box Prim' : 'Loft Mesh'}
            </FilterChip>
          </div>
          <HiDpiCanvas
            dprCap={state.deviceProfile.dprCap}
            className="h-44 w-full rounded-xl"
            onDraw={(ctx, w, h) => GeneratorRenderers.drawMesh3DPreviewCanvas(ctx, w, h, mesh, meshYaw)}
          />
          <p className="tabular-nums text-xs font-medium" style={{ color: 'var(--me-primary)' }}>
            LOD Tris: {mesh.lodCounts[0]} / {mesh.lodCounts[1]} / {mesh.lodCounts[2]} · A70 Gate:{' '}
            {String(validateMeshAndAsset(mesh.vertices, mesh.triangles, 800).valid)}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <ActionButton
              onClick={() => {
                const next = meshSeed + 13;
                setMeshSeed(next);
                setMesh(
                  MeshAndBlueprintGenerators.generateMesh3DFromPrompt(
                    next,
                    meshPrompt,
                    meshCategory,
                    state.activeGitHubRepoId,
                    boxOnly
                  )
                );
              }}
            >
              Generate
            </ActionButton>
            <ActionButton
              variant="outline"
              onClick={() => exportFile(`mesh_${mesh.seed}.obj`, mesh.objText, 'text/plain')}
            >
              .OBJ
            </ActionButton>
            <ActionButton
              variant="outline"
              onClick={() => exportFile(`mesh_${mesh.seed}.gltf`, mesh.gltfJson, 'model/gltf+json')}
            >
              .glTF
            </ActionButton>
          </div>
        </Card>
      )}

      {subTab === 2 && (
        <Card className="space-y-3">
          <h2 className="font-display text-base font-bold">16x16 Sprite, Prop &amp; Photo-to-Game Scan (Layer 1.1)</h2>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleScanPhoto}
          />
          <TextField label="Sprite Prompt" value={spritePrompt} onChange={setSpritePrompt} />
          <HiDpiCanvas
            dprCap={state.deviceProfile.dprCap}
            className="h-36 w-full rounded-xl bg-[#080e1b]"
            onDraw={(ctx, w, h) => {
              ctx.fillStyle = '#080e1b';
              ctx.fillRect(0, 0, w, h);
              if (scannedAsset) {
                const cell = Math.min(w * 0.4, h * 0.8) / 16;
                const sx = w * 0.25 - cell * 8;
                const sy = h * 0.5 - cell * 8;
                scannedAsset.grid.forEach((row, r) => {
                  for (let c = 0; c < row.length; c++) {
                    const ch = row[c];
                    if (ch === '.') continue;
                    const idx = parseInt(ch, 16);
                    ctx.fillStyle = scannedAsset.palette[idx] ?? '#38bdf8';
                    ctx.fillRect(sx + c * cell, sy + r * cell, cell, cell);
                  }
                });
              } else {
                const cell = Math.min(w * 0.4, h * 0.8) / 16;
                const sx = w * 0.25 - cell * 8;
                const sy = h * 0.5 - cell * 8;
                imgSpec.grid.forEach((row, r) => {
                  for (let c = 0; c < row.length; c++) {
                    const ch = row[c];
                    if (ch === '.') continue;
                    const idx = Math.min(3, Math.max(0, ch.charCodeAt(0) - 49));
                    ctx.fillStyle = imgSpec.palette[idx] ?? '#38bdf8';
                    ctx.fillRect(sx + c * cell, sy + r * cell, cell, cell);
                  }
                });
              }

              const pCell = Math.min(w * 0.3, h * 0.7) / 10;
              const px = w * 0.72 - pCell * 5;
              const py = h * 0.5 - pCell * 5;
              ctx.fillStyle = propSpec.color;
              propSpec.pixelGrid.forEach((row, r) => {
                for (let c = 0; c < row.length; c++) {
                  if (row[c] === '#') ctx.fillRect(px + c * pCell, py + r * pCell, pCell, pCell);
                }
              });
            }}
          />
          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              onClick={() => {
                setScannedAsset(null);
                const next = spriteSeed + 9;
                setSpriteSeed(next);
                setImgSpec(Generators.generateImageSpriteFromPrompt(next, spritePrompt, state.styleId));
                setPropSpec(Generators.generatePropAsset(next, ['potion', 'chest', 'crystal', 'lantern'][next % 4]));
              }}
            >
              Generate Pair
            </ActionButton>
            <ActionButton variant="tonal" onClick={() => photoInputRef.current?.click()}>
              Scan Photo to Sprite
            </ActionButton>
          </div>
          {scannedAsset && (
            <p className="tabular-nums text-xs" style={{ color: 'var(--me-primary)' }}>
              Scanned {scannedAsset.palette.length} quantized colors + 16-col luminance heightmap ready.
            </p>
          )}
        </Card>
      )}

      {subTab === 3 && (
        <Card className="space-y-3">
          <h2 className="font-display text-base font-bold">3-Channel Tracker Music Generator</h2>
          <div className="grid grid-cols-3 gap-1.5">
            {['pentatonic', 'dorian', 'phrygian'].map((sc) => (
              <FilterChip key={sc} selected={scale === sc} onClick={() => setScale(sc)}>
                {sc.charAt(0).toUpperCase() + sc.slice(1)}
              </FilterChip>
            ))}
          </div>
          <SliderField label={`BPM: ${Math.round(bpm)}`} value={bpm} min={85} max={180} step={1} onChange={setBpm} />
          <p className="text-xs font-medium" style={{ color: 'var(--me-primary)' }}>
            {track.title} · Notes: {track.leadNotes.slice(0, 8).map((n) => `${Math.round(n)}Hz`).join(', ')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <ActionButton
              onClick={() => {
                const next = musicSeed + 5;
                setMusicSeed(next);
                setTrack(Generators.generateMusicTrack(next, scale, Math.round(bpm)));
              }}
            >
              Generate
            </ActionButton>
            <ActionButton variant="tonal" onClick={() => SoundEngine.playCustomTrack(track)}>
              Play
            </ActionButton>
            <ActionButton variant="outline" onClick={() => SoundEngine.stopTracker()}>
              Stop
            </ActionButton>
          </div>
        </Card>
      )}

      {subTab === 4 && (
        <Card className="space-y-3">
          <h2 className="font-display text-base font-bold">SFX Synth & Timed Dubbing (SRT/VTT + TTS)</h2>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {['slash', 'coin', 'laser', 'impact', 'ui_chime', 'jump'].map((pr) => (
              <FilterChip
                key={pr}
                selected={sfxPreset === pr}
                onClick={() => {
                  setSfxPreset(pr);
                  setSfx(Generators.generateSfxSpec(sfxSeed, pr));
                }}
                className="shrink-0"
              >
                {pr}
              </FilterChip>
            ))}
          </div>
          <HiDpiCanvas
            dprCap={state.deviceProfile.dprCap}
            className="h-24 w-full rounded-xl"
            onDraw={(ctx, w, h) => GeneratorRenderers.drawSfxWaveformCanvas(ctx, w, h, sfx)}
          />
          <ActionButton fullWidth onClick={() => SoundEngine.playCustomSfx(sfx)}>
            Play Synthesized SFX ({sfx.wave} {Math.round(sfx.freqStart)}→{Math.round(sfx.freqEnd)}Hz)
          </ActionButton>

          <hr style={{ borderColor: 'var(--me-border)' }} />

          <TextField label="Speaker" value={speaker} onChange={setSpeaker} />
          <TextField label="Voice Line" value={line} onChange={setLine} />
          <div className="flex gap-2">
            <ActionButton
              className="flex-1"
              onClick={() => {
                const nextDub = Generators.generateDubbingSubtitleSpec(sfxSeed, speaker, line, state.lang);
                setDub(nextDub);
                SoundEngine.speakText(nextDub.line, state.lang);
              }}
            >
              Speak & Gen
            </ActionButton>
            <ActionButton variant="outline" onClick={() => exportFile(`dub_${dub.seed}.srt`, dub.srtText, 'text/plain')}>
              .SRT
            </ActionButton>
            <ActionButton variant="outline" onClick={() => exportFile(`dub_${dub.seed}.vtt`, dub.vttText, 'text/vtt')}>
              .VTT
            </ActionButton>
          </div>
          <pre
            className="font-mono-code overflow-x-auto rounded-xl p-2.5 text-[11px]"
            style={{ backgroundColor: 'var(--me-bg)', color: 'var(--me-text-muted)' }}
          >
            {dub.srtText}
          </pre>
        </Card>
      )}

      {subTab === 5 && (
        <Card className="space-y-3">
          <h2 className="font-display text-base font-bold">Verb-Driven Cutscene & Storyboard Composer</h2>
          <TextField label="Action Verbs (jalan lompat dash serang)" value={verbPrompt} onChange={setVerbPrompt} />
          <HiDpiCanvas
            dprCap={state.deviceProfile.dprCap}
            className="h-40 w-full rounded-xl"
            onDraw={(ctx, w, h) =>
              GeneratorRenderers.drawCutsceneCanvas(ctx, w, h, cutscene, playhead, style, state.styleOverrides)
            }
          />
          <p className="tabular-nums text-xs font-medium" style={{ color: 'var(--me-primary)' }}>
            {playhead.toFixed(1)}s / {cutscene.durationSec}s · {activeCaption}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <ActionButton
              onClick={() => {
                setCutscene(Generators.composeMovieFromPrompt(verbPrompt, 606, state.weather));
                setPlayhead(0);
              }}
            >
              Compose
            </ActionButton>
            <ActionButton variant="tonal" onClick={() => setCutPlaying((p) => !p)}>
              {cutPlaying ? 'Pause' : 'Play'}
            </ActionButton>
            <ActionButton
              variant="outline"
              onClick={() =>
                exportFile(
                  `storyboard_${cutscene.seed}.json`,
                  cutscene.keyframes.map((k) => `${k.timeSec}s: ${k.pose} - ${k.caption}`).join('\n'),
                  'application/json'
                )
              }
            >
              Export
            </ActionButton>
          </div>
        </Card>
      )}

      {subTab === 6 && (
        <Card className="space-y-3">
          <h2 className="font-display text-base font-bold">Procedural 2D / 3D-Heightmap Terrain</h2>
          <div className="grid grid-cols-2 gap-2">
            {(['2D-Ridge', '3D-Heightmap'] as const).map((m) => (
              <FilterChip
                key={m}
                selected={terrainMode === m}
                onClick={() => {
                  setTerrainMode(m);
                  setTerrain(Generators.generateTerrainSpec(terrainSeed, m, terrainBiome));
                }}
              >
                {m}
              </FilterChip>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['dawn', 'storm', 'obsidian'] as const).map((b) => (
              <FilterChip
                key={b}
                selected={terrainBiome === b}
                onClick={() => {
                  setTerrainBiome(b);
                  setTerrain(Generators.generateTerrainSpec(terrainSeed, terrainMode, b));
                }}
              >
                {b.toUpperCase()}
              </FilterChip>
            ))}
          </div>
          <HiDpiCanvas
            dprCap={state.deviceProfile.dprCap}
            className="h-40 w-full rounded-xl"
            onDraw={(ctx, w, h) => GeneratorRenderers.drawTerrainCanvas(ctx, w, h, terrain, style)}
          />
          <ActionButton
            fullWidth
            onClick={() => {
              const next = terrainSeed + 11;
              setTerrainSeed(next);
              setTerrain(Generators.generateTerrainSpec(next, terrainMode, terrainBiome));
            }}
          >
            Generate New Seed Terrain
          </ActionButton>
        </Card>
      )}

      {subTab === 7 && (
        <Card className="space-y-3">
          <h2 className="font-display text-base font-bold">Complete Game Blueprint Forge + FSM</h2>
          <TextField label="1-Prompt Full Game Spec" value={forgePrompt} onChange={setForgePrompt} />
          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              onClick={() => {
                setBlueprint(
                  MeshAndBlueprintGenerators.generateCompleteGameBlueprint(
                    808 + forgePrompt.length,
                    forgePrompt,
                    state.activeGitHubRepoId
                  )
                );
                setFsmSpec(
                  Generators.generateStateMachineSpec(
                    808,
                    fsmSpec.kind === 'behavior' ? 'movement' : 'behavior',
                    forgePrompt
                  )
                );
              }}
            >
              Synthesize
            </ActionButton>
            <ActionButton variant="tonal" onClick={() => launchBlueprint(blueprint)}>
              Launch Game
            </ActionButton>
          </div>
          <div className="text-sm font-bold" style={{ color: 'var(--me-primary)' }}>
            {blueprint.title} · {blueprint.hybridMode} · {blueprint.cameraPreset}
          </div>
          <p className="text-xs">
            Budget A70: {blueprint.budgetReport.targetFps} FPS · {blueprint.budgetReport.drawCallsEst} DC ·{' '}
            {blueprint.budgetReport.trisEst} tris · Pass={String(blueprint.budgetReport.passesA70)}
          </p>
          <p className="text-xs" style={{ color: 'var(--me-text-muted)' }}>
            FSM ({fsmSpec.kind}): {fsmSpec.states.join(' → ')}
          </p>
        </Card>
      )}
    </div>
  );
};
