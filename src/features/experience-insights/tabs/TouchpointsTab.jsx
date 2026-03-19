import { theme } from '@/config/theme';
import { PlaybookActionCard } from '@/components/ui';
import { touchpointCorrelations, touchpointCorrelationsAtRisk, touchpointCorrelationsByArchetype } from '@/services/experienceInsightsService';

export default function TouchpointsTab({ segment, archetype }) {
  const source = archetype && touchpointCorrelationsByArchetype[archetype]
    ? touchpointCorrelationsByArchetype[archetype]
    : segment === 'at-risk' ? touchpointCorrelationsAtRisk : touchpointCorrelations;
  const sorted = [...source].sort((a, b) => b.retentionImpact - a.retentionImpact);
  const maxImpact = sorted[0]?.retentionImpact ?? 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: '0 0 8px' }}>
        Which touchpoints most strongly predict member retention? Ranked by correlation strength.
      </p>
      {sorted.map((tp, i) => {
        const barWidth = (tp.retentionImpact / maxImpact) * 100;
        const barColor = tp.retentionImpact >= 0.75
          ? theme.colors.success
          : tp.retentionImpact >= 0.6
          ? theme.colors.warning
          : theme.colors.textMuted;
        return (
          <div
            key={tp.touchpoint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
              padding: '10px 14px',
              background: i % 2 === 0 ? theme.colors.bgDeep : 'transparent',
              borderRadius: theme.radius.sm,
            }}
          >
            <span style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.textMuted, width: 20, textAlign: 'right' }}>
              #{i + 1}
            </span>
            <div style={{ width: 140, flexShrink: 0 }}>
              <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>{tp.touchpoint}</div>
            </div>
            <div style={{ flex: 1, position: 'relative', height: 20, background: theme.colors.border + '40', borderRadius: 4 }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: barWidth + '%',
                  background: barColor,
                  borderRadius: 4,
                  transition: 'width 0.5s ease',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: theme.colors.textPrimary,
                  fontFamily: theme.fonts.mono,
                }}
              >
                {(tp.retentionImpact * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: theme.spacing.md }}>
        {sorted.slice(0, 3).map((tp) => (
          <p key={tp.touchpoint} style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, margin: '4px 0', lineHeight: 1.5 }}>
            <strong>{tp.touchpoint}:</strong> {tp.description}
          </p>
        ))}
      </div>

      {/* Playbook links per top touchpoint */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: theme.spacing.md }}>
        <PlaybookActionCard variant="compact" icon={'🏌️'} title="Round Frequency → Declining Member Intervention" impact="$24K/mo" memberCount={30} playbookName="Declining Member Intervention" buttonLabel="See Playbook" buttonColor="#dc2626" />
        <PlaybookActionCard variant="compact" icon={'🚨'} title="Complaint Resolution → Service Save Protocol" impact="$18K/mo" memberCount={5} playbookName="Service Save Protocol" buttonLabel="See Playbook" buttonColor="#c0392b" />
        <PlaybookActionCard variant="compact" icon={'🍽️'} title="Post-Round Dining → Dining Dormancy Recovery" impact="$11K/mo" memberCount={98} playbookName="Dining Dormancy Recovery" buttonLabel="See Playbook" buttonColor="#ea580c" />
      </div>
    </div>
  );
}
