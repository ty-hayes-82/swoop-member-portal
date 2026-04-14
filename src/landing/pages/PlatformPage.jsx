import LandingShell from '@/landing/LandingShell';
import CoreCapabilitiesSection from '@/landing/components/CoreCapabilitiesSection';
import HowItWorksSection from '@/landing/components/HowItWorksSection';
import AgentsSection from '@/landing/components/AgentsSection';
import SaveStorySection from '@/landing/components/SaveStorySection';
import IntegrationsSection from '@/landing/components/IntegrationsSection';
import ComparisonSection from '@/landing/components/ComparisonSection';
import { SectionShell, Button } from '@/landing/ui';
import { theme } from '@/config/theme';

const toDemoPage = () => { window.location.hash = '#/contact'; };

export default function PlatformPage() {
  return (
    <LandingShell>
      <div id="problem">
        <SectionShell
          band="cream"
          eyebrow="Platform"
          title="Every signal. One operating view."
          subtitle="One dashboard shows which members are drifting, why, and what to do next — assembled from your existing systems overnight."
        >
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Button size="lg" onClick={toDemoPage}>
              Book the 30-minute walkthrough
            </Button>
          </div>
        </SectionShell>
      </div>
      <div id="platform">
        <CoreCapabilitiesSection />
      </div>
      <HowItWorksSection />
      <div id="agents">
        <AgentsSection />
      </div>
      <SaveStorySection />
      {/* Mid-page CTA */}
      <SectionShell band="sand" size="sm">
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.colors.brand || theme.colors.accent, margin: '0 0 12px' }}>
            TYPICAL CLUB LIVE IN 2 WEEKS
          </p>
          <p style={{ fontSize: 20, fontWeight: 700, color: theme.neutrals.ink, margin: '0 0 20px' }}>
            Want to see it with your data?
          </p>
          <Button size="md" onClick={toDemoPage}>
            Book a 30-minute walkthrough →
          </Button>
        </div>
      </SectionShell>
      <div id="integrations">
        <IntegrationsSection />
      </div>
      <div id="compare">
        <ComparisonSection />
      </div>
      <SectionShell band="dark" size="sm">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>
            Ready to see it live?
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, margin: '0 auto 24px', maxWidth: 460 }}>
            30 minutes. Your real questions. We'll show you exactly what Swoop surfaces for a club like yours.
          </p>
          <Button size="lg" onClick={toDemoPage}>
            Book the walkthrough →
          </Button>
        </div>
      </SectionShell>
    </LandingShell>
  );
}
