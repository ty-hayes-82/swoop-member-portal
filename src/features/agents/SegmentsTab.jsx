/**
 * SegmentsTab — Member segment checkboxes.
 *
 * Extracted from AgentConfigDrawer.jsx (Step 5 cleanup).
 *
 * Props:
 *   config  — { segments: string[] }
 *   onSave  — (updates: { segments: string[] }) => void
 */
import { useCallback } from 'react';

// ── Constants ───────────────────────────────────────────────────────────────

const MEMBER_SEGMENTS = [
  { key: 'all_members', label: 'All Members' },
  { key: 'at_risk', label: 'At-Risk Members' },
  { key: 'new_members', label: 'New Members (< 90 days)' },
  { key: 'high_value', label: 'High-Value Members' },
  { key: 'inactive', label: 'Inactive (30+ days no visit)' },
  { key: 'board_members', label: 'Board Members' },
  { key: 'juniors', label: 'Junior / Social Members' },
];

// ── Component ───────────────────────────────────────────────────────────────

export default function SegmentsTab({ config, onSave }) {
  const { segments } = config;

  const toggleSegment = useCallback((key) => {
    const updated = segments.includes(key)
      ? segments.filter(s => s !== key)
      : [...segments, key];
    onSave({ segments: updated });
  }, [segments, onSave]);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-bold text-swoop-text mb-1">Member Segments</h3>
        <p className="text-xs text-swoop-text-label mb-3 m-0">
          Limit this agent to specific member segments. Unchecked segments are ignored by the agent.
        </p>
        <div className="space-y-2">
          {MEMBER_SEGMENTS.map(seg => {
            const isChecked = segments.includes(seg.key);
            return (
              <label
                key={seg.key}
                className="flex items-center gap-3 p-3 rounded-xl border border-swoop-border bg-swoop-panel cursor-pointer hover:border-swoop-border transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleSegment(seg.key)}
                  className="w-4 h-4 rounded accent-brand-500"
                />
                <span className="text-xs font-medium text-swoop-text">{seg.label}</span>
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}
