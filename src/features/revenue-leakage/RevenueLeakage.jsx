import { useState, useEffect } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import PaceImpactTab from './tabs/PaceImpactTab';
import StaffingImpactTab from './tabs/StaffingImpactTab';
import WeatherImpactTab from './tabs/WeatherImpactTab';
import { theme } from '@/config/theme';
import { useApp } from '@/context/AppContext';
import { paceFBImpact } from '@/data/pace';
import { understaffedDays } from '@/data/staffing';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import ScenarioModeling from './components/ScenarioModeling';
import FlowLink from '@/components/ui/FlowLink';

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
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)',
      border: '1px solid #bbf7d0',
      borderRadius: '16px',
      padding: '32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle decorative element */}
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />

      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
        <div style={{
          width: '44px', height: '44px',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
          flexShrink: 0,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Recovery Opportunity</div>
          <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
            Recover <span style={{ color: '#16a34a' }}>${recoverableAmount.toLocaleString()}</span>/month with ranger deployment
          </h3>
        </div>
      </div>

      {/* Stacked Bar Visualization */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly F&B Impact from Pace Issues</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>${totalLoss.toLocaleString()} total</span>
        </div>

        <div style={{ display: 'flex', height: '52px', borderRadius: '12px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{
            width: recoverPct + '%',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            color: 'white',
            fontWeight: 800, fontSize: '16px',
            fontFamily: "'JetBrains Mono', monospace",
            position: 'relative',
            textShadow: '0 1px 2px rgba(0,0,0,0.15)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            ${recoverableAmount.toLocaleString()}
          </div>
          <div style={{
            width: remainPct + '%',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            color: '#94a3b8',
            fontWeight: 700, fontSize: '16px',
            fontFamily: "'JetBrains Mono', monospace",
            borderLeft: '2px solid rgba(0,0,0,0.06)',
          }}>
            ${remaining.toLocaleString()}
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: '10px' }}>
          <div style={{ width: recoverPct + '%', paddingRight: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Recoverable</span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b', paddingLeft: '14px' }}>via Pace Management</span>
          </div>
          <div style={{ width: remainPct + '%', paddingLeft: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Remaining Gap</span>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '14px' }}>Addressable via Staffing optimization</span>
          </div>
        </div>
      </div>

      {/* Action Details */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '18px 20px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: '#fef3c7',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            fontSize: '18px',
          }}>{'🎯'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Deployment Strategy</div>
            <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#475569' }}>
              Deploy rangers on <strong style={{ color: '#0f172a' }}>holes 4, 8, 12, and 16</strong> during peak times{' '}
              <span style={{ background: '#fef3c7', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, fontSize: '12px', color: '#92400e' }}>Sat/Sun 8am{'–'}11am</span>
            </div>
            <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: '12px', color: '#64748b' }}>Avg delay reduced by <strong style={{ color: '#0f172a' }}>15 min</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: '12px', color: '#64748b' }}>Recovers <strong style={{ color: '#16a34a' }}>35%</strong> of F&B losses</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button style={{
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          color: 'white', fontWeight: 700, fontSize: '14px',
          padding: '12px 24px', borderRadius: '10px', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 2px 8px rgba(34,197,94,0.3)', transition: '0.2s',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
          See Ranger Plan
        </button>
        <button onClick={onViewStaffingTab} style={{
          background: 'white', color: '#374151', fontWeight: 600, fontSize: '14px',
          padding: '12px 24px', borderRadius: '10px',
          border: '1.5px solid #d1d5db', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          View Staffing Tab
        </button>
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
  const { showToast } = useApp();
  const playbookMap = {
    'Pace of Play': 'Deploy Rangers',
    'Staffing': 'Activate Staffing Protocol',
    'Weather': 'Activate Weather Playbook',
  };
  const btnLabel = playbookMap[label] || 'Activate';
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '8px', alignItems: 'center',
      padding: '10px 12px', borderRadius: '6px', border: '1px solid #e4e4e7', background: '#f8f9fa',
    }}>
      <div style={{ width: 10, height: 10, borderRadius: 999, background: color, marginTop: 2 }} />
      <div style={{ display: 'grid', gap: '2px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', color: '#0f0f0f', fontWeight: 600 }}>{label}</span>
          <span style={{ fontSize: '14px', color, fontFamily: mono, fontWeight: 700 }}>${amount.toLocaleString()}/month</span>
        </div>
        <p style={{ fontSize: '12px', color: '#3f3f46', margin: 0 }}>{action}</p>
      </div>
      <button
        onClick={() => showToast(btnLabel + ' activated', 'success')}
        style={{
          padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
          cursor: 'pointer', border: 'none', background: '#e8772e', color: 'white',
          whiteSpace: 'nowrap', alignSelf: 'center',
        }}
      >{btnLabel}</button>
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

        <FlowLink flowNum="03" persona="Mike" />

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
