import { useState } from 'react';
import { theme } from '@/config/theme';

export function AgentThoughtLog({ thoughts = [] }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? thoughts : thoughts.slice(0, 3);

  return (
    <div
      style={{
        background: theme.colors.bgDeep,
        border: `1px solid ${theme.colors.agentCyan}38`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.sm,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map((entry, index) => (
          <div key={`${entry.timestamp}-${index}`} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 10 }}>
            <span style={{ fontFamily: theme.fonts.mono, fontSize: '11px', color: theme.colors.agentCyan }}>
              {entry.timestamp ?? entry.time}
            </span>
            <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
              {entry.text}
            </span>
          </div>
        ))}
      </div>

      {thoughts.length > 3 && (
        <button
          onClick={() => setExpanded((value) => !value)}
          style={{
            marginTop: 8,
            border: 'none',
            background: 'none',
            color: theme.colors.agentCyan,
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 600,
            padding: 0,
          }}
        >
          {expanded ? 'Hide reasoning chain' : `Show full reasoning chain (${thoughts.length})`}
        </button>
      )}
    </div>
  );
}
