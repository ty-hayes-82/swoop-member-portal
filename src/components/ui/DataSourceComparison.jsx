import { theme } from '@/config/theme';

const rows = [
  { dataType: 'Tee time bookings', competitors: 'Rounds played, no-shows', swoop: 'Rounds + GPS pace tracking + post-round behavior' },
  { dataType: 'Dining activity', competitors: 'Check totals, covers', swoop: 'Checks + wait times + turn-stand-to-table conversion' },
  { dataType: 'Member engagement', competitors: 'Last visit date, dues status', swoop: 'Multi-signal decay curve across 6+ touchpoints' },
  { dataType: 'Staffing coverage', competitors: 'Scheduled shifts', swoop: 'Demand-driven gaps + service quality correlation' },
  { dataType: 'On-course behavior', competitors: 'Not captured', swoop: 'GPS tracking: pace, 9-hole exits, practice range visits' },
  { dataType: 'Resignation risk', competitors: 'Manual review or none', swoop: 'AI health scores with 6-8 week early warning' },
];

export default function DataSourceComparison() {
  return (
    <div style={{
      background: theme.colors.bgCard,
      border: '1px solid ' + theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.lg,
      marginTop: theme.spacing.lg,
    }}>
      <div style={{ fontSize: '11px', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
        Data depth comparison
      </div>
      <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary, marginTop: '4px', marginBottom: theme.spacing.md }}>
        Same data source. Deeper intelligence.
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr style={{ background: theme.colors.bgDeep }}>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.textPrimary, borderBottom: '1px solid ' + theme.colors.border }}>Data Type</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.textMuted, borderBottom: '1px solid ' + theme.colors.border }}>Single-System View</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.accent, borderBottom: '1px solid ' + theme.colors.border }}>Swoop Intelligence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td style={{ padding: '10px 12px', fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary, borderBottom: '1px solid ' + theme.colors.borderLight }}>{row.dataType}</td>
                <td style={{ padding: '10px 12px', fontSize: theme.fontSize.sm, color: theme.colors.textMuted, borderBottom: '1px solid ' + theme.colors.borderLight }}>{row.competitors}</td>
                <td style={{ padding: '10px 12px', fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, fontWeight: 500, borderBottom: '1px solid ' + theme.colors.borderLight }}>{row.swoop}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
