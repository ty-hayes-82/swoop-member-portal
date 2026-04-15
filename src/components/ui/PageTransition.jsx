import { useEffect, useState } from 'react';

// DES-P10: Page transition component for smooth route changes

export default function PageTransition({ children, duration = 300 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
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
  className = '',
  ...props
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
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
  className = '',
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
      className={`cursor-pointer border-none bg-transparent p-0 transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 ${className}`}
      style={{
        transform: isPressed
          ? `scale(${activeScale})`
          : isHovered
          ? `scale(${hoverScale})`
          : 'scale(1)',
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
  className = ''
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
    <span className={className}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
}

// Loading spinner component
export function LoadingSpinner({
  size = 24,
  className = ''
}) {
  return (
    <div
      className={`rounded-full border-3 border-brand-100 border-t-brand-500 animate-spin ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
