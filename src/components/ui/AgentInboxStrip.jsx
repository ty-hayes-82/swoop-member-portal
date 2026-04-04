import InfoTooltip from '@/components/ui/InfoTooltip';

export default function AgentInboxStrip({ pendingCount = 0, topAction, onApproveTop, onOpenInbox }) {
  if (pendingCount < 1) return null;

  return (
    <div className="bg-blue-light-50 border border-blue-light-200 rounded-xl p-4 flex items-center justify-between gap-2.5 dark:bg-blue-light-500/5 dark:border-blue-light-500/25">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-[3px]">
          <span className="text-blue-light-600 font-bold text-[11px] tracking-wider uppercase dark:text-blue-light-400">Agent Inbox</span>
          <span className="text-[10px] font-bold bg-blue-light-500 text-white rounded-full px-2 py-px">{pendingCount}</span>
        </div>
        <div className="text-xs text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis dark:text-gray-400">
          {topAction?.description ?? 'Actions are waiting for review.'}
        </div>
      </div>

      <div className="flex gap-2 shrink-0 items-center">
        {topAction && (
          <div className="flex items-center gap-1">
            <button onClick={onApproveTop} className="rounded-lg border border-success-200 bg-success-50 text-success-600 px-2.5 py-1.5 text-[11px] font-bold cursor-pointer dark:bg-success-500/10 dark:border-success-500/30 dark:text-success-400">
              Approve top
            </button>
            <InfoTooltip text="Approve \u2192 Sends push notification via Swoop app \u2192 Tracks in Intervention Queue \u2192 GM sees response status within 24h" />
          </div>
        )}
        <button onClick={onOpenInbox} className="rounded-lg border border-blue-light-200 bg-transparent text-blue-light-600 px-2.5 py-1.5 text-[11px] font-bold cursor-pointer dark:border-blue-light-500/30 dark:text-blue-light-400">
          View inbox
        </button>
      </div>
    </div>
  );
}
