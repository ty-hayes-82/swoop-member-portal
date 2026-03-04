import { Panel } from '@/components/ui/index.js';
import YesterdayRecap from './YesterdayRecap.jsx';
import TodayRiskFactors from './TodayRiskFactors.jsx';
import PendingActions from './PendingActions.jsx';
import { getDailyBriefing } from '@/services/briefingService.js';
import { useNavigation } from '@/context/NavigationContext.jsx';
import { CLUB_NAME } from '@/config/constants.js';

export default function DailyBriefing() {
  const { navigate } = useNavigation();
  const briefing = getDailyBriefing();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
      {/* Date headline */}
      <div style={{ paddingBottom: '4px', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '4px' }}>
          SATURDAY, JANUARY 17, 2026 · {CLUB_NAME.toUpperCase()}
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--text-primary)', fontWeight: 400, lineHeight: 1.1 }}>
          Good morning. Here's what needs your attention.
        </h2>
      </div>

      {/* Yesterday's Recap */}
      <Panel
        title="Yesterday's Recap"
        subtitle="How did Jan 16 perform vs. expectations?"
      >
        <YesterdayRecap data={briefing.yesterdayRecap} />
      </Panel>

      {/* Today's Risk Factors */}
      <Panel
        title="Today's Risk Factors"
        subtitle="What could affect today's operation?"
      >
        <TodayRiskFactors data={briefing.todayRisks} onNavigate={navigate} />
      </Panel>

      {/* Pending Actions */}
      <Panel
        title="Intervention Playbooks"
        subtitle="Pre-assembled responses to known operational patterns"
      >
        <PendingActions actions={briefing.pendingActions} onNavigate={navigate} />
      </Panel>
    </div>
  );
}
