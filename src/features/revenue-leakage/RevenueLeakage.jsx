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
    { icon: '\u26A1', amount: paceAmount, pct: pacePct, color: 'rgb(243,146,45)', label: 'Pace-of-Play Impact', width: (paceAmount / totalLoss * 100) + '%', first: true },
    { icon: '\uD83D\uDC65', amount: staffingAmount, pct: staffPct, color: 'rgb(217,119,6)', label: 'Staffing Gaps', width: (staffingAmount / totalLoss * 100) + '%' },
    { icon: '\uD83C\uDF26\uFE0F', amount: weatherAmount, pct: weatherPct, color: 'rgb(29,78,216)', label: 'Weather Shifts', width: Math.max(weatherAmount / totalLoss * 100, 7.5) + '%', minWidth: '72px' },
  ];

  return (
    <div style={{ border: '1px solid #e4e4e7', borderRadius: '12px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f0f0f', marginBottom: '4px' }}>Revenue Leakage Breakdown</h3>
          <p style={{ fontSize: '13px', color: '#3f3f46', margin: 0 }}>How ${totalLoss.toLocaleString()}/month breaks down across operational categories</p>
        </div>
        <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: mono }}>${totalLoss.toLocaleString()}</div>
      </div>

      {/* Stacked bar */}
      <div style={{ height: '64px', borderRadius: '12px', overflow: 'hidden', display: 'flex', marginBottom: '24px', border: '1px solid #e4e4e7' }}>
        {segments.map((seg, i) => (
          <div key={seg.label} style={{
            width: seg.width, minWidth: seg.minWidth,
            background: `linear-gradient(135deg, ${seg.color}, ${seg.color}cc)`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderLeft: i > 0 ? '2px solid #fff' : 'none', cursor: 'pointer', transition: '0.2s',
          }}>
            <span style={{ fontSize: '20px', marginBottom: '2px' }}>{seg.icon}</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: mono, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              ${seg.amount.toLocaleString()}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff', fontFamily: mono, opacity: 0.9 }}>{seg.pct}%</span>
          </div>
        ))}
      </div>

      {/* Category cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {segments.map((seg) => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'white', borderRadius: '8px', border: '1px solid #e4e4e7' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '8px',
              background: `linear-gradient(135deg, ${seg.color}20, ${seg.color}10)`,
              border: `2px solid ${seg.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0,
            }}>{seg.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f0f0f', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{seg.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: mono, color: seg.color }}>${seg.amount.toLocaleString()}</span>
                <span style={{ fontSize: '12px' }}>({seg.pct}%)</span>
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
