import { useState, useEffect } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import PaceImpactTab from './tabs/PaceImpactTab';
import StaffingImpactTab from './tabs/StaffingImpactTab';
import WeatherImpactTab from './tabs/WeatherImpactTab';
import { theme } from '@/config/theme';
import { paceFBImpact } from '@/data/pace';
import { understaffedDays } from '@/data/staffing';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import ScenarioModeling from './components/ScenarioModeling';

const TABS = [
  { key: 'pace', label: 'Pace-of-Play Impact' },
  { key: 'staffing', label: 'Staffing Gaps' },
  { key: 'weather', label: 'Weather Shifts' },
];

const PACE_LOSS = paceFBImpact.revenueLostPerMonth;
const STAFFING_LOSS = understaffedDays.reduce((sum, day) => sum + day.revenueLoss, 0);
const WEATHER_LOSS = 420;
const TOTAL_LOSS = PACE_LOSS + STAFFING_LOSS + WEATHER_LOSS;

const mono = "'JetBrains Mono', monospace";

function RecoveryCTA({ recoverableAmount, totalLoss, onViewStaffingTab }) {
  const remaining = totalLoss - recoverableAmount;
  const recoverPct = Math.round((recoverableAmount / (recoverableAmount + remaining)) * 100);
  const remainPct = 100 - recoverPct;

  return (
    <div style={{ borderRadius: '16px', padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
        <div style={{ fontSize: '48px', lineHeight: 1, flexShrink: 0 }}>{'\uD83D\uDCA1'}</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#0f0f0f', marginBottom: '16px', lineHeight: 1.3 }}>
            Recover ${recoverableAmount.toLocaleString()}/month with ranger deployment
          </h3>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            {/* Stacked bar */}
            <div style={{ display: 'flex', height: '48px', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px', border: '1px solid #e4e4e7' }}>
              <div style={{ width: `${recoverPct}%`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f0f0f', fontWeight: 700, fontSize: '14px', fontFamily: mono }}>
                ${recoverableAmount.toLocaleString()}
              </div>
              <div style={{ width: `${remainPct}%`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3f3f46', fontWeight: 600, fontSize: '14px', fontFamily: mono }}>
                ${remaining.toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '3px' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f0f0f' }}>Recoverable via Pace Management</span>
                </div>
                <div style={{ fontSize: '12px', color: '#3f3f46', paddingLeft: '20px' }}>Deploy rangers on bottleneck holes</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '3px', opacity: 0.4 }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f0f0f' }}>Remaining Gap</span>
                </div>
                <div style={{ fontSize: '12px', color: '#3f3f46', paddingLeft: '20px' }}>Addressable via Staffing optimization (see tab 2)</div>
              </div>
            </div>
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#3f3f46', marginBottom: '24px' }}>
            <strong style={{ color: '#0f0f0f' }}>Target holes 4, 8, 12, and 16</strong> during peak times (Sat/Sun 8am-11am). Rangers can reduce average delays by 15 minutes, recovering approximately <strong>35%</strong> of pace-related F&B losses. The remaining ${remaining.toLocaleString()} is addressable through staffing and scheduling optimization.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button style={{ color: '#0f0f0f', fontWeight: 700, fontSize: '15px', padding: '16px 32px', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: '0.2s', background: theme.colors.accent + '18' }}>
              {'\uD83D\uDCCB'} See Recommended Ranger Plan
            </button>
            <button onClick={onViewStaffingTab} style={{ background: 'white', color: '#0f0f0f', fontWeight: 600, fontSize: '15px', padding: '16px 32px', borderRadius: '8px', border: '2px solid #e4e4e7', cursor: 'pointer', transition: '0.2s' }}>
              {'\uD83D\uDC41\uFE0F'} View Staffing Tab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BreakdownChart({ totalLoss, paceAmount, staffingAmount, weatherAmount }) {
  const pacePct = ((paceAmount / totalLoss) * 100).toFixed(0);
  const staffPct = ((staffingAmount / totalLoss) * 100).toFixed(0);
  const weatherPct = ((weatherAmount / totalLoss) * 100).toFixed(0);

  const segments = [
    { icon: '\u26A1', amount: paceAmount, pct: pacePct, label: 'Pace-of-Play Impact',
      gradient: 'linear-gradient(135deg, rgb(245, 158, 11), rgb(249, 115, 22))',
      cardBg: 'rgba(249, 115, 22, 0.06)', cardBorder: 'rgba(249, 115, 22, 0.15)',
      iconBg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(245, 158, 11, 0.08))',
      iconBorder: 'rgba(249, 115, 22, 0.15)', dotColor: 'rgb(249, 115, 22)',
      textColor: 'rgb(249, 115, 22)', width: (paceAmount / totalLoss * 100), first: true },
    { icon: '\uD83D\uDC65', amount: staffingAmount, pct: staffPct, label: 'Staffing Gaps',
      gradient: 'linear-gradient(135deg, rgb(217, 119, 6), rgb(180, 83, 9))',
      cardBg: 'rgba(217, 119, 6, 0.06)', cardBorder: 'rgba(217, 119, 6, 0.15)',
      iconBg: 'linear-gradient(135deg, rgba(217, 119, 6, 0.12), rgba(180, 83, 9, 0.08))',
      iconBorder: 'rgba(217, 119, 6, 0.15)', dotColor: 'rgb(217, 119, 6)',
      textColor: 'rgb(217, 119, 6)', width: (staffingAmount / totalLoss * 100) },
    { icon: '\uD83C\uDF26\uFE0F', amount: weatherAmount, pct: weatherPct, label: 'Weather Shifts',
      gradient: 'linear-gradient(135deg, rgb(59, 130, 246), rgb(37, 99, 235))',
      cardBg: 'rgba(59, 130, 246, 0.06)', cardBorder: 'rgba(59, 130, 246, 0.15)',
      iconBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(37, 99, 235, 0.08))',
      iconBorder: 'rgba(59, 130, 246, 0.15)', dotColor: 'rgb(59, 130, 246)',
      textColor: 'rgb(59, 130, 246)', width: Math.max(weatherAmount / totalLoss * 100, 5), minWidth: '65px' },
  ];

  return (
    <div style={{
      border: '1px solid rgba(228, 228, 231, 0.6)',
      borderRadius: '16px',
      padding: '36px 32px 32px',
      background: 'linear-gradient(rgba(249, 115, 22, 0.016) 0%, white 30%)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.03)',
      transition: 'box-shadow 0.2s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: 'linear-gradient(90deg, rgb(249, 115, 22) 60%, rgb(217, 119, 6) 85%, rgb(59, 130, 246) 100%)',
        borderRadius: '16px 16px 0 0',
      }} />

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid rgba(228, 228, 231, 0.5)',
      }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f0f0f', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Revenue Leakage Breakdown
          </h3>
          <p style={{ fontSize: '13px', color: '#71717a', margin: 0, fontStyle: 'normal' }}>
            How ${totalLoss.toLocaleString()}/month breaks down across operational categories
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#a1a1aa', letterSpacing: '0.08em', marginBottom: '4px', textAlign: 'right', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            TOTAL MONTHLY LEAKAGE
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#0f0f0f', letterSpacing: '-0.03em', lineHeight: 1, position: 'relative' }}>
            ${totalLoss.toLocaleString()}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: 'rgba(239, 68, 68, 0.08)', color: '#dc2626',
            padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
            marginTop: '6px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}>
            {'\u2191'} 8% vs last month
          </div>
        </div>
      </div>

      {/* Distribution label */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '8px', fontSize: '11px', fontWeight: 600, color: '#a1a1aa',
        letterSpacing: '0.04em', textTransform: 'uppercase',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}>
        DISTRIBUTION
      </div>

      {/* Stacked bar */}
      <div style={{
        height: '48px', borderRadius: '12px', overflow: 'hidden', display: 'flex',
        marginBottom: '28px', border: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'relative',
      }}>
        {segments.map((seg, i) => (
          <div key={seg.label} style={{
            width: seg.width + '%', minWidth: seg.minWidth,
            background: seg.gradient,
            display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            position: 'relative', transition: '0.3s', cursor: 'pointer', gap: '6px',
            borderLeft: i > 0 ? '2px solid rgba(255,255,255,0.3)' : 'none',
            borderRadius: seg.first ? '12px 0 0 12px' : (i === segments.length - 1 ? '0 12px 12px 0' : '0'),
            padding: seg.first ? '0 12px' : '0 8px',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'white', fontFamily: "'JetBrains Mono', monospace", textShadow: '0 1px 2px rgba(0,0,0,0.12)', lineHeight: 1, letterSpacing: '-0.01em' }}>
              ${seg.amount.toLocaleString()}
            </span>
            <span style={{ fontSize: i === segments.length - 1 ? '10px' : '11px', fontWeight: 500, color: 'rgba(255,255,255,0.65)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", lineHeight: 1 }}>
              {seg.pct}%
            </span>
          </div>
        ))}
      </div>

      {/* Category cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {segments.map((seg) => (
          <div key={seg.label} style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
            background: seg.cardBg, borderRadius: '12px',
            border: '1px solid ' + seg.cardBorder, transition: '0.2s', cursor: 'pointer',
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px',
              background: seg.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', flexShrink: 0, border: '1px solid ' + seg.iconBorder,
            }}>{seg.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '13px', fontWeight: 600, color: '#3f3f46', marginBottom: '4px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                letterSpacing: '-0.01em', display: 'flex', alignItems: 'center',
              }}>
                <span style={{
                  display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                  background: seg.dotColor, marginRight: '6px', verticalAlign: 'middle', flexShrink: 0,
                }} />
                {seg.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '17px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: seg.textColor, letterSpacing: '-0.02em' }}>
                  ${seg.amount.toLocaleString()}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa' }}>({seg.pct}%)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionPath({ label, amount, color, action }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px', alignItems: 'start',
      padding: '8px', borderRadius: '6px', border: '1px solid #e4e4e7', background: '#f8f9fa',
    }}>
      <div style={{ width: 10, height: 10, borderRadius: 999, background: color, marginTop: 6 }} />
      <div style={{ display: 'grid', gap: '2px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', color: '#0f0f0f', fontWeight: 600 }}>{label}</span>
          <span style={{ fontSize: '14px', color, fontFamily: mono, fontWeight: 700 }}>${amount.toLocaleString()}/month</span>
        </div>
        <p style={{ fontSize: '12px', color: '#3f3f46', margin: 0 }}>{action}</p>
      </div>
    </div>
  );
}

export default function RevenueLeakage() {
  const [activeTab, setActiveTab] = useState('pace');
  const recoverableAmount = Math.round(PACE_LOSS * 0.35);

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SkeletonGrid cards={8} columns={4} cardHeight={200} />;
  }

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <StoryHeadline
          variant="risk"
          headline={`Operational failures are costing you $${TOTAL_LOSS.toLocaleString()} in monthly F&B revenue.`}
          context="Revenue leakage happens when service breakdowns (slow rounds, understaffing, weather impacts) interrupt member dining patterns. Most clubs see the symptom (lower covers) but miss the operational cause."
        />

        <RecoveryCTA
          recoverableAmount={recoverableAmount}
          totalLoss={PACE_LOSS}
          onViewStaffingTab={() => setActiveTab('staffing')}
        />

        <BreakdownChart
          totalLoss={TOTAL_LOSS}
          paceAmount={PACE_LOSS}
          staffingAmount={STAFFING_LOSS}
          weatherAmount={WEATHER_LOSS}
        />

        <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: '10px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f0f0f', marginBottom: '4px' }}>
            Action Paths to Recover ${TOTAL_LOSS.toLocaleString()}/month
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            Prioritize pace first, protect staffing consistency second, and convert weather days with targeted indoor offers.
          </p>
          <div style={{ display: 'grid', gap: '8px' }}>
            <ActionPath label="Pace of Play" amount={PACE_LOSS} color="rgb(243,146,45)" action="Deploy ranger coverage on holes 4, 8, 12, 16 (Sat/Sun 8-11am)." />
            <ActionPath label="Staffing" amount={STAFFING_LOSS} color="rgb(217,119,6)" action="Hold 4-server Grill Room lunch minimum on high-demand days." />
            <ActionPath label="Weather" amount={WEATHER_LOSS} color="rgb(29,78,216)" action="Trigger rain-day indoor dining offers and pre-shift staffing." />
          </div>
        </div>

        <ScenarioModeling
          paceLoss={PACE_LOSS}
          staffingLoss={STAFFING_LOSS}
          weatherLoss={WEATHER_LOSS}
        />

        <Panel
          title="Deep Dive by Category"
          subtitle="Which operational failures are costing you F&B spend?"
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          accentColor={theme.colors.fb}
        >
          {activeTab === 'pace' && <PaceImpactTab />}
          {activeTab === 'staffing' && <StaffingImpactTab />}
          {activeTab === 'weather' && <WeatherImpactTab />}
        </Panel>
      </div>
    </PageTransition>
  );
}
