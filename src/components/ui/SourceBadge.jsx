// SourceBadge.jsx — data provenance chip for stat cards and panel headers
// OS-02: Upgraded from passive system names to cross-system proof
// Shows specific signals + timestamps + source badges (not just system names)
// Props: system (string), signal (string), timestamp (string), size ('sm'|'xs')

const SYSTEM_ICONS = {
  'Tee Sheet':   '⛳',
  'POS':         '🍽',
  'Member CRM':  '★',
  'Scheduling':  '📅',
  'Analytics':   '◉',
  'Weather API': '☁',
  'Complaint Log': '⚠',
  'Email':       '✉',
  'GPS/App':     '📍',
};

export default function SourceBadge({ system, signal, timestamp, size = 'sm' }) {
  const icon     = SYSTEM_ICONS[system] ?? '◈';
  const fontSize = size === 'xs' ? '10px' : '11px';
  const padding  = size === 'xs' ? '2px 6px' : '3px 8px';

  // If signal and timestamp provided, show enhanced proof version
  if (signal && timestamp) {
    return (
      <span
        title={`${system} • ${timestamp}`}
        style={{
          display:       'inline-flex',
          alignItems:    'center',
          gap:           '6px',
          padding:       size === 'xs' ? '4px 8px' : '6px 10px',
          borderRadius:  '6px',
          background:    'var(--bg-deep)',
          border:        '1px solid var(--border)',
          fontSize,
          color:         'var(--text-secondary)',
          fontWeight:    500,
          letterSpacing: '0.01em',
          whiteSpace:    'nowrap',
          flexShrink:    0,
          cursor:        'default',
          userSelect:    'none',
        }}
      >
        <span style={{ fontSize: size === 'xs' ? '10px' : '11px' }}>{icon}</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{signal}</span>
        <span style={{ fontSize: '9px', color: 'var(--text-muted)', opacity: 0.8 }}>
          {timestamp}
        </span>
      </span>
    );
  }

  // Fallback to simple system name badge (backward compatible)
  return (
    <span
      title={`Source: ${system}`}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           '4px',
        padding,
        borderRadius:  '4px',
        background:    'var(--bg-deep)',
        border:        '1px solid var(--border)',
        fontSize,
        color:         'var(--text-muted)',
        fontWeight:    500,
        letterSpacing: '0.02em',
        whiteSpace:    'nowrap',
        flexShrink:    0,
        cursor:        'default',
        userSelect:    'none',
      }}
    >
      <span style={{ fontSize: size === 'xs' ? '9px' : '10px' }}>{icon}</span>
      {system}
    </span>
  );
}

// Multi-source row — renders several SourceBadges inline
// OS-02: Enhanced to support signal + timestamp for cross-system proof
export function SourceBadgeRow({ sources = [], systems = [], size = 'xs' }) {
  // New format: sources = [{ system, signal, timestamp }, ...]
  // Legacy format: systems = ['Tee Sheet', 'POS', ...]
  const items = sources.length ? sources : systems.map(s => ({ system: s }));
  
  if (!items.length) return null;
  
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginRight: '2px' }}>
        {sources.length ? 'Signals:' : 'Source:'}
      </span>
      {items.map((item, idx) => (
        <SourceBadge 
          key={item.system + idx} 
          system={item.system} 
          signal={item.signal}
          timestamp={item.timestamp}
          size={size} 
        />
      ))}
    </div>
  );
}
