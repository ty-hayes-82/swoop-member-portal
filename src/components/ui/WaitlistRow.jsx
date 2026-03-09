// WaitlistRow.jsx — UI primitive for member-aware waitlist queue
// Props contract: see ARCHITECTURE.md §7

import { useState } from 'react';
import MemberLink from '@/components/MemberLink.jsx';
import { theme } from '@/config/theme';
import ArchetypeBadge from './ArchetypeBadge';

const riskStyles = (riskLevel) => {
  const c = theme.colors;
  if (riskLevel === 'Critical') return { color: c.urgent,   bg: `${c.urgent}14`,   border: `${c.urgent}33` };
  if (riskLevel === 'At Risk')  return { color: c.warning,  bg: `${c.warning}14`,  border: `${c.warning}33` };
  if (riskLevel === 'Watch')    return { color: c.info,     bg: `${c.info}12`,     border: `${c.info}2E` };
  return { color: c.success, bg: `${c.success}12`, border: `${c.success}2E` };
};

const priorityStyles = (retentionPriority) => {
  const c = theme.colors;
  if (retentionPriority === 'HIGH')
    return { label: 'PRIORITY', color: c.success, bg: `${c.success}12`, border: `${c.success}2E` };
  return { label: 'STANDARD', color: c.textMuted, bg: `${c.bgDeep}`, border: c.border };
};

export default function WaitlistRow({
  memberId,
  memberName,
  archetype,
  healthScore,
  riskLevel,
  retentionPriority,
  requestedSlot,
  daysWaiting,
  lastRound,
  memberValueAnnual,
  churnRiskScore,
  onSelect,
}) {
  const r = riskStyles(riskLevel);
  const p = priorityStyles(retentionPriority);
  const clickable = typeof onSelect === 'function';
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role="row"
      onClick={clickable ? () => onSelect(memberId) : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr 110px 92px 110px 140px',
        gap: theme.spacing.sm,
        alignItems: 'center',
        padding: '10px 12px',
        border: `1px solid ${hovered ? theme.colors.info + '40' : theme.colors.border}`,
        borderRadius: theme.radius.md,
        background: hovered ? theme.colors.bgCardHover : theme.colors.bgCard,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'border-color 0.15s ease, background 0.15s ease, transform 0.12s ease',
        boxShadow: hovered ? theme.shadow.sm : 'none',
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <MemberLink
            memberId={memberId}
            style={{ fontWeight: 700, color: theme.colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {memberName}
          </MemberLink>
          <span style={{ fontFamily: theme.fonts.mono, fontSize: '11px', color: theme.colors.textMuted }}>
            {memberId}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <ArchetypeBadge archetype={archetype} size="xs" />
          {lastRound && (
            <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>
              Last round: {lastRound}
            </span>
          )}
        </div>
      </div>

      <div style={{ fontSize: '12px', color: theme.colors.textSecondary }}>
        {requestedSlot}
        <div style={{ fontSize: '11px', color: theme.colors.textMuted, marginTop: '2px' }}>
          Waiting {daysWaiting}d
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: theme.fonts.mono, fontWeight: 700, color: theme.colors.textPrimary }}>
          {healthScore}
        </div>
        {typeof churnRiskScore === 'number' && (
          <div style={{ fontFamily: theme.fonts.mono, fontSize: '11px', color: theme.colors.textMuted }}>
            Risk {Math.round(churnRiskScore * 100)}%
          </div>
        )}
      </div>

      <span style={{
        justifySelf: 'start',
        fontSize: '11px',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '999px',
        background: r.bg,
        color: r.color,
        border: `1px solid ${r.border}`,
        whiteSpace: 'nowrap',
      }}>
        {riskLevel}
      </span>

      <span style={{
        justifySelf: 'start',
        fontSize: '11px',
        fontWeight: 800,
        letterSpacing: '0.02em',
        padding: '2px 8px',
        borderRadius: '999px',
        background: p.bg,
        color: p.color,
        border: `1px solid ${p.border}`,
        whiteSpace: 'nowrap',
      }}>
        {p.label}
      </span>

      <div style={{ textAlign: 'right' }}>
        {typeof memberValueAnnual === 'number' && (
          <div style={{ fontFamily: theme.fonts.mono, fontSize: '12px', color: theme.colors.textPrimary, fontWeight: 700 }}>
            ${memberValueAnnual.toLocaleString()}/yr
          </div>
        )}
        <div style={{ fontSize: '11px', color: theme.colors.textMuted, marginTop: '2px' }}>
          Action: fill first
        </div>
      </div>
    </div>
  );
}
