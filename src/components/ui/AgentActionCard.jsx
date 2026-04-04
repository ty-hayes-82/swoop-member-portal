import { useState } from 'react';
import { AGENT_ACTION_TYPES } from '@/config/actionTypes';
import MemberLink from '@/components/MemberLink.jsx';
import { getMemberProfile } from '@/services/memberService';
import { getAgentById } from '@/services/agentService';
import { SourceBadgeRow } from '@/components/ui/SourceBadge';
import InfoTooltip from '@/components/ui/InfoTooltip';

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

const PRIORITY_CLS = {
  high: 'border-l-error-500',
  medium: 'border-l-warning-500',
  low: 'border-l-gray-400',
};

export function AgentActionCard({ action, onApprove, onDismiss, overrideStatus, onSelect }) {
  const [pulse, setPulse] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const status = overrideStatus ?? action.status;
  const isDone = status !== 'pending';
  const typeMeta = AGENT_ACTION_TYPES[action.actionType] ?? { icon: '\u2B21', label: action.actionType, color: '#0ba5ec' };
  const agent = getAgentById(action.agentId);
  const memberProfile = action.memberId ? getMemberProfile(action.memberId) : null;

  const trigger = (handler, feedbackType) => {
    setFeedback(feedbackType);
    setPulse(true);
    window.setTimeout(() => {
      setExiting(true);
      window.setTimeout(() => { handler?.(); setPulse(false); }, 200);
    }, 250);
  };

  const handleSelect = () => { if (onSelect) onSelect(action); };

  return (
    <div
      onClick={handleSelect}
      role={onSelect ? 'button' : undefined}
      className={`rounded-xl p-4 border-l-[3px] border overflow-hidden transition-all duration-250 ${
        feedback === 'approved' ? 'bg-success-50 border-success-500 border-l-success-500 dark:bg-success-500/10' :
        feedback === 'dismissed' ? 'bg-error-50 border-error-500 border-l-error-500 dark:bg-error-500/10' :
        `bg-white border-gray-200 dark:bg-white/[0.03] dark:border-gray-800 ${PRIORITY_CLS[action.priority] ?? 'border-l-blue-light-500'}`
      } ${onSelect ? 'cursor-pointer' : 'cursor-default'}`}
      style={{
        opacity: exiting ? 0 : isDone ? 0.68 : 1,
        transform: pulse ? 'scale(0.992)' : 'scale(1)',
        maxHeight: exiting ? 0 : 500,
      }}
    >
      <div className="flex justify-between items-center gap-2 mb-2">
        <span className="text-[11px] font-bold rounded-lg px-2 py-0.5 border" style={{ color: typeMeta.color, background: `${typeMeta.color}1A`, borderColor: `${typeMeta.color}33` }}>
          {typeMeta.icon} {typeMeta.label}
        </span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">{formatTime(action.timestamp)}</span>
      </div>

      <div className="text-sm text-gray-800 font-semibold leading-relaxed mb-2 dark:text-white/90">{action.description}</div>

      {memberProfile && (
        <div className="flex items-center gap-2.5 flex-wrap mb-2">
          <MemberLink memberId={memberProfile.memberId} className="font-bold">{memberProfile.name}</MemberLink>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">{memberProfile.tier}</span>
          <span className="text-[11px] font-mono text-gray-600 dark:text-gray-400">Score {memberProfile.healthScore}</span>
        </div>
      )}

      {action.signals && action.signals.length > 0 && (
        <div className="mb-2.5"><SourceBadgeRow sources={action.signals} size="xs" /></div>
      )}

      <div className="flex flex-wrap gap-2 mb-2.5">
        <span className="text-[11px] rounded-lg px-2 py-0.5 border" style={{ color: agent?.accentColor ?? '#0ba5ec', background: `${agent?.accentColor ?? '#0ba5ec'}1A`, borderColor: `${agent?.accentColor ?? '#0ba5ec'}33` }}>
          {action.source}
        </span>
        <span className="text-[11px] text-success-500 bg-success-50 border border-success-200 rounded-lg px-2 py-0.5 dark:bg-success-500/10 dark:border-success-500/30">
          Impact: {action.impactMetric}
        </span>
      </div>

      {status === 'approved' && <div className="text-[11px] text-success-500 font-bold">Approved</div>}
      {status === 'dismissed' && <div className="text-[11px] text-gray-500 font-bold dark:text-gray-400">Dismissed</div>}

      {!isDone && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1 text-[10px] text-gray-500 leading-tight dark:text-gray-400">
            <span>What happens next?</span>
            <InfoTooltip text="Approve \u2192 Sends push notification via Swoop app \u2192 Tracks in Intervention Queue \u2192 GM sees response status within 24h. Dismiss \u2192 Marks as reviewed without sending." />
          </div>
          <div className="flex gap-2">
            <button
              onClick={(event) => { event.stopPropagation(); trigger(onApprove, 'approved'); }}
              title="Approve this action and send via Swoop app."
              className="flex-1 rounded-lg border border-success-200 bg-success-50 text-success-600 py-2 text-xs font-bold cursor-pointer dark:bg-success-500/10 dark:border-success-500/30 dark:text-success-400"
            >Approve</button>
            <button
              onClick={(event) => { event.stopPropagation(); trigger(onDismiss, 'dismissed'); }}
              title="Dismiss this action."
              className="rounded-lg border border-gray-200 bg-transparent text-gray-500 py-2 px-3 text-xs cursor-pointer dark:border-gray-700 dark:text-gray-400"
            >Dismiss</button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                const shareText = `Action: ${action.description}\nMember: ${memberProfile?.name || action.memberName || '\u2014'}\nImpact: ${action.impactMetric || '\u2014'}\nSource: ${agent?.name || action.source || '\u2014'}\nPriority: ${action.priority || 'medium'}`;
                if (navigator.share) {
                  navigator.share({ title: 'Swoop Golf Action', text: shareText }).catch(() => {});
                } else if (navigator.clipboard) {
                  navigator.clipboard.writeText(shareText).then(() => {
                    const btn = event.currentTarget;
                    btn.textContent = 'Copied!';
                    setTimeout(() => { btn.textContent = 'Share'; }, 1500);
                  });
                }
              }}
              title="Copy action details to clipboard or share"
              className="rounded-lg border border-gray-200 bg-transparent text-gray-500 py-2 px-2.5 text-[11px] cursor-pointer dark:border-gray-700 dark:text-gray-400"
            >Share</button>
          </div>
        </div>
      )}
    </div>
  );
}
