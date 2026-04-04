import { useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';

export default function BackLink({ to = 'daily-briefing', label = 'Back to Cockpit' }) {
  const { navigate } = useNavigation();
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => navigate(to)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`inline-flex items-center gap-1 bg-transparent border-none cursor-pointer text-xs font-semibold py-1 px-0 mb-3 transition-colors duration-150 ${
        hovered ? 'text-brand-500' : 'text-gray-500 dark:text-gray-400'
      }`}
    >
      \u2190 {label}
    </button>
  );
}
