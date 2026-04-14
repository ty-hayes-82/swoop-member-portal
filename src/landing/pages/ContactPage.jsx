import { theme } from '@/config/theme';
import LandingShell from '@/landing/LandingShell';
import DemoCtaSection from '@/landing/components/DemoCtaSection';

const leaveWithItems = [
  'A ranked list of your top 5 revenue and retention gaps',
  'Benchmarks against comparable clubs',
  'A draft 90-day action plan — yours to keep, no strings attached',
];

function ContactHeroPanel() {
  return (
    <section
      className="landing-section-sm"
      style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(17,17,17,0.07)' }}
    >
      <div className="landing-container" style={{ maxWidth: 720 }}>
        <p
          style={{
            fontSize: 'clamp(17px, 1.6vw, 20px)',
            lineHeight: 1.6,
            color: theme.colors.textSecondary,
            margin: '0 0 28px',
          }}
        >
          In 30 minutes, we load your tee-sheet data into Swoop and show you exactly where revenue is
          leaking and which members are quietly disengaging. You leave with a prioritized action list
          — not a pitch deck.
        </p>
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: theme.colors.accent,
            margin: '0 0 14px',
          }}
        >
          What you'll leave with
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {leaveWithItems.map((item) => (
            <li
              key={item}
              style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, color: theme.neutrals.ink, lineHeight: 1.5 }}
            >
              <span style={{ color: theme.colors.accent, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function ContactPage() {
  return (
    <LandingShell>
      <ContactHeroPanel />
      <DemoCtaSection />
    </LandingShell>
  );
}
