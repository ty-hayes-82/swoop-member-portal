import React, { useState } from 'react';
import { useNavigationContext } from '@/context/NavigationContext';
import { theme } from '@/config/theme';

const DISMISS_KEY = 'swoop_flowlink_dismissed';

export default function FlowLink({ flowNum, persona, desc }) {
  const { navigate } = useNavigationContext();
  const [hovered, setHovered] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === 'true'; } catch { return false; }
  });

  const handleDismiss = (e) => {
    e.stopPropagation();
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, 'true'); } catch {}
  };

  // Collapsed icon mode after dismiss
  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => navigate('storyboard-flows')}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={`See how ${persona} uses this → Flow ${flowNum}`}
        style={{
          fontSize: theme.fontSize.xs,
          color: hovered ? theme.colors.accent : theme.colors.textMuted,
          background: hovered ? `${theme.colors.accent}08` : 'none',
          border: `1px solid ${hovered ? theme.colors.accent + '30' : 'transparent'}`,
          borderRadius: theme.radius.sm,
          cursor: 'pointer',
          padding: '3px 8px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.15s',
        }}
      >
        📖
      </button>
    );
  }

  // Full prompt mode (first visit)
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <button
        type="button"
        style={{
          fontSize: theme.fontSize.xs,
          color: hovered ? theme.colors.accent : theme.colors.textMuted,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 0',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => navigate('storyboard-flows')}
        title={desc || undefined}
      >
        📖 See how {persona} uses this → Flow {flowNum}
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        style={{
          fontSize: 11,
          color: theme.colors.textMuted,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 4px',
          opacity: 0.5,
        }}
        title="Dismiss guide prompt"
      >
        ×
      </button>
    </div>
  );
}
