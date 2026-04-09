import { useEffect, useState } from 'react';

const VARIANT_CONFIG = {
  success: { bgCls: 'bg-success-500', icon: '\u2713' },
  error:   { bgCls: 'bg-error-500', icon: '\u2715' },
  info:    { bgCls: 'bg-blue-light-500', icon: '\u2139' },
  warning: { bgCls: 'bg-warning-500', icon: '\u26A0' },
};

// 2026-04-09 wave 14 web button audit P0 fix: belt-and-suspenders against
// the showToast({ type, message }) calling pattern that bypassed the
// (message, variant) signature. Some legacy callers passed an object as
// the first arg, which Toast then tried to render directly inside a
// <span>, throwing "Objects are not valid as a React child" and crashing
// the entire ToastContainer. Now we coerce any non-string `message` to a
// safe string representation. The buggy callers have ALSO been fixed to
// pass strings — this guard exists so a future regression can't crash
// the demo.
function coerceMessage(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  // Object form: prefer .message, then .text, then JSON for debug visibility
  if (typeof value === 'object') {
    if (typeof value.message === 'string') return value.message;
    if (typeof value.text === 'string') return value.text;
    try { return JSON.stringify(value); } catch { return '[Toast: invalid message]'; }
  }
  return String(value);
}

export function Toast({ message, variant = 'success', duration = 4000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.success;
  const safeMessage = coerceMessage(message);

  return (
    <div
      className={`fixed right-6 z-[9999] ${config.bgCls} text-white px-6 py-3.5 rounded-xl shadow-theme-xl border border-white/15 flex items-center gap-2.5 text-sm font-medium transition-all duration-300`}
      style={{
        bottom: isExiting ? '-100px' : '24px',
        opacity: isExiting ? 0 : 1,
        transform: `translateY(${isExiting ? '20px' : '0'})`,
      }}
    >
      <span className="text-lg font-bold">{config.icon}</span>
      <span>{safeMessage}</span>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  // 2026-04-09 wave 14 fix: also accept the object-form signature
  // showToast({ type: 'success', message: '...' }) so legacy callers don't
  // crash. The (message, variant) form is still preferred and documented.
  const showToast = (messageOrOptions, variant = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    let resolvedMessage = messageOrOptions;
    let resolvedVariant = variant;
    let resolvedDuration = duration;
    if (messageOrOptions && typeof messageOrOptions === 'object' && !Array.isArray(messageOrOptions)) {
      // Caller used the object form
      resolvedMessage = messageOrOptions.message ?? messageOrOptions.text ?? '';
      resolvedVariant = messageOrOptions.type ?? messageOrOptions.variant ?? variant;
      resolvedDuration = messageOrOptions.duration ?? duration;
    }
    setToasts((prev) => [...prev, { id, message: resolvedMessage, variant: resolvedVariant, duration: resolvedDuration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );

  return { showToast, ToastContainer };
}
