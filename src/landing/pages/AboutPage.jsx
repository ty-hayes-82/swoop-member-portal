import LandingShell from '@/landing/LandingShell';
import TeamSection from '@/landing/components/TeamSection';
import TestimonialsSection from '@/landing/components/TestimonialsSection';
import SocialProofSection from '@/landing/components/SocialProofSection';
import FaqSection from '@/landing/components/FaqSection';
import DemoCtaSection from '@/landing/components/DemoCtaSection';
import { SectionShell } from '@/landing/ui';
import { theme } from '@/config/theme';

export default function AboutPage() {
  return (
    /* Outer div resets any parent flex/height constraints so the landing
       page can scroll normally. global.css sets #root to display:flex /
       height:100% which would clip content on desktop without this. */
    <div style={{ display: 'block', width: '100%', minHeight: '100vh' }}>
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
            <p style={{ fontSize: 16, color: theme.neutrals.slate, lineHeight: 1.65, margin: '0 0 0', maxWidth: '65ch', marginInline: 'auto' }}>
              Most club software tells you what happened. Swoop tells you what to do about it —
              connecting your tee sheet, POS, member CRM, and scheduling into one morning briefing
              that turns operational noise into decisions.
            </p>
            <a href="#/contact" style={{
              display: 'inline-block', background: '#F3922D', color: '#fff',
              fontWeight: 700, fontSize: 16, padding: '14px 32px',
              borderRadius: 8, textDecoration: 'none', marginTop: 24,
            }}>
              Book a 15-min coffee chat
            </a>
          </div>
        </SectionShell>

        <TeamSection />

        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <a href="#/platform" style={{ fontSize: 16, fontWeight: 600, color: '#F3922D', textDecoration: 'none' }}>
            See how the platform works →
          </a>
        </div>

        <TestimonialsSection />
        <SocialProofSection />
        <FaqSection />

        <DemoCtaSection />
      </LandingShell>
    </div>
  );
}
