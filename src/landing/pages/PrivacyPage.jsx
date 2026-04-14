import LandingShell from '@/landing/LandingShell';
import { SectionShell } from '@/landing/ui';

export default function PrivacyPage() {
  return (
    <LandingShell>
      <SectionShell band="cream" eyebrow="Legal" title="Privacy Policy">
        <div style={{ maxWidth: 720, margin: '0 auto', lineHeight: 1.7 }}>
          <p>Last updated: April 2026.</p>
          <h3>Data we collect</h3>
          <p>We collect club operational data (tee sheet, POS, CRM) only as authorized by the General Manager. Member PII is processed under a mutual NDA and never shared across pilot clubs.</p>
          <h3>Data ownership</h3>
          <p>Your club owns all data. We are a processor, not a controller. All club data is deleted within 30 days of contract termination upon request.</p>
          <h3>Security</h3>
          <p>AES-256 encryption at rest. TLS 1.3 in transit. SOC 2 Type II audit in progress (target Q3 2026).</p>
          <h3>Contact</h3>
          <p>Questions? Email <a href="mailto:legal@swoopgolf.com" style={{ color: '#F3922D' }}>legal@swoopgolf.com</a></p>
        </div>
      </SectionShell>
    </LandingShell>
  );
}
