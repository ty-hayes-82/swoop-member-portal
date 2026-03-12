import React, { useState, useEffect } from 'react';
import { theme } from '@/config/theme';
import { Panel } from '@/components/ui';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition, { AnimatedNumber } from '@/components/ui/PageTransition';

const kpis = [
  { label: 'Members Saved', value: 14, prefix: '', suffix: '', color: 'green' },
  { label: 'Dues Protected', value: 168000, prefix: '$', suffix: '', color: 'green' },
  { label: 'Lifetime Value Protected', value: 840000, prefix: '$', suffix: '', color: 'green' },
  { label: 'Revenue Recovered', value: 42500, prefix: '$', suffix: '', color: 'blue' },
  { label: 'Service Failures Caught', value: 23, prefix: '', suffix: '', color: 'orange' },
  { label: 'Avg Response Time', value: 4.2, prefix: '', suffix: ' hrs', color: 'blue' },
  { label: 'Board Confidence Score', value: 94, prefix: '', suffix: '%', color: 'green' },
];

const memberSaves = [
  {
    name: 'James Whitfield',
    healthBefore: 34,
    healthAfter: 71,
    trigger: 'Pace-of-play complaint + GPS showed skipped Grill Room visits',
    action: 'GM personal call + complimentary round + service recovery via Swoop app',
    outcome: 'Retained — renewed annual membership',
    duesAtRisk: 18500,
  },
  {
    name: 'Catherine Morales',
    healthBefore: 41,
    healthAfter: 68,
    trigger: 'Dining frequency dropped 60% over 3 weeks',
    action: 'F&B director invited to chef tasting event',
    outcome: 'Retained — dining spend up 40% following month',
    duesAtRisk: 14200,
  },
  {
    name: 'Robert & Linda Chen',
    healthBefore: 28,
    healthAfter: 62,
    trigger: 'Both members flagged — simultaneous disengagement across golf, dining, fitness',
    action: 'Membership Director family meeting + upgraded social membership benefits',
    outcome: 'Retained — both renewed, added junior membership for son',
    duesAtRisk: 31000,
  },
  {
    name: 'David Harrington',
    healthBefore: 38,
    healthAfter: 74,
    trigger: 'GPS showed consistent 9-hole exits, tee time cancellations rising',
    action: 'Pro shop staff greeted by name, invited to member-guest tournament',
    outcome: 'Retained — returned to 18-hole rounds, joined men\'s league',
    duesAtRisk: 16800,
  },
  {
    name: 'Patricia Nguyen',
    healthBefore: 45,
    healthAfter: 77,
    trigger: 'Spa and dining visits ceased after billing dispute',
    action: 'Billing correction + personal apology from GM + spa credit',
    outcome: 'Retained — became Net Promoter, referred 2 new members',
    duesAtRisk: 12500,
  },
  {
    name: 'Michael Torres',
    healthBefore: 31,
    healthAfter: 65,
    trigger: 'Event attendance dropped to zero, no F&B activity for 6 weeks',
    action: 'Engagement Autopilot triggered personalized event invitations',
    outcome: 'Retained — attended 3 events in following month',
    duesAtRisk: 15000,
  },
];

const operationalSaves = [
  {
    event: 'Wind Advisory — Feb 8',
    detection: 'Weather + tee sheet correlation flagged 40% cancellation risk',
    action: 'Proactive text to afternoon bookers offering reschedule; extra Grill Room staff deployed',
    outcome: 'Zero complaints, F&B revenue up 22% vs typical weather day',
    revenueProtected: 8400,
  },
  {
    event: 'Starter No-Show — Jan 22',
    detection: 'Staffing gap detected at 6:45 AM, 32 tee times at risk',
    action: 'Service Recovery agent alerted assistant pro, covered first 3 groups',
    outcome: 'No member-facing impact, pace-of-play maintained',
    revenueProtected: 0,
  },
  {
    event: 'Valentine Dinner Overbook — Feb 14',
    detection: 'Reservation system showed 120% capacity, F&B margin risk flagged',
    action: 'Demand Optimizer suggested overflow seating in terrace, adjusted staffing',
    outcome: 'All members seated within 10 min, food cost held at 31%',
    revenueProtected: 12600,
  },
];

const tabNames = ['Summary', 'Member Saves', 'Operational Saves', 'What We Learned'];

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

function KPIStrip() {
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

      <KPIStrip />

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
        </Panel>
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
                <span style={{ color: colors.textMuted }}>{'\u2192'}</span>
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
              insight: 'Members who received a personal GM call after a complaint renewed at 95% vs. 72% for those who didn\u2019t',
              evidence: 'Of 14 members who received GM personal outreach, 13 renewed. Of 18 members with standard email follow-up, 13 renewed.',
              implication: 'GM personal calls are 3.4x more effective than email for at-risk retention. Worth the 15-minute investment.',
              domains: ['Service', 'Retention'],
            },
            {
              insight: 'Post-round dining dropped 34% on days with pace-of-play issues',
              evidence: '8 days with avg round time >4:30 showed 34% lower Grill Room covers in the 12-2 PM window vs. days at 4:10 or under.',
              implication: 'Pace of play isn\u2019t just a golf problem \u2014 it\u2019s an F&B revenue problem. Every slow round costs ~$47 in lost dining.',
              domains: ['Golf', 'F&B'],
            },
            {
              insight: 'Event attendees who also golf regularly are the most loyal segment (97% renewal)',
              evidence: 'Members active in both golf (3+ rounds/mo) AND events (2+ events/qtr) renewed at 97%. Members active in only one domain: 81%.',
              implication: 'Cross-domain engagement is the strongest retention signal. The goal isn\u2019t more golf or more events \u2014 it\u2019s both.',
              domains: ['Golf', 'Events', 'Retention'],
            },
            {
              insight: 'Email open rate is the earliest predictor of disengagement \u2014 6-8 weeks before activity drops',
              evidence: 'In 9 of 11 resignations, email engagement dropped below 15% at least 6 weeks before golf or dining changed.',
              implication: 'Email is the canary in the coal mine. A weekly email decay alert would have caught 82% of at-risk members earlier.',
              domains: ['Email', 'Retention'],
            },
            {
              insight: 'Friday understaffing creates a compounding loss: $1,133 direct + $18,000 in resignation risk',
              evidence: 'Jan 16 understaffing \u2192 James Whitfield complaint \u2192 unresolved \u2192 resignation. The F&B loss was $1,280. The membership loss was $18,000.',
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
            These correlations are unique to Oakmont Hills &mdash; they come from connecting your specific systems.
            No industry benchmark or consultant report can tell you that <em>your</em> Friday understaffing caused <em>your</em> member&rsquo;s resignation.
          </div>
        </div>
      )}
      </div>
    </PageTransition>
  );
}
