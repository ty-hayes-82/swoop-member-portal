// ArchetypeBadge.jsx — inline archetype label for member name references
// Hard ceiling: 150 lines. Target: 60 lines.

const ARCHETYPES = {
  'Die-Hard Golfer':   { color: '#2E8B7A', icon: '⛳' },  // teal-green — matches chartGolf
  'Social Butterfly':  { color: '#C2608A', icon: '🦋' },  // deep rose — distinct
  'Balanced Active':   { color: '#2E7BB8', icon: '◉'  },  // mid blue — stable
  'Weekend Warrior':   { color: '#9A6B00', icon: '📅'  },  // warm amber — weekend energy
  'Declining':         { color: '#8B5A2B', icon: '📉'  },  // warm brown — fading, NOT urgent red
  'New Member':        { color: '#1A7A9A', icon: '★'   },  // deep teal-blue — fresh, NOT healthy green
  'Ghost':             { color: '#7A8C7D', icon: '👻'  },  // muted sage — invisible
  'Snowbird':          { color: '#6B7FBF', icon: '✈'   },  // slate blue — seasonal
};

export default function ArchetypeBadge({ archetype, size = 'sm' }) {
  const def   = ARCHETYPES[archetype] ?? { color: '#8BAF8B', icon: '◈' };
  const small = size === 'xs';

  return (
    <span
      title={`Member archetype: ${archetype}`}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           '3px',
        padding:       small ? '1px 5px' : '2px 7px',
        borderRadius:  '4px',
        background:    `${def.color}15`,
        border:        `1px solid ${def.color}30`,
        fontSize:      small ? '10px' : '11px',
        color:         def.color,
        fontWeight:    600,
        whiteSpace:    'nowrap',
        flexShrink:    0,
        letterSpacing: '0.01em',
      }}
    >
      <span style={{ fontSize: small ? '9px' : '10px' }}>{def.icon}</span>
      {archetype}
    </span>
  );
}

// Utility: get archetype color for inline use
export const getArchetypeColor = (archetype) =>
  ARCHETYPES[archetype]?.color ?? '#8BAF8B';
