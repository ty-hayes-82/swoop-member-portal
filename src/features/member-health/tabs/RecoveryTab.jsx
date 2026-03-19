import { useMemo } from 'react';
import { getMemberSaves, getMonthlyTrends } from '@/services/boardReportService';
import { theme } from '@/config/theme';
import { Panel } from '@/components/ui';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '\u2014';
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return currencyFormatter.format(amount);
};

const recoveryMethods = [
  { method: 'Personal GM Call', success: 95, count: 6, color: theme.colors.success },
  { method: 'Event Invitation', success: 91, count: 3, color: theme.colors.info },
  { method: 'Billing Resolution', success: 100, count: 2, color: '#8b5cf6' },
  { method: 'Engagement Autopilot', success: 87, count: 4, color: theme.colors.accent },
];

export default function RecoveryTab() {
  const memberSaves = getMemberSaves();
  const trends = getMonthlyTrends();

  const kpis = useMemo(() => {
    const totalSaved = memberSaves.length;
    const avgImprovement = totalSaved > 0
      ? Math.round(memberSaves.reduce((sum, m) => sum + (m.healthAfter - m.healthBefore), 0) / totalSaved)
      : 0;
    const totalDuesProtected = memberSaves.reduce((sum, m) => sum + (m.duesAtRisk || 0), 0);
    return { totalSaved, avgImprovement, totalDuesProtected };
  }, [memberSaves]);

  const maxSaved = useMemo(() => Math.max(...trends.map(t => t.membersSaved), 1), [trends]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>

      {/* Recovery Summary KPIs */}
      <div className="grid-responsive-4">
        {[
          { label: 'Members Saved', value: kpis.totalSaved, color: theme.colors.success, subtitle: 'at-risk members retained' },
          { label: 'Avg Health Improvement', value: `+${kpis.avgImprovement} pts`, color: theme.colors.success, subtitle: 'average score recovery' },
          { label: 'Retention Rate', value: '100%', color: theme.colors.success, subtitle: 'of intervened members' },
          { label: 'Avg Response Time', value: '4.2 hrs', color: theme.colors.info, subtitle: 'from alert to first action' },
        ].map((kpi) => (
          <div key={kpi.label} style={{
            background: theme.colors.bgCard,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            borderRadius: '16px',
            border: `1px solid ${theme.colors.border}`,
            padding: theme.spacing.md,
          }}>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: theme.spacing.sm,
            }}>{kpi.label}</div>
            <div style={{
              fontSize: '28px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              color: kpi.color,
            }}>{kpi.value}</div>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              marginTop: 4,
            }}>{kpi.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Recovery Timeline */}
      <div style={{
        background: theme.colors.bgCard,
        borderRadius: '16px',
        border: `1px solid ${theme.colors.border}`,
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: theme.colors.success,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginBottom: '4px',
          }}>Recovery Timeline</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: theme.colors.textPrimary,
            margin: 0,
            lineHeight: 1.3,
          }}>Intervention Outcomes</h3>
          <p style={{
            fontSize: '12px',
            color: theme.colors.textMuted,
            margin: '6px 0 0',
          }}>
            Each intervention below turned an at-risk member into a retained, re-engaged member.
            Total dues protected: <strong style={{ color: theme.colors.success }}>{formatCurrency(kpis.totalDuesProtected)}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {memberSaves.map((save) => {
            const improvement = save.healthAfter - save.healthBefore;
            return (
              <div key={save.name} style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 100px 1.8fr 1fr',
                gap: theme.spacing.md,
                alignItems: 'center',
                padding: '14px 16px',
                background: theme.colors.bg,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '12px',
                fontSize: theme.fontSize.xs,
              }}>
                {/* Member + Trigger */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: theme.colors.textPrimary }}>{save.name}</div>
                  <div style={{ color: theme.colors.textMuted, marginTop: 2, lineHeight: 1.4 }}>{save.trigger}</div>
                </div>

                {/* Health Score Change */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: '13px',
                      color: theme.colors.urgent,
                    }}>{save.healthBefore}</span>
                    <span style={{ color: theme.colors.textMuted, fontSize: '14px' }}>{'\u2192'}</span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: '13px',
                      color: theme.colors.success,
                    }}>{save.healthAfter}</span>
                  </div>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: theme.colors.success,
                    marginTop: 2,
                  }}>+{improvement} pts</div>
                </div>

                {/* Action + Outcome */}
                <div>
                  <div style={{ color: theme.colors.textSecondary, lineHeight: 1.4 }}>
                    <strong style={{ color: theme.colors.info }}>Action:</strong> {save.action}
                  </div>
                  <div style={{ color: theme.colors.textSecondary, marginTop: 4, lineHeight: 1.4 }}>
                    <strong style={{ color: theme.colors.success }}>Outcome:</strong> {save.outcome}
                  </div>
                </div>

                {/* Dues Protected */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: '16px',
                    color: theme.colors.success,
                  }}>{formatCurrency(save.duesAtRisk)}</div>
                  <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginTop: 2 }}>dues protected</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recovery by Method */}
      <div style={{
        background: theme.colors.bgCard,
        borderRadius: '16px',
        border: `1px solid ${theme.colors.border}`,
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: theme.colors.accent,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginBottom: '4px',
          }}>Recovery by Method</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: theme.colors.textPrimary,
            margin: 0,
            lineHeight: 1.3,
          }}>Which Interventions Work Best</h3>
          <p style={{
            fontSize: '12px',
            color: theme.colors.textMuted,
            margin: '6px 0 0',
          }}>
            Success rate by intervention type across all recovery actions.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {recoveryMethods.map((rm) => (
            <div key={rm.method} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}>
              <div style={{ width: '160px', flexShrink: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: theme.colors.textPrimary }}>{rm.method}</div>
                <div style={{ fontSize: '11px', color: theme.colors.textMuted }}>{rm.count} interventions</div>
              </div>
              <div style={{ flex: 1, position: 'relative', height: '28px' }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: theme.colors.bg,
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.border}`,
                }} />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${rm.success}%`,
                  background: `${rm.color}20`,
                  borderRadius: '8px',
                  borderRight: `3px solid ${rm.color}`,
                }} />
              </div>
              <div style={{
                width: '60px',
                textAlign: 'right',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: '14px',
                color: rm.color,
              }}>{rm.success}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Recovery Trend */}
      <div style={{
        background: theme.colors.bgCard,
        borderRadius: '16px',
        border: `1px solid ${theme.colors.border}`,
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: theme.colors.info,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginBottom: '4px',
          }}>Monthly Trend</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: theme.colors.textPrimary,
            margin: 0,
            lineHeight: 1.3,
          }}>Recovery Volume Over Time</h3>
          <p style={{
            fontSize: '12px',
            color: theme.colors.textMuted,
            margin: '6px 0 0',
          }}>
            Members saved per month and response time improvement over the last 6 months.
          </p>
        </div>

        {/* Bar chart */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '12px',
          height: '160px',
          padding: '0 8px',
        }}>
          {trends.map((t) => {
            const barHeight = Math.max((t.membersSaved / maxSaved) * 140, 8);
            return (
              <div key={t.month} style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  fontWeight: 700,
                  color: theme.colors.success,
                }}>{t.membersSaved}</div>
                <div style={{
                  width: '100%',
                  maxWidth: '48px',
                  height: `${barHeight}px`,
                  background: `linear-gradient(180deg, ${theme.colors.success}, ${theme.colors.success}90)`,
                  borderRadius: '6px 6px 2px 2px',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute',
                    bottom: '-20px',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontSize: '10px',
                    color: theme.colors.textMuted,
                    fontWeight: 600,
                  }}>{t.month}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Supplementary metrics row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginTop: '40px',
          paddingTop: '16px',
          borderTop: `1px solid ${theme.colors.border}`,
        }}>
          {trends.map((t) => (
            <div key={t.month} style={{
              textAlign: 'center',
              padding: '8px',
              background: theme.colors.bg,
              borderRadius: '8px',
              border: `1px solid ${theme.colors.border}`,
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: theme.colors.textMuted }}>{t.month}</div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                fontWeight: 700,
                color: theme.colors.success,
                marginTop: 2,
              }}>{formatCurrency(t.duesProtected)}</div>
              <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>protected</div>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: t.responseTime <= 4.5 ? theme.colors.success : theme.colors.warning,
                marginTop: 4,
              }}>{t.responseTime}h response</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom callout */}
      <div style={{
        padding: '16px 20px',
        background: `linear-gradient(135deg, ${theme.colors.success}08, ${theme.colors.success}03)`,
        border: `1px solid ${theme.colors.success}30`,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: `${theme.colors.success}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          flexShrink: 0,
        }}>
          {'\u2705'}
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: theme.colors.success, marginBottom: '4px' }}>
            Every intervention here started as an alert on the Health Overview tab
          </div>
          <div style={{ fontSize: '12px', color: theme.colors.textSecondary, lineHeight: 1.6 }}>
            Swoop detected disengagement signals 6-8 weeks before any of these members would have resigned.
            The average health score improved by {kpis.avgImprovement} points after intervention, protecting {formatCurrency(kpis.totalDuesProtected)} in annual dues.
            Response time has improved from 8.1 hours in September to 3.8 hours in February.
          </div>
        </div>
      </div>
    </div>
  );
}
