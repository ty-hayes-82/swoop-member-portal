import { theme } from '@/config/theme';

const sizes = {
  default: 'landing-section',
  sm: 'landing-section landing-section-sm',
};

const bands = {
  paper: 'landing-band landing-band-paper',
  cream: 'landing-band landing-band-cream',
  sand: 'landing-band landing-band-sand',
  dark: 'landing-band landing-band-dark',
  none: '',
};

const containers = {
  default: 'landing-container',
  wide: 'landing-container landing-container-wide',
  narrow: 'landing-container landing-container-narrow',
};

export default function SectionShell({
  id,
  band = 'none',
  size = 'default',
  container = 'default',
  eyebrow,
  title,
  subtitle,
  align = 'center',
  headerSlot,
  children,
  style,
}) {
  const hasHeader = eyebrow || title || subtitle || headerSlot;
  const Wrapper = band === 'none' ? 'section' : 'section';
  const content = (
    <div className={containers[container]}>
      {hasHeader && (
        <header className={`landing-section-header${align === 'left' ? ' is-left' : ''}`}>
          {eyebrow && <span className="landing-eyebrow">{eyebrow}</span>}
          {title && <h2>{title}</h2>}
          {subtitle && <p>{subtitle}</p>}
          {headerSlot}
        </header>
      )}
      {children}
    </div>
  );

  if (band === 'none') {
    return (
      <Wrapper id={id} className={sizes[size]} style={style}>
        {content}
      </Wrapper>
    );
  }

  return (
    <div className={bands[band]} style={style}>
      <Wrapper id={id} className={sizes[size]}>
        {content}
      </Wrapper>
    </div>
  );
}
