// Integrations.jsx — Full vendor catalog with category filtering + detail panel
// Sprint 3 refactor: CategoryFilterBar → VendorGrid → VendorDetailPanel → ComboExplorer
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

export default function Integrations() {
  const [activeCategory, setActiveCategory]     = useState(null);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [expandedCombo, setExpandedCombo]       = useState(null);
  const comboRef = useRef(null);

  const filteredVendors = getVendorsByCategory(activeCategory);
  const selectedVendor  = selectedVendorId ? getVendorById(selectedVendorId) : null;
  const vendorCombos    = selectedVendorId ? getCombosForVendor(selectedVendorId) : [];
  const displayCombos   = selectedVendorId ? vendorCombos : getCombos([]);

  const scrollToCombos = () =>
    comboRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const selectVendor = id => {
    setSelectedVendorId(p => p === id ? null : id);
    scrollToCombos();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>

      {/* 1 — Health Strip */}
      <IntegrationHealthStrip
        connected={summary.connected}   total={summary.total}
        combosActive={summary.combosActive} totalCombos={summary.totalCombos}
        onClickConnected={() => {}}     onClickCombos={scrollToCombos}
      />

      {/* 2 — Constellation Map */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
      }}>
        <SectionHeader
          title="Connected Systems"
          sub={activeCategory
            ? `${categories.find(c => c.id === activeCategory)?.label} selected — click again to clear`
            : 'Click a category to filter vendors below'}
        />
        <IntegrationMap
          categories={categories}
          vendors={allVendors}
          combos={getCombos([])}
          activeCategory={activeCategory}
          onSelectCategory={cat => setActiveCategory(p => p === cat ? null : cat)}
        />
        {activeCategory && (
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button onClick={() => setActiveCategory(null)} style={{
              fontSize: '11px', color: theme.colors.textMuted,
              background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline',
            }}>
              Show all categories
            </button>
          </div>
        )}
      </div>

      {/* 3 — Category Filter Bar */}
      <CategoryFilterBar
        categories={categories}
        activeCategory={activeCategory}
        onSelect={cat => { setActiveCategory(cat); setSelectedVendorId(null); }}
      />

      {/* 4 — Vendor Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: theme.spacing.sm,
      }}>
        {filteredVendors.map(v => (
          <VendorCard
            key={v.id}
            {...v}
            categoryLabel={categories.find(c => c.id === v.categoryId)?.label ?? v.categoryId}
            comboCount={getCombosForVendor(v.id).length}
            isSelected={selectedVendorId === v.id}
            onSelect={() => { selectVendor(v.id); scrollToCombos(); }}
          />
        ))}
      </div>

      {/* 5 — Vendor Detail Panel (fixed slide-in) */}
      <VendorDetailPanel
        vendor={selectedVendor}
        combos={vendorCombos}
        onClose={() => setSelectedVendorId(null)}
      />

      {/* 6 — Combo Insight Explorer */}
      <div ref={comboRef}>
        <SectionHeader
          title={selectedVendorId
            ? `Insights: ${selectedVendor?.name}`
            : 'Cross-System Insights'}
          sub={selectedVendorId
            ? `${vendorCombos.length} combo insight${vendorCombos.length !== 1 ? 's' : ''} for this vendor`
            : 'Select a vendor card or map node to filter, or browse all 14 insights'}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {displayCombos.length === 0 && (
            <div style={{
              color: theme.colors.textMuted, fontSize: theme.fontSize.sm,
              padding: theme.spacing.md, textAlign: 'center',
            }}>
              No cross-system insights match that combination. Try a different selection.
            </div>
          )}
          {displayCombos.map(combo => (
            <ComboInsightCard
              key={combo.id}
              {...combo}
              allSystems={allVendors}
              isExpanded={expandedCombo === combo.id}
              onToggle={() => setExpandedCombo(p => p === combo.id ? null : combo.id)}
              sparklineData={combo.preview?.sparklineKey
                ? resolveSparklineData(combo.preview.sparklineKey)
                : undefined}
            />
          ))}
        </div>
      </div>

      {/* 7 — Go-live close */}
      <div style={{
        background: theme.colors.bgSidebar,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '28px', fontWeight: 800,
          color: theme.colors.accent, fontFamily: theme.fonts.serif,
        }}>
          Live in under 2 weeks.
        </div>
        <div style={{
          fontSize: theme.fontSize.sm,
          color: `${theme.colors.bgCard}AA`,
          marginTop: '6px',
        }}>
          Most clubs are connected within 3–5 business days. Swoop handles the integration — no IT team required.
        </div>
      </div>

    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: theme.spacing.sm }}>
      <div style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary }}>
        {title}
      </div>
      {sub && (
        <div style={{ fontSize: '11px', color: theme.colors.textMuted, marginTop: '2px' }}>
          {sub}
        </div>
      )}
    </div>
  );
}
