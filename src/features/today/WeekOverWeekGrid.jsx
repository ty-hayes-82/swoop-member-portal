import { theme } from '@/config/theme';
import { useNavigation } from '@/context/NavigationContext';

const METRICS = [
  { label: 'Revenue', current: '$12,400', prior: '$11,200', delta: '+10.7%', positive: true, context: 'Driven by weekend dining surge and pro shop upsells.', link: 'revenue' },
  { label: 'Rounds Played', current: '284', prior: '268', delta: '+6.0%', positive: true, context: 'Weather held — 3 more playable days than prior week.' },
  { label: 'Complaints Filed', current: '5', prior: '2', delta: '+150%', positive: false, context: '3 of 5 related to Friday understaffing — already addressed.', link: 'revenue' },
  { label: 'At-Risk Members', current: '26', prior: '31', delta: '-16.1%', positive: true, context: '5 members recovered via GM calls and comp offers.', link: 'member-health' },
  { label: 'F&B Revenue', current: '$8,900', prior: '$7,800', delta: '+14.1%', positive: true, context: 'Post-round dining campaign showing early results.' },
  { label: 'Avg Response Time', current: '4.2 hrs', prior: '5.8 hrs', delta: '-27.6%', positive: true, context: 'Service Recovery agent now auto-escalating within 2 hrs.' },
];

export default function WeekOverWeekGrid() {
  const { navigate } = useNavigation();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: theme.spacing.md }}>
      {METRICS.map(({ label, current, prior, delta, positive, context, link }) => (
        <div
          key={label}
          onClick={link ? () => navigate(link) : undefined}
          style={{
            background: theme.colors.bgCard,
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.border}`,
            padding: theme.spacing.md,
            cursor: link ? 'pointer' : 'default',
          }}
        >
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</div>
          <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary, fontFamily: theme.fonts.mono }}>{current}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Prior: {prior}</span>
            <span style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: positive ? theme.colors.success : theme.colors.urgent }}>{delta}</span>
          </div>
          <div style={{ fontSize: '11px', color: theme.colors.textSecondary, marginTop: '6px', lineHeight: 1.4 }}>
            {context}
            {link && <span style={{ color: theme.colors.accent, fontWeight: 600 }}> Tap to investigate →</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
