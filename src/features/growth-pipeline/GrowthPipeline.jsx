import { Panel, SoWhatCallout, StoryHeadline } from '@/components/ui';
import LeadCard from './LeadCard';
import { getWarmLeads, getPipelineSummary, getConversionInsights, sourceSystems } from '@/services/pipelineService';
import { theme } from '@/config/theme';

const formatCurrencyK = (value) => `$${Math.round(value / 1000)}K/yr`;

const formatDays = (value) => {
  if (!Number.isFinite(value) || value <= 0) return '<1 day';
  return `${Math.round(value)} days`;
};

export default function GrowthPipeline() {
  const leads = getWarmLeads();
  const summary = getPipelineSummary();
  const conversionInsights = getConversionInsights();

  const tiers = [
    { key: 'hot',  color: theme.colors.urgent  },
    { key: 'warm', color: theme.colors.warning },
    { key: 'cool', color: theme.colors.textPrimary },
    { key: 'cold', color: theme.colors.textMuted },
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
      context: 'Havent been seen in 3+ weeks — nudge sponsors',
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <StoryHeadline
        variant="opportunity"
        headline="$36,000/year in membership revenue is hiding in your guest data right now."
        context="David Chen has played 8 times and spent $1,240. He's 92% likely to join if asked. Two hot leads like him represent $36K in annual dues — plus $6–10K in ancillary spend each year."
      />
      <Panel
        title="Growth Pipeline"
        subtitle="Which guests are ready to become members?"
        accentColor={theme.colors.accent}
        sourceSystems={sourceSystems}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
          {/* Pipeline funnel */}
          <div className="grid-responsive-4">
            {tiers.map((tier) => (
              <div
                key={tier.key}
                style={{
                  background: theme.colors.bgCardHover,
                  borderRadius: theme.radius.md,
                  border: `1px solid ${tier.color}40`,
                  padding: theme.spacing.md,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: theme.fontSize.xxl,
                    fontFamily: theme.fonts.mono,
                    fontWeight: 700,
                    color: tier.color,
                  }}
                >
                  {summary[tier.key]}
                </div>
                <div
                  style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textMuted,
                    textTransform: 'capitalize',
                    marginTop: 2,
                  }}
                >
                  {tier.key} prospects
                </div>
              </div>
            ))}
          </div>

          {/* Revenue snapshot */}
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

          {/* Conversion guardrails */}
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

          {/* Lead cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            {leads.map((lead, index) => {
              const key =
                lead.guestName || lead.name || lead.prospectName || lead.memberId || lead.id || `prospect-${index}`;
              return <LeadCard key={key} lead={lead} />;
            })}
          </div>

          <SoWhatCallout variant="opportunity">
            David Chen has a <strong>92% conversion probability</strong> — 8 visits, $1,240 spent, strong sponsor
            connection. That's a potential <strong>$18,000/year</strong> membership waiting for a personal invitation.
          </SoWhatCallout>
        </div>
      </Panel>
    </div>
  );
}
