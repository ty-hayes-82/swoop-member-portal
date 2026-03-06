// TierBadge — Priority / Standard / Roadmap label chip for vendor catalog
// Props: tier (1 | 2 | 3), size ('sm' | 'md', default 'sm')
// Color rule: all colors via theme.colors only — no hardcoded hex
import { theme } from '@/config/theme';

const TIER = {
  1: { label: 'Priority', colorKey: 'operations' },  // deep green
  2: { label: 'Standard', colorKey: 'briefing'    },  // deep blue
  3: { label: 'Roadmap',  colorKey: 'textMuted'   },  // neutral grey
};

export default function TierBadge({ tier = 1, size = 'sm' }) {
  const cfg   = TIER[tier] ?? TIER[1];
  const color = theme.colors[cfg.colorKey];
  const isMd  = size === 'md';

  return (
    <span style={{
      display:       'inline-flex',
      alignItems:    'center',
      gap:           '4px',
      fontSize:      isMd ? theme.fontSize.xs : '10px',
      fontWeight:    700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color,
      background:    `${color}18`,
      border:        `1px solid ${color}40`,
      padding:       isMd ? '3px 8px' : '2px 6px',
      borderRadius:  theme.radius.sm,
      whiteSpace:    'nowrap',
    }}>
      <span style={{
        width:        isMd ? '7px' : '5px',
        height:       isMd ? '7px' : '5px',
        borderRadius: '50%',
        background:   color,
        flexShrink:   0,
      }} />
      {cfg.label}
    </span>
  );
}
