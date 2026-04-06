// QuickActions — connects insight to real-world action.
import { useState } from 'react';
import { getActionsForArchetype, outreachCategories } from '@/data/outreach';
import { useApp } from '@/context/AppContext';
import { trackAction } from '@/services/activityService';

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
    note: { label: 'Personal note', icon: '\u2709', colorCls: 'text-brand-500' },
    call: { label: 'Scheduled call', icon: '\uD83D\uDCDE', colorCls: 'text-success-500' },
    task: { label: 'Staff assignment', icon: '\u2192', colorCls: 'text-blue-light-500' },
  };

  const STATUS_CLS = {
    Completed: 'text-success-500 bg-success-50',
    Scheduled: 'text-blue-light-500 bg-blue-light-50',
    Assigned:  'text-blue-light-600 bg-blue-light-50',
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
  const defaultNote = `Dear ${firstName},\n\nI wanted to reach out personally to apologize for your recent experience at the Grill Room. Your satisfaction is our top priority and I'm sorry we fell short.\n\nI'd love to have you as my guest for lunch this week \u2014 please let me know what works for your schedule.\n\nWarm regards,\n[GM Name]\nYour Club`;

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
    if (type === 'note') trackAction({ actionType: 'note', actionSubtype: 'personal', memberId, memberName, description: note || defaultNote });
    if (type === 'call') trackAction({ actionType: 'call', actionSubtype: 'schedule', memberId, memberName });
    if (type === 'task') trackAction({ actionType: 'task', actionSubtype: 'assign', memberId, memberName, meta: { assignedTo: staff } });
    setTimeout(() => setSent(null), 4000);
  };

  const primaryBtn = (label, icon, key, colorCls) => (
    <button
      key={key}
      onClick={() => setMode(mode === key ? null : key)}
      className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-all duration-150 border ${
        mode === key
          ? `bg-brand-50 text-brand-500 border-brand-200 dark:bg-brand-500/10 dark:border-brand-500/30`
          : `bg-brand-500 text-white border-brand-500 shadow-theme-xs`
      }`}
    >{icon} {label}</button>
  );

  const secondaryBtn = (label, icon, key) => (
    <button
      key={key}
      onClick={() => setMode(mode === key ? null : key)}
      className={`px-3.5 py-2 rounded-xl text-sm font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-all duration-150 border ${
        mode === key
          ? 'bg-blue-light-50 text-blue-light-600 border-blue-light-200 dark:bg-blue-light-500/10 dark:border-blue-light-500/30'
          : 'bg-blue-light-50/50 text-blue-light-600 border-blue-light-200/50 dark:bg-blue-light-500/5 dark:border-blue-light-500/20'
      }`}
    >{icon} {label}</button>
  );

  return (
    <div>
      {sent && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-success-50 border border-success-200 text-sm text-success-500 dark:bg-success-500/10 dark:border-success-500/30">
          \u2713 {sent === 'note' ? 'Personal note ready to send' : sent === 'call' ? 'Call scheduled' : 'Task assigned to ' + staff}
        </div>
      )}
      <div className="flex gap-3 flex-wrap">
        {primaryBtn('Draft personal note', '\u2709', 'note', 'text-brand-500')}
        {primaryBtn('Schedule a call', '\uD83D\uDCDE', 'call', 'text-success-500')}
        {secondaryBtn('Assign to staff', '\u2192', 'task')}
      </div>

      {mode === 'note' && (
        <div className="mt-3 p-4 bg-white border border-brand-200 rounded-xl dark:bg-white/[0.03] dark:border-brand-500/30">
          <div className="text-[11px] text-brand-500 font-bold tracking-wide mb-3">
            PERSONAL NOTE TO {memberName?.toUpperCase()}
          </div>
          <textarea
            defaultValue={defaultNote}
            onChange={e => setNote(e.target.value)}
            className="w-full h-40 p-3 text-sm text-gray-800 bg-gray-100 border border-gray-200 rounded-lg resize-y leading-relaxed outline-none box-border dark:bg-gray-800 dark:border-gray-700 dark:text-white/90"
          />
          <div className="flex gap-3 mt-3">
            <button onClick={() => handleSend('note')} className="px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer border-none bg-brand-500 text-white shadow-theme-xs">
              Send via email
            </button>
            <button onClick={() => setMode(null)} className="px-3.5 py-2 rounded-lg text-sm cursor-pointer border-none bg-transparent text-gray-500 font-medium">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {mode === 'call' && (
        <div className="mt-3 p-4 bg-white border border-success-200 rounded-xl dark:bg-white/[0.03] dark:border-success-500/30">
          <div className="text-[11px] text-success-500 font-bold tracking-wide mb-3">
            SCHEDULE A CALL WITH {memberName?.toUpperCase()}
          </div>
          <div className="text-sm text-gray-600 mb-4 leading-relaxed dark:text-gray-400">
            Reminder: <strong className="text-gray-800 dark:text-white/90">James has a tee time Saturday 7:42 AM.</strong> A brief conversation at the first tee would be ideal \u2014 personal, not a formal call.
          </div>
          <div className="flex gap-3 flex-wrap mb-4">
            {['Today 4 PM', 'Friday AM', 'Saturday at the tee', 'Monday morning'].map(t => (
              <button key={t} onClick={() => setTime(t)} className={`px-3 py-1.5 rounded-full text-xs cursor-pointer border ${
                time === t
                  ? 'font-bold border-success-500 bg-success-50 text-success-500 dark:bg-success-500/10 dark:border-success-500/40'
                  : 'font-normal border-gray-200 bg-transparent text-gray-600 dark:border-gray-700 dark:text-gray-400'
              }`}>{t}</button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleSend('call')} className="px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer border-none bg-brand-500 text-white shadow-theme-xs">
              Add to calendar
            </button>
            <button onClick={() => setMode(null)} className="px-3.5 py-2 rounded-lg text-sm cursor-pointer border-none bg-transparent text-gray-500 font-medium">Dismiss</button>
          </div>
        </div>
      )}

      {mode === 'task' && (
        <div className="mt-3 p-4 bg-white border border-blue-light-200 rounded-xl dark:bg-white/[0.03] dark:border-blue-light-500/30">
          <div className="text-[11px] text-blue-light-600 font-bold tracking-wide mb-3">
            ASSIGN FOLLOW-UP TASK
          </div>
          <div className="text-sm text-gray-600 mb-3 dark:text-gray-400">
            Task: <em>Follow up with {memberName} re: {context || 'service complaint'}</em>
          </div>
          <div className="mb-3">
            <div className="text-[11px] text-gray-500 mb-1 dark:text-gray-400">Assign to</div>
            <select onChange={e => setStaff(e.target.value)} value={staff} className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-100 text-gray-800 cursor-pointer outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white/90">
              {STAFF.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleSend('task')} className="px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer border-none bg-brand-500 text-white shadow-theme-xs">
              Assign task
            </button>
            <button onClick={() => setMode(null)} className="px-3.5 py-2 rounded-lg text-sm cursor-pointer border-none bg-transparent text-gray-500 font-medium">Dismiss</button>
          </div>
        </div>
      )}

      {/* Archetype-specific outreach suggestions */}
      {outreachActions.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowOutreach(!showOutreach)}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer flex items-center justify-between transition-all duration-150 ${
              showOutreach ? 'bg-brand-50 border-brand-200 text-brand-500 dark:bg-brand-500/5 dark:border-brand-500/30' : 'bg-white border-brand-200/50 text-brand-500 dark:bg-white/[0.03] dark:border-brand-500/20'
            }`}
          >
            <span>\uD83D\uDCE8 Outreach Playbook for {archetype}</span>
            <span className="text-xs text-gray-400">{showOutreach ? '\u25B2' : '\u25BC'} {outreachActions.length} actions</span>
          </button>
          {showOutreach && (
            <div className="mt-3 flex flex-col gap-2">
              {outreachActions.map((action, idx) => {
                const cat = outreachCategories.find(c => c.key === action.category);
                return (
                  <div key={action.id} className={`px-3.5 py-3 rounded-xl border flex items-start gap-2.5 ${
                    idx < 2 ? 'border-brand-200 bg-brand-50/50 dark:border-brand-500/20 dark:bg-brand-500/5' : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'
                  }`}>
                    <span className="text-base mt-0.5">{cat?.icon || '\u2728'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 mb-0.5 dark:text-white/90">
                        {action.label}
                        {idx < 2 && <span className="text-[10px] font-bold text-brand-500 ml-1.5 bg-brand-50 px-1.5 py-px rounded dark:bg-brand-500/15">TOP</span>}
                      </div>
                      <div className="text-xs text-gray-500 leading-snug dark:text-gray-400">{action.description}</div>
                      <div className="mt-1.5 text-[11px] text-gray-400">Owner: {action.defaultOwner}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addActionEntry('note');
                        showToast(action.label + ' triggered for ' + memberName, 'info');
                        trackAction({ actionType: 'email', actionSubtype: 'outreach', memberId, memberName, description: action.label });
                      }}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border border-brand-200 bg-brand-50 text-brand-500 whitespace-nowrap shrink-0 dark:bg-brand-500/10 dark:border-brand-500/30"
                    >Deploy</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {actionLog.length > 0 && (
        <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden dark:border-gray-800">
          <div className="px-3 py-2.5 text-[11px] font-bold tracking-wide uppercase text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400">
            Follow-up tracker
          </div>
          {actionLog.map((entry, idx) => {
            const meta = ACTION_META[entry.type] ?? ACTION_META.note;
            const isLast = idx === actionLog.length - 1;
            const statusCls = STATUS_CLS[entry.status] || 'text-gray-600 bg-gray-100';
            return (
              <div key={entry.id} className={`px-3.5 py-3 flex justify-between items-center gap-3 flex-wrap ${isLast ? '' : 'border-b border-gray-200 dark:border-gray-800'}`}>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-semibold flex items-center gap-1.5 ${meta.colorCls}`}>
                    <span aria-hidden="true">{meta.icon}</span> {meta.label}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 dark:text-gray-400">
                    Owner: <strong>{entry.owner}</strong> \u00B7 Due: {entry.dueLabel}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Logged {formatLoggedAt(entry.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${statusCls}`}>{entry.status}</span>
                  {entry.status !== 'Completed' && (
                    <button onClick={() => markActionCompleted(entry.id)} className="px-2.5 py-1 rounded-lg border border-gray-200 bg-transparent text-brand-500 text-xs cursor-pointer font-semibold dark:border-gray-700">
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
