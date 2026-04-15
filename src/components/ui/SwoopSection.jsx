import { useState } from 'react';

/**
 * SwoopSection — dark-themed collapsible section using the
 * canonical .swoop-section class hooks from swoop-dark.css.
 *
 * Matches the layout in today.html: header with title + optional count pill
 * + peek text + chevron. Body is customizable via children.
 */
export default function SwoopSection({
  title,
  titleColor,
  count,
  peek,
  defaultOpen = true,
  children,
  bodyClassName = '',
  bodyStyle,
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="swoop-section">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`swoop-section-header${open ? ' is-open' : ''}`}
      >
        <div className="swoop-section-summary">
          <span className="swoop-section-title" style={titleColor ? { color: titleColor } : undefined}>
            {title}
          </span>
          {count != null && <span className="swoop-count-pill">{count}</span>}
          {peek && <span className="swoop-section-peek">{peek}</span>}
        </div>
        <span className={`swoop-chevron${open ? ' is-open' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      {open && (
        <div className={`swoop-section-body ${bodyClassName}`} style={bodyStyle}>
          {children}
        </div>
      )}
    </div>
  );
}
