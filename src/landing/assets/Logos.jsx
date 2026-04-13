const base = {
  width: '100%',
  height: '100%',
  display: 'block',
  color: '#0F0F0F',
};

export function LogoEvergreen() {
  return (
    <svg viewBox="0 0 160 32" xmlns="http://www.w3.org/2000/svg" style={base} role="img" aria-label="Evergreen Club">
      <circle cx="14" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M14 6 L20 22 L8 22 Z" fill="currentColor" />
      <text x="32" y="21" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="14" fontWeight="800" fill="currentColor" letterSpacing="0.5">EVERGREEN</text>
    </svg>
  );
}

export function LogoRoyalOak() {
  return (
    <svg viewBox="0 0 160 32" xmlns="http://www.w3.org/2000/svg" style={base} role="img" aria-label="Royal Oak Country Club">
      <rect x="4" y="6" width="20" height="20" rx="10" fill="currentColor" />
      <text x="14" y="22" textAnchor="middle" fontFamily="Georgia, serif" fontSize="14" fontWeight="700" fill="#FFFFFF" fontStyle="italic">R</text>
      <text x="32" y="16" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="10" fontWeight="700" fill="currentColor" letterSpacing="1.5">ROYAL OAK</text>
      <text x="32" y="28" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="8" fontWeight="500" fill="currentColor" opacity="0.6" letterSpacing="0.5">COUNTRY CLUB</text>
    </svg>
  );
}

export function LogoBaywood() {
  return (
    <svg viewBox="0 0 160 32" xmlns="http://www.w3.org/2000/svg" style={base} role="img" aria-label="Baywood Links">
      <path d="M4 22 Q 12 6 20 22 Q 16 14 12 22 Z" fill="currentColor" />
      <text x="28" y="22" fontFamily="Georgia, serif" fontSize="16" fontWeight="700" fill="currentColor" fontStyle="italic">Baywood</text>
    </svg>
  );
}

export function LogoStonebrook() {
  return (
    <svg viewBox="0 0 160 32" xmlns="http://www.w3.org/2000/svg" style={base} role="img" aria-label="Stonebrook Golf">
      <rect x="4" y="8" width="16" height="16" fill="currentColor" />
      <rect x="8" y="12" width="8" height="8" fill="#FFFFFF" />
      <text x="26" y="22" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="13" fontWeight="800" fill="currentColor" letterSpacing="-0.3">STONEBROOK</text>
    </svg>
  );
}

export function LogoHillcrest() {
  return (
    <svg viewBox="0 0 160 32" xmlns="http://www.w3.org/2000/svg" style={base} role="img" aria-label="Hillcrest Club">
      <path d="M4 22 L 10 10 L 16 18 L 22 8 L 28 22 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <text x="34" y="22" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="14" fontWeight="700" fill="currentColor" letterSpacing="0.3">Hillcrest</text>
    </svg>
  );
}

export function LogoMeridian() {
  return (
    <svg viewBox="0 0 160 32" xmlns="http://www.w3.org/2000/svg" style={base} role="img" aria-label="Meridian Club">
      <circle cx="14" cy="16" r="10" fill="currentColor" />
      <circle cx="14" cy="16" r="5" fill="#FFFFFF" />
      <text x="30" y="22" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="14" fontWeight="800" fill="currentColor" letterSpacing="0.8">MERIDIAN</text>
    </svg>
  );
}

export const trustLogos = [
  { key: 'evergreen', Component: LogoEvergreen },
  { key: 'royaloak', Component: LogoRoyalOak },
  { key: 'baywood', Component: LogoBaywood },
  { key: 'stonebrook', Component: LogoStonebrook },
  { key: 'hillcrest', Component: LogoHillcrest },
  { key: 'meridian', Component: LogoMeridian },
];
