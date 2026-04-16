// OnboardingChecklist — first-hour GM experience for fresh clubs.
// Shown instead of the normal Today View when the club has <LOW_DATA_THRESHOLD
// members loaded AND data mode is 'live'. Prevents new clubs from seeing
// another club's numbers and thinking the product hallucinated.
import { useNavigation } from '@/context/NavigationContext';
import { getMemberSummary } from '@/services/memberService';
import { getConnectedSystems } from '@/services/integrationsService';
import StageInsightsPanel from './StageInsightsPanel';
import Panel from '@/components/ui/Panel';
import Btn from '@/components/ui/Btn';

// A club with fewer than 10 members loaded is clearly fresh — no denominator
// needed. Exported so TodayView can gate on the same constant.
export const LOW_DATA_THRESHOLD = 10;

function ChecklistItem({ done, title, description, teaser, actionLabel, onAction }) {
  return (
    <div
      className="flex items-start gap-4 rounded-xl border border-swoop-border bg-swoop-panel p-4"
    >
      <div
        className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold shrink-0 ${
          done
            ? 'bg-brand-50 text-brand-500 border border-brand-200'
            : 'bg-swoop-row text-swoop-text-label border border-swoop-border'
        }`}
        aria-hidden="true"
      >
        {done ? '\u2713' : '\u25CB'}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${done ? 'text-swoop-text-muted line-through' : 'text-swoop-text'}`}>
          {title}
        </div>
        <div className="text-xs text-swoop-text-muted mt-1">
          {description}
        </div>
        {teaser && !done && (
          <div className="text-[11px] text-brand-500/70 mt-1.5 italic">
            {teaser}
          </div>
        )}
      </div>
      <Btn variant={done ? 'ghost' : 'primary'} size="sm" onClick={onAction}>
        {done ? 'Done' : actionLabel}
      </Btn>
    </div>
  );
}

export default function OnboardingChecklist() {
  const { navigate } = useNavigation();

  const memberTotal = getMemberSummary().total || 0;
  const systems = getConnectedSystems();
  const teeSheetConnected = systems.some(
    s => s.category === 'tee-sheet' && s.status === 'connected',
  );
  const posConnected = systems.some(
    s => s.category === 'pos' && s.status === 'connected',
  );
  const schedulingConnected = systems.some(
    s => s.category === 'scheduling' && s.status === 'connected',
  );

  const items = [
    {
      key: 'members',
      done: memberTotal >= LOW_DATA_THRESHOLD,
      title: '1. Connect your member roster',
      description: 'Import your members so Swoop can start scoring engagement and surfacing at-risk accounts.',
      teaser: 'See your complete roster: tenure, dues, households at a glance',
      actionLabel: 'Import members',
      onAction: () => navigate('integrations/csv-import', { category: 'members' }),
    },
    {
      key: 'tee-sheet',
      done: teeSheetConnected,
      title: '2. Connect your tee sheet',
      description: 'Connect your tee sheet to enable today\u2019s rounds, pace of play, and demand forecasting.',
      teaser: 'Discover which at-risk members are coming in TODAY and when to greet them',
      actionLabel: 'Connect tee sheet',
      onAction: () => navigate('integrations'),
    },
    {
      key: 'pos',
      done: posConnected,
      title: '3. Connect your POS',
      description: 'Connect your POS to link spend to members and measure F&B conversion.',
      teaser: 'Find out who\u2019s hitting their F&B minimum and which members stopped dining after complaints',
      actionLabel: 'Connect POS',
      onAction: () => navigate('integrations'),
    },
    {
      key: 'scheduling',
      done: schedulingConnected,
      title: '4. Connect your scheduling system',
      description: 'Link your staff schedules to detect understaffing before it triggers complaints and F&B shortfalls.',
      teaser: 'See demand-driven staffing alerts: "Add a server to Saturday lunch based on 34 tee times"',
      actionLabel: 'Connect scheduling',
      onAction: () => navigate('integrations'),
    },
  ];

  const doneCount = items.filter(i => i.done).length;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <h1 className="text-2xl font-bold text-swoop-text m-0">
          See your at-risk members, F&amp;B gaps, and staffing risks in one view.
        </h1>
        <p className="text-sm text-swoop-text-muted mt-1 mb-0">
          Connect four data sources to access your full member intelligence dashboard. {doneCount} of {items.length} done.
        </p>
      </div>
      <Panel title="Onboarding checklist" subtitle="Each source you connect activates more of Today View.">
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <ChecklistItem
              key={item.key}
              done={item.done}
              title={item.title}
              description={item.description}
              teaser={item.teaser}
              actionLabel={item.actionLabel}
              onAction={item.onAction}
            />
          ))}
        </div>
      </Panel>

      {/* Live insights from anything already imported — only show once data
          starts flowing so we don't surface contradictory progress indicators
          or render a white card in the zero-data state. */}
      {doneCount > 0 && <StageInsightsPanel />}

      {/* Demo shortcut — let GMs explore before IT effort */}
      <div className="rounded-xl border border-swoop-border bg-swoop-panel p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-swoop-text">Not ready to connect data yet?</div>
          <div className="text-xs text-swoop-text-muted mt-0.5">Explore the full dashboard with a sample 300-member golf club to see exactly what you'll get.</div>
        </div>
        <button
          type="button"
          onClick={() => { try { localStorage.setItem('swoop_club_id', 'demo'); } catch {} window.location.reload(); }}
          className="flex-shrink-0 px-4 py-2 rounded-lg border border-brand-500/40 bg-brand-500/10 text-brand-500 text-sm font-semibold cursor-pointer hover:bg-brand-500/20 transition-colors whitespace-nowrap"
        >
          Explore with Sample Data
        </button>
      </div>
    </div>
  );
}
