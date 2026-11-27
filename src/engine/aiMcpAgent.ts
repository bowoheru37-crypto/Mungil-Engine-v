import { Generators } from './generators';
import { MeshAndBlueprintGenerators } from './meshAndBlueprintGenerators';
import {
  AiPlayMode,
  ArtStyleId,
  GeneratedCharacterSpec,
  GeneratedCutsceneSpec,
  GeneratedGameBlueprintSpec,
  GeneratedSfxSpec,
  GeneratedTrackSpec,
  PerspectiveConnectorId,
  RenderMode,
  StudioTab,
  WizardGameSpec
} from './types';

export interface McpToolSpec {
  id: string;
  name: string;
  desc: string;
  params: string;
}

export interface TutorialStep {
  step: number;
  title: string;
  desc: string;
  targetTab: StudioTab;
}

export interface QolbuEngineTopic {
  id: string;
  title: string;
  summary: string;
  detail: string;
  tab: StudioTab;
}

export interface AgentChatMessage {
  from: string;
  text: string;
  recommendedTab?: StudioTab | null;
  toolUsed?: string | null;
}

export interface ForgeAgentStepLog {
  agent: string;
  role: string;
  output: string;
  passed: boolean;
}

export interface InstaplayForgeBundle {
  seed: number;
  prompt: string;
  blueprint: GeneratedGameBlueprintSpec;
  character: GeneratedCharacterSpec;
  track: GeneratedTrackSpec;
  sfx: GeneratedSfxSpec;
  cutscene: GeneratedCutsceneSpec;
  bytecodeSrc: string;
  seoTags: string;
  agentSteps: ForgeAgentStepLog[];
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  { step: 1, title: 'Pilih Chapter & Genre', desc: 'Pilih Desa Fajar, Jembatan Badai, Menara Kala, atau 16 genre di tab Play.', targetTab: 'play' },
  { step: 2, title: 'Atur Tombol Sentuh', desc: 'Sesuaikan ukuran tombol >=48px & layout D-Pad untuk jempol Itel A70.', targetTab: 'controls' },
  { step: 3, title: 'Ganti Art Style 1-Tap', desc: 'Coba Pixel, Anime, Cyberpunk, Watercolor, hingga Raycast 3D.', targetTab: 'art' },
  { step: 4, title: 'Buat Hero & Musik Sendiri', desc: 'Generate karakter 2D/3D-Stack & BGM chiptune di tab Generators.', targetTab: 'generators' },
  { step: 5, title: 'Pasang Physics Preset', desc: 'Pilih Bouncy, Heavy, Ghost, atau Slippery di Scene & Inspector.', targetTab: 'scene' },
  { step: 6, title: 'Grup & Edit Collision', desc: 'Gabungkan beberapa objek ke CONTAINER dan geser collider di Scene.', targetTab: 'scene' },
  { step: 7, title: 'Cek Rules & 15Hz AI', desc: 'Tambahkan aturan WHEN -> THEN No-Code dan cek 9 Larangan Mutlak di Lab.', targetTab: 'lab' },
  { step: 8, title: 'Rakit Game via Wizard', desc: 'Gunakan Pembantu Buat Game 5 langkah untuk menciptakan game barumu.', targetTab: 'agent' },
  { step: 9, title: 'Main Bareng / Lawan AI', desc: 'Uji Mode Solo AI, Co-Play Qolbu, atau Boss Kala Adaptif di Arena AI.', targetTab: 'arena' },
  { step: 10, title: 'Export Offline / APK Pack', desc: 'Simpan JSON, MPAK7 .pak, atau Android Gradle Build Pack.', targetTab: 'export' }
];

export const QOLBU_ENGINE_TOPICS: QolbuEngineTopic[] = [
  { id: 'gc', title: 'Zero-GC SoA Game Loop', summary: 'Array pre-allocated tanpa alokasi di tengah frame.', detail: 'Mencegah GC pause 150ms di Android RAM 3GB (Itel A70) dengan recycle slot free-list.', tab: 'lab' },
  { id: 'layers', title: '12-Layer Unified Core', summary: 'Foundation -> Assets -> World -> FD Lite Render -> FSM -> 15Hz AI -> Audio Pool.', detail: 'Menyatukan 54 sistem ringan berstandar AAA ke dalam anggaran <=35 draw call.', tab: 'lab' },
  { id: 'presets', title: '6 Physics Presets', summary: 'Normal, Bouncy, Heavy, Ghost, Slippery, dan Ball siap pakai 1-tap.', detail: 'Langsung mengisi mass, friction, restitution, gravityScale, linearDamp, isTrigger, & CCD.', tab: 'scene' },
  { id: 'group', title: 'Group Entities & Container', summary: 'Parent-child hierarchy dengan keep-world math.', detail: 'Move/Scale/Rotate Container menggerakkan seluruh child secara proporsional.', tab: 'scene' },
  { id: 'collision', title: 'Collision Shape Editor', summary: 'Box, Circle, dan Polygon interaktif dengan deteksi overlap real-time.', detail: 'Menampilkan status Aman, Dekat <8px, atau Overlap + kedalaman penetrasi px.', tab: 'scene' },
  { id: 'ai15hz', title: '15Hz Eco AI Decimation', summary: 'AI berpikir tiap 2 frame pada tier Eco — hemat 50% CPU & baterai.', detail: 'Fisika & render tetap halus 30/60 FPS, sementara evaluasi Utility AI/FSM dijalankan di 15Hz.', tab: 'arena' },
  { id: 'mcp', title: 'Local MCP Hub (16 Tools)', summary: 'Protokol Client -> Server -> Editor Bridge lokal tanpa API key.', detail: 'Menghubungkan agen Qolbu langsung ke Scene, Generator, Lab, Arena AI, dan Export.', tab: 'agent' },
  { id: 'fsm', title: 'Table-Driven FSM + Spring', summary: '8 pose karakter + 2-bone damped spring untuk jubah Bowo.', detail: 'Menggantikan if/else panjang dengan tabel prioritas + pegas ringan.', tab: 'art' },
  { id: 'security', title: 'IsValidMove Security Guard', summary: 'Tolak koordinat NaN/Infinity dan clamp speed-hack teleportasi.', detail: 'Berjalan di kernel simulasi utama dan Qolbu Arena AI sebelum resolusi batas dunia.', tab: 'lab' },
  { id: 'audio', title: 'Web Audio Synth Pool', summary: 'Musik 3-channel chiptune & spatial pan SFX 0 KB aset eksternal.', detail: 'Otomatis suspend saat aplikasi background dan meredupkan BGM saat efek pukul aktif.', tab: 'generators' },
  { id: 'memory', title: '2 MB Eco LRU Asset Budget', summary: 'Auto-evict biome lama saat pindah chapter agar bebas OOM.', detail: 'Hero rig di-pin di memori, sedangkan peta chapter sebelumnya dibersihkan otomatis.', tab: 'assets' },
  { id: 'apk', title: 'Android APK & Build Pack', summary: 'Native Compose Android + ProGuard + R8 optimasi Itel A70.', detail: 'Menyediakan manifest, Gradle DSL, dan tabel migrasi.', tab: 'export' }
];

export const LOCAL_MCP_TOOLS: McpToolSpec[] = [
  { id: 'list_tools', name: 'list_tools', desc: 'Tampilkan daftar seluruh 16 tool MCP lokal aktif.', params: '{}' },
  { id: 'explain_engine', name: 'explain_engine', desc: 'Jelaskan layer arsitektur, Zero-GC, atau 15Hz AI.', params: '{ topic: "gc" }' },
  { id: 'guide_player', name: 'guide_player', desc: 'Beri panduan langkah tutorial & hint HP/stuck.', params: '{ step: 1 }' },
  { id: 'create_game', name: 'create_game', desc: 'Buat game baru dari Wizard dan simpan ke Koleksi.', params: '{ genre: "Arena" }' },
  { id: 'spawn_entity', name: 'spawn_entity', desc: 'Tambah entitas baru ke Scene Hierarchy.', params: '{ type: "Enemy", preset: "BOUNCY" }' },
  { id: 'set_physics_preset', name: 'set_physics_preset', desc: 'Terapkan Physics Preset ke entitas terpilih.', params: '{ preset: "SLIPPERY" }' },
  { id: 'group_entities', name: 'group_entities', desc: 'Gabungkan 2+ entitas menjadi CONTAINER grup.', params: '{ name: "Squad Alpha" }' },
  { id: 'edit_collision_shape', name: 'edit_collision_shape', desc: 'Ubah bentuk collider ke Box/Circle/Polygon.', params: '{ type: "Circle", r: 24 }' },
  { id: 'generate_asset', name: 'generate_asset', desc: 'Sintesis karakter 3D-Stack baru untuk Bowo.', params: '{ archetype: "Knight" }' },
  { id: 'generate_level', name: 'generate_level', desc: 'Bangkitkan terrain & platform baru secara prosedural.', params: '{ biome: "storm" }' },
  { id: 'generate_dialog', name: 'generate_dialog', desc: 'Buat dialog pembuka chapter dari tema saat ini.', params: '{ chapter: 2 }' },
  { id: 'validate_game', name: 'validate_game', desc: 'Jalankan audit cepat 9 Larangan Mutlak & 25 Check.', params: '{}' },
  { id: 'export_game', name: 'export_game', desc: 'Buka tab Export untuk download HTML/JSON/PAK.', params: '{ target: "apk_pack" }' },
  { id: 'play_ai', name: 'play_ai', desc: 'Jalankan Qolbu Arena dalam mode Solo AI (Coach).', params: '{ mode: "solo" }' },
  { id: 'co_play_ai', name: 'co_play_ai', desc: 'Main Co-Op bersama Companion Qolbu AI.', params: '{ mode: "coplay" }' },
  { id: 'vs_ai', name: 'vs_ai', desc: 'Tantang Boss Kala Adaptif di Arena VS AI.', params: '{ mode: "vs" }' }
];

export const STARTER_WIZARD_GAMES: WizardGameSpec[] = [
  { id: 'starter_lentera_runner', name: 'Lentera Runner', genre: 'Runner', sprite: 'Bowo Api', characterName: 'Bowo Kilat', preset: 'SLIPPERY', map: 'Jembatan Cahaya', enemies: 3, items: 4, aiMode: 'Sendiri', difficulty: 'Normal', durationSec: 60, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'starter_arena_kala', name: 'Arena Kala Mini', genre: 'Arena', sprite: 'Ksatria Cahaya', characterName: 'Guardian', preset: 'NORMAL', map: 'Arena Qolbu', enemies: 1, items: 3, aiMode: 'Lawan', difficulty: 'Hard', durationSec: 90, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'starter_rpg_fajar', name: 'RPG Desa Fajar', genre: 'RPG', sprite: 'Penjaga Desa', characterName: 'Bowo & Qolbu', preset: 'BOUNCY', map: 'Desa Fajar', enemies: 4, items: 5, aiMode: 'Bareng', difficulty: 'Easy', durationSec: 120, createdAt: '2026-01-01T00:00:00Z' }
];

export const AiMcpAgent = {
  TUTORIAL_STEPS,
  QOLBU_ENGINE_TOPICS,
  LOCAL_MCP_TOOLS,
  STARTER_WIZARD_GAMES,

  buildWizardGameSpec(
    name: string,
    genre: string,
    sprite: string,
    characterName: string,
    preset: string,
    map: string,
    enemies: number,
    items: number,
    aiMode: string,
    difficulty: string,
    durationSec: number
  ): WizardGameSpec {
    return {
      id: `game_${Date.now().toString(36)}`,
      name: name.trim() || `${genre} Qolbu`,
      genre,
      sprite: sprite.trim() || 'Bowo Guardian',
      characterName: characterName.trim() || 'Bowo',
      preset,
      map,
      enemies: Math.min(6, Math.max(1, enemies)),
      items: Math.min(6, Math.max(2, items)),
      aiMode,
      difficulty,
      durationSec: Math.min(300, Math.max(30, durationSec)),
      createdAt: new Date().toISOString()
    };
  },

  runMultiAgentGameForge(
    prompt: string,
    prefs?: { renderMode?: RenderMode; styleId?: ArtStyleId; aiMode?: AiPlayMode; repoId?: string }
  ): InstaplayForgeBundle {
    const cleanPrompt = prompt.trim() || 'Cyber Guardian Lentera Quest';
    let seed = 707;
    for (let i = 0; i < cleanPrompt.length; i++) {
      seed = (Math.imul(31, seed) + cleanPrompt.charCodeAt(i)) | 0;
    }
    const positiveSeed = Math.abs(seed % 90000) + 100;

    const baseBlueprint = MeshAndBlueprintGenerators.generateCompleteGameBlueprint(
      positiveSeed,
      cleanPrompt,
      prefs?.repoId ?? 'gh_axmol'
    );
    const blueprint: GeneratedGameBlueprintSpec = {
      ...baseBlueprint,
      renderMode: prefs?.renderMode ?? baseBlueprint.renderMode,
      styleId: prefs?.styleId ?? baseBlueprint.styleId,
      aiMode: prefs?.aiMode ?? baseBlueprint.aiMode
    };

    const rig = Generators.generateRig3DFromPrompt(positiveSeed, cleanPrompt, 'guardian_mint');
    const scale =
      blueprint.styleId === 'cyberpunk' ? 'phrygian' : blueprint.genreId === 'rpg' ? 'dorian' : 'pentatonic';
    const bpm = blueprint.genreId === 'racing' || blueprint.genreId === 'rhythm' ? 148 : 124;
    const track = Generators.generateMusicTrack(positiveSeed, scale, bpm);
    const sfx = Generators.generateSfxSpec(positiveSeed, blueprint.genreId === 'shooter' ? 'laser' : 'slash');
    const cutscene = Generators.composeMovieFromPrompt(
      'jalan lompat dash serang',
      positiveSeed,
      blueprint.weather
    );
    const bytecodeSrc = [
      `# Instaplay Forge Script (${blueprint.genreId.toUpperCase()})`,
      `SET ${blueprint.prefabs.length * 10}`,
      `MUL 2`,
      `STORE 0`,
      `SPAWN ${blueprint.prefabs.length}`,
      `EMIT 1`,
      `SAY ${positiveSeed % 999}`,
      `END`
    ].join('\n');
    const seoTags = Generators.generateSeoOpenGraphSpec(
      blueprint.title,
      blueprint.genreId,
      `${blueprint.title} — ${blueprint.hybridMode} · ${blueprint.budgetReport.targetFps} FPS Mobile Web`
    );

    const agentSteps: ForgeAgentStepLog[] = [
      {
        agent: '1. Architect Agent',
        role: 'Genre & Camera Router',
        output: `${blueprint.genreId.toUpperCase()} (${blueprint.simKind}) · ${blueprint.perspective} · ${blueprint.hybridMode}`,
        passed: true
      },
      {
        agent: '2. World & Level Agent',
        role: 'Chunk & Quest Populator',
        output: `3 Chapters + ${blueprint.weather} climate · Seed #${positiveSeed}`,
        passed: true
      },
      {
        agent: '3. Visual & Rig Agent',
        role: 'ArtStyle & 3D-Stack Rig',
        output: `Style=${blueprint.styleId} · Hero=${rig.character.name} (${rig.character.weapon})`,
        passed: true
      },
      {
        agent: '4. Audio & VFX Agent',
        role: 'Web Audio Synth Composer',
        output: `BGM "${track.title}" (${bpm} BPM ${scale}) + ${sfx.name} SFX`,
        passed: true
      },
      {
        agent: '5. Script & Bytecode Agent',
        role: 'FSM & 16-bit Assembly',
        output: `${blueprint.rules.length} event rules + 8-op bytecode ready`,
        passed: true
      },
      {
        agent: '6. Itel A70 QA Agent',
        role: 'Hardware Budget Validator',
        output: `${blueprint.budgetReport.drawCallsEst} DC <= 35 · ${blueprint.budgetReport.heapMbEst} MB <= 48 MB`,
        passed: blueprint.budgetReport.passesA70
      }
    ];

    return {
      seed: positiveSeed,
      prompt: cleanPrompt,
      blueprint,
      character: rig.character,
      track,
      sfx,
      cutscene,
      bytecodeSrc,
      seoTags,
      agentSteps
    };
  },

  askQolbuAgent(question: string): [string, StudioTab | null] {
    const q = question.toLowerCase().trim();
    if (!q) {
      return ['Tanyakan tentang Zero-GC, Physics Preset, Group Entities, Collision Editor, 15Hz AI, MCP, atau APK Build Pack!', null];
    }
    if (q.includes('gc') || q.includes('lag') || q.includes('itel') || q.includes('memori')) {
      return ['Itel A70 dijaga oleh 9 Larangan Mutlak: SoA Pool 1024 slot (Zero-GC), AI 15Hz Eco (hemat 50% CPU), draw call <35, dan LRU Asset Budget 2 MB.', 'lab'];
    }
    if (q.includes('preset') || q.includes('bouncy') || q.includes('heavy') || q.includes('ghost') || q.includes('fisika')) {
      return ['Di tab Scene & Inspector tersedia 6 preset 1-tap: NORMAL, BOUNCY, HEAVY, GHOST (trigger tembus), SLIPPERY (licin), dan BALL (CCD anti-tembus).', 'scene'];
    }
    if (q.includes('group') || q.includes('grup') || q.includes('container')) {
      return ['Pilih >=2 entitas di Hierarchy lalu tekan Group Entities untuk membentuk parent CONTAINER dengan keep-world math.', 'scene'];
    }
    if (q.includes('collision') || q.includes('tabrak') || q.includes('hitbox')) {
      return ['Collision Shape Editor mendukung Box, Circle, dan Polygon yang dapat digeser di kanvas dengan indikator Aman/Dekat/Overlap.', 'scene'];
    }
    if (q.includes('mcp') || q.includes('tool')) {
      return ['MCP Hub lokal berjalan 100% offline dengan 16 tool aktif tanpa memerlukan API key eksternal.', 'agent'];
    }
    if (q.includes('ai') || q.includes('arena') || q.includes('kala')) {
      return ['Qolbu Arena AI mendukung 3 mode: Solo AI (Coach directive), Co-Play (Qolbu auto-heal <40% + 1x revive), dan VS Boss Kala.', 'arena'];
    }
    if (q.includes('apk') || q.includes('android') || q.includes('export')) {
      return ['Tab Export menyediakan Android APK Build Pack + Playable HTML5 + MPAK7 RLE .pak dan SEO manifest.', 'export'];
    }
    return ['Qolbu AI siap membantu! Gunakan Scene untuk Fisika/Grup/Collider, AI & MCP untuk Wizard game baru, atau Arena AI untuk bermain bersama AI.', 'agent'];
  },

  routePromptWithTrace(
    prompt: string,
    activeLevel: number,
    onSwitchConnector: (c: PerspectiveConnectorId) => void,
    onSwitchAiMode: (m: AiPlayMode) => void,
    onSetGameName: (n: string) => void
  ): [string, string, StudioTab | null] {
    const q = prompt.toLowerCase();
    if (q.includes('buatkan') || q.includes('create') || q.includes('isometric') || q.includes('raycast')) {
      const isIso = q.includes('isometric') || q.includes('iso');
      const isRay = q.includes('raycast') || q.includes('fps');
      const title = isIso ? 'Isometric Light Quest' : isRay ? 'Raycast Kala Dungeon' : 'Cyber Guardian Quest';
      onSetGameName(title);
      onSwitchConnector(isIso ? 'isometric' : isRay ? 'fake_3d_raycast' : '2_5d_parallax');
      onSwitchAiMode('coop');
      return [`Game baru "${title}" disiapkan dengan perspektif optimal + Luma AI Co-Op aktif!`, 'mcp.create_game_project', 'play'];
    }
    if (q.includes('pandu') || q.includes('boss') || q.includes('menang')) {
      const guide =
        activeLevel === 1
          ? 'Babak 1 (Desa Fajar): Kumpulkan 2 Light Shard di platform lalu masuki Gerbang Timur.'
          : activeLevel === 2
            ? 'Babak 2 (Jembatan Badai): Aktifkan 2 saklar lantai, pantulkan proyektil Wisp dengan Dash Parry, dan ambil 3 Shard.'
            : 'Babak 3 (Menara Kala): Hindari 3 fase Boss Kala dengan Dash Parry (K), tekan saklar pembuka, dan serang saat jeda telegraph!';
      return [guide, 'mcp.guide_player', 'play'];
    }
    const [ans, tab] = this.askQolbuAgent(prompt);
    return [ans, 'mcp.explain_engine', tab];
  }
};
