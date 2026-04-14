import LandingShell from '@/landing/LandingShell';
import TeamSection from '@/landing/components/TeamSection';
import TestimonialsSection from '@/landing/components/TestimonialsSection';
import SocialProofSection from '@/landing/components/SocialProofSection';
import FaqSection from '@/landing/components/FaqSection';

const toDemoPage = () => { window.location.hash = '#/contact'; };

export default function AboutPage() {
  return (
    <LandingShell>
      <TeamSection />
      <TestimonialsSection />
      <SocialProofSection onCtaClick={toDemoPage} />
      <FaqSection />
    </LandingShell>
  );
}
