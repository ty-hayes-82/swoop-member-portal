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
    </LandingShell>
  );
}
