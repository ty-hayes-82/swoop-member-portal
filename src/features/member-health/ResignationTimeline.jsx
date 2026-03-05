import { useState } from 'react';
import { getResignationScenarios } from '@/services/memberService';
import { theme } from '@/config/theme';

const DOMAIN_COLORS = {
  Golf: theme.colors.chartGolf,
  'F&B': theme.colors.fb,
  Email: theme.colors.members,
  Feedback: theme.colors.urgent,
  All: theme.colors.textMuted,
  Membership: '#EF4444',
};

export default function ResignationTimeline() {
  const scenarios = getResignationScenarios();
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
        5 preventable resignations in January — each with a distinct decay pattern.
      </div>
      {scenarios.map(s => {
        const isOpen = expanded === s.memberId;
        return (
          <div key={s.memberId} style={{
            background: theme.colors.bgCardHover, borderRadius: theme.radius.md,
            border: `1px solid ${isOpen ? `${theme.colors.urgent}50` : theme.colors.border}`,
            overflow: 'hidden',
          }}>
            <button onClick={() => setExpanded(isOpen ? null : s.memberId)} style={{
              width: '100%', padding: theme.spacing.md, background: 'none', border: 'none',
              cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              textAlign: 'left',
            }}>
              <div>
                <div style={{ fontSize: theme.fontSize.md, fontWeight: 600,
                  color: theme.colors.textPrimary }}>{s.name}</div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>
                  {s.archetype} · Resigned {s.resignDate} · ${(s.dues / 1000).toFixed(0)}K dues
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 2 }}>
                  {s.keySignal}
                </div>
                <span style={{ color: theme.colors.textMuted }}>{isOpen ? '▾' : '▸'}</span>
              </div>
            </button>

            {isOpen && (
              <div style={{ padding: `0 ${theme.spacing.md} ${theme.spacing.md}`,
                borderTop: `1px solid ${theme.colors.border}` }}>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
                  padding: `${theme.spacing.sm} 0`, marginBottom: theme.spacing.sm }}>
                  Pattern: {s.pattern}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {s.timeline.map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0, width: 70, fontSize: theme.fontSize.xs,
                        color: theme.colors.textMuted, fontFamily: theme.fonts.mono, paddingTop: 2 }}>
                        {t.date}
                      </span>
                      <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: '50%', marginTop: 4,
                        background: DOMAIN_COLORS[t.domain] ?? theme.colors.textMuted }} />
                      <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary,
                        lineHeight: 1.5 }}>{t.event}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
