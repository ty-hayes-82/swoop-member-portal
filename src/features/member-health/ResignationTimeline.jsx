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

// Sentinel annotations — keyed by memberId (Step 12)
const SENTINEL_EVENTS = {
  'mbr_042': { date: 'Jan 5',  note: 'Retention Sentinel flagged multi-domain decay and proposed re-engagement invite — dismissed' },
  'mbr_117': { date: 'Jan 12', note: 'Retention Sentinel flagged complete disengagement and proposed personal GM outreach — not actioned' },
  'mbr_203': { date: 'Jan 13', note: 'Retention Sentinel flagged complaint + visit gap and proposed tee time invite — not actioned' },
  'mbr_089': { date: 'Jan 14', note: 'Retention Sentinel flagged round frequency decline and proposed waitlist priority offer — dismissed' },
  'mbr_271': { date: 'Jan 20', note: 'Retention Sentinel flagged obligation-only spend pattern and proposed F&B engagement — not actioned' },
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
                  {/* Retention Sentinel annotation — Step 12 */}
                  {SENTINEL_EVENTS[s.memberId] && (() => {
                    const sv = SENTINEL_EVENTS[s.memberId];
                    return (
                      <div style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'flex-start',
                        marginTop: 6, paddingTop: 8, borderTop: '1px dashed rgba(34,211,238,0.20)' }}>
                        <span style={{ flexShrink: 0, width: 70, fontSize: theme.fontSize.xs,
                          color: '#22D3EE', fontFamily: theme.fonts.mono, paddingTop: 2, opacity: 0.8 }}>
                          {sv.date}
                        </span>
                        <span style={{ flexShrink: 0, fontSize: 11, marginTop: 3, opacity: 0.7, color: '#22D3EE' }}>⬡</span>
                        <span style={{ fontSize: theme.fontSize.xs, color: '#22D3EE', lineHeight: 1.5, opacity: 0.85 }}>
                          {sv.note}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
