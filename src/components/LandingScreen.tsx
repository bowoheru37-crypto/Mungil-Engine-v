import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Code2,
  Play,
  Sliders,
  Sparkles,
  Terminal,
  Volume2,
  VolumeX,
  Wand2,
  Wrench
} from 'lucide-react';
import { GameCanvasRenderers } from '../canvas/gameCanvasRenderers';
import { ArtStyles } from '../engine/artStyles';
import { I18n } from '../engine/i18n';
import { SoundEngine } from '../engine/soundEngine';
import {
  AiPlayMode,
  ArtStyleId,
  CharacterAnimState,
  LANGUAGE_OPTIONS,
  RENDER_MODES,
  RenderMode
} from '../engine/types';
import { useEngineStore } from '../state/useEngineStore';
import { ActionButton, Card, FilterChip } from './ui/Primitives';

const DEMO_POSES: CharacterAnimState[] = ['idle', 'walk', 'jump', 'attack', 'dash'];

const CURATED_PROMPTS = [
  'Cyberpunk Neon Runner with Dash Parry',
  'Isometric Desa Fajar Light RPG',
  'Raycast Menara Kala Boss Dungeon',
  'Space Danmaku Guardian Shooter'
];

export const LandingScreen: React.FC = () => {
  const {
    state,
    lastForgeBundle,
    openStudioTab,
    openTitleStage,
    startOrRestartLevel,
    forgeInstaplayPrompt,
    loadProgress,
    updateSettings,
    showBanner
  } = useEngineStore();

  const tr = I18n.t(state.lang);
  const [promptText, setPromptText] = useState('Cyber Guardian Isometric Light Quest');
  const [dimMode, setDimMode] = useState<RenderMode>(state.renderMode);
  const [pickStyle, setPickStyle] = useState<ArtStyleId>(state.styleId);
  const [pickAi, setPickAi] = useState<AiPlayMode>('coop');
  const [preview3D, setPreview3D] = useState(true);
  const [poseIdx, setPoseIdx] = useState(0);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  // Ref-driven preview canvas loop: ZERO React setState calls per animation frame
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewConfigRef = useRef({
    styleId: state.styleId,
    customPalettes: state.customPalettes,
    styleOverrides: state.styleOverrides,
    activeLevel: state.activeLevel,
    customCharacter: state.customCharacter,
    dprCap: state.deviceProfile.dprCap,
    preview3D,
    poseIdx
  });
  previewConfigRef.current = {
    styleId: state.styleId,
    customPalettes: state.customPalettes,
    styleOverrides: state.styleOverrides,
    activeLevel: state.activeLevel,
    customCharacter: state.customCharacter,
    dprCap: state.deviceProfile.dprCap,
    preview3D,
    poseIdx
  };

  useEffect(() => {
    let rafId = 0;
    let lastMs = performance.now();
    let animTime = 0;

    const tick = (nowMs: number) => {
      const dt = Math.min(0.05, Math.max(0, (nowMs - lastMs) / 1000));
      lastMs = nowMs;
      animTime += dt;

      const canvas = previewCanvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        if (rect.width >= 2 && rect.height >= 2) {
          const cfg = previewConfigRef.current;
          const dpr = Math.min(window.devicePixelRatio || 1, cfg.dprCap);
          const targetW = Math.round(rect.width * dpr);
          const targetH = Math.round(rect.height * dpr);
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const style = ArtStyles.getStyleSpec(cfg.styleId, cfg.customPalettes);
            ctx.save();
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const w = rect.width;
            const h = rect.height;
            const skyTop = ArtStyles.applyStyleTint(
              cfg.activeLevel === 3 ? '#0A0714' : cfg.activeLevel === 2 ? '#0F172A' : style.palette[0],
              cfg.styleOverrides
            );
            const skyBot = ArtStyles.applyStyleTint(
              cfg.activeLevel === 3 ? '#1E1133' : cfg.activeLevel === 2 ? '#1E3A5F' : '#D9F2FF',
              cfg.styleOverrides
            );
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, skyTop);
            grad.addColorStop(1, skyBot);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            GameCanvasRenderers.drawMode7Horizon(
              ctx,
              w,
              h - 68,
              h - 34,
              animTime * 48,
              style,
              cfg.activeLevel,
              cfg.styleOverrides
            );
            GameCanvasRenderers.drawGroundTile(ctx, 0, h - 36, w, 36, style, cfg.activeLevel, cfg.styleOverrides);
            GameCanvasRenderers.drawTreeAsset(ctx, 68, h - 36, 0.9, style, cfg.styleOverrides);
            GameCanvasRenderers.drawGateAsset(ctx, w - 76, h - 102, 40, 66, true, style, animTime, cfg.styleOverrides);
            GameCanvasRenderers.drawBowoCharacter(
              ctx,
              w * 0.36,
              h - 56,
              28,
              style,
              DEMO_POSES[cfg.poseIdx % DEMO_POSES.length],
              1,
              animTime,
              cfg.preview3D,
              cfg.preview3D ? Math.sin(animTime * 1.4) * 0.48 : 0.32,
              -0.15,
              cfg.styleOverrides,
              cfg.customCharacter
            );
            GameCanvasRenderers.drawEnemyEntity(
              ctx,
              cfg.activeLevel === 3 ? 'boss_kala' : 'slime',
              w * 0.64,
              h - (cfg.activeLevel === 3 ? 62 : 50),
              cfg.activeLevel === 3 ? 22 : 14,
              style,
              animTime,
              0,
              Math.sin(animTime * 2) > 0.4 ? 0.5 : 0,
              0,
              2,
              cfg.styleOverrides
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

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: 'var(--me-bg)', color: 'var(--me-text)' }}>
      {/* Clean 3-Zone Sticky Top Bar */}
      <header
        className="sticky top-0 z-20 border-b"
        style={{
          backgroundColor: 'var(--me-surface)',
          borderColor: 'var(--me-border)'
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="min-w-0">
            <h1 className="font-display truncate text-base font-bold sm:text-lg" style={{ color: 'var(--me-text)' }}>
              Mungil Engine
            </h1>
            <p className="tabular-nums truncate text-xs" style={{ color: 'var(--me-text-muted)' }}>
              {state.isOnline ? tr.onlineBadge : tr.offlineBadge} · {state.deviceProfile.activeTier.toUpperCase()} (
              {state.deviceProfile.targetFps} FPS) · 12-Layer Core
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              aria-label="Toggle Sound"
              onClick={() => {
                SoundEngine.playSfx('ui_toggle');
                updateSettings((s) => ({ ...s, muted: !s.muted }));
              }}
              className="inline-flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-xl border"
              style={{
                backgroundColor: 'var(--me-surface-variant)',
                borderColor: 'var(--me-border)',
                color: 'var(--me-text)'
              }}
            >
              {state.muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <ActionButton
              onClick={() => {
                SoundEngine.playSfx('ui_click');
                openStudioTab('play');
              }}
              variant="outline"
              className="whitespace-nowrap px-3 sm:px-4"
            >
              <Wrench className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{tr.openStudio}</span>
              <span className="sm:hidden">Studio</span>
            </ActionButton>
            <ActionButton
              onClick={() => {
                SoundEngine.playSfx('ui_click');
                startOrRestartLevel(state.activeLevel);
              }}
              className="whitespace-nowrap px-3 sm:px-4"
            >
              <Play className="h-4 w-4 shrink-0 fill-current" />
              <span className="hidden sm:inline">{tr.playGame}</span>
              <span className="sm:hidden">Play</span>
            </ActionButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 pt-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* LEFT COLUMN: Instaplay Prompt-to-Playable-Game Forge + Multi-Agent Pipeline */}
          <div className="space-y-4 lg:col-span-7">
            <section
              className="overflow-hidden rounded-2xl border"
              style={{ backgroundColor: 'var(--me-surface)', borderColor: 'var(--me-border)' }}
            >
              <div
                className="relative h-40 w-full sm:h-48"
                style={{
                  background: 'linear-gradient(135deg, #0b1933 0%, #172f59 55%, #0e7490 100%)'
                }}
              >
                {!heroImgFailed && (
                  <img
                    src="/assets/img_hero_stage.jpg"
                    alt="Mungil Engine Prompt-to-Game Stage"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="h-full w-full object-cover"
                  />
                )}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(11,18,33,0.18) 0%, var(--me-surface) 100%)'
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h2 className="font-display text-xl font-bold sm:text-2xl" style={{ color: 'var(--me-text)' }}>
                    Prompt-to-Playable Game Creator
                  </h2>
                  <p className="text-xs font-medium" style={{ color: 'var(--me-primary)' }}>
                    6-Agent Instaplay Forge · Zero External API Key · Itel A70 Certified
                  </p>
                </div>
              </div>

              <div className="space-y-3 p-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold" style={{ color: 'var(--me-text-muted)' }}>
                    Describe the game you want to build &amp; edit
                  </span>
                  <textarea
                    rows={2}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="e.g. Cyberpunk Neon Runner with Dash Parry & 3-Phase Boss..."
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-400/60"
                    style={{
                      backgroundColor: 'var(--me-bg)',
                      borderColor: 'var(--me-border)',
                      color: 'var(--me-text)'
                    }}
                  />
                </label>

                <div className="flex flex-wrap gap-1.5">
                  {CURATED_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        SoundEngine.playSfx('ui_click');
                        setPromptText(p);
                      }}
                      className="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: 'var(--me-surface-variant)',
                        borderColor: promptText === p ? 'var(--me-primary)' : 'var(--me-border)',
                        color: 'var(--me-text)'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--me-text-muted)' }}>
                        Dimension
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {RENDER_MODES.map((m) => (
                          <FilterChip
                            key={m}
                            selected={dimMode === m}
                            onClick={() => setDimMode(m)}
                            className="whitespace-nowrap px-2"
                          >
                            {m}
                          </FilterChip>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--me-text-muted)' }}>
                        Luma AI Agent
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['off', 'coop', 'autopilot'] as AiPlayMode[]).map((ai) => (
                          <FilterChip
                            key={ai}
                            selected={pickAi === ai}
                            onClick={() => setPickAi(ai)}
                            className="whitespace-nowrap px-2 capitalize"
                          >
                            {ai}
                          </FilterChip>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--me-text-muted)' }}>
                      Art Style
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      {(['pixel', 'cyberpunk', 'anime', 'isometric'] as ArtStyleId[]).map((st) => (
                        <FilterChip
                          key={st}
                          selected={pickStyle === st}
                          onClick={() => setPickStyle(st)}
                          className="whitespace-nowrap capitalize"
                        >
                          {st}
                        </FilterChip>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <ActionButton
                    fullWidth
                    onClick={() => {
                      SoundEngine.playSfx('shard');
                      forgeInstaplayPrompt(
                        promptText,
                        { renderMode: dimMode, styleId: pickStyle, aiMode: pickAi },
                        true
                      );
                    }}
                  >
                    <Wand2 className="h-4 w-4" />
                    <span>Build &amp; Play Instantly</span>
                  </ActionButton>
                  <ActionButton
                    variant="tonal"
                    fullWidth
                    onClick={() => {
                      SoundEngine.playSfx('ui_tab');
                      const b = forgeInstaplayPrompt(
                        promptText,
                        { renderMode: dimMode, styleId: pickStyle, aiMode: pickAi },
                        false
                      );
                      showBanner(`6 Agents forged "${b.blueprint.title}" (${b.blueprint.genreId})`);
                    }}
                  >
                    <Bot className="h-4 w-4" />
                    <span>Synthesize 6-Agent Blueprint</span>
                  </ActionButton>
                </div>
              </div>
            </section>

            {/* Synthesized 6-Agent Output Preview + Editable Studio Links */}
            {lastForgeBundle && (
              <Card className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-bold">
                      Active Forge Spec: {lastForgeBundle.blueprint.title}
                    </h3>
                    <p className="tabular-nums text-xs" style={{ color: 'var(--me-primary)' }}>
                      Seed #{lastForgeBundle.seed} · {lastForgeBundle.blueprint.genreId.toUpperCase()} ·{' '}
                      {lastForgeBundle.blueprint.hybridMode} · {lastForgeBundle.track.bpm} BPM
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <ActionButton variant="outline" onClick={() => openStudioTab('scene')}>
                      Edit Scene
                    </ActionButton>
                    <ActionButton variant="outline" onClick={() => openStudioTab('lab')}>
                      <Code2 className="h-4 w-4" />
                      <span>Script VM</span>
                    </ActionButton>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {lastForgeBundle.agentSteps.map((step) => (
                    <div
                      key={step.agent}
                      className="flex items-start gap-2 rounded-xl border p-2.5"
                      style={{ backgroundColor: 'var(--me-surface-variant)', borderColor: 'var(--me-border)' }}
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold">{step.agent}</div>
                        <div className="text-[11px]" style={{ color: 'var(--me-text-muted)' }}>
                          {step.output}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* 01. Three-Chapter Action RPG Loop */}
            <Card className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-bold">Three-Chapter Action RPG Campaign</h3>
                  <p className="text-xs" style={{ color: 'var(--me-text-muted)' }}>
                    30-60 FPS · Coyote Time · Dash Parry · 3 Web Audio Tracker BGM Tracks
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 2, 3].map((lvl) => (
                    <FilterChip
                      key={lvl}
                      selected={state.activeLevel === lvl}
                      onClick={() => {
                        SoundEngine.playSfx('ui_click');
                        updateSettings((s) => ({ ...s, activeLevel: lvl }));
                      }}
                    >
                      {tr.levelLabel} {lvl}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  {
                    lvl: 1,
                    meta: 'Lv.1 · Dawn Village',
                    name: 'Desa Fajar',
                    desc: 'Collect 2 Light Shards, patrol Slimes, open East Gate.'
                  },
                  {
                    lvl: 2,
                    meta: 'Lv.2 · Storm Bridge',
                    name: 'Jembatan Badai',
                    desc: 'Trigger 2 switches, Dash Parry Wisp bolts, 3 Shards.'
                  },
                  {
                    lvl: 3,
                    meta: 'Lv.3 · Boss Tower',
                    name: 'Menara Kala',
                    desc: 'Battle 3-phase Boss Kala with parry bursts.'
                  }
                ].map((ch) => (
                  <button
                    key={ch.meta}
                    type="button"
                    onClick={() => {
                      SoundEngine.playSfx('ui_click');
                      startOrRestartLevel(ch.lvl);
                    }}
                    className="cursor-pointer rounded-xl border p-3 text-left transition-colors hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--me-surface-variant)',
                      borderColor: state.activeLevel === ch.lvl ? 'var(--me-primary)' : 'var(--me-border)'
                    }}
                  >
                    <div className="text-xs font-semibold" style={{ color: 'var(--me-primary)' }}>
                      {ch.meta}
                    </div>
                    <div className="text-sm font-bold">{ch.name}</div>
                    <div className="text-xs" style={{ color: 'var(--me-text-muted)' }}>
                      {ch.desc}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: Zero-Re-Render Live Engine Preview + Studio & Export Access */}
          <div className="space-y-4 lg:col-span-5">
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold">Live Engine Preview Stage</h3>
                <span className="tabular-nums text-xs font-medium" style={{ color: 'var(--me-primary)' }}>
                  {state.styleId.toUpperCase()}
                </span>
              </div>
              <canvas ref={previewCanvasRef} className="h-48 w-full rounded-xl border" style={{ borderColor: 'var(--me-border)' }} />

              <div className="grid grid-cols-3 gap-2">
                <ActionButton
                  variant="tonal"
                  onClick={() => {
                    SoundEngine.playSfx('ui_toggle');
                    setPreview3D((p) => !p);
                  }}
                >
                  {preview3D ? 'Rig: 3D-Stack' : 'Rig: 2D'}
                </ActionButton>
                <ActionButton
                  variant="tonal"
                  onClick={() => {
                    SoundEngine.playSfx('ui_click');
                    setPoseIdx((i) => (i + 1) % DEMO_POSES.length);
                  }}
                >
                  Pose: {DEMO_POSES[poseIdx % DEMO_POSES.length]}
                </ActionButton>
                <ActionButton
                  variant="outline"
                  onClick={() => {
                    SoundEngine.playSfx('ui_toggle');
                    updateSettings((s) => ({ ...s, darkTheme: !s.darkTheme }));
                  }}
                >
                  {state.darkTheme ? 'Dark' : 'Light'}
                </ActionButton>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {LANGUAGE_OPTIONS.map((lc) => (
                  <FilterChip
                    key={lc.code}
                    selected={state.lang === lc.code}
                    onClick={() => {
                      SoundEngine.playSfx('ui_toggle');
                      updateSettings((s) => ({ ...s, lang: lc.code }));
                    }}
                  >
                    {lc.code.toUpperCase()}
                  </FilterChip>
                ))}
              </div>
            </Card>

            {state.latestSave?.exists && (
              <button
                type="button"
                onClick={() => {
                  SoundEngine.playSfx('ui_click');
                  loadProgress(state.latestSave!.id, true);
                }}
                className="flex min-h-12 w-full cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--me-secondary) 14%, var(--me-surface))',
                  borderColor: 'color-mix(in srgb, var(--me-secondary) 45%, var(--me-border))'
                }}
              >
                <span className="text-sm font-semibold" style={{ color: 'var(--me-secondary)' }}>
                  {tr.continueSaved} (
                  {state.latestSave.id === 'auto' ? tr.autoSaveLabel : `${tr.slotLabel} ${state.latestSave.id}`})
                </span>
                <span className="tabular-nums text-xs" style={{ color: 'var(--me-text-muted)' }}>
                  Lv.{state.latestSave.level} · HP {state.latestSave.hp} · {tr.scoreLabel} {state.latestSave.score}
                </span>
              </button>
            )}

            <Card className="space-y-2.5">
              <div>
                <h3 className="font-display text-base font-bold">Unified Studio &amp; Platform Export</h3>
                <p className="text-xs" style={{ color: 'var(--me-text-muted)' }}>
                  Edit assets, physics, bytecode VM, touch UI, and export standalone playable HTML5 or APK packs
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ActionButton
                  onClick={() => {
                    SoundEngine.playSfx('ui_tab');
                    openStudioTab('generators');
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generators</span>
                </ActionButton>
                <ActionButton
                  variant="outline"
                  onClick={() => {
                    SoundEngine.playSfx('ui_tab');
                    openStudioTab('play');
                  }}
                >
                  <Wrench className="h-4 w-4" />
                  <span>{tr.openStudio}</span>
                </ActionButton>
                <ActionButton
                  variant="tonal"
                  onClick={() => {
                    SoundEngine.playSfx('ui_tab');
                    openStudioTab('agent');
                  }}
                >
                  Qolbu AI &amp; MCP
                </ActionButton>
                <ActionButton
                  variant="tonal"
                  onClick={() => {
                    SoundEngine.playSfx('ui_tab');
                    openStudioTab('arena');
                  }}
                >
                  Arena AI
                </ActionButton>
                <ActionButton
                  variant="outline"
                  onClick={() => {
                    SoundEngine.playSfx('ui_tab');
                    openStudioTab('lab');
                  }}
                >
                  12-Layer Lab &amp; VM
                </ActionButton>
                <ActionButton
                  variant="outline"
                  onClick={() => {
                    SoundEngine.playSfx('ui_tab');
                    openStudioTab('export');
                  }}
                >
                  Export HTML5 / APK
                </ActionButton>
                <ActionButton
                  variant="outline"
                  onClick={() => {
                    SoundEngine.playSfx('ui_click');
                    openTitleStage();
                  }}
                >
                  Title Stage
                </ActionButton>
                <ActionButton
                  variant="outline"
                  onClick={() => {
                    SoundEngine.playSfx('ui_tab');
                    openStudioTab('controls');
                  }}
                >
                  <Sliders className="h-4 w-4" />
                  <span>{tr.controlsBtn}</span>
                </ActionButton>
              </div>
              <ActionButton
                variant="outline"
                fullWidth
                onClick={() => {
                  SoundEngine.playSfx('ui_tab');
                  openStudioTab('skills');
                }}
              >
                <Terminal className="h-4 w-4" />
                <span>Multi-Agent AI Skills (Claude / Gemini / Grok / Qwen)</span>
              </ActionButton>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
