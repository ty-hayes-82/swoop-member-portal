import { theme } from '@/config/theme';

const interventions = [
  {
    date: 'Mar 8',
    action: 'Recovery outreach sent to Sarah Mitchell via Swoop app',
    outcome: 'Response received Mar 9',
    impact: 'Health score 38 → 52',
    status: 'resolved',
  },
  {
    date: 'Mar 6',
    action: 'Staffing gap alert — added server to Grill Room Friday shift',
    outcome: 'Average check held at $47 (vs $28 prior understaffed Friday)',
    impact: '$3,400 revenue protected',
    status: 'resolved',
  },
  {
    date: 'Mar 4',
    action: 'Cancellation risk — proactive rebooking for 3 members',
    outcome: '2 of 3 rebooked within 24 hours',
    impact: '2 tee times filled, $624 in green fees',
    status: 'partial',
  },
];

const statusColor = {
  resolved: theme.colors.success,
  partial: theme.colors.warning,
  pending: theme.colors.textMuted,
};

export default function RecentInterventions() {
  return (
    <div style={{
      background: theme.colors.bgCard,
      border: "1px solid " + theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.lg,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.md }}>
        <div>
          <div style={{ fontSize: "11px", color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            Prove It
          </div>
          <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary }}>
            Recent Interventions
          </div>
        </div>
        <div style={{
          fontSize: "11px",
          fontWeight: 700,
          color: theme.colors.success,
          background: theme.colors.success + "14",
          padding: "4px 10px",
          borderRadius: "999px",
        }}>
          3 actions this week
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.sm }}>
        {interventions.map((item, i) => (
          <div key={i} style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
            padding: "10px 12px",
            background: theme.colors.bgDeep,
            borderRadius: theme.radius.sm,
            borderLeft: "3px solid " + statusColor[item.status],
          }}>
            <div style={{ fontSize: "11px", fontFamily: theme.fonts.mono, color: theme.colors.textMuted, flexShrink: 0, minWidth: "42px", paddingTop: "2px" }}>
              {item.date}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary, lineHeight: 1.4 }}>
                {item.action}
              </div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: "2px" }}>
                {item.outcome}
              </div>
              <div style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: statusColor[item.status], marginTop: "4px" }}>
                {item.impact}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
