// DailyBriefing — Today mode: immediate priorities. Analytics mode: full briefing.
// Critique Phase 4: two-mode experience.
import { useState, useEffect } from 'react';
import { Panel, StoryHeadline } from '@/components/ui/index.js';
import { useApp } from '@/context/AppContext.jsx';
import TodayMode from './TodayMode.jsx';
import YesterdayRecap from './YesterdayRecap.jsx';
import TodayRiskFactors from './TodayRiskFactors.jsx';
import MorningBriefing from '@/components/ui/MorningBriefing.jsx';
import MemberLink from '@/components/MemberLink.jsx';
import { getDailyBriefing } from '@/services/briefingService.js';
import { useNavigation } from '@/context/NavigationContext.jsx';
import { theme } from '@/config/theme.js';
import ActionRecommendation from '@/components/ActionRecommendation.jsx';
import RecentInterventions from '@/components/ui/RecentInterventions.jsx';

import { SkeletonDashboard } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';

export default function DailyBriefing() {
  const { navigate, viewMode, setViewMode } = useNavigation();
  const briefing = getDailyBriefing();
  const { pendingAgentCount } = useApp();
  
  // FP-P02: Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate initial load delay (prepare for future API)
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);



  // FP-P02: Show loading skeleton
  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>



      <StoryHeadline
        variant="urgent"
        headline={(
          <>
            <MemberLink
              mode="drawer"
              memberId="mbr_203"
              style={{
                fontWeight: 700,
                color: theme.colors.textPrimary,
                textDecorationColor: `${theme.colors.urgent}80`,
              }}
            >
              James Whitfield
            </MemberLink>
            {' '}filed a complaint Jan 18. It was never resolved. He resigned Jan 22 — $18K/year in dues lost ($90K lifetime value).
          </>
        )}
        context="An understaffed Friday caused a 40-minute lunch. The complaint was acknowledged but no one followed up. Four days later, he was gone. What Swoop would have done: Alert surfaced Day 1 → GM sends recovery message via Swoop app → James responds same day → Health score monitored weekly → Retention confirmed."
      />

      {/* Agent actions badge — full inbox lives on Intelligent Actions page */}
      {pendingAgentCount > 0 && (
        <div
          onClick={() => navigate('agent-command')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            background: `${theme.colors.agents ?? theme.colors.accent}08`,
            border: `1px solid ${theme.colors.agents ?? theme.colors.accent}30`,
            borderRadius: theme.radius.md,
            cursor: 'pointer',
          }}
        >
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: theme.colors.agents ?? theme.colors.accent,
            color: '#fff',
            fontSize: '12px',
            fontWeight: 700,
          }}>
            {pendingAgentCount}
          </span>
          <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>
            actions pending review
          </span>
          <span style={{ marginLeft: 'auto', fontSize: theme.fontSize.xs, color: theme.colors.agents ?? theme.colors.accent, fontWeight: 600 }}>
            Open Intelligent Actions &rarr;
          </span>
        </div>
      )}

      <RecentInterventions />

      {/* Mode switcher + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: theme.colors.bgDeep, borderRadius: theme.radius.md, padding: '3px', border: `1px solid ${theme.colors.border}` }}>
          {[['today', 'Today'], ['analytics', 'Analytics']].map(([mode, label]) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              padding: '7px 20px', borderRadius: '8px', fontSize: theme.fontSize.sm, fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: viewMode === mode ? theme.colors.bgCard : 'transparent',
              color: viewMode === mode ? theme.colors.textPrimary : theme.colors.textMuted,
              boxShadow: viewMode === mode ? theme.shadow.sm : 'none',
            }}>{label}</button>
          ))}
        </div>
        <MorningBriefing />
      </div>

      {/* TODAY mode — 3 things that matter */}
      {viewMode === 'today' && (
        <TodayMode onNavigate={navigate} />
      )}

      {/* ANALYTICS mode — full analytical briefing */}
      {viewMode === 'analytics' && (
        <>
          {/* Date header */}
          <div style={{ paddingBottom: '4px', borderBottom: `1px solid ${theme.colors.border}` }}>
            <div style={{ fontSize: '11px', color: theme.colors.textMuted, letterSpacing: '0.08em', fontWeight: 600, marginBottom: '4px' }}>
              SATURDAY, JANUARY 17, 2026 · OAKMONT HILLS CC
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: theme.colors.operations, 
                background: `${theme.colors.operations}12`, 
                padding: '3px 10px', 
                borderRadius: '999px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>
                ⚡ Real-Time Cockpit
              </span>
            </div>
            <h2 style={{ fontFamily: theme.fonts.serif, fontSize: '26px', color: theme.colors.textPrimary, fontWeight: 400, lineHeight: 1.1, marginBottom: '4px' }}>
              How did yesterday perform?
            </h2>
            <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: 0 }}>
              Retrospective analysis and trend context
            </p>
          </div>

          <Panel title="Yesterday's Results" subtitle="How did January 16th perform vs. expectations?">
            <YesterdayRecap data={briefing.yesterdayRecap} />
          </Panel>

          <Panel title="Today's Watch List" subtitle="What could affect today's operation?">
            <TodayRiskFactors data={briefing.todayRisks} onNavigate={navigate} />
            <ActionRecommendation
              action="Review at-risk members and send recovery outreach via Swoop app"
              owner="Membership Director"
              dueBy="Before 12:00 PM today"
              proofMetric="2-3 recovery touches sent via Swoop app, response tracked"
              variant="subtle"
            />
          </Panel>

        </>
      )}
      </div>
    </PageTransition>
  );
}
