import { theme } from '@/config/theme';
import { SectionShell } from '@/landing/ui';

const stats = [
  { value: '3,000+', label: 'Private clubs in the US with 200+ members' },
  { value: '$2.1B', label: 'Annual dues revenue at risk from preventable churn' },
  { value: '67%', label: 'Of clubs still rely on disconnected point solutions' },
];

export default function IndustryStatsSection() {
  return (
    <SectionShell
      band="dark"
      eyebrow="Why now"
      title="The numbers behind the opportunity."
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 24,
          marginTop: 8,
        }}
      >
        {stats.map(s => (
          <div
            key={s.value}
            style={{
              textAlign: 'center',
              padding: '28px 20px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
            }}
          >
            <p
              style={{
                fontSize: 'clamp(36px, 5vw, 56px)',
                fontWeight: 800,
                fontFamily: theme.fonts.mono,
                color: theme.colors.accent,
                margin: '0 0 8px',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {s.value === '$2.1B' ? <span style={{ whiteSpace: 'nowrap' }}>$2.1B</span> : s.value}
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
