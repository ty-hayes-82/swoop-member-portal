import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { theme } from '@/config/theme';
import SourceBadge from '@/components/ui/SourceBadge.jsx';
import { useMemberProfile } from '@/context/MemberProfileContext';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
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

const Sparkline = ({ data = [], color = theme.colors.agentCyan }) => {
  if (!data.length) return <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>No trend data</span>;
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
      <path d={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
};

const Section = ({ title, description, children }) => (
  <section style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md, padding: theme.spacing.md, background: theme.colors.bgCard }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: theme.spacing.sm }}>
      <h3 style={{ margin: 0, fontSize: theme.fontSize.md }}>{title}</h3>
      {description && <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{description}</span>}
    </div>
    {children}
  </section>
);

export function MemberProfileContent({ profile, onClose, onOpenFullPage, onAddNote, onQuickAction, layout = 'drawer' }) {
  if (!profile) {
    return (
      <div style={{ padding: theme.spacing.lg, color: theme.colors.textMuted }}>
        Select a member to view their profile.
      </div>
    );
  }

  const [noteText, setNoteText] = useState('');
  const initials = (profile.name || '?').split(' ').map((part) => part[0]).join('').slice(0, 2);

  const topMetrics = useMemo(() => [
    { label: 'Annual dues', value: profile.duesAnnual ? `$${profile.duesAnnual.toLocaleString()}` : '—' },
    { label: 'Annual value', value: profile.memberValueAnnual ? `$${profile.memberValueAnnual.toLocaleString()}` : '—' },
    { label: 'Last seen', value: profile.lastSeenLocation ?? '—' },
  ], [profile.duesAnnual, profile.memberValueAnnual, profile.lastSeenLocation]);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    onAddNote?.(profile.memberId, { text: noteText.trim() });
    setNoteText('');
  };

  const quickActions = [
    { key: 'call', label: 'Schedule call', icon: '📞' },
    { key: 'email', label: 'Send email', icon: '✉️' },
    { key: 'sms', label: 'Send SMS', icon: '💬' },
    { key: 'comp', label: 'Offer comp', icon: '🎁' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'center' }}>
          <div style={{
            width: layout === 'page' ? 80 : 64,
            height: layout === 'page' ? 80 : 64,
            borderRadius: '50%',
            background: theme.colors.bgDeep,
            border: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: layout === 'page' ? 28 : 20,
            fontWeight: 700,
            color: theme.colors.textPrimary,
          }}>
            {initials}
          </div>
          <div>
          <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Member Snapshot</div>
          <h2 style={{ margin: '4px 0', fontSize: layout === 'page' ? 32 : 24 }}>{profile.name}</h2>
          <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
            {profile.tier} • Joined {formatDate(profile.joinDate)}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: theme.spacing.sm, flexWrap: 'wrap' }}>
            {topMetrics.map((metric) => (
              <div key={metric.label} style={{ padding: '8px 12px', borderRadius: theme.radius.sm, background: theme.colors.bgDeep, border: `1px solid ${theme.colors.border}` }}>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{metric.label}</div>
                <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600 }}>{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Health score</div>
          <div style={{ fontSize: 42, fontFamily: theme.fonts.mono, color: profile.healthScore > 69 ? theme.colors.success : profile.healthScore > 40 ? theme.colors.warning : theme.colors.urgent }}>
            {profile.healthScore ?? '—'}
          </div>
          <Sparkline data={profile.trend ?? []} />
              style={{ marginTop: theme.spacing.sm, border: 'none', background: 'none', color: theme.colors.accent, fontWeight: 600, cursor: 'pointer' }}
            >
              Open full profile →
            </button>
          )}
        </div>
      </div>

      <Section title="Contact" description={`Preferred channel: ${profile.contact?.preferredChannel ?? '—'}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: theme.fontSize.sm }}>
          <span><strong>Phone:</strong> {profile.contact?.phone ?? '—'}</span>
          <span><strong>Email:</strong> {profile.contact?.email ?? '—'}</span>
          <span><strong>Last outreach:</strong> {formatDateTime(profile.contact?.lastOutreach)}</span>
          <span><strong>Family on file:</strong> {(profile.family?.map((f) => f.name).join(', ')) || '—'}</span>
        </div>
      </Section>

      <Section title="Preferences & insights">
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {profile.preferences?.favoriteSpots && (
            <div style={{ fontSize: theme.fontSize.sm }}>
              <strong>Favorite spots:</strong> {profile.preferences.favoriteSpots.join(', ')}
            </div>
          )}
          {profile.preferences?.teeWindows && (
            <div style={{ fontSize: theme.fontSize.sm }}>
              <strong>Tee time window:</strong> {profile.preferences.teeWindows}
            </div>
          )}
          {profile.preferences?.dining && (
            <div style={{ fontSize: theme.fontSize.sm }}>
              <strong>Dining:</strong> {profile.preferences.dining}
            </div>
          )}
          {profile.preferences?.notes && (
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>{profile.preferences.notes}</div>
          )}
        </div>
      </Section>

      <Section title="Recent activity" description="Last 30 days">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(profile.activity ?? []).map((activity) => (
            <div key={activity.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: theme.fontSize.sm }}>
              <div>
                <div style={{ fontWeight: 600 }}>{activity.type}</div>
                <div style={{ color: theme.colors.textSecondary }}>{activity.detail}</div>
              </div>
              <div style={{ color: theme.colors.textMuted }}>{activity.timestamp}</div>
            </div>
          ))}
          {!(profile.activity ?? []).length && <span style={{ color: theme.colors.textSecondary }}>No recent activity logged.</span>}
        </div>
      </Section>

      <Section title="Risk signals">
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {(profile.riskSignals ?? []).map((signal) => (
            <div key={signal.id} style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600 }}>{signal.label}</div>
                <SourceBadge system={signal.source ?? 'Member CRM'} size="xs" />
              </div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{formatDateTime(signal.timestamp)} · Confidence {signal.confidence ?? '—'}</div>
            </div>
          ))}
          {!(profile.riskSignals ?? []).length && <span style={{ color: theme.colors.textSecondary }}>No active risks.</span>}
        </div>
      </Section>

      <Section title="Staff notes">
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          <textarea
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            placeholder="Add a quick staff note..."
            style={{
              width: '100%',
              minHeight: 96,
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.colors.border}`,
              padding: theme.spacing.sm,
              fontSize: theme.fontSize.sm,
              fontFamily: theme.fonts.sans,
              background: theme.colors.bgDeep,
              color: theme.colors.textPrimary,
            }}
          />
          <button
            type="button"
            onClick={handleAddNote}
            style={{
              alignSelf: 'flex-end',
              padding: '6px 14px',
              borderRadius: theme.radius.sm,
              border: 'none',
              background: theme.colors.accent,
              color: theme.colors.white,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save note
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(profile.staffNotes ?? []).map((note) => (
              <div key={note.id} style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, padding: '10px 12px' }}>
                <div style={{ fontWeight: 600 }}>{note.author}</div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
                  {note.department ?? 'General'} • {formatDateTime(note.timestamp)}
                </div>
                <div style={{ marginTop: 6 }}>{note.text}</div>
              </div>
            ))}
            {!(profile.staffNotes ?? []).length && <span style={{ color: theme.colors.textSecondary }}>No notes yet.</span>}
          </div>
        </div>
      </Section>

      <Section title="Quick actions">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {quickActions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => onQuickAction?.(profile.memberId, action.key)}
              style={{
                padding: '8px 14px',
                borderRadius: theme.radius.md,
                border: '1px solid ' + theme.colors.border,
                background: theme.colors.bgDeep,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {action.icon} {action.label}
            </button>
          ))}
        </div>
      </Section>

      {onClose && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              color: theme.colors.textMuted,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export default function MemberProfileDrawer() {
  const { profile, isDrawerOpen, closeDrawer, openProfilePage, triggerQuickAction, addStaffNote } = useMemberProfile();
  const [isAnimating, setIsAnimating] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isDrawerOpen) {
      setIsAnimating(true);
      const handler = (event) => {
        if (event.key === 'Escape') handleClose();
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
    return undefined;
  }, [isDrawerOpen]);

  if (!isDrawerOpen || !profile) return null;

  const handleClose = () => {
    setIsAnimating(false);
    window.setTimeout(() => closeDrawer(), 220);
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
    ? { ...panelBase, left: 0, right: 0, bottom: 0, height: '85vh', transform: isAnimating ? 'translateY(0)' : 'translateY(100%)' }
    : { ...panelBase, top: 0, right: 0, width: 680, height: '100vh', transform: isAnimating ? 'translateX(0)' : 'translateX(105%)' };

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(5, 7, 16, 0.45)',
    opacity: isAnimating ? 1 : 0,
    transition: 'opacity 0.2s ease',
    zIndex: 1001,
  };

  return createPortal(
    <>
      <div style={overlayStyle} onClick={handleClose} />
      <div style={panelStyle}>
        <MemberProfileContent
          profile={profile}
          onClose={handleClose}
          onOpenFullPage={openProfilePage}
          onAddNote={addStaffNote}
          onQuickAction={triggerQuickAction}
          layout="drawer"
        />
      </div>
    </>,
    document.body
  );
}
