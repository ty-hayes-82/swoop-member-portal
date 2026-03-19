import { useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { theme } from '@/config/theme';

export default function BackLink({ to = 'daily-briefing', label = 'Back to Cockpit' }) {
  const { navigate } = useNavigation();
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => navigate(to)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: theme.fontSize.xs,
        fontWeight: 600,
        color: hovered ? theme.colors.accent : theme.colors.textMuted,
        padding: '4px 0',
        marginBottom: theme.spacing.sm,
        transition: 'color 0.15s',
      }}
    >
      ← {label}
    </button>
  );
}
