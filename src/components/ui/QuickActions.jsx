// QuickActions — connects insight to real-world action.
// Phase A: Button hierarchy — Draft/Call are primary (filled), Assign is secondary (tinted outline).
import { useState } from 'react';
import { theme } from '@/config/theme';
import { getActionsForArchetype, outreachCategories } from '@/data/outreach';
import { useApp } from '@/context/AppContext';

const STAFF = ['F&B Director', 'Head Golf Professional', 'Membership Director', 'Grill Room Manager', 'Club Manager'];

export default function QuickActions({ memberName, memberId, context = '', archetype = '' }) {
  const { showToast } = useApp();
  const [mode, setMode]   = useState(null);
  const [note, setNote]   = useState('');
  const [time, setTime]   = useState('');
  const [staff, setStaff] = useState(STAFF[0]);
  const [sent, setSent]   = useState(null);
  const [actionLog, setActionLog] = useState([]);
  const [showOutreach, setShowOutreach] = useState(false);
  const outreachActions = archetype ? getActionsForArchetype(archetype) : [];

  const ACTION_META = {
    note: { label: 'Personal note', icon: '✉', color: theme.colors.accent },
    call: { label: 'Scheduled call', icon: '📞', color: theme.colors.success },
    task: { label: 'Staff assignment', icon: '→', color: theme.colors.staffing },
  };

  const STATUS_STYLES = {
    Completed: { color: theme.colors.success, background: theme.colors.success + '14' },
    Scheduled: { color: theme.colors.info, background: theme.colors.info + '14' },
    Assigned:  { color: theme.colors.staffing, background: theme.colors.staffing + '14' },
  };

  const getDueLabel = (type) => {
    if (type === 'call') return time || 'Next tee-side touchpoint';
    if (type === 'task') {
      const due = new Date();
      due.setDate(due.getDate() + 1);
      return due.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
    }
    return 'Sent now';
  };

  const addActionEntry = (type) => {
    const entry = {
      id: `${type}-${Date.now()}`,
      type,
      owner: type === 'task' ? staff : 'GM',
      dueLabel: getDueLabel(type),
      status: type === 'note' ? 'Completed' : type === 'call' ? 'Scheduled' : 'Assigned',
      createdAt: new Date(),
    };
    setActionLog((prev) => [entry, ...prev].slice(0, 5));
  };

  const markActionCompleted = (id) => {
    setActionLog((prev) => prev.map((entry) => (entry.id === id ? { ...entry, status: 'Completed' } : entry)));
  };

  const formatLoggedAt = (createdAt) => {
    if (!(createdAt instanceof Date)) return '';
    return createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const firstName = memberName?.split(' ')[0] ?? 'the member';

  const defaultNote = `Dear ${firstName},\n\nI wanted to reach out personally to apologize for your recent experience at the Grill Room. Your satisfaction is our top priority and I'm sorry we fell short.\n\nI'd love to have you as my guest for lunch this week — please let me know what works for your schedule.\n\nWarm regards,\n[GM Name]\nOakmont Hills Country Club`;

  const handleSend = (type) => {
    setSent(type);
    setMode(null);
    addActionEntry(type);
    if (type === 'call') setTime('');
    const message = type === 'note'
      ? `Draft ready for ${memberName}`
      : type === 'call'
        ? `Call scheduled for ${memberName}`
        : `Task assigned to ${staff}`;
    showToast(message, 'info');
    setTimeout(() => setSent(null), 4000);
  };

  const primaryBtn = (label, icon, key, color) => (
    <button
      key={key}
      onClick={() => setMode(mode === key ? null : key)}
      style={{
        padding: '7px 16px', borderRadius: theme.radius.md, fontSize: theme.fontSize.sm,
        fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
        border: `1px solid ${mode === key ? color + '60' : color}`,
        background: mode === key ? color + '18' : color,
        color: mode === key ? color : theme.colors.white,
        boxShadow: mode === key ? 'none' : '0 1px 4px ' + color + '40',
        transition: 'all 0.15s',
      }}
    >{icon} {label}</button>
  );

  const secondaryBtn = (label, icon, key, color) => (
    <button
      key={key}
      onClick={() => setMode(mode === key ? null : key)}
      style={{
        padding: '7px 14px', borderRadius: theme.radius.md, fontSize: theme.fontSize.sm,
        fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
        border: `1px solid ${mode === key ? color + '60' : color + '35'}`,
        background: mode === key ? color + '14' : color + '08',
        color: color,
        transition: 'all 0.15s',
      }}
    >{icon} {label}</button>
  );

  return (
    <div>
      {sent && (
        <div style={{ marginBottom: theme.spacing.sm, padding: '8px 12px', borderRadius: theme.radius.sm,
          background: theme.colors.success + '12', border: '1px solid ' + theme.colors.success + '30',
          fontSize: theme.fontSize.sm, color: theme.colors.success }}>
          ✓ {sent === 'note' ? 'Personal note ready to send' : sent === 'call' ? 'Call scheduled' : 'Task assigned to ' + staff}
        </div>
      )}
      <div style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
        {primaryBtn('Draft personal note', '✉', 'note', theme.colors.accent)}
        {primaryBtn('Schedule a call', '📞', 'call', theme.colors.success)}
        {secondaryBtn('Assign to staff', '→', 'task', theme.colors.staffing)}
      </div>

      {mode === 'note' && (
        <div style={{ marginTop: theme.spacing.sm, padding: theme.spacing.md,
          background: theme.colors.bgCard, border: '1px solid ' + theme.colors.accent + '30',
          borderRadius: theme.radius.md }}>
          <div style={{ fontSize: '11px', color: theme.colors.accent, fontWeight: 700, letterSpacing: '0.05em', marginBottom: theme.spacing.sm }}>
            PERSONAL NOTE TO {memberName?.toUpperCase()}
          </div>
          <textarea
            defaultValue={defaultNote}
            onChange={e => setNote(e.target.value)}
            style={{ width: '100%', height: 160, padding: theme.spacing.sm, fontSize: theme.fontSize.sm,
              fontFamily: theme.fonts.sans, color: theme.colors.textPrimary,
              background: theme.colors.bgDeep, border: '1px solid ' + theme.colors.border,
              borderRadius: theme.radius.sm, resize: 'vertical', lineHeight: 1.6, outline: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
            <button onClick={() => handleSend('note')} style={{
              padding: '7px 18px', borderRadius: theme.radius.sm, fontSize: theme.fontSize.sm,
              fontWeight: 600, cursor: 'pointer', border: 'none',
              background: theme.colors.accent, color: theme.colors.white,
              boxShadow: '0 1px 4px ' + theme.colors.accent + '40' }}>
              Send via email
            </button>
            <button onClick={() => setMode(null)} style={{
              padding: '7px 14px', borderRadius: theme.radius.sm, fontSize: theme.fontSize.sm,
              cursor: 'pointer', border: 'none', background: 'none',
              color: theme.colors.textMuted, fontWeight: 500 }}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {mode === 'call' && (
        <div style={{ marginTop: theme.spacing.sm, padding: theme.spacing.md,
          background: theme.colors.bgCard, border: '1px solid ' + theme.colors.success + '30', borderRadius: theme.radius.md }}>
          <div style={{ fontSize: '11px', color: theme.colors.success, fontWeight: 700, letterSpacing: '0.05em', marginBottom: theme.spacing.sm }}>
            SCHEDULE A CALL WITH {memberName?.toUpperCase()}
          </div>
          <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.md, lineHeight: 1.6 }}>
            Reminder: <strong style={{ color: theme.colors.textPrimary }}>James has a tee time Saturday 7:42 AM.</strong> A brief conversation at the first tee would be ideal — personal, not a formal call.
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap', marginBottom: theme.spacing.md }}>
            {['Today 4 PM', 'Friday AM', 'Saturday at the tee', 'Monday morning'].map(t => (
              <button key={t} onClick={() => setTime(t)} style={{
                padding: '5px 12px', borderRadius: '20px', fontSize: theme.fontSize.xs,
                cursor: 'pointer', fontWeight: time === t ? 700 : 400,
                border: '1px solid ' + (time === t ? theme.colors.success : theme.colors.border),
                background: time === t ? theme.colors.success + '12' : 'none',
                color: time === t ? theme.colors.success : theme.colors.textSecondary,
              }}>{t}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <button onClick={() => handleSend('call')} style={{
              padding: '7px 18px', borderRadius: theme.radius.sm, fontSize: theme.fontSize.sm,
              fontWeight: 600, cursor: 'pointer', border: 'none',
              background: theme.colors.accent, color: theme.colors.white,
              boxShadow: '0 1px 4px ' + theme.colors.success + '40' }}>
              Add to calendar
            </button>
            <button onClick={() => setMode(null)} style={{
              padding: '7px 14px', borderRadius: theme.radius.sm, fontSize: theme.fontSize.sm,
              cursor: 'pointer', border: 'none', background: 'none',
              color: theme.colors.textMuted, fontWeight: 500 }}>Dismiss</button>
          </div>
        </div>
      )}

      {mode === 'task' && (
        <div style={{ marginTop: theme.spacing.sm, padding: theme.spacing.md,
          background: theme.colors.bgCard, border: '1px solid ' + theme.colors.staffing + '30', borderRadius: theme.radius.md }}>
          <div style={{ fontSize: '11px', color: theme.colors.staffing, fontWeight: 700, letterSpacing: '0.05em', marginBottom: theme.spacing.sm }}>
            ASSIGN FOLLOW-UP TASK
          </div>
          <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }}>
            Task: <em>Follow up with {memberName} re: {context || 'service complaint'}</em>
          </div>
          <div style={{ marginBottom: theme.spacing.sm }}>
            <div style={{ fontSize: '11px', color: theme.colors.textMuted, marginBottom: 4 }}>Assign to</div>
            <select onChange={e => setStaff(e.target.value)} value={staff} style={{
              padding: '7px 12px', fontSize: theme.fontSize.sm, borderRadius: theme.radius.sm,
              border: '1px solid ' + theme.colors.border, background: theme.colors.bgDeep,
              color: theme.colors.textPrimary, cursor: 'pointer', outline: 'none' }}>
              {STAFF.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <button onClick={() => handleSend('task')} style={{
              padding: '7px 18px', borderRadius: theme.radius.sm, fontSize: theme.fontSize.sm,
              fontWeight: 600, cursor: 'pointer', border: 'none',
              background: theme.colors.accent, color: theme.colors.white,
              boxShadow: '0 1px 4px ' + theme.colors.staffing + '40' }}>
              Assign task
            </button>
            <button onClick={() => setMode(null)} style={{
              padding: '7px 14px', borderRadius: theme.radius.sm, fontSize: theme.fontSize.sm,
              cursor: 'pointer', border: 'none', background: 'none',
              color: theme.colors.textMuted, fontWeight: 500 }}>Dismiss</button>
          </div>
        </div>
      )}


      {/* Archetype-specific outreach suggestions */}
      {outreachActions.length > 0 && (
        <div style={{ marginTop: theme.spacing.md }}>
          <button
            onClick={() => setShowOutreach(!showOutreach)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: theme.radius.md,
              border: '1px solid rgba(37,99,235,0.2)', background: showOutreach ? 'rgba(37,99,235,0.04)' : '#fafbff',
              color: '#2563eb', fontSize: theme.fontSize.sm, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all 0.15s',
            }}
          >
            <span>📨 Outreach Playbook for {archetype}</span>
            <span style={{ fontSize: '12px', color: '#a1a1aa' }}>{showOutreach ? '\u25B2' : '\u25BC'} {outreachActions.length} actions</span>
          </button>
          {showOutreach && (
            <div style={{ marginTop: theme.spacing.sm, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {outreachActions.map((action, idx) => {
                const cat = outreachCategories.find(c => c.key === action.category);
                return (
                  <div key={action.id} style={{
                    padding: '12px 14px', borderRadius: theme.radius.md,
                    border: idx < 2 ? '1px solid rgba(37,99,235,0.2)' : '1px solid ' + theme.colors.border,
                    background: idx < 2 ? 'rgba(37,99,235,0.03)' : theme.colors.bgCard,
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                  }}>
                    <span style={{ fontSize: '16px', marginTop: '2px' }}>{cat?.icon || '\u2728'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: '2px' }}>
                        {action.label}
                        {idx < 2 && <span style={{ fontSize: '10px', fontWeight: 700, color: '#2563eb', marginLeft: '6px', background: 'rgba(37,99,235,0.08)', padding: '1px 6px', borderRadius: '3px' }}>TOP</span>}
                      </div>
                      <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, lineHeight: 1.4 }}>{action.description}</div>
                      <div style={{ marginTop: '6px', fontSize: '11px', color: '#a1a1aa' }}>Owner: {action.defaultOwner}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addActionEntry('note');
                        showToast(action.label + ' triggered for ' + memberName, 'info');
                      }}
                      style={{
                        padding: '5px 12px', borderRadius: theme.radius.sm, fontSize: '11px',
                        fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(37,99,235,0.3)',
                        background: 'rgba(37,99,235,0.06)', color: '#2563eb', whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >Deploy</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {actionLog.length > 0 && (
        <div style={{ marginTop: theme.spacing.md, border: '1px solid ' + theme.colors.border, borderRadius: theme.radius.md, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: theme.colors.textMuted, background: theme.colors.bgDeep }}>
            Follow-up tracker
          </div>
          {actionLog.map((entry, idx) => {
            const meta = ACTION_META[entry.type] ?? ACTION_META.note;
            const isLast = idx === actionLog.length - 1;
            const statusMeta = STATUS_STYLES[entry.status] || { color: theme.colors.textSecondary, background: theme.colors.bgDeep };
            return (
              <div key={entry.id} style={{
                padding: '12px 14px',
                borderBottom: isLast ? 'none' : '1px solid ' + theme.colors.border,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: theme.spacing.sm,
                flexWrap: 'wrap',
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: meta.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span aria-hidden="true">{meta.icon}</span> {meta.label}
                  </div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 4 }}>
                    Owner: <strong>{entry.owner}</strong> · Due: {entry.dueLabel}
                  </div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
                    Logged {formatLoggedAt(entry.createdAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: statusMeta.color, background: statusMeta.background, padding: '4px 12px', borderRadius: '999px' }}>{entry.status}</span>
                  {entry.status !== 'Completed' && (
                    <button onClick={() => markActionCompleted(entry.id)} style={{
                      padding: '4px 10px', borderRadius: theme.radius.sm, border: '1px solid ' + theme.colors.border,
                      background: 'none', color: theme.colors.accent, fontSize: theme.fontSize.xs, cursor: 'pointer', fontWeight: 600,
                    }}>
                      Mark done
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
