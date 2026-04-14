import { theme } from '@/config/theme';
import { Button, Eyebrow, LandingImage } from '@/landing/ui';
import HeroArt from '@/landing/assets/HeroArt';
import { photoUrl, photoSrcSet, photoAlt } from '@/landing/assets/photos';

export default function HeroSection({ onDemoClick }) {
  const goToDemoForm = onDemoClick ?? (() => {
    document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  return (
    <section className="landing-section" style={{ paddingTop: 'clamp(48px, 6vw, 96px)' }}>
      <div className="landing-container">
        <div className="landing-hero-grid">
          <div>
            <Eyebrow>The Operating System for Private Clubs</Eyebrow>
            <h1 className="landing-headline">
              Your members get{' '}
              <span style={{ color: theme.colors.accent, fontStyle: 'italic', fontWeight: 600 }}>a concierge.</span>
              <br />
              Your GM gets{' '}
              <span style={{ color: theme.neutrals.ink, fontStyle: 'italic', fontWeight: 600, backgroundImage: `linear-gradient(transparent 62%, rgba(243,146,45,0.25) 62%)` }}>
                a command center.
              </span>
            </h1>
            <p className="landing-subhead">
              Spot at-risk members <strong style={{ color: theme.neutrals.ink, fontWeight: 700 }}>6 days</strong> before
              they resign. Recover <strong style={{ color: theme.neutrals.ink, fontWeight: 700 }}>$74K+</strong> in
              dues a year. Without replacing your tee sheet, CRM, or POS.
            </p>
            <div className="landing-hero-ctas">
              <Button size="lg" onClick={goToDemoForm}>
                Book a 30-Minute Demo
              </Button>
              <Button as="a" href="#/demo/split-screen" variant="ghost" size="lg">
                See a Day in Action
              </Button>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                marginTop: 40,
                flexWrap: 'wrap',
                color: theme.colors.textMuted,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                Live in under 2 weeks
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                No rip-and-replace
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                28 integrations
              </span>
            </div>
          </div>
          <div className="landing-hero-media">
            <LandingImage
              src={photoUrl('heroCourse', 1200)}
              srcSet={photoSrcSet('heroCourse')}
              sizes="(max-width: 960px) 90vw, 40vw"
              alt={photoAlt('heroCourse')}
              eager
              radius={0}
              fallback={<HeroArt />}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
