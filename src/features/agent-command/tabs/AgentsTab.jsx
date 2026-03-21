import { useState } from "react";
import { AgentStatusCard, AgentThoughtLog } from "@/components/ui";
import AgentConfigDrawer from "../AgentConfigDrawer";
import { getAgents, getThoughtLog } from "@/services/agentService";
import { trackAction } from '@/services/activityService';
import { useApp } from "@/context/AppContext";
import { theme } from "@/config/theme";

export default function AgentsTab() {
  const { getAgentStatus, toggleAgent } = useApp();
  const [expandedLog, setExpandedLog] = useState(null);
  const [configAgent, setConfigAgent] = useState(null);
  const agents = getAgents();

  const activeCount = agents.filter((agent) => getAgentStatus(agent.id, agent.status) === "active").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.lg }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
        }}
      >
        <div>
          <div style={{ fontSize: theme.fontSize.md, color: theme.colors.textPrimary, fontWeight: 700 }}>Agent Fleet</div>
          <div style={{ marginTop: 2, fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
            {activeCount} active · {agents.length - activeCount} idle/learning
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.sm, color: theme.colors.agentCyan, fontWeight: 700 }}>
            {(() => {
              if (agents.length === 0) return '— avg accuracy';
              const avg = Math.round(agents.reduce((sum, a) => sum + (a.accuracy || 0), 0) / agents.length);
              return avg > 0 ? `${avg}% avg accuracy` : 'Learning — collecting baseline';
            })()}
          </div>
          {agents.length > 0 && agents.reduce((sum, a) => sum + (a.accuracy || 0), 0) === 0 && (
            <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginTop: 2 }}>
              Agents build accuracy over 30 days of approved actions
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: theme.spacing.md }}>
        {agents.map((agent) => (
          <div key={agent.id}>
            <AgentStatusCard
              agent={agent}
              overrideStatus={getAgentStatus(agent.id, agent.status)}
              onToggle={() => {
                const currentStatus = getAgentStatus(agent.id, agent.status);
                toggleAgent(agent.id, currentStatus);
                trackAction({ actionType: 'toggle_agent', actionSubtype: currentStatus === 'active' ? 'deactivate' : 'activate', agentId: agent.id, description: agent.name });
              }}
              onViewLog={() => setExpandedLog((current) => (current === agent.id ? null : agent.id))}
              onConfigure={() => setConfigAgent((current) => (current === agent.id ? null : agent.id))}
            />

            {expandedLog === agent.id && (
              <div
                style={{
                  marginTop: 8,
                  background: theme.colors.bgCard,
                  border: `1px solid ${theme.colors.agentCyan}33`,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.md,
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: theme.colors.agentCyan,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 8,
                  }}
                >
                  Reasoning Chain
                </div>
                <AgentThoughtLog thoughts={getThoughtLog(agent.id)} />
              </div>
            )}

            {configAgent === agent.id && (
              <AgentConfigDrawer
                agent={agent}
                initialConfig={{}}
                onSave={(cfg) => {
                  trackAction({ actionType: 'config_agent', actionSubtype: 'save', agentId: agent.id, description: agent.name, meta: cfg });
                  // Wire to real agent config API
                  const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;
                  if (clubId) {
                    fetch('/api/agent-autonomous', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'update_config',
                        clubId,
                        agentId: agent.id,
                        config: {
                          enabled: cfg.enabled !== false,
                          auto_approve_threshold: cfg.confidenceThreshold || 0.80,
                          auto_approve_enabled: cfg.autoApprove || false,
                        },
                      }),
                    }).catch(() => {});
                  }
                  setConfigAgent(null);
                }}
                onClose={() => setConfigAgent(null)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
