// Header — light bar above the main content
import { useState, useEffect } from 'react';
import { useNavigation } from '@/context/NavigationContext.jsx';
import { NAV_ITEMS } from '@/config/navigation.js';
import { CLUB_NAME, DEMO_MONTH, DEMO_TIMESTAMP } from '@/config/constants.js';
import { theme } from '@/config/theme';
import { getMemberSummary } from '@/services/memberService.js';
import { getDailyBriefing } from '@/services/briefingService.js';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const getDataNudges = () => {
  try {
    const summary = getMemberSummary();
    const briefing = getDailyBriefing();
    const atRiskCount = (summary.atRisk ?? 0) + (summary.critical ?? 0);
    const formattedDues = (summary.potentialDuesAtRisk || 733000) > 1000
      ? '$' + Math.round((summary.potentialDuesAtRisk || 733000) / 1000) + 'K'
      : '$' + (summary.potentialDuesAtRisk || 0).toLocaleString();
    const nudges = [];
    if (atRiskCount > 0) {
      nudges.push(atRiskCount + ' members at risk or critical — ' + formattedDues + '/yr in dues need attention today.');
    }
    if (briefing?.yesterdayRecap?.revenue) {
      const vsLastWeek = briefing.yesterdayRecap.revenueVsLastWeek;
      if (vsLastWeek !== undefined && vsLastWeek !== null) {
        const direction = vsLastWeek >= 0 ? 'up' : 'down';
        nudges.push("Yesterday's revenue was " + direction + ' ' + Math.abs(vsLastWeek) + '% vs. last week. ' + (vsLastWeek < 0 ? 'Check Revenue Leakage for drivers.' : 'Strong day.'));
      }
    }
    if (summary?.healthDistribution) {
      const declining = summary.healthDistribution.declining ?? summary.healthDistribution.atRisk ?? 0;
      if (declining > 0) {
        nudges.push(declining + ' members in declining health — early outreach can prevent ' + (declining > 3 ? 'multiple' : 'a') + ' resignation' + (declining > 1 ? 's' : '') + '.');
      }
    }
    return nudges.length > 0 ? nudges : ['All systems connected. Monitoring member health, revenue, and operations in real time.'];
  } catch (e) {
    return ['All systems connected. Monitoring member health, revenue, and operations in real time.'];
  }
};

export default function Header({ onMobileMenuToggle, isMobile = false }) {
  const { currentRoute, toggleSidebar, navigate } = useNavigation();
  const page = NAV_ITEMS.find((n) => n.key === currentRoute) || NAV_ITEMS[0];
  const handleMenuClick = onMobileMenuToggle || toggleSidebar;
  const [bannerIdx, setBannerIdx] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try { return localStorage.getItem('swoop_banner_dismissed') === 'true'; } catch { return false; }
  });
  const [nudges] = useState(() => getDataNudges());
  useEffect(() => {
    if (nudges.length <= 1) return;
    const timer = setInterval(() => setBannerIdx((i) => (i + 1) % nudges.length), 8000);
    return () => clearInterval(timer);
  }, [nudges.length]);
  const padding = isMobile ? '12px 16px' : '0 24px';
  const showGreeting = page?.key === 'today';

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
      {!bannerDismissed && (
        <div style={{ width: '100%', padding: '4px 12px', background: theme.colors.accent + '0A', borderBottom: '1px solid ' + theme.colors.accent + '20', fontSize: '12px', color: theme.colors.accent, fontWeight: 600, textAlign: 'center', transition: 'opacity 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{ flex: 1 }}>{nudges[bannerIdx]}</span>
          <button onClick={() => { setBannerDismissed(true); try { localStorage.setItem('swoop_banner_dismissed', 'true'); } catch {} }} style={{ background: 'none', border: 'none', color: theme.colors.accent, cursor: 'pointer', fontSize: '14px', padding: '0 4px', opacity: 0.6, lineHeight: 1 }} title='Dismiss'>×</button>
        </div>
      )}
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
            &#9776;
          </button>
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
          {currentRoute !== 'storyboard-flows' && (
            <button
              onClick={() => navigate('storyboard-flows')}
              title="Playbook Guides — see how your team uses Swoop"
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
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
              📖
            </button>
          )}
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
              <span style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)', lineHeight: 1.2, fontWeight: 600 }}>
                {getGreeting()}
              </span>
            )}
            <span style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)', lineHeight: 1.2, whiteSpace: 'normal' }}>
              {CLUB_NAME} &middot; {DEMO_MONTH}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: isMobile ? '4px 10px' : '3px 10px',
              borderRadius: '12px',
              background: theme.colors.accent + '12',
              border: '1px solid ' + theme.colors.accent + '30',
              width: isMobile ? '100%' : 'auto',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              rowGap: '4px',
              justifyContent: isMobile ? 'space-between' : 'flex-start',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.colors.accent, animation: 'pulse 2s infinite', flexShrink: 0 }} />
            <span style={{ fontSize: '10px', color: theme.colors.accent, fontWeight: 600, letterSpacing: '0.04em' }}>LIVE</span>
            <span style={{ fontSize: '10px', color: theme.colors.textMuted, flexShrink: 0 }}>&middot; Demo data: {DEMO_TIMESTAMP}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
