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

function formatCurrency(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function SinceLastVisit({ yesterdayData = null }) {
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

  const showYesterday = yesterdayData && elapsed > 12 * 60 * 60 * 1000; // >12 hours

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: showYesterday ? '10px' : '0',
      padding: showYesterday ? '12px 14px' : '8px 14px',
      background: `${theme.colors.info}06`,
      border: `1px solid ${theme.colors.info}20`,
      borderRadius: theme.radius.sm,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
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

      {/* Yesterday's key metrics — shown when GM has been away >12 hours */}
      {showYesterday && (
        <div style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          paddingTop: '6px',
          borderTop: `1px solid ${theme.colors.info}15`,
        }}>
          {yesterdayData.revenue != null && (
            <div style={{ fontSize: theme.fontSize.xs }}>
              <span style={{ color: theme.colors.textMuted }}>Revenue: </span>
              <span style={{ fontWeight: 700, fontFamily: theme.fonts.mono, color: theme.colors.textPrimary }}>
                {formatCurrency(yesterdayData.revenue)}
              </span>
              {yesterdayData.revenueVsPlan != null && (
                <span style={{
                  marginLeft: 4,
                  fontWeight: 600,
                  color: yesterdayData.revenueVsPlan < 0 ? theme.colors.urgent : theme.colors.success,
                }}>
                  {yesterdayData.revenueVsPlan >= 0 ? '+' : ''}{(yesterdayData.revenueVsPlan * 100).toFixed(0)}% vs plan
                </span>
              )}
            </div>
          )}
          {yesterdayData.rounds != null && (
            <div style={{ fontSize: theme.fontSize.xs }}>
              <span style={{ color: theme.colors.textMuted }}>Rounds: </span>
              <span style={{ fontWeight: 700, fontFamily: theme.fonts.mono, color: theme.colors.textPrimary }}>
                {yesterdayData.rounds}
              </span>
            </div>
          )}
          {yesterdayData.isUnderstaffed && (
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '1px 6px',
              borderRadius: '4px', background: `${theme.colors.urgent}12`,
              color: theme.colors.urgent,
            }}>
              5 complaints filed — understaffed
            </span>
          )}
        </div>
      )}
    </div>
  );
}
