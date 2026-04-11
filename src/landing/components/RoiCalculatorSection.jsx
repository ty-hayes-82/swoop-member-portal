import { useState } from 'react';
import { theme } from '@/config/theme';

export default function RoiCalculatorSection() {
  const [members, setMembers] = useState(300);
  const [dues, setDues] = useState(8000);
  const [churn, setChurn] = useState(5);

  const atRisk = Math.round(members * (churn / 100));
  const annualLoss = atRisk * dues;
  const swoopSaves = Math.round(atRisk * 0.65);
  const recovered = swoopSaves * dues;
  const swoopProCost = 5988; // $499/mo × 12
  const netGain = recovered - swoopProCost;
  const roiMultiple = recovered > 0 ? Math.round(recovered / swoopProCost) : 0;

  return (
    <section
      className="landing-section-padded"
      style={{
        margin: `${theme.spacing.xxl} 0`,
        borderRadius: theme.radius.xl,
        background: theme.colors.bgSidebar,
        color: theme.colors.bgCard,
        padding: '54px 28px',
      }}
    >
      <h2 style={{ fontSize: 'clamp(30px, 4vw, 46px)', marginBottom: theme.spacing.md, textAlign: 'center' }}>
        What is member turnover costing your club?
      </h2>
      <p
        style={{
          color: `${theme.colors.bgCard}D9`,
          marginBottom: theme.spacing.xl,
          maxWidth: 780,
          fontSize: theme.fontSize.lg,
          textAlign: 'center',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        Adjust the sliders to see your club&apos;s exposure — and what Swoop recovers.
      </p>

      <div className="landing-grid-2" style={{ gap: theme.spacing.xl, alignItems: 'start' }}>
        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: theme.fontSize.sm, marginBottom: theme.spacing.sm, color: `${theme.colors.bgCard}B3` }}>
              <span>Total Members</span>
              <span style={{ fontFamily: theme.fonts.mono, color: theme.colors.ctaGreen }}>{members}</span>
            </label>
            <input
              type="range"
              min={100}
              max={800}
              value={members}
              onChange={(e) => setMembers(+e.target.value)}
              style={{ width: '100%', accentColor: theme.colors.ctaGreen }}
            />
          </div>
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: theme.fontSize.sm, marginBottom: theme.spacing.sm, color: `${theme.colors.bgCard}B3` }}>
              <span>Avg Annual Dues</span>
              <span style={{ fontFamily: theme.fonts.mono, color: theme.colors.ctaGreen }}>${dues.toLocaleString()}</span>
            </label>
            <input
              type="range"
              min={2000}
              max={25000}
              step={500}
              value={dues}
              onChange={(e) => setDues(+e.target.value)}
              style={{ width: '100%', accentColor: theme.colors.ctaGreen }}
            />
          </div>
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: theme.fontSize.sm, marginBottom: theme.spacing.sm, color: `${theme.colors.bgCard}B3` }}>
              <span>Annual Turnover Rate</span>
              <span style={{ fontFamily: theme.fonts.mono, color: theme.colors.ctaGreen }}>{churn}%</span>
            </label>
            <input
              type="range"
              min={1}
              max={15}
              value={churn}
              onChange={(e) => setChurn(+e.target.value)}
              style={{ width: '100%', accentColor: theme.colors.ctaGreen }}
            />
          </div>
        </div>

        {/* Results */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: theme.radius.lg,
            padding: theme.spacing.xl,
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.md,
          }}
        >
          <div>
            <p style={{ fontSize: theme.fontSize.sm, color: `${theme.colors.bgCard}80` }}>Members at risk annually</p>
            <p style={{ fontFamily: theme.fonts.mono, fontSize: '32px', fontWeight: 700, color: theme.colors.urgent }}>{atRisk}</p>
          </div>
          <div>
            <p style={{ fontSize: theme.fontSize.sm, color: `${theme.colors.bgCard}80` }}>Annual revenue at risk</p>
            <p style={{ fontFamily: theme.fonts.mono, fontSize: '32px', fontWeight: 700, color: theme.colors.urgent }}>${annualLoss.toLocaleString()}</p>
          </div>
          <div style={{ paddingTop: theme.spacing.md, borderTop: `1px solid rgba(255, 255, 255, 0.1)` }}>
            <p style={{ fontSize: theme.fontSize.sm, color: `${theme.colors.bgCard}80` }}>Swoop projected saves (65% early-intervention retention rate)</p>
            <p style={{ fontFamily: theme.fonts.mono, fontSize: '32px', fontWeight: 700, color: theme.colors.ctaGreen }}>{swoopSaves} members</p>
          </div>
          <div>
            <p style={{ fontSize: theme.fontSize.sm, color: `${theme.colors.bgCard}80` }}>Revenue recovered with Swoop</p>
            <p style={{ fontFamily: theme.fonts.mono, fontSize: '40px', fontWeight: 700, color: theme.colors.ctaGreen }}>${recovered.toLocaleString()}</p>
          </div>
          <div
            style={{
              paddingTop: theme.spacing.md,
              marginTop: theme.spacing.sm,
              borderTop: `1px solid ${theme.colors.ctaGreen}40`,
              background: `${theme.colors.ctaGreen}10`,
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
              marginLeft: -theme.spacing.md,
              marginRight: -theme.spacing.md,
            }}
          >
            <p style={{ fontSize: theme.fontSize.sm, color: `${theme.colors.bgCard}80` }}>Swoop Pro annual cost</p>
            <p style={{ fontFamily: theme.fonts.mono, fontSize: '20px', fontWeight: 700, color: `${theme.colors.bgCard}CC` }}>-${swoopProCost.toLocaleString()}</p>
            <p style={{ fontSize: theme.fontSize.sm, color: `${theme.colors.bgCard}80`, marginTop: theme.spacing.sm }}>Net revenue gain</p>
            <p style={{ fontFamily: theme.fonts.mono, fontSize: '40px', fontWeight: 700, color: theme.colors.ctaGreen }}>${netGain.toLocaleString()}</p>
            <p style={{ color: `${theme.colors.ctaGreen}CC`, fontSize: theme.fontSize.sm, marginTop: theme.spacing.xs, fontWeight: 600 }}>{roiMultiple}× return on investment</p>
          </div>
        </div>
      </div>
    </section>
  );
}
