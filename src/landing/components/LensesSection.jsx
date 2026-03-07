import { useEffect, useMemo, useRef } from 'react';
import { theme } from '@/config/theme';
import { lenses } from '@/landing/data';

const iconLabel = {
  Users: 'MI',
  Calendar: 'TS',
  Utensils: 'FB',
  UsersRound: 'SL',
  DollarSign: 'RP',
};

export default function LensesSection() {
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
        Five lenses. One operating view.
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
        {lenses.map((lens, index) => (
          <article
            key={lens.title}
            ref={(element) => { cardRefs.current[index] = element; }}
            className="reveal-up"
            style={{
              background: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              borderTop: `5px solid ${lens.color}`,
              borderRadius: theme.radius.lg,
              padding: '22px 18px 20px',
              minHeight: 220,
              transitionDelay: `${index * 90}ms`,
            }}
          >
            <div style={{
              height: 34,
              width: 34,
              borderRadius: theme.radius.md,
              background: `${lens.color}22`,
              color: lens.color,
              fontFamily: theme.fonts.mono,
              fontSize: theme.fontSize.sm,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.md,
            }}>
              {iconLabel[lens.icon]}
            </div>
            <h3 style={{ fontSize: theme.fontSize.lg, marginBottom: theme.spacing.sm }}>
              {lens.title}
            </h3>
            <p style={{ color: theme.colors.textSecondary }}>
              {lens.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
