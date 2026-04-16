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
  urgent: 'rgb(168, 85, 247)',
  high:   'rgb(239, 68, 68)',
  medium: 'rgb(245, 158, 11)',
  low:    'rgb(34, 197, 94)',
};

// rgb triples used for alpha-compose shadows/gradients
const PRIORITY_RGB = {
  urgent: '168,85,247',
  high:   '239,68,68',
  medium: '245,158,11',
  low:    '34,197,94',
};

function priorityColor(priority) {
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium;
}

function priorityRgb(priority) {
  return PRIORITY_RGB[priority] || PRIORITY_RGB.medium;
}

function memberInitials(name) {
  if (!name) return '';
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
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
  const rgb = priorityRgb(priority);
  const initials = memberInitials(action?.memberName);

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
  // background rgba(color,0.07) and border rgba(color,0.18), plus a 3px
  // colored left-border accent for fast visual hierarchy.
  const tintBorder = `rgba(${rgb},0.22)`;

  return (
    <div className={`${className} swoop-action-card-wrap`}>
      <div
        onClick={toggle}
        className="swoop-detail-row swoop-action-card cursor-pointer"
        style={{
          background: `linear-gradient(90deg, rgba(${rgb},0.08) 0%, rgba(${rgb},0.035) 100%)`,
          borderColor: tintBorder,
          borderLeftColor: accent,
          borderLeftWidth: 3,
          flexDirection: 'column',
          gap: 0,
          // exposed for hover glow in CSS
          ['--priority-glow']: `rgba(${rgb},0.28)`,
        }}
      >
        {/* Header strip: severity badge · avatar · title · owner · source · spacer · actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: badgeColor,
              background: `rgba(${rgb},0.14)`,
              border: `1px solid rgba(${rgb},0.4)`,
              padding: '3px 9px',
              borderRadius: 999,
              flexShrink: 0,
            }}
          >
            {priority}
          </span>

          {initials && (
            <span
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: `linear-gradient(135deg, rgba(${rgb},0.55), rgba(${rgb},0.22))`,
                border: `1px solid rgba(${rgb},0.5)`,
                color: '#fff',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.02em',
                flexShrink: 0,
              }}
            >
              {initials}
            </span>
          )}

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
                className="swoop-ghost-btn"
                title="Dismiss (D)"
              >
                Dismiss
              </button>
            )}
            {onApprove && (
              <button
                type="button"
                onClick={stop(() => onApprove(action))}
                className="swoop-approve-btn"
                title="Approve (A)"
              >
                {approveLabel}
              </button>
            )}
          </div>
        </div>

        {/* Impact line — muted sub-text under the header strip, visually
            separated from the action area so it reads as supporting info. */}
        {(impactNode ?? action?.impactMetric) && (
          <div
            className="text-[11px] leading-snug"
            style={{
              color: 'rgba(255,255,255,0.55)',
              marginTop: 10,
              paddingTop: 8,
              borderTop: '1px solid rgba(255,255,255,0.07)',
              width: '100%',
            }}
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
