import { useState } from "react";
import { AgentStatusCard, AgentThoughtLog } from "@/components/ui";
import AgentConfigDrawer from "../AgentConfigDrawer";
import { getAgents, getThoughtLog } from "@/services/agentService";
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
        <div style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.sm, color: theme.colors.agentCyan, fontWeight: 700 }}>
          {agents.length > 0 ? Math.round(agents.reduce((sum, a) => sum + (a.accuracy || 0), 0) / agents.length) : '—'}% avg accuracy
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: theme.spacing.md }}>
        {agents.map((agent) => (
          <div key={agent.id}>
            <AgentStatusCard
              agent={agent}
              overrideStatus={getAgentStatus(agent.id, agent.status)}
              onToggle={() => toggleAgent(agent.id, getAgentStatus(agent.id, agent.status))}
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
                  console.log("Agent config saved:", agent.id, cfg);
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
