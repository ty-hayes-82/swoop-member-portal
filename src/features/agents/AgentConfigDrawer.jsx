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
import { useState, useEffect, useCallback } from 'react';
import { getAgentConfig, updateAgentConfig } from '@/services/agentConfigService';
import { getClubId } from '@/services/apiClient';
import BehaviorTab from './BehaviorTab';
import NotificationsTab from './NotificationsTab';
import SegmentsTab from './SegmentsTab';

// ── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  { key: 'behavior', label: 'Behavior' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'segments', label: 'Segments' },
];

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

  // Partial-state updater passed to child tabs
  const handleFieldUpdate = useCallback((updates) => {
    if ('tone' in updates) setTone(updates.tone);
    if ('cadence' in updates) setCadence(updates.cadence);
    if ('autoApproveEnabled' in updates) setAutoApproveEnabled(updates.autoApproveEnabled);
    if ('autoApproveThreshold' in updates) setAutoApproveThreshold(updates.autoApproveThreshold);
    if ('dollarCap' in updates) setDollarCap(updates.dollarCap);
    if ('channels' in updates) setChannels(updates.channels);
    if ('segments' in updates) setSegments(updates.segments);
  }, []);

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
              {tab === 'behavior' && (
                <BehaviorTab
                  config={{ tone, cadence, autoApproveEnabled, autoApproveThreshold, dollarCap }}
                  onSave={handleFieldUpdate}
                  loading={loading}
                />
              )}
              {tab === 'notifications' && (
                <NotificationsTab
                  config={{ channels }}
                  onSave={handleFieldUpdate}
                />
              )}
              {tab === 'segments' && (
                <SegmentsTab
                  config={{ segments }}
                  onSave={handleFieldUpdate}
                />
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
