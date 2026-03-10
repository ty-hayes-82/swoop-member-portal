// Header — light bar above the main content
import { useNavigation } from '@/context/NavigationContext.jsx';
import { NAV_ITEMS } from '@/config/navigation.js';
import { CLUB_NAME, DEMO_MONTH } from '@/config/constants.js';
import { theme } from '@/config/theme';

// Greeting changes by time of day (simulated — based on 7am for demo morning mode)
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function Header({ onMobileMenuToggle, isMobile = false }) {
  const { currentRoute, toggleSidebar } = useNavigation();
  const page = NAV_ITEMS.find((n) => n.key === currentRoute) || NAV_ITEMS[0];
  const handleMenuClick = onMobileMenuToggle || toggleSidebar;
  const padding = isMobile ? '12px 16px' : '0 24px';
  const showGreeting = page?.key === 'daily-briefing';

  return (
    <header
      style={{
        minHeight: '60px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding,
        background: 'var(--bg-card)',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          width: '100%',
          gap: isMobile ? '12px' : '16px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flex: isMobile ? '0 0 auto' : 1,
            minWidth: 0,
          }}
        >
          <button
            onClick={handleMenuClick}
            style={{
              minWidth: '44px',
              minHeight: '44px',
              borderRadius: '6px',
              background: 'var(--bg-deep)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ☰
          </button>

          {/* Accent line */}
          <div style={{ width: 3, height: 28, borderRadius: 2, background: page.color, flexShrink: 0 }} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {page.label}
            </h1>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                lineHeight: 1.2,
                marginTop: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: isMobile ? 'normal' : 'nowrap',
              }}
            >
              {page.subtitle}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '8px' : '12px',
            marginLeft: isMobile ? 0 : 'auto',
            width: isMobile ? '100%' : 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isMobile ? 'flex-start' : 'flex-end',
              textAlign: isMobile ? 'left' : 'right',
              gap: 2,
              minWidth: 0,
            }}
          >
            {showGreeting && (
              <span
                style={{
                  fontSize: isMobile ? '11px' : '12px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.2,
                  fontWeight: 600,
                }}
              >
                {getGreeting()}
              </span>
            )}
            <span
              style={{
                fontSize: isMobile ? '11px' : '12px',
                color: 'var(--text-muted)',
                lineHeight: 1.2,
                whiteSpace: 'normal',
              }}
            >
              {CLUB_NAME} · {DEMO_MONTH}
            </span>
          </div>

          {/* Data freshness indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: isMobile ? '4px 10px' : '3px 10px',
              borderRadius: '12px',
              background: `${theme.colors.accent}12`,
              border: `1px solid ${theme.colors.accent}30`,
              width: isMobile ? '100%' : 'auto',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              rowGap: '4px',
              justifyContent: isMobile ? 'space-between' : 'flex-start',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: theme.colors.accent,
                animation: 'pulse 2s infinite',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '10px',
                color: theme.colors.accent,
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              LIVE
            </span>
            <span
              style={{
                fontSize: '10px',
                color: theme.colors.textMuted,
                flexShrink: 0,
              }}
            >
              · Demo data: Jan 17, 2026 7:00 AM
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
