import { useState } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import EvidenceStrip from '@/components/ui/EvidenceStrip';
import OutletTab from './tabs/OutletTab';
import ConversionTab from './tabs/ConversionTab';
import WeatherTab from './tabs/WeatherTab';
import { sourceSystems } from '@/services/fbService';
import { theme } from '@/config/theme';

import PageTransition from '@/components/ui/PageTransition';

const TABS = [
  { key: 'outlets',    label: 'Outlet Performance' },
  { key: 'conversion', label: 'Post-Round Conversion' },
  { key: 'weather',    label: 'Rain-Day Intelligence' },
];

const revenueChainSteps = [
  { icon: '\u26F3', label: 'Slow Pace', sub: '+22 min on hole 9' },
  { icon: '\uD83C\uDF7D\uFE0F', label: 'Skipped Dining', sub: '-$47 dinner' },
  { icon: '\uD83D\uDC64', label: 'Server Idle', sub: '-$18 labor' },
  { icon: '\uD83D\uDCC9', label: 'Margin Drop', sub: '-$77/round' },
];

export default function FBPerformance() {
  const [activeTab, setActiveTab] = useState('outlets');

  return (
    <PageTransition>
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <StoryHeadline
        variant="opportunity"
        headline="Slow rounds are leaving $5,700/month in dining revenue on the table."
        context="35% of golfers dine post-round — but that drops to 22% after a slow round (4:30+). 28% of January rounds were slow. Fixing pace is also a dining intervention."
      />
      <EvidenceStrip signals={[
        { source: 'POS', detail: 'Cover counts and per-capita spend' },
        { source: 'Tee Sheet', detail: 'Pace-of-play to post-round dining conversion' },
        { source: 'Staffing', detail: 'Server-to-cover ratio and service timing' },
        { source: 'GPS', detail: 'Clubhouse dwell time after round' },
      ]} />

      <div style={{
        background: theme.colors.bgCard,
        border: '1px solid ' + theme.colors.border,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.colors.accent, width: '100%', textAlign: 'center' }}>The Revenue Chain — Why Pace is an F&B Problem</span>
        {revenueChainSteps.map((s, i) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'center', minWidth: '70px' }}>
              <div style={{ fontSize: '20px' }}>{s.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: theme.colors.textPrimary }}>{s.label}</div>
              <div style={{ fontSize: '10px', color: theme.colors.urgent, fontWeight: 600 }}>{s.sub}</div>
            </div>
            {i < revenueChainSteps.length - 1 && (
              <span style={{ color: theme.colors.textMuted, fontSize: '16px' }}>{'\u2192'}</span>
            )}
          </div>
        ))}
        <div style={{ width: '100%', textAlign: 'center', fontSize: '11px', color: theme.colors.textMuted, marginTop: '4px' }}>
          15 slow rounds/week = $1,155 in invisible weekly revenue loss
        </div>
      </div>

      <Panel
        title="Revenue & F&B"
        subtitle="Where is money being made, lost, or left on the table?"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor={theme.colors.fb}
        sourceSystems={sourceSystems}
      >
        {activeTab === 'outlets'    && <OutletTab />}
        {activeTab === 'conversion' && <ConversionTab />}
        {activeTab === 'weather'    && <WeatherTab />}
      </Panel>
    </div>
    </PageTransition>
  );
}
