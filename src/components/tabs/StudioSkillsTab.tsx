import React, { useMemo, useState } from 'react';
import { AgentSkills } from '../../engine/agentSkills';
import { Catalogs } from '../../engine/catalogs';
import { useEngineStore } from '../../state/useEngineStore';
import { ActionButton, Card, FilterChip } from '../ui/Primitives';

export const StudioSkillsTab: React.FC = () => {
  const { copyText, exportFile } = useEngineStore();
  const packs = useMemo(() => AgentSkills.buildAgentSkillPack(), []);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const active = packs[selectedIdx];

  return (
    <div className="space-y-4 pb-8">
      <Card className="space-y-3">
        <h2 className="font-display text-base font-bold">AI Agent Skill Packs (5 Platforms)</h2>
        <div className="grid grid-cols-5 gap-1">
          {packs.map((p, idx) => (
            <FilterChip key={p.platform} selected={selectedIdx === idx} onClick={() => setSelectedIdx(idx)}>
              {p.platform.toUpperCase()}
            </FilterChip>
          ))}
        </div>
        <div className="text-sm font-bold" style={{ color: 'var(--me-primary)' }}>
          {active.title}
        </div>
        <p className="text-xs">{active.summary}</p>
        <p className="font-mono-code text-xs" style={{ color: 'var(--me-text-muted)' }}>
          {AgentSkills.getInstallCommandSnippet(active.platform)}
        </p>
        <pre className="font-mono-code max-h-60 overflow-auto rounded-xl bg-[#070d19] p-3 text-xs text-slate-300">
          {active.content}
        </pre>
        <div className="grid grid-cols-3 gap-2">
          <ActionButton onClick={() => copyText(active.filename, active.content)}>Copy</ActionButton>
          <ActionButton
            variant="tonal"
            onClick={() => exportFile(active.filename, active.content, 'text/markdown')}
          >
            Export .MD
          </ActionButton>
          <ActionButton
            variant="outline"
            onClick={() =>
              exportFile('mungil-agent-skills.json', AgentSkills.exportFullAgentBundleJson(), 'application/json')
            }
          >
            Bundle
          </ActionButton>
        </div>
      </Card>

      <div className="space-y-2">
        <h3 className="font-display text-base font-bold">5-Keyword Top-5 GitHub Matrix</h3>
        {Object.entries(Catalogs.KEYWORD_TOP5_REPOS).map(([kw, list]) => (
          <Card key={kw} className="space-y-1">
            <div className="text-sm font-bold" style={{ color: 'var(--me-primary)' }}>
              Keyword: {kw.toUpperCase()}
            </div>
            {list.map((entry) => (
              <p key={entry.name} className="text-xs">
                • {entry.name} ({entry.license}) — {entry.adapt}
              </p>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
};
