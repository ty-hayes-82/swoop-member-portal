/**
 * BehaviorTab — Tone, sweep cadence, and auto-approve settings.
 *
 * Extracted from AgentConfigDrawer.jsx (Step 5 cleanup).
 *
 * Props:
 *   config   — { tone, cadence, autoApproveEnabled, autoApproveThreshold, dollarCap }
 *   onSave   — (updates: object) => void — merges partial state updates
 *   loading  — boolean
 */
import { useMemo } from 'react';

// ── Constants ───────────────────────────────────────────────────────────────

const TONE_OPTIONS = [
  { value: 'warm', label: 'Warm', desc: 'Friendly, empathetic language that makes members feel personally cared for.' },
  { value: 'professional', label: 'Professional', desc: 'Polished, board-room-appropriate communication with measured confidence.' },
  { value: 'direct', label: 'Direct', desc: 'Concise, action-oriented messages that get straight to the point.' },
];

const CADENCE_OPTIONS = [
  { value: 'morning_only', label: 'Morning Only', desc: 'One sweep each day at 7 AM' },
  { value: 'every_4h', label: 'Every 4 Hours', desc: 'Sweeps at 7 AM, 11 AM, 3 PM, 7 PM' },
  { value: 'hourly', label: 'Hourly', desc: 'Sweep every hour during business hours' },
  { value: 'realtime', label: 'Real-Time', desc: 'Continuous monitoring, act as events arrive' },
];

const THRESHOLD_MIN = 0.70;
const THRESHOLD_MAX = 0.95;
const THRESHOLD_STEP = 0.01;

// ── Helpers ─────────────────────────────────────────────────────────────────

function nextSweepLabel(cadence) {
  const now = new Date();
  const h = now.getHours();

  switch (cadence) {
    case 'morning_only': {
      const next = new Date(now);
      next.setHours(7, 0, 0, 0);
      if (h >= 7) next.setDate(next.getDate() + 1);
      return next.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
    }
    case 'every_4h': {
      const slots = [7, 11, 15, 19];
      const nextSlot = slots.find(s => s > h) ?? slots[0];
      const next = new Date(now);
      next.setHours(nextSlot, 0, 0, 0);
      if (nextSlot <= h) next.setDate(next.getDate() + 1);
      return next.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
    }
    case 'hourly': {
      const next = new Date(now);
      next.setHours(h + 1, 0, 0, 0);
      return next.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' });
    }
    case 'realtime':
      return 'Continuous';
    default:
      return '--';
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export default function BehaviorTab({ config, onSave, loading }) {
  const { tone, cadence, autoApproveEnabled, autoApproveThreshold, dollarCap } = config;
  const nextSweep = useMemo(() => nextSweepLabel(cadence), [cadence]);

  if (loading) return null;

  return (
    <div className="space-y-6">
      {/* Tone */}
      <section>
        <h3 className="text-sm font-bold text-swoop-text mb-1">Tone</h3>
        <p className="text-xs text-swoop-text-label mb-3 m-0">How this agent communicates with members and in action descriptions.</p>
        <div className="space-y-2">
          {TONE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              data-testid={`tone-option-${opt.value}`}
              onClick={() => onSave({ tone: opt.value })}
              className={`w-full p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                tone === opt.value
                  ? 'border-brand-500 bg-brand-500/5'
                  : 'border-swoop-border hover:border-swoop-border'
              }`}
            >
              <div className="text-xs font-bold text-swoop-text">{opt.label}</div>
              <p className="text-[10px] text-swoop-text-label m-0 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Sweep Cadence */}
      <section>
        <h3 className="text-sm font-bold text-swoop-text mb-1">Sweep Cadence</h3>
        <p className="text-xs text-swoop-text-label mb-3 m-0">How often this agent scans for new actions to recommend.</p>
        <select
          value={cadence}
          onChange={e => onSave({ cadence: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-swoop-border bg-swoop-panel text-sm"
        >
          {CADENCE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {/* Description for selected cadence */}
        <p className="text-[10px] text-swoop-text-label mt-1 m-0">
          {CADENCE_OPTIONS.find(o => o.value === cadence)?.desc}
        </p>
        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-swoop-row border border-swoop-border">
          <svg className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-xs text-swoop-text-muted">
            Next sweep: <span className="font-semibold">{nextSweep}</span>
          </span>
        </div>
      </section>

      {/* Auto-Approve */}
      <section>
        <h3 className="text-sm font-bold text-swoop-text mb-1">Auto-Approve</h3>
        <p className="text-xs text-swoop-text-label mb-3 m-0">
          Let this agent execute actions automatically when confidence is high enough.
        </p>

        {/* Toggle */}
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            role="switch"
            aria-checked={autoApproveEnabled}
            aria-label="Toggle auto-approve"
            onClick={() => onSave({ autoApproveEnabled: !autoApproveEnabled })}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none ${
              autoApproveEnabled ? 'bg-brand-500' : 'bg-swoop-border'
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-swoop-panel shadow transition-transform ${
              autoApproveEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`} />
          </button>
          <span className="text-sm text-swoop-text-2">
            {autoApproveEnabled ? 'Auto-approve ON' : 'Manual review for all actions'}
          </span>
        </div>

        {autoApproveEnabled && (
          <div className="space-y-4 pl-1">
            {/* Confidence threshold slider */}
            <div>
              <label className="block text-xs font-medium text-swoop-text-muted mb-1">
                Confidence Threshold: {Math.round(autoApproveThreshold * 100)}%
              </label>
              <input
                type="range"
                min={THRESHOLD_MIN}
                max={THRESHOLD_MAX}
                step={THRESHOLD_STEP}
                value={autoApproveThreshold}
                onChange={e => onSave({ autoApproveThreshold: parseFloat(e.target.value) })}
                className="w-full accent-brand-500 h-1.5"
              />
              <div className="flex justify-between text-[10px] text-swoop-text-label mt-0.5">
                <span>More auto-approved (70%)</span>
                <span>Only high-confidence (95%)</span>
              </div>
            </div>

            {/* Dollar cap */}
            <div>
              <label className="block text-xs font-medium text-swoop-text-muted mb-1">
                Dollar Cap
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-swoop-text-label">$</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={dollarCap}
                  onChange={e => onSave({ dollarCap: e.target.value })}
                  placeholder="No limit"
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-swoop-border bg-swoop-panel text-sm"
                />
              </div>
              <p className="text-[10px] text-swoop-text-label mt-1 m-0">
                Actions above this dollar amount always require manual approval. Leave blank for no limit.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
