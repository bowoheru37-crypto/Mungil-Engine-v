import { ArtStyles } from './artStyles';
import { BytecodeVm } from './bytecodeVm';
import { simKindForGenre } from './gameSimulationData';
import {
  ArtStyleId,
  AtelierSetupSpec,
  CutsceneKeyframe,
  GeneratedCharacterSpec,
  GeneratedCutsceneSpec,
  GeneratedDubbingSpec,
  GeneratedGameplayBundleSpec,
  GeneratedImageSpriteSpec,
  GeneratedPlatformTargetSpec,
  GeneratedPropSpec,
  GeneratedRig3DSpec,
  GeneratedSfxSpec,
  GeneratedStateMachineSpec,
  GeneratedTerrainSpec,
  GeneratedTrackSpec,
  WeatherKind
} from './types';

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

const ATELIER_PRESETS: Record<string, AtelierSetupSpec> = {
  guardian_mint: {
    presetId: 'guardian_mint',
    label: 'Guardian Mint',
    tint: '#b3ffe0',
    sy: 1.0,
    animSpeed: 1.0,
    animBlend: 0.25,
    poseAnglesDeg: { bone_1: 0, bone_2: 4, bone_3: -6 },
    rawJson: '{"app":"CharacterAtelier","settings":{"tint":"#b3ffe0","sy":1.0,"animSpeed":1.0}}'
  },
  cobalt_knight: {
    presetId: 'cobalt_knight',
    label: 'Cobalt Knight',
    tint: '#b9c8ff',
    sy: 1.05,
    animSpeed: 0.9,
    animBlend: 0.3,
    poseAnglesDeg: { bone_1: 2, bone_2: -8, bone_3: 8 },
    rawJson: '{"app":"CharacterAtelier","settings":{"tint":"#b9c8ff","sy":1.05,"animSpeed":0.9}}'
  },
  amber_rogue: {
    presetId: 'amber_rogue',
    label: 'Amber Rogue',
    tint: '#fde68a',
    sy: 0.95,
    animSpeed: 1.25,
    animBlend: 0.2,
    poseAnglesDeg: { bone_1: -5, bone_2: 10, bone_3: -12 },
    rawJson: '{"app":"CharacterAtelier","settings":{"tint":"#fde68a","sy":0.95,"animSpeed":1.25}}'
  },
  atelier_v2_rest: {
    presetId: 'atelier_v2_rest',
    label: 'Atelier V2 12-Bone',
    tint: '#f1f5f9',
    sy: 1.15,
    animSpeed: 1.0,
    animBlend: 0.25,
    poseAnglesDeg: { bone_2: 45, bone_3: -45, bone_4: -9, bone_5: 14, bone_6: -14, bone_7: 45, bone_8: 45, bone_9: -8, bone_10: 9, bone_11: -21, bone_12: 45 },
    rawJson: '{"app":"CharacterAtelier","version":2,"settings":{"tint":"#ffffff","style":"original","roughness":0.8,"sx":0.93,"sy":1.15,"sz":1.03,"quality":"eco","clip":"rest"}}'
  }
};

export const Generators = {
  listAtelierPresets(): AtelierSetupSpec[] {
    return Object.values(ATELIER_PRESETS);
  },

  generateCharacter(seed: number, dimension: string, archetype: string): GeneratedCharacterSpec {
    const rng = BytecodeVm.createSeedRng(seed);
    const palettes: [string, string, string][] = [
      ['#38bdf8', '#0284c7', '#fde047'],
      ['#34d399', '#059669', '#fbbf24'],
      ['#f472b6', '#be185d', '#38bdf8'],
      ['#a78bfa', '#6d28d9', '#fde047']
    ];
    const pick = palettes[Math.min(palettes.length - 1, Math.max(0, Math.floor(rng() * palettes.length)))];
    const weapons = ['Light Blade', 'Lantern Spear', 'Rune Staff', 'Twin Sai'];
    const weapon = weapons[Math.min(weapons.length - 1, Math.max(0, Math.floor(rng() * weapons.length)))];
    const grid: string[] = [];
    for (let row = 0; row < 12; row++) {
      const chars = new Array<string>(12).fill('.');
      for (let col = 0; col < 6; col++) {
        const filled =
          (row >= 1 && row <= 3 && col >= 3 && col <= 5) ||
          (row >= 4 && row <= 8 && col >= 2 && col <= 5 && rng() > 0.22) ||
          (row >= 9 && row <= 10 && col >= 3 && col <= 4);
        const ch = !filled ? '.' : row <= 3 ? 'H' : col === 2 ? 'C' : 'B';
        chars[col] = ch;
        chars[11 - col] = ch;
      }
      grid.push(chars.join(''));
    }
    return {
      id: `char_${seed}_${archetype}`,
      name: `${archetype} #${Math.abs(seed % 1000)}`,
      seed,
      dimension,
      archetype,
      primaryColor: pick[0],
      cloakColor: pick[1],
      accentColor: pick[2],
      weapon,
      hpBonus: Math.floor((rng() * 30) / 5) * 5,
      speedMul: 0.95 + rng() * 0.25,
      spriteGrid: grid
    };
  },

  generateRig3DFromPrompt(seed: number, prompt: string, presetId = 'guardian_mint'): GeneratedRig3DSpec {
    const low = prompt.toLowerCase();
    const arch =
      low.includes('ksatria') || low.includes('knight')
        ? 'Knight'
        : low.includes('mage') || low.includes('penyihir')
          ? 'Mage'
          : low.includes('rogue') || low.includes('ninja')
            ? 'Rogue'
            : 'Guardian';
    const atelier = ATELIER_PRESETS[presetId] ?? ATELIER_PRESETS.guardian_mint;
    const base = this.generateCharacter(seed, '3D-Stack', arch);
    return {
      character: {
        ...base,
        name: prompt.trim() || base.name,
        cloakColor: atelier.tint
      },
      atelier
    };
  },

  parseAtelierSetupJson(rawJson: string): [boolean, GeneratedCharacterSpec | null] {
    try {
      const root = JSON.parse(rawJson) as { settings?: { tint?: string; sy?: number } };
      if (!root || typeof root !== 'object' || !root.settings) return [false, null];
      const tint = typeof root.settings.tint === 'string' ? root.settings.tint : '#b3ffe0';
      const sy = typeof root.settings.sy === 'number' ? root.settings.sy : 1;
      const base = this.generateCharacter(777, '3D-Stack', 'Guardian');
      return [
        true,
        {
          ...base,
          cloakColor: tint,
          speedMul: 1 / Math.min(1.5, Math.max(0.6, sy))
        }
      ];
    } catch {
      return [false, null];
    }
  },

  generateImageSpriteFromPrompt(seed: number, prompt: string, styleId: ArtStyleId): GeneratedImageSpriteSpec {
    const rng = BytecodeVm.createSeedRng(seed + hashString(prompt));
    const spec = ArtStyles.getStyleSpec(styleId);
    const palette = [spec.palette[1], spec.palette[2], spec.palette[3], spec.palette[6]];
    const grid: string[] = [];
    for (let r = 0; r < 16; r++) {
      const chars = new Array<string>(16).fill('.');
      for (let c = 0; c < 8; c++) {
        const inside = r >= 2 && r <= 13 && c >= 2 && c <= 7 && (rng() > 0.28 || c >= 5);
        const token = !inside ? '.' : r < 5 ? '1' : c === 3 ? '2' : '3';
        chars[c] = token;
        chars[15 - c] = token;
      }
      grid.push(chars.join(''));
    }
    return { seed, prompt, size: 16, palette, grid };
  },

  generateMusicTrack(seed: number, scale: string, bpm: number): GeneratedTrackSpec {
    const rng = BytecodeVm.createSeedRng(seed);
    const notes =
      scale === 'dorian'
        ? [220, 246.94, 261.63, 293.66, 329.63, 369.99, 392, 440]
        : scale === 'phrygian'
          ? [196, 207.65, 246.94, 261.63, 293.66, 311.13, 349.23, 392]
          : [261.63, 293.66, 329.63, 392, 440, 523.25];
    const leadNotes = Array.from({ length: 16 }, (_, i) =>
      i % 4 === 3 && rng() < 0.35
        ? 0
        : notes[Math.min(notes.length - 1, Math.max(0, Math.floor(rng() * notes.length)))]
    );
    const bassNotes = Array.from({ length: 16 }, (_, i) =>
      i % 2 === 1 && rng() < 0.4 ? 0 : notes[i % 3] * 0.5
    );
    const percHits = Array.from({ length: 16 }, (_, i) => (i % 4 === 0 ? 1 : i % 2 === 1 ? 2 : 0));
    const scaleCap = scale.charAt(0).toUpperCase() + scale.slice(1);
    return {
      seed,
      title: `Proc ${scaleCap} #${seed}`,
      scale,
      bpm: Math.min(180, Math.max(85, bpm)),
      leadNotes,
      bassNotes,
      percHits
    };
  },

  generateSfxSpec(seed: number, preset: string): GeneratedSfxSpec {
    const rng = BytecodeVm.createSeedRng(seed);
    const j = 0.9 + rng() * 0.2;
    switch (preset) {
      case 'slash':
        return { seed, name: 'Slash', preset, wave: 'sawtooth', freqStart: 480 * j, freqEnd: 150 * j, durationSec: 0.11, volume: 0.2 };
      case 'coin':
        return { seed, name: 'Coin', preset, wave: 'sine', freqStart: 660 * j, freqEnd: 1080 * j, durationSec: 0.12, volume: 0.2 };
      case 'laser':
        return { seed, name: 'Laser', preset, wave: 'square', freqStart: 920 * j, freqEnd: 220 * j, durationSec: 0.15, volume: 0.18 };
      case 'impact':
        return { seed, name: 'Impact', preset, wave: 'sawtooth', freqStart: 180 * j, freqEnd: 55 * j, durationSec: 0.18, volume: 0.24 };
      case 'ui_chime':
        return { seed, name: 'UI Chime', preset, wave: 'triangle', freqStart: 520 * j, freqEnd: 780 * j, durationSec: 0.09, volume: 0.15 };
      default:
        return { seed, name: 'Jump', preset, wave: 'triangle', freqStart: 300 * j, freqEnd: 590 * j, durationSec: 0.12, volume: 0.2 };
    }
  },

  generateCutsceneSpec(seed: number, weather: WeatherKind): GeneratedCutsceneSpec {
    return {
      seed,
      title: `Babak Lentera #${seed}`,
      durationSec: 6,
      weather,
      keyframes: [
        { timeSec: 0, pose: 'idle', xNorm: 0.18, yNorm: 0.72, caption: 'Bowo mengamati cakrawala.', effect: 'none' },
        { timeSec: 1.2, pose: 'walk', xNorm: 0.35, yNorm: 0.72, caption: 'Melangkah menuju Jembatan Badai.', effect: 'dust' },
        { timeSec: 2.4, pose: 'jump', xNorm: 0.5, yNorm: 0.48, caption: 'Melompati jurang bayangan!', effect: 'spark' },
        { timeSec: 3.6, pose: 'dash', xNorm: 0.68, yNorm: 0.65, caption: 'Dash Parry menembus proyektil!', effect: 'flash' },
        { timeSec: 4.8, pose: 'attack', xNorm: 0.8, yNorm: 0.7, caption: 'Tebasan Lentera Cahaya!', effect: 'shake' },
        { timeSec: 6.0, pose: 'idle', xNorm: 0.84, yNorm: 0.72, caption: 'Gerbang Timur bersinar terang.', effect: 'glow' }
      ]
    };
  },

  composeMovieFromPrompt(prompt: string, seed: number, weather: WeatherKind): GeneratedCutsceneSpec {
    const verbs = prompt
      .toLowerCase()
      .split(/\s+/)
      .filter((v) => v.length > 0);
    if (verbs.length === 0) return this.generateCutsceneSpec(seed, weather);
    const keyframes: CutsceneKeyframe[] = verbs.slice(0, 8).map((v, i) => {
      const pose =
        v.includes('lompat') || v.includes('jump')
          ? 'jump'
          : v.includes('dash')
            ? 'dash'
            : v.includes('serang') || v.includes('attack') || v.includes('burst')
              ? 'attack'
              : v.includes('jalan') || v.includes('walk')
                ? 'walk'
                : 'idle';
      const effect =
        pose === 'attack' ? 'shake' : pose === 'dash' ? 'flash' : pose === 'jump' ? 'spark' : 'glow';
      return {
        timeSec: i * 1.1,
        pose,
        xNorm: Math.min(0.86, 0.16 + i * 0.1),
        yNorm: pose === 'jump' ? 0.48 : 0.72,
        caption: `Action: ${v.toUpperCase()}`,
        effect
      };
    });
    return {
      seed,
      title: `Movie: ${prompt.slice(0, 28)}`,
      durationSec: Math.max(2, keyframes.length * 1.1),
      weather,
      keyframes
    };
  },

  generateTerrainSpec(seed: number, mode: string, biome: string): GeneratedTerrainSpec {
    const rng = BytecodeVm.createSeedRng(seed);
    const heights = Array.from({ length: 48 }, (_, i) => {
      const wave = Math.sin(i * 0.24 + seed * 0.1) * 28 + Math.sin(i * 0.55) * 14;
      return Math.min(132, Math.max(22, Math.round(64 + wave + (rng() - 0.5) * 18)));
    });
    const platforms = [
      { x: 90, y: 210, w: 120 },
      { x: 250, y: 165, w: 130 },
      { x: 400, y: 195, w: 110 }
    ];
    const biomeCap = biome.charAt(0).toUpperCase() + biome.slice(1);
    return {
      seed,
      name: `${biomeCap} Ridge #${seed}`,
      mode,
      biome,
      heights,
      platforms
    };
  },

  generatePropAsset(seed: number, kind: string): GeneratedPropSpec {
    const color =
      kind === 'potion' ? '#f43f5e' : kind === 'chest' ? '#fbbf24' : kind === 'crystal' ? '#38bdf8' : '#f97316';
    const pixelGrid = [
      '....##....',
      '...####...',
      '..######..',
      '..######..',
      '.########.',
      '.########.',
      '..######..',
      '..######..',
      '...####...',
      '....##....'
    ];
    const kindCap = kind.charAt(0).toUpperCase() + kind.slice(1);
    return { seed, name: `${kindCap} #${seed}`, kind, color, pixelGrid };
  },

  generateStateMachineSpec(seed: number, kind: string, _prompt = 'Hero'): GeneratedStateMachineSpec {
    if (kind === 'behavior') {
      return {
        seed,
        kind: 'behavior',
        initialState: 'patrol',
        states: ['patrol', 'alert', 'chase', 'telegraph', 'attack', 'retreat'],
        transitions: [
          { from: 'patrol', event: 'player_in_180px', to: 'alert', guard: 'hp > 0' },
          { from: 'alert', event: 'los_confirmed', to: 'chase', guard: 'cooldown <= 0' },
          { from: 'chase', event: 'dist < 48px', to: 'telegraph', guard: 'grounded' },
          { from: 'telegraph', event: 'windup_done', to: 'attack', guard: 'true' },
          { from: 'attack', event: 'hp < 30%', to: 'retreat', guard: 'isBoss == false' }
        ],
        bytecodePreview: 'SET 1\nSPAWN 2\nSAY 10\nEND'
      };
    }
    return {
      seed,
      kind: 'movement',
      initialState: 'idle',
      states: ['idle', 'walk', 'jump', 'fall', 'dash', 'attack'],
      transitions: [
        { from: 'idle', event: 'moveX != 0', to: 'walk', guard: 'grounded' },
        { from: 'walk', event: 'jumpPressed', to: 'jump', guard: 'coyote > 0' },
        { from: 'jump', event: 'vy > 0', to: 'fall', guard: '!grounded' },
        { from: 'fall', event: 'dashPressed', to: 'dash', guard: 'dashCd <= 0' },
        { from: 'walk', event: 'attackPressed', to: 'attack', guard: 'atkCd <= 0' }
      ],
      bytecodePreview: 'SET 8\nADD 4\nSAY 1\nEND'
    };
  },

  generateGameplaySceneAndRules(seed: number, prompt: string): GeneratedGameplayBundleSpec {
    const q = prompt.toLowerCase();
    const genreId =
      q.includes('space') || q.includes('shooter')
        ? 'shooter'
        : q.includes('race') || q.includes('mode-7') || q.includes('turbo')
          ? 'racing'
          : q.includes('iso') || q.includes('rpg')
            ? 'rpg'
            : q.includes('rhythm') || q.includes('beat')
              ? 'rhythm'
              : q.includes('defense') || q.includes('tower')
                ? 'tower_defense'
                : 'platformer';
    return {
      seed,
      title: prompt.trim() || 'Bowo Quest',
      genreId,
      simKind: simKindForGenre(genreId),
      physicsMode: genreId === 'shooter' ? 'Zero-G' : 'Arcade',
      renderMode: q.includes('2d') ? '2D' : '2.5D',
      weather: q.includes('badai') || q.includes('storm') || q.includes('rain') ? 'Hujan' : 'Cerah',
      rules: [
        { id: 'gen_1', condition: 'shard_collect', action: 'score_100', enabled: true },
        { id: 'gen_2', condition: 'enemy_defeated', action: 'heal_10', enabled: true },
        { id: 'gen_3', condition: 'switch_activated', action: 'bonus_coin', enabled: true }
      ],
      uiHudTokens: ['HP_BAR', 'ENERGY_RING', 'SHARD_COUNTER', 'COMBO_BADGE']
    };
  },

  generateDubbingSubtitleSpec(seed: number, speaker: string, line: string, lang: string): GeneratedDubbingSpec {
    const cleanLine = line.trim() || 'Nyalakan Lentera Cahaya sekarang!';
    const dur = Math.max(1.6, cleanLine.split(' ').length * 0.42);
    const whole = Math.floor(dur);
    const ms = Math.floor((dur - whole) * 1000);
    const endSec = `00:00:${String(whole).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    const vttEnd = endSec.replace(',', '.');
    const spk = speaker.trim() || 'Bowo';
    const srtText = `1\n00:00:00,000 --> ${endSec}\n${spk}: ${cleanLine}`;
    const vttText = `WEBVTT\n\n00:00:00.000 --> ${vttEnd}\n${spk}: ${cleanLine}`;
    return { seed, speaker: spk, line: cleanLine, lang, durationSec: dur, pitch: 1, rate: 1, srtText, vttText };
  },

  generatePlatformTargetSpec(seed: number, target: string, appName: string): GeneratedPlatformTargetSpec {
    const cleanName = appName.trim() || 'Bowo V7';
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'mungil';
    const packageId = `com.aistudio.${slug}`;
    let configJson: string;
    if (target === 'apk') {
      configJson = JSON.stringify(
        {
          appName: cleanName,
          packageId,
          minSdk: 24,
          targetSdk: 36,
          itelA70Profile: { targetFps: 30, heapLimitMb: 48, drawCallsMax: 24 }
        },
        null,
        2
      );
    } else if (target === 'mcp') {
      configJson = JSON.stringify(
        {
          server: 'mungil-mcp-local',
          tools: ['mungil.create_level', 'mungil.run_qolbu_audit', 'mungil.switch_perspective'],
          appName: cleanName
        },
        null,
        2
      );
    } else if (target === 'ai_engine') {
      configJson = JSON.stringify(
        {
          engine: 'Mungil-Qolbu-V7',
          aiTickHz: 15,
          soACapacity: 1024,
          hybridModes: 5
        },
        null,
        2
      );
    } else {
      configJson = JSON.stringify(
        {
          name: cleanName,
          display: 'standalone',
          offlineCache: true
        },
        null,
        2
      );
    }
    return {
      seed,
      target,
      appName: cleanName,
      packageId,
      summary: `Target config ready for ${target} (${packageId})`,
      configJson
    };
  },

  generateSeoOpenGraphSpec(title: string, genre: string, desc: string): string {
    const cleanTitle = title.replace(/[<>"&]/g, '').trim() || 'Mungil Engine Game';
    const cleanDesc = desc.replace(/[<>"&]/g, '').trim() || `Play ${cleanTitle} (${genre}) built in Mungil Engine V7.`;
    return [
      `<title>${cleanTitle} — Mungil Engine</title>`,
      `<meta name="description" content="${cleanDesc}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:title" content="${cleanTitle}" />`,
      `<meta property="og:description" content="${cleanDesc}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${cleanTitle}" />`,
      `<meta name="twitter:description" content="${cleanDesc}" />`
    ].join('\n');
  },

  buildStandalonePlayableHtml(opts: {
    title: string;
    genreId: string;
    stylePalette: string[];
    level: number;
    bytecodeSrc: string;
  }): string {
    const escapeHtmlAttr = (str: string): string =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const escapeInlineJson = (obj: unknown): string =>
      JSON.stringify(obj)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');

    const safeTitle = escapeHtmlAttr(opts.title);
    const safeGenre = escapeHtmlAttr(opts.genreId);
    const payload = escapeInlineJson({
      title: opts.title,
      genreId: opts.genreId,
      level: opts.level,
      palette: opts.stylePalette.slice(0, 6),
      bytecodeLines: opts.bytecodeSrc.split('\n').length
    });

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>${safeTitle} — Playable HTML5 Export</title>
<meta name="description" content="Standalone playable micro-game (${safeGenre}) exported from Mungil Engine V7.">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="Play ${safeTitle} offline in any mobile or desktop browser.">
<style>
  *{box-sizing:border-box;margin:0;padding:0;user-select:none}
  body{background:#0b1221;color:#f8fafc;font-family:system-ui,sans-serif;display:flex;flex-direction:column;height:100dvh;overflow:hidden}
  header{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#111b2e;border-bottom:1px solid #273959;font-size:13px;font-weight:700}
  canvas{flex:1;width:100%;display:block;touch-action:none}
  .controls{position:fixed;bottom:14px;inset-x:14px;display:flex;justify-content:space-between;pointer-events:none}
  .pad{display:flex;gap:8px;pointer-events:auto}
  button{min-width:52px;min-height:52px;border-radius:999px;border:1px solid #38bdf8;background:#111b2ee6;color:#f8fafc;font-weight:800;font-size:12px}
</style>
</head>
<body>
<header><span id="ttl">${safeTitle}</span><span id="hud">Shards 0/3 · Score 0</span></header>
<canvas id="c"></canvas>
<div class="controls">
  <div class="pad"><button id="bl">◀</button><button id="br">▶</button></div>
  <div class="pad"><button id="bj">JUMP</button><button id="ba">ATK</button></div>
</div>
<script>
const CFG=${payload};
const c=document.getElementById('c'),ctx=c.getContext('2d'),hud=document.getElementById('hud');
const pal=CFG.palette.length?CFG.palette:['#0b1221','#38bdf8','#34d399','#fbbf24','#f43f5e'];
const p={x:60,y:240,vx:0,vy:0,w:24,h:32,g:false,atk:0,f:1};
const keys={l:0,r:0,j:0,a:0};
const shards=[{x:170,y:200,ok:0},{x:310,y:165,ok:0},{x:440,y:215,ok:0}];
const mob={x:260,y:260,vx:52,hp:3};
let score=0,won=false;
const bind=(id,k)=>{const el=document.getElementById(id);el.onpointerdown=e=>{e.preventDefault();keys[k]=1};el.onpointerup=()=>keys[k]=0;el.onpointercancel=()=>keys[k]=0};
bind('bl','l');bind('br','r');bind('bj','j');bind('ba','a');
window.onkeydown=e=>{if(e.code==='ArrowLeft'||e.code==='KeyA')keys.l=1;if(e.code==='ArrowRight'||e.code==='KeyD')keys.r=1;if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')keys.j=1;if(e.code==='KeyJ'||e.code==='KeyZ')keys.a=1};
window.onkeyup=e=>{if(e.code==='ArrowLeft'||e.code==='KeyA')keys.l=0;if(e.code==='ArrowRight'||e.code==='KeyD')keys.r=0;if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')keys.j=0;if(e.code==='KeyJ'||e.code==='KeyZ')keys.a=0};
let last=performance.now();
function loop(now){
  const dt=Math.min(0.05,(now-last)/1000);last=now;
  const w=c.clientWidth||540,h=c.clientHeight||340;
  if(c.width!==w||c.height!==h){c.width=w;c.height=h}
  const ground=h-56;
  if(!won){
    const mx=(keys.r?1:0)-(keys.l?1:0);
    if(mx!==0)p.f=mx;
    p.vx=mx*210;p.vy+=820*dt;
    if(keys.j&&p.g){p.vy=-360;p.g=false}
    if(keys.a&&p.atk<=0){p.atk=0.22;if(mob.hp>0&&Math.hypot(p.x-mob.x,p.y-mob.y)<54){mob.hp--;score+=50}}
    p.atk=Math.max(0,p.atk-dt);
    p.x=Math.max(12,Math.min(w-36,p.x+p.vx*dt));
    p.y+=p.vy*dt;
    if(p.y+p.h>=ground){p.y=ground-p.h;p.vy=0;p.g=true}
    if(mob.hp>0){mob.x+=mob.vx*dt;if(mob.x<120||mob.x>w-80)mob.vx*=-1}
    let got=0;
    shards.forEach(s=>{if(!s.ok&&Math.hypot(p.x-s.x,p.y-(ground-60))<34){s.ok=1;score+=100}if(s.ok)got++});
    if(got===shards.length&&p.x>w-90){won=true;score+=300}
    hud.textContent=won?'VICTORY · Score '+score:'Shards '+got+'/3 · Score '+score;
  }
  ctx.fillStyle=pal[0]||'#0b1221';ctx.fillRect(0,0,w,h);
  ctx.fillStyle=pal[2]||'#34d399';ctx.fillRect(0,ground,w,56);
  ctx.fillStyle='#fbbf24';ctx.fillRect(w-56,ground-64,34,64);
  shards.forEach(s=>{if(!s.ok){ctx.fillStyle=pal[1]||'#38bdf8';ctx.beginPath();ctx.arc(s.x,ground-54,9,0,7);ctx.fill()}});
  if(mob.hp>0){ctx.fillStyle=pal[4]||'#f43f5e';ctx.fillRect(mob.x,ground-28,26,28)}
  ctx.fillStyle=p.atk>0?'#fde047':(pal[1]||'#38bdf8');ctx.fillRect(p.x,p.y,p.w,p.h);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
</script>
</body>
</html>`;
  }
};
