import { BytecodeVm } from './bytecodeVm';
import { simKindForGenre } from './gameSimulationData';
import { Space3DConstants } from './qolbuSpace3D';
import {
  AiPlayMode,
  ArtStyleId,
  BlueprintPrefabSpec,
  Camera3DPresetId,
  GeneratedGameBlueprintSpec,
  GeneratedMesh3DSpec,
  HybridRender5Mode,
  Mesh3DTriangle,
  Mesh3DVertex,
  PerspectiveConnectorId
} from './types';

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

export const MeshAndBlueprintGenerators = {
  generateMesh3DFromPrompt(
    seed: number,
    prompt: string,
    category = 'character',
    sourceRepoId = 'gh_tripo_sr',
    boxOnly = false
  ): GeneratedMesh3DSpec {
    const vertices: Mesh3DVertex[] = [];
    const triangles: Mesh3DTriangle[] = [];

    if (boxOnly) {
      const s = 0.65;
      vertices.push(
        { x: -s, y: -s, z: -s }, { x: s, y: -s, z: -s }, { x: s, y: s, z: -s }, { x: -s, y: s, z: -s },
        { x: -s, y: -s, z: s }, { x: s, y: -s, z: s }, { x: s, y: s, z: s }, { x: -s, y: s, z: s }
      );
      const faces = [
        [0, 1, 2], [0, 2, 3],
        [4, 6, 5], [4, 7, 6],
        [0, 4, 5], [0, 5, 1],
        [3, 2, 6], [3, 6, 7],
        [0, 3, 7], [0, 7, 4],
        [1, 5, 6], [1, 6, 2]
      ];
      faces.forEach((f, idx) => {
        triangles.push({ a: f[0], b: f[1], c: f[2], color: idx % 2 === 0 ? '#38bdf8' : '#0284c7' });
      });
    } else {
      const rings = category === 'character' ? 7 : 5;
      const segs = category === 'character' ? 10 : 8;
      const rng = BytecodeVm.createSeedRng(seed + hashString(prompt));
      for (let r = 0; r <= rings; r++) {
        const y = -0.9 + (r / rings) * 1.8;
        let radius: number;
        if (category === 'character' && r === rings) radius = 0.16;
        else if (category === 'character' && r >= rings - 2) radius = 0.34;
        else if (category === 'character' && r >= 2 && r <= 4) radius = 0.48 + rng() * 0.08;
        else radius = 0.28 + Math.sin((r / rings) * Math.PI) * 0.42;
        for (let s = 0; s < segs; s++) {
          const theta = (s / segs) * 2 * Math.PI;
          vertices.push({ x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius });
        }
      }
      for (let r = 0; r < rings; r++) {
        for (let s = 0; s < segs; s++) {
          const nextS = (s + 1) % segs;
          const i0 = r * segs + s;
          const i1 = r * segs + nextS;
          const i2 = (r + 1) * segs + s;
          const i3 = (r + 1) * segs + nextS;
          const color = r >= rings - 2 ? '#fde047' : r % 2 === 0 ? '#38bdf8' : '#34d399';
          triangles.push({ a: i0, b: i1, c: i3, color });
          triangles.push({ a: i0, b: i3, c: i2, color });
        }
      }
    }

    const lines = [`# Mungil Engine V7 Low-Poly Mesh (${prompt})`];
    vertices.forEach((v) => lines.push(`v ${v.x.toFixed(3)} ${v.y.toFixed(3)} ${v.z.toFixed(3)}`));
    triangles.forEach((t) => lines.push(`f ${t.a + 1} ${t.b + 1} ${t.c + 1}`));

    const gltfJson = JSON.stringify(
      {
        asset: { version: '2.0', generator: 'Mungil-Engine-V7' },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0, name: prompt.slice(0, 24) }],
        meshes: [{ name: category, primitives: [{ mode: 4, triCount: triangles.length }] }]
      },
      null,
      2
    );

    const t0 = triangles.length;
    return {
      seed,
      prompt,
      category,
      sourceRepo: sourceRepoId,
      vertices,
      triangles,
      lodCounts: [t0, Math.max(8, Math.floor(t0 * 0.6)), Math.max(4, Math.floor(t0 * 0.3))],
      objText: `${lines.join('\n')}\n`,
      gltfJson,
      budgetOk: t0 <= Space3DConstants.CHAR_TRIS_LIMIT
    };
  },

  generateCompleteGameBlueprint(
    seed: number,
    prompt: string,
    activeRepoId = 'gh_axmol'
  ): GeneratedGameBlueprintSpec {
    const q = prompt.toLowerCase();
    const cameraPreset: Camera3DPresetId =
      q.includes('raycast') || q.includes('fps')
        ? 'fps_raycast'
        : q.includes('isometric') || q.includes('iso') || q.includes('hex')
          ? 'iso_fixed'
          : 'follow_3_4';
    const hybridMode: HybridRender5Mode =
      q.includes('raycast') || q.includes('fps')
        ? 'raycast_pseudo3d'
        : q.includes('mode-7') || q.includes('race') || q.includes('turbo')
          ? 'mode7_voxel'
          : q.includes('isometric') || q.includes('iso')
            ? 'isometric_painter'
            : q.includes('3d')
              ? 'real_3d_lowpoly'
              : 'hybrid_2_5d_billboard';

    let perspective: PerspectiveConnectorId = '2_5d_parallax';
    if (hybridMode === 'raycast_pseudo3d') perspective = 'fake_3d_raycast';
    else if (hybridMode === 'isometric_painter') perspective = 'isometric';
    else if (hybridMode === 'mode7_voxel') perspective = '2_5d_parallax';
    else if (hybridMode === 'real_3d_lowpoly') perspective = 'third_person';

    const aiMode: AiPlayMode = q.includes('autopilot') ? 'autopilot' : 'coop';
    const genreId =
      q.includes('race') || q.includes('mode-7')
        ? 'racing'
        : q.includes('danmaku') || q.includes('space') || q.includes('shooter')
          ? 'shooter'
          : q.includes('isometric') || q.includes('rpg')
            ? 'rpg'
            : q.includes('hex') || q.includes('bastion')
              ? 'tower_defense'
              : 'platformer';

    const styleId: ArtStyleId =
      q.includes('cyber') || q.includes('neon')
        ? 'cyberpunk'
        : q.includes('voxel')
          ? 'voxel'
          : q.includes('anime')
            ? 'anime'
            : 'pixel';

    const weather = q.includes('storm') || q.includes('badai') || q.includes('rain') ? 'Hujan' : 'Cerah';
    const prefabs: BlueprintPrefabSpec[] = [
      { name: 'Hero Bowo Rig', role: 'player', meshCategory: 'character', triCount: 120, collider: 'Capsule/Box' },
      { name: 'Guardian Mob', role: 'enemy', meshCategory: 'prop', triCount: 64, collider: 'Circle' },
      { name: 'Light Relic', role: 'pickup', meshCategory: 'prop', triCount: 24, collider: 'Trigger' }
    ];

    return {
      seed,
      title: prompt.trim() || 'Mungil Quest Forge',
      prompt,
      genreId,
      simKind: simKindForGenre(genreId),
      perspective,
      cameraPreset,
      hybridMode,
      physicsMode: genreId === 'shooter' ? 'Zero-G' : 'Arcade',
      renderMode: '2.5D',
      styleId,
      weather,
      aiMode,
      repoStack: [activeRepoId, 'gh_axmol', 'gh_mcp_game_deck'],
      prefabs,
      levelQuests: [
        'Ch 1: Collect Shards & Awaken Shrine',
        'Ch 2: Activate Switches & Reflect Bolts',
        'Ch 3: Defeat Boss Kala & Escape Gate'
      ],
      rules: [
        { id: 'bp_1', condition: 'shard_collect', action: 'score_100', enabled: true },
        { id: 'bp_2', condition: 'enemy_defeated', action: 'heal_10', enabled: true }
      ],
      budgetReport: {
        targetFps: 30,
        drawCallsEst: 18,
        trisEst: 208,
        heapMbEst: 21.5,
        passesA70: true
      }
    };
  }
};
