import { useState } from 'react';
import { theme } from '@/config/theme';

export default function CollapsibleSection({ 
  title, 
  children, 
  defaultExpanded = false,
  icon = '📘'
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div style={{
      background: theme.colors.bgCard,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.md,
      overflow: 'hidden',
      marginBottom: theme.spacing.lg,
    }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '14px 18px',
          background: theme.colors.bgDeep,
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = theme.colors.borderLight}
        onMouseLeave={(e) => e.currentTarget.style.background = theme.colors.bgDeep}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ 
            fontSize: theme.fontSize.md, 
            fontWeight: 600, 
            color: theme.colors.textPrimary 
          }}>
            {title}
          </span>
        </div>
        <span style={{ 
          fontSize: 20, 
          color: theme.colors.textMuted,
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          display: 'inline-block',
        }}>
          ▼
        </span>
      </button>
      
      {isExpanded && (
        <div style={{ 
          padding: theme.spacing.lg,
          animation: 'slideDown 0.2s ease-out',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}
