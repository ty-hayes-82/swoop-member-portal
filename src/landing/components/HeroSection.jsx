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
            <Eyebrow>Private club intelligence · built for GMs</Eyebrow>
            <h1 className="landing-headline">
              Your club runs on{' '}
              <span style={{ color: theme.colors.accent, fontStyle: 'italic', fontWeight: 600 }}>four systems.</span>
              <br />
              <span style={{ color: theme.neutrals.ink, fontStyle: 'italic', fontWeight: 600, backgroundImage: `linear-gradient(transparent 62%, rgba(243,146,45,0.25) 62%)` }}>
                None of them talk to each other.
              </span>
            </h1>
            <p className="landing-subhead">
              Swoop connects your tee sheet, CRM, and POS to surface at-risk members and protect{' '}
              <strong style={{ color: theme.neutrals.ink, fontWeight: 700 }}>$74K+</strong> in dues a year.
              Live in two weeks. No rip-and-replace.
            </p>
            <div className="landing-hero-ctas">
              <Button size="lg" onClick={goToDemoForm}>
                Book the 30-minute walkthrough
              </Button>
              <Button as="a" href="#/platform" variant="ghost" size="lg">
                See it in action →
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
