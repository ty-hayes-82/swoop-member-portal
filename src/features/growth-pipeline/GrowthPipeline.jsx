import { Fragment, useMemo, useState } from 'react';
import { Panel, SoWhatCallout, StoryHeadline } from '@/components/ui';
import EvidenceStrip from '@/components/ui/EvidenceStrip';
import { getWarmLeads, getPipelineSummary, getConversionInsights, sourceSystems } from '@/services/pipelineService';
import { theme } from '@/config/theme';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const TIER_META = {
  hot: {
    label: 'Hot',
    badge: '#7f1d1d',
    color: theme.colors.urgent,
    border: `${theme.colors.urgent}40`,
    scoreBg: `${theme.colors.urgent}20`,
  },
  warm: {
    label: 'Warm',
    badge: '#7c2d12',
    color: theme.colors.warning,
    border: `${theme.colors.warning}40`,
    scoreBg: `${theme.colors.warning}20`,
  },
  cold: {
    label: 'Cold',
    badge: '#1f2937',
    color: theme.colors.textMuted,
    border: `${theme.colors.border}`,
    scoreBg: `${theme.colors.bg}`,
  },
};

const formatCurrency = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? currencyFormatter.format(numeric) : '—';
};

const formatCurrencyK = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '—';
  return `$${Math.round(numeric / 1000)}K/yr`;
};

const formatDays = (value) => {
  if (!Number.isFinite(value) || value <= 0) return '<1 day';
  return `${Math.round(value)} days`;
};

const formatDate = (value) => {
  if (!value) return '—';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const getDisplayName = (lead, index) =>
  lead.guestName || lead.name || lead.prospectName || lead.memberId || lead.id || `Prospect ${index + 1}`;

export default function GrowthPipeline() {
  const leads = getWarmLeads();
  const summary = getPipelineSummary();
  const conversionInsights = getConversionInsights();
  const [showAll, setShowAll] = useState(false);

  const groupedRows = useMemo(() => {
    const sorted = [...leads].sort((a, b) => toNumber(b.score) - toNumber(a.score));
    const groups = {
      hot: sorted.filter((lead) => lead.tier === 'hot'),
      warm: sorted.filter((lead) => lead.tier === 'warm'),
      cold: sorted.filter((lead) => lead.tier === 'cold'),
    };

    return {
      hot: showAll ? groups.hot : groups.hot.slice(0, 10),
      warm: showAll ? groups.warm : groups.warm.slice(0, 10),
      cold: showAll ? groups.cold : [],
      totals: {
        hot: groups.hot.length,
        warm: groups.warm.length,
        cold: groups.cold.length,
      },
    };
  }, [leads, showAll]);

  const stats = [
    { key: 'hot', label: 'Hot prospects', value: summary.hot },
    { key: 'warm', label: 'Warm prospects', value: summary.warm },
    { key: 'cold', label: 'Cold prospects', value: summary.cold },
  ];

  const conversionCards = [
    {
      label: 'Invites ready this week',
      value: conversionInsights.readyInvites,
      context: 'Hot leads ≥ 70% conversion probability',
    },
    {
      label: 'Average days since last visit (hot)',
      value: formatDays(conversionInsights.avgDaysSinceVisit),
      context: 'Freshness of your highest-value guests',
    },
    {
      label: 'Dormant hot leads',
      value: conversionInsights.dormantHotLeads,
      context: 'Have not been seen in 3+ weeks — nudge sponsors',
    },
    {
      label: 'Unique sponsors engaged',
      value: conversionInsights.uniqueSponsors,
      context: 'Members actively inviting prospects YTD',
    },
    {
      label: 'Average conversion score',
      value: `${conversionInsights.avgScore}%`,
      context: 'All tracked prospects',
    },
  ];

  const duesTierHighlights = ['premium', 'high', 'core', 'starter'].map((key) => {
    const bucket = summary?.tierBreakdown?.[key];
    const label = bucket?.label ?? (key === 'premium'
      ? '$36K Premium'
      : key === 'high'
        ? '$24K High'
        : key === 'core'
          ? '$18K Core'
          : '$12K Starter');
    return {
      key,
      label,
      count: bucket?.count ?? 0,
      revenue: bucket?.revenue ?? 0,
    };
  });

  const rowsByTier = [
    { key: 'hot', rows: groupedRows.hot },
    { key: 'warm', rows: groupedRows.warm },
    { key: 'cold', rows: groupedRows.cold },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <StoryHeadline
        variant="opportunity"
        headline="Your guest list is carrying four dues tiers worth $180K+."
        context="David Chen has played 8 times and spent $1,240. He's a $36K premium-tier prospect. Line him up with Sarah Mitchell ($36K) and Lisa Yamamoto ($24K high-tier) and you have $96K in dues before spring."
      />
      <EvidenceStrip signals={[
        { source: 'CRM', detail: 'Guest visit frequency and sponsor history' },
        { source: 'POS', detail: 'Guest spend per visit' },
        { source: 'Events', detail: 'Event attendance and engagement' },
      ]} />

      <Panel
        title="Growth Pipeline"
        subtitle="Which guests are ready to become members?"
        accentColor={theme.colors.accent}
        sourceSystems={sourceSystems}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
          <div className="grid-responsive-3">
            {stats.map((stat) => {
              const meta = TIER_META[stat.key];
              return (
                <div
                  key={stat.key}
                  style={{
                    background: theme.colors.bgCardHover,
                    borderRadius: theme.radius.md,
                    border: `1px solid ${meta.border}`,
                    padding: theme.spacing.md,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: theme.fontSize.xxl,
                      fontFamily: theme.fonts.mono,
                      fontWeight: 700,
                      color: meta.color,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.textMuted,
                      textTransform: 'capitalize',
                      marginTop: 2,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: theme.spacing.md,
              padding: theme.spacing.md,
              background: theme.colors.bgCardHover,
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            {[
              { label: 'Total Prospects', value: summary.totalGuests },
              { label: 'Hot Revenue Potential', value: formatCurrencyK(summary.hotRevenuePotential) },
              { label: 'Total Revenue Potential', value: formatCurrencyK(summary.totalRevenuePotential) },
              { label: 'Avg Spend (3+ visits)', value: formatCurrency(summary.avgFrequentGuestSpend) },
            ].map(({ label, value }) => (
              <div key={label} style={{ flex: '1 1 160px' }}>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{label}</div>
                <div
                  style={{
                    fontSize: theme.fontSize.xl,
                    fontFamily: theme.fonts.mono,
                    fontWeight: 700,
                    color: theme.colors.textPrimary,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div className="grid-responsive-4">
            {duesTierHighlights.map((tier) => (
              <div
                key={tier.key}
                style={{
                  background: theme.colors.bgCard,
                  borderRadius: theme.radius.md,
                  border: `1px solid ${theme.colors.border}`,
                  padding: theme.spacing.md,
                }}
              >
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{tier.label}</div>
                <div style={{ fontSize: theme.fontSize.lg, fontFamily: theme.fonts.mono, fontWeight: 700 }}>
                  {tier.count}
                  <span style={{ fontSize: theme.fontSize.xs, marginLeft: 6, color: theme.colors.textMuted }}>prospects</span>
                </div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 4 }}>
                  {formatCurrencyK(tier.revenue)} potential dues
                </div>
              </div>
            ))}
          </div>

          <div className="grid-responsive-3">
            {conversionCards.map((card) => (
              <div
                key={card.label}
                style={{
                  background: theme.colors.bgCardHover,
                  borderRadius: theme.radius.md,
                  border: `1px solid ${theme.colors.border}`,
                  padding: theme.spacing.md,
                }}
              >
                <div
                  style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textMuted,
                    marginBottom: theme.spacing.xs,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {card.label}
                </div>
                <div
                  style={{
                    fontSize: theme.fontSize.xl,
                    fontFamily: theme.fonts.mono,
                    fontWeight: 700,
                    color: theme.colors.textPrimary,
                  }}
                >
                  {card.value}
                </div>
                <p style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 6 }}>
                  {card.context}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              background: theme.colors.bgDeep,
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.border}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: theme.spacing.md,
                borderBottom: `1px solid ${theme.colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: theme.spacing.md,
              }}
            >
              <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>
                Prospect Conversion Queue
              </span>
              <button
                onClick={() => setShowAll((prev) => !prev)}
                style={{
                  background: 'none',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm,
                  color: theme.colors.textSecondary,
                  padding: `6px 10px`,
                  cursor: 'pointer',
                  fontSize: theme.fontSize.xs,
                  fontWeight: 600,
                }}
              >
                {showAll ? 'Collapse' : 'Show all'}
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 860, borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
                <thead>
                  <tr style={{ background: theme.colors.bg }}>
                    {['Prospect', 'Sponsor', 'Visits', 'Total Spend', 'Last Visit', 'Potential Dues', 'Score'].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                          textAlign: 'left',
                          color: theme.colors.textMuted,
                          fontSize: theme.fontSize.xs,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          fontWeight: 500,
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowsByTier.map(({ key, rows }) => {
                    if (!rows.length) return null;
                    const meta = TIER_META[key];
                    return (
                      <Fragment key={`${key}-group`}>
                        <tr key={`${key}-header`} style={{ background: `${meta.color}12` }}>
                          <td colSpan={7} style={{ padding: `${theme.spacing.xs} ${theme.spacing.md}` }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: theme.fontSize.xs,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                fontWeight: 700,
                                color: meta.color,
                              }}
                            >
                              {meta.label} ({groupedRows.totals[key]})
                            </span>
                          </td>
                        </tr>
                        {rows.map((lead, index) => (
                          <tr key={`${key}-${getDisplayName(lead, index)}`} style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                            <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, fontWeight: 600, color: theme.colors.textPrimary }}>
                              {getDisplayName(lead, index)}
                            </td>
                            <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, color: theme.colors.textSecondary }}>
                              {lead.sponsorName || lead.sponsor || 'Unknown'}
                            </td>
                            <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>{toNumber(lead.visitCount ?? lead.visits, 0)}</td>
                            <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>{formatCurrency(lead.totalSpend)}</td>
                            <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>{formatDate(lead.lastVisit)}</td>
                            <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>{formatCurrency(lead.potentialDues)}</td>
                            <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  minWidth: 40,
                                  textAlign: 'center',
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  background: meta.scoreBg,
                                  border: `1px solid ${meta.border}`,
                                  color: meta.color,
                                  fontWeight: 700,
                                  fontFamily: theme.fonts.mono,
                                }}
                              >
                                {toNumber(lead.score, 0)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <SoWhatCallout variant="opportunity">
            Top-converting hot prospects represent <strong>{formatCurrencyK(summary.hotRevenuePotential)}</strong> in annual dues potential,
            and frequent guests average <strong>{formatCurrency(summary.avgFrequentGuestSpend)}</strong> in tracked spend.
          </SoWhatCallout>
        </div>
      </Panel>
    </div>
  );
}
