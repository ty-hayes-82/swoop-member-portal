import { useState, useEffect } from "react";
import { AgentStatusCard, AgentThoughtLog } from "@/components/ui";
import AgentConfigDrawer from "../AgentConfigDrawer";
import { getAgents, getThoughtLog } from "@/services/agentService";
import { trackAction } from '@/services/activityService';
import { useApp } from "@/context/AppContext";
import { theme } from "@/config/theme";

// Agent domain dependency display
const AGENT_DOMAINS = {
  demand_optimizer: ['CRM', 'Tee Sheet'],
  engagement_autopilot: ['CRM', 'Email'],
  labor_optimizer: ['Tee Sheet', 'POS', 'Labor'],
  member_pulse: ['CRM'],
  revenue_analyst: ['CRM', 'Tee Sheet', 'POS'],
  service_recovery: ['CRM'],
};

export default function AgentsTab({ searchTerm }) {
  const { getAgentStatus, toggleAgent } = useApp();
  const [expandedLog, setExpandedLog] = useState(null);
  const [configAgent, setConfigAgent] = useState(null);
  const [featureAvailability, setFeatureAvailability] = useState(null);
  const agents = getAgents();

  // Fetch feature availability for domain dependency badges
  useEffect(() => {
    const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;
    if (clubId) {
      fetch(`/api/feature-availability?clubId=${clubId}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setFeatureAvailability(data); })
        .catch(() => {});
    }
  }, []);

  const getAgentAvailability = (agentId) => {
    if (!featureAvailability?.features) return null;
    return featureAvailability.features.find(f => f.key === agentId && f.type === 'agent');
  };

  // S3: Filter by search term
  const filteredAgents = searchTerm
    ? agents.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    : agents;

  const activeCount = filteredAgents.filter((agent) => getAgentStatus(agent.id, agent.status) === "active").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.lg }}>
      <div
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md, padding: theme.spacing.md,
        }}
      >
        <div>
          <div style={{ fontSize: theme.fontSize.md, color: theme.colors.textPrimary, fontWeight: 700 }}>Agent Fleet</div>
          <div style={{ marginTop: 2, fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
            {activeCount} active · {filteredAgents.length - activeCount} idle/learning
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
        {filteredAgents.map((agent) => {
          const availability = getAgentAvailability(agent.id);
          const isUnavailable = availability?.status === 'unavailable';
          const domains = AGENT_DOMAINS[agent.id] || [];

          return (
            <div key={agent.id} style={{ opacity: isUnavailable ? 0.6 : 1 }}>
              {/* Domain dependency badges */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
                {domains.map(d => {
                  const domainCode = d.replace(' ', '_').toUpperCase();
                  const connected = featureAvailability?.domains?.find(dom => dom.code === domainCode)?.connected;
                  return (
                    <span key={d} style={{
                      fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      background: connected === false ? `${theme.colors.urgent}12` : connected ? `${theme.colors.success}12` : `${theme.colors.textMuted}12`,
                      color: connected === false ? theme.colors.urgent : connected ? theme.colors.success : theme.colors.textMuted,
                    }}>{d}{connected === false ? ' ✗' : connected ? ' ✓' : ''}</span>
                  );
                })}
              </div>

              <AgentStatusCard
                agent={agent}
                overrideStatus={isUnavailable ? 'needs_data' : getAgentStatus(agent.id, agent.status)}
                onToggle={() => {
                  if (isUnavailable) return; // Don't allow activation when deps missing
                  const currentStatus = getAgentStatus(agent.id, agent.status);
                  toggleAgent(agent.id, currentStatus);
                  trackAction({ actionType: 'toggle_agent', actionSubtype: currentStatus === 'active' ? 'deactivate' : 'activate', agentId: agent.id, description: agent.name });
                }}
                onViewLog={() => setExpandedLog((current) => (current === agent.id ? null : agent.id))}
                onConfigure={() => setConfigAgent((current) => (current === agent.id ? null : agent.id))}
              />

              {/* Unavailable message */}
              {isUnavailable && availability?.fallbackMessage && (
                <div style={{
                  marginTop: 4, padding: '6px 10px', borderRadius: theme.radius.sm,
                  background: `${theme.colors.warning}08`, border: `1px solid ${theme.colors.warning}20`,
                  fontSize: '11px', color: theme.colors.warning,
                }}>
                  {availability.fallbackMessage}
                </div>
              )}

              {expandedLog === agent.id && (
                <div
                  style={{
                    marginTop: theme.spacing.sm, background: theme.colors.bgDeep,
                    border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md,
                    padding: theme.spacing.md,
                  }}
                >
                  <div
                    style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.agentCyan,
                      textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: theme.spacing.sm,
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
                    const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;
                    if (clubId) {
                      fetch('/api/agent-autonomous', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'update_config', clubId, agentId: agent.id,
                          config: { enabled: cfg.enabled !== false, auto_approve_threshold: cfg.confidenceThreshold || 0.80, auto_approve_enabled: cfg.autoApprove || false },
                        }),
                      }).catch(() => {});
                    }
                    setConfigAgent(null);
                  }}
                  onClose={() => setConfigAgent(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
