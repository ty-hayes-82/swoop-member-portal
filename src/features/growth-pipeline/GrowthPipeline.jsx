import { Panel, SoWhatCallout, StoryHeadline } from '@/components/ui';
import LeadCard from './LeadCard';
import { getWarmLeads, getPipelineSummary, sourceSystems } from '@/services/pipelineService';
import { theme } from '@/config/theme';

export default function GrowthPipeline() {
  const leads = getWarmLeads();
  const summary = getPipelineSummary();

  const tiers = [
    { key: 'hot',  color: theme.colors.urgent  },
    { key: 'warm', color: theme.colors.warning },
    { key: 'cool', color: theme.colors.briefing },
    { key: 'cold', color: theme.colors.textMuted },
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
      accentColor={theme.colors.pipeline}
      sourceSystems={sourceSystems}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
        {/* Pipeline funnel KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: theme.spacing.md }}>
          {tiers.map(t => (
            <div key={t.key} style={{ background: theme.colors.bgCardHover, borderRadius: theme.radius.md,
              border: `1px solid ${t.color}40`, padding: theme.spacing.md, textAlign: 'center' }}>
              <div style={{ fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.mono,
                fontWeight: 700, color: t.color }}>{summary[t.key]}</div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
                textTransform: 'capitalize', marginTop: 2 }}>{t.key} prospects</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: theme.spacing.md, padding: theme.spacing.md,
          background: theme.colors.bgCardHover, borderRadius: theme.radius.md,
          border: `1px solid ${theme.colors.border}` }}>
          {[
            { label: 'Total Prospects', value: summary.totalGuests },
            { label: 'Hot Revenue Potential', value: `$${(summary.hotRevenuePotential / 1000).toFixed(0)}K/yr` },
            { label: 'Total Revenue Potential', value: `$${(summary.totalRevenuePotential / 1000).toFixed(0)}K/yr` },
          ].map(({ label, value }) => (
            <div key={label} style={{ flex: 1, borderRight: `1px solid ${theme.colors.border}`,
              paddingRight: theme.spacing.md, ':last-child': { borderRight: 'none' } }}>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{label}</div>
              <div style={{ fontSize: theme.fontSize.xl, fontFamily: theme.fonts.mono,
                fontWeight: 700, color: theme.colors.pipeline }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Lead cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {leads.map(l => <LeadCard key={l.guestName} lead={l} />)}
        </div>

        <SoWhatCallout variant="opportunity">
          David Chen has a <strong>92% conversion probability</strong> — 8 visits,
          $1,240 spent, strong sponsor connection. That's a potential <strong>$18,000/year</strong> membership
          waiting for a personal invitation.
        </SoWhatCallout>
      </div>
    </Panel>
    </div>
  );
}
