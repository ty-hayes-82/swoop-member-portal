import { useState } from 'react';
import { theme } from '@/config/theme';
import { SectionShell, Stat } from '@/landing/ui';
import { RoiIllustration } from '@/landing/assets/Illustrations';

const roiMobileStyles = `
  @media (max-width: 768px) {
    input[type="range"] {
      height: 44px;
      cursor: pointer;
    }
    .roi-panels { flex-direction: column-reverse; }
  }
`;

function Slider({ label, value, onChange, min, max, step = 1, displayValue }) {
  return (
    <div>
      <label
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontSize: 13,
          fontWeight: 600,
          color: theme.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 10,
        }}
      >
        <span>{label}</span>
        <span style={{ fontFamily: theme.fonts.mono, color: theme.colors.accent, fontSize: 16, fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>
          {displayValue}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ width: '100%', accentColor: theme.colors.accent, cursor: 'pointer' }}
      />
    </div>
  );
}

export default function RoiCalculatorSection() {
  const [members, setMembers] = useState(300);
  const [dues, setDues] = useState(8000);
  const [churn, setChurn] = useState(5);

  const atRisk = Math.round(members * (churn / 100));
  const annualLoss = atRisk * dues;
  const swoopSaves = Math.round(atRisk * 0.65);
  const recovered = swoopSaves * dues;
  const swoopProCost = 5988;
  const netGain = recovered - swoopProCost;
  const roiMultiple = recovered > 0 ? Math.round(recovered / swoopProCost) : 0;

  const fmt = (n) => `$${n.toLocaleString()}`;

  return (
    <SectionShell
      band="paper"
      eyebrow="ROI Calculator"
      title="What is member turnover costing your club?"
      subtitle="Adjust the sliders to see your club's exposure — and what Swoop recovers."
    >
      <style>{roiMobileStyles}</style>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)',
          gap: 40,
          alignItems: 'stretch',
        }}
        className="landing-roi-grid roi-panels"
      >
        <div
          style={{
            background: '#FAF7F2',
            borderRadius: 20,
            padding: 'clamp(24px, 4vw, 36px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            border: '1px solid rgba(17,17,17,0.08)',
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <RoiIllustration />
          </div>
          <Slider label="Total Members" value={members} onChange={setMembers} min={100} max={800} displayValue={members} />
          <Slider label="Avg Annual Dues" value={dues} onChange={setDues} min={2000} max={25000} step={500} displayValue={fmt(dues)} />
          <Slider label="Annual Turnover Rate" value={churn} onChange={setChurn} min={1} max={15} displayValue={`${churn}%`} />
        </div>

        <div
          style={{
            background: theme.neutrals.ink,
            color: '#FFFFFF',
            borderRadius: 20,
            padding: 'clamp(28px, 4vw, 40px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', margin: '0 0 6px' }}>
              Exposure
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <p style={{ fontSize: 36, fontWeight: 800, fontFamily: theme.fonts.mono, color: '#ef4444', margin: '0 0 2px', lineHeight: 1 }}>
                  {atRisk}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Members at risk</p>
              </div>
              <div>
                <p style={{ fontSize: 36, fontWeight: 800, fontFamily: theme.fonts.mono, color: '#ef4444', margin: '0 0 2px', lineHeight: 1 }}>
                  {fmt(annualLoss)}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Annual revenue at risk</p>
              </div>
            </div>
          </div>

          <div
            style={{
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
            }}
          />

          <div>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.colors.accent, margin: '0 0 6px' }}>
              With Swoop
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: '0 0 12px' }}>
              65% early-intervention retention rate — Retention rate from Pinetree CC pilot (10 of 15 at-risk members retained in 90-day window).
            </p>
            <p style={{ fontSize: 52, fontWeight: 800, fontFamily: theme.fonts.mono, color: theme.colors.accent, margin: 0, lineHeight: 1, letterSpacing: '-0.02em' }}>
              {fmt(recovered)}
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '6px 0 0' }}>
              Revenue recovered ({swoopSaves} members saved)
            </p>
            <p style={{ fontSize: 12, color: '#888', marginTop: 8, fontStyle: 'italic' }}>
              Calculated from your inputs: avg dues × estimated lapse rate × 12. Not a projection — math you can verify.
            </p>
          </div>

          <div
            style={{
              background: 'rgba(243,146,45,0.1)',
              border: '1px solid rgba(243,146,45,0.3)',
              borderRadius: 14,
              padding: 20,
              marginTop: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Swoop Pro annual cost</span>
              <span style={{ fontFamily: theme.fonts.mono, fontSize: 15, color: 'rgba(255,255,255,0.85)' }}>-{fmt(swoopProCost)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Net revenue gain</span>
              <span style={{ fontFamily: theme.fonts.mono, fontSize: 22, color: theme.colors.accent, fontWeight: 800 }}>{fmt(netGain)}</span>
            </div>
            <p style={{ fontSize: 13, color: theme.colors.accent, fontWeight: 700, margin: '8px 0 0' }}>
              {roiMultiple}× return on investment
            </p>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#888', maxWidth: 480, margin: '16px auto 0', textAlign: 'center', fontStyle: 'italic' }}>
        How this is calculated: At-risk revenue × 65% early-intervention retention rate (Pinetree CC pilot, Q4 2025) − Swoop annual cost = net dues recovered.
      </p>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: theme.neutrals.ink, margin: '0 0 8px' }}>
          Ready to recover your at-risk dues?
        </p>
        <p style={{ fontSize: 14, color: theme.colors.textSecondary, margin: '0 0 20px' }}>
          Swoop Pro costs $5,988/year. Most clubs recover that in the first 60 days.
        </p>
        <a href="#/contact" onClick={() => { window.location.hash = '#/contact'; }}
          style={{ display: 'inline-block', background: '#F3922D', color: '#fff', fontWeight: 700, fontSize: 16, padding: '14px 32px', borderRadius: 8, textDecoration: 'none' }}>
          Book a Walkthrough With Your Numbers →
        </a>
      </div>
    </SectionShell>
  );
}
