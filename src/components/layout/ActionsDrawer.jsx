// ActionsDrawer — Quick-access slide-in panel for pending actions
// Full inbox + playbooks + agents are in #/automations
import { useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigationContext } from '@/context/NavigationContext';

export default function ActionsDrawer({ isOpen, onClose }) {
  const drawerRef = useRef(null);
  const { inbox, approveAction, dismissAction } = useApp();
  const { navigate } = useNavigationContext();
  const pending = inbox.filter(i => i.status === 'pending').slice(0, 5);

  // Auto-focus first focusable element when drawer opens
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      const focusable = drawerRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length > 0) focusable[0].focus();
    }
  }, [isOpen]);

  // Trap focus inside drawer
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key !== 'Tab') return;
    const focusable = drawerRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, [onClose]);

  return (
    <>
      {isOpen && (
        <div onClick={onClose} className="fixed inset-0 bg-black/35 z-[200] transition-opacity duration-200" />
      )}

      <div
        ref={drawerRef}
        onKeyDown={handleKeyDown}
        className={`fixed top-0 right-0 h-screen bg-swoop-panel border-l border-swoop-border flex flex-col overflow-hidden z-[210] transition-transform duration-250 ${isOpen ? 'translate-x-0 shadow-theme-xl' : 'translate-x-full'}`}
        style={{ width: Math.min(420, typeof window !== 'undefined' ? window.innerWidth - 60 : 420) }}
        role="dialog"
        aria-label="Actions drawer"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-swoop-border flex justify-between items-center shrink-0">
          <div>
            <div className="text-base font-bold text-swoop-text">Action Queue</div>
            <div className="text-xs text-swoop-text-muted mt-0.5">
              {pending.length > 0 ? `${pending.length} action${pending.length > 1 ? 's' : ''} need review` : 'All caught up'}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close drawer" className="w-8 h-8 rounded-full border border-swoop-border bg-swoop-row text-swoop-text-muted text-base cursor-pointer flex items-center justify-center">
            &times;
          </button>
        </div>

        {/* Actions */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {pending.length === 0 ? (
            <div className="px-5 py-10 text-center text-swoop-text-muted text-sm">
              <div className="text-[32px] mb-3">&#10003;</div>
              <div className="font-semibold mb-1">All caught up</div>
              <div className="text-sm">No pending actions right now.</div>
            </div>
          ) : (
            pending.map(action => (
              <div key={action.id} className="border border-swoop-border rounded-xl px-4 py-3.5 bg-swoop-row">
                <div className="text-sm font-semibold text-swoop-text mb-1.5">{action.description}</div>
                <div className="text-xs text-swoop-text-muted mb-2.5">
                  {action.source} &middot; {action.actionType?.replace(/_/g, ' ').toLowerCase()}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                      const channel = (action.recommendedChannel || 'email').toLowerCase();
                      const execType = channel === 'sms' || channel === 'push' ? 'sms' : channel === 'call' ? 'staff_task' : 'email';
                      approveAction(action.id, { executionType: execType, memberId: action.memberId, memberName: action.memberName });
                    }} className="px-4 py-1.5 rounded-md bg-success-500 text-white border-none text-xs font-semibold cursor-pointer">Approve</button>
                  <button onClick={() => dismissAction(action.id)} className="px-4 py-1.5 rounded-md bg-transparent text-swoop-text-muted border border-swoop-border text-xs font-semibold cursor-pointer">Dismiss</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: View all link */}
        <div className="px-5 py-3 border-t border-swoop-border shrink-0">
          <button
            onClick={() => { onClose(); navigate('automations'); }}
            className="w-full py-2.5 rounded-lg border border-swoop-border bg-swoop-row text-sm font-semibold text-swoop-text-2 cursor-pointer hover:bg-swoop-row-hover transition-colors"
          >
            View all in Automations &rarr;
          </button>
        </div>
      </div>
    </>
  );
}
