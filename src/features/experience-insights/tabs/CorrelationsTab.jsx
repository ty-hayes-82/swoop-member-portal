import { theme } from '@/config/theme';
import { Sparkline, PlaybookActionCard } from '@/components/ui';
import { correlationInsights, correlationInsightsByArchetype } from '@/services/experienceInsightsService';

const impactColors = {
  high: theme.colors.urgent,
  medium: theme.colors.warning,
  low: theme.colors.textMuted,
};

export default function CorrelationsTab({ segment, archetype }) {
  const insights = archetype && correlationInsightsByArchetype[archetype]
    ? correlationInsightsByArchetype[archetype]
    : correlationInsights;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      {(segment !== 'all' || archetype) && (
        <div style={{
          padding: '8px 14px',
          background: theme.colors.accent + '08',
          border: '1px solid ' + theme.colors.accent + '20',
          borderRadius: theme.radius.sm,
          fontSize: theme.fontSize.xs,
          color: theme.colors.textSecondary,
        }}>
          Showing correlations for <strong>{archetype ?? segment}</strong> members — some patterns differ from the full population.
        </div>
      )}
      {insights.map((insight) => (
        <div
          key={insight.id}
          style={{
            background: theme.colors.bgCard,
            borderRadius: theme.radius.md,
            border: '1px solid ' + theme.colors.border,
            padding: theme.spacing.lg,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.sm }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                {insight.domains.map((d) => (
                  <span
                    key={d}
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: theme.colors.accent + '14',
                      color: theme.colors.accent,
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>
              <h3 style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary, margin: 0, lineHeight: 1.3 }}>
                {insight.headline}
              </h3>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '8px 14px',
                borderRadius: theme.radius.md,
                background: impactColors[insight.impact] + '12',
                border: '1px solid ' + impactColors[insight.impact] + '30',
                flexShrink: 0,
                marginLeft: theme.spacing.md,
              }}
            >
              <div style={{ fontSize: '20px', fontWeight: 700, color: impactColors[insight.impact], fontFamily: theme.fonts.mono }}>
                {insight.metric.value}
              </div>
              <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginTop: '2px' }}>
                {insight.metric.label}
              </div>
              {insight.trend && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 20, width: 60, margin: '0 auto' }}>
                    <Sparkline data={insight.trend} color={insight.deltaDirection === 'up' ? theme.colors.success : theme.colors.info} height={20} />
                  </div>
                  {insight.delta && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: insight.deltaDirection === 'up' ? theme.colors.success : theme.colors.warning, marginTop: 2 }}>
                      {insight.deltaDirection === 'up' ? '↑' : '↓'} {insight.delta}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.6, margin: 0 }}>
            {insight.detail}
          </p>
          {insight.deltaDirection === 'down' && insight.delta && (
            <div style={{
              marginTop: theme.spacing.sm, padding: '8px 12px',
              background: `${theme.colors.warning}08`, border: `1px solid ${theme.colors.warning}25`,
              borderRadius: theme.radius.sm, fontSize: theme.fontSize.xs,
              color: theme.colors.warning, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              ⚠ Investigate: this correlation is weakening ({insight.delta} vs. prior quarter). Check for operational changes, seasonal patterns, or data shifts.
            </div>
          )}
        </div>
      ))}

      {/* Contextual playbook actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: theme.spacing.md }}>
        <PlaybookActionCard
          icon={'🍽️'}
          title="98 members never dine post-round. Activate Dining Dormancy Recovery."
          description="Members who dine after rounds renew at 92% vs. 61%. Close this gap with a targeted dining incentive."
          playbookName="Dining Dormancy Recovery"
          impact="$11K/mo"
          memberCount={98}
          buttonColor="#ea580c"
        />
        <PlaybookActionCard
          icon={'🚨'}
          title="5 open complaints unresolved >24hrs — activate rapid response."
          description="Each complaint resolved within 24hrs improves renewal by 18%. These 5 are past the window."
          playbookName="Service Failure Rapid Response"
          impact="$24K/mo"
          memberCount={5}
          buttonColor="#dc2626"
          variant="urgent"
        />
        <PlaybookActionCard
          icon={'🎫'}
          title="24 Ghost members, 0 events in 8 weeks — send event invitations."
          description="Event attendance is the 2nd strongest retention predictor. These members haven't attended any."
          playbookName="Post-Event Engagement Capture"
          impact="$6K/mo"
          memberCount={24}
          buttonColor="#22c55e"
        />
        <PlaybookActionCard
          icon={'📉'}
          title="30 members in multi-domain decline, $540K at risk."
          description="When golf, dining, and email all decline simultaneously, resignation follows within 60 days."
          playbookName="Declining Member Intervention"
          impact="$24K/mo"
          memberCount={30}
          buttonColor="#dc2626"
          variant="urgent"
        />
      </div>
    </div>
  );
}
