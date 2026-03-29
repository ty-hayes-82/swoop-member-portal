import { theme } from '@/config/theme';
import { getArchetypeProfiles } from '@/services/memberService';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge';

const SEGMENT_COUNTS = { all: 300, 'at-risk': 47, healthy: 218 };

export function SegmentFilter({ segment, onChange }) {
  const options = [
    { key: 'all', label: 'All Members' },
    { key: 'at-risk', label: 'At-Risk Only' },
    { key: 'healthy', label: 'Healthy Only' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: theme.spacing.md }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, fontWeight: 600 }}>Showing:</span>
        <div style={{ display: 'flex', background: theme.colors.bgDeep, borderRadius: theme.radius.md, padding: '3px', border: `1px solid ${theme.colors.border}` }}>
          {options.map(({ key, label }) => (
            <button key={key} onClick={() => onChange(key)} style={{
              padding: '5px 14px', borderRadius: '6px', fontSize: theme.fontSize.xs, fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: segment === key ? theme.colors.bgCard : 'transparent',
              color: segment === key ? theme.colors.textPrimary : theme.colors.textMuted,
              boxShadow: segment === key ? theme.shadow.sm : 'none',
            }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
        Based on your club's data: last 12 months, {SEGMENT_COUNTS[segment]} members
      </div>
    </div>
  );
}

export function ArchetypeFilter({ archetype, onChange }) {
  const profiles = getArchetypeProfiles();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: theme.spacing.md }}>
      <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, fontWeight: 600 }}>Filter by archetype:</span>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {profiles.map((p) => {
          const isActive = archetype === p.archetype;
          return (
            <button
              key={p.archetype}
              onClick={() => onChange(isActive ? null : p.archetype)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${isActive ? theme.colors.accent : theme.colors.border}`,
                background: isActive ? `${theme.colors.accent}12` : 'transparent',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? theme.colors.accent : theme.colors.textSecondary,
                transition: 'all 0.15s',
              }}
            >
              <ArchetypeBadge archetype={p.archetype} size="xs" />
              <span style={{ fontSize: 10, color: theme.colors.textMuted }}>({p.count})</span>
            </button>
          );
        })}
        {archetype && (
          <button
            onClick={() => onChange(null)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${theme.colors.border}`,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 11,
              color: theme.colors.textMuted,
            }}
          >
            Clear ×
          </button>
        )}
      </div>
    </div>
  );
}
