import { theme } from '@/config/theme';

const mono = "'JetBrains Mono', monospace";

export default function ProShopTab() {
  const crossSellSignals = [
    { text: 'Die-Hard Golfers who take lessons spend $840/yr in pro shop vs $180 for non-lesson takers', icon: '\uD83C\uDFAF' },
    { text: 'Post-lesson equipment purchases happen within 72 hours 68% of the time', icon: '\u23F1\uFE0F' },
    { text: 'Members who use fitting services renew at 96% vs 82% baseline', icon: '\uD83D\uDD12' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      {/* Pro Shop Revenue Opportunity */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: theme.spacing.md }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: theme.radius.sm,
            background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,163,74,0.08))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', border: '1px solid rgba(34,197,94,0.15)',
          }}>{'\uD83D\uDECD\uFE0F'}</div>
          <div>
            <h4 style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary, margin: 0 }}>Pro Shop Revenue Opportunity</h4>
            <p style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, margin: 0 }}>Benchmarked against top 25% private clubs</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.sm }}>
          <div style={{ background: '#f8fafc', borderRadius: theme.radius.sm, padding: theme.spacing.md, textAlign: 'center' }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Current / Member</div>
            <div style={{ fontFamily: mono, fontSize: theme.fontSize.xl, fontWeight: 700, color: theme.colors.textPrimary }}>$280<span style={{ fontSize: theme.fontSize.xs, fontWeight: 400 }}>/yr</span></div>
          </div>
          <div style={{ background: '#f0fdf4', borderRadius: theme.radius.sm, padding: theme.spacing.md, textAlign: 'center' }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Benchmark (Top 25%)</div>
            <div style={{ fontFamily: mono, fontSize: theme.fontSize.xl, fontWeight: 700, color: theme.colors.success }}>$520<span style={{ fontSize: theme.fontSize.xs, fontWeight: 400 }}>/yr</span></div>
          </div>
          <div style={{ background: 'rgba(249,115,22,0.06)', borderRadius: theme.radius.sm, padding: theme.spacing.md, textAlign: 'center' }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Annual Gap</div>
            <div style={{ fontFamily: mono, fontSize: theme.fontSize.xl, fontWeight: 700, color: 'rgb(249,115,22)' }}>$72,000</div>
            <div style={{ fontSize: '11px', color: theme.colors.textSecondary }}>$240/member x 300 members</div>
          </div>
        </div>
      </div>

      {/* Lesson Revenue */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: theme.spacing.md }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: theme.radius.sm,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(37,99,235,0.08))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', border: '1px solid rgba(59,130,246,0.15)',
          }}>{'\uD83C\uDFCC\uFE0F'}</div>
          <div>
            <h4 style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary, margin: 0 }}>Lesson Revenue</h4>
            <p style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, margin: 0 }}>Lesson-takers drive outsized pro shop spend</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
          <div style={{ background: '#f8fafc', borderRadius: theme.radius.sm, padding: theme.spacing.md, textAlign: 'center' }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Taking Lessons</div>
            <div style={{ fontFamily: mono, fontSize: theme.fontSize.xl, fontWeight: 700, color: theme.colors.textPrimary }}>18%</div>
            <div style={{ fontSize: '11px', color: theme.colors.textSecondary }}>54 of 300 members</div>
          </div>
          <div style={{ background: '#eff6ff', borderRadius: theme.radius.sm, padding: theme.spacing.md, textAlign: 'center' }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Spend Multiplier</div>
            <div style={{ fontFamily: mono, fontSize: theme.fontSize.xl, fontWeight: 700, color: 'rgb(59,130,246)' }}>2.4x</div>
            <div style={{ fontSize: '11px', color: theme.colors.textSecondary }}>more on equipment</div>
          </div>
          <div style={{ background: 'rgba(34,197,94,0.06)', borderRadius: theme.radius.sm, padding: theme.spacing.md, textAlign: 'center' }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Conversion Opportunity</div>
            <div style={{ fontFamily: mono, fontSize: theme.fontSize.xl, fontWeight: 700, color: theme.colors.success }}>$45,000</div>
            <div style={{ fontSize: '11px', color: theme.colors.textSecondary }}>Convert 30 more members</div>
          </div>
        </div>

        {/* Progress bar showing lesson adoption */}
        <div style={{ marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.textSecondary }}>Lesson Adoption Rate</span>
            <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: mono, color: theme.colors.textPrimary }}>54 / 300 members (18%)</span>
          </div>
          <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: '18%', height: '100%', background: 'linear-gradient(90deg, rgb(59,130,246), rgb(37,99,235))', borderRadius: '4px' }} />
          </div>
        </div>
      </div>

      {/* Cross-Sell Signals */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
      }}>
        <h4 style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: theme.spacing.md, marginTop: 0 }}>Cross-Sell Signals</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {crossSellSignals.map((signal, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              padding: '14px 16px', borderRadius: theme.radius.sm,
              background: i === 0 ? 'rgba(34,197,94,0.04)' : i === 1 ? 'rgba(59,130,246,0.04)' : 'rgba(139,92,246,0.04)',
              border: `1px solid ${i === 0 ? 'rgba(34,197,94,0.12)' : i === 1 ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)'}`,
            }}>
              <span style={{ fontSize: '20px', flexShrink: 0, lineHeight: 1.3 }}>{signal.icon}</span>
              <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, lineHeight: 1.6, fontWeight: 500 }}>{signal.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
