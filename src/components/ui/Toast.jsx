import { useEffect, useState } from 'react';

const VARIANT_CONFIG = {
  success: { bgCls: 'bg-success-500', icon: '\u2713' },
  error:   { bgCls: 'bg-error-500', icon: '\u2715' },
  info:    { bgCls: 'bg-blue-light-500', icon: '\u2139' },
  warning: { bgCls: 'bg-warning-500', icon: '\u26A0' },
};

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
      <span>{message}</span>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, variant = 'success', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, variant, duration }]);
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
