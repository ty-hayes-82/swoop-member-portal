// ActionsDrawer — Quick-access slide-in panel for pending actions
// Full inbox + playbooks + agents are in #/automations
import { useApp } from '@/context/AppContext';
import { useNavigationContext } from '@/context/NavigationContext';

export default function ActionsDrawer({ isOpen, onClose }) {
  const { inbox, approveAction, dismissAction } = useApp();
  const { navigate } = useNavigationContext();
  const pending = inbox.filter(i => i.status === 'pending').slice(0, 5);

  return (
    <>
      {isOpen && (
        <div onClick={onClose} className="fixed inset-0 bg-black/35 z-[200] transition-opacity duration-200" />
      )}

      <div
        className={`fixed top-0 right-0 h-screen bg-white border-l border-gray-200 flex flex-col overflow-hidden z-[210] transition-transform duration-250 dark:bg-white/[0.03] dark:border-gray-800 ${isOpen ? 'translate-x-0 shadow-theme-xl' : 'translate-x-full'}`}
        style={{ width: Math.min(420, typeof window !== 'undefined' ? window.innerWidth - 60 : 420) }}
        role="dialog"
        aria-label="Actions drawer"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center shrink-0 dark:border-gray-800">
          <div>
            <div className="text-base font-bold text-gray-800 dark:text-white/90">Action Queue</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {pending.length > 0 ? `${pending.length} action${pending.length > 1 ? 's' : ''} need review` : 'All caught up'}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-gray-200 bg-gray-100 text-gray-500 text-base cursor-pointer flex items-center justify-center dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            &times;
          </button>
        </div>

        {/* Actions */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {pending.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-500 text-sm dark:text-gray-400">
              <div className="text-[32px] mb-3">&#10003;</div>
              <div className="font-semibold mb-1">All caught up</div>
              <div className="text-sm">No pending actions right now.</div>
            </div>
          ) : (
            pending.map(action => (
              <div key={action.id} className="border border-gray-200 rounded-xl px-4 py-3.5 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <div className="text-sm font-semibold text-gray-800 mb-1.5 dark:text-white/90">{action.description}</div>
                <div className="text-xs text-gray-500 mb-2.5 dark:text-gray-400">
                  {action.source} &middot; {action.actionType?.replace(/_/g, ' ').toLowerCase()}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                      const channel = (action.recommendedChannel || 'email').toLowerCase();
                      const execType = channel === 'sms' || channel === 'push' ? 'sms' : channel === 'call' ? 'staff_task' : 'email';
                      approveAction(action.id, { executionType: execType, memberId: action.memberId, memberName: action.memberName });
                    }} className="px-4 py-1.5 rounded-md bg-success-500 text-white border-none text-xs font-semibold cursor-pointer">Approve</button>
                  <button onClick={() => dismissAction(action.id)} className="px-4 py-1.5 rounded-md bg-transparent text-gray-500 border border-gray-200 text-xs font-semibold cursor-pointer dark:border-gray-700 dark:text-gray-400">Dismiss</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: View all link */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 shrink-0">
          <button
            onClick={() => { onClose(); navigate('automations'); }}
            className="w-full py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            View all in Automations &rarr;
          </button>
        </div>
      </div>
    </>
  );
}
