import { theme } from '@/config/theme';
import { Panel, SoWhatCallout, PlaybookActionCard } from '@/components/ui';
import { complaintLoyaltyStats } from '@/services/experienceInsightsService';

function StaffingComplaintHeatmap() {
  const shiftData = [
    { day: 'Mon', morning: { complaints: 1, understaffed: false }, lunch: { complaints: 2, understaffed: false }, evening: { complaints: 1, understaffed: false } },
    { day: 'Tue', morning: { complaints: 0, understaffed: false }, lunch: { complaints: 1, understaffed: false }, evening: { complaints: 2, understaffed: true } },
    { day: 'Wed', morning: { complaints: 1, understaffed: false }, lunch: { complaints: 3, understaffed: true }, evening: { complaints: 1, understaffed: false } },
    { day: 'Thu', morning: { complaints: 0, understaffed: false }, lunch: { complaints: 2, understaffed: false }, evening: { complaints: 2, understaffed: false } },
    { day: 'Fri', morning: { complaints: 2, understaffed: true }, lunch: { complaints: 5, understaffed: true }, evening: { complaints: 3, understaffed: true } },
    { day: 'Sat', morning: { complaints: 1, understaffed: false }, lunch: { complaints: 4, understaffed: true }, evening: { complaints: 2, understaffed: false } },
    { day: 'Sun', morning: { complaints: 0, understaffed: false }, lunch: { complaints: 2, understaffed: false }, evening: { complaints: 1, understaffed: false } },
  ];

  const shifts = ['morning', 'lunch', 'evening'];
  const shiftLabels = { morning: 'Morning', lunch: 'Lunch', evening: 'Evening' };

  const getCellColor = (count) => {
    if (count === 0) return theme.colors.success;
    if (count <= 2) return theme.colors.warning;
    if (count <= 4) return '#ea580c';
    return theme.colors.urgent;
  };

  const getCellBg = (count) => {
    if (count === 0) return theme.colors.success + '18';
    if (count <= 2) return theme.colors.warning + '22';
    if (count <= 4) return '#ea580c' + '28';
    return theme.colors.urgent + '30';
  };

  return (
    <Panel title="Staffing-Complaint Correlation" subtitle="How understaffing correlates with complaint spikes by day and shift">
      <div style={{ overflowX: 'auto' }}>
        {/* Heatmap grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '80px repeat(7, 1fr)',
          gap: '4px',
          marginBottom: theme.spacing.md,
        }}>
          {/* Header row */}
          <div />
          {shiftData.map((d) => (
            <div key={d.day} style={{
              textAlign: 'center',
              fontSize: theme.fontSize.xs,
              fontWeight: 700,
              color: theme.colors.textMuted,
              padding: '6px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {d.day}
            </div>
          ))}

          {/* Data rows */}
          {shifts.map((shift) => (
            <>
              <div key={shift + '-label'} style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: theme.fontSize.xs,
                fontWeight: 600,
                color: theme.colors.textSecondary,
                paddingRight: '8px',
              }}>
                {shiftLabels[shift]}
              </div>
              {shiftData.map((d) => {
                const cell = d[shift];
                return (
                  <div
                    key={d.day + '-' + shift}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '44px',
                      borderRadius: theme.radius.sm,
                      background: getCellBg(cell.complaints),
                      border: cell.understaffed
                        ? `2px solid ${theme.colors.urgent}`
                        : `1px solid ${theme.colors.border}`,
                      fontFamily: theme.fonts.mono,
                      fontSize: '14px',
                      fontWeight: 700,
                      color: getCellColor(cell.complaints),
                      position: 'relative',
                      cursor: 'default',
                    }}
                    title={`${d.day} ${shiftLabels[shift]}: ${cell.complaints} complaint${cell.complaints !== 1 ? 's' : ''}${cell.understaffed ? ' (understaffed)' : ''}`}
                  >
                    {cell.complaints}
                    {cell.understaffed && (
                      <span style={{
                        position: 'absolute',
                        top: '2px',
                        right: '4px',
                        fontSize: '8px',
                        color: theme.colors.urgent,
                        fontWeight: 700,
                      }}>
                        !
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: theme.spacing.md,
          padding: '8px 0',
          borderTop: `1px solid ${theme.colors.border}`,
          borderBottom: `1px solid ${theme.colors.border}`,
        }}>
          {[
            { label: '0 complaints', color: theme.colors.success, bg: theme.colors.success + '18' },
            { label: '1-2 complaints', color: theme.colors.warning, bg: theme.colors.warning + '22' },
            { label: '3-4 complaints', color: '#ea580c', bg: '#ea580c' + '28' },
            { label: '5+ complaints', color: theme.colors.urgent, bg: theme.colors.urgent + '30' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: 14,
                height: 14,
                borderRadius: '3px',
                background: item.bg,
                border: `1px solid ${item.color}40`,
              }} />
              <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>{item.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: 14,
              height: 14,
              borderRadius: '3px',
              background: 'transparent',
              border: `2px solid ${theme.colors.urgent}`,
            }} />
            <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>Understaffed shift</span>
          </div>
        </div>
      </div>

      {/* Key Insight callout */}
      <SoWhatCallout>
        <strong>Friday lunch is the #1 complaint hotspot</strong> — 5 complaints on understaffed shifts vs 1.2 avg on fully-staffed shifts.
        Adding one server on Fridays would reduce complaints 60% and protect <strong>$18K in at-risk dues</strong>.
      </SoWhatCallout>
    </Panel>
  );
}

export default function ComplaintsTab() {
  const stats = complaintLoyaltyStats;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* KPI strip */}
      <div className="grid-responsive-4">
        {[
          { label: 'Total Complaints (90d)', value: stats.totalComplaints, color: theme.colors.textPrimary },
          { label: 'Resolved <24hrs', value: stats.resolvedWithin24h, color: theme.colors.success },
          { label: 'Renewal (Resolved)', value: stats.renewalRateResolved + '%', color: theme.colors.success },
          { label: 'Renewal (Unresolved)', value: stats.renewalRateUnresolved + '%', color: theme.colors.urgent },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: theme.colors.bgCard,
              borderRadius: theme.radius.md,
              border: '1px solid ' + theme.colors.border,
              padding: theme.spacing.md,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: 700, color: kpi.color, fontFamily: theme.fonts.mono }}>{kpi.value}</div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: '4px' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <SoWhatCallout>
        Well-resolved complaints lead to <strong>89% renewal rates</strong> vs. 71% for unresolved.
        The difference isn't whether members complain &mdash; it's whether you respond fast enough.
        Every complaint is a retention opportunity.
      </SoWhatCallout>

      {/* Category breakdown */}
      <Panel title="By Category" subtitle="Complaint types, resolution rates, and retention impact">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
          <thead>
            <tr style={{ borderBottom: '1px solid ' + theme.colors.border }}>
              {['Category', 'Count', 'Resolved %', 'Retention Impact'].map((h) => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: theme.fontSize.xs, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.colors.textMuted, fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.topCategories.map((cat) => (
              <tr key={cat.category} style={{ borderBottom: '1px solid ' + theme.colors.border + '60' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: theme.colors.textPrimary }}>{cat.category}</td>
                <td style={{ padding: '8px 12px', fontFamily: theme.fonts.mono }}>{cat.count}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ color: cat.resolvedPct >= 80 ? theme.colors.success : theme.colors.warning, fontWeight: 600 }}>
                    {cat.resolvedPct}%
                  </span>
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ color: theme.colors.urgent, fontWeight: 600 }}>{cat.retentionImpact}%</span>
                  <span style={{ color: theme.colors.textMuted }}> renewal impact</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {/* Unresolved complaints action */}
      <PlaybookActionCard
        icon={'🚨'}
        label="UNRESOLVED COMPLAINTS"
        title="16 complaints unresolved — Review & Assign"
        description="Service Speed complaints have the highest retention impact (-12%). 5 are unresolved >24hrs."
        playbookName="Service Failure Rapid Response"
        impact="$24K/mo at risk"
        memberCount={16}
        buttonLabel="Review & Assign"
        buttonColor="#dc2626"
        variant="urgent"
      />

      {/* Staffing-Complaint Correlation Heatmap */}
      <StaffingComplaintHeatmap />
    </div>
  );
}
