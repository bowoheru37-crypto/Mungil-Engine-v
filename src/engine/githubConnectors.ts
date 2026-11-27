import {
  GITHUB_REPO_CATEGORIES,
  GitHubRepoCategory,
  GitHubRepoPlugin
} from './types';

export interface GitHubSearchResponse {
  results: GitHubRepoPlugin[];
  mode: string;
  note: string;
}

export const CURATED_GITHUB_PLUGINS: GitHubRepoPlugin[] = [
  { id: 'gh_42_cub3d', repo: 'AghlaAbdo/42_Cub3D', url: 'https://github.com/AghlaAbdo/42_Cub3D', category: 'fake_3d_raycast', license: 'MIT', starsLabel: '42-School', dnaPattern: '16x16 grid DDA raycast, textured wall slicing, yaw-only Camera C.', supportedPerspectives: ['fake_3d_raycast', 'first_person'], recommendedHybridMode: 'raycast_pseudo3d', recommendedCamera: 'fps_raycast', maxDrawCallsBudget: 28, maxTrisBudget: 1200 },
  { id: 'gh_wolfenstein_ray', repo: 'shiro1307/raycast_wolfenstein_renderer', url: 'https://github.com/shiro1307/raycast_wolfenstein_renderer', category: 'fake_3d_raycast', license: 'MIT', starsLabel: 'Raycast', dnaPattern: 'Vertical column DDA traversal with depth darkening fog.', supportedPerspectives: ['fake_3d_raycast', 'first_person'], recommendedHybridMode: 'raycast_pseudo3d', recommendedCamera: 'fps_raycast', maxDrawCallsBudget: 26, maxTrisBudget: 1000 },
  { id: 'gh_tinyraycaster', repo: 'ssloy/tinyraycaster', url: 'https://github.com/ssloy/tinyraycaster', category: 'fake_3d_raycast', license: 'WTFPL/MIT', starsLabel: '3.2k★', dnaPattern: 'Minimalist software raycaster & billboard Z-buffer sprite sorting.', supportedPerspectives: ['fake_3d_raycast', 'first_person', 'pseudo_3d_zstack'], recommendedHybridMode: 'raycast_pseudo3d', recommendedCamera: 'fps_raycast', maxDrawCallsBudget: 24, maxTrisBudget: 800 },
  { id: 'gh_awk_raycaster', repo: 'TheMozg/awk-raycaster', url: 'https://github.com/TheMozg/awk-raycaster', category: 'fake_3d_raycast', license: 'MIT', starsLabel: '1.1k★', dnaPattern: 'Zero-dependency integer DDA stepping with tiny LUT trig tables.', supportedPerspectives: ['fake_3d_raycast', 'first_person'], recommendedHybridMode: 'raycast_pseudo3d', recommendedCamera: 'fps_raycast', maxDrawCallsBudget: 18, maxTrisBudget: 400 },
  { id: 'gh_fake_racer', repo: 'johnatas-henrique/fake-racer', url: 'https://github.com/johnatas-henrique/fake-racer', category: 'mode7_voxel', license: 'MIT', starsLabel: 'OutRun-JS', dnaPattern: 'Segment road curve projection + depth-scaled roadside sprites.', supportedPerspectives: ['third_person', '2_5d_parallax'], recommendedHybridMode: 'mode7_voxel', recommendedCamera: 'follow_3_4', maxDrawCallsBudget: 20, maxTrisBudget: 2400 },
  { id: 'gh_mode7_floorcast', repo: 'Garebear/MODE-7-FLOORCAST', url: 'https://github.com/Garebear', category: 'mode7_voxel', license: 'MIT', starsLabel: 'Mode-7', dnaPattern: 'Scanline perspective floor casting with zero-WebGL CPU pixel strips.', supportedPerspectives: ['2_5d_parallax', 'third_person'], recommendedHybridMode: 'mode7_voxel', recommendedCamera: 'follow_3_4', maxDrawCallsBudget: 16, maxTrisBudget: 1600 },
  { id: 'gh_wurfel_engine', repo: 'odaymichael/Wurfel-Engine', url: 'https://github.com/odaymichael/Wurfel-Engine', category: 'mode7_voxel', license: 'Apache-2.0', starsLabel: 'Voxel-2.5D', dnaPattern: 'Heightmap terrain ray-marching & isometric voxel layer stamping.', supportedPerspectives: ['pseudo_3d_zstack', 'isometric', '2_5d_parallax'], recommendedHybridMode: 'mode7_voxel', recommendedCamera: 'follow_3_4', maxDrawCallsBudget: 24, maxTrisBudget: 6400 },
  { id: 'gh_trafficcone', repo: 'j03m/trafficcone', url: 'https://github.com/j03m/trafficcone', category: 'isometric_2_5d', license: 'MIT', starsLabel: 'Iso-2.5D', dnaPattern: 'Lightweight isometric tile picking, painter sort & extruded prisms.', supportedPerspectives: ['isometric', 'hexagonal', 'top_down'], recommendedHybridMode: 'isometric_painter', recommendedCamera: 'iso_fixed', maxDrawCallsBudget: 20, maxTrisBudget: 4200 },
  { id: 'gh_pixscape', repo: 'Pixscape/pixscape', url: 'https://github.com/Pixscape', category: 'isometric_2_5d', license: 'MIT', starsLabel: '2.5D-Canvas', dnaPattern: '2.5D layered sprite stacking, depth sorting & soft contact shadows.', supportedPerspectives: ['pseudo_3d_zstack', 'isometric', '2_5d_parallax'], recommendedHybridMode: 'hybrid_2_5d_billboard', recommendedCamera: 'follow_3_4', maxDrawCallsBudget: 22, maxTrisBudget: 3600 },
  { id: 'gh_detonator', repo: 'ensisoft/detonator', url: 'https://github.com/ensisoft/detonator', category: 'isometric_2_5d', license: 'GPL-3.0', starsLabel: 'C++/GLES', dnaPattern: '2D/2.5D scene graph hierarchy, container transforms & fixed-step physics.', supportedPerspectives: ['2d_side_h', '2d_side_v', 'top_down', '2_5d_parallax'], recommendedHybridMode: 'hybrid_2_5d_billboard', recommendedCamera: 'follow_3_4', maxDrawCallsBudget: 26, maxTrisBudget: 8000 },
  { id: 'gh_rbfx', repo: 'rbfx/rbfx', url: 'https://github.com/rbfx/rbfx', category: 'isometric_2_5d', license: 'MIT', starsLabel: '1.2k★', dnaPattern: 'Forward mobile 1-shader pipeline, LOD groups, and node scene serialization.', supportedPerspectives: ['third_person', 'isometric', 'first_person'], recommendedHybridMode: 'real_3d_lowpoly', recommendedCamera: 'follow_3_4', maxDrawCallsBudget: 32, maxTrisBudget: 24000 },
  { id: 'gh_pixalo', repo: 'pixalo/pixalo', url: 'https://github.com/pixalo/pixalo', category: 'web_mobile_lightweight', license: 'MIT', starsLabel: 'Web-2D', dnaPattern: 'Zero-bloat 2D loop with responsive mobile touch controls.', supportedPerspectives: ['2d_side_h', '2d_side_v', 'top_down'], recommendedHybridMode: 'hybrid_2_5d_billboard', recommendedCamera: 'follow_3_4', maxDrawCallsBudget: 18, maxTrisBudget: 2000 },
  { id: 'gh_melonjs', repo: 'melonjs/melonJS', url: 'https://github.com/melonjs/melonJS', category: 'web_mobile_lightweight', license: 'MIT', starsLabel: '5.5k★', dnaPattern: 'Tilemap culling, object pooling & mobile viewport scaling.', supportedPerspectives: ['2d_side_h', 'isometric', 'top_down'], recommendedHybridMode: 'isometric_painter', recommendedCamera: 'iso_fixed', maxDrawCallsBudget: 24, maxTrisBudget: 3500 },
  { id: 'gh_axmol', repo: 'axmolengine/axmol', url: 'https://github.com/axmolengine/axmol', category: 'web_mobile_lightweight', license: 'MIT', starsLabel: '2.1k★', dnaPattern: 'Auto-batching draw calls <35, 1024x1024 atlas packing, Android ARM64/Go.', supportedPerspectives: ['2d_side_h', '2_5d_parallax', 'pseudo_3d_zstack'], recommendedHybridMode: 'hybrid_2_5d_billboard', recommendedCamera: 'follow_3_4', maxDrawCallsBudget: 22, maxTrisBudget: 16000 },
  { id: 'gh_skylicht', repo: 'skylicht-lab/skylicht-engine', url: 'https://github.com/skylicht-lab/skylicht-engine', category: 'web_mobile_lightweight', license: 'MIT', starsLabel: 'GLES3', dnaPattern: 'Mobile-first forward rendering, frustum culling, 3-level LOD & fog.', supportedPerspectives: ['third_person', 'isometric', 'first_person'], recommendedHybridMode: 'real_3d_lowpoly', recommendedCamera: 'follow_3_4', maxDrawCallsBudget: 30, maxTrisBudget: 44000 },
  { id: 'gh_defold', repo: 'defold/defold', url: 'https://github.com/defold/defold', category: 'web_mobile_lightweight', license: 'Defold-1.0', starsLabel: '5.1k★', dnaPattern: 'Ultra-compact binary runtime, 0-GC collection proxies & rig animation.', supportedPerspectives: ['2d_side_h', '2_5d_parallax', 'isometric', 'third_person'], recommendedHybridMode: 'hybrid_2_5d_billboard', recommendedCamera: 'follow_3_4', maxDrawCallsBudget: 18, maxTrisBudget: 18000 },
  { id: 'gh_tripo_sr', repo: 'VAST-AI-Research/TripoSR', url: 'https://github.com/VAST-AI-Research/TripoSR', category: '3d_mesh_generators', license: 'MIT', starsLabel: '7.4k★', dnaPattern: 'Image/Text-to-3D silhouette lofting, decimated <=800 tri character & glTF export.', supportedPerspectives: ['pseudo_3d_zstack', 'third_person', 'isometric'], recommendedHybridMode: 'real_3d_lowpoly', recommendedCamera: 'follow_3_4', maxDrawCallsBudget: 14, maxTrisBudget: 800 },
  { id: 'gh_meshy_lowpoly', repo: 'mrdoob/three.js-exporter-gltf', url: 'https://github.com/mrdoob/three.js', category: '3d_mesh_generators', license: 'MIT', starsLabel: 'glTF-2.0', dnaPattern: 'Low-poly primitive/lathe composition + 3-tier LOD decimation & OBJ/glTF pack.', supportedPerspectives: ['pseudo_3d_zstack', 'third_person', 'isometric'], recommendedHybridMode: 'real_3d_lowpoly', recommendedCamera: 'iso_fixed', maxDrawCallsBudget: 12, maxTrisBudget: 800 },
  { id: 'gh_zdog_stack', repo: 'metafizzy/zdog', url: 'https://github.com/metafizzy/zdog', category: '3d_mesh_generators', license: 'MIT', starsLabel: '10.6k★', dnaPattern: 'Round-cap pseudo-3D vector modeling on Canvas 2D with zero WebGL overhead.', supportedPerspectives: ['pseudo_3d_zstack', '2_5d_parallax'], recommendedHybridMode: 'hybrid_2_5d_billboard', recommendedCamera: 'follow_3_4', maxDrawCallsBudget: 12, maxTrisBudget: 200 },
  { id: 'gh_mcp_game_deck', repo: 'mcp-game-deck/mcp-game-deck', url: 'https://github.com/modelcontextprotocol/servers', category: 'ai_game_generators', license: 'MIT', starsLabel: 'MCP-Ready', dnaPattern: 'Prompt -> playable level blueprint, event rules, 16-bit bytecode & AI Co-Op driver.', supportedPerspectives: ['2d_side_h', 'isometric', 'hexagonal', 'top_down', 'third_person'], recommendedHybridMode: 'hybrid_2_5d_billboard', recommendedCamera: 'follow_3_4', maxDrawCallsBudget: 20, maxTrisBudget: 12000 },
  { id: 'gh_instaplay_gen', repo: 'instaplay-ai/zero-code-game-forge', url: 'https://github.com/topics/game-generator', category: 'ai_game_generators', license: 'Apache-2.0', starsLabel: 'AI-Forge', dnaPattern: 'Single-prompt genre fusion, 3-prefab A70 budget validator & instant playable launch.', supportedPerspectives: ['2_5d_parallax', 'isometric', 'first_person', 'third_person'], recommendedHybridMode: 'hybrid_2_5d_billboard', recommendedCamera: 'follow_3_4', maxDrawCallsBudget: 22, maxTrisBudget: 18000 }
];

export const GitHubConnectors = {
  CURATED_GITHUB_PLUGINS,

  filterCuratedGitHubPlugins(
    query: string,
    category: GitHubRepoCategory = 'all'
  ): GitHubRepoPlugin[] {
    const q = query.trim().toLowerCase();
    return CURATED_GITHUB_PLUGINS.filter((item) => {
      const catLabel = GITHUB_REPO_CATEGORIES.find((c) => c.id === item.category)?.label ?? '';
      const catMatch = category === 'all' || item.category === category;
      const qMatch =
        q === '' ||
        item.repo.toLowerCase().includes(q) ||
        item.dnaPattern.toLowerCase().includes(q) ||
        catLabel.toLowerCase().includes(q) ||
        item.supportedPerspectives.some((p) => p.toLowerCase().includes(q));
      return catMatch && qMatch;
    });
  },

  async searchGitHubReposWithFallback(
    query: string,
    category: GitHubRepoCategory = 'all'
  ): Promise<GitHubSearchResponse> {
    const localMatches = this.filterCuratedGitHubPlugins(query, category);
    const cleanQuery = query.trim() || 'lightweight game engine raycaster';
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2800);
    try {
      const encoded = encodeURIComponent(`${cleanQuery} in:name,description`);
      const res = await fetch(
        `https://api.github.com/search/repositories?q=${encoded}&sort=stars&order=desc&per_page=6`,
        {
          headers: { Accept: 'application/vnd.github+json' },
          signal: controller.signal
        }
      );
      window.clearTimeout(timer);
      if (!res.ok) {
        return {
          results: localMatches,
          mode: 'curated-offline',
          note: `GitHub API returned ${res.status} — using curated offline patterns.`
        };
      }
      const root = (await res.json()) as {
        items?: {
          id?: number;
          full_name?: string;
          html_url?: string;
          stargazers_count?: number;
          description?: string;
        }[];
      };
      const items = root.items ?? [];
      const liveItems: GitHubRepoPlugin[] = items
        .filter((el) => el.id != null && el.full_name)
        .map((el) => {
          const id = el.id as number;
          const fullName = el.full_name as string;
          const desc = (el.description || 'Lightweight game repository pattern.').slice(0, 120);
          const stars = el.stargazers_count ?? 0;
          const lower = `${fullName} ${desc}`.toLowerCase();
          const cat: GitHubRepoCategory = lower.includes('raycast')
            ? 'fake_3d_raycast'
            : lower.includes('iso')
              ? 'isometric_2_5d'
              : lower.includes('3d') || lower.includes('mesh') || lower.includes('gltf')
                ? '3d_mesh_generators'
                : lower.includes('mcp') || lower.includes('ai')
                  ? 'ai_game_generators'
                  : 'web_mobile_lightweight';
          const starsLabel = stars >= 1000 ? `${(stars / 1000).toFixed(1)}k★` : `${stars}★`;
          return {
            id: `gh_live_${id}`,
            repo: fullName,
            url: el.html_url ?? '',
            category: cat,
            license: 'OSS',
            starsLabel,
            dnaPattern: desc,
            supportedPerspectives: ['2d_side_h', '2_5d_parallax', 'third_person'],
            recommendedHybridMode: cat === 'fake_3d_raycast' ? 'raycast_pseudo3d' : 'hybrid_2_5d_billboard',
            recommendedCamera: cat === 'fake_3d_raycast' ? 'fps_raycast' : 'follow_3_4',
            maxDrawCallsBudget: 24,
            maxTrisBudget: cat === '3d_mesh_generators' ? 800 : 12000,
            source: 'live-github'
          };
        });
      const seen = new Set(localMatches.map((m) => m.repo.toLowerCase()));
      const merged = [...localMatches, ...liveItems.filter((item) => !seen.has(item.repo.toLowerCase()))];
      return {
        results: merged.length > 0 ? merged : CURATED_GITHUB_PLUGINS.slice(0, 6),
        mode: liveItems.length > 0 ? 'live-github' : 'curated-offline',
        note:
          liveItems.length > 0
            ? `Synced ${liveItems.length} live GitHub repos + curated patterns.`
            : 'Loaded curated offline patterns.'
      };
    } catch {
      window.clearTimeout(timer);
      return {
        results: localMatches,
        mode: 'curated-offline',
        note: 'Offline / timeout fallback — loaded curated cleanroom GitHub patterns.'
      };
    }
  }
};
