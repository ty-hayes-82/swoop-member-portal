import React, { useState } from 'react';
import { useNavigationContext } from '@/context/NavigationContext';

const DISMISS_KEY = 'swoop_flowlink_dismissed';

export default function FlowLink({ flowNum, persona, desc }) {
  const { navigate } = useNavigationContext();
  const [hovered, setHovered] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === 'true'; } catch { return false; }
  });

  const handleDismiss = (e) => {
    e.stopPropagation();
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, 'true'); } catch {}
  };

  // Collapsed icon mode after dismiss
  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => navigate('storyboard-flows')}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={`See how ${persona} uses this \u2192 Flow ${flowNum}`}
        className={`text-xs cursor-pointer rounded-lg px-2 py-[3px] inline-flex items-center gap-1 transition-all duration-150 border ${
          hovered
            ? 'text-brand-500 bg-brand-50 border-brand-200'
            : 'text-swoop-text-muted bg-transparent border-transparent'
        }`}
      >
        \uD83D\uDCD6
      </button>
    );
  }

  // Full prompt mode (first visit)
  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        className={`text-xs bg-transparent border-none cursor-pointer py-1 px-0 inline-flex items-center gap-1 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 ${
          hovered ? 'text-brand-500' : 'text-swoop-text-muted'
        }`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => navigate('storyboard-flows')}
        title={desc || undefined}
      >
        \uD83D\uDCD6 See how {persona} uses this \u2192 Flow {flowNum}
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-[11px] text-swoop-text-muted bg-transparent border-none cursor-pointer px-1 py-0.5 opacity-50 focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-label="Dismiss guide prompt"
      >
        \u00D7
      </button>
    </div>
  );
}
