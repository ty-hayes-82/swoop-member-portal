import { useState } from 'react';
import { theme } from '@/config/theme';
import { useApp } from '@/context/AppContext';
import { trackAction } from '@/services/activityService';

const TYPES = ['Complaint', 'Compliment', 'Observation', 'Request'];

export default function LogFeedbackButton() {
  const { showToast } = useApp();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('Complaint');
  const [memberName, setMemberName] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!memberName.trim() || !note.trim()) return;
    // Store to localStorage for now (can wire to API later)
    const feedback = JSON.parse(localStorage.getItem('swoop_manual_feedback') || '[]');
    feedback.push({
      id: Date.now(),
      type,
      memberName: memberName.trim(),
      note: note.trim(),
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('swoop_manual_feedback', JSON.stringify(feedback));
    showToast(`${type} logged for ${memberName.trim()}`, 'success');
    trackAction({ actionType: 'feedback', actionSubtype: type.toLowerCase(), memberName: memberName.trim(), description: note.trim(), meta: { type } });
    setOpen(false);
    setMemberName('');
    setNote('');
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          borderRadius: theme.radius.md,
          border: `1px solid ${theme.colors.border}`,
          background: theme.colors.bgCard,
          cursor: 'pointer',
          fontSize: theme.fontSize.xs,
          fontWeight: 600,
          color: theme.colors.textSecondary,
          width: '100%',
        }}
      >
        <span style={{ fontSize: '16px' }}>+</span>
        Log Member Feedback
      </button>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.bgDeep,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.xs,
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.accent}30`,
      background: theme.colors.bgCard,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.sm,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary }}>
          Log Feedback
        </span>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: theme.colors.textMuted,
            fontSize: '16px',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${type === t ? theme.colors.accent : theme.colors.border}`,
              background: type === t ? `${theme.colors.accent}12` : 'transparent',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: type === t ? 700 : 500,
              color: type === t ? theme.colors.accent : theme.colors.textSecondary,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Member name"
        value={memberName}
        onChange={(e) => setMemberName(e.target.value)}
        style={inputStyle}
      />

      <textarea
        placeholder="What happened?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        style={{ ...inputStyle, resize: 'vertical' }}
      />

      <button
        onClick={handleSubmit}
        disabled={!memberName.trim() || !note.trim()}
        style={{
          padding: '8px 16px',
          borderRadius: theme.radius.sm,
          border: 'none',
          background: memberName.trim() && note.trim() ? theme.colors.accent : theme.colors.border,
          color: 'white',
          fontSize: theme.fontSize.xs,
          fontWeight: 700,
          cursor: memberName.trim() && note.trim() ? 'pointer' : 'default',
        }}
      >
        Save Feedback
      </button>
    </div>
  );
}
