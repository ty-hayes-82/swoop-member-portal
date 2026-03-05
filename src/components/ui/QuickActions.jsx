// QuickActions — connects insight to real-world action.
// Phase A: Button hierarchy — Draft/Call are primary (filled), Assign is secondary (tinted outline).
import { useState } from 'react';
import { theme } from '@/config/theme';

const STAFF = ['F&B Director', 'Head Golf Professional', 'Membership Director', 'Grill Room Manager', 'Club Manager'];

export default function QuickActions({ memberName, memberId, context = '' }) {
  const [mode, setMode]   = useState(null);
  const [note, setNote]   = useState('');
  const [time, setTime]   = useState('');
  const [staff, setStaff] = useState(STAFF[0]);
  const [sent, setSent]   = useState(null);

  const firstName = memberName?.split(' ')[0] ?? 'the member';

  const defaultNote = `Dear ${firstName},\n\nI wanted to reach out personally to apologize for your recent experience at the Grill Room. Your satisfaction is our top priority and I'm sorry we fell short.\n\nI'd love to have you as my guest for lunch this week — please let me know what works for your schedule.\n\nWarm regards,\n[GM Name]\nOakmont Hills Country Club`;

  const handleSend = (type) => {
    setSent(type);
    setMode(null);
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
        color: mode === key ? color : '#fff',
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
        {primaryBtn('Draft personal note', '✉', 'note', theme.colors.briefing)}
        {primaryBtn('Schedule a call', '📞', 'call', theme.colors.success)}
        {secondaryBtn('Assign to staff', '→', 'task', theme.colors.staffing)}
      </div>

      {mode === 'note' && (
        <div style={{ marginTop: theme.spacing.sm, padding: theme.spacing.md,
          background: theme.colors.bgCard, border: '1px solid ' + theme.colors.briefing + '30',
          borderRadius: theme.radius.md }}>
          <div style={{ fontSize: '11px', color: theme.colors.briefing, fontWeight: 700, letterSpacing: '0.05em', marginBottom: theme.spacing.sm }}>
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
              background: theme.colors.briefing, color: '#fff',
              boxShadow: '0 1px 4px ' + theme.colors.briefing + '40' }}>
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
              background: theme.colors.success, color: '#fff',
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
              background: theme.colors.staffing, color: '#fff',
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
    </div>
  );
}
