import { useState } from 'react';
import MemberLink from '@/components/MemberLink.jsx';
import { theme } from '@/config/theme';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge.jsx';

const TIER_COLORS = {
  hot:  theme.colors.urgent,
  warm: theme.colors.warning,
  cool: theme.colors.textMuted,
  cold: theme.colors.textMuted,
};

const TIER_LABELS = { hot: '🔥 Hot', warm: '♨ Warm', cool: '💧 Cool', cold: '❄ Cold' };

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatDate = (value) => {
  if (!value) return '—';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function LeadCard({ lead }) {
  const [expanded, setExpanded] = useState(false);
  const tierColor = TIER_COLORS[lead.tier] ?? theme.colors.textSecondary;
  const displayName = lead.guestName || lead.name || lead.prospectName || 'Prospect';
  const nameContent = lead.memberId ? (
    <MemberLink
      memberId={lead.memberId}
      mode="drawer"
      style={{ fontSize: theme.fontSize.md, fontWeight: 600, color: theme.colors.textPrimary }}
    >
      {displayName}
    </MemberLink>
  ) : (
    <span style={{ fontSize: theme.fontSize.md, fontWeight: 600, color: theme.colors.textPrimary }}>
      {displayName}
    </span>
  );
  const visitCount = toNumber(lead.visits, toNumber(lead.visitCount, 0));
  const totalSpendValue = toNumber(
    lead.totalSpend,
    toNumber(lead.totalSpendUsd, toNumber(lead.spend, 0)),
  );

  return (
    <div style={{
      background: theme.colors.bgCardHover, borderRadius: theme.radius.md,
      border: `1px solid ${expanded ? `${tierColor}50` : theme.colors.border}`,
      overflow: 'hidden',
    }}>
      <button onClick={() => setExpanded(e => !e)} style={{
        width: '100%', padding: theme.spacing.md, background: 'none', border: 'none',
        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${tierColor}20`,
            border: `1px solid ${tierColor}50`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: theme.fontSize.md, fontFamily: theme.fonts.mono,
            fontWeight: 700, color: tierColor, flexShrink: 0 }}>
            {lead.score}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {nameContent}
              {lead.likelyArchetype && <ArchetypeBadge archetype={lead.likelyArchetype} size="xs" />}
            </div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
              {visitCount} visits · ${totalSpendValue.toLocaleString()} total spend
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <span style={{ fontSize: theme.fontSize.xs, color: tierColor, fontWeight: 600 }}>
            {TIER_LABELS[lead.tier]}
          </span>
          <span style={{ color: theme.colors.textMuted }}>{expanded ? '▾' : '▸'}</span>
        </div>
      </button>

      {expanded && (
        <div style={{ padding: `0 ${theme.spacing.md} ${theme.spacing.md}`,
          borderTop: `1px solid ${theme.colors.border}` }}>
          <div className="grid-responsive-4" style={{ margin: `${theme.spacing.md} 0` }}>
            {[
              { label: 'Rounds', value: lead.rounds },
              { label: 'Dining Visits', value: lead.dining },
              { label: 'Events', value: lead.events },
              { label: 'Potential Dues', value: `$${(lead.potentialDues / 1000).toFixed(0)}K/yr` },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: theme.spacing.sm, background: theme.colors.bg,
                borderRadius: theme.radius.sm, textAlign: 'center' }}>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{label}</div>
                <div style={{ fontSize: theme.fontSize.md, fontFamily: theme.fonts.mono,
                  fontWeight: 700, color: theme.colors.textPrimary }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: theme.spacing.md,
            fontSize: theme.fontSize.xs,
            color: theme.colors.textMuted,
          }}>
            <span>
              Sponsor: <span style={{ color: theme.colors.textSecondary }}>{lead.sponsorName || lead.sponsor || 'Unknown sponsor'}</span>
            </span>
            <span>
              Last visit: <span style={{ color: theme.colors.textSecondary }}>{formatDate(lead.lastVisit)}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
