
import { theme } from '@/config/theme'

const CTA_URL = 'https://swoop-member-intelligence-website.vercel.app/book-demo'
const MARKETING_HOME = 'https://swoop-member-intelligence-website.vercel.app'

const quickWins = [
  {
    label: "Today's cockpit",
    detail: 'See where operations are at risk — staffing gaps, open complaints, and pace issues — in under 90 seconds.'
  },
  {
    label: 'Service & Staffing',
    detail: 'Is tomorrow staffed correctly? Which outlets had complaints this week? Where is service inconsistent?'
  },
  {
    label: 'Members needing attention',
    detail: 'Which members are quietly disengaging? Who should you call this week?'
  }
]

const proofPoints = [
  { metric: '15%', description: 'Service consistency improvement at pilot clubs within the first month.' },
  { metric: '12', description: 'Staffing adjustments that prevented service failures before members noticed.' },
  { metric: '6 days', description: 'Early warning before a member disengages — across golf, dining, and events.' }
]

export default function PortalLanding() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: theme.spacing.xl, display: 'flex', flexDirection: 'column', gap: theme.spacing.xl }}>
      <section style={{ background: theme.colors.card, borderRadius: theme.radius.xl, border: `1px solid ${theme.colors.border}`, padding: theme.spacing.xl }} data-animate>
        <p style={{ textTransform: 'uppercase', fontSize: theme.fontSize.sm, letterSpacing: '0.3em', color: theme.colors.textMuted }}>Demo Environment</p>
        <h1 style={{ fontSize: theme.fontSize.display, marginTop: theme.spacing.md }}>See where today is breaking — before your members feel it.</h1>
        <p style={{ fontSize: theme.fontSize.lg, color: theme.colors.textMuted, marginTop: theme.spacing.md }}>
          Swoop connects your tee sheet, POS, CRM, and scheduling into one intelligence layer — so you can see where service is at risk, know which members need attention, and prove to your board that it's working.
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
            onClick={() => (window.location.hash = '#/today')}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              borderRadius: theme.radius.lg,
              border: `1px solid ${theme.colors.border}`,
              background: 'transparent',
              color: theme.colors.textPrimary,
              fontWeight: 600,
            }}
          >
            View Today's Cockpit
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
          href={MARKETING_HOME}
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
