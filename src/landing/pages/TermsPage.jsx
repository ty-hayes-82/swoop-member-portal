import LandingShell from '@/landing/LandingShell';
import { SectionShell } from '@/landing/ui';

export default function TermsPage() {
  return (
    <LandingShell>
      <SectionShell band="cream" eyebrow="Legal" title="Terms of Service">
        <div style={{ maxWidth: 720, margin: '0 auto', lineHeight: 1.7 }}>
          <p>Last updated: April 2026.</p>
          <h3>Scope</h3>
          <p>These terms govern use of the Swoop platform by private golf clubs. Founding-partner agreements supersede these terms where they conflict.</p>
          <h3>Data handling</h3>
          <p>Swoop acts as a data processor. Clubs retain ownership and control of all member data. See our Privacy Policy for details.</p>
          <h3>Cancellation</h3>
          <p>Cancel any time. No long-term commitment required. Data export provided within 5 business days of cancellation request.</p>
          <h3>Contact</h3>
          <p>Questions? Email <a href="mailto:legal@swoopgolf.com" style={{ color: '#F3922D' }}>legal@swoopgolf.com</a></p>
        </div>
      </SectionShell>
    </LandingShell>
  );
}
