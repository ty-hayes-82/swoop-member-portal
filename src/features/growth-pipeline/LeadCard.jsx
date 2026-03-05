import { useState } from 'react';
import { theme } from '@/config/theme';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge.jsx';

const TIER_COLORS = {
  hot:  theme.colors.urgent,
  warm: theme.colors.warning,
  cool: theme.colors.textMuted,
  cold: theme.colors.textMuted,
};

const TIER_LABELS = { hot: '🔥 Hot', warm: '♨ Warm', cool: '💧 Cool', cold: '❄ Cold' };

export default function LeadCard({ lead }) {
  const [expanded, setExpanded] = useState(false);
  const tierColor = TIER_COLORS[lead.tier];

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
              <span style={{ fontSize: theme.fontSize.md, fontWeight: 600, color: theme.colors.textPrimary }}>
                {lead.guestName}
              </span>
              {lead.likelyArchetype && <ArchetypeBadge archetype={lead.likelyArchetype} size="xs" />}
            </div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
              {lead.visits} visits · ${lead.totalSpend.toLocaleString()} total spend
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: theme.spacing.sm, margin: `${theme.spacing.md} 0` }}>
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
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
            Sponsor: <span style={{ color: theme.colors.textSecondary }}>{lead.sponsor}</span>
          </div>
        </div>
      )}
    </div>
  );
}
