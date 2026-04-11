/**
 * AgentConfigDrawer — Sprint 2 GM-facing agent configuration panel.
 *
 * Tabbed layout:
 *   Tab 1 "Behavior"      — tone, sweep cadence, auto-approve w/ threshold + dollar cap
 *   Tab 2 "Notifications"  — channel toggles
 *   Tab 3 "Segments"       — member segment checkboxes
 *
 * Opens as a right-side drawer over the page. Saves via PATCH /api/agent-config.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAgentConfig, updateAgentConfig } from '@/services/agentConfigService';
import { getClubId } from '@/services/apiClient';

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

const NOTIFICATION_CHANNELS = [
  { key: 'in_app', label: 'In-App Inbox', desc: 'Notification in the Swoop action inbox' },
  { key: 'email', label: 'Email', desc: 'Summary email to the GM address on file' },
  { key: 'sms', label: 'SMS', desc: 'Text message for urgent or time-sensitive actions' },
  { key: 'slack', label: 'Slack', desc: 'Post to a connected Slack channel' },
];

const MEMBER_SEGMENTS = [
  { key: 'all_members', label: 'All Members' },
  { key: 'at_risk', label: 'At-Risk Members' },
  { key: 'new_members', label: 'New Members (< 90 days)' },
  { key: 'high_value', label: 'High-Value Members' },
  { key: 'inactive', label: 'Inactive (30+ days no visit)' },
  { key: 'board_members', label: 'Board Members' },
  { key: 'juniors', label: 'Junior / Social Members' },
];

const TABS = [
  { key: 'behavior', label: 'Behavior' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'segments', label: 'Segments' },
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

export default function AgentConfigDrawer({ agentId, agentName, open, onClose }) {
  const [tab, setTab] = useState('behavior');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Config state
  const [tone, setTone] = useState('professional');
  const [cadence, setCadence] = useState('every_4h');
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(false);
  const [autoApproveThreshold, setAutoApproveThreshold] = useState(0.85);
  const [dollarCap, setDollarCap] = useState('');
  const [channels, setChannels] = useState(['in_app']);
  const [segments, setSegments] = useState(['all_members']);

  // Load config when drawer opens
  useEffect(() => {
    if (!open || !agentId) return;
    let cancelled = false;
    setLoading(true);

    const clubId = getClubId();
    getAgentConfig(clubId, agentId).then(cfg => {
      if (cancelled || !cfg) { setLoading(false); return; }
      setTone(cfg.tone || 'professional');
      setCadence(cfg.schedule?.cadence || cfg.cadence || 'every_4h');
      setAutoApproveEnabled(cfg.auto_approve_enabled ?? cfg.enabled ?? false);
      setAutoApproveThreshold(cfg.auto_approve_threshold ?? 0.85);
      setDollarCap(cfg.dollar_cap != null ? String(cfg.dollar_cap) : '');
      setChannels(cfg.notification_channels ?? ['in_app']);
      setSegments(cfg.member_segments ?? ['all_members']);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [open, agentId]);

  // Save handler
  const handleSave = useCallback(async () => {
    setSaving(true);
    const clubId = getClubId();
    const updates = {
      tone,
      cadence,
      auto_approve_enabled: autoApproveEnabled,
      auto_approve_threshold: autoApproveThreshold,
      dollar_cap: dollarCap ? Number(dollarCap) : null,
      notification_channels: channels,
      member_segments: segments,
    };
    await updateAgentConfig(clubId, agentId, updates);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [agentId, tone, cadence, autoApproveEnabled, autoApproveThreshold, dollarCap, channels, segments]);

  // Channel toggle
  const toggleChannel = useCallback((key) => {
    setChannels(prev =>
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    );
  }, []);

  // Segment toggle
  const toggleSegment = useCallback((key) => {
    setSegments(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  }, []);

  const nextSweep = useMemo(() => nextSweepLabel(cadence), [cadence]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md z-50 flex flex-col bg-white dark:bg-gray-900 shadow-xl border-l border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-white/90 m-0">
              Configure {agentName || 'Agent'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 m-0">Per-agent behavior, notifications, and targeting.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer bg-transparent border-none transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div role="tablist" className="flex gap-0.5 mx-5 mt-4 rounded-lg bg-gray-100 p-0.5 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          {TABS.map(t => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none transition-all duration-150 ${
                tab === t.key
                  ? 'bg-white text-gray-800 shadow-theme-xs dark:bg-gray-700 dark:text-white'
                  : 'bg-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* ── Behavior Tab ─────────────────────────────────────── */}
              {tab === 'behavior' && (
                <div className="space-y-6">
                  {/* Tone */}
                  <section>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-1">Tone</h3>
                    <p className="text-xs text-gray-400 mb-3 m-0">How this agent communicates with members and in action descriptions.</p>
                    <div className="space-y-2">
                      {TONE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          data-testid={`tone-option-${opt.value}`}
                          onClick={() => setTone(opt.value)}
                          className={`w-full p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                            tone === opt.value
                              ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10'
                              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                          }`}
                        >
                          <div className="text-xs font-bold text-gray-800 dark:text-white/90">{opt.label}</div>
                          <p className="text-[10px] text-gray-400 m-0 mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Sweep Cadence */}
                  <section>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-1">Sweep Cadence</h3>
                    <p className="text-xs text-gray-400 mb-3 m-0">How often this agent scans for new actions to recommend.</p>
                    <select
                      value={cadence}
                      onChange={e => setCadence(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
                    >
                      {CADENCE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {/* Description for selected cadence */}
                    <p className="text-[10px] text-gray-400 mt-1 m-0">
                      {CADENCE_OPTIONS.find(o => o.value === cadence)?.desc}
                    </p>
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <svg className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        Next sweep: <span className="font-semibold">{nextSweep}</span>
                      </span>
                    </div>
                  </section>

                  {/* Auto-Approve */}
                  <section>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-1">Auto-Approve</h3>
                    <p className="text-xs text-gray-400 mb-3 m-0">
                      Let this agent execute actions automatically when confidence is high enough.
                    </p>

                    {/* Toggle */}
                    <div className="flex items-center gap-3 mb-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={autoApproveEnabled}
                        aria-label="Toggle auto-approve"
                        onClick={() => setAutoApproveEnabled(prev => !prev)}
                        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none ${
                          autoApproveEnabled ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          autoApproveEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                        }`} />
                      </button>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {autoApproveEnabled ? 'Auto-approve ON' : 'Manual review for all actions'}
                      </span>
                    </div>

                    {autoApproveEnabled && (
                      <div className="space-y-4 pl-1">
                        {/* Confidence threshold slider */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Confidence Threshold: {Math.round(autoApproveThreshold * 100)}%
                          </label>
                          <input
                            type="range"
                            min={THRESHOLD_MIN}
                            max={THRESHOLD_MAX}
                            step={THRESHOLD_STEP}
                            value={autoApproveThreshold}
                            onChange={e => setAutoApproveThreshold(parseFloat(e.target.value))}
                            className="w-full accent-brand-500 h-1.5"
                          />
                          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                            <span>More auto-approved (70%)</span>
                            <span>Only high-confidence (95%)</span>
                          </div>
                        </div>

                        {/* Dollar cap */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Dollar Cap
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                            <input
                              type="number"
                              min="0"
                              step="50"
                              value={dollarCap}
                              onChange={e => setDollarCap(e.target.value)}
                              placeholder="No limit"
                              className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
                            />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 m-0">
                            Actions above this dollar amount always require manual approval. Leave blank for no limit.
                          </p>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {/* ── Notifications Tab ────────────────────────────────── */}
              {tab === 'notifications' && (
                <div className="space-y-6">
                  <section>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-1">Notification Channels</h3>
                    <p className="text-xs text-gray-400 mb-3 m-0">
                      Choose how you want to be notified when this agent proposes or executes an action.
                    </p>
                    <div className="space-y-2">
                      {NOTIFICATION_CHANNELS.map(ch => {
                        const isOn = channels.includes(ch.key);
                        return (
                          <div
                            key={ch.key}
                            className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60"
                          >
                            <div>
                              <div className="text-xs font-bold text-gray-800 dark:text-white/90">{ch.label}</div>
                              <p className="text-[10px] text-gray-400 m-0 mt-0.5">{ch.desc}</p>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isOn}
                              aria-label={`Toggle ${ch.label}`}
                              onClick={() => toggleChannel(ch.key)}
                              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer border-none flex-shrink-0 ${
                                isOn ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            >
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                isOn ? 'translate-x-[18px]' : 'translate-x-0.5'
                              }`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              )}

              {/* ── Segments Tab ─────────────────────────────────────── */}
              {tab === 'segments' && (
                <div className="space-y-6">
                  <section>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-1">Member Segments</h3>
                    <p className="text-xs text-gray-400 mb-3 m-0">
                      Limit this agent to specific member segments. Unchecked segments are ignored by the agent.
                    </p>
                    <div className="space-y-2">
                      {MEMBER_SEGMENTS.map(seg => {
                        const isChecked = segments.includes(seg.key);
                        return (
                          <label
                            key={seg.key}
                            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSegment(seg.key)}
                              className="w-4 h-4 rounded accent-brand-500"
                            />
                            <span className="text-xs font-medium text-gray-800 dark:text-white/90">{seg.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer: Save */}
        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-lg font-bold text-sm text-white cursor-pointer border-none transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-500"
            style={{ background: saved ? '#12b76a' : '#ff8b00' }}
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </>
  );
}
