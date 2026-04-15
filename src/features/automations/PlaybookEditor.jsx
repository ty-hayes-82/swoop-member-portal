/**
 * PlaybookEditor — Inline step customization for playbooks
 * Allows editing step titles, descriptions, timing, badges, and adding/removing/reordering steps.
 * Persists customizations to localStorage so they survive page reloads.
 */
import { useState, useCallback } from 'react';

const BADGE_PRESETS = [
  { text: '📢 Staff Alert', bg: '#fff3cd', color: '#856404' },
  { text: '🚩 GM Flag', bg: '#f8d7da', color: '#721c24' },
  { text: '🎁 Comp Offer', bg: '#d4edda', color: '#155724' },
  { text: '✉️ Email', bg: '#cce5ff', color: '#004085' },
  { text: '📱 SMS', bg: '#d1ecf1', color: '#0c5460' },
  { text: '📞 Phone Call', bg: '#e2e3e5', color: '#383d41' },
  { text: '🤝 Introduction', bg: '#f5e6ff', color: '#6f42c1' },
  { text: '📋 Survey', bg: '#fff3cd', color: '#856404' },
  { text: '📅 Schedule', bg: '#cce5ff', color: '#004085' },
  { text: '🏷️ Tag', bg: '#e2e3e5', color: '#383d41' },
];

const STORAGE_KEY = 'swoop_playbook_customizations';

export function loadPlaybookCustomizations() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

export function savePlaybookCustomization(playbookId, steps) {
  const all = loadPlaybookCustomizations();
  all[playbookId] = steps;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getCustomizedSteps(playbookId, defaultSteps) {
  const all = loadPlaybookCustomizations();
  return all[playbookId] || defaultSteps;
}

function StepEditor({ step, index, total, onChange, onRemove, onMoveUp, onMoveDown }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-swoop-border rounded-xl bg-swoop-panel overflow-hidden">
      {/* Step header — always visible */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Reorder buttons */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label="Move step up"
            className="w-5 h-5 rounded flex items-center justify-center text-swoop-text-label hover:bg-swoop-row-hover disabled:opacity-20 cursor-pointer border-none bg-transparent focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <svg aria-hidden="true" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd" /></svg>
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            aria-label="Move step down"
            className="w-5 h-5 rounded flex items-center justify-center text-swoop-text-label hover:bg-swoop-row-hover disabled:opacity-20 cursor-pointer border-none bg-transparent focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <svg aria-hidden="true" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
          </button>
        </div>

        {/* Step number */}
        <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
          {index + 1}
        </div>

        {/* Badge */}
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded shrink-0"
          style={{ background: step.badge?.bg || '#e2e3e5', color: step.badge?.color || '#383d41' }}
        >
          {step.badge?.text || 'Step'}
        </span>

        {/* Title */}
        <div className="flex-1 min-w-0 text-sm font-semibold text-swoop-text truncate">
          {step.title}
        </div>

        {/* Timing */}
        <span className="text-[11px] text-swoop-text-label shrink-0">{step.timing}</span>

        {/* Expand/collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-swoop-text-label hover:text-brand-500 cursor-pointer bg-transparent border-none p-1 focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {expanded ? 'Close' : 'Edit'}
        </button>

        {/* Remove */}
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove step"
            className="text-xs text-swoop-text-label hover:text-red-500 cursor-pointer bg-transparent border-none p-1 focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        )}
      </div>

      {/* Expanded edit form */}
      {expanded && (
        <div className="border-t border-swoop-border bg-swoop-row px-4 py-3 space-y-3">
          {/* Badge selector */}
          <div>
            <label className="block text-[11px] font-medium text-swoop-text-muted mb-1">Badge / Action Type</label>
            <div className="flex flex-wrap gap-1.5">
              {BADGE_PRESETS.map(b => (
                <button
                  key={b.text}
                  onClick={() => onChange({ ...step, badge: b })}
                  className={`text-[10px] font-semibold px-2 py-1 rounded cursor-pointer border transition-all ${
                    step.badge?.text === b.text
                      ? 'border-brand-500 ring-1 ring-brand-500/30'
                      : 'border-transparent'
                  }`}
                  style={{ background: b.bg, color: b.color }}
                >
                  {b.text}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-medium text-swoop-text-muted mb-1">Step Title</label>
            <input
              type="text"
              value={step.title}
              onChange={e => onChange({ ...step, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-swoop-border bg-swoop-panel text-sm"
            />
          </div>

          {/* Detail */}
          <div>
            <label className="block text-[11px] font-medium text-swoop-text-muted mb-1">Description</label>
            <textarea
              value={step.detail}
              onChange={e => onChange({ ...step, detail: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-swoop-border bg-swoop-panel text-sm resize-none"
            />
          </div>

          {/* Timing */}
          <div>
            <label className="block text-[11px] font-medium text-swoop-text-muted mb-1">Timing Window</label>
            <input
              type="text"
              value={step.timing}
              onChange={e => onChange({ ...step, timing: e.target.value })}
              placeholder="e.g., Hour 1–2, Day 1–3, Immediately"
              className="w-full px-3 py-2 rounded-lg border border-swoop-border bg-swoop-panel text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlaybookEditor({ playbook, onClose }) {
  const defaultSteps = playbook.steps;
  const [steps, setSteps] = useState(() => getCustomizedSteps(playbook.id, defaultSteps));
  const [saved, setSaved] = useState(false);

  const handleStepChange = useCallback((index, updatedStep) => {
    setSteps(prev => prev.map((s, i) => i === index ? updatedStep : s));
    setSaved(false);
  }, []);

  const handleRemoveStep = useCallback((index) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
    setSaved(false);
  }, []);

  const handleMoveUp = useCallback((index) => {
    if (index === 0) return;
    setSteps(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
    setSaved(false);
  }, []);

  const handleMoveDown = useCallback((index) => {
    setSteps(prev => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
    setSaved(false);
  }, []);

  const handleAddStep = () => {
    setSteps(prev => [...prev, {
      badge: { text: '📋 New Step', bg: '#e2e3e5', color: '#383d41' },
      title: 'New step',
      detail: 'Describe what happens in this step...',
      timing: 'Day 1',
    }]);
    setSaved(false);
  };

  const handleReset = () => {
    setSteps(defaultSteps);
    const all = loadPlaybookCustomizations();
    delete all[playbook.id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    setSaved(false);
  };

  const handleSave = () => {
    savePlaybookCustomization(playbook.id, steps);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-swoop-text m-0">
            Customize: {playbook.name}
          </h3>
          <p className="text-xs text-swoop-text-label mt-0.5 m-0">
            Edit steps, reorder, add new actions, or reset to defaults.
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-sm text-swoop-text-muted hover:text-swoop-text-2 cursor-pointer bg-transparent border-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          Done
        </button>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, i) => (
          <StepEditor
            key={i}
            step={step}
            index={i}
            total={steps.length}
            onChange={(s) => handleStepChange(i, s)}
            onRemove={() => handleRemoveStep(i)}
            onMoveUp={() => handleMoveUp(i)}
            onMoveDown={() => handleMoveDown(i)}
          />
        ))}
      </div>

      {/* Add step */}
      <button
        onClick={handleAddStep}
        className="w-full py-2 rounded-xl border-2 border-dashed border-swoop-border text-sm font-semibold text-swoop-text-muted cursor-pointer bg-transparent hover:border-brand-400 hover:text-brand-500 transition-colors"
      >
        + Add Step
      </button>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="flex-1 py-2.5 rounded-lg border border-swoop-border font-semibold text-sm text-swoop-text-muted cursor-pointer hover:bg-swoop-row-hover"
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          className="flex-[2] py-2.5 rounded-lg font-bold text-sm text-white cursor-pointer"
          style={{ background: '#F3922D' }}
        >
          {saved ? 'Saved!' : 'Save Customizations'}
        </button>
      </div>
    </div>
  );
}
