// VendorLandscapeSection.jsx — full vendor landscape organized by category
// Props contract: { categories: VENDOR_LANDSCAPE[] }
import { theme } from '@/config/theme';

const TIER_COLOR = {
  primary:      theme.colors.success,
  supported:    theme.colors.textMuted,
  coming_soon:  theme.colors.textMuted,
};
const TIER_BG = {
  primary:      `${theme.colors.success}12`,
  supported:    theme.colors.bgDeep,
  coming_soon:  theme.colors.bgDeep,
};
const TIER_BORDER = {
  primary:      `${theme.colors.success}30`,
  supported:    theme.colors.border,
  coming_soon:  theme.colors.border,
};
const TIER_LABEL = { primary: 'Live', supported: 'Supported', coming_soon: 'Soon' };

export default function VendorLandscapeSection({ categories }) {
  const totalVendors = categories.reduce((n, c) => n + c.vendors.length, 0);

  return (
    <div>
      <div style={{ marginBottom: theme.spacing.sm }}>
        <div style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary }}>
          Full Vendor Landscape
        </div>
        <div style={{ fontSize: '11px', color: theme.colors.textMuted, marginTop: '2px' }}>
          {totalVendors}+ compatible vendors across {categories.length} categories — Swoop works with what you already have
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing.sm }}>
        {categories.map(cat => {
          const color = theme.colors[cat.themeColor] || theme.colors.textMuted;
          const primaryCount   = cat.vendors.filter(v => v.tier === 'primary').length;
          const supportedCount = cat.vendors.filter(v => v.tier === 'supported').length;
          const soonCount      = cat.vendors.filter(v => v.tier === 'coming_soon').length;

          return (
            <div key={cat.category} style={{
              background: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              borderLeft: `3px solid ${color}`,
              borderRadius: theme.radius.sm,
              padding: theme.spacing.sm,
            }}>
              {/* Category header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', lineHeight: 1 }}>{cat.icon}</span>
                <div>
                  <div style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.textPrimary, lineHeight: 1.2 }}>
                    {cat.category}
                  </div>
                  <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginTop: '1px' }}>{cat.description}</div>
                </div>
              </div>

              {/* Vendor chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                {cat.vendors.map(v => (
                  <span key={v.name} style={{
                    fontSize: '10px',
                    fontWeight: v.tier === 'primary' ? 600 : 400,
                    color: TIER_COLOR[v.tier],
                    background: TIER_BG[v.tier],
                    border: `1px solid ${TIER_BORDER[v.tier]}`,
                    borderRadius: '3px',
                    padding: '2px 6px',
                    opacity: v.tier === 'coming_soon' ? 0.65 : 1,
                  }}>
                    {v.name}
                  </span>
                ))}
              </div>

              {/* Tier counts */}
              <div style={{ display: 'flex', gap: '10px', borderTop: `1px solid ${theme.colors.borderLight}`, paddingTop: '6px' }}>
                {primaryCount   > 0 && <Tally label="Live"      count={primaryCount}   color={theme.colors.success} />}
                {supportedCount > 0 && <Tally label="Supported" count={supportedCount} color={theme.colors.textMuted} />}
                {soonCount      > 0 && <Tally label="Coming"    count={soonCount}      color={theme.colors.textMuted} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Tally({ label, count, color }) {
  return (
    <span style={{ fontSize: '10px', color, display: 'flex', alignItems: 'center', gap: '3px' }}>
      <span style={{ fontWeight: 700, fontFamily: theme.fonts.mono }}>{count}</span>
      <span>{label}</span>
    </span>
  );
}
