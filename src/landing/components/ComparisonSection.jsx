import { theme } from '@/config/theme';
import { comparisonFeatures, objections } from '@/landing/data';
import { SectionShell, ComparisonTable, Card } from '@/landing/ui';

const mobileComparisonStyles = `
  @media (max-width: 768px) {
    .comparison-table { display: none; }
    .comparison-mobile { display: block; }
  }
  @media (min-width: 769px) {
    .comparison-mobile { display: none; }
  }
`;

const columns = [
  { key: 'swoop', label: 'Swoop', highlight: true },
  { key: 'waitlistTools', label: 'Jonas + ClubEssentials + spreadsheets' },
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
      <style>{mobileComparisonStyles}</style>
      <div className="comparison-table">
        <ComparisonTable features={comparisonFeatures} columns={columns} />
      </div>
      <div className="comparison-mobile">
        <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>What Swoop does that nothing else can:</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {['Predicts at-risk members before they resign', 'Connects tee sheet + POS + CRM signals', 'Automates the 6:15 AM GM briefing', 'Closes the loop from alert to outcome', 'Board-ready attribution in one click'].map(item => (
            <li key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ color: '#F3922D', fontWeight: 700, fontSize: 18, lineHeight: 1 }}>✓</span>
              <span style={{ fontSize: 16 }}>{item}</span>
            </li>
          ))}
        </ul>
      </div>
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
      <p style={{ fontSize: 11, color: '#888', marginTop: 12, fontStyle: 'italic' }}>
        Comparison based on published feature matrices as of Apr 2026.
      </p>

      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <p style={{ fontSize: 17, color: theme.colors.textSecondary, margin: '0 0 16px' }}>
          Swoop does what none of these can do alone.
        </p>
        <a href="#/contact" onClick={() => { window.location.hash = '#/contact'; }}
          style={{ display: 'inline-block', background: '#F3922D', color: '#fff', fontWeight: 700, fontSize: 16, padding: '14px 32px', borderRadius: 8, textDecoration: 'none' }}>
          See it in 30 minutes →
        </a>
      </div>

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
              <a href="#agents" style={{ fontSize: 14, color: '#F3922D', fontWeight: 600, textDecoration: 'none', display: 'block', marginTop: 12 }}>
                See how Swoop handles this →
              </a>
            </Card>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <a href="#/contact" onClick={() => { window.location.hash = '#/contact'; }}
            style={{ display: 'inline-block', background: '#F3922D', color: '#fff', fontWeight: 700, fontSize: 16, padding: '14px 32px', borderRadius: 8, textDecoration: 'none' }}>
            Every objection answered. Book the walkthrough →
          </a>
        </div>
      </div>
    </SectionShell>
  );
}
