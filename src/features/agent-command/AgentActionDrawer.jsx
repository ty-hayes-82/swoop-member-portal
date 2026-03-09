import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { theme } from '@/config/theme';
import { AGENT_ACTION_TYPES } from '@/config/actionTypes';
import { getMemberProfile } from '@/services/memberService';
import { useApp } from '@/context/AppContext';

const PRIORITY_BADGES = {
  high: { label: 'High Priority', color: theme.colors.urgent },
  medium: { label: 'Medium Priority', color: theme.colors.warning },
  low: { label: 'Low Priority', color: theme.colors.agentDismissed },
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => {
      if (typeof window === 'undefined') return;
      setIsMobile(window.matchMedia('(max-width: 720px)').matches);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

const Sparkline = ({ data = [] }) => {
  if (!data.length) {
    return <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>No trend data</div>;
  }
  const width = 160;
  const height = 48;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const step = data.length > 1 ? width / (data.length - 1) : width;
  const points = data
    .map((value, idx) => {
      const x = idx * step;
      const y = height - ((value - min) / span) * height;
      return `${idx === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={points} fill="none" stroke={theme.colors.agentCyan} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
};

export function AgentActionDrawer({ action, onClose, onApprove, onDismiss }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const isMobile = useIsMobile();
  const { showToast } = useApp();

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!action) return null;

  const typeMeta = AGENT_ACTION_TYPES[action.actionType] ?? { icon: '⬡', label: action.actionType, color: theme.colors.agentCyan };
  const priority = PRIORITY_BADGES[action.priority] ?? PRIORITY_BADGES.medium;
  const profile = getMemberProfile(action.memberId);

  const [callNotes, setCallNotes] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [smsDraft, setSmsDraft] = useState('');

  useEffect(() => {
    const defaultCall = profile?.drafts?.callScript?.length
      ? `• ${profile.drafts.callScript.join('\n• ')}`
      : '';
    setCallNotes(defaultCall);
    setEmailBody(profile?.drafts?.emailBody ?? '');
    setSmsDraft(profile?.drafts?.smsDraft ?? '');
  }, [profile?.memberId]);

  const auditTrail = useMemo(() => {
    const base = action.auditTrail ?? [];
    if (action.status !== 'pending') {
      return [...base, { id: 'final', status: action.status, owner: 'GM', timestamp: action.timestamp }];
    }
    return base;
  }, [action]);

  const handleClose = () => {
    setIsAnimating(false);
    window.setTimeout(() => onClose?.(), 220);
  };

  const performApprove = (label) => {
    onApprove?.(label);
    handleClose();
  };

  const performDismiss = (label) => {
    const reason = window.prompt('Dismiss reason (required):', action.dismissalReason ?? '');
    if (!reason || !reason.trim()) {
      showToast('Dismissal reason is required.', 'warning');
      return;
    }
    onDismiss?.(`${label} · ${reason.trim()}`);
    handleClose();
  };

  const handleSnooze = () => {
    showToast('Snoozed for 2 hours. The agent will re-surface this if still relevant.', 'info');
    handleClose();
  };

  const panelBase = {
    position: 'fixed',
    background: theme.colors.white,
    boxShadow: '0 12px 40px rgba(15, 23, 42, 0.25)',
    borderLeft: `1px solid ${theme.colors.border}`,
    borderTopLeftRadius: isMobile ? theme.radius.lg : 0,
    borderTopRightRadius: isMobile ? theme.radius.lg : 0,
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    transition: 'transform 0.25s ease',
    zIndex: 1002,
  };

  const panelStyle = isMobile
    ? {
        ...panelBase,
        left: 0,
        right: 0,
        bottom: 0,
        height: '85vh',
        transform: isAnimating ? 'translateY(0)' : 'translateY(100%)',
      }
    : {
        ...panelBase,
        top: 0,
        right: 0,
        width: '420px',
        height: '100vh',
        transform: isAnimating ? 'translateX(0)' : 'translateX(105%)',
      };

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(5, 7, 16, 0.45)',
    opacity: isAnimating ? 1 : 0,
    transition: 'opacity 0.2s ease',
    zIndex: 1001,
  };

  const sectionStyle = {
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    background: theme.colors.bgCard,
  };

  const renderContact = () => {
    if (!profile?.contact) return 'No contact info available.';
    const { phone, email, preferredChannel, lastOutreach } = profile.contact;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: theme.fontSize.sm }}>
        <span><strong>Phone:</strong> {phone ?? '—'}</span>
        <span><strong>Email:</strong> {email ?? '—'}</span>
        <span><strong>Preferred channel:</strong> {preferredChannel ?? action.recommendedChannel ?? '—'}</span>
        <span><strong>Last outreach:</strong> {formatDateTime(lastOutreach)}</span>
      </div>
    );
  };

  const renderRiskSignals = () => {
    const signals = profile?.riskSignals ?? [];
    if (!signals.length) return <span style={{ fontSize: theme.fontSize.sm }}>No active risk signals.</span>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {signals.map((signal) => (
          <div
            key={signal.id}
            style={{
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.sm,
              padding: '10px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600 }}>{signal.label}</div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{formatDateTime(signal.timestamp)}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: theme.fontSize.xs }}>
              <span style={{ display: 'block', fontWeight: 600 }}>{signal.source}</span>
              <span style={{ color: theme.colors.agentCyan }}>{signal.confidence ?? ''}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderHistory = () => {
    const events = profile?.activity ?? [];
    if (!events.length) return <span style={{ fontSize: theme.fontSize.sm }}>No recent activity recorded.</span>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {events.slice(0, 10).map((event) => (
          <div key={event.id} style={{ display: 'flex', gap: 10 }}>
            <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, minWidth: 120 }}>{event.timestamp}</span>
            <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>
              <strong>{event.type}:</strong> {event.detail}
            </span>
          </div>
        ))}
      </div>
    );
  };


  const memberSnapshot = profile ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      <div>
        <div style={{ fontSize: theme.fontSize.md, fontWeight: 700 }}>{profile.name}</div>
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
          {profile.tier} · Joined {profile.joinDate}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
        <div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Health Score</div>
          <div style={{ fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.mono, color: theme.colors.urgent }}>{profile.healthScore}</div>
        </div>
        <div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>30-day trend</div>
          <Sparkline data={profile.trend} />
        </div>
      </div>
      <div style={{ fontSize: theme.fontSize.sm }}>
        <strong>Annual value:</strong> ${profile.memberValueAnnual?.toLocaleString() ?? profile.duesAnnual?.toLocaleString() ?? '—'}
      </div>
    </div>
  ) : (
    <div>No member profile data available for this action.</div>
  );

  return createPortal(
    <>
      <div style={overlayStyle} onClick={handleClose} />
      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <span
                style={{
                  fontSize: theme.fontSize.xs,
                  fontWeight: 700,
                  color: typeMeta.color,
                  background: `${typeMeta.color}18`,
                  borderRadius: theme.radius.sm,
                  padding: '4px 8px',
                }}
              >
                {typeMeta.icon} {typeMeta.label}
              </span>
              <span
                style={{
                  fontSize: theme.fontSize.xs,
                  fontWeight: 700,
                  color: priority.color,
                  background: `${priority.color}18`,
                  borderRadius: theme.radius.sm,
                  padding: '4px 8px',
                }}
              >
                {priority.label}
              </span>
            </div>
            <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700 }}>{action.description}</div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 4 }}>
              Impact: {action.impactMetric} · Due by {formatDateTime(action.dueBy)} · Owner: {action.suggestedOwner ?? 'Unassigned'}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              border: 'none',
              background: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: theme.colors.textMuted,
            }}
            aria-label="Close drawer"
          >
            ×
          </button>
        </div>

        <div style={sectionStyle}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 6 }}>Member snapshot</div>
          {memberSnapshot}
        </div>

        <div style={sectionStyle}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 6 }}>Contact info</div>
          {renderContact()}
        </div>

        <div style={sectionStyle}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 6 }}>Risk signals</div>
          {renderRiskSignals()}
        </div>

        <div style={{ ...sectionStyle, maxHeight: '22vh', overflowY: 'auto' }}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 6 }}>Recent history (30 days)</div>
          {renderHistory()}
        </div>

        <div style={sectionStyle}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 6 }}>Draft outreach</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            <div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>Call Script</div>
              <textarea
                value={callNotes}
                onChange={(event) => setCallNotes(event.target.value)}
                style={{
                  width: '100%',
                  minHeight: 90,
                  borderRadius: theme.radius.sm,
                  border: `1px solid ${theme.colors.border}`,
                  padding: theme.spacing.sm,
                  fontFamily: theme.fonts.sans,
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>Email Subject</div>
              <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600 }}>{profile?.drafts?.emailSubject ?? 'Subject TBD'}</div>
            </div>
            <div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>Email Draft</div>
              <textarea
                value={emailBody}
                onChange={(event) => setEmailBody(event.target.value)}
                style={{
                  width: '100%',
                  minHeight: 140,
                  borderRadius: theme.radius.sm,
                  border: `1px solid ${theme.colors.border}`,
                  padding: theme.spacing.sm,
                  fontFamily: theme.fonts.sans,
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>SMS Draft</div>
              <textarea
                value={smsDraft}
                onChange={(event) => setSmsDraft(event.target.value)}
                style={{
                  width: '100%',
                  minHeight: 80,
                  borderRadius: theme.radius.sm,
                  border: `1px solid ${theme.colors.border}`,
                  padding: theme.spacing.sm,
                  fontFamily: theme.fonts.sans,
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            onClick={() => performApprove('Approve & Send')}
            style={{
              flex: 1,
              minWidth: 140,
              border: 'none',
              background: theme.colors.agentApproved,
              color: theme.colors.white,
              borderRadius: theme.radius.md,
              padding: '10px 12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Approve & Send
          </button>
          <button
            onClick={() => performApprove('Approve & Schedule')}
            style={{
              flex: 1,
              minWidth: 140,
              border: `1px solid ${theme.colors.agentApproved}50`,
              background: `${theme.colors.agentApproved}10`,
              color: theme.colors.agentApproved,
              borderRadius: theme.radius.md,
              padding: '10px 12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Approve & Schedule
          </button>
          <button
            onClick={() => performApprove('Approve & Assign')}
            style={{
              flex: 1,
              minWidth: 140,
              border: `1px solid ${theme.colors.border}`,
              background: 'transparent',
              color: theme.colors.textPrimary,
              borderRadius: theme.radius.md,
              padding: '10px 12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Approve & Assign
          </button>
          <button
            onClick={handleSnooze}
            style={{
              flex: 1,
              minWidth: 120,
              border: `1px solid ${theme.colors.border}`,
              background: theme.colors.bgDeep,
              color: theme.colors.textSecondary,
              borderRadius: theme.radius.md,
              padding: '10px 12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Snooze 2h
          </button>
          <button
            onClick={() => performDismiss('Dismissed from drawer')}
            style={{
              flex: 1,
              minWidth: 120,
              border: `1px solid ${theme.colors.agentDismissed}50`,
              background: `${theme.colors.agentDismissed}10`,
              color: theme.colors.agentDismissed,
              borderRadius: theme.radius.md,
              padding: '10px 12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>

        <div style={sectionStyle}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 6 }}>Audit trail</div>
          {auditTrail.length === 0 ? (
            <span style={{ fontSize: theme.fontSize.sm }}>No status changes recorded yet.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {auditTrail.map((entry) => (
                <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: theme.fontSize.sm }}>
                  <span style={{ fontWeight: 600 }}>{entry.status}</span>
                  <span style={{ color: theme.colors.textMuted }}>{entry.owner} · {formatDateTime(entry.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
