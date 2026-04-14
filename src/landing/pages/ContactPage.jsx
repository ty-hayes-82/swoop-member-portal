import LandingShell from '@/landing/LandingShell';
import DemoCtaSection from '@/landing/components/DemoCtaSection';
import { SectionShell } from '@/landing/ui';

export default function ContactPage() {
  return (
    <LandingShell>
      <SectionShell
        band="paper"
        eyebrow="Contact"
        title="Book a live walkthrough."
        subtitle="30 minutes. We connect to your systems, show you your data, and answer every question. No commitment required."
      />
      <DemoCtaSection />
    </LandingShell>
  );
}
