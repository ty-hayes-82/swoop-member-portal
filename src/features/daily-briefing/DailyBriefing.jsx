// DailyBriefing — Today mode: immediate priorities. Analytics mode: full briefing.
// Critique Phase 4: two-mode experience.
import { Panel, ConnectedSystems, StoryHeadline } from '@/components/ui/index.js';
import TodayMode from './TodayMode.jsx';
import YesterdayRecap from './YesterdayRecap.jsx';
import TodayRiskFactors from './TodayRiskFactors.jsx';
import PendingActions from './PendingActions.jsx';
import PipelineSnapshot from './PipelineSnapshot.jsx';
import MorningBriefing from '@/components/ui/MorningBriefing.jsx';
import DataQuality from '@/components/ui/DataQuality.jsx';
import { getDailyBriefing } from '@/services/briefingService.js';
import { useNavigation } from '@/context/NavigationContext.jsx';
import { theme } from '@/config/theme.js';

export default function DailyBriefing() {
  const { navigate, viewMode, setViewMode } = useNavigation();
  const briefing = getDailyBriefing();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>

      <StoryHeadline
        variant="urgent"
        headline="James Whitfield filed a complaint Jan 18. It was never resolved. He resigned Jan 22 — $18K/year in dues lost."
        context="An understaffed Friday caused a 40-minute lunch. The complaint was acknowledged but no one followed up. Four days later, he was gone. The Jan 9 and Jan 28 gaps follow the same pattern."
      />

      {/* Mode switcher + print action */}
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
            <h2 style={{ fontFamily: theme.fonts.serif, fontSize: '26px', color: theme.colors.textPrimary, fontWeight: 400, lineHeight: 1.1 }}>
              Full operational picture
            </h2>
          </div>

          {/* James Whitfield live alert */}
          <div
            onClick={() => navigate('staffing-service')}
            style={{
              background: `${theme.colors.urgent}06`,
              border: `1.5px solid ${theme.colors.urgent}50`,
              borderRadius: theme.radius.md,
              padding: theme.spacing.lg,
              cursor: 'pointer',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.md }}>
              <div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.urgent, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  ⚠ Member Needs Attention — Preventable Resignation In Progress
                </div>
                <div style={{ fontFamily: theme.fonts.serif, fontSize: theme.fontSize.xl, color: theme.colors.textPrimary, marginTop: 4 }}>
                  James Whitfield · Balanced Active · $18,000/yr in dues
                </div>
              </div>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, textAlign: 'right', flexShrink: 0, fontWeight: 500 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>Full case →</div>
                <div style={{ fontSize: '11px', color: theme.colors.textMuted }}>Staffing & Service</div>
              </div>
            </div>
            <div className="grid-responsive-4" style={{ marginBottom: theme.spacing.md }}>
              {[
                { label: 'Complaint filed', value: 'Jan 16', color: theme.colors.urgent },
                { label: 'Follow-up status', value: 'Not resolved', color: theme.colors.warning },
                { label: 'How unhappy', value: 'Very unhappy', color: theme.colors.urgent },
                { label: 'Resign risk by', value: 'Jan 22', color: theme.colors.urgent },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: theme.colors.bgCard, borderRadius: theme.radius.sm, padding: theme.spacing.sm }}>
                  <div style={{ fontSize: '11px', color: theme.colors.textMuted, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.6 }}>
              <strong style={{ color: theme.colors.textPrimary }}>What happened: </strong>
              Grill Room short-staffed Jan 16 → 40-minute wait for James's lunch → He filed a complaint that evening → We acknowledged it, no one followed up → He hasn't been back in 6 days → <strong style={{ color: theme.colors.urgent }}>At risk of resigning by Jan 22</strong>
            </div>
          </div>

          <Panel title="Yesterday's Results" subtitle="How did January 16th perform vs. expectations?">
            <YesterdayRecap data={briefing.yesterdayRecap} />
          </Panel>

          <Panel title="Today's Watch List" subtitle="What could affect today's operation?">
            <TodayRiskFactors data={briefing.todayRisks} onNavigate={navigate} />
          </Panel>

          <PipelineSnapshot onNavigate={navigate} />

          <Panel title="Active Response Plans" subtitle="Pre-assembled actions for known operational patterns">
            <PendingActions actions={briefing.pendingActions} onNavigate={navigate} />
          </Panel>

          <DataQuality />

          <ConnectedSystems />
        </>
      )}
    </div>
  );
}
