// WaitlistRow.jsx — UI primitive for member-aware waitlist queue
import { useState } from 'react';
import MemberLink from '@/components/MemberLink.jsx';
import ArchetypeBadge from './ArchetypeBadge';

const riskCls = (riskLevel) => {
  if (riskLevel === 'Critical') return 'text-error-500 bg-error-50 border-error-200 dark:bg-error-500/10 dark:border-error-500/30';
  if (riskLevel === 'At Risk')  return 'text-warning-500 bg-warning-50 border-warning-200 dark:bg-warning-500/10 dark:border-warning-500/30';
  if (riskLevel === 'Watch')    return 'text-blue-light-500 bg-blue-light-50 border-blue-light-200 dark:bg-blue-light-500/10 dark:border-blue-light-500/30';
  return 'text-success-500 bg-success-50 border-success-200 dark:bg-success-500/10 dark:border-success-500/30';
};

const priorityCls = (retentionPriority) => {
  if (retentionPriority === 'HIGH') return { label: 'PRIORITY', cls: 'text-success-500 bg-success-50 border-success-200 dark:bg-success-500/10 dark:border-success-500/30' };
  return { label: 'STANDARD', cls: 'text-gray-500 bg-gray-100 border-gray-200 dark:bg-white/5 dark:border-gray-700 dark:text-gray-400' };
};

export default function WaitlistRow({
  memberId, memberName, archetype, healthScore, riskLevel, retentionPriority,
  requestedSlot, daysWaiting, lastRound, memberValueAnnual, churnRiskScore, onSelect,
}) {
  const rCls = riskCls(riskLevel);
  const p = priorityCls(retentionPriority);
  const clickable = typeof onSelect === 'function';
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role="row"
      onClick={clickable ? () => onSelect(memberId) : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`gap-3 items-center px-3 py-2.5 rounded-xl border transition-all duration-150 ${
        hovered
          ? 'border-blue-light-200 bg-gray-50 shadow-theme-xs -translate-y-px dark:border-blue-light-500/30 dark:bg-white/[0.05]'
          : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'
      } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
      style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 110px 92px 110px 140px' }}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <MemberLink memberId={memberId} className="font-bold text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap dark:text-white/90">
            {memberName}
          </MemberLink>
          <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400">{memberId}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <ArchetypeBadge archetype={archetype} size="xs" />
          {lastRound && <span className="text-[11px] text-gray-500 dark:text-gray-400">Last round: {lastRound}</span>}
        </div>
      </div>

      <div className="text-xs text-gray-600 dark:text-gray-400">
        {requestedSlot}
        <div className="text-[11px] text-gray-500 mt-0.5 dark:text-gray-400">Waiting {daysWaiting}d</div>
      </div>

      <div className="text-right">
        <div className="font-mono font-bold text-gray-800 dark:text-white/90">{healthScore}</div>
        {typeof churnRiskScore === 'number' && (
          <div className="font-mono text-[11px] text-gray-500 dark:text-gray-400">Risk {Math.round(churnRiskScore * 100)}%</div>
        )}
      </div>

      <span className={`justify-self-start text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap border ${rCls}`}>
        {riskLevel}
      </span>

      <span className={`justify-self-start text-[11px] font-extrabold tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap border ${p.cls}`}>
        {p.label}
      </span>

      <div className="text-right">
        {typeof memberValueAnnual === 'number' && (
          <div className="font-mono text-xs text-gray-800 font-bold dark:text-white/90">${memberValueAnnual.toLocaleString()}/yr</div>
        )}
        <div className="text-[11px] text-gray-500 mt-0.5 dark:text-gray-400">Action: fill first</div>
      </div>
    </div>
  );
}
