/**
 * ActionCard — reusable action-queue card used across Today, Inbox, and
 * anywhere else the product surfaces a pending AI/human action.
 *
 * Default (collapsed) view:
 *   [priority pill] [owner pill] [source badge]                [snooze] [approve]
 *   Title / description
 *   Impact metric
 *
 * Click the card body to expand it. Expanded content is fully customizable
 * via `children` — callers pass whatever extra detail belongs on that page
 * (rationale, drafted message preview, signals, member header, etc.).
 *
 * Props:
 *   action            — required. { id, priority, description, impactMetric, source, actionType }
 *   ownerLabel        — string. Role pill text. Default "GM".
 *   leftAccentColor   — string. Override left-border color. Defaults from priority.
 *   titleNode         — ReactNode. Replaces the default `action.description` title.
 *   impactNode        — ReactNode. Replaces the default `action.impactMetric` line.
 *   onApprove         — (action) => void. Shows Approve button.
 *   onDismiss         — (action) => void. Optional — hidden unless provided.
 *   onSnooze          — (action, hours) => void. Optional — hidden unless provided.
 *   approveLabel      — string. Default "✓ Approve".
 *   expanded          — boolean. Controlled expansion.
 *   defaultExpanded   — boolean. Uncontrolled initial expansion.
 *   onToggle          — (next) => void. Fires on expansion change.
 *   children          — ReactNode. Expanded-state content.
 *   className         — extra classes on outer wrapper.
 */
import { useState } from 'react';
import SourceBadge from './SourceBadge';

const PRIORITY_COLORS = {
  high:   'rgb(239, 68, 68)',
  medium: 'rgb(245, 158, 11)',
  low:    'rgb(156, 163, 175)',
};

function priorityColor(priority) {
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium;
}

export default function ActionCard({
  action,
  ownerLabel = 'GM',
  leftAccentColor,
  titleNode,
  impactNode,
  onApprove,
  onDismiss,
  onSnooze,
  approveLabel = '✓ Approve',
  expanded: controlledExpanded,
  defaultExpanded = false,
  onToggle,
  children,
  className = '',
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultExpanded);
  const isControlled = controlledExpanded != null;
  const isExpanded = isControlled ? controlledExpanded : uncontrolled;

  const priority = action?.priority || 'medium';
  const accent = leftAccentColor || priorityColor(priority);
  const badgeColor = priorityColor(priority);

  const toggle = () => {
    const next = !isExpanded;
    if (!isControlled) setUncontrolled(next);
    if (onToggle) onToggle(next);
  };

  const stop = (fn) => (e) => {
    e.stopPropagation();
    if (fn) fn();
  };

  // Canonical container tint (STYLING.md §2.8): severity-tinted row with
  // background rgba(color,0.07) and border rgba(color,0.18).
  const tintBg = `${accent}12`;      // ~0.07 alpha
  const tintBorder = `${accent}2E`;  // ~0.18 alpha

  return (
    <div className={className}>
      <div
        onClick={toggle}
        className="swoop-detail-row cursor-pointer"
        style={{
          background: tintBg,
          borderColor: tintBorder,
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {/* Header strip: severity badge · owner · source · spacer · actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: badgeColor,
              background: `${badgeColor}26`,
              border: `1px solid ${badgeColor}4D`,
              padding: '2px 7px',
              borderRadius: 999,
              flexShrink: 0,
            }}
          >
            {priority}
          </span>

          <div className="font-bold text-sm text-white leading-snug" style={{ minWidth: 0, flex: '1 1 auto' }}>
            {titleNode ?? action?.description}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {ownerLabel && (
              <span className="text-[9px] font-bold py-0.5 px-1.5 rounded bg-brand-500/[0.06] text-brand-500 uppercase tracking-tight">
                {ownerLabel}
              </span>
            )}
            {action?.source && (
              <SourceBadge
                system={
                  action.source === 'anthropic' ? 'Swoop AI' :
                  action.source === 'fb-intelligence' ? 'F&B Intelligence' :
                  action.source
                }
                size="xs"
              />
            )}
            {onSnooze && (
              <button
                type="button"
                onClick={stop(() => onSnooze(action, 24))}
                className="text-[10px] font-semibold py-0.5 px-2 rounded-md border-none cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
                title="Snooze 24h"
              >
                Snooze 24h
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                onClick={stop(() => onDismiss(action))}
                className="text-[10px] font-semibold py-0.5 px-2 rounded-md border-none cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
                title="Dismiss"
              >
                Dismiss
              </button>
            )}
            {onApprove && (
              <button
                type="button"
                onClick={stop(() => onApprove(action))}
                className="swoop-action-btn"
              >
                {approveLabel}
              </button>
            )}
          </div>
        </div>

        {/* Impact line — muted sub-text under the header strip */}
        {(impactNode ?? action?.impactMetric) && (
          <div
            className="text-xs leading-snug"
            style={{ color: 'rgba(255,255,255,0.65)', marginTop: 6, width: '100%' }}
          >
            {impactNode ?? action?.impactMetric}
          </div>
        )}
      </div>

      {/* Expanded customizable content */}
      {isExpanded && children && (
        <div onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  );
}

export { PRIORITY_COLORS, priorityColor };
