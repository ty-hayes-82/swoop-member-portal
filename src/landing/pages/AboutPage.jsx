import LandingShell from '@/landing/LandingShell';
import TeamSection from '@/landing/components/TeamSection';
import TestimonialsSection from '@/landing/components/TestimonialsSection';
import SocialProofSection from '@/landing/components/SocialProofSection';
import FaqSection from '@/landing/components/FaqSection';
import { SectionShell } from '@/landing/ui';
import { theme } from '@/config/theme';

const toDemoPage = () => { window.location.hash = '#/contact'; };

export default function AboutPage() {
  return (
    <LandingShell>
      {/* Page hero */}
      <SectionShell band="cream" size="sm">
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: theme.colors.brand, marginBottom: 12,
          }}>
            About Swoop
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 16px', color: theme.neutrals.ink }}>
            Built for the people who run private clubs
          </h1>
          <p style={{ fontSize: 16, color: theme.neutrals.slate, lineHeight: 1.65, margin: 0 }}>
            Most club software tells you what happened. Swoop tells you what to do about it —
            connecting your tee sheet, POS, member CRM, and scheduling into one morning briefing
            that turns operational noise into decisions.
          </p>
        </div>
      </SectionShell>

      <TeamSection />
      <TestimonialsSection />
      <SocialProofSection onCtaClick={toDemoPage} />
      <FaqSection />

      <SectionShell band="dark" size="sm">
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
            See your club's data before you commit.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, maxWidth: 480, margin: '0 auto 24px' }}>
            30-minute pilot call. We connect to Jonas, pull your last 90 days, and show you which members are at risk right now.
          </p>
          <a href="#/contact" onClick={() => { window.location.hash = '#/contact'; }}
            style={{ display: 'inline-block', background: '#F3922D', color: '#fff', fontWeight: 700, fontSize: 16, padding: '14px 32px', borderRadius: 8, textDecoration: 'none' }}>
            Book a Pilot Call →
          </a>
          <p style={{ marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            Or <a href="#/contact" style={{ color: '#F3922D' }}>request a reference call from a current pilot GM →</a>
          </p>
        </div>
      </SectionShell>
    </LandingShell>
  );
}
