// PipelineSnapshot.jsx — pipeline summary widget for Daily Briefing
// Taps through to Growth Pipeline full view
// Hard ceiling: 150 lines. Target: 80 lines.

import { theme } from '@/config/theme';
import { getPipelineSummary, getWarmLeads } from '@/services/pipelineService';

const TIER_COLORS = {
  hot:  theme.colors.accent,
  warm: theme.colors.warning,
  cool: theme.colors.textMuted,
  cold: theme.colors.textMuted,
};

export default function PipelineSnapshot({ onNavigate }) {
  const summary = getPipelineSummary();
  const leads   = getWarmLeads();
  const hotLeads = leads.filter(l => l.tier === 'hot').slice(0, 2);
  const totalPotential = summary.hotRevenuePotential;

  return (
    <div
      onClick={() => onNavigate?.('growth-pipeline')}
      style={{
        background:   `${theme.colors.accent}08`,
        border:       `1px solid ${theme.colors.accent}30`,
        borderRadius: theme.radius.md,
        padding:      theme.spacing.md,
        cursor:       'pointer',
        transition:   'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = `${theme.colors.accent}10`}
      onMouseLeave={e => e.currentTarget.style.background = `${theme.colors.accent}08`}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>◎</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: theme.colors.textPrimary,
            letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Growth Pipeline
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['hot', 'warm', 'cool', 'cold'].map(tier => (
            <span key={tier} style={{
              fontSize: '11px', fontWeight: 600,
              padding: '2px 7px', borderRadius: '4px',
              background: `${TIER_COLORS[tier]}18`,
              color: TIER_COLORS[tier],
              border: `1px solid ${TIER_COLORS[tier]}30`,
            }}>
              {summary[tier]} {tier}
            </span>
          ))}
        </div>
      </div>

      {/* Revenue potential highlight */}
      <div style={{ marginBottom: theme.spacing.sm, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xl,
          fontWeight: 700, color: theme.colors.textPrimary }}>
          ${totalPotential.toLocaleString()}
        </span>
        <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
          /yr potential from {summary.hot} hot lead{summary.hot !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Hot lead previews */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {hotLeads.map(lead => (
          <div key={lead.guestName} style={{ display: 'flex', alignItems: 'center', gap: '10px',
            padding: '6px 8px', background: `${theme.colors.accent}08`, borderRadius: theme.radius.sm }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: theme.colors.textPrimary, minWidth: '28px',
              textAlign: 'center', padding: '2px 4px', background: `${theme.colors.accent}12`,
              borderRadius: '3px' }}>
              {lead.score}%
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.textPrimary, flex: 1 }}>
              {lead.guestName}
            </span>
            <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>
              {lead.visits} visits · ${lead.totalSpend.toLocaleString()} spent
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: theme.colors.success }}>
              ${lead.potentialDues?.toLocaleString()}/yr
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '8px', textAlign: 'right' }}>
        <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textPrimary, fontWeight: 500, cursor: 'pointer' }}>
          View full pipeline →
        </span>
      </div>
    </div>
  );
}
