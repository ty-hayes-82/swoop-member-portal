import { useState } from 'react';
import { getResignationScenarios } from '@/services/memberService';
import { theme } from '@/config/theme';

const DOMAIN_COLORS = {
  Golf: theme.colors.chartGolf,
  'F&B': theme.colors.fb,
  Email: theme.colors.members,
  Feedback: theme.colors.urgent,
  All: theme.colors.textMuted,
  Membership: theme.colors.urgent,
};

const AGENT_ANNOTATIONS = {
  mbr_042: { date: 'Jan 5', note: 'Engagement Coach flagged multi-domain decay and proposed a re-activation invite. Action dismissed.' },
  mbr_117: { date: 'Jan 12', note: 'Retention Sentinel flagged complete disengagement and recommended personal GM outreach. Not actioned.' },
  mbr_203: { date: 'Jan 13', note: 'Service Recovery + Retention Sentinel flagged unresolved complaint with high resignation probability. Not actioned.' },
  mbr_089: { date: 'Jan 14', note: 'Demand Optimizer flagged high-value waitlist priority intervention. Action dismissed.' },
  mbr_271: { date: 'Jan 20', note: 'Engagement Coach flagged obligation-only spend pattern and recommended targeted F&B outreach.' },
};

export default function ResignationTimeline() {
  const scenarios = getResignationScenarios();
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
        5 preventable resignations in January — each with a distinct decay pattern.
      </div>
      {scenarios.map((scenario) => {
        const isOpen = expanded === scenario.memberId;
        const annotation = AGENT_ANNOTATIONS[scenario.memberId];
        return (
          <div
            key={scenario.memberId}
            style={{
              background: theme.colors.bgCardHover,
              borderRadius: theme.radius.md,
              border: `1px solid ${isOpen ? `${theme.colors.urgent}50` : theme.colors.border}`,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setExpanded(isOpen ? null : scenario.memberId)}
              style={{
                width: '100%',
                padding: theme.spacing.md,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontSize: theme.fontSize.md, fontWeight: 600, color: theme.colors.textPrimary }}>{scenario.name}</div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>
                  {scenario.archetype} · Resigned {scenario.resignDate} · ${(scenario.dues / 1000).toFixed(0)}K dues
                </div>
              </div>
              <span style={{ color: theme.colors.textMuted }}>{isOpen ? '▾' : '▸'}</span>
            </button>

            {isOpen && (
              <div style={{ padding: `0 ${theme.spacing.md} ${theme.spacing.md}`, borderTop: `1px solid ${theme.colors.border}` }}>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, padding: `${theme.spacing.sm} 0`, marginBottom: theme.spacing.sm }}>
                  Pattern: {scenario.pattern}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {scenario.timeline.map((point, index) => (
                    <div key={index} style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0, width: 70, fontSize: theme.fontSize.xs, color: theme.colors.textMuted, fontFamily: theme.fonts.mono, paddingTop: 2 }}>
                        {point.date}
                      </span>
                      <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: '50%', marginTop: 4, background: DOMAIN_COLORS[point.domain] ?? theme.colors.textMuted }} />
                      <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.5 }}>{point.event}</span>
                    </div>
                  ))}

                  {annotation && (
                    <div
                      style={{
                        display: 'flex',
                        gap: theme.spacing.md,
                        alignItems: 'flex-start',
                        marginTop: 6,
                        paddingTop: 8,
                        borderTop: `1px dashed ${theme.colors.agentCyan}33`,
                      }}
                    >
                      <span style={{ flexShrink: 0, width: 70, fontSize: theme.fontSize.xs, color: theme.colors.agentCyan, fontFamily: theme.fonts.mono, paddingTop: 2, opacity: 0.8 }}>
                        {annotation.date}
                      </span>
                      <span style={{ flexShrink: 0, fontSize: 11, marginTop: 3, opacity: 0.7, color: theme.colors.agentCyan }}>⬡</span>
                      <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.agentCyan, lineHeight: 1.5, opacity: 0.9 }}>{annotation.note}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
