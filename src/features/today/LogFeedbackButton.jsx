import { useState } from 'react';
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
        className="flex items-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] cursor-pointer text-xs font-semibold text-gray-500 w-full"
      >
        <span className="text-base">+</span>
        Log Member Feedback
      </button>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-brand-500/20 bg-white dark:bg-white/[0.03] flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-gray-800 dark:text-white/90">
          Log Feedback
        </span>
        <button
          onClick={() => setOpen(false)}
          className="bg-transparent border-none cursor-pointer text-gray-400 text-base"
        >
          ×
        </button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`py-1 px-2.5 rounded-md border cursor-pointer text-[11px] ${
              type === t
                ? 'border-brand-500 bg-brand-500/[0.07] font-bold text-brand-500'
                : 'border-gray-200 dark:border-gray-800 bg-transparent font-medium text-gray-500'
            }`}
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
        className="w-full py-2 px-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-100 text-gray-800 dark:text-white/90 text-xs box-border"
      />

      <textarea
        placeholder="What happened?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        className="w-full py-2 px-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-100 text-gray-800 dark:text-white/90 text-xs box-border resize-y"
      />

      <button
        onClick={handleSubmit}
        disabled={!memberName.trim() || !note.trim()}
        className={`py-2 px-4 rounded-lg border-none text-white text-xs font-bold ${
          memberName.trim() && note.trim()
            ? 'bg-brand-500 cursor-pointer'
            : 'bg-gray-200 cursor-default'
        }`}
      >
        Save Feedback
      </button>
    </div>
  );
}
