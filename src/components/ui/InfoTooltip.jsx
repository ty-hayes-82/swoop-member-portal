import { useState } from 'react';
import { theme } from '@/config/theme';

export default function InfoTooltip({ text, children }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children || (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            border: `1px solid ${theme.colors.textMuted}`,
            color: theme.colors.textMuted,
            fontSize: '10px',
            fontWeight: 600,
            marginLeft: '4px',
          }}
        >
          ⓘ
        </span>
      )}
      {isVisible && (
        <span
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: theme.colors.bgSidebar,
            color: theme.colors.white,
            padding: '8px 12px',
            borderRadius: theme.radius.sm,
            fontSize: theme.fontSize.xs,
            lineHeight: 1.5,
            maxWidth: '280px',
            whiteSpace: 'normal',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
          }}
        >
          {text}
          <span
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${theme.colors.bgSidebar}`,
            }}
          />
        </span>
      )}
    </span>
  );
}
