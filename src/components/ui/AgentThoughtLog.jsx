// components/ui/AgentThoughtLog.jsx
// Contract: thoughts: Array<{time: string, text: string}>, isRunning?: bool
import { useState, useEffect } from 'react';
import { theme } from '@/config/theme';

export function AgentThoughtLog({ thoughts = [], isRunning = false }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= thoughts.length) return;
    const t = setTimeout(() => setVisible(v => v + 1), 120);
    return () => clearTimeout(t);
  }, [visible, thoughts.length]);

  return (
    <div style={{
      background: '#0A0F0C',
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      fontFamily: theme.fonts.mono,
      fontSize: '11px',
      lineHeight: 1.7,
      maxHeight: 220,
      overflowY: 'auto',
      border: `1px solid rgba(34,211,238,0.15)`,
    }}>
      {thoughts.slice(0, visible).map((t, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 2 }}>
          <span style={{ color: 'rgba(34,211,238,0.45)', flexShrink: 0 }}>{t.time}</span>
          <span style={{
            color: t.text.startsWith('MATCH') || t.text.startsWith('CRITICAL') || t.text.startsWith('HIGH')
              ? '#F59E0B'
              : 'rgba(255,255,255,0.65)',
          }}>
            {t.text.startsWith('MATCH') || t.text.startsWith('CRITICAL') || t.text.startsWith('HIGH')
              ? '⚑ ' : ''}
            {t.text}
          </span>
        </div>
      ))}
      {(isRunning || visible < thoughts.length) && (
        <div style={{ color: '#22D3EE', marginTop: 4 }}>
          <span style={{ animation: 'pulse 1s infinite' }}>▋</span>
        </div>
      )}
    </div>
  );
}
