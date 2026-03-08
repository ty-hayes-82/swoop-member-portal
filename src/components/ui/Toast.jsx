import { useEffect, useState } from 'react';
import { theme } from '@/config/theme';

export function Toast({ message, variant = 'success', duration = 3000, onClose }) {
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

  const variants = {
    success: { bg: theme.colors.success, icon: '✓' },
    error: { bg: theme.colors.urgent, icon: '✕' },
    info: { bg: theme.colors.operations, icon: 'ℹ' },
    warning: { bg: theme.colors.warning, icon: '⚠' },
  };

  const config = variants[variant] || variants.success;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isExiting ? '-100px' : '24px',
        right: '24px',
        zIndex: 9999,
        background: config.bg,
        color: theme.colors.white,
        padding: '12px 20px',
        borderRadius: theme.radius.md,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: theme.fontSize.sm,
        fontWeight: 500,
        opacity: isExiting ? 0 : 1,
        transform: `translateY(${isExiting ? '20px' : '0'})`,
        transition: 'all 0.3s ease',
      }}
    >
      <span style={{ fontSize: '18px', fontWeight: 700 }}>{config.icon}</span>
      <span>{message}</span>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, variant = 'success', duration = 3000) => {
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
