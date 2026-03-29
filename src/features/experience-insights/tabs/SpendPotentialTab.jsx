import { theme } from '@/config/theme';
import { SoWhatCallout } from '@/components/ui';
import { useApp } from '@/context/AppContext';
import { trackAction } from '@/services/activityService';
import { archetypeSpendGaps } from '@/services/experienceInsightsService';

export default function SpendPotentialTab({ archetype }) {
  const { showToast, addAction } = useApp();
  const filtered = archetype ? archetypeSpendGaps.filter((a) => a.archetype === archetype) : archetypeSpendGaps;
  const totalUntapped = filtered.reduce((sum, a) => sum + a.totalUntapped, 0);
  const totalMembers = filtered.reduce((sum, a) => sum + a.count, 0);
  const sorted = [...filtered].sort((a, b) => b.totalUntapped - a.totalUntapped);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* KPI strip */}
      <div className="grid-responsive-4">
        {[
          { label: 'Total Untapped Revenue', value: '$' + (totalUntapped / 1000).toFixed(0) + 'K/yr', color: theme.colors.success },
          { label: 'Members with Gaps', value: totalMembers, color: theme.colors.textPrimary },
          { label: 'Avg Untapped / Member', value: '$' + Math.round(totalUntapped / totalMembers).toLocaleString(), color: theme.colors.accent },
          { label: 'Top Opportunity', value: sorted[0].archetype, color: theme.colors.warning },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: theme.colors.bgCard, borderRadius: theme.radius.md, border: '1px solid ' + theme.colors.border, padding: theme.spacing.md, textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: kpi.color, fontFamily: theme.fonts.mono }}>{kpi.value}</div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: '4px' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <SoWhatCallout>
        Your members have <strong>${(totalUntapped / 1000).toFixed(0)}K in untapped annual revenue</strong> across dining and events.
        Die-Hard Golfers are the biggest opportunity: 52 members spending 34% of their dining potential.
        A simple post-round dining credit could unlock <strong>$6,864/year</strong> in new F&B revenue from this segment alone.
      </SoWhatCallout>

      {/* Archetype spend gap cards */}
      {sorted.map((arch) => {
        const diningPct = arch.currentDining;
        const eventsPct = arch.currentEvents;
        return (
          <div key={arch.archetype} style={{ background: theme.colors.bgCard, borderRadius: theme.radius.md, border: '1px solid ' + theme.colors.border, padding: theme.spacing.lg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.md }}>
              <div>
                <h3 style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary, margin: 0 }}>
                  {arch.archetype}
                </h3>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: '2px' }}>
                  {arch.count} members &middot; ${arch.avgAnnualSpend.toLocaleString()}/yr avg spend
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: theme.colors.success, fontFamily: theme.fonts.mono }}>
                  +${arch.totalUntapped.toLocaleString()}
                </div>
                <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>untapped annual revenue</div>
              </div>
            </div>

            {/* Engagement bars */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
              {[
                { label: 'Dining Engagement', pct: diningPct, untapped: arch.untappedDining, color: theme.colors.warning },
                { label: 'Events Engagement', pct: eventsPct, untapped: arch.untappedEvents, color: theme.colors.accent },
              ].map((bar) => (
                <div key={bar.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: '4px' }}>
                    <span>{bar.label}</span>
                    <span style={{ fontFamily: theme.fonts.mono, fontWeight: 600 }}>{bar.pct}%</span>
                  </div>
                  <div style={{ height: 8, background: theme.colors.border + '40', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: bar.pct + '%', background: bar.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ fontSize: '10px', color: theme.colors.success, fontWeight: 600, marginTop: '2px' }}>
                    +${bar.untapped.toLocaleString()}/yr untapped
                  </div>
                </div>
              ))}
            </div>

            {/* Campaign recommendation with Launch button */}
            <div style={{
              padding: theme.spacing.sm + ' ' + theme.spacing.md,
              background: theme.colors.success + '08',
              border: '1px solid ' + theme.colors.success + '20',
              borderRadius: theme.radius.sm,
              fontSize: theme.fontSize.xs,
              color: theme.colors.textSecondary,
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}>
              <div>
                <strong style={{ color: theme.colors.success }}>Campaign:</strong> {arch.campaign}
              </div>
              <button
                onClick={() => { showToast(`Campaign launched for ${arch.count} ${arch.archetype} members`, 'success'); trackAction({ actionType: 'campaign', actionSubtype: 'launch', description: arch.campaign, meta: { archetype: arch.archetype, count: arch.count, untapped: arch.totalUntapped } }); addAction({ description: `Campaign: ${arch.campaign} — ${arch.count} ${arch.archetype} members`, actionType: 'REVENUE_CAPTURE', source: 'Revenue Analyst', priority: 'medium', impactMetric: `$${Math.round(arch.totalUntapped / 1000)}K untapped spend` }); }}
                style={{
                  padding: '6px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: '#e8772e',
                  color: 'white',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >Add to Actions</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
