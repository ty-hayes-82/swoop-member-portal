import React, { useState, useEffect } from 'react';
import { theme } from '@/config/theme';
import { Panel } from '@/components/ui';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition, { AnimatedNumber } from '@/components/ui/PageTransition';
import { useNavigationContext } from '@/context/NavigationContext';
import { getKPIs, getMemberSaves, getOperationalSaves } from '@/services/boardReportService';
import { getHealthDistribution } from '@/services/memberService';
import { feedbackRecords, feedbackSummary, understaffedDays } from '@/data/staffing';
import { isRealClub } from '@/config/constants';

const tabNames = ['Summary', 'Details'];

const colors = {
  green: '#48bb78',
  blue: '#63b3ed',
  orange: '#ed8936',
  red: '#fc8181',
  yellow: '#ecc94b',
  bg: '#1a1a2e',
  border: '#2d2d44',
  textMuted: '#BCC3CF',
  text: '#D8DCE3',
  white: '#F0F0F5',
  pageHeading: '#1a1a2e',
  pageSubtext: '#6B7280',
  panelHeading: '#1a1a2e',
  panelText: '#3F3F46',
  panelMuted: '#6B7280',
  brand: theme.colors?.accent || '#F3922D',
  tabInactive: '#8890A0',
};

function formatCurrency(val) {
  return '$' + val.toLocaleString();
}

function HealthBadge({ value }) {
  const color = value >= 60 ? colors.green : value >= 40 ? colors.yellow : colors.red;
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '13px', background: color + '22', color }}>
      {value}
    </span>
  );
}

function KPIStrip({ kpis, onDrillDown }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          onClick={() => onDrillDown?.()}
          style={{
            background: colors.bg,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            border: '1px solid ' + colors.border,
            cursor: 'pointer',
            transition: 'box-shadow 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
        >
          <div style={{ fontSize: '28px', fontWeight: 700, color: colors[kpi.color] || colors.green }}>
            {kpi.prefix}
            <AnimatedNumber value={kpi.value} duration={1200} decimals={kpi.value % 1 !== 0 ? 1 : 0} />
            {kpi.suffix}
          </div>
          <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '4px' }}
            title={kpi.label === 'Board Confidence Score' ? 'Composite score based on retention rate, financial performance vs. budget, member satisfaction trends, and operational response metrics.' : undefined}>
            {kpi.label}
            {kpi.label === 'Board Confidence Score' && <span style={{ marginLeft: '4px', cursor: 'help', opacity: 0.6 }} title="Composite score based on retention rate, financial performance vs. budget, member satisfaction trends, and operational response metrics.">&#9432;</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BoardReport() {
  const { routeIntent, clearRouteIntent } = useNavigationContext();
  const [activeTab, setActiveTab] = useState(0);
  const kpis = getKPIs();
  const memberSaves = getMemberSaves();
  const operationalSaves = getOperationalSaves();
  const dist = getHealthDistribution();
  const totalDues = memberSaves.reduce((sum, m) => sum + m.duesAtRisk, 0);
  const totalOpsRevenue = operationalSaves.reduce((sum, o) => sum + o.revenueProtected, 0);

  // Complaint resolution stats
  const resolved = feedbackRecords.filter(f => f.status === 'resolved');
  const unresolved = feedbackRecords.filter(f => f.status !== 'resolved');
  const resolutionRate = feedbackRecords.length > 0
    ? Math.round((resolved.length / feedbackRecords.length) * 100) : 0;
  const avgResolutionDays = resolved.length > 0
    ? (resolved.reduce((sum, f) => {
        const days = Math.round((new Date(f.resolved_date) - new Date(f.date)) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / resolved.length).toFixed(1)
    : '—';

  useEffect(() => {
    if (!routeIntent) return;
    if (typeof routeIntent.tab === 'number' && routeIntent.tab >= 0 && routeIntent.tab < tabNames.length) {
      setActiveTab(routeIntent.tab);
    }
    clearRouteIntent();
  }, [routeIntent, clearRouteIntent]);

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 750);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
        <SkeletonGrid cards={6} columns={3} cardHeight={120} />
      </div>
    );
  }

  return (
    <PageTransition>
      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: colors.pageHeading }}>
            Board Report — Service, Members & Operations
          </h1>
          <p style={{ fontSize: '14px', color: colors.pageSubtext, margin: '4px 0 0 0' }}>
            Monthly executive summary — service quality, member health, and operational response
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { setActiveTab(0); setTimeout(() => window.print(), 100); }}
            style={{
              background: colors.brand, color: '#fff', border: 'none',
              borderRadius: '8px', padding: '8px 20px', cursor: 'pointer',
              fontWeight: 600, fontSize: '14px',
            }}
          >Export as PDF</button>
          <button
            onClick={() => window.print()}
            style={{
              background: 'transparent', color: colors.brand,
              border: `1px solid ${colors.brand}`, borderRadius: '8px',
              padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
            }}
          >Print</button>
        </div>
      </div>

      {/* Demo data indicator */}
      {!isRealClub() && (
        <div style={{
          padding: '8px 14px', marginBottom: '16px',
          borderRadius: theme.radius.sm,
          background: `${theme.colors.warning500}10`,
          border: `1px solid ${theme.colors.warning500}30`,
          fontSize: '12px', color: theme.colors.warning700,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontWeight: 700 }}>Demo data</span>
          <span>— Real metrics will appear after 30 days of live data. All figures shown are simulated.</span>
        </div>
      )}

      <KPIStrip kpis={kpis} onDrillDown={() => setActiveTab(1)} />

      {/* Board Confidence Score Methodology */}
      <details style={{ marginBottom: '16px', background: theme.colors.bgCard, border: '1px solid ' + theme.colors.border, borderRadius: theme.radius.sm, padding: '12px 16px' }}>
        <summary style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.textMuted, cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px' }}>&#9432;</span> How is the Board Confidence Score calculated?
        </summary>
        <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {[
            { label: 'Service Quality', weight: '30%', value: '87%', benchmark: 'Complaint resolution + consistency', color: '#22c55e' },
            { label: 'Member Health', weight: '25%', value: '14 retained', benchmark: 'Health scores + interventions', color: '#3b82f6' },
            { label: 'Operational Response', weight: '25%', value: '4.2 hrs avg', benchmark: 'Detection to action time', color: '#f59e0b' },
            { label: 'Financial Performance', weight: '20%', value: 'On budget', benchmark: 'Dues + F&B vs plan', color: '#8b5cf6' },
          ].map(m => (
            <div key={m.label} style={{ padding: '10px', borderRadius: '8px', background: theme.colors.bgDeep, border: '1px solid ' + theme.colors.border }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: m.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label} ({m.weight})</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: theme.colors.textPrimary, marginTop: '4px' }}>{m.value}</div>
              <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>{m.benchmark}</div>
            </div>
          ))}
        </div>
      </details>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {tabNames.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              padding: '8px 18px', borderRadius: '8px',
              border: activeTab === i ? 'none' : '1px solid ' + colors.tabInactive + '40',
              cursor: 'pointer', fontWeight: 600, fontSize: '14px',
              background: activeTab === i ? colors.brand : 'transparent',
              color: activeTab === i ? '#fff' : colors.tabInactive,
              transition: 'all 0.15s',
            }}
          >{tab}</button>
        ))}
      </div>

      {/* Summary Tab */}
      {activeTab === 0 && (
        <>
          {/* Executive Summary — covers service, operations, and member health */}
          <Panel>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: colors.panelHeading }}>
              Executive Summary
            </h2>
            <p style={{ color: colors.panelText, lineHeight: 1.7, marginBottom: '16px' }}>
              This month, Oakmont Hills delivered consistent service quality with an <strong>{resolutionRate}% complaint resolution rate</strong> and
              an average resolution time of <strong>{avgResolutionDays} days</strong>. The operations team responded to alerts with an
              average <strong>4.2-hour detection-to-action time</strong>, catching {operationalSaves.length} service disruptions before
              they impacted members.
            </p>
            <p style={{ color: colors.panelText, lineHeight: 1.7, marginBottom: '16px' }}>
              Member health remained strong with <strong>{dist.find(d => d.level === 'Healthy')?.count || 200} members in healthy status</strong>.
              Through proactive interventions, <strong>{memberSaves.length} members</strong> showing early disengagement signals were
              successfully re-engaged — demonstrating the value of early detection and personal outreach.
            </p>
            <p style={{ color: colors.panelText, lineHeight: 1.7 }}>
              Staffing alignment and proactive scheduling adjustments prevented service gaps on high-demand days. The
              operational response improvements continue to compound, with response times improving 48% since launch.
            </p>
          </Panel>

          {/* Service Quality This Month */}
          <Panel>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: colors.panelHeading }}>
              Service Quality This Month
            </h2>
            <p style={{ fontSize: '12px', color: colors.panelMuted, marginBottom: '16px' }}>
              Complaint resolution, staffing coverage, and service consistency metrics.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: colors.bg, borderRadius: '12px', padding: '14px', border: '1px solid ' + colors.border, textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: colors.green }}>{resolutionRate}%</div>
                <div style={{ fontSize: '11px', color: colors.textMuted }}>Complaint Resolution Rate</div>
              </div>
              <div style={{ background: colors.bg, borderRadius: '12px', padding: '14px', border: '1px solid ' + colors.border, textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: colors.green }}>{avgResolutionDays}</div>
                <div style={{ fontSize: '11px', color: colors.textMuted }}>Avg Resolution (days)</div>
              </div>
              <div style={{ background: colors.bg, borderRadius: '12px', padding: '14px', border: '1px solid ' + colors.border, textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: unresolved.length > 3 ? colors.orange : colors.green }}>{unresolved.length}</div>
                <div style={{ fontSize: '11px', color: colors.textMuted }}>Open Complaints</div>
              </div>
            </div>
            {/* Complaint categories */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {feedbackSummary.slice(0, 4).map(cat => (
                <div key={cat.category} style={{
                  padding: '6px 12px', borderRadius: '8px', fontSize: '12px',
                  background: theme.colors.bgDeep, border: '1px solid ' + theme.colors.border,
                }}>
                  <span style={{ fontWeight: 600, color: theme.colors.textPrimary }}>{cat.category}</span>
                  <span style={{ color: theme.colors.textMuted }}> — {cat.count} total, {cat.unresolvedCount} open</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Member Health Overview */}
          <Panel>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: colors.panelHeading }}>
              Member Health Overview
            </h2>
            <p style={{ fontSize: '12px', color: colors.panelMuted, marginBottom: '16px' }}>
              Health distribution and intervention outcomes this month.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
              {dist.map(d => {
                const delta = Number.isFinite(d?.delta) ? d.delta : 0;
                const deltaColor = delta > 0 ? colors.red : delta < 0 ? colors.green : colors.textMuted;
                return (
                  <div key={d.level} style={{
                    background: colors.bg, borderRadius: '12px', padding: '14px',
                    border: '1px solid ' + colors.border, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: d.color }}>{d.count}</div>
                    <div style={{ fontSize: '11px', color: colors.textMuted }}>{d.level}</div>
                    {delta !== 0 && (
                      <div style={{ fontSize: '10px', fontWeight: 600, color: deltaColor, marginTop: '4px' }}>
                        {delta > 0 ? '+' : ''}{delta} vs last month
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: '13px', color: colors.panelText, lineHeight: 1.6 }}>
              <strong>{memberSaves.length} members</strong> were successfully re-engaged through proactive interventions this month.
              Top interventions included GM personal calls, F&B director outreach, and membership director meetings.
            </div>
          </Panel>

          {/* Operational Response */}
          <Panel>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: colors.panelHeading }}>
              Operational Response
            </h2>
            <p style={{ fontSize: '12px', color: colors.panelMuted, marginBottom: '16px' }}>
              Detection-to-action performance and proactive operations.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: colors.bg, borderRadius: '12px', padding: '14px', border: '1px solid ' + colors.border, textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: colors.green }}>4.2 hrs</div>
                <div style={{ fontSize: '11px', color: colors.textMuted }}>Avg Detection to Action</div>
              </div>
              <div style={{ background: colors.bg, borderRadius: '12px', padding: '14px', border: '1px solid ' + colors.border, textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: colors.green }}>{memberSaves.length}</div>
                <div style={{ fontSize: '11px', color: colors.textMuted }}>Interventions Completed</div>
              </div>
              <div style={{ background: colors.bg, borderRadius: '12px', padding: '14px', border: '1px solid ' + colors.border, textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: colors.green }}>{operationalSaves.length}</div>
                <div style={{ fontSize: '11px', color: colors.textMuted }}>Disruptions Prevented</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {operationalSaves.map(o => (
                <div key={o.event} style={{
                  padding: '10px 14px', borderRadius: '8px',
                  background: theme.colors.bgDeep, border: '1px solid ' + theme.colors.border,
                  fontSize: '13px',
                }}>
                  <span style={{ fontWeight: 600, color: theme.colors.textPrimary }}>{o.event}</span>
                  <span style={{ color: theme.colors.textMuted }}> — {o.outcome}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Staffing Efficiency */}
          <Panel>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: colors.panelHeading }}>
              Staffing Efficiency
            </h2>
            <p style={{ fontSize: '12px', color: colors.panelMuted, marginBottom: '16px' }}>
              Staffing alignment and proactive scheduling performance.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ background: colors.bg, borderRadius: '12px', padding: '14px', border: '1px solid ' + colors.border, textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: colors.green }}>{Math.max(0, 30 - understaffedDays.length)}</div>
                <div style={{ fontSize: '11px', color: colors.textMuted }}>Days Fully Staffed</div>
              </div>
              <div style={{ background: colors.bg, borderRadius: '12px', padding: '14px', border: '1px solid ' + colors.border, textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: understaffedDays.length > 3 ? colors.orange : colors.green }}>{understaffedDays.length}</div>
                <div style={{ fontSize: '11px', color: colors.textMuted }}>Understaffed Days</div>
              </div>
              <div style={{ background: colors.bg, borderRadius: '12px', padding: '14px', border: '1px solid ' + colors.border, textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: colors.green }}>{Math.round(((30 - understaffedDays.length) / 30) * 100)}%</div>
                <div style={{ fontSize: '11px', color: colors.textMuted }}>Staffing Alignment Rate</div>
              </div>
            </div>
          </Panel>

          {/* F&B Performance — Placeholder */}
          <Panel>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: colors.panelHeading }}>
              F&B Performance
            </h2>
            <div style={{
              padding: '8px 12px', marginBottom: '16px', borderRadius: '6px',
              background: `${colors.yellow}12`, border: `1px solid ${colors.yellow}30`,
              fontSize: '12px', color: colors.yellow, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontWeight: 700 }}>Coming soon</span>
              <span style={{ color: colors.textMuted }}>— Requires POS integration. Connect your POS system in Admin to unlock F&B metrics.</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', opacity: 0.4 }}>
              {[
                { label: 'Revenue per Cover', value: '—' },
                { label: 'Covers vs Capacity', value: '—' },
                { label: 'Post-Round Dining Rate', value: '—' },
              ].map(m => (
                <div key={m.label} style={{ background: colors.bg, borderRadius: '12px', padding: '14px', border: '1px solid ' + colors.border, textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: colors.textMuted }}>{m.value}</div>
                  <div style={{ fontSize: '11px', color: colors.textMuted }}>{m.label}</div>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}

      {/* Details Tab */}
      {activeTab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: colors.pageHeading, margin: '8px 0 0' }}>Member Interventions</h2>
          <div style={{ fontSize: '14px', color: colors.textMuted, marginBottom: '4px' }}>
            {memberSaves.length} members retained through proactive intervention
          </div>
          {memberSaves.map((m) => (
            <Panel key={m.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: colors.panelHeading }}>{m.name}</h3>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: colors.panelMuted }}>Health:</span>
                <HealthBadge value={m.healthBefore} />
                <span style={{ color: colors.panelMuted }}>{'→'}</span>
                <HealthBadge value={m.healthAfter} />
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: colors.panelText }}>
                <div><strong>Trigger:</strong> {m.trigger}</div>
                <div><strong>Action:</strong> {m.action}</div>
                <div><strong>Outcome:</strong> <span style={{ color: colors.green }}>{m.outcome}</span></div>
              </div>
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid ' + theme.colors.border }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: colors.panelMuted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Evidence Chain</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Signal detected', color: '#ef4444' },
                    { label: 'GM alerted', color: '#f59e0b' },
                    { label: 'Action taken', color: '#3b82f6' },
                    { label: 'Member retained', color: '#22c55e' },
                  ].map((step, i) => (
                    <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: step.color }} />
                        <span style={{ fontSize: '11px', color: colors.panelText, whiteSpace: 'nowrap' }}>{step.label}</span>
                      </div>
                      {i < 3 && <span style={{ margin: '0 6px', color: colors.panelMuted, fontSize: '10px' }}>{'-->'}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          ))}

          <h2 style={{ fontSize: '18px', fontWeight: 700, color: colors.pageHeading, margin: '24px 0 0' }}>Operational Saves</h2>
          <div style={{ fontSize: '14px', color: colors.textMuted, marginBottom: '4px' }}>
            {operationalSaves.length} operational disruptions prevented
          </div>
          {operationalSaves.map((o) => (
            <Panel key={o.event}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: colors.panelHeading }}>{o.event}</h3>
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: colors.panelText }}>
                <div><strong>Detection:</strong> {o.detection}</div>
                <div><strong>Action:</strong> {o.action}</div>
                <div><strong>Outcome:</strong> <span style={{ color: colors.green }}>{o.outcome}</span></div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      </div>
    </PageTransition>
  );
}
