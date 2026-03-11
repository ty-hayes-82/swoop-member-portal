import { useEffect, useState } from 'react';
import { theme } from '@/config/theme';

// DES-P10: Page transition component for smooth route changes

export default function PageTransition({ children, duration = 300 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
      }}
    >
      {children}
    </div>
  );
}

// Card animation component
export function AnimatedCard({ 
  children, 
  delay = 0, 
  duration = 400,
  style = {},
  ...props 
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// Button press animation wrapper
export function AnimatedButton({ 
  children, 
  onClick,
  style = {},
  hoverScale = 1.02,
  activeScale = 0.98,
  ...props 
}) {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onClick={onClick}
      style={{
        transform: isPressed 
          ? `scale(${activeScale})` 
          : isHovered 
          ? `scale(${hoverScale})` 
          : 'scale(1)',
        transition: 'transform 0.15s ease',
        cursor: 'pointer',
        border: 'none',
        background: 'transparent',
        padding: 0,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

// Number counter animation
export function AnimatedNumber({ 
  value, 
  duration = 1000,
  prefix = '',
  suffix = '',
  decimals = 0,
  style = {}
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const start = 0;
    const end = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [value, duration]);

  return (
    <span style={style}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
}

// Loading spinner component
export function LoadingSpinner({ 
  size = 24, 
  color = theme.colors.accent,
  style = {} 
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid ${color}20`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        ...style,
      }}
    />
  );
}

// Inject spin animation
if (typeof document !== 'undefined' && !document.getElementById('spin-keyframes')) {
  const style = document.createElement('style');
  style.id = 'spin-keyframes';
  style.innerHTML = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
