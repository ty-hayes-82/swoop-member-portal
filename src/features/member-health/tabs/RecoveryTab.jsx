import { useMemo } from 'react';
import { getMemberSaves, getMonthlyTrends } from '@/services/boardReportService';
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
  { method: 'Personal GM Call', success: 95, count: 6, color: '#22c55e' },
  { method: 'Event Invitation', success: 91, count: 3, color: '#2563eb' },
  { method: 'Billing Resolution', success: 100, count: 2, color: '#8b5cf6' },
  { method: 'Engagement Autopilot', success: 87, count: 4, color: '#465fff' },
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
    <div className="flex flex-col gap-6">

      {/* Recovery Summary KPIs */}
      <div className="grid-responsive-4">
        {[
          { label: 'Members Saved', value: kpis.totalSaved, color: '#22c55e', subtitle: 'at-risk members retained' },
          { label: 'Avg Health Improvement', value: `+${kpis.avgImprovement} pts`, color: '#22c55e', subtitle: 'average score recovery' },
          { label: 'Retention Rate', value: '100%', color: '#22c55e', subtitle: 'of intervened members' },
          { label: 'Avg Response Time', value: '4.2 hrs', color: '#2563eb', subtitle: 'from alert to first action' },
        ].map((kpi) => (
          <div key={kpi.label} style={{
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            borderRadius: '16px',
            border: `1px solid ${'#E5E7EB'}`,
            padding: '16px',
          }}>
            <div style={{
              fontSize: '12px',
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}>{kpi.label}</div>
            <div style={{
              fontSize: '28px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              color: kpi.color,
            }}>{kpi.value}</div>
            <div style={{
              fontSize: '12px',
              color: '#9CA3AF',
              marginTop: 4,
            }}>{kpi.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Recovery Timeline */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: `1px solid ${'#E5E7EB'}`,
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div className="mb-5">
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#22c55e',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginBottom: '4px',
          }}>Recovery Timeline</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1a1a2e',
            margin: 0,
            lineHeight: 1.3,
          }}>Intervention Outcomes</h3>
          <p style={{
            fontSize: '12px',
            color: '#9CA3AF',
            margin: '6px 0 0',
          }}>
            Each intervention below turned an at-risk member into a retained, re-engaged member.
            Total members retained: <strong className="text-success-500">{memberSaves.length}</strong>
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {memberSaves.map((save) => {
            const improvement = save.healthAfter - save.healthBefore;
            return (
              <div key={save.name} style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 100px 1.8fr 1fr',
                gap: '16px',
                alignItems: 'center',
                padding: '14px 16px',
                background: '#F8F9FA',
                border: `1px solid ${'#E5E7EB'}`,
                borderRadius: '12px',
                fontSize: '12px',
              }}>
                {/* Member + Trigger */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a2e' }}>{save.name}</div>
                  <div style={{ color: '#9CA3AF', marginTop: 2, lineHeight: 1.4 }}>{save.trigger}</div>
                </div>

                {/* Health Score Change */}
                <div className="text-center">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: '13px',
                      color: '#ef4444',
                    }}>{save.healthBefore}</span>
                    <span style={{ color: '#9CA3AF', fontSize: '14px' }}>{'\u2192'}</span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: '13px',
                      color: '#22c55e',
                    }}>{save.healthAfter}</span>
                  </div>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#22c55e',
                    marginTop: 2,
                  }}>+{improvement} pts</div>
                </div>

                {/* Action + Outcome */}
                <div>
                  <div style={{ color: '#6B7280', lineHeight: 1.4 }}>
                    <strong style={{ color: '#2563eb' }}>Action:</strong> {save.action}
                  </div>
                  <div style={{ color: '#6B7280', marginTop: 4, lineHeight: 1.4 }}>
                    <strong className="text-success-500">Outcome:</strong> {save.outcome}
                  </div>
                </div>

                {/* Member Retained */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#22c55e',
                  }}>Retained</div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: 2 }}>member saved</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recovery by Method */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: `1px solid ${'#E5E7EB'}`,
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div className="mb-5">
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#465fff',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginBottom: '4px',
          }}>Recovery by Method</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1a1a2e',
            margin: 0,
            lineHeight: 1.3,
          }}>Which Interventions Work Best</h3>
          <p style={{
            fontSize: '12px',
            color: '#9CA3AF',
            margin: '6px 0 0',
          }}>
            Success rate by intervention type across all recovery actions.
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          {recoveryMethods.map((rm) => (
            <div key={rm.method} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}>
              <div style={{ width: '160px', flexShrink: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e' }}>{rm.method}</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{rm.count} interventions</div>
              </div>
              <div style={{ flex: 1, position: 'relative', height: '28px' }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: '#F8F9FA',
                  borderRadius: '8px',
                  border: `1px solid ${'#E5E7EB'}`,
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
        background: '#ffffff',
        borderRadius: '16px',
        border: `1px solid ${'#E5E7EB'}`,
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div className="mb-5">
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#2563eb',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginBottom: '4px',
          }}>Monthly Trend</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1a1a2e',
            margin: 0,
            lineHeight: 1.3,
          }}>Recovery Volume Over Time</h3>
          <p style={{
            fontSize: '12px',
            color: '#9CA3AF',
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
                  color: '#22c55e',
                }}>{t.membersSaved}</div>
                <div style={{
                  width: '100%',
                  maxWidth: '48px',
                  height: `${barHeight}px`,
                  background: `linear-gradient(180deg, ${'#22c55e'}, ${'#22c55e'}90)`,
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
                    color: '#9CA3AF',
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
          borderTop: `1px solid ${'#E5E7EB'}`,
        }}>
          {trends.map((t) => (
            <div key={t.month} style={{
              textAlign: 'center',
              padding: '8px',
              background: '#F8F9FA',
              borderRadius: '8px',
              border: `1px solid ${'#E5E7EB'}`,
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF' }}>{t.month}</div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                fontWeight: 700,
                color: '#22c55e',
                marginTop: 2,
              }}>{formatCurrency(t.duesProtected)}</div>
              <div style={{ fontSize: '10px', color: '#9CA3AF' }}>protected</div>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: t.responseTime <= 4.5 ? '#22c55e' : '#f59e0b',
                marginTop: 4,
              }}>{t.responseTime}h response</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom callout */}
      <div style={{
        padding: '16px 20px',
        background: `linear-gradient(135deg, ${'#22c55e'}08, ${'#22c55e'}03)`,
        border: `1px solid ${'#22c55e'}30`,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: `${'#22c55e'}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          flexShrink: 0,
        }}>
          {'\u2705'}
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e', marginBottom: '4px' }}>
            Every intervention here started as an alert on the Health Overview tab
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.6 }}>
            Swoop detected disengagement signals 6-8 weeks before any of these members would have resigned.
            The average health score improved by {kpis.avgImprovement} points after intervention, protecting {formatCurrency(kpis.totalDuesProtected)} in annual dues.
            Response time has improved from 8.1 hours in September to 3.8 hours in February.
          </div>
        </div>
      </div>
    </div>
  );
}
