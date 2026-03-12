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

const tabNames = ['Summary', 'Member Saves', 'Operational Saves'];

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
      </div>
    </PageTransition>
  );
}
