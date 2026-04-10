// OnboardingChecklist — first-hour GM experience for fresh clubs.
// Shown instead of the normal Today View when the club has <LOW_DATA_THRESHOLD
// members loaded AND data mode is 'live'. Prevents new clubs from seeing
// another club's numbers and thinking the product hallucinated.
import { useNavigation } from '@/context/NavigationContext';
import { getMemberSummary } from '@/services/memberService';
import { getConnectedSystems } from '@/services/integrationsService';
import Panel from '@/components/ui/Panel';
import Btn from '@/components/ui/Btn';

// A club with fewer than 10 members loaded is clearly fresh — no denominator
// needed. Exported so TodayView can gate on the same constant.
export const LOW_DATA_THRESHOLD = 10;

function ChecklistItem({ done, title, description, actionLabel, onAction }) {
  return (
    <div
      className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div
        className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold shrink-0 ${
          done
            ? 'bg-brand-50 text-brand-500 border border-brand-200 dark:bg-brand-500/15 dark:border-brand-500/30'
            : 'bg-gray-50 text-gray-400 border border-gray-200 dark:bg-white/5 dark:border-gray-700'
        }`}
        aria-hidden="true"
      >
        {done ? '\u2713' : '\u25CB'}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${done ? 'text-gray-500 line-through dark:text-gray-500' : 'text-gray-800 dark:text-white/90'}`}>
          {title}
        </div>
        <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">
          {description}
        </div>
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

  const items = [
    {
      key: 'members',
      done: memberTotal >= LOW_DATA_THRESHOLD,
      title: '1. Connect your member roster',
      description: 'Import your members so Swoop can start scoring engagement and surfacing at-risk accounts.',
      actionLabel: 'Import members',
      onAction: () => navigate('integrations/csv-import', { category: 'members' }),
    },
    {
      key: 'tee-sheet',
      done: teeSheetConnected,
      title: '2. Connect your tee sheet',
      description: 'Connect your tee sheet to unlock today\u2019s rounds, pace of play, and demand forecasting.',
      actionLabel: 'Connect tee sheet',
      onAction: () => navigate('integrations'),
    },
    {
      key: 'pos',
      done: posConnected,
      title: '3. Connect your POS',
      description: 'Connect your POS to link spend to members and measure F&B conversion.',
      actionLabel: 'Connect POS',
      onAction: () => navigate('integrations'),
    },
  ];

  const doneCount = items.filter(i => i.done).length;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 m-0">
          Welcome to Swoop. Let&rsquo;s get your club&rsquo;s data flowing.
        </h1>
        <p className="text-sm text-gray-500 mt-1 mb-0 dark:text-gray-400">
          Complete these three steps to unlock the operational cockpit. {doneCount} of {items.length} done.
        </p>
      </div>
      <Panel title="Onboarding checklist" subtitle="Each source you connect unlocks more of Today View.">
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <ChecklistItem
              key={item.key}
              done={item.done}
              title={item.title}
              description={item.description}
              actionLabel={item.actionLabel}
              onAction={item.onAction}
            />
          ))}
        </div>
      </Panel>
    </div>
  );
}
