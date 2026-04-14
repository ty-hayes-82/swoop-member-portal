import { theme } from '@/config/theme';
import { integrationCategories } from '@/landing/data';
import { SectionShell, Card, IconBadge } from '@/landing/ui';
import { IntegrationsIllustration } from '@/landing/assets/Illustrations';

const swoopUnique = [
  { title: 'Real-Time Location Intelligence', desc: 'GPS and behavioral data from the Swoop member app. On-property movement patterns that no POS, tee sheet, or CRM captures.' },
  { title: 'Cross-System Behavioral Correlation', desc: 'How a member\'s dining patterns predict their tee sheet behavior. How staffing gaps correlate with revenue drops. Your systems cannot see this alone.' },
  { title: 'AI-Powered Predictive Recommendations', desc: 'Your systems collect data. Swoop interprets it and recommends specific actions with measurable outcomes — before problems become resignations.' },
  { title: 'Closed-Loop Engagement Tracking', desc: 'From signal detection to GM action to member response to outcome measurement. Your existing tools stop at the data layer. Swoop closes the loop.' },
];

export default function IntegrationsSection() {
  return (
    <SectionShell
      band="dark"
      eyebrow="Integrations"
      title="Your tools manage operations. Swoop connects them."
      subtitle="These systems collect data. Swoop is the intelligence layer that connects them, adds location-aware behavioral signals, and turns cross-system patterns into actionable recommendations."
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 'clamp(32px, 5vw, 72px)',
          alignItems: 'center',
          marginBottom: 64,
        }}
        className="landing-integrations-hero"
      >
        <div style={{ maxWidth: 360, margin: '0 auto' }}>
          <IntegrationsIllustration />
        </div>
        <div style={{ display: 'grid', gap: 20 }}>
          {swoopUnique.map((item) => (
            <div
              key={item.title}
              style={{
                borderLeft: `3px solid ${theme.colors.accent}`,
                paddingLeft: 18,
              }}
            >
              <p style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: '#FFFFFF' }}>{item.title}</p>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: 'clamp(24px, 4vw, 36px)',
          marginBottom: 32,
        }}
      >
        <p
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 700,
            margin: '0 0 24px',
          }}
        >
          28 Integrations Across 10 Categories
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {integrationCategories.map((category) => (
            <div
              key={category.label}
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: 16,
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <p style={{ fontWeight: 700, margin: '0 0 4px', color: '#FFFFFF', fontSize: 15 }}>{category.label}</p>
              <p style={{ color: theme.colors.accent, fontFamily: theme.fonts.mono, fontSize: 13, margin: '0 0 6px' }}>
                {category.systems} connected systems
              </p>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                {category.vendors.join(' · ')}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          border: `1px solid rgba(243,146,45,0.4)`,
          background: 'rgba(243,146,45,0.08)',
          borderRadius: 20,
          padding: 'clamp(24px, 4vw, 36px)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 32,
          alignItems: 'center',
        }}
        className="landing-integrations-timeline"
      >
        <div>
          <p
            style={{
              fontSize: 12,
              color: theme.colors.accent,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 700,
              margin: '0 0 12px',
            }}
          >
            Rollout Timeline
          </p>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#FFFFFF', margin: '0 0 12px', lineHeight: 1.2 }}>
            Typical launch: <span style={{ fontFamily: theme.fonts.mono, color: theme.colors.accent }}>10 business days</span>.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
            Week 1: connector setup, data validation, and intelligence baselines. Week 2: workflows, AI agent playbooks, and GM readiness.
          </p>
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 14,
            padding: 22,
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <p style={{ fontFamily: theme.fonts.mono, fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px', fontSize: 15 }}>
            No operational downtime.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.55, margin: 0 }}>
            Keep current systems active while Swoop comes online in parallel.
          </p>
        </div>
      </div>

      <p style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 560, margin: '24px auto 0', lineHeight: 1.6 }}>
        Swoop connects via read-only API — your existing systems keep running exactly as they do today. No write access is ever requested.
      </p>
    </SectionShell>
  );
}
