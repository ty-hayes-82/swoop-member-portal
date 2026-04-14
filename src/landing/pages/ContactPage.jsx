import { theme } from '@/config/theme';
import LandingShell from '@/landing/LandingShell';
import DemoCtaSection from '@/landing/components/DemoCtaSection';
import { SectionShell } from '@/landing/ui';

const pilotStats = [
  { value: '$1.38M', label: 'in at-risk dues identified' },
  { value: '3', label: 'silent-churn members flagged' },
  { value: '91%', label: 'tee-sheet fill rate' },
  { value: '9 / 14', label: 'members retained' },
];

function PilotResultsStrip() {
  return (
    <SectionShell
      band="paper"
      eyebrow="Pilot results — Fox Ridge Country Club (300 members)"
      title="See what your club misses today, and what you recover tomorrow."
      subtitle="A 30-minute walkthrough on your club's real data — tee sheet leakage, at-risk members, F&B staffing pressure, revenue blind spots. Founding partners only. Nine seats left."
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16,
          marginBottom: 8,
        }}
      >
        {pilotStats.map(s => (
          <div
            key={s.value}
            style={{
              textAlign: 'center',
              padding: '20px 16px',
              background: '#FAF7F2',
              border: '1px solid rgba(17,17,17,0.08)',
              borderRadius: 14,
            }}
          >
            <p
              style={{
                fontSize: 'clamp(24px, 3.5vw, 38px)',
                fontWeight: 800,
                fontFamily: theme.fonts.mono,
                color: theme.colors.accent,
                margin: '0 0 6px',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {s.value}
            </p>
            <p style={{ fontSize: 13, color: theme.colors.textSecondary, margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

export default function ContactPage() {
  return (
    <LandingShell>
      <PilotResultsStrip />
      <DemoCtaSection />
    </LandingShell>
  );
}
