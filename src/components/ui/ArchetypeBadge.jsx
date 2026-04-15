// ArchetypeBadge.jsx — inline archetype label for member name references

const ARCHETYPES = {
  'Die-Hard Golfer':   { colorCls: 'text-success-600 bg-success-50 border-success-200', icon: '\u26F3' },
  'Social Butterfly':  { colorCls: 'text-theme-pink-500 bg-pink-50 border-pink-200', icon: '\uD83E\uDD8B' },
  'Balanced Active':   { colorCls: 'text-blue-light-500 bg-blue-light-50 border-blue-light-200', icon: '\u25C9' },
  'Weekend Warrior':   { colorCls: 'text-orange-500 bg-orange-50 border-orange-200', icon: '\uD83D\uDCC5' },
  'Declining':         { colorCls: 'text-warning-600 bg-warning-50 border-warning-200', icon: '\uD83D\uDCC9' },
  'New Member':        { colorCls: 'text-brand-500 bg-brand-50 border-brand-200', icon: '\u2605' },
  'Ghost':             { colorCls: 'text-swoop-text-muted bg-swoop-row border-swoop-border', icon: '\uD83D\uDC7B' },
  'Snowbird':          { colorCls: 'text-blue-light-600 bg-blue-light-50 border-blue-light-200', icon: '\u2708' },
};

const DEFAULT = { colorCls: 'text-swoop-text-muted bg-swoop-row border-swoop-border', icon: '\u25C8' };

export default function ArchetypeBadge({ archetype, size = 'sm' }) {
  const def   = ARCHETYPES[archetype] ?? DEFAULT;
  const small = size === 'xs';

  return (
    <span className={`inline-flex items-center gap-[3px] rounded border font-semibold whitespace-nowrap shrink-0 tracking-tight ${def.colorCls} ${small ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-[11px]'}`}>
      <span className={small ? 'text-[9px]' : 'text-[10px]'}>{def.icon}</span>
      {archetype}
    </span>
  );
}

// Utility: get archetype color class for inline use
export const getArchetypeColor = (archetype) =>
  ARCHETYPES[archetype]?.colorCls ?? DEFAULT.colorCls;
