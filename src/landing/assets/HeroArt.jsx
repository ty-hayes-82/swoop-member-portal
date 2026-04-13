export default function HeroArt() {
  return (
    <svg
      viewBox="0 0 600 750"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Stylized view of a golf course at dusk"
      style={{ width: '100%', height: '100%', display: 'block' }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="55%" stopColor="#2a1f18" />
          <stop offset="100%" stopColor="#4a2d15" />
        </linearGradient>
        <linearGradient id="hero-sun" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#F3922D" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#F3922D" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hero-fairway" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2d3921" />
          <stop offset="100%" stopColor="#141a0e" />
        </linearGradient>
        <linearGradient id="hero-hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d4a2c" />
          <stop offset="100%" stopColor="#1f2815" />
        </linearGradient>
        <linearGradient id="hero-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F3922D" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0F0F0F" />
        </linearGradient>
        <radialGradient id="hero-glow" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor="#F3922D" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#F3922D" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="600" height="750" fill="url(#hero-sky)" />
      <rect width="600" height="750" fill="url(#hero-glow)" />

      {/* Sun */}
      <circle cx="420" cy="280" r="70" fill="url(#hero-sun)" />
      <circle cx="420" cy="280" r="42" fill="#F3922D" fillOpacity="0.85" />

      {/* Distant hills */}
      <path
        d="M0 420 Q 120 380 220 410 T 440 395 T 600 420 L 600 480 L 0 480 Z"
        fill="url(#hero-hill)"
        opacity="0.7"
      />
      <path
        d="M0 460 Q 150 430 280 450 T 520 445 T 600 460 L 600 520 L 0 520 Z"
        fill="url(#hero-hill)"
      />

      {/* Water / reflection pond */}
      <path
        d="M0 520 Q 200 505 400 518 T 600 520 L 600 590 L 0 590 Z"
        fill="url(#hero-water)"
      />
      <line x1="380" y1="545" x2="460" y2="545" stroke="#F3922D" strokeOpacity="0.35" strokeWidth="1" />
      <line x1="350" y1="560" x2="500" y2="560" stroke="#F3922D" strokeOpacity="0.25" strokeWidth="1" />

      {/* Fairway */}
      <path
        d="M0 590 Q 300 555 600 590 L 600 750 L 0 750 Z"
        fill="url(#hero-fairway)"
      />

      {/* Flag */}
      <line x1="300" y1="500" x2="300" y2="610" stroke="#EFEFEF" strokeWidth="2" />
      <path d="M300 500 L 340 512 L 300 524 Z" fill="#F3922D" />

      {/* Foreground silhouette - golfer */}
      <g transform="translate(120 590)" opacity="0.95">
        <circle cx="0" cy="0" r="10" fill="#0a0a0a" />
        <rect x="-7" y="8" width="14" height="42" rx="4" fill="#0a0a0a" />
        <line x1="6" y1="14" x2="30" y2="-6" stroke="#0a0a0a" strokeWidth="4" strokeLinecap="round" />
        <line x1="30" y1="-6" x2="34" y2="-40" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Grain noise (subtle circles) */}
      <g opacity="0.06" fill="#FFFFFF">
        <circle cx="80" cy="150" r="1" />
        <circle cx="220" cy="90" r="1" />
        <circle cx="380" cy="120" r="1" />
        <circle cx="480" cy="200" r="1" />
        <circle cx="140" cy="240" r="1" />
        <circle cx="540" cy="160" r="1" />
      </g>
    </svg>
  );
}
