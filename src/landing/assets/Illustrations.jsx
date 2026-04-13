const ORANGE = '#F3922D';
const ORANGE_DEEP = '#D97706';
const INK = '#111111';
const PAPER = '#FFFFFF';

const svgBase = {
  width: '100%',
  height: 'auto',
  display: 'block',
  maxWidth: '100%',
};

export function FlywheelIllustration() {
  return (
    <svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" style={svgBase} role="img" aria-label="Flywheel of connected agents">
      <defs>
        <linearGradient id="fw-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={ORANGE} />
          <stop offset="100%" stopColor={ORANGE_DEEP} />
        </linearGradient>
      </defs>
      <circle cx="160" cy="160" r="130" fill="none" stroke="url(#fw-ring)" strokeWidth="2" strokeDasharray="4 8" opacity="0.5" />
      <circle cx="160" cy="160" r="95" fill="none" stroke={ORANGE} strokeWidth="3" />
      <circle cx="160" cy="160" r="60" fill={INK} />
      <text x="160" y="155" textAnchor="middle" fill={PAPER} fontSize="14" fontWeight="700" fontFamily="'Plus Jakarta Sans', sans-serif">SWOOP</text>
      <text x="160" y="172" textAnchor="middle" fill={ORANGE} fontSize="9" fontWeight="600" fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="1.2">OS</text>

      {/* Six orbiting nodes */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x = 160 + Math.cos(rad) * 95;
        const y = 160 + Math.sin(rad) * 95;
        return (
          <g key={deg}>
            <circle cx={x} cy={y} r="14" fill={PAPER} stroke={ORANGE} strokeWidth="3" />
            <circle cx={x} cy={y} r="5" fill={ORANGE} />
          </g>
        );
      })}

      {/* Motion arcs */}
      <path d="M 50 160 A 110 110 0 0 1 90 75" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M 270 160 A 110 110 0 0 1 230 245" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export function AgentsIllustration() {
  return (
    <svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg" style={svgBase} role="img" aria-label="AI agents collaborating">
      <rect x="20" y="40" width="110" height="80" rx="12" fill={PAPER} stroke={INK} strokeWidth="2" />
      <rect x="30" y="50" width="90" height="6" rx="3" fill={ORANGE} />
      <rect x="30" y="64" width="70" height="4" rx="2" fill={INK} opacity="0.2" />
      <rect x="30" y="74" width="60" height="4" rx="2" fill={INK} opacity="0.2" />
      <circle cx="90" cy="100" r="8" fill={ORANGE} />

      <rect x="190" y="20" width="110" height="80" rx="12" fill={INK} stroke={INK} strokeWidth="2" />
      <rect x="200" y="30" width="90" height="6" rx="3" fill={ORANGE} />
      <rect x="200" y="44" width="70" height="4" rx="2" fill={PAPER} opacity="0.3" />
      <rect x="200" y="54" width="50" height="4" rx="2" fill={PAPER} opacity="0.3" />
      <circle cx="260" cy="80" r="8" fill={ORANGE} />

      <rect x="120" y="140" width="110" height="80" rx="12" fill={PAPER} stroke={INK} strokeWidth="2" />
      <rect x="130" y="150" width="90" height="6" rx="3" fill={ORANGE} />
      <rect x="130" y="164" width="70" height="4" rx="2" fill={INK} opacity="0.2" />
      <rect x="130" y="174" width="60" height="4" rx="2" fill={INK} opacity="0.2" />
      <circle cx="190" cy="200" r="8" fill={ORANGE} />

      {/* Connecting lines */}
      <line x1="130" y1="80" x2="190" y2="60" stroke={ORANGE} strokeWidth="2" strokeDasharray="3 3" />
      <line x1="245" y1="100" x2="200" y2="150" stroke={ORANGE} strokeWidth="2" strokeDasharray="3 3" />
      <line x1="130" y1="110" x2="170" y2="145" stroke={ORANGE} strokeWidth="2" strokeDasharray="3 3" />
    </svg>
  );
}

export function IntegrationsIllustration() {
  const center = { x: 160, y: 160 };
  const radius = 100;
  const nodes = 8;
  return (
    <svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" style={svgBase} role="img" aria-label="Integration hub connecting many systems">
      {[...Array(nodes)].map((_, i) => {
        const rad = (i / nodes) * Math.PI * 2;
        const x = center.x + Math.cos(rad) * radius;
        const y = center.y + Math.sin(rad) * radius;
        return <line key={i} x1={center.x} y1={center.y} x2={x} y2={y} stroke={ORANGE} strokeWidth="1.5" opacity="0.5" strokeDasharray="4 4" />;
      })}
      {[...Array(nodes)].map((_, i) => {
        const rad = (i / nodes) * Math.PI * 2;
        const x = center.x + Math.cos(rad) * radius;
        const y = center.y + Math.sin(rad) * radius;
        return (
          <g key={`n${i}`}>
            <circle cx={x} cy={y} r="18" fill={PAPER} stroke={INK} strokeWidth="2" />
            <circle cx={x} cy={y} r="6" fill={ORANGE} />
          </g>
        );
      })}
      <circle cx={center.x} cy={center.y} r="44" fill={INK} />
      <circle cx={center.x} cy={center.y} r="44" fill="none" stroke={ORANGE} strokeWidth="3" />
      <text x={center.x} y={center.y + 5} textAnchor="middle" fill={PAPER} fontSize="14" fontWeight="700" fontFamily="'Plus Jakarta Sans', sans-serif">HUB</text>
    </svg>
  );
}

export function CommandCenterIllustration() {
  return (
    <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" style={svgBase} role="img" aria-label="Command center dashboard">
      <rect x="10" y="10" width="380" height="240" rx="16" fill={INK} />
      <rect x="10" y="10" width="380" height="36" rx="16" fill="#1a1a1a" />
      <circle cx="28" cy="28" r="5" fill="#ef4444" />
      <circle cx="44" cy="28" r="5" fill="#f59e0b" />
      <circle cx="60" cy="28" r="5" fill="#22c55e" />

      <rect x="26" y="62" width="110" height="80" rx="8" fill="#1a1a1a" stroke={ORANGE} strokeWidth="1" />
      <rect x="36" y="74" width="60" height="6" rx="3" fill={ORANGE} />
      <rect x="36" y="90" width="90" height="4" rx="2" fill={PAPER} opacity="0.3" />
      <rect x="36" y="100" width="70" height="4" rx="2" fill={PAPER} opacity="0.3" />
      <rect x="36" y="115" width="40" height="18" rx="4" fill={ORANGE} />

      <rect x="146" y="62" width="110" height="80" rx="8" fill="#1a1a1a" stroke={PAPER} strokeOpacity="0.2" strokeWidth="1" />
      <polyline points="156,128 172,110 188,118 204,92 220,100 236,80" fill="none" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="236" cy="80" r="3" fill={ORANGE} />

      <rect x="266" y="62" width="108" height="80" rx="8" fill="#1a1a1a" stroke={PAPER} strokeOpacity="0.2" strokeWidth="1" />
      <rect x="276" y="74" width="60" height="6" rx="3" fill={PAPER} opacity="0.4" />
      <text x="276" y="115" fill={ORANGE} fontSize="28" fontWeight="800" fontFamily="'JetBrains Mono', monospace">$251K</text>
      <text x="276" y="130" fill={PAPER} fontSize="9" opacity="0.5" fontFamily="'Plus Jakarta Sans', sans-serif">annualized impact</text>

      <rect x="26" y="160" width="348" height="70" rx="8" fill="#1a1a1a" stroke={PAPER} strokeOpacity="0.2" strokeWidth="1" />
      <rect x="36" y="172" width="12" height="48" rx="2" fill={ORANGE} opacity="0.3" />
      <rect x="56" y="182" width="12" height="38" rx="2" fill={ORANGE} opacity="0.5" />
      <rect x="76" y="166" width="12" height="54" rx="2" fill={ORANGE} opacity="0.7" />
      <rect x="96" y="176" width="12" height="44" rx="2" fill={ORANGE} opacity="0.6" />
      <rect x="116" y="160" width="12" height="60" rx="2" fill={ORANGE} />
      <rect x="136" y="170" width="12" height="50" rx="2" fill={ORANGE} opacity="0.8" />
      <rect x="156" y="180" width="12" height="40" rx="2" fill={ORANGE} opacity="0.5" />
    </svg>
  );
}

export function RoiIllustration() {
  return (
    <svg viewBox="0 0 320 260" xmlns="http://www.w3.org/2000/svg" style={svgBase} role="img" aria-label="Revenue growth chart">
      <defs>
        <linearGradient id="roi-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ORANGE} stopOpacity="0.3" />
          <stop offset="100%" stopColor={ORANGE} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="320" height="260" fill={PAPER} rx="12" />
      <line x1="40" y1="40" x2="40" y2="210" stroke={INK} strokeOpacity="0.15" strokeWidth="1" />
      <line x1="40" y1="210" x2="290" y2="210" stroke={INK} strokeOpacity="0.15" strokeWidth="1" />

      <path d="M 40 190 Q 90 180 130 150 T 220 90 T 290 50 L 290 210 L 40 210 Z" fill="url(#roi-fill)" />
      <path d="M 40 190 Q 90 180 130 150 T 220 90 T 290 50" fill="none" stroke={ORANGE} strokeWidth="3" strokeLinecap="round" />

      <circle cx="290" cy="50" r="8" fill={ORANGE} />
      <circle cx="290" cy="50" r="14" fill={ORANGE} fillOpacity="0.2" />

      <text x="60" y="30" fill={INK} fontSize="12" fontWeight="700" fontFamily="'Plus Jakarta Sans', sans-serif">DUES PROTECTED</text>
      <text x="60" y="246" fill={INK} fillOpacity="0.4" fontSize="10" fontFamily="'Plus Jakarta Sans', sans-serif">Jan</text>
      <text x="285" y="246" fill={INK} fillOpacity="0.4" fontSize="10" fontFamily="'Plus Jakarta Sans', sans-serif">Dec</text>
    </svg>
  );
}

export function CapabilityArt({ variant = 'members' }) {
  const variants = {
    members: (
      <>
        <circle cx="50" cy="60" r="20" fill={ORANGE} opacity="0.9" />
        <circle cx="90" cy="60" r="20" fill={INK} />
        <circle cx="130" cy="60" r="20" fill={ORANGE} opacity="0.5" />
        <rect x="30" y="95" width="120" height="6" rx="3" fill={INK} opacity="0.12" />
        <rect x="30" y="107" width="90" height="6" rx="3" fill={ORANGE} />
      </>
    ),
    demand: (
      <>
        <rect x="30" y="100" width="16" height="30" fill={INK} opacity="0.2" rx="2" />
        <rect x="54" y="80" width="16" height="50" fill={INK} opacity="0.3" rx="2" />
        <rect x="78" y="50" width="16" height="80" fill={ORANGE} rx="2" />
        <rect x="102" y="70" width="16" height="60" fill={INK} opacity="0.3" rx="2" />
        <rect x="126" y="40" width="16" height="90" fill={ORANGE} rx="2" />
      </>
    ),
    fb: (
      <>
        <circle cx="90" cy="80" r="35" fill="none" stroke={INK} strokeWidth="3" />
        <path d="M 90 80 L 90 45 A 35 35 0 0 1 120 97 Z" fill={ORANGE} />
        <circle cx="90" cy="80" r="14" fill={PAPER} />
      </>
    ),
    staffing: (
      <>
        <circle cx="45" cy="70" r="14" fill={ORANGE} />
        <rect x="30" y="88" width="30" height="26" rx="4" fill={ORANGE} />
        <circle cx="90" cy="70" r="14" fill={INK} />
        <rect x="75" y="88" width="30" height="26" rx="4" fill={INK} />
        <circle cx="135" cy="70" r="14" fill={ORANGE} opacity="0.5" />
        <rect x="120" y="88" width="30" height="26" rx="4" fill={ORANGE} opacity="0.5" />
      </>
    ),
    revenue: (
      <>
        <path d="M 30 120 L 60 90 L 90 100 L 120 60 L 150 40" fill="none" stroke={ORANGE} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="150" cy="40" r="6" fill={ORANGE} />
        <text x="90" y="142" textAnchor="middle" fill={INK} fontSize="11" fontWeight="700" fontFamily="'JetBrains Mono', monospace">$251K</text>
      </>
    ),
  };
  return (
    <svg viewBox="0 0 180 150" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 180, height: 'auto' }} role="img" aria-hidden="true">
      {variants[variant] || variants.members}
    </svg>
  );
}
