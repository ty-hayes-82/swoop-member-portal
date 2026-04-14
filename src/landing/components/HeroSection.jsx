import { theme } from '@/config/theme';
import { Button } from '@/landing/ui';

const proofColumns = [
  {
    eyebrow: 'SEE IT',
    headline: 'Know who\'s drifting — six days early.',
    body: 'Swoop connects your tee sheet, POS, and CRM into a single member health score. At-risk members surface automatically.',
  },
  {
    eyebrow: 'FIX IT',
    headline: 'One-tap intervention before the problem compounds.',
    body: 'Swoop drafts the callback script, the comp offer, and the staffing shift. Your team acts instead of sorting spreadsheets.',
  },
  {
    eyebrow: 'PROVE IT',
    headline: 'Board-ready attribution. Not a feeling.',
    body: 'Every save is tracked. Every dollar is sourced. One click generates the report your board wants to see.',
  },
];

export default function HeroSection({ onDemoClick }) {
  const goToDemoForm = onDemoClick ?? (() => {
    document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const seeHowItWorks = () => {
    document.getElementById('see-it')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      style={{
        background: theme.colors.heroGreen || '#1A2E20',
        paddingTop: 'clamp(72px, 9vw, 120px)',
        paddingBottom: 'clamp(72px, 9vw, 120px)',
      }}
    >
      <div className="landing-container">
        {/* Eyebrow */}
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: theme.colors.brass || '#B5956A',
            margin: '0 0 20px',
            textAlign: 'center',
          }}
        >
          Member Retention Software for Private Clubs
        </p>

        {/* Headline */}
        <h1
          style={{
            fontFamily: theme.fonts.serif || "'Fraunces', Georgia, serif",
            fontSize: 'clamp(36px, 5vw, 64px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            color: '#FFFFFF',
            margin: '0 auto 24px',
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          Your club runs on Jonas, Lightspeed, ForeTees, and a spreadsheet.{' '}
          <em style={{ fontStyle: 'italic', color: theme.colors.accent }}>
            Swoop turns them into one 6 AM brief.
          </em>
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontSize: 18,
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.70)',
            margin: '0 auto 16px',
            maxWidth: 620,
            textAlign: 'center',
          }}
        >
          Most club software tells you what happened. Swoop tells you what to do about it — connecting your tee sheet, POS, member CRM, and scheduling into one morning briefing that turns operational noise into decisions.
        </p>
        <p
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.65)',
            margin: '0 auto 40px',
            textAlign: 'center',
          }}
        >
          Pinetree CC recovered $74K in dues in their first 90 days on Swoop.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 8 }}>
          <Button
            size="lg"
            onClick={goToDemoForm}
            style={{ background: theme.colors.accent, color: '#FFFFFF', border: 'none' }}
          >
            See a sample brief
          </Button>
          <button
            onClick={seeHowItWorks}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, color: 'rgba(255,255,255,0.55)', padding: 0,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            Book 30-min demo <span style={{ fontSize: 16 }}>›</span>
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 8, textAlign: 'center', marginBottom: 16 }}>
          No credit card · No IT lift · Live in 2 weeks · 3 founding-partner slots left for Q2
        </p>

        {/* Trust bullets */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>
          {['Live in under 2 weeks', 'No rip-and-replace', '28 integrations'].map((item) => (
            <span
              key={item}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
              {item}
            </span>
          ))}
        </div>

        {/* Proof columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            borderRadius: 20,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          {proofColumns.map((col, idx) => (
            <div
              key={col.eyebrow}
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderRight: idx < proofColumns.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                padding: 'clamp(24px, 3vw, 36px)',
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.colors.brass || '#B5956A', margin: '0 0 12px' }}>
                {col.eyebrow}
              </p>
              <h3 style={{ fontFamily: theme.fonts.serif, fontSize: 17, fontWeight: 700, color: '#FFFFFF', margin: '0 0 10px', lineHeight: 1.3 }}>
                {col.headline}
              </h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: 0 }}>
                {col.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
