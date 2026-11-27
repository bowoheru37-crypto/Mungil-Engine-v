export type LanguageCode = 'id' | 'en' | 'ja' | 'ko' | 'es';

export const LANGUAGE_OPTIONS: { code: LanguageCode; label: string }[] = [
  { code: 'id', label: 'Indonesia' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'es', label: 'Español' }
];

export type ArtStyleId =
  | 'pixel'
  | 'anime'
  | 'cartoon'
  | 'minimal'
  | 'retro'
  | 'cyberpunk'
  | 'lowpoly'
  | 'watercolor'
  | 'chibi'
  | 'isometric'
  | 'silhouette'
  | 'voxel';

export type RenderMode = '2D' | '2.5D' | '3D-Stack';
export const RENDER_MODES: RenderMode[] = ['2D', '2.5D', '3D-Stack'];

export type PhysicsMode = 'Arcade' | 'Realistic' | 'Zero-G';
export const PHYSICS_MODES: PhysicsMode[] = ['Arcade', 'Realistic', 'Zero-G'];

export type WeatherKind = 'Cerah' | 'Hujan' | 'Salju';
export const WEATHER_KINDS: WeatherKind[] = ['Cerah', 'Hujan', 'Salju'];

export type DeviceTierId = 'auto' | 'eco' | 'mid' | 'hd';
export const DEVICE_TIERS: DeviceTierId[] = ['auto', 'eco', 'mid', 'hd'];

export type GameShellState =
  | 'LANDING'
  | 'TITLE'
  | 'PLAYING'
  | 'PAUSED'
  | 'VICTORY'
  | 'GAMEOVER'
  | 'STUDIO';

export type StudioTab =
  | 'play'
  | 'scene'
  | 'agent'
  | 'arena'
  | 'assets'
  | 'generators'
  | 'controls'
  | 'art'
  | 'lab'
  | 'skills'
  | 'services'
  | 'export';

export const STUDIO_TABS: StudioTab[] = [
  'play',
  'scene',
  'agent',
  'arena',
  'assets',
  'generators',
  'controls',
  'art',
  'lab',
  'skills',
  'services',
  'export'
];

export type AiPlayMode = 'off' | 'coop' | 'autopilot';

export type PerspectiveConnectorId =
  | '2d_side_h'
  | '2d_side_v'
  | 'top_down'
  | 'isometric'
  | 'hexagonal'
  | '2_5d_parallax'
  | 'pseudo_3d_zstack'
  | 'fake_3d_raycast'
  | 'third_person'
  | 'first_person';

export type Camera3DPresetId = 'iso_fixed' | 'follow_3_4' | 'fps_raycast';

export type HybridRender5Mode =
  | 'hybrid_2_5d_billboard'
  | 'isometric_painter'
  | 'raycast_pseudo3d'
  | 'mode7_voxel'
  | 'real_3d_lowpoly';

export type VisualQualityPresetId =
  | 'pixel_retro'
  | 'mobile_eco'
  | 'smooth_hd'
  | 'vivid_glow';

export type GenreSimulationKind =
  | 'PLATFORMER'
  | 'TOPDOWN'
  | 'SHOOTER'
  | 'RUNNER'
  | 'RHYTHM'
  | 'BRAWLER'
  | 'DEFENSE'
  | 'COLLECTOR'
  | 'VISUAL_NOVEL';

export type CharacterAnimState =
  | 'idle'
  | 'walk'
  | 'jump'
  | 'fall'
  | 'attack'
  | 'dash'
  | 'hurt'
  | 'ko';

export const CHARACTER_ANIM_STATES: CharacterAnimState[] = [
  'idle',
  'walk',
  'jump',
  'fall',
  'attack',
  'dash',
  'hurt',
  'ko'
];

export interface ArtStyleSpec {
  id: ArtStyleId;
  name: string;
  subtitle: string;
  palette: string[];
  strokeWidth: number;
  glow: boolean;
  flatFill: boolean;
  pixelSnap: boolean;
  shaderHint: string;
}

export interface StyleOverrides {
  outline: boolean;
  shadow: boolean;
  glow: boolean;
  scanline: boolean;
  strokeWidth: number;
  brightness: number;
  contrast: number;
}

export interface DeviceProfile {
  requestedTier: DeviceTierId;
  activeTier: DeviceTierId;
  targetFps: number;
  dprCap: number;
  dynamicScale: number;
  shadowBlur: number;
  particleMax: number;
  powerSaveAuto: boolean;
  renderer: string;
}

export interface TouchControlConfig {
  joystickSide: 'left' | 'right';
  joystickOffsetX: number;
  joystickOffsetY: number;
  joystickDiameter: number;
  buttonSize: number;
  opacity: number;
  deadzone: number;
  haptics: boolean;
  showLabels: boolean;
}

export interface WorldSaveProgress {
  genreId: string;
  playerX: number;
  playerY: number;
  facing: number;
  time: number;
  collectedShards: number[];
  collectedCoins: number[];
  activeSwitches: number[];
  defeatedEnemies: number[];
  vnStep: number;
}

export interface SaveSlotData {
  version: string;
  slotId: string;
  updatedAt: string;
  gameTitle: string;
  level: number;
  hp: number;
  energy: number;
  coins: number;
  shards: number;
  score: number;
  kills: number;
  potions: number;
  styleId: string;
  checksum: string;
  worldState?: WorldSaveProgress | null;
}

export interface SaveSlotSummary {
  id: string;
  exists: boolean;
  updatedAt: string;
  level: number;
  hp: number;
  score: number;
  coins: number;
  gameTitle: string;
}

export interface AuthProfile {
  provider: string;
  uid: string;
  displayName: string;
  syncedAt: string;
}

export interface AnalyticsSummary {
  sessions: number;
  totalPlaySec: number;
  level1Clears: number;
  level2Clears: number;
  level3Clears: number;
  enemiesDefeated: number;
  shardsCollected: number;
  deaths: number;
  activeSeconds: number;
}

export interface GenreTemplate {
  id: string;
  name: string;
  renderMode: RenderMode;
  physicsMode: PhysicsMode;
  styleId: ArtStyleId;
  weather: WeatherKind;
  gravityMul: number;
  speedMul: number;
  desc: string;
}

export interface AssetCatalogItem {
  id: string;
  name: string;
  category: string;
  memoryKb: number;
  desc: string;
}

export interface RepoCredit {
  tier: string;
  name: string;
  license: string;
  url: string;
  adoption: string;
}

export interface EventRuleSpec {
  id: string;
  condition: string;
  action: string;
  enabled: boolean;
}

export interface VnDialogView {
  speaker: string;
  text: string;
  step: number;
  totalSteps: number;
  choices: string[];
}

export interface HudSnapshot {
  level: number;
  levelName: string;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  coins: number;
  shards: number;
  requiredShards: number;
  switchesActive: number;
  requiredSwitches: number;
  potions: number;
  score: number;
  kills: number;
  gateUnlocked: boolean;
  fps: number;
  dynamicScale: number;
  drawCalls: number;
  culledCount: number;
  activeEntities: number;
  heapMb: number;
  bossHp: number;
  bossMaxHp: number;
  bossPhase: number;
  objective: string;
  parryFlash: boolean;
  genreId: string;
  simKind: GenreSimulationKind;
  aiMode: AiPlayMode;
  aiCompanionActive: boolean;
  aiStatusText: string;
  comboCount: number;
  waveNumber: number;
  trackDist: number;
  speedKmh: number;
  vnDialog: VnDialogView | null;
}

export interface GeneratedCharacterSpec {
  id: string;
  name: string;
  seed: number;
  dimension: string;
  archetype: string;
  primaryColor: string;
  cloakColor: string;
  accentColor: string;
  weapon: string;
  hpBonus: number;
  speedMul: number;
  spriteGrid: string[];
}

export interface GeneratedTrackSpec {
  seed: number;
  title: string;
  scale: string;
  bpm: number;
  leadNotes: number[];
  bassNotes: number[];
  percHits: number[];
}

export interface GeneratedSfxSpec {
  seed: number;
  name: string;
  preset: string;
  wave: string;
  freqStart: number;
  freqEnd: number;
  durationSec: number;
  volume: number;
}

export interface CutsceneKeyframe {
  timeSec: number;
  pose: CharacterAnimState;
  xNorm: number;
  yNorm: number;
  caption: string;
  effect: string;
}

export interface GeneratedCutsceneSpec {
  seed: number;
  title: string;
  durationSec: number;
  weather: WeatherKind;
  keyframes: CutsceneKeyframe[];
}

export interface GeneratedTerrainPlatform {
  x: number;
  y: number;
  w: number;
}

export interface GeneratedTerrainSpec {
  seed: number;
  name: string;
  mode: string;
  biome: string;
  heights: number[];
  platforms: GeneratedTerrainPlatform[];
}

export interface GeneratedPropSpec {
  seed: number;
  name: string;
  kind: string;
  color: string;
  pixelGrid: string[];
}

export interface GeneratedImageSpriteSpec {
  seed: number;
  prompt: string;
  size: number;
  palette: string[];
  grid: string[];
}

export interface AtelierSetupSpec {
  presetId: string;
  label: string;
  tint: string;
  sy: number;
  animSpeed: number;
  animBlend: number;
  poseAnglesDeg: Record<string, number>;
  rawJson: string;
}

export interface GeneratedRig3DSpec {
  character: GeneratedCharacterSpec;
  atelier: AtelierSetupSpec;
}

export interface FsmTransitionSpec {
  from: string;
  event: string;
  to: string;
  guard: string;
}

export interface GeneratedStateMachineSpec {
  seed: number;
  kind: string;
  initialState: string;
  states: string[];
  transitions: FsmTransitionSpec[];
  bytecodePreview: string;
}

export interface GeneratedGameplayBundleSpec {
  seed: number;
  title: string;
  genreId: string;
  simKind: GenreSimulationKind;
  physicsMode: PhysicsMode;
  renderMode: RenderMode;
  weather: WeatherKind;
  rules: EventRuleSpec[];
  uiHudTokens: string[];
}

export interface GeneratedDubbingSpec {
  seed: number;
  speaker: string;
  line: string;
  lang: string;
  durationSec: number;
  pitch: number;
  rate: number;
  srtText: string;
  vttText: string;
}

export interface GeneratedPlatformTargetSpec {
  seed: number;
  target: string;
  appName: string;
  packageId: string;
  summary: string;
  configJson: string;
}

export interface Mesh3DVertex {
  x: number;
  y: number;
  z: number;
}

export interface Mesh3DTriangle {
  a: number;
  b: number;
  c: number;
  color: string;
}

export interface GeneratedMesh3DSpec {
  seed: number;
  prompt: string;
  category: string;
  sourceRepo: string;
  vertices: Mesh3DVertex[];
  triangles: Mesh3DTriangle[];
  lodCounts: [number, number, number];
  objText: string;
  gltfJson: string;
  budgetOk: boolean;
}

export interface BlueprintPrefabSpec {
  name: string;
  role: string;
  meshCategory: string;
  triCount: number;
  collider: string;
}

export interface BlueprintBudgetReport {
  targetFps: number;
  drawCallsEst: number;
  trisEst: number;
  heapMbEst: number;
  passesA70: boolean;
}

export interface GeneratedGameBlueprintSpec {
  seed: number;
  title: string;
  prompt: string;
  genreId: string;
  simKind: GenreSimulationKind;
  perspective: PerspectiveConnectorId;
  cameraPreset: Camera3DPresetId;
  hybridMode: HybridRender5Mode;
  physicsMode: PhysicsMode;
  renderMode: RenderMode;
  styleId: ArtStyleId;
  weather: WeatherKind;
  aiMode: AiPlayMode;
  repoStack: string[];
  prefabs: BlueprintPrefabSpec[];
  levelQuests: string[];
  rules: EventRuleSpec[];
  budgetReport: BlueprintBudgetReport;
}

export type PhysicsPresetId = 'normal' | 'bouncy' | 'heavy' | 'ghost' | 'slippery' | 'ball';

export const PHYSICS_PRESET_IDS: PhysicsPresetId[] = [
  'normal',
  'bouncy',
  'heavy',
  'ghost',
  'slippery',
  'ball'
];

export type ColliderShapeKind = 'box' | 'circle' | 'polygon';
export const COLLIDER_SHAPE_KINDS: ColliderShapeKind[] = ['box', 'circle', 'polygon'];

export interface EntityPhysicsProps {
  presetId: PhysicsPresetId;
  mass: number;
  friction: number;
  restitution: number;
  gravityScale: number;
  linearDamp: number;
  isTrigger: boolean;
  ccd: boolean;
}

export interface ColliderShapeSpec {
  kind: ColliderShapeKind;
  width: number;
  height: number;
  radius: number;
  polygonPoints: [number, number][];
}

export interface SceneEntityNode {
  id: string;
  name: string;
  kind: string;
  parentId?: string | null;
  children: string[];
  x: number;
  y: number;
  localX: number;
  localY: number;
  scaleX: number;
  scaleY: number;
  localScaleX: number;
  localScaleY: number;
  rotationDeg: number;
  localRotationDeg: number;
  visible: boolean;
  physics: EntityPhysicsProps;
  collider: ColliderShapeSpec;
}

export interface CollisionOverlapInfo {
  aId: string;
  aName: string;
  bId: string;
  bName: string;
  penetrationPx: number;
  isTriggerOverlap: boolean;
  near: boolean;
}

export type ArenaMode = 'solo' | 'coplay' | 'vs';
export const ARENA_MODES: { id: ArenaMode; label: string }[] = [
  { id: 'solo', label: '1. AI Main Sendiri' },
  { id: 'coplay', label: '2. Main Bareng Qolbu' },
  { id: 'vs', label: '3. Lawan Boss Kala' }
];

export type ArenaCoachDirective = 'Agresif' | 'Seimbang' | 'Bertahan' | 'Farming';
export const ARENA_COACH_DIRECTIVES: ArenaCoachDirective[] = ['Agresif', 'Seimbang', 'Bertahan', 'Farming'];

export type ArenaCompanionOrder = 'Ikut' | 'Serang' | 'Bertahan' | 'Ambil Item' | 'Heal';
export const ARENA_COMPANION_ORDERS: ArenaCompanionOrder[] = ['Ikut', 'Serang', 'Bertahan', 'Ambil Item', 'Heal'];

export type ArenaDifficulty = 'Easy' | 'Normal' | 'Hard';
export const ARENA_DIFFICULTIES: ArenaDifficulty[] = ['Easy', 'Normal', 'Hard'];

export interface WizardGameSpec {
  id: string;
  name: string;
  genre: string;
  sprite: string;
  characterName: string;
  preset: string;
  map: string;
  enemies: number;
  items: number;
  aiMode: string;
  difficulty: string;
  durationSec: number;
  createdAt: string;
}

export type GitHubRepoCategory =
  | 'all'
  | 'fake_3d_raycast'
  | 'mode7_voxel'
  | 'isometric_2_5d'
  | 'web_mobile_lightweight'
  | '3d_mesh_generators'
  | 'ai_game_generators';

export const GITHUB_REPO_CATEGORIES: { id: GitHubRepoCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'fake_3d_raycast', label: 'Fake 3D & Raycast' },
  { id: 'mode7_voxel', label: 'Mode-7 & Voxel Space' },
  { id: 'isometric_2_5d', label: 'Isometric & 2.5D' },
  { id: 'web_mobile_lightweight', label: 'Web & Mobile Engines' },
  { id: '3d_mesh_generators', label: '3D Generators (Tripo/Meshy)' },
  { id: 'ai_game_generators', label: 'AI Game Forge & MCP' }
];

export interface GitHubRepoPlugin {
  id: string;
  repo: string;
  url: string;
  category: GitHubRepoCategory;
  license: string;
  starsLabel: string;
  dnaPattern: string;
  supportedPerspectives: PerspectiveConnectorId[];
  recommendedHybridMode: HybridRender5Mode;
  recommendedCamera: Camera3DPresetId;
  maxDrawCallsBudget: number;
  maxTrisBudget: number;
  source?: string;
}

export interface AgentSkillFile {
  filename: string;
  platform: string;
  title: string;
  summary: string;
  content: string;
}

export interface AppUiState {
  shellState: GameShellState;
  studioTab: StudioTab;
  gameName: string;
  activeLevel: number;
  requestedTier: DeviceTierId;
  powerSaveAuto: boolean;
  deviceProfile: DeviceProfile;
  styleId: ArtStyleId;
  customPalettes: Partial<Record<ArtStyleId, string[]>>;
  styleOverrides: StyleOverrides;
  renderMode: RenderMode;
  physicsMode: PhysicsMode;
  weather: WeatherKind;
  practiceMode: boolean;
  physicsDebug: boolean;
  activeGenreId: string;
  aiMode: AiPlayMode;
  perspectiveConnector: PerspectiveConnectorId;
  cameraPreset: Camera3DPresetId;
  hybridMode: HybridRender5Mode;
  activeGitHubRepoId: string;
  visualQuality: VisualQualityPresetId;
  sceneEntities: SceneEntityNode[];
  speedMul: number;
  gravityMul: number;
  touchConfig: TouchControlConfig;
  darkTheme: boolean;
  lang: LanguageCode;
  fontSizePx: number;
  highContrast: boolean;
  reduceShake: boolean;
  muted: boolean;
  isOnline: boolean;
  auth: AuthProfile;
  analyticsEnabled: boolean;
  analytics: AnalyticsSummary;
  customCharacter: GeneratedCharacterSpec | null;
  eventRules: EventRuleSpec[];
  myWizardGames: WizardGameSpec[];
  activeArenaSpec: WizardGameSpec | null;
  forcedArenaMode: ArenaMode | null;
  saveSummaries: SaveSlotSummary[];
  latestSave: SaveSlotSummary | null;
  hud: HudSnapshot;
  customBytecodeSrc: string;
  statusBanner: string | null;
  mcpLogs: string[];
}
