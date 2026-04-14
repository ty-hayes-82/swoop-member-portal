import { theme } from '@/config/theme';
import { comparisonFeatures, objections } from '@/landing/data';
import { SectionShell, ComparisonTable, Card } from '@/landing/ui';

const columns = [
  { key: 'swoop', label: 'Swoop', highlight: true },
  { key: 'waitlistTools', label: 'Waitlist Tools' },
  { key: 'crm', label: 'Your CRM' },
  { key: 'sheets', label: 'Spreadsheets' },
];

export default function ComparisonSection() {
  return (
    <SectionShell
      band="paper"
      eyebrow="THE COMPARISON"
      title="One page replaces four logins."
      subtitle="Waitlist tools fill slots. CRMs store records. Spreadsheets report the past. Swoop ranks today's members, today's demand, and today's moves."
    >
      <ComparisonTable features={comparisonFeatures} columns={columns} />
      <p
        className="landing-scroll-hint"
        style={{
          margin: '12px 4px 0',
          fontSize: 12,
          color: theme.colors.textMuted,
          textAlign: 'right',
          fontWeight: 500,
        }}
      >
        ← swipe to compare every column →
      </p>

      <div style={{ marginTop: 72 }}>
        <h3
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 28,
            color: theme.neutrals.ink,
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          Why not just&hellip;
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          {objections.map((item) => (
            <Card key={item.question} interactive>
              <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px', color: theme.neutrals.ink, lineHeight: 1.35 }}>
                {item.question}
              </p>
              <p style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                {item.answer}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
