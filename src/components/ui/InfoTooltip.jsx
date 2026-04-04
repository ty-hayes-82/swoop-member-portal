import { useState } from 'react';

export default function InfoTooltip({ text, children }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center cursor-help"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children || (
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-gray-400 text-gray-400 text-[10px] font-semibold ml-1 dark:border-gray-500 dark:text-gray-500">
          \u24D8
        </span>
      )}
      {isVisible && (
        <span className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg text-xs leading-relaxed max-w-[280px] whitespace-normal z-[1000] shadow-theme-lg pointer-events-none dark:bg-gray-900">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-800 dark:border-t-gray-900" />
        </span>
      )}
    </span>
  );
}
