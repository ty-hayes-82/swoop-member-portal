import { LineChart, Line, ResponsiveContainer } from 'recharts';
import MemberLink from '@/components/MemberLink.jsx';
import { theme } from '@/config/theme';


const probabilityStyle = (probability) => {
  if (probability < 0.3) return { color: theme.colors.success, bg: `${theme.colors.success}12`, border: `${theme.colors.success}2E` };
  if (probability <= 0.6) return { color: theme.colors.warning, bg: `${theme.colors.warning}14`, border: `${theme.colors.warning}2E` };
  return { color: theme.colors.urgent, bg: `${theme.colors.urgent}14`, border: `${theme.colors.urgent}33` };
};

const formatCountdown = (daysUntilCancellation) => {
  if (typeof daysUntilCancellation !== 'number' || Number.isNaN(daysUntilCancellation)) return 'Unknown';
  if (daysUntilCancellation <= 0) return 'Today';
  return `${daysUntilCancellation}d`;
};

export default function CancellationRiskRow({
  memberId,
  memberName,
  cancelProbability,
  daysUntilCancellation,
  lastActivityDate,
  trend = [],
  actions,
}) {
  const risk = probabilityStyle(cancelProbability);
  const probabilityPct = Math.round((cancelProbability ?? 0) * 100);
  const chartData = trend.map((v, i) => ({ i, v }));

  return (
    <tr style={{ borderTop: `1px solid ${theme.colors.border}` }}>
      <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, fontSize: theme.fontSize.sm, fontWeight: 600 }}>
        <MemberLink memberId={memberId}>{memberName}</MemberLink>
      </td>
      <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
        <span style={{
          display: 'inline-block',
          minWidth: 56,
          textAlign: 'center',
          fontFamily: theme.fonts.mono,
          fontSize: theme.fontSize.xs,
          fontWeight: 700,
          color: risk.color,
          background: risk.bg,
          border: `1px solid ${risk.border}`,
          borderRadius: '999px',
          padding: '2px 8px',
        }}>
          {probabilityPct}%
        </span>
      </td>
      <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, color: theme.colors.textSecondary, fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs }}>
        {formatCountdown(daysUntilCancellation)}
      </td>
      <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>
        {lastActivityDate || 'Unknown'}
      </td>
      <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, width: 96, height: 36 }}>
        {chartData.length > 1 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 3, right: 2, bottom: 3, left: 2 }}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={risk.color}
                strokeWidth={1.6}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </td>
      {actions}
    </tr>
  );
}
