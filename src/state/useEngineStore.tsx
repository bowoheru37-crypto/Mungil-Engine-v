import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AssetManager } from '../engine/agentSkills';
import { AiMcpAgent, InstaplayForgeBundle, LOCAL_MCP_TOOLS } from '../engine/aiMcpAgent';
import { ArtStyles } from '../engine/artStyles';
import { DeviceProfiler } from '../engine/deviceProfiler';
import { GameSimulation, GameWorld } from '../engine/gameSimulation';
import { SimEvent } from '../engine/gameSimulationData';
import { GitHubConnectors, GitHubSearchResponse } from '../engine/githubConnectors';
import { QolbuCore } from '../engine/qolbuCore';
import { SceneHierarchy } from '../engine/sceneHierarchy';
import { SoundEngine } from '../engine/soundEngine';
import {
  DEFAULT_ANALYTICS,
  DEFAULT_AUTH,
  DEFAULT_TOUCH_CONFIG,
  StorageRepository
} from '../engine/storageRepository';
import {
  AiPlayMode,
  AppUiState,
  ArtStyleId,
  DeviceTierId,
  GeneratedGameBlueprintSpec,
  GenreTemplate,
  GitHubRepoCategory,
  RenderMode,
  SceneEntityNode,
  StudioTab,
  WizardGameSpec
} from '../engine/types';

function shouldAutostart(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  } catch {
    return false;
  }
}

function createInitialState(): { state: AppUiState; world: GameWorld; assetManager: AssetManager } {
  const assetManager = new AssetManager(2_097_152);
  const world = GameSimulation.createLevelWorld(1);
  const deviceProfile = DeviceProfiler.createDeviceProfile('auto', true);
  const touchConfig = StorageRepository.loadTouchConfig() ?? DEFAULT_TOUCH_CONFIG;
  const auth = StorageRepository.loadAuthProfile() ?? DEFAULT_AUTH;
  const analytics = StorageRepository.loadAnalytics() ?? DEFAULT_ANALYTICS;
  const eventRules = StorageRepository.loadEventRules();
  const myWizardGames = StorageRepository.loadWizardGames();
  const saveSummaries = StorageRepository.listSaveSummaries();
  const latestSave = StorageRepository.getLatestSaveSlot();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const autostart = shouldAutostart();
  if (autostart) {
    assetManager.loadLevelBundle(1);
  }

  const state: AppUiState = {
    shellState: autostart ? 'PLAYING' : 'LANDING',
    studioTab: 'play',
    gameName: 'Bowo: Penjaga Cahaya',
    activeLevel: 1,
    requestedTier: 'auto',
    powerSaveAuto: true,
    deviceProfile,
    styleId: 'pixel',
    customPalettes: {},
    styleOverrides: { ...ArtStyles.DEFAULT_STYLE_OVERRIDES },
    renderMode: '2.5D',
    physicsMode: 'Arcade',
    weather: 'Cerah',
    practiceMode: false,
    physicsDebug: false,
    activeGenreId: 'platformer',
    aiMode: 'off',
    perspectiveConnector: '2_5d_parallax',
    cameraPreset: 'follow_3_4',
    hybridMode: 'hybrid_2_5d_billboard',
    activeGitHubRepoId: 'gh_axmol',
    visualQuality: 'mobile_eco',
    sceneEntities: SceneHierarchy.createDefaultSceneEntities(1),
    speedMul: 1,
    gravityMul: 1,
    touchConfig,
    darkTheme: true,
    lang: 'id',
    fontSizePx: 14,
    highContrast: false,
    reduceShake: false,
    muted: false,
    isOnline,
    auth,
    analyticsEnabled: true,
    analytics,
    customCharacter: null,
    eventRules,
    myWizardGames,
    activeArenaSpec: null,
    forcedArenaMode: null,
    saveSummaries,
    latestSave,
    hud: GameSimulation.toHudSnapshot(world, deviceProfile.targetFps, deviceProfile.dynamicScale, 'off'),
    customBytecodeSrc: 'SET 10\nADD 5\nMUL 2\nSPAWN 2\nEMIT 1\nSAY 77\nEND',
    statusBanner: null,
    mcpLogs: ['[MCP] Ready: 16 local offline tools initialized.']
  };
  return { state, world, assetManager };
}

export interface EngineStoreContextValue {
  state: AppUiState;
  lastForgeBundle: InstaplayForgeBundle | null;
  activeWorldRef: React.MutableRefObject<GameWorld>;
  assetManagerRef: React.MutableRefObject<AssetManager>;
  showBanner: (msg: string) => void;
  clearBanner: () => void;
  openStudioTab: (tab: StudioTab) => void;
  backToLanding: () => void;
  openTitleStage: () => void;
  startOrRestartLevel: (level?: number, genre?: GenreTemplate | null, aiOverride?: AiPlayMode | null) => void;
  launchBlueprint: (bp: GeneratedGameBlueprintSpec) => void;
  forgeInstaplayPrompt: (
    prompt: string,
    opts?: { renderMode?: RenderMode; styleId?: ArtStyleId; aiMode?: AiPlayMode },
    launchNow?: boolean
  ) => InstaplayForgeBundle;
  pauseGame: () => void;
  resumeGame: () => void;
  syncWorldEventsAndHud: (events: SimEvent[], fps: number) => void;
  triggerPotion: () => void;
  chooseVnOption: (index: number) => void;
  saveProgress: (slotId: string) => [boolean, number];
  loadProgress: (slotId: string, launchImmediately: boolean) => boolean;
  importSaveJson: (rawJson: string) => string;
  deleteSaveSlot: (slotId: string) => void;
  addBonusCoinsPotions: (coins: number, potions: number) => void;
  setDeviceTier: (tier: DeviceTierId, powerSave?: boolean) => void;
  updateSettings: (transform: (prev: AppUiState) => AppUiState) => void;
  executeLocalMcpTool: (toolId: string) => void;
  playWizardGame: (spec: WizardGameSpec) => void;
  loadGitHubLiveSearch: (query: string, cat: GitHubRepoCategory) => Promise<GitHubSearchResponse>;
  exportFile: (filename: string, content: string | Uint8Array, mimeType?: string) => void;
  copyText: (label: string, text: string) => void;
}

const EngineStoreContext = createContext<EngineStoreContextValue | null>(null);

export const EngineStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initRef = useRef<ReturnType<typeof createInitialState> | null>(null);
  if (!initRef.current) {
    initRef.current = createInitialState();
  }
  const [state, setState] = useState<AppUiState>(initRef.current.state);
  const [lastForgeBundle, setLastForgeBundle] = useState<InstaplayForgeBundle | null>(() =>
    AiMcpAgent.runMultiAgentGameForge('Cyber Guardian Lentera Quest')
  );
  const activeWorldRef = useRef<GameWorld>(initRef.current.world);
  const assetManagerRef = useRef<AssetManager>(initRef.current.assetManager);
  const stateRef = useRef<AppUiState>(state);
  stateRef.current = state;

  // Apply CSS theme classes, data-theme & font scaling
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', state.darkTheme);
    root.classList.toggle('high-contrast', state.highContrast);
    root.dataset.theme = state.highContrast ? 'high-contrast' : state.darkTheme ? 'dark' : 'light';
    root.style.fontSize = `${state.fontSizePx}px`;
    root.style.setProperty('--me-base-font', `${state.fontSizePx}px`);
  }, [state.darkTheme, state.highContrast, state.fontSizePx]);

  // Mirror shell state on document.body.dataset.state for deterministic harness / accessibility tracking
  useEffect(() => {
    const map: Record<AppUiState['shellState'], string> = {
      LANDING: 'landing',
      TITLE: 'title',
      PLAYING: 'playing',
      PAUSED: 'paused',
      VICTORY: 'gameover',
      GAMEOVER: 'gameover',
      STUDIO: 'studio'
    };
    document.body.dataset.state = map[state.shellState] ?? 'landing';
  }, [state.shellState]);

  // Listen for browser online/offline & page visibility lifecycle
  useEffect(() => {
    const onOnline = () => setState((prev) => ({ ...prev, isOnline: true }));
    const onOffline = () => setState((prev) => ({ ...prev, isOnline: false }));
    const onVisibility = () => {
      if (document.hidden) {
        SoundEngine.suspend();
      } else {
        SoundEngine.resume();
        if (stateRef.current.shellState === 'PLAYING') {
          SoundEngine.startTracker(stateRef.current.activeLevel);
        }
      }
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Auto-dismiss banner after 3.2s
  useEffect(() => {
    if (!state.statusBanner) return;
    const t = window.setTimeout(() => {
      setState((prev) => ({ ...prev, statusBanner: null }));
    }, 3200);
    return () => window.clearTimeout(t);
  }, [state.statusBanner]);

  const showBanner = useCallback((msg: string) => {
    setState((prev) => ({ ...prev, statusBanner: msg }));
  }, []);

  const clearBanner = useCallback(() => {
    setState((prev) => ({ ...prev, statusBanner: null }));
  }, []);

  const openStudioTab = useCallback((tab: StudioTab) => {
    SoundEngine.stopTracker();
    setState((prev) => ({ ...prev, shellState: 'STUDIO', studioTab: tab }));
  }, []);

  const backToLanding = useCallback(() => {
    SoundEngine.stopTracker();
    setState((prev) => ({ ...prev, shellState: 'LANDING' }));
  }, []);

  const openTitleStage = useCallback(() => {
    SoundEngine.stopTracker();
    setState((prev) => ({ ...prev, shellState: 'TITLE' }));
  }, []);

  const saveProgress = useCallback((slotId: string): [boolean, number] => {
    const cur = stateRef.current;
    const world = activeWorldRef.current;
    const ws = GameSimulation.extractWorldSaveProgress(world);
    const payload = StorageRepository.buildSavePayload({
      slotId,
      gameTitle: cur.gameName,
      level: world.level,
      hp: world.player.hp,
      energy: Math.floor(world.player.energy),
      coins: world.coinsTotal,
      shards: world.shardsTotal,
      score: world.score,
      kills: world.kills,
      potions: world.potions,
      styleId: cur.styleId,
      worldState: ws
    });
    const res = StorageRepository.saveSlotLocal(slotId, payload);
    setState((prev) => ({
      ...prev,
      saveSummaries: StorageRepository.listSaveSummaries(),
      latestSave: StorageRepository.getLatestSaveSlot()
    }));
    return res;
  }, []);

  const startOrRestartLevel = useCallback(
    (level?: number, genre: GenreTemplate | null = null, aiOverride: AiPlayMode | null = null) => {
      const cur = stateRef.current;
      const lvl = Math.min(3, Math.max(1, level ?? cur.activeLevel));
      const nextGenreId = genre?.id ?? cur.activeGenreId;
      const nextAi = aiOverride ?? cur.aiMode;
      const nextRender = genre?.renderMode ?? cur.renderMode;
      const nextPhysics = genre?.physicsMode ?? cur.physicsMode;
      const nextStyle = genre?.styleId ?? cur.styleId;
      const nextWeather = genre?.weather ?? cur.weather;
      const nextGrav = genre?.gravityMul ?? cur.gravityMul;
      const nextSpd = genre?.speedMul ?? cur.speedMul;

      assetManagerRef.current.loadLevelBundle(lvl);
      const nextWorld = GameSimulation.createLevelWorld(lvl, cur.customCharacter, nextGenreId);
      activeWorldRef.current = nextWorld;

      const nextAnalytics = cur.analyticsEnabled
        ? { ...cur.analytics, sessions: cur.analytics.sessions + 1 }
        : cur.analytics;
      if (cur.analyticsEnabled) StorageRepository.saveAnalytics(nextAnalytics);

      setState((prev) => ({
        ...prev,
        shellState: 'PLAYING',
        activeLevel: lvl,
        activeGenreId: nextGenreId,
        aiMode: nextAi,
        renderMode: nextRender,
        physicsMode: nextPhysics,
        styleId: nextStyle,
        weather: nextWeather,
        gravityMul: nextGrav,
        speedMul: nextSpd,
        sceneEntities: SceneHierarchy.createDefaultSceneEntities(lvl),
        analytics: nextAnalytics,
        hud: GameSimulation.toHudSnapshot(
          nextWorld,
          prev.deviceProfile.targetFps,
          prev.deviceProfile.dynamicScale,
          nextAi
        )
      }));
      SoundEngine.startTracker(lvl);
    },
    []
  );

  const launchBlueprint = useCallback((bp: GeneratedGameBlueprintSpec) => {
    assetManagerRef.current.loadLevelBundle(1);
    const cur = stateRef.current;
    const nextWorld = GameSimulation.createLevelWorld(1, cur.customCharacter, bp.genreId);
    activeWorldRef.current = nextWorld;
    const seen = new Set<string>();
    const mergedRules = [...bp.rules, ...cur.eventRules].filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
    StorageRepository.saveEventRules(mergedRules);

    setState((prev) => ({
      ...prev,
      shellState: 'PLAYING',
      gameName: bp.title,
      activeLevel: 1,
      activeGenreId: bp.genreId,
      perspectiveConnector: bp.perspective,
      cameraPreset: bp.cameraPreset,
      hybridMode: bp.hybridMode,
      physicsMode: bp.physicsMode,
      renderMode: bp.renderMode,
      styleId: bp.styleId,
      weather: bp.weather,
      aiMode: bp.aiMode,
      eventRules: mergedRules,
      hud: GameSimulation.toHudSnapshot(
        nextWorld,
        prev.deviceProfile.targetFps,
        prev.deviceProfile.dynamicScale,
        bp.aiMode
      )
    }));
    SoundEngine.startTracker(1);
  }, []);

  const forgeInstaplayPrompt = useCallback(
    (
      prompt: string,
      opts?: { renderMode?: RenderMode; styleId?: ArtStyleId; aiMode?: AiPlayMode },
      launchNow = false
    ): InstaplayForgeBundle => {
      const cur = stateRef.current;
      const bundle = AiMcpAgent.runMultiAgentGameForge(prompt, {
        ...opts,
        repoId: cur.activeGitHubRepoId
      });
      setLastForgeBundle(bundle);
      const bp = bundle.blueprint;
      const seen = new Set<string>();
      const mergedRules = [...bp.rules, ...cur.eventRules].filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
      StorageRepository.saveEventRules(mergedRules);

      if (launchNow) {
        assetManagerRef.current.loadLevelBundle(1);
        const nextWorld = GameSimulation.createLevelWorld(1, bundle.character, bp.genreId);
        activeWorldRef.current = nextWorld;
        setState((prev) => ({
          ...prev,
          shellState: 'PLAYING',
          gameName: bp.title,
          activeLevel: 1,
          activeGenreId: bp.genreId,
          perspectiveConnector: bp.perspective,
          cameraPreset: bp.cameraPreset,
          hybridMode: bp.hybridMode,
          physicsMode: bp.physicsMode,
          renderMode: bp.renderMode,
          styleId: bp.styleId,
          weather: bp.weather,
          aiMode: bp.aiMode,
          customCharacter: bundle.character,
          customBytecodeSrc: bundle.bytecodeSrc,
          eventRules: mergedRules,
          hud: GameSimulation.toHudSnapshot(
            nextWorld,
            prev.deviceProfile.targetFps,
            prev.deviceProfile.dynamicScale,
            bp.aiMode
          ),
          mcpLogs: [`[FORGE] Launched "${bp.title}" (${bp.genreId} / ${bp.styleId})`, ...prev.mcpLogs].slice(0, 14)
        }));
        SoundEngine.playCustomTrack(bundle.track);
      } else {
        setState((prev) => ({
          ...prev,
          gameName: bp.title,
          activeGenreId: bp.genreId,
          perspectiveConnector: bp.perspective,
          cameraPreset: bp.cameraPreset,
          hybridMode: bp.hybridMode,
          physicsMode: bp.physicsMode,
          renderMode: bp.renderMode,
          styleId: bp.styleId,
          weather: bp.weather,
          aiMode: bp.aiMode,
          customCharacter: bundle.character,
          customBytecodeSrc: bundle.bytecodeSrc,
          eventRules: mergedRules,
          mcpLogs: [`[FORGE] Synthesized "${bp.title}" via 6 AI Agents`, ...prev.mcpLogs].slice(0, 14)
        }));
      }
      return bundle;
    },
    []
  );

  const pauseGame = useCallback(() => {
    if (stateRef.current.shellState === 'PLAYING') {
      SoundEngine.stopTracker();
      setState((prev) => ({ ...prev, shellState: 'PAUSED' }));
    }
  }, []);

  const resumeGame = useCallback(() => {
    if (stateRef.current.shellState === 'PAUSED') {
      setState((prev) => ({ ...prev, shellState: 'PLAYING' }));
      SoundEngine.startTracker(stateRef.current.activeLevel);
    }
  }, []);

  const syncWorldEventsAndHud = useCallback(
    (events: SimEvent[], fps: number) => {
      for (const ev of events) {
        SoundEngine.playSfx(ev.type, ev.panX);
      }
      const cur = stateRef.current;
      const world = activeWorldRef.current;
      const hud = GameSimulation.toHudSnapshot(world, fps, cur.deviceProfile.dynamicScale, cur.aiMode);

      if (world.status === 'level_clear') {
        const nextLvl = Math.min(3, world.level + 1);
        saveProgress('auto');
        startOrRestartLevel(nextLvl);
        return;
      }
      if (world.status === 'victory') {
        SoundEngine.stopTracker();
        saveProgress('auto');
        setState((prev) => ({ ...prev, shellState: 'VICTORY', hud }));
        return;
      }
      if (world.status === 'gameover') {
        SoundEngine.stopTracker();
        const nextAn = cur.analyticsEnabled
          ? { ...cur.analytics, deaths: cur.analytics.deaths + 1 }
          : cur.analytics;
        if (cur.analyticsEnabled) StorageRepository.saveAnalytics(nextAn);
        setState((prev) => ({ ...prev, shellState: 'GAMEOVER', analytics: nextAn, hud }));
        return;
      }
      setState((prev) => ({ ...prev, hud }));
    },
    [saveProgress, startOrRestartLevel]
  );

  const triggerPotion = useCallback(() => {
    if (GameSimulation.usePotion(activeWorldRef.current)) {
      SoundEngine.playSfx('potion');
      syncWorldEventsAndHud([], stateRef.current.hud.fps);
    }
  }, [syncWorldEventsAndHud]);

  const chooseVnOption = useCallback(
    (index: number) => {
      if (GameSimulation.selectVisualNovelChoice(activeWorldRef.current, index)) {
        SoundEngine.playSfx('shard');
        syncWorldEventsAndHud([], stateRef.current.hud.fps);
      }
    },
    [syncWorldEventsAndHud]
  );

  const loadProgress = useCallback((slotId: string, launchImmediately: boolean): boolean => {
    const parsed = StorageRepository.loadSlotLocal(slotId);
    if (!parsed) return false;
    const d = parsed.data;
    assetManagerRef.current.loadLevelBundle(d.level);
    const restored = GameSimulation.restoreWorldFromSave(d, stateRef.current.customCharacter);
    activeWorldRef.current = restored;
    const validStyles: ArtStyleId[] = [
      'pixel', 'anime', 'cartoon', 'minimal', 'retro', 'cyberpunk',
      'lowpoly', 'watercolor', 'chibi', 'isometric', 'silhouette', 'voxel'
    ];
    const nextStyle: ArtStyleId = validStyles.includes(d.styleId as ArtStyleId)
      ? (d.styleId as ArtStyleId)
      : 'pixel';

    setState((prev) => ({
      ...prev,
      activeLevel: d.level,
      activeGenreId: restored.genreId,
      styleId: nextStyle,
      shellState: launchImmediately ? 'PLAYING' : prev.shellState,
      hud: GameSimulation.toHudSnapshot(
        restored,
        prev.deviceProfile.targetFps,
        prev.deviceProfile.dynamicScale,
        prev.aiMode
      )
    }));
    if (launchImmediately) SoundEngine.startTracker(d.level);
    return true;
  }, []);

  const importSaveJson = useCallback((rawJson: string): string => {
    try {
      const parsed = StorageRepository.parseAndMigrateSave(rawJson, '1');
      StorageRepository.saveSlotLocal('1', parsed.data);
      setState((prev) => ({
        ...prev,
        saveSummaries: StorageRepository.listSaveSummaries(),
        latestSave: StorageRepository.getLatestSaveSlot()
      }));
      return `Imported to Slot 1 (Migrated=${parsed.migrated}, Checksum=${parsed.checksumValid})`;
    } catch (err) {
      return `Import failed: ${err instanceof Error ? err.message : String(err)}`;
    }
  }, []);

  const deleteSaveSlot = useCallback((slotId: string) => {
    StorageRepository.deleteSlotLocal(slotId);
    setState((prev) => ({
      ...prev,
      saveSummaries: StorageRepository.listSaveSummaries(),
      latestSave: StorageRepository.getLatestSaveSlot()
    }));
  }, []);

  const addBonusCoinsPotions = useCallback((coins: number, potions: number) => {
    activeWorldRef.current.coinsTotal += coins;
    activeWorldRef.current.potions += potions;
    setState((prev) => ({
      ...prev,
      hud: GameSimulation.toHudSnapshot(
        activeWorldRef.current,
        prev.hud.fps,
        prev.deviceProfile.dynamicScale,
        prev.aiMode
      )
    }));
  }, []);

  const setDeviceTier = useCallback((tier: DeviceTierId, powerSave?: boolean) => {
    const ps = powerSave ?? stateRef.current.powerSaveAuto;
    const next = DeviceProfiler.createDeviceProfile(tier, ps);
    setState((prev) => ({ ...prev, requestedTier: tier, powerSaveAuto: ps, deviceProfile: next }));
  }, []);

  const updateSettings = useCallback((transform: (prev: AppUiState) => AppUiState) => {
    setState((cur) => {
      const next = transform(cur);
      if (next.touchConfig !== cur.touchConfig) StorageRepository.saveTouchConfig(next.touchConfig);
      if (next.auth !== cur.auth) StorageRepository.saveAuthProfile(next.auth);
      if (next.eventRules !== cur.eventRules) StorageRepository.saveEventRules(next.eventRules);
      if (next.myWizardGames !== cur.myWizardGames) StorageRepository.saveWizardGames(next.myWizardGames);
      if (next.muted !== cur.muted) SoundEngine.setMuted(next.muted);
      return next;
    });
  }, []);

  const executeLocalMcpTool = useCallback((toolId: string) => {
    const cur = stateRef.current;
    let logLine: string;
    if (toolId === 'list_tools') {
      logLine = `[MCP] 16 active local tools: ${LOCAL_MCP_TOOLS.map((t) => t.name).join(', ')}`;
    } else if (toolId === 'validate_game') {
      const report = QolbuCore.runQolbu8StageAudit(cur.hud.drawCalls, cur.hud.heapMb);
      logLine = `[MCP] Qolbu 8-Stage Audit: passed=${report.allPassed} (${report.fuzzBlockedCount}/${report.fuzzEventsTested} fuzz blocked)`;
    } else if (toolId === 'spawn_entity') {
      const added: SceneEntityNode = {
        id: `ent_mcp_${Date.now() % 999}`,
        name: 'MCP Slime',
        kind: 'enemy',
        parentId: null,
        children: [],
        x: 200,
        y: 120,
        localX: 0,
        localY: 0,
        scaleX: 1,
        scaleY: 1,
        localScaleX: 1,
        localScaleY: 1,
        rotationDeg: 0,
        localRotationDeg: 0,
        visible: true,
        physics: { ...SceneHierarchy.PHYSICS_PRESETS.normal.config },
        collider: { kind: 'box', width: 36, height: 36, radius: 18, polygonPoints: [[-16, -16], [16, -16], [16, 16], [-16, 16]] }
      };
      setState((prev) => ({ ...prev, sceneEntities: [...prev.sceneEntities, added] }));
      logLine = '[MCP] Spawned MCP Slime into Scene Hierarchy.';
    } else if (toolId === 'play_ai') {
      setState((prev) => ({ ...prev, studioTab: 'arena', forcedArenaMode: 'solo' }));
      logLine = '[MCP] Launched Qolbu Arena in Solo AI mode.';
    } else if (toolId === 'co_play_ai') {
      setState((prev) => ({ ...prev, studioTab: 'arena', forcedArenaMode: 'coplay' }));
      logLine = '[MCP] Launched Qolbu Arena in Co-Play mode.';
    } else if (toolId === 'vs_ai') {
      setState((prev) => ({ ...prev, studioTab: 'arena', forcedArenaMode: 'vs' }));
      logLine = '[MCP] Launched Qolbu Arena in VS Boss Kala mode.';
    } else if (toolId === 'export_game') {
      setState((prev) => ({ ...prev, studioTab: 'export' }));
      logLine = '[MCP] Switched to Export & APK Build Pack tab.';
    } else {
      logLine = `[MCP] Executed tool '${toolId}' on local bridge.`;
    }
    setState((prev) => ({ ...prev, mcpLogs: [logLine, ...prev.mcpLogs].slice(0, 14) }));
  }, []);

  const playWizardGame = useCallback((spec: WizardGameSpec) => {
    const forced = spec.aiMode === 'Sendiri' ? 'solo' : spec.aiMode === 'Lawan' ? 'vs' : 'coplay';
    setState((prev) => ({
      ...prev,
      shellState: 'STUDIO',
      studioTab: 'arena',
      activeArenaSpec: spec,
      forcedArenaMode: forced
    }));
  }, []);

  const loadGitHubLiveSearch = useCallback(
    async (query: string, cat: GitHubRepoCategory): Promise<GitHubSearchResponse> => {
      return GitHubConnectors.searchGitHubReposWithFallback(query, cat);
    },
    []
  );

  const exportFile = useCallback(
    (filename: string, content: string | Uint8Array, mimeType = 'application/octet-stream') => {
      try {
        const blobPart: BlobPart =
          typeof content === 'string' ? content : (content.slice().buffer as ArrayBuffer);
        const blob = new Blob([blobPart], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showBanner(`Saved ${filename}`);
      } catch (err) {
        showBanner(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    [showBanner]
  );

  const copyText = useCallback(
    (label: string, text: string) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(() => showBanner(`Copied ${label}`))
          .catch(() => showBanner(`Copy failed for ${label}`));
      } else {
        showBanner(`Clipboard unavailable (${label})`);
      }
    },
    [showBanner]
  );

  return (
    <EngineStoreContext.Provider
      value={{
        state,
        lastForgeBundle,
        activeWorldRef,
        assetManagerRef,
        showBanner,
        clearBanner,
        openStudioTab,
        backToLanding,
        openTitleStage,
        startOrRestartLevel,
        launchBlueprint,
        forgeInstaplayPrompt,
        pauseGame,
        resumeGame,
        syncWorldEventsAndHud,
        triggerPotion,
        chooseVnOption,
        saveProgress,
        loadProgress,
        importSaveJson,
        deleteSaveSlot,
        addBonusCoinsPotions,
        setDeviceTier,
        updateSettings,
        executeLocalMcpTool,
        playWizardGame,
        loadGitHubLiveSearch,
        exportFile,
        copyText
      }}
    >
      {children}
    </EngineStoreContext.Provider>
  );
};

export function useEngineStore(): EngineStoreContextValue {
  const ctx = useContext(EngineStoreContext);
  if (!ctx) throw new Error('useEngineStore must be used inside EngineStoreProvider');
  return ctx;
}
