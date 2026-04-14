import { theme } from '@/config/theme';
import LandingShell from '@/landing/LandingShell';
import SocialProofSection from '@/landing/components/SocialProofSection';
import TestimonialsSection from '@/landing/components/TestimonialsSection';
import FaqSection from '@/landing/components/FaqSection';
import { SectionShell } from '@/landing/ui';

const toDemoPage = () => { window.location.hash = '#/contact'; };

export default function AboutPage() {
  return (
    <LandingShell>
      <SectionShell
        band="cream"
        eyebrow="About"
        title="The intelligence behind the intelligence."
        subtitle="Built by a team that has lived club operations — and built the first LLM-native platform for the private club vertical."
      />
      <SocialProofSection onCtaClick={toDemoPage} />
      <TestimonialsSection />
      <FaqSection />
    </LandingShell>
  );
}
