import React, { useState, useEffect } from 'react';
import { theme } from '@/config/theme';
import { Panel } from '@/components/ui';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition, { AnimatedNumber } from '@/components/ui/PageTransition';
import GrowthPipeline from '@/features/growth-pipeline/GrowthPipeline';
import FlowLink from '@/components/ui/FlowLink';
import { industryBenchmarks } from '@/data/benchmarks';
import { getKPIs, getMemberSaves, getOperationalSaves, getMonthlyTrends } from '@/services/boardReportService';

const tabNames = ['Summary', 'Member Saves', 'Operational Saves', 'What We Learned', 'Growth Pipeline'];

function formatCurrency(val) {
  return '$' + val.toLocaleString();
}

const colors = {
  green: theme.colors?.green?.[400] || '#48bb78',
  blue: theme.colors?.blue?.[400] || '#4299e1',
  orange: theme.colors?.orange?.[400] || '#ed8936',
  red: theme.colors?.red?.[400] || '#fc8181',
  yellow: theme.colors?.yellow?.[400] || '#ecc94b',
  bg: theme.colors?.gray?.[800] || '#1a1a2e',
  border: theme.colors?.gray?.[700] || '#2d2d44',
  textMuted: theme.colors?.gray?.[400] || '#a0a0b8',
  text: theme.colors?.gray?.[300] || '#cbd5e0',
  white: theme.colors?.white || '#fff',
  brand: theme.colors?.brand?.[500] || '#4299e1',
};


// 6-month trend data — sourced from boardReportService (live DB or static fallback)

function TrendSparkline({ data, dataKey, color, height = 40, width = 120 }) {
  const values = data.map(d => d[dataKey]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const trend = values[values.length - 1] > values[0] ? 'up' : values[values.length - 1] < values[0] ? 'down' : 'flat';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <svg width={width} height={height} style={{ flexShrink: 0 }}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {values.map((v, i) => {
          const x = (i / (values.length - 1)) * width;
          const y = height - ((v - min) / range) * (height - 4) - 2;
          return <circle key={i} cx={x} cy={y} r="2.5" fill={i === values.length - 1 ? color : 'transparent'} stroke={color} strokeWidth="1" />;
        })}
      </svg>
      <span style={{ fontSize: '10px', fontWeight: 700, color: trend === 'up' ? colors.green : trend === 'down' ? colors.green : colors.textMuted }}>
        {trend === 'up' ? '\u2191' : trend === 'down' ? '\u2193' : '→'}
      </span>
    </div>
  );
}

function ProgressOverTime({ monthlyTrends }) {
  const metrics = [
    { label: 'Members Saved / Month', key: 'membersSaved', color: colors.green, format: v => v },
    { label: 'Dues Protected / Month', key: 'duesProtected', color: colors.green, format: v => '$' + (v / 1000).toFixed(0) + 'K' },
    { label: 'Service Failures Caught', key: 'serviceFailures', color: colors.orange, format: v => v },
    { label: 'Avg Response Time (hrs)', key: 'responseTime', color: colors.blue, format: v => v.toFixed(1) },
  ];

  return (
    <div style={{ marginTop: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.white, marginBottom: '16px' }}>
        Progress Over 6 Months
      </h3>
      <p style={{ fontSize: '13px', color: colors.text, lineHeight: 1.6, marginBottom: '16px' }}>
        Swoop&rsquo;s impact compounds over time as the system learns your club&rsquo;s patterns. Response times have improved 53% since launch, and monthly dues protection has grown 3.5x.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {metrics.map(m => {
          const current = monthlyTrends[monthlyTrends.length - 1][m.key];
          const first = monthlyTrends[0][m.key];
          const pctChange = ((current - first) / first * 100).toFixed(0);
          const improved = m.key === 'responseTime' ? current < first : current > first;
          return (
            <div key={m.key} style={{ background: colors.bg, borderRadius: '12px', padding: '14px', border: '1px solid ' + colors.border }}>
              <div style={{ fontSize: '11px', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                {m.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: m.color }}>{m.format(current)}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: improved ? colors.green : colors.red }}>
                  {improved ? '\u2191' : '\u2193'} {Math.abs(pctChange)}% vs launch
                </span>
              </div>
              <TrendSparkline data={monthlyTrends} dataKey={m.key} color={m.color} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: colors.textMuted, marginTop: '4px' }}>
                {monthlyTrends.map(d => <span key={d.month}>{d.month}</span>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KPIStrip({ kpis }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          style={{
            background: colors.bg,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            border: '1px solid ' + colors.border,
          }}
        >
          <div style={{ fontSize: '28px', fontWeight: 700, color: colors[kpi.color] || colors.green }}>
            {/* FP-P03: Animated numbers for large metrics */}
            {kpi.prefix}
            {typeof kpi.value === 'number' && kpi.value >= 1000 ? (
              <AnimatedNumber 
                value={kpi.value} 
                duration={1200}
                decimals={kpi.value % 1 !== 0 ? 1 : 0}
              />
            ) : (
              <AnimatedNumber 
                value={kpi.value} 
                duration={1200}
                decimals={kpi.value % 1 !== 0 ? 1 : 0}
              />
            )}
            {kpi.suffix}
          </div>
          <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '4px' }}>
            {kpi.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function HealthBadge({ value }) {
  const color = value >= 60 ? colors.green : value >= 40 ? colors.yellow : colors.red;
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '13px', background: color + '22', color }}>
      {value}
    </span>
  );
}

export default function BoardReport() {
  const [activeTab, setActiveTab] = useState(0);
  const kpis = getKPIs();
  const memberSaves = getMemberSaves();
  const operationalSaves = getOperationalSaves();
  const monthlyTrends = getMonthlyTrends();
  const totalDues = memberSaves.reduce((sum, m) => sum + m.duesAtRisk, 0);
  const totalOpsRevenue = operationalSaves.reduce((sum, o) => sum + o.revenueProtected, 0);
  
  // FP-P02: Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 750);
    return () => clearTimeout(timer);
  }, []);

  // FP-P02: Show loading skeleton
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
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: colors.white }}>
            Prove It: What Was Prevented
          </h1>
          <p style={{ fontSize: '14px', color: colors.textMuted, margin: '4px 0 0 0' }}>
            Board-ready report — Last 90 days
          </p>
        </div>
        <button
          onClick={() => window.print()}
          style={{
            background: colors.brand,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 20px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          Export / Print
        </button>
      </div>

      <KPIStrip kpis={kpis} />
      <FlowLink flowNum="08" persona="Sarah" />

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {tabNames.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              background: activeTab === i ? colors.brand : colors.border,
              color: activeTab === i ? '#fff' : colors.text,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <>
        {/* ROI Calculation */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '20px',
          alignItems: 'center',
          background: colors.bg,
          border: '1px solid ' + colors.border,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '16px',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Annual Investment</div>
            <div style={{ fontSize: '13px', color: colors.text, lineHeight: 1.8 }}>
              <div>Swoop Pro subscription: <strong style={{ fontFamily: theme.fonts.mono }}>$5,988</strong></div>
              <div>Staff time (12 hrs/mo × $50/hr): <strong style={{ fontFamily: theme.fonts.mono }}>$7,200</strong></div>
              <div style={{ borderTop: '1px solid ' + colors.border, paddingTop: '6px', marginTop: '6px' }}>
                Total: <strong style={{ fontFamily: theme.fonts.mono, color: colors.orange }}>$13,188</strong>
              </div>
            </div>
          </div>
          <div style={{ fontSize: '24px', color: colors.textMuted }}>→</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Annual Return</div>
            <div style={{ fontSize: '13px', color: colors.text, lineHeight: 1.8 }}>
              <div>Dues protected: <strong style={{ fontFamily: theme.fonts.mono }}>$168,000</strong></div>
              <div>Revenue recovered: <strong style={{ fontFamily: theme.fonts.mono }}>$42,500</strong></div>
              <div style={{ borderTop: '1px solid ' + colors.border, paddingTop: '6px', marginTop: '6px' }}>
                Total: <strong style={{ fontFamily: theme.fonts.mono, color: colors.green }}>$210,500</strong>
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <span style={{ fontSize: '32px', fontWeight: 700, fontFamily: theme.fonts.mono, color: colors.green }}>16:1</span>
              <span style={{ fontSize: '13px', color: colors.textMuted, marginLeft: '8px' }}>return on investment</span>
            </div>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: colors.textMuted, textAlign: 'center', marginBottom: '20px', fontStyle: 'italic' }}>
          For every $1 invested in Swoop, your club protected $16 in member revenue.
        </div>

        <Panel>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: colors.white }}>
            Executive Summary
          </h2>
          <p style={{ color: colors.text, lineHeight: 1.7, marginBottom: '16px' }}>
            Over the last 90 days, Swoop identified <strong>14 members</strong> showing early disengagement signals
            that would have been invisible to traditional club systems. Through GM-approved interventions delivered
            via the Swoop app, all 14 were retained — protecting <strong>{formatCurrency(totalDues)}</strong> in annual dues revenue (<strong>{formatCurrency(totalDues * 5)}</strong> in lifetime value).
          </p>
          <p style={{ color: colors.text, lineHeight: 1.7, marginBottom: '16px' }}>
            Simultaneously, Swoop caught <strong>23 operational service failures</strong> before members experienced them,
            recovering an additional <strong>{formatCurrency(totalOpsRevenue)}</strong> in protected F&amp;B and event revenue.
          </p>
          <p style={{ color: colors.text, lineHeight: 1.7 }}>
            The average response time from detection to GM action was <strong>4.2 hours</strong> — compared to the
            industry average of 6+ weeks (typically after a resignation letter). This is the difference between
            retention and replacement.
          </p>
          <ProgressOverTime monthlyTrends={monthlyTrends} />
        </Panel>

        {/* Competitive Benchmarks */}
        <Panel>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: colors.white }}>
            Your Club vs. Industry
          </h2>
          <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '16px' }}>
            How your Swoop-powered metrics compare to private club industry averages.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {Object.values(industryBenchmarks).map((b) => {
              const isBetter = b.direction === 'lower-better'
                ? b.yourClub < b.industry
                : b.yourClub > b.industry;
              const formatVal = (v) => b.unit === '$' ? `$${(v / 1000).toFixed(0)}K` : b.unit === 'hrs' ? `${v}${b.unit}` : `${v}${b.unit}`;
              return (
                <div key={b.label} style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  <div style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {b.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '22px', fontWeight: 700, fontFamily: theme.fonts.mono, color: isBetter ? colors.green : colors.red }}>
                      {formatVal(b.yourClub)}
                    </span>
                    <span style={{ fontSize: '11px', color: colors.textMuted }}>your club</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: colors.textMuted, fontFamily: theme.fonts.mono }}>
                      {formatVal(b.industry)}
                    </span>
                    <span style={{ fontSize: '11px', color: colors.textMuted }}>industry avg</span>
                  </div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isBetter ? colors.green : colors.red,
                    background: (isBetter ? colors.green : colors.red) + '18',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    alignSelf: 'flex-start',
                  }}>
                    {b.comparison}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
        </>
      )}

      {activeTab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '14px', color: colors.textMuted, marginBottom: '4px' }}>
            {memberSaves.length} members saved — {formatCurrency(totalDues)} in dues protected
          </div>
          {memberSaves.map((m) => (
            <Panel key={m.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: colors.white }}>{m.name}</h3>
                <div style={{ fontSize: '13px', color: colors.textMuted }}>
                  Dues at risk: <strong style={{ color: colors.red }}>{formatCurrency(m.duesAtRisk)}</strong> <span style={{ color: colors.textMuted, fontSize: '12px' }}>({formatCurrency(m.duesAtRisk * 5)} LTV)</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: colors.textMuted }}>Health:</span>
                <HealthBadge value={m.healthBefore} />
                <span style={{ color: colors.textMuted }}>{'→'}</span>
                <HealthBadge value={m.healthAfter} />
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: colors.text }}>
                <div><strong>Trigger:</strong> {m.trigger}</div>
                <div><strong>Action:</strong> {m.action}</div>
                <div><strong>Outcome:</strong> <span style={{ color: colors.green }}>{m.outcome}</span></div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {activeTab === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '14px', color: colors.textMuted, marginBottom: '4px' }}>
            {operationalSaves.length} operational saves — {formatCurrency(totalOpsRevenue)} in revenue protected
          </div>
          {operationalSaves.map((o) => (
            <Panel key={o.event}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: colors.white }}>{o.event}</h3>
                {o.revenueProtected > 0 && (
                  <div style={{ fontSize: '13px', color: colors.green }}>
                    +{formatCurrency(o.revenueProtected)} protected
                  </div>
                )}
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: colors.text }}>
                <div><strong>Detection:</strong> {o.detection}</div>
                <div><strong>Action:</strong> {o.action}</div>
                <div><strong>Outcome:</strong> <span style={{ color: colors.green }}>{o.outcome}</span></div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {activeTab === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Panel>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: colors.white }}>
              What We Learned This Quarter
            </h2>
            <p style={{ color: colors.text, lineHeight: 1.7, marginBottom: '20px' }}>
              Cross-domain correlations discovered through Swoop&rsquo;s connected intelligence.
              These aren&rsquo;t hypotheses &mdash; they&rsquo;re patterns proven by your club&rsquo;s own data.
            </p>
          </Panel>

          {[
            {
              insight: 'Members who received a personal GM call after a complaint renewed at 95% vs. 72% for those who didn\'t',
              evidence: 'Of 14 members who received GM personal outreach, 13 renewed. Of 18 members with standard email follow-up, 13 renewed.',
              implication: 'GM personal calls are 3.4x more effective than email for at-risk retention. Worth the 15-minute investment.',
              domains: ['Service', 'Retention'],
            },
            {
              insight: 'Post-round dining dropped 34% on days with pace-of-play issues',
              evidence: '8 days with avg round time >4:30 showed 34% lower Grill Room covers in the 12-2 PM window vs. days at 4:10 or under.',
              implication: 'Pace of play isn\'t just a golf problem — it\'s an F&B revenue problem. Every slow round costs ~$47 in lost dining.',
              domains: ['Golf', 'F&B'],
            },
            {
              insight: 'Event attendees who also golf regularly are the most loyal segment (97% renewal)',
              evidence: 'Members active in both golf (3+ rounds/mo) AND events (2+ events/qtr) renewed at 97%. Members active in only one domain: 81%.',
              implication: 'Cross-domain engagement is the strongest retention signal. The goal isn\'t more golf or more events — it\'s both.',
              domains: ['Golf', 'Events', 'Retention'],
            },
            {
              insight: 'Email open rate is the earliest predictor of disengagement — 6-8 weeks before activity drops',
              evidence: 'In 9 of 11 resignations, email engagement dropped below 15% at least 6 weeks before golf or dining changed.',
              implication: 'Email is the canary in the coal mine. A weekly email decay alert would have caught 82% of at-risk members earlier.',
              domains: ['Email', 'Retention'],
            },
            {
              insight: 'Friday understaffing creates a compounding loss: $1,133 direct + $18,000 in resignation risk',
              evidence: 'Jan 16 understaffing → James Whitfield complaint → unresolved → resignation. The F&B loss was $1,280. The membership loss was $18,000.',
              implication: 'Staffing decisions have downstream consequences invisible to scheduling software. Swoop connects the staffing gap to the resignation.',
              domains: ['Staffing', 'F&B', 'Retention'],
            },
          ].map((item, i) => (
            <Panel key={i}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                {item.domains.map(d => (
                  <span key={d} style={{
                    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    padding: '2px 8px', borderRadius: '4px',
                    background: colors.brand + '22', color: colors.brand,
                  }}>{d}</span>
                ))}
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: colors.white, margin: '0 0 8px', lineHeight: 1.4 }}>
                {item.insight}
              </h3>
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: colors.text }}>
                <div style={{ marginBottom: '6px' }}><strong>Evidence:</strong> {item.evidence}</div>
                <div style={{ color: colors.green }}><strong>So what:</strong> {item.implication}</div>
              </div>
            </Panel>
          ))}

          <div style={{
            background: colors.bg,
            border: '1px solid ' + colors.border,
            borderRadius: '12px',
            padding: '16px',
            fontSize: '13px',
            color: colors.textMuted,
            lineHeight: 1.6,
            textAlign: 'center',
          }}>
            These correlations are unique to Oakmont Hills — they come from connecting your specific systems.
            No industry benchmark or consultant report can tell you that <em>your</em> Friday understaffing caused <em>your</em> member's resignation.
          </div>
        </div>
      )}

      {activeTab === 4 && (
        <GrowthPipeline />
      )}
      </div>
    </PageTransition>
  );
}
