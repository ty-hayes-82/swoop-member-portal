import React, { useState } from 'react';
import { useNavigationContext } from '@/context/NavigationContext';
import { theme } from '@/config/theme';

export default function FlowLink({ flowNum, persona, desc }) {
  const { navigate } = useNavigationContext();
  const [hovered, setHovered] = useState(false);

  const style = {
    fontSize: theme.fontSize.xs,
    color: hovered ? theme.colors.accent : theme.colors.textMuted,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 0',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  };

  return (
    <button
      type="button"
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate('storyboard-flows')}
      title={desc || undefined}
    >
      📖 See how {persona} uses this → Flow {flowNum}
    </button>
  );
}
