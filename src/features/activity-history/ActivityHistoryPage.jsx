import { useState, useEffect, useCallback } from 'react';
import { theme } from '@/config/theme';
import PageTransition from '@/components/ui/PageTransition';

const ACTION_TYPE_CONFIG = {
  approve:       { label: 'Approved',      color: '#22c55e', icon: '✓' },
  dismiss:       { label: 'Dismissed',     color: '#ef4444', icon: '✕' },
  snooze:        { label: 'Snoozed',       color: '#f59e0b', icon: '⏸' },
  call:          { label: 'Call',           color: '#3b82f6', icon: '📞' },
  note:          { label: 'Note',           color: '#8b5cf6', icon: '✉' },
  task:          { label: 'Task',           color: '#06b6d4', icon: '☑' },
  email:         { label: 'Email',          color: '#ec4899', icon: '📧' },
  campaign:      { label: 'Campaign',       color: '#f97316', icon: '📣' },
  playbook:      { label: 'Playbook',       color: '#14b8a6', icon: '📋' },
  escalate:      { label: 'Escalated',      color: '#ef4444', icon: '⚡' },
  flag:          { label: 'Flagged',        color: '#f59e0b', icon: '🚩' },
  feedback:      { label: 'Feedback',       color: '#8b5cf6', icon: '💬' },
  confirm:       { label: 'Confirmation',   color: '#22c55e', icon: '📅' },
  reassign:      { label: 'Reassignment',   color: '#3b82f6', icon: '🔄' },
  toggle_agent:  { label: 'Agent Toggle',   color: '#06b6d4', icon: '🤖' },
  config_agent:  { label: 'Agent Config',   color: '#6b7280', icon: '⚙' },
  deploy:        { label: 'Deploy',         color: '#f97316', icon: '🚀' },
};

function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ActivityHistoryPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [clearing, setClearing] = useState(false);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterType === 'all' ? '/api/activity?limit=200' : `/api/activity?type=${filterType}&limit=200`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch {
      // silent fail
    }
    setLoading(false);
  }, [filterType]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleClear = async () => {
    if (!window.confirm('Clear all activity history? This cannot be undone.')) return;
    setClearing(true);
    try {
      const res = await fetch('/api/activity', {
        method: 'DELETE',
      });
      if (res.ok) {
        setActivities([]);
      }
    } catch {
      // silent fail
    }
    setClearing(false);
  };

  const uniqueTypes = [...new Set(activities.map((a) => a.action_type))].sort();

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: theme.spacing.md,
        }}>
          <div>
            <h2 style={{ fontSize: theme.fontSize.xl, fontWeight: 700, color: theme.colors.textPrimary, margin: 0, fontFamily: theme.fonts.serif }}>
              Activity History
            </h2>
            <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: '4px 0 0' }}>
              Every action taken in the dashboard is logged here. {activities.length} action{activities.length !== 1 ? 's' : ''} recorded.
            </p>
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <button
              onClick={fetchActivities}
              style={{
                padding: '8px 16px',
                borderRadius: theme.radius.sm,
                border: `1px solid ${theme.colors.border}`,
                background: theme.colors.bgCard,
                color: theme.colors.textPrimary,
                fontSize: theme.fontSize.xs,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
            <button
              onClick={handleClear}
              disabled={clearing || activities.length === 0}
              style={{
                padding: '8px 16px',
                borderRadius: theme.radius.sm,
                border: `1px solid ${theme.colors.urgent}40`,
                background: `${theme.colors.urgent}10`,
                color: theme.colors.urgent,
                fontSize: theme.fontSize.xs,
                fontWeight: 700,
                cursor: clearing || activities.length === 0 ? 'default' : 'pointer',
                opacity: clearing || activities.length === 0 ? 0.5 : 1,
              }}
            >
              {clearing ? 'Clearing...' : 'Clear All History'}
            </button>
          </div>
        </div>

        {/* Filter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, fontWeight: 600 }}>Filter:</span>
          <button
            onClick={() => setFilterType('all')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${filterType === 'all' ? theme.colors.accent : theme.colors.border}`,
              background: filterType === 'all' ? `${theme.colors.accent}12` : 'transparent',
              color: filterType === 'all' ? theme.colors.accent : theme.colors.textMuted,
              fontSize: '11px',
              fontWeight: filterType === 'all' ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            All
          </button>
          {uniqueTypes.map((type) => {
            const cfg = ACTION_TYPE_CONFIG[type] || { label: type, color: '#6b7280', icon: '?' };
            const active = filterType === type;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${active ? cfg.color : theme.colors.border}`,
                  background: active ? `${cfg.color}15` : 'transparent',
                  color: active ? cfg.color : theme.colors.textMuted,
                  fontSize: '11px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{cfg.icon}</span>
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Activity list */}
        {loading ? (
          <div style={{ padding: theme.spacing.xl, textAlign: 'center', color: theme.colors.textMuted }}>Loading...</div>
        ) : activities.length === 0 ? (
          <div style={{
            padding: theme.spacing.xl,
            textAlign: 'center',
            color: theme.colors.textMuted,
            background: theme.colors.bgCard,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md,
          }}>
            No actions recorded yet. Use the dashboard to trigger actions — they will appear here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {activities.map((a) => {
              const cfg = ACTION_TYPE_CONFIG[a.action_type] || { label: a.action_type, color: '#6b7280', icon: '?' };
              const meta = typeof a.meta === 'string' ? JSON.parse(a.meta) : (a.meta || {});
              return (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    background: theme.colors.bgCard,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.sm,
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: `${cfg.color}15`,
                    border: `1px solid ${cfg.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    flexShrink: 0,
                  }}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: `${cfg.color}15`,
                        color: cfg.color,
                      }}>
                        {cfg.label}
                      </span>
                      {a.action_subtype && (
                        <span style={{ fontSize: '10px', color: theme.colors.textMuted }}>
                          / {a.action_subtype}
                        </span>
                      )}
                      {a.member_name && (
                        <span style={{ fontSize: theme.fontSize.xs, fontWeight: 600, color: theme.colors.textPrimary }}>
                          {a.member_name}
                        </span>
                      )}
                    </div>
                    {a.description && (
                      <div style={{
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.textSecondary,
                        marginTop: '2px',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {a.description}
                      </div>
                    )}
                    {Object.keys(meta).length > 0 && (
                      <div style={{
                        fontSize: '10px',
                        color: theme.colors.textMuted,
                        marginTop: '3px',
                        fontFamily: theme.fonts.mono,
                      }}>
                        {Object.entries(meta).slice(0, 4).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ')}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div style={{
                    fontSize: '11px',
                    color: theme.colors.textMuted,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {formatTimeAgo(a.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
