// WaitlistRow.jsx — UI primitive for member-aware waitlist queue
import { useState } from 'react';
import MemberLink from '@/components/MemberLink.jsx';
import ArchetypeBadge from './ArchetypeBadge';

const riskCls = (riskLevel) => {
  if (riskLevel === 'Critical') return 'text-error-500 bg-error-50 border-error-200';
  if (riskLevel === 'At Risk')  return 'text-warning-500 bg-warning-50 border-warning-200';
  if (riskLevel === 'Watch')    return 'text-blue-light-500 bg-blue-light-50 border-blue-light-200';
  return 'text-success-500 bg-success-50 border-success-200';
};

const priorityCls = (retentionPriority) => {
  if (retentionPriority === 'HIGH') return { label: 'PRIORITY', cls: 'text-success-500 bg-success-50 border-success-200' };
  return { label: 'STANDARD', cls: 'text-swoop-text-muted bg-swoop-row border-swoop-border' };
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
          ? 'border-blue-light-200 bg-swoop-row shadow-theme-xs -translate-y-px'
          : 'border-swoop-border bg-swoop-panel'
      } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
      style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 110px 92px 110px 140px' }}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <MemberLink memberId={memberId} className="font-bold text-swoop-text overflow-hidden text-ellipsis whitespace-nowrap">
            {memberName}
          </MemberLink>
          <span className="font-mono text-[11px] text-swoop-text-muted">{memberId}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <ArchetypeBadge archetype={archetype} size="xs" />
          {lastRound && <span className="text-[11px] text-swoop-text-muted">Last round: {lastRound}</span>}
        </div>
      </div>

      <div className="text-xs text-swoop-text-muted">
        {requestedSlot}
        <div className="text-[11px] text-swoop-text-muted mt-0.5">Waiting {daysWaiting}d</div>
      </div>

      <div className="text-right">
        <div className="font-mono font-bold text-swoop-text">{healthScore}</div>
        {typeof churnRiskScore === 'number' && (
          <div className="font-mono text-[11px] text-swoop-text-muted">Risk {Math.round(churnRiskScore * 100)}%</div>
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
          <div className="font-mono text-xs text-swoop-text font-bold">${memberValueAnnual.toLocaleString()}/yr</div>
        )}
        <div className="text-[11px] text-swoop-text-muted mt-0.5">Action: fill first</div>
      </div>
    </div>
  );
}
