// DailyBriefing.jsx — Story-first home screen.
// Order: Headline → mbr_203 Alert → Yesterday Recap → Today Risks → Playbooks → Connected Systems
import { Panel, StoryHeadline, ConnectedSystems } from '@/components/ui/index.js';
import YesterdayRecap from './YesterdayRecap.jsx';
import TodayRiskFactors from './TodayRiskFactors.jsx';
import PendingActions from './PendingActions.jsx';
import { getDailyBriefing } from '@/services/briefingService.js';
import { useNavigation } from '@/context/NavigationContext.jsx';
import { CLUB_NAME } from '@/config/constants.js';
import { theme } from '@/config/theme.js';

export default function DailyBriefing() {
  const { navigate } = useNavigation();
  const briefing = getDailyBriefing();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
      {/* Date bar */}
      <div style={{ paddingBottom: '4px', borderBottom: `1px solid ${theme.colors.border}` }}>
        <div style={{ fontSize: '11px', color: theme.colors.textMuted, letterSpacing: '0.08em', fontWeight: 600, marginBottom: '4px' }}>
          SATURDAY, JANUARY 17, 2026 · {CLUB_NAME.toUpperCase()}
        </div>
        <h2 style={{ fontFamily: theme.fonts.serif, fontSize: '28px', color: theme.colors.textPrimary, fontWeight: 400, lineHeight: 1.1 }}>
          Good morning. Here's what needs your attention.
        </h2>
      </div>

      {/* STORY HEADLINE — most important insight above the fold */}
      <StoryHeadline
        variant="urgent"
        headline="An unresolved complaint is about to cost you $18,000."
        context="mbr_203 filed a service complaint yesterday. It was acknowledged but never resolved. Members in this pattern resign within 4 days — activate Service Save Protocol now to prevent it."
      />

      {/* mbr_203 live alert */}
      <div
        onClick={() => navigate('staffing-service')}
        style={{
          background: `${theme.colors.urgent}0C`,
          border: `1.5px solid ${theme.colors.urgent}60`,
          borderRadius: theme.radius.md,
          padding: theme.spacing.lg,
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.md }}>
          <div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.urgent, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              ⚠ LIVE CASE — Preventable Resignation In Progress
            </div>
            <div style={{ fontFamily: theme.fonts.serif, fontSize: theme.fontSize.xl, color: theme.colors.textPrimary, marginTop: 4 }}>
              mbr_203 · Balanced Active · $18,000/yr in dues
            </div>
          </div>
          <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted, textAlign: 'right', flexShrink: 0 }}>
            <div>Open case →</div>
            <div style={{ fontSize: '11px' }}>Staffing & Service</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
          {[
            { label: 'Complaint filed', value: 'Jan 16', color: theme.colors.urgent },
            { label: 'Status', value: 'Acknowledged', color: theme.colors.warning },
            { label: 'Sentiment score', value: '−0.8 / 1.0', color: theme.colors.urgent },
            { label: 'At risk by', value: 'Jan 22', color: theme.colors.urgent },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: theme.colors.bgCard, borderRadius: theme.radius.sm, padding: theme.spacing.sm }}>
              <div style={{ fontSize: '11px', color: theme.colors.textMuted, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
          <strong style={{ color: theme.colors.textPrimary }}>Causal chain: </strong>
          Grill Room understaffed Jan 16 → 20% longer ticket times → Service Speed complaint (−0.8) → acknowledged, not resolved → member resigns Jan 22 → <strong style={{ color: theme.colors.urgent }}>$18K/yr dues lost</strong>
        </div>
      </div>

      {/* Yesterday's Recap */}
      <Panel title="Yesterday's Recap" subtitle="How did Jan 16 perform vs. expectations?">
        <YesterdayRecap data={briefing.yesterdayRecap} />
      </Panel>

      {/* Today's Risk Factors */}
      <Panel title="Today's Risk Factors" subtitle="What could affect today's operation?">
        <TodayRiskFactors data={briefing.todayRisks} onNavigate={navigate} />
      </Panel>

      {/* Intervention Playbooks */}
      <Panel title="Intervention Playbooks" subtitle="Pre-assembled responses to known operational patterns">
        <PendingActions actions={briefing.pendingActions} onNavigate={navigate} />
      </Panel>

      {/* Connected Systems — answers "how does it know this?" */}
      <ConnectedSystems />
    </div>
  );
}
