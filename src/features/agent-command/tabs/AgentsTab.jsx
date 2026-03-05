// features/agent-command/tabs/AgentsTab.jsx — 130 lines target
import { useState } from 'react';
import { AgentStatusCard, AgentThoughtLog } from '@/components/ui';
import { getAgentDefinitions, getThoughtLog } from '@/services/agentService';
import { useApp } from '@/context/AppContext';
import { theme } from '@/config/theme';
import AgentConfigDrawer from '../AgentConfigDrawer';

export default function AgentsTab() {
  const { toggleAgent, getAgentStatus, saveAgentConfig, getAgentConfig } = useApp();
  const agents = getAgentDefinitions();
  const [expandedLog, setExpandedLog] = useState(null);
  const [configAgent, setConfigAgent] = useState(null); // agentId showing config drawer

  const active = agents.filter(a => (getAgentStatus(a.id, a.status)) === 'active').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Header strip */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md, padding: theme.spacing.md, boxShadow: theme.shadow.sm,
      }}>
        <div>
          <div style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary }}>
            Agent Fleet
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>
            {active} of {agents.length} agents active · Running autonomously on your behalf
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80',
            boxShadow: '0 0 6px #4ADE80', display: 'inline-block' }} />
          <span style={{ fontSize: '11px', color: '#4ADE80', fontWeight: 600 }}>
            {active} Active
          </span>
        </div>
      </div>

      {/* Agent grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md }}>
        {agents.map(agent => (
          <div key={agent.id}>
            <AgentStatusCard
              agent={agent}
              overrideStatus={getAgentStatus(agent.id, agent.status)}
              onToggle={() => toggleAgent(agent.id, getAgentStatus(agent.id, agent.status))}
              onConfigure={() => {
                setConfigAgent(configAgent === agent.id ? null : agent.id);
                setExpandedLog(null);
              }}
              onViewLog={() => {
                setExpandedLog(expandedLog === agent.id ? null : agent.id);
                setConfigAgent(null);
              }}
            />

            {/* Config drawer */}
            {configAgent === agent.id && (
              <AgentConfigDrawer
                agent={agent}
                initialConfig={getAgentConfig(agent.id)}
                onSave={(cfg) => saveAgentConfig(agent.id, cfg)}
                onClose={() => setConfigAgent(null)}
              />
            )}

            {/* Thought log drawer */}
            {expandedLog === agent.id && (
              <div style={{
                marginTop: 8, background: theme.colors.bgCard,
                border: `1px solid rgba(34,211,238,0.2)`,
                borderRadius: theme.radius.md, padding: theme.spacing.md,
              }}>
                <div style={{
                  fontSize: '11px', fontWeight: 700, color: '#22D3EE',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
                }}>
                  ⬡ Last Thought Log — {agent.name}
                </div>
                {getThoughtLog(agent.id).length > 0 ? (
                  <AgentThoughtLog thoughts={getThoughtLog(agent.id)} />
                ) : (
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
                    fontFamily: theme.fonts.mono, padding: theme.spacing.sm }}>
                    No thought log available for this agent.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Philosophy strip */}
      <div style={{
        background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.12)',
        borderRadius: theme.radius.md, padding: theme.spacing.md,
      }}>
        <div style={{ fontSize: theme.fontSize.xs, color: 'rgba(34,211,238,0.7)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Control philosophy
        </div>
        <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.6 }}>
          Every agent action requires GM approval before execution. You can pause any agent at any time.
          Agents observe, score, and propose — you decide. The goal is to eliminate the gap between
          knowing and acting, not to replace judgment with automation.
        </div>
      </div>
    </div>
  );
}
