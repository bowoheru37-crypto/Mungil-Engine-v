import React, { useState } from 'react';
import { AgentChatMessage, AiMcpAgent, LOCAL_MCP_TOOLS, TUTORIAL_STEPS } from '../../engine/aiMcpAgent';
import { CURATED_GITHUB_PLUGINS, GitHubConnectors } from '../../engine/githubConnectors';
import { QolbuCore } from '../../engine/qolbuCore';
import { QolbuSpace3DMath } from '../../engine/qolbuSpace3D';
import { GITHUB_REPO_CATEGORIES, GitHubRepoCategory, GitHubRepoPlugin } from '../../engine/types';
import { useEngineStore } from '../../state/useEngineStore';
import { ActionButton, Card, FilterChip, TextField } from '../ui/Primitives';

export const StudioAgentTab: React.FC = () => {
  const { state, updateSettings, openStudioTab, executeLocalMcpTool, playWizardGame, loadGitHubLiveSearch, showBanner } =
    useEngineStore();

  const [section, setSection] = useState(0); // 0=AI & Wizard, 1=MCP, 2=3D & GitHub, 3=Qolbu Audit

  // Section 0 states
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<AgentChatMessage[]>([
    {
      from: 'Qolbu AI',
      text: 'Tanyakan tentang Zero-GC, Physics Preset, Boss Kala, atau minta saya membuat game baru!',
      recommendedTab: null,
      toolUsed: null
    }
  ]);

  const [wizName, setWizName] = useState('Lentera Nusantara');
  const [wizHero, setWizHero] = useState('Bowo Kilat');
  const [wizGenre, setWizGenre] = useState('Arena');
  const [wizPreset, setWizPreset] = useState('NORMAL');
  const [wizAi, setWizAi] = useState('Bareng');

  // Section 2 states
  const [ghQuery, setGhQuery] = useState('');
  const [ghCategory, setGhCategory] = useState<GitHubRepoCategory>('all');
  const [ghPlugins, setGhPlugins] = useState<GitHubRepoPlugin[]>(CURATED_GITHUB_PLUGINS);
  const [ghStatus, setGhStatus] = useState('21 Curated Offline Cleanroom Plugins');
  const [searching, setSearching] = useState(false);

  // Section 3 states
  const [auditReport, setAuditReport] = useState(() =>
    QolbuCore.runQolbu8StageAudit(state.hud.drawCalls, state.hud.heapMb)
  );

  return (
    <div className="space-y-4 pb-8">
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {['AI & Wizard', 'MCP (16 Tools)', '3D & GitHub', 'Qolbu Audit'].map((lbl, idx) => (
          <FilterChip key={lbl} selected={section === idx} onClick={() => setSection(idx)} className="shrink-0">
            {lbl}
          </FilterChip>
        ))}
      </div>

      {section === 0 && (
        <>
          <Card className="space-y-3">
            <h2 className="font-display text-base font-bold">Offline Qolbu AI Assistant & Router</h2>
            <TextField
              label="Ask Qolbu or prompt a game"
              value={prompt}
              onChange={setPrompt}
              placeholder="Bagaimana cara mengalahkan Boss Kala?"
            />
            <div className="flex gap-2">
              <ActionButton
                className="flex-1"
                onClick={() => {
                  const q = prompt.trim() || 'Bagaimana cara mengalahkan Boss Kala?';
                  const [reply, tool, tab] = AiMcpAgent.routePromptWithTrace(
                    q,
                    state.activeLevel,
                    (conn) => updateSettings((s) => ({ ...s, perspectiveConnector: conn })),
                    (mode) => updateSettings((s) => ({ ...s, aiMode: mode })),
                    (title) => updateSettings((s) => ({ ...s, gameName: title }))
                  );
                  setChatHistory((prev) =>
                    [
                      { from: 'Qolbu AI', text: reply, recommendedTab: tab, toolUsed: tool },
                      { from: 'You', text: q, recommendedTab: null, toolUsed: null },
                      ...prev
                    ].slice(0, 8)
                  );
                  setPrompt('');
                }}
              >
                Send Prompt
              </ActionButton>
              <ActionButton
                variant="outline"
                onClick={() => {
                  const [reply, tab] = AiMcpAgent.askQolbuAgent('itel gc memory');
                  setChatHistory((prev) =>
                    [
                      { from: 'Qolbu AI', text: reply, recommendedTab: tab, toolUsed: 'mcp.explain_engine' },
                      ...prev
                    ].slice(0, 8)
                  );
                }}
              >
                A70 Tip
              </ActionButton>
            </div>

            <div className="space-y-2">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className="rounded-xl p-2.5 text-xs"
                  style={{
                    backgroundColor:
                      msg.from === 'You'
                        ? 'color-mix(in srgb, var(--me-primary) 16%, var(--me-surface-variant))'
                        : 'var(--me-surface-variant)'
                  }}
                >
                  <div className="mb-0.5 text-[11px] font-bold" style={{ color: 'var(--me-primary)' }}>
                    {msg.from}
                    {msg.toolUsed ? ` [${msg.toolUsed}]` : ''}
                  </div>
                  <div>{msg.text}</div>
                  {msg.recommendedTab && (
                    <button
                      type="button"
                      onClick={() => openStudioTab(msg.recommendedTab!)}
                      className="mt-1.5 cursor-pointer text-xs font-bold underline"
                      style={{ color: 'var(--me-primary)' }}
                    >
                      Open {msg.recommendedTab.toUpperCase()} Tab
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="font-display text-base font-bold">5-Step Game Creation Wizard</h2>
            <TextField label="1. Game Title" value={wizName} onChange={setWizName} />
            <TextField label="2. Hero Name" value={wizHero} onChange={setWizHero} />

            <div className="grid grid-cols-4 gap-1.5">
              {['Platformer', 'Arena', 'RPG', 'Runner'].map((g) => (
                <FilterChip key={g} selected={wizGenre === g} onClick={() => setWizGenre(g)}>
                  {g}
                </FilterChip>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {['NORMAL', 'BOUNCY', 'SLIPPERY'].map((p) => (
                <FilterChip key={p} selected={wizPreset === p} onClick={() => setWizPreset(p)}>
                  {p}
                </FilterChip>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {['Sendiri', 'Bareng', 'Lawan'].map((m) => (
                <FilterChip key={m} selected={wizAi === m} onClick={() => setWizAi(m)}>
                  {m}
                </FilterChip>
              ))}
            </div>

            <ActionButton
              fullWidth
              onClick={() => {
                const spec = AiMcpAgent.buildWizardGameSpec(
                  wizName,
                  wizGenre,
                  'Bowo',
                  wizHero,
                  wizPreset,
                  'Desa Fajar',
                  3,
                  4,
                  wizAi,
                  'Normal',
                  90
                );
                updateSettings((s) => ({ ...s, myWizardGames: [spec, ...s.myWizardGames] }));
                playWizardGame(spec);
              }}
            >
              Create & Play in Arena AI
            </ActionButton>
          </Card>

          <div className="space-y-2">
            <h3 className="font-display text-base font-bold">My Wizard Games ({state.myWizardGames.length})</h3>
            {state.myWizardGames.map((g) => (
              <Card key={g.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{g.name}</div>
                  <div className="text-xs" style={{ color: 'var(--me-text-muted)' }}>
                    {g.genre} · {g.preset} · AI: {g.aiMode} · {g.difficulty}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <ActionButton onClick={() => playWizardGame(g)}>Play</ActionButton>
                  <ActionButton
                    variant="ghost"
                    onClick={() =>
                      updateSettings((s) => ({
                        ...s,
                        myWizardGames: s.myWizardGames.filter((item) => item.id !== g.id)
                      }))
                    }
                  >
                    Del
                  </ActionButton>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-base font-bold">10-Step Interactive Guide</h3>
            {TUTORIAL_STEPS.map((step) => (
              <button
                key={step.step}
                type="button"
                onClick={() => openStudioTab(step.targetTab)}
                className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border p-3 text-left transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--me-surface)', borderColor: 'var(--me-border)' }}
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold">
                    {step.step}. {step.title}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--me-text-muted)' }}>
                    {step.desc}
                  </div>
                </div>
                <span className="shrink-0 text-xs font-bold" style={{ color: 'var(--me-primary)' }}>
                  {step.targetTab.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {section === 1 && (
        <div className="space-y-2.5">
          <Card className="space-y-1.5">
            <h2 className="font-display text-base font-bold">Local Offline MCP Hub (16 Tools)</h2>
            {state.mcpLogs.slice(0, 5).map((log, i) => (
              <p key={i} className="font-mono-code text-xs" style={{ color: 'var(--me-secondary)' }}>
                {log}
              </p>
            ))}
          </Card>

          {LOCAL_MCP_TOOLS.map((tool) => (
            <Card key={tool.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{tool.name}</div>
                <div className="text-xs" style={{ color: 'var(--me-text-muted)' }}>
                  {tool.desc}
                </div>
              </div>
              <ActionButton variant="tonal" onClick={() => executeLocalMcpTool(tool.id)}>
                Run
              </ActionButton>
            </Card>
          ))}
        </div>
      )}

      {section === 2 && (
        <div className="space-y-3">
          <Card className="space-y-2.5">
            <h2 className="font-display text-base font-bold">QolbuSpace3D: Camera & 5 Hybrid Modes</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {QolbuSpace3DMath.CAMERA_3_PRESETS.map((cam) => (
                <FilterChip
                  key={cam.id}
                  selected={state.cameraPreset === cam.id}
                  onClick={() => updateSettings((s) => ({ ...s, cameraPreset: cam.id }))}
                >
                  {cam.id.toUpperCase()}
                </FilterChip>
              ))}
            </div>
            <div className="space-y-1">
              {QolbuSpace3DMath.HYBRID_5_MODES.map((hm) => (
                <label
                  key={hm.id}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5"
                >
                  <div>
                    <div className={`text-sm ${state.hybridMode === hm.id ? 'font-bold' : ''}`}>{hm.label}</div>
                    <div className="text-xs" style={{ color: 'var(--me-text-muted)' }}>
                      {hm.desc}
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="hybrid-mode"
                    checked={state.hybridMode === hm.id}
                    onChange={() => updateSettings((s) => ({ ...s, hybridMode: hm.id }))}
                    className="h-4 w-4 accent-sky-400"
                  />
                </label>
              ))}
            </div>
          </Card>

          <Card className="space-y-2.5">
            <h2 className="font-display text-base font-bold">10 Perspective Connectors & 4 Quality Profiles</h2>
            <div className="space-y-1.5">
              {QolbuCore.VISUAL_QUALITY_PROFILES.map((vp) => (
                <FilterChip
                  key={vp.id}
                  selected={state.visualQuality === vp.id}
                  onClick={() => updateSettings((s) => ({ ...s, visualQuality: vp.id }))}
                  className="w-full justify-start"
                >
                  {vp.label} ({Math.round(vp.resolutionScale * 100)}% scale, {vp.maxParticles} particles)
                </FilterChip>
              ))}
            </div>
            <div className="space-y-1 pt-1">
              {QolbuCore.ENGINE_CONNECTORS.map((conn) => (
                <label
                  key={conn.id}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5"
                >
                  <div>
                    <div className="text-xs font-semibold">
                      {conn.title} ({conn.drawCallBudget} DC)
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--me-text-muted)' }}>
                      {conn.githubInspiration} · {conn.summary}
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="perspective-connector"
                    checked={state.perspectiveConnector === conn.id}
                    onChange={() => updateSettings((s) => ({ ...s, perspectiveConnector: conn.id }))}
                    className="h-4 w-4 accent-sky-400"
                  />
                </label>
              ))}
            </div>
          </Card>

          <Card className="space-y-2.5">
            <h2 className="font-display text-base font-bold">GitHub Engine Plugin Hub</h2>
            <div className="flex items-end gap-2">
              <TextField
                label="Filter / Search GitHub"
                value={ghQuery}
                onChange={(q) => {
                  setGhQuery(q);
                  setGhPlugins(GitHubConnectors.filterCuratedGitHubPlugins(q, ghCategory));
                }}
                className="flex-1"
              />
              <ActionButton
                disabled={searching}
                onClick={async () => {
                  setSearching(true);
                  const resp = await loadGitHubLiveSearch(ghQuery, ghCategory);
                  setGhPlugins(resp.results);
                  setGhStatus(`${resp.mode}: ${resp.note}`);
                  setSearching(false);
                }}
              >
                {searching ? '...' : 'Sync'}
              </ActionButton>
            </div>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {GITHUB_REPO_CATEGORIES.map((cat) => (
                <FilterChip
                  key={cat.id}
                  selected={ghCategory === cat.id}
                  onClick={() => {
                    setGhCategory(cat.id);
                    setGhPlugins(GitHubConnectors.filterCuratedGitHubPlugins(ghQuery, cat.id));
                  }}
                  className="shrink-0"
                >
                  {cat.label}
                </FilterChip>
              ))}
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--me-primary)' }}>
              {ghStatus}
            </p>
            <div className="space-y-1.5">
              {ghPlugins.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 py-1">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold">
                      {p.repo} ({p.starsLabel})
                    </div>
                    <div className="truncate text-[11px]" style={{ color: 'var(--me-text-muted)' }}>
                      {p.dnaPattern}
                    </div>
                  </div>
                  <ActionButton
                    variant="tonal"
                    onClick={() => {
                      updateSettings((s) => ({
                        ...s,
                        activeGitHubRepoId: p.id,
                        hybridMode: p.recommendedHybridMode,
                        cameraPreset: p.recommendedCamera
                      }));
                      showBanner(`Activated plugin ${p.repo}`);
                    }}
                  >
                    {state.activeGitHubRepoId === p.id ? 'Active' : 'Use'}
                  </ActionButton>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {section === 3 && (
        <div className="space-y-3">
          <Card className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Qolbu 8-Stage Audit & Fuzz</h2>
              <ActionButton
                onClick={() => setAuditReport(QolbuCore.runQolbu8StageAudit(state.hud.drawCalls, state.hud.heapMb))}
              >
                Re-Run
              </ActionButton>
            </div>
            <p
              className="text-xs font-bold"
              style={{ color: auditReport.allPassed ? '#34d399' : '#f43f5e' }}
            >
              {auditReport.allPassed
                ? `ALL 8 STAGES PASSED (${auditReport.fuzzBlockedCount}/${auditReport.fuzzEventsTested} fuzz blocked)`
                : 'AUDIT WARNING'}
            </p>
            <div className="space-y-1">
              {auditReport.stages.map((st) => (
                <div key={st.stage} className="flex items-center justify-between gap-2 text-xs">
                  <span>
                    {st.stage}. {st.name}
                  </span>
                  <span
                    className="font-mono-code font-semibold"
                    style={{ color: st.passed ? '#34d399' : '#f43f5e' }}
                  >
                    {st.passed ? 'PASS' : 'FAIL'} ({st.detail})
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-1.5">
            <h2 className="font-display text-base font-bold">12-Layer Cleanroom Stack</h2>
            {QolbuCore.LAYER_ARCHITECTURE_12.map(([num, title]) => (
              <p key={num} className="text-xs">
                Layer {num}: {title}
              </p>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
};
