import { theme } from '@/config/theme';
import { Button } from '@/landing/ui';

const agentRows = [
  { label: 'Member Pulse',         detail: 'Callback queued · Mark Henderson',      value: '$9.4K',  positive: true },
  { label: 'Service Recovery',     detail: 'Mid-comp drafted · Golf Room',           value: '$11K',   positive: true },
  { label: 'Demand Optimizer',     detail: 'Full-fare slots routed to 5 members',    value: '-$1.5K', positive: false },
  { label: 'Labor Optimizer',      detail: '2 FOH shifts added · Get lunch',         value: '$3.2K',  positive: true },
  { label: 'Engagement Autopilot', detail: '18 member outreach sequences',           value: '$42.4K', positive: true },
  { label: 'Revenue Analyst',      detail: 'Board revenue report ready',             value: '$12K',   positive: true },
];

function AgentConsole() {
  return (
    <div
      style={{
        background: '#0D1A0E',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 32px 72px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          background: '#0a1309',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: theme.colors.brass || '#B5956A',
            }}
          >
            BRIEF · 06:14 · DELIVERED
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
          tonight's brief
        </span>
      </div>

      {/* Total */}
      <div style={{ padding: '20px 20px 12px' }}>
        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 42,
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          $42.2K
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
          protected across 8 actions, delivered 06:14
        </div>
      </div>

      {/* Agent rows */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 0' }}>
        {agentRows.map((row) => (
          <div
            key={row.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 20px',
              gap: 8,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                {row.label}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginLeft: 8 }}>
                {row.detail}
              </span>
            </div>
            <span
              style={{
                fontSize: 12,
                fontFamily: theme.fonts.mono,
                fontWeight: 700,
                color: row.positive ? theme.colors.brass || '#B5956A' : 'rgba(255,255,255,0.45)',
                flexShrink: 0,
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)' }}>
          sent to gm@pinetree.com — ready before the first tee time
        </span>
        {/* Monogram */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: theme.colors.brass || '#B5956A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 900,
            color: '#0D1A0E',
            letterSpacing: '-0.03em',
          }}
        >
          S
        </div>
      </div>
    </div>
  );
}

export default function HeroSection({ onDemoClick }) {
  const goToDemoForm = onDemoClick ?? (() => {
    document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const seeTheBrief = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))',
            gap: 'clamp(48px, 6vw, 80px)',
            alignItems: 'center',
          }}
        >
          {/* Left — copy */}
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: theme.colors.brass || '#B5956A',
                margin: '0 0 20px',
              }}
            >
              Member Retention, Built for Private-Club GMs
            </p>

            <h1
              style={{
                fontFamily: theme.fonts.serif || "'Fraunces', Georgia, serif",
                fontSize: 'clamp(36px, 4.5vw, 58px)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
                margin: '0 0 24px',
              }}
            >
              See which members are about to resign —{' '}
              <em
                style={{
                  fontStyle: 'italic',
                  color: theme.colors.accent,
                  display: 'block',
                }}
              >
                six days before they tell you.
              </em>
            </h1>

            <p
              style={{
                fontSize: 17,
                lineHeight: 1.65,
                color: 'rgba(255,255,255,0.70)',
                margin: '0 0 36px',
                maxWidth: 480,
              }}
            >
              Swoop reads your tee sheet, CRM, and POS together, surfaces at-risk
              members, fills the waitlist with the right replacements, and protects{' '}
              <strong style={{ color: '#FFFFFF', fontWeight: 700 }}>$74K+</strong> in
              dues a year. Live in fourteen days.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 32 }}>
              <Button
                size="lg"
                onClick={goToDemoForm}
                style={{
                  background: theme.colors.accent,
                  color: '#FFFFFF',
                  border: 'none',
                }}
              >
                Book the 30-minute walkthrough
              </Button>
              <button
                onClick={seeTheBrief}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.55)',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                or see the daily brief{' '}
                <span style={{ fontSize: 16 }}>›</span>
              </button>
            </div>

            {/* Trust bullets */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {['Live in under 2 weeks', 'No rip-and-replace', '28 integrations'].map((item) => (
                <span
                  key={item}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.55)',
                    fontWeight: 500,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#4ade80',
                      flexShrink: 0,
                    }}
                  />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Right — agent console */}
          <div>
            <AgentConsole />
          </div>
        </div>
      </div>
    </section>
  );
}
