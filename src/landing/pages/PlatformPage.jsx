import LandingShell from '@/landing/LandingShell';
import CoreCapabilitiesSection from '@/landing/components/CoreCapabilitiesSection';
import HowItWorksSection from '@/landing/components/HowItWorksSection';
import AgentsSection from '@/landing/components/AgentsSection';
import SaveStorySection from '@/landing/components/SaveStorySection';
import IntegrationsSection from '@/landing/components/IntegrationsSection';
import ComparisonSection from '@/landing/components/ComparisonSection';
import { SectionShell, Button } from '@/landing/ui';
import { theme } from '@/config/theme';

export default function PlatformPage() {
  return (
    <LandingShell>
      <SectionShell
        band="cream"
        eyebrow="Platform"
        title="Every signal. One operating view."
        subtitle="Six AI-powered lenses that connect your tee sheet, CRM, POS, staffing, and revenue — surfaced before 6:15 AM."
      >
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Button size="lg" onClick={() => { window.location.hash = '#/contact'; }}>
            Book the 30-minute walkthrough
          </Button>
        </div>
      </SectionShell>
      <CoreCapabilitiesSection />
      <HowItWorksSection />
      <AgentsSection />
      <SaveStorySection />
      <IntegrationsSection />
      <ComparisonSection />
      <SectionShell band="dark" size="sm">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>
            Ready to see it live?
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, margin: '0 auto 24px', maxWidth: 460 }}>
            30 minutes. Your real questions. We'll show you exactly what Swoop surfaces for a club like yours.
          </p>
          <Button size="lg" onClick={() => { window.location.hash = '#/contact'; }}>
            Book the walkthrough →
          </Button>
        </div>
      </SectionShell>
    </LandingShell>
  );
}
