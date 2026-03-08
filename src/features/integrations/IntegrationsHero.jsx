// features/integrations/IntegrationsHero.jsx
import { theme } from '@/config/theme';

const heroStyle = {
  background: `linear-gradient(135deg, ${theme.colors.integrationHeroStart} 0%, ${theme.colors.sidebarHover} 50%, ${theme.colors.sidebarAccent} 100%)`,
  borderRadius: theme.radius.lg,
  padding: '40px 48px',
  marginBottom: theme.spacing.xl,
  color: theme.colors.white,
};

const headlineStyle = {
  fontFamily: theme.fonts.serif,
  fontSize: '28px',
  fontWeight: 700,
  color: theme.colors.white,
  margin: '0 0 12px 0',
  lineHeight: 1.2,
};

const subtitleStyle = {
  fontSize: theme.fontSize.md,
  color: 'rgba(255,255,255,0.75)',
  maxWidth: 560,
  lineHeight: 1.6,
  margin: '0 0 32px 0',
};

const statsRowStyle = {
  display: 'flex',
  gap: 48,
};

const statStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const statNumberStyle = {
  fontFamily: theme.fonts.mono,
  fontSize: '28px',
  fontWeight: 700,
  color: theme.colors.navFb,
  lineHeight: 1,
};

const statLabelStyle = {
  fontSize: theme.fontSize.sm,
  color: 'rgba(255,255,255,0.6)',
  fontWeight: 500,
};

export function IntegrationsHero({ integrationCount = 8, comboCount = 14 }) {
  return (
    <div style={heroStyle}>
      <h1 style={headlineStyle}>The Intelligence Layer on Top of Your Systems</h1>
      <p style={subtitleStyle}>
        Your systems collect data. Swoop connects them, adds real-time location intelligence and behavioral signals, then turns cross-system patterns into actionable recommendations. No single integration can provide this — it's what they unlock together.
      </p>
      <div style={statsRowStyle}>
        <div style={statStyle}>
          <span style={statNumberStyle}>{integrationCount}</span>
          <span style={statLabelStyle}>Available Integrations</span>
        </div>
        <div style={statStyle}>
          <span style={statNumberStyle}>{comboCount}</span>
          <span style={statLabelStyle}>Combo Insights</span>
        </div>
        <div style={statStyle}>
          <span style={statNumberStyle}>∞</span>
          <span style={statLabelStyle}>Automations</span>
        </div>
      </div>
    </div>
  );
}
