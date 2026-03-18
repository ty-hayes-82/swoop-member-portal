// Sidebar — dark sidebar, light body. Classic club aesthetic.
import { useState } from 'react';
import { useNavigation } from '@/context/NavigationContext.jsx';
import { useApp } from '@/context/AppContext.jsx';
import { NAV_ITEMS } from '@/config/navigation.js';
import { theme } from '@/config/theme.js';

const SIDEBAR_BG    = theme.colors.bgSidebar;
const SIDEBAR_CARD  = theme.colors.sidebarCard;
const SIDEBAR_HOVER = theme.colors.sidebarHover;
const SIDEBAR_BORDER= theme.colors.sidebarBorder;
const SIDEBAR_ACTIVE_BG = 'rgba(255,255,255,0.08)';
const TEXT_LIGHT    = theme.colors.textOnDark;
const TEXT_DIM      = 'rgba(255,255,255,0.42)';
const TEXT_MUTED    = 'rgba(255,255,255,0.28)';

const SECTION_ORDER = ['INTELLIGENCE', 'REPORTING', 'SETTINGS'];

const SETTINGS_KEYS = new Set(
  NAV_ITEMS.filter((n) => n.section === 'SETTINGS' && !n.hidden).map((n) => n.key)
);

export default function Sidebar({ isMobile = false, mobileMenuOpen = false }) {
  const { currentRoute, navigate, sidebarCollapsed, toggleSidebar } = useNavigation();
  const { activeCount, totalRevenueImpact } = useApp();
  const w = isMobile ? 280 : sidebarCollapsed ? 52 : 240;

  // Settings section: collapsed by default, auto-expands when on a settings page
  const [settingsExpanded, setSettingsExpanded] = useState(SETTINGS_KEYS.has(currentRoute));

  const visibleNavItems = NAV_ITEMS.filter((n) => !n.hidden);
  const sectionBuckets = new Map();
  const sectionOrderFromItems = [];
  visibleNavItems.forEach((item) => {
    const label = item.section ?? 'INTELLIGENCE';
    if (!sectionBuckets.has(label)) {
      sectionBuckets.set(label, []);
      sectionOrderFromItems.push(label);
    }
    sectionBuckets.get(label).push(item);
  });

  const navSections = [];
  const addedSections = new Set();
  SECTION_ORDER.forEach((label) => {
    if (sectionBuckets.has(label)) {
      navSections.push({ label, items: sectionBuckets.get(label) });
      addedSections.add(label);
    }
  });
  sectionOrderFromItems.forEach((label) => {
    if (!addedSections.has(label) && sectionBuckets.has(label)) {
      navSections.push({ label, items: sectionBuckets.get(label) });
      addedSections.add(label);
    }
  });

  const basePosition = isMobile
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-110%)',
        transition: 'transform 0.25s ease',
        boxShadow: mobileMenuOpen ? '0 20px 80px rgba(0,0,0,0.45)' : 'none',
        zIndex: 120,
      }
    : {
        position: 'sticky',
        top: 0,
        zIndex: 10,
      };

  const isSettingsOpen = settingsExpanded || SETTINGS_KEYS.has(currentRoute);

  return (
    <aside style={{
      width: w,
      height: '100vh',
      background: SIDEBAR_BG,
      borderRight: `1px solid ${SIDEBAR_BORDER}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      overflow: 'hidden',
      flexShrink: 0,
      ...basePosition,
    }}>
      {/* Logo */}
      <div style={{
        padding: sidebarCollapsed && !isMobile ? '16px 0' : '20px 18px',
        borderBottom: `1px solid ${SIDEBAR_BORDER}`,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minHeight: '60px',
        justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '6px',
          flexShrink: 0,
          background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.operations})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: 800,
          color: theme.colors.white,
          letterSpacing: '-0.5px',
        }}>S</div>
        {(!sidebarCollapsed || isMobile) && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT_LIGHT, letterSpacing: '0.08em' }}>SWOOP</div>
            <div style={{ fontSize: '10px', color: TEXT_MUTED, letterSpacing: '0.04em' }}>Club Intelligence</div>
          </div>
        )}
      </div>

      {/* Revenue impact */}
      {(!sidebarCollapsed || isMobile) && activeCount > 0 && (
        <div style={{ margin: '0 12px 8px', padding: '10px 12px', background: theme.colors.sidebarAccent, border: `1px solid ${theme.colors.sidebarAccentBorder}`, borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: TEXT_MUTED, letterSpacing: '0.05em', marginBottom: '3px' }}>
            {activeCount} PLAN{activeCount > 1 ? 'S' : ''} ACTIVE
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600, color: theme.colors.accent }}>
            +${(totalRevenueImpact.annual / 1000).toFixed(0)}K/yr
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {navSections.map((section) => {
          const isSettings = section.label === 'SETTINGS';

          return (
            <div key={section.label}>
              {/* Section separator + header */}
              {(!sidebarCollapsed || isMobile) && (
                <>
                  {isSettings && (
                    <div style={{
                      margin: '12px 14px 0',
                      borderTop: `1px solid ${SIDEBAR_BORDER}`,
                    }} />
                  )}
                  {isSettings ? (
                    <button
                      onClick={() => setSettingsExpanded((v) => !v)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 8,
                        padding: '8px 14px 4px',
                        fontSize: 10,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: TEXT_MUTED,
                        fontWeight: 700,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <span>{section.label}</span>
                      <span style={{ fontSize: 12, transition: 'transform 0.15s', transform: isSettingsOpen ? 'rotate(90deg)' : 'none' }}>›</span>
                    </button>
                  ) : (
                    <div
                      style={{
                        marginTop: 8,
                        padding: '8px 14px 4px',
                        fontSize: 10,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: TEXT_MUTED,
                        fontWeight: 700,
                      }}
                    >
                      {section.label}
                    </div>
                  )}
                </>
              )}
              {/* Nav items — hide Settings items when collapsed */}
              {(!isSettings || isSettingsOpen || (sidebarCollapsed && !isMobile)) && section.items.map((item) => {
                const active = currentRoute === item.key;
                const isIntelligence = section.label === 'INTELLIGENCE';
                const inactiveWeight = isIntelligence ? 350 : 400;
                return (
                  <button
                    key={item.key}
                    onClick={() => navigate(item.key)}
                    title={sidebarCollapsed && !isMobile ? item.label : undefined}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: sidebarCollapsed && !isMobile ? '15px 0' : '12px 14px',
                      minHeight: '44px',
                      justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'flex-start',
                      background: active ? SIDEBAR_ACTIVE_BG : 'none',
                      borderLeft: active ? `3px solid ${item.color}` : '3px solid transparent',
                      color: active ? TEXT_LIGHT : TEXT_DIM,
                      boxShadow: active ? 'inset 0 0 0 1px rgba(255,255,255,0.06)' : 'none',
                      fontSize: '13px',
                      fontWeight: active ? 600 : inactiveWeight,
                      transition: 'all 0.12s',
                      cursor: 'pointer',
                      borderRight: 'none',
                      borderTop: 'none',
                      borderBottom: 'none',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.background = theme.colors.sidebarTint;
                        e.currentTarget.style.color = TEXT_LIGHT;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = TEXT_DIM;
                      }
                    }}
                  >
                    <span style={{ fontSize: '14px', flexShrink: 0, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                    {(!sidebarCollapsed || isMobile) && (
                      <span
                        style={{
                          display: 'flex',
                          flexDirection: item.key === 'daily-briefing' ? 'column' : 'row',
                          alignItems: item.key === 'daily-briefing' ? 'flex-start' : 'center',
                          gap: item.key === 'daily-briefing' ? '4px' : '8px',
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            overflow: item.key === 'daily-briefing' ? 'visible' : 'hidden',
                            textOverflow: item.key === 'daily-briefing' ? 'unset' : 'ellipsis',
                            whiteSpace: item.key === 'daily-briefing' ? 'normal' : 'nowrap',
                          }}
                        >
                          {item.label}
                        </span>
                        {item.key === 'daily-briefing' && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '9px',
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              color: theme.colors.success,
                              background: `${theme.colors.success}12`,
                              padding: '2px 6px',
                              borderRadius: '999px',
                              border: `1px solid ${theme.colors.success}40`,
                            }}
                          >
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: theme.colors.success, boxShadow: `0 0 6px ${theme.colors.success}` }} />
                            Start Here
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Demo Environment badge */}
      {(!sidebarCollapsed || isMobile) && (
        <div
          style={{
            margin: '0 12px 8px',
            padding: '7px 10px',
            background: theme.colors.sidebarTint,
            border: `1px solid ${SIDEBAR_BORDER}`,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.colors.accent, opacity: 0.6, flexShrink: 0 }} />
          <span style={{ fontSize: '10px', color: TEXT_MUTED, letterSpacing: '0.04em' }}>
            Demo Environment — Oakmont Hills CC simulated data Jan 2026
          </span>
        </div>
      )}

      {/* Conversion CTA */}
      {(!sidebarCollapsed || isMobile) && (
        <a
          href="https://swoop-member-intelligence-website.vercel.app/book-demo"
          target="_blank"
          rel="noreferrer"
          style={{
            margin: '0 12px 8px',
            padding: '12px',
            borderRadius: '8px',
            border: `1px solid ${SIDEBAR_BORDER}`,
            background: SIDEBAR_CARD,
            color: TEXT_LIGHT,
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED }}>Get Swoop for your club</span>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Book a live walkthrough →</span>
        </a>
      )}

      {/* Toggle */}
      <div style={{ borderTop: `1px solid ${SIDEBAR_BORDER}`, padding: '12px', display: 'flex', justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'flex-end' }}>
        <button
          onClick={toggleSidebar}
          style={{
            minWidth: '44px',
            minHeight: '44px',
            borderRadius: '6px',
            background: SIDEBAR_CARD,
            border: `1px solid ${SIDEBAR_BORDER}`,
            color: TEXT_MUTED,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {sidebarCollapsed ? '›' : '‹'}
        </button>
      </div>
    </aside>
  );
}
