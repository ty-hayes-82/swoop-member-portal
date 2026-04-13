import { theme } from '@/config/theme';
import { photoUrl, photoAlt } from '@/landing/assets/photos';

export default function PhotoBand({
  photoKey = 'fairwayGreen',
  headline,
  kicker,
  height = 260,
}) {
  return (
    <section
      className="landing-band"
      aria-label={photoAlt(photoKey)}
      style={{
        position: 'relative',
        minHeight: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        padding: '48px 24px',
        backgroundImage: `
          linear-gradient(90deg, rgba(15,15,15,0.85) 0%, rgba(15,15,15,0.35) 50%, rgba(15,15,15,0.78) 100%),
          url(${photoUrl(photoKey, 1600)})
        `,
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
      }}
    >
      <div
        className="landing-container"
        style={{
          position: 'relative',
          textAlign: 'center',
          maxWidth: 860,
        }}
      >
        {kicker && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: theme.colors.accent,
              marginBottom: 14,
            }}
          >
            {kicker}
          </div>
        )}
        <h3
          style={{
            fontSize: 'clamp(26px, 3.5vw, 40px)',
            fontWeight: 700,
            color: '#FFFFFF',
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            textWrap: 'balance',
          }}
        >
          {headline}
        </h3>
      </div>
    </section>
  );
}
