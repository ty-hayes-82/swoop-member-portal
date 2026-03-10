
import { theme } from '@/config/theme'

const CTA_URL = 'https://swoop-member-intelligence-website.vercel.app/book-demo'

const quickWins = [
  {
    label: 'Morning snapshot',
    detail: 'See which members, tee sheets, and outlets need attention in under 90 seconds.'
  },
  {
    label: 'Action queue',
    detail: 'Approve or assign the three highest-impact saves before noon.'
  },
  {
    label: 'Board-ready notes',
    detail: 'Download the Morning Briefing sheet and forward it to your team in one click.'
  }
]

const proofPoints = [
  { metric: '+21%', description: 'Retention lift at Oakmont Hills after three weeks.' },
  { metric: '$312', description: 'Average revenue per protected slot once retention routing is enabled.' },
  { metric: '6 days', description: 'Early warning before a member stops visiting or dining.' }
]

export default function PortalLanding() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: theme.spacing.xl, display: 'flex', flexDirection: 'column', gap: theme.spacing.xl }}>
      <section style={{ background: theme.colors.card, borderRadius: theme.radius.xl, border: `1px solid ${theme.colors.border}`, padding: theme.spacing.xl }} data-animate>
        <p style={{ textTransform: 'uppercase', fontSize: theme.fontSize.sm, letterSpacing: '0.3em', color: theme.colors.textMuted }}>Demo Environment</p>
        <h1 style={{ fontSize: theme.fontSize.display, marginTop: theme.spacing.md }}>Welcome to Swoop Member Intelligence</h1>
        <p style={{ fontSize: theme.fontSize.lg, color: theme.colors.textMuted, marginTop: theme.spacing.md }}>
          This route is a lightweight overview for prospects who land directly in the portal. If you're evaluating Swoop, start with the highlights below or jump straight to a live walkthrough.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
          <a
            href={CTA_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              borderRadius: theme.radius.lg,
              background: theme.colors.cta,
              color: theme.colors.ctaText,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Book a 30-minute walkthrough
          </a>
          <button
            type="button"
            onClick={() => (window.location.hash = '#/daily-briefing')}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              borderRadius: theme.radius.lg,
              border: `1px solid ${theme.colors.border}`,
              background: 'transparent',
              color: theme.colors.textPrimary,
              fontWeight: 600,
            }}
          >
            View the Daily Briefing
          </button>
        </div>
      </section>

      <section style={{ display: 'grid', gap: theme.spacing.md, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }} data-animate>
        {proofPoints.map((proof) => (
          <article key={proof.metric} style={{ borderRadius: theme.radius.lg, border: `1px solid ${theme.colors.border}`, padding: theme.spacing.lg }}>
            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>{proof.metric}</p>
            <p style={{ marginTop: theme.spacing.sm, color: theme.colors.textMuted }}>{proof.description}</p>
          </article>
        ))}
      </section>

      <section style={{ borderRadius: theme.radius.lg, border: `1px solid ${theme.colors.border}`, padding: theme.spacing.xl }} data-animate>
        <h2 style={{ fontSize: theme.fontSize.xl }}>What to look at first</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
          {quickWins.map((item) => (
            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <strong>{item.label}</strong>
              <span style={{ color: theme.colors.textMuted }}>{item.detail}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ borderRadius: theme.radius.lg, border: `1px solid ${theme.colors.border}`, padding: theme.spacing.xl }} data-animate>
        <h2 style={{ fontSize: theme.fontSize.xl }}>Need the full story?</h2>
        <p style={{ color: theme.colors.textMuted, marginTop: theme.spacing.md }}>
          The marketing site has complete capability deep dives, integration details, and implementation guides. Continue there when you're ready to brief your board or operations team.
        </p>
        <a
          href={CTA_URL}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            marginTop: theme.spacing.lg,
            color: theme.colors.cta,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Visit the full marketing site →
        </a>
      </section>
    </div>
  )
}
