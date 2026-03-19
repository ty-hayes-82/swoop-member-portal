import { useEffect, useState } from 'react';
import { theme } from '@/config/theme';
import { useApp } from '@/context/AppContext';

const STORAGE_KEY = 'swoop_last_visit';

function formatTimeAgo(ms) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SinceLastVisit() {
  const { pendingAgentCount } = useApp();
  const [lastVisit, setLastVisit] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setLastVisit(new Date(stored));
    }
    // Update timestamp for next visit
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  }, []);

  if (!lastVisit) return null;

  const elapsed = Date.now() - lastVisit.getTime();
  if (elapsed < 60000) return null; // less than 1 minute, skip

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 14px',
      background: `${theme.colors.info}06`,
      border: `1px solid ${theme.colors.info}20`,
      borderRadius: theme.radius.sm,
      fontSize: theme.fontSize.xs,
      color: theme.colors.textSecondary,
    }}>
      <span style={{ fontWeight: 600 }}>Since your last visit</span>
      <span style={{ color: theme.colors.textMuted }}>({formatTimeAgo(elapsed)})</span>
      {pendingAgentCount > 0 && (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '999px',
          background: `${theme.colors.accent}12`,
          border: `1px solid ${theme.colors.accent}30`,
          color: theme.colors.accent,
          fontWeight: 700,
          fontSize: '11px',
        }}>
          {pendingAgentCount} new action{pendingAgentCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
