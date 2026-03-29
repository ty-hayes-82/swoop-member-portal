import { theme } from '@/config/theme';
import { useNavigation } from '@/context/NavigationContext';
import { paceFBImpact } from '@/data/pace';
import { understaffedDays } from '@/data/staffing';
import { archetypeSpendGaps } from '@/services/experienceInsightsService';
import { getMemberSummary } from '@/services/memberService';

const PACE_LOSS = paceFBImpact.revenueLostPerMonth;
const STAFFING_LOSS = understaffedDays.reduce((sum, day) => sum + day.revenueLoss, 0);
const WEATHER_LOSS = 420;
const PROSHOP_LOSS = Math.round((72000 + 45000) / 12);
const TOTAL_LEAKAGE = PACE_LOSS + STAFFING_LOSS + WEATHER_LOSS + PROSHOP_LOSS;

export default function RevenueSummaryCard() {
  const { navigate } = useNavigation();

  const spendTotal = archetypeSpendGaps.reduce((s, a) => s + a.totalUntapped, 0);
  const spendMonthly = Math.round(spendTotal / 12);
  const memberSummary = getMemberSummary();
  const duesAtRisk = memberSummary.potentialDuesAtRisk || 533000;
  const duesMonthly = Math.round(duesAtRisk / 12);
  const totalOpportunity = TOTAL_LEAKAGE + spendMonthly + duesMonthly;

  // Top action — pace of play is typically the biggest lever
  const topAction = {
    label: 'Deploy rangers to holes 4, 8, 12, 16 on weekends',
    impact: `+$${PACE_LOSS.toLocaleString()}/mo`,
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.sm,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: theme.colors.operations,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          Revenue Snapshot
        </div>
      </div>

      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.sm,
      }}>
        {/* Total opportunity — summary only */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Total addressable opportunity</div>
            <div style={{
              fontSize: 24, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
              color: theme.colors.textPrimary,
            }}>
              ${totalOpportunity.toLocaleString()}<span style={{ fontSize: 14, color: theme.colors.textMuted }}>/mo</span>
            </div>
          </div>
          <div style={{
            fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textAlign: 'right',
          }}>
            ${(totalOpportunity * 12).toLocaleString()}/yr
          </div>
        </div>

        {/* Top action */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 10px',
          background: `${theme.colors.success}06`,
          border: `1px solid ${theme.colors.success}20`,
          borderRadius: theme.radius.sm,
          gap: 8,
        }}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
            Top action: <span style={{ color: theme.colors.textPrimary, fontWeight: 600 }}>{topAction.label}</span>
          </div>
        </div>

        {/* Explore CTA */}
        <button
          onClick={() => navigate('revenue')}
          style={{
            padding: '8px 16px',
            fontSize: theme.fontSize.xs,
            fontWeight: 700,
            color: theme.colors.accent,
            background: `${theme.colors.accent}08`,
            border: `1px solid ${theme.colors.accent}30`,
            borderRadius: theme.radius.md,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          Explore full breakdown in Revenue →
        </button>
      </div>
    </div>
  );
}
