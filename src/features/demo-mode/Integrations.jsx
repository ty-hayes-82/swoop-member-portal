// Integrations.jsx — Full vendor catalog with category filtering + detail panel
// Data flow: integrationsService → this component → primitives only
import { useState, useRef } from 'react';
import { theme } from '@/config/theme';
import {
  getCombos, resolveSparklineData,
  getCategoryStats, getVendorsByCategory, getVendorById,
  getCombosForVendor, getIntegrationSummary,
} from '@/services/integrationsService';
import IntegrationHealthStrip from '@/components/ui/IntegrationHealthStrip';
import IntegrationMap        from '@/components/ui/IntegrationMap';
import ComboInsightCard      from '@/components/ui/ComboInsightCard';
import CategoryFilterBar     from '@/components/ui/CategoryFilterBar';
import VendorCard            from '@/components/ui/VendorCard';
import VendorDetailPanel     from '@/components/ui/VendorDetailPanel';

// ── Module-level static data (resolved once) ─────────────────────────────────
const summary    = getIntegrationSummary();
const categories = getCategoryStats();
const allVendors = getVendorsByCategory(null);
const allCombos  = getCombos([]);

// Tier-1 available vendors (recommended next connections)
const nextRecommended = allVendors
  .filter(v => v.tier === 1 && v.status === 'available')
  .slice(0, 3);

export default function Integrations() {
  const [activeCategory, setActiveCategory]     = useState(null);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [expandedCombo, setExpandedCombo]       = useState(null);
  const comboRef = useRef(null);

  const filteredVendors = getVendorsByCategory(activeCategory);
  const connectedVendors  = filteredVendors.filter(v => v.status === 'connected');
  const remainingVendors  = filteredVendors.filter(v => v.status !== 'connected');
  const selectedVendor    = selectedVendorId ? getVendorById(selectedVendorId) : null;
  const vendorCombos      = selectedVendorId ? getCombosForVendor(selectedVendorId) : [];
  const displayCombos     = selectedVendorId ? vendorCombos : allCombos;

  const scrollToCombos = () =>
    comboRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const selectVendor = id => {
    setSelectedVendorId(p => p === id ? null : id);
    scrollToCombos();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>

      {/* 1 — Health Strip + recommended next */}
      <IntegrationHealthStrip
        connected={summary.connected}     total={summary.total}
        combosActive={summary.combosActive} totalCombos={summary.totalCombos}
        nextRecommended={nextRecommended}
        onClickConnected={() => {}}       onClickCombos={scrollToCombos}
      />

      {/* 2 — Top Insights teaser */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
          <SectionHeader title="Cross-System Insights" sub="Unique intelligence only possible when systems are connected through Swoop" />
          <button onClick={scrollToCombos} style={{
            fontSize: '11px', color: theme.colors.accent, fontWeight: 600,
            background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
          }}>
            View all {allCombos.length} →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.sm }}>
          {allCombos.slice(0, 3).map(combo => (
            <InsightTeaser key={combo.id} combo={combo} allVendors={allVendors}
              onExpand={() => { scrollToCombos(); setExpandedCombo(combo.id); }}
            />
          ))}
        </div>
      </div>

      {/* 3 — Constellation Map */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
      }}>
        <SectionHeader
          title="System Categories"
          sub={activeCategory
            ? `${categories.find(c => c.id === activeCategory)?.label} — click again to clear`
            : 'Click a category to filter the vendor list below'}
        />
        <IntegrationMap
          categories={categories} vendors={allVendors} combos={allCombos}
          activeCategory={activeCategory}
          onSelectCategory={cat => setActiveCategory(p => p === cat ? null : cat)}
        />
        {activeCategory && (
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button onClick={() => setActiveCategory(null)} style={{
              fontSize: '11px', color: theme.colors.textMuted,
              background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline',
            }}>Show all categories</button>
          </div>
        )}
      </div>

      {/* 4 — Category Filter Bar */}
      <CategoryFilterBar
        categories={categories} activeCategory={activeCategory}
        onSelect={cat => { setActiveCategory(cat); setSelectedVendorId(null); }}
      />

      {/* 5 — Connected vendors (always shown first) */}
      {connectedVendors.length > 0 && (
        <div>
          <div style={{
            fontSize: '11px', fontWeight: 700, color: theme.colors.success,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            marginBottom: theme.spacing.sm, display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: theme.colors.success, display: 'inline-block' }} />
            Connected ({connectedVendors.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: theme.spacing.sm }}>
            {connectedVendors.map(v => (
              <VendorCard key={v.id} {...v}
                categoryLabel={categories.find(c => c.id === v.categoryId)?.label ?? v.categoryId}
                comboCount={getCombosForVendor(v.id).length}
                isSelected={selectedVendorId === v.id}
                onSelect={() => selectVendor(v.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 6 — Available vendors */}
      {remainingVendors.length > 0 && (
        <div>
          {connectedVendors.length > 0 && (
            <div style={{
              fontSize: '11px', fontWeight: 700, color: theme.colors.textMuted,
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: theme.spacing.sm,
            }}>
              Available & Coming Soon ({remainingVendors.length})
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: theme.spacing.sm }}>
            {remainingVendors.map(v => (
              <VendorCard key={v.id} {...v}
                categoryLabel={categories.find(c => c.id === v.categoryId)?.label ?? v.categoryId}
                comboCount={getCombosForVendor(v.id).length}
                isSelected={selectedVendorId === v.id}
                onSelect={() => selectVendor(v.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 7 — Vendor Detail Panel */}
      <VendorDetailPanel
        vendor={selectedVendor} combos={vendorCombos}
        onClose={() => setSelectedVendorId(null)}
      />

      {/* 8 — Full Combo Explorer */}
      <div ref={comboRef}>
        <SectionHeader
          title={selectedVendorId ? `Insights: ${selectedVendor?.name}` : 'All Cross-System Insights'}
          sub={selectedVendorId
            ? `${vendorCombos.length} insight${vendorCombos.length !== 1 ? 's' : ''} for this vendor`
            : `${allCombos.length} insights across your connected and available systems`}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {displayCombos.map(combo => (
            <ComboInsightCard key={combo.id} {...combo}
              allSystems={allVendors}
              isExpanded={expandedCombo === combo.id}
              onToggle={() => setExpandedCombo(p => p === combo.id ? null : combo.id)}
              sparklineData={combo.preview?.sparklineKey
                ? resolveSparklineData(combo.preview.sparklineKey) : undefined}
            />
          ))}
        </div>
      </div>

      {/* 9 — Go-live CTA */}
      <div style={{
        background: theme.colors.bgSidebar, borderRadius: theme.radius.md,
        padding: theme.spacing.lg, textAlign: 'center',
      }}>
        <div style={{ fontSize: '28px', fontWeight: 800, color: theme.colors.accent, fontFamily: theme.fonts.serif }}>
          Live in under 2 weeks.
        </div>
        <div style={{ fontSize: theme.fontSize.sm, color: `${theme.colors.bgCard}AA`, marginTop: '6px' }}>
          Most clubs are connected within 3–5 business days. Swoop handles the integration — no IT team required.
        </div>
      </div>

    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 0 }}>
      <div style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary }}>{title}</div>
      {sub && <div style={{ fontSize: '11px', color: theme.colors.textMuted, marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}

function InsightTeaser({ combo, allVendors, onExpand }) {
  const color = theme.colors[
    allVendors.find(v => v.id === combo.systems[0])?.themeColor
  ] ?? theme.colors.accent;
  return (
    <button onClick={onExpand} style={{
      textAlign: 'left', background: `${color}08`,
      border: `1px solid ${color}30`, borderRadius: theme.radius.sm,
      padding: '10px 12px', cursor: 'pointer',
      transition: 'background 0.15s',
    }}>
      <div style={{ fontSize: '18px', fontWeight: 800, color: theme.colors.textPrimary, fontFamily: theme.fonts.mono, lineHeight: 1 }}>
        {combo.preview?.value}
      </div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: theme.colors.textPrimary, marginTop: '4px' }}>{combo.label}</div>
      <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginTop: '2px' }}>{combo.preview?.subtext}</div>
    </button>
  );
}
