import { useEffect, useMemo, useRef } from 'react';
import { theme } from '@/config/theme';
import { coreCapabilities } from '@/landing/data';

const iconLabel = {
  Users: 'MI',
  Calendar: 'TS',
  Utensils: 'FB',
  UsersRound: 'SL',
  DollarSign: 'RP',
};

export default function CoreCapabilitiesSection() {
  const cardRefs = useRef([]);
  const prefersReducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  useEffect(() => {
    if (prefersReducedMotion) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.2 }
    );

    cardRefs.current.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  return (
    <section style={{ marginBottom: theme.spacing.xxl }}>
      <h2 style={{ fontSize: theme.fontSize.xxl, marginBottom: theme.spacing.md }}>
        Five core capabilities. One operating view.
      </h2>
      <p style={{
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.lg,
        marginBottom: theme.spacing.xl,
        maxWidth: 760,
      }}>
        Swoop combines member behavior, demand, service, labor, and revenue so your
        team can act with confidence instead of assumptions.
      </p>
      <div className="landing-grid-auto">
        {coreCapabilities.map((capability, index) => (
          <article
            key={capability.title}
            ref={(element) => { cardRefs.current[index] = element; }}
            className="reveal-up"
            style={{
              background: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              borderTop: `5px solid ${capability.color}`,
              borderRadius: theme.radius.lg,
              padding: '24px 20px 22px',
              minHeight: 260,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              transitionDelay: `${index * 90}ms`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: theme.fontSize.xs, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.colors.textMuted }}>
              <span>📡 {capability.source}</span>
              <span>⏱ {capability.freshness}</span>
            </div>
            <div style={{
              height: 34,
              width: 34,
              borderRadius: theme.radius.md,
              background: `${capability.color}22`,
              color: capability.color,
              fontFamily: theme.fonts.mono,
              fontSize: theme.fontSize.sm,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {iconLabel[capability.icon]}
            </div>
            <div>
              <h3 style={{ fontSize: theme.fontSize.lg, marginBottom: theme.spacing.xs }}>
                {capability.title}
              </h3>
              <p style={{ color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }}>
                {capability.summary || capability.description}
              </p>
            </div>
            {capability.bullets?.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: '18px', color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, lineHeight: 1.5 }}>
                {capability.bullets.map((bullet) => (
                  <li key={bullet} style={{ marginBottom: '4px' }}>{bullet}</li>
                ))}
              </ul>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontSize: theme.fontSize.xs, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.colors.textMuted }}>
                Why this surfaced
                <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>{capability.why}</div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: capability.color, background: `${capability.color}16`, padding: '4px 12px', borderRadius: '999px' }}>{capability.confidence}</span>
            </div>
            {capability.metric && (
              <div style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md, padding: '12px', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                <span style={{ fontSize: '24px', fontFamily: theme.fonts.mono, fontWeight: 700 }}>{capability.metric.value}</span>
                <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{capability.metric.label}</span>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
