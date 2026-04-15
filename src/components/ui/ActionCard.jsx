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

  return (
    <div className={className}>
      <div
        onClick={toggle}
        className="py-3 px-4 rounded-xl bg-swoop-panel border border-swoop-border shadow-sm cursor-pointer transition-shadow duration-150 hover:shadow-md"
        style={{ borderLeft: `4px solid ${accent}` }}
      >
        {/* Top row: priority + owner + source · actions */}
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-[10px] font-bold uppercase tracking-wide py-0.5 px-2 rounded-[10px]"
              style={{ background: `${badgeColor}15`, color: badgeColor }}
            >
              {priority}
            </span>
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
          </div>
          <div className="flex items-center gap-1.5">
            {onSnooze && (
              <button
                type="button"
                onClick={stop(() => onSnooze(action, 24))}
                className="text-[10px] font-semibold text-swoop-text-muted py-0.5 px-2 rounded-[10px] bg-swoop-row hover:bg-gray-200 border-none cursor-pointer"
                title="Snooze 24h"
              >
                Snooze 24h
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                onClick={stop(() => onDismiss(action))}
                className="text-[10px] font-semibold text-swoop-text-muted py-0.5 px-2 rounded-[10px] bg-swoop-row hover:bg-gray-200 border-none cursor-pointer"
                title="Dismiss"
              >
                Dismiss
              </button>
            )}
            {onApprove && (
              <button
                type="button"
                onClick={stop(() => onApprove(action))}
                style={{
                  background: 'rgb(34, 197, 94)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s',
                }}
              >
                {approveLabel}
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-sm font-semibold text-swoop-text mb-0.5 leading-snug">
          {titleNode ?? action?.description}
        </div>

        {/* Impact line */}
        {(impactNode ?? action?.impactMetric) && (
          <div className="text-xs text-success-500 font-medium">
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
