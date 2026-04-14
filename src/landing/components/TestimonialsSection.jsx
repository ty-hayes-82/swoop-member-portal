import { theme } from '@/config/theme';
import { SectionShell } from '@/landing/ui';

export default function TestimonialsSection() {
  return (
    <SectionShell band="cream">
      <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: theme.fonts.serif,
            fontSize: 96,
            lineHeight: 0.7,
            color: theme.colors.accent,
            marginBottom: 28,
            userSelect: 'none',
          }}
        >
          "
        </div>
        <p
          style={{
            fontFamily: theme.fonts.serif,
            fontSize: 'clamp(20px, 2.5vw, 26px)',
            fontWeight: 700,
            lineHeight: 1.5,
            color: theme.neutrals.ink,
            margin: '0 0 36px',
          }}
        >
          The Saturday brief is the first club-tech vendor deliverable I've ever forwarded
          to my board without rewriting.{' '}
          <em style={{ fontStyle: 'italic', color: theme.colors.accent }}>
            Two members we were about to lose
          </em>
          {' '}are still here because of it.
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: theme.colors.heroGreen || '#1A2E20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 15,
              flexShrink: 0,
            }}
          >
            DM
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: theme.neutrals.ink }}>
              D. Marchetti · GM
            </p>
            <p style={{ fontSize: 12, color: theme.colors.textMuted, margin: 0 }}>
              Founding partner · 600-member private club · Tenure withheld through Q2 2026 pilot
            </p>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
