// TodaysRisks — operational risk cards for the morning cockpit
import { theme } from '@/config/theme';
import { understaffedDays, feedbackRecords } from '@/data/staffing';
import { getDailyBriefing } from '@/services/briefingService';
import { useNavigation } from '@/context/NavigationContext';

export default function TodaysRisks() {
  const { navigate } = useNavigation();
  const briefing = getDailyBriefing();
  const unresolvedComplaints = feedbackRecords.filter(f => f.status !== 'resolved');
  const oldComplaints = unresolvedComplaints.filter(f => {
    const days = Math.round((new Date('2026-01-31') - new Date(f.date)) / (1000 * 60 * 60 * 24));
    return days > 7;
  });

  const risks = [
    {
      icon: '📋',
      title: "Tomorrow's Staffing",
      detail: 'Saturday: Grill Room needs 4 servers — 2 scheduled',
      sublabel: `Based on ${briefing?.teeSheet?.roundsToday || 220} rounds + event calendar`,
      severity: 'high',
      onClick: () => navigate('service', { tab: 'staffing' }),
    },
    {
      icon: '⚠️',
      title: 'Open Complaints',
      detail: `${unresolvedComplaints.length} unresolved complaint${unresolvedComplaints.length !== 1 ? 's' : ''}`,
      sublabel: oldComplaints.length > 0
        ? `${oldComplaints.length} older than 7 days — needs follow-up`
        : 'All within response window',
      severity: oldComplaints.length > 0 ? 'medium' : 'low',
      onClick: () => navigate('service', { tab: 'complaints' }),
    },
    {
      icon: '🏌️',
      title: 'Pace of Play',
      detail: `${understaffedDays.length} understaffed days this month`,
      sublabel: 'Understaffed days produce 2x complaint rate',
      severity: understaffedDays.length > 2 ? 'high' : 'medium',
      onClick: () => navigate('service', { tab: 'quality' }),
    },
  ];

  const severityColors = {
    high: theme.colors.risk,
    medium: '#ca8a04',
    low: theme.colors.success,
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: theme.spacing.md,
    }}>
      {risks.map((risk, idx) => {
        const borderColor = severityColors[risk.severity];
        return (
          <div
            key={idx}
            onClick={risk.onClick}
            style={{
              background: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              borderLeft: `3px solid ${borderColor}`,
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
              cursor: 'pointer',
              transition: 'box-shadow 0.15s, transform 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = theme.shadow.md; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{risk.icon}</span>
              <span style={{
                fontSize: theme.fontSize.xs, fontWeight: 700, color: borderColor,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {risk.title}
              </span>
            </div>
            <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
              {risk.detail}
            </div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.4 }}>
              {risk.sublabel}
            </div>
          </div>
        );
      })}
    </div>
  );
}
