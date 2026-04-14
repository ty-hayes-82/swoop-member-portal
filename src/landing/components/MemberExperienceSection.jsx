import { theme } from '@/config/theme';
import { SectionShell, Card } from '@/landing/ui';

const touchpoints = [
  {
    num: '01',
    label: 'The arrival',
    systems: '4 systems · pre-arrival brief',
    headline: 'The club that knows you — before you walk in.',
    story:
      'James pulls into the parking lot. The pro shop has his pull cart ready. The starter knows he\'s walking. The Grill Room knows he\'ll want Booth 12 after his round, and that last time he complained about slow service — so today they\'ve assigned their fastest server.',
    how: 'Swoop routed a pre-arrival brief from four systems to each staff member before James arrived.',
  },
  {
    num: '02',
    label: 'The nudge',
    systems: 'Round end · dining trigger · 0 staff keystrokes',
    headline: 'Round ends. Dining fills. Zero effort.',
    story:
      'James finishes his round. His phone buzzes: "Great round. Booth 12 is open and Chef\'s doing the ribeye special. Want me to hold it for twenty minutes?" He taps "Hold it." The reservation is made.',
    how: 'Swoop detected the round ending, checked dining history, confirmed availability, and sent a personalized nudge — zero staff input.',
  },
  {
    num: '03',
    label: 'The milestone',
    systems: '6 years of data · 3 days notice · 1 unforgettable moment',
    headline: 'His 100th round. He didn\'t know. The club did.',
    story:
      'James sits down at Booth 12. There\'s a handwritten note from the GM and a commemorative ball marker. He just played his 100th round on the North Course.',
    how: 'Swoop tracked round milestones across six years of data, staged the recognition with the pro shop, and alerted the GM to write the note — three days before James arrived.',
  },
];

export default function MemberExperienceSection() {
  return (
    <SectionShell
      band="sand"
      eyebrow="Member experience"
      title="Your members feel it. They just can't explain why."
      subtitle="When your systems are connected, every interaction becomes personal. Nobody told them. The system told them."
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
        }}
      >
        {touchpoints.map(tp => (
          <Card key={tp.num} style={{ padding: 32, gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  fontFamily: theme.fonts.mono,
                  color: theme.colors.accent,
                  lineHeight: 1,
                  opacity: 0.4,
                }}
              >
                {tp.num}
              </span>
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: theme.colors.accent,
                    margin: 0,
                  }}
                >
                  {tp.label}
                </p>
                <p style={{ fontSize: 12, color: theme.colors.textMuted, margin: 0 }}>{tp.systems}</p>
              </div>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.neutrals.ink, margin: 0, lineHeight: 1.3 }}>
              {tp.headline}
            </h3>
            <p style={{ fontSize: 14, color: theme.colors.textSecondary, lineHeight: 1.65, margin: 0 }}>
              {tp.story}
            </p>
            <div
              style={{
                borderTop: '1px solid rgba(17,17,17,0.08)',
                paddingTop: 14,
                marginTop: 'auto',
              }}
            >
              <p style={{ fontSize: 12, color: theme.colors.textMuted, lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>
                ▸ {tp.how}
              </p>
            </div>
          </Card>
        ))}
      </div>
      <blockquote style={{
        fontSize: 22,
        fontWeight: 700,
        color: theme.neutrals.ink,
        textAlign: 'center',
        fontStyle: 'italic',
        maxWidth: 560,
        margin: '40px auto 24px',
        lineHeight: 1.4,
        borderLeft: 'none',
        padding: 0,
      }}>
        "James doesn't know Swoop exists. He just knows his club feels different."
      </blockquote>
      <div style={{ textAlign: 'center' }}>
        <a
          href="#/contact"
          onClick={() => { window.location.hash = '#/contact'; }}
          style={{ display: 'inline-block', background: '#F3922D', color: '#fff', fontWeight: 700, fontSize: 16, padding: '14px 32px', borderRadius: 8, textDecoration: 'none' }}
        >
          Give your members a club that knows them →
        </a>
      </div>
    </SectionShell>
  );
}
