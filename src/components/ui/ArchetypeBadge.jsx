// ArchetypeBadge.jsx — inline archetype label for member name references
// Hard ceiling: 150 lines. Target: 60 lines.

import { theme } from '@/config/theme';

const ARCHETYPES = {
  'Die-Hard Golfer':   { color: theme.colors.chartGolf, icon: '⛳' },  // teal-green — matches chartGolf
  'Social Butterfly':  { color: theme.colors.archetypeRose, icon: '🦋' },  // deep rose — distinct
  'Balanced Active':   { color: theme.colors.chartBlue, icon: '◉'  },  // mid blue — stable
  'Weekend Warrior':   { color: theme.colors.archetypeWeekend, icon: '📅'  },  // warm amber — weekend energy
  'Declining':         { color: theme.colors.archetypeBrown, icon: '📉'  },  // warm brown — fading, NOT urgent red
  'New Member':        { color: theme.colors.archetypeTeal, icon: '★'   },  // deep teal-blue — fresh, NOT healthy green
  'Ghost':             { color: theme.colors.archetypeGhost, icon: '👻'  },  // muted sage — invisible
  'Snowbird':          { color: theme.colors.archetypeSnowbird, icon: '✈'   },  // slate blue — seasonal
};

export default function ArchetypeBadge({ archetype, size = 'sm' }) {
  const def   = ARCHETYPES[archetype] ?? { color: theme.colors.reportSage, icon: '◈' };
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
  ARCHETYPES[archetype]?.color ?? theme.colors.reportSage;
