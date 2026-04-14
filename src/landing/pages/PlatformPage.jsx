import LandingShell from '@/landing/LandingShell';
import ProblemSection from '@/landing/components/ProblemSection';
import SaveStorySection from '@/landing/components/SaveStorySection';
import CoreCapabilitiesSection from '@/landing/components/CoreCapabilitiesSection';
import AgentsSection from '@/landing/components/AgentsSection';
import MemberExperienceSection from '@/landing/components/MemberExperienceSection';
import PhotoBand from '@/landing/components/PhotoBand';
import IntegrationsSection from '@/landing/components/IntegrationsSection';
import ComparisonSection from '@/landing/components/ComparisonSection';
import { SectionShell, Button } from '@/landing/ui';

export default function PlatformPage() {
  return (
    <LandingShell>
      <SectionShell
        band="cream"
        eyebrow="Platform"
        title="Every signal. One operating view."
        subtitle="Five AI-powered lenses that connect your tee sheet, CRM, POS, staffing, and revenue into a single intelligence layer — delivered before 6:15 AM."
      >
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Button size="lg" onClick={() => { window.location.hash = '#/contact'; }}>
            Book the 30-minute walkthrough
          </Button>
        </div>
      </SectionShell>
      <ProblemSection />
      <SaveStorySection />
      <CoreCapabilitiesSection />
      <AgentsSection />
      <MemberExperienceSection />
      <PhotoBand
        photoKey="fairwayGreen"
        kicker="One operating view"
        headline="Every signal. Every system. One clubhouse of intelligence."
      />
      <IntegrationsSection />
      <ComparisonSection />
    </LandingShell>
  );
}
