// Integrations.jsx — Full vendor catalog with category filtering + detail panel
// Data flow: integrationsService → this component → primitives only
import { useState, useRef } from 'react';
import { theme } from '@/config/theme';
import {
  getCombos, resolveSparklineData,
  getCategoryStats, getVendorsByCategory, getVendorById,
  getCombosForVendor, getIntegrationSummary,
  getQuestionCategories, getCombosByQuestion, getQuestionReadiness,
} from '@/services/integrationsService';
import IntegrationHealthStrip  from '@/components/ui/IntegrationHealthStrip';
import IntegrationMap          from '@/components/ui/IntegrationMap';
import ComboInsightCard        from '@/components/ui/ComboInsightCard';
import CategoryFilterBar       from '@/components/ui/CategoryFilterBar';
import VendorCard              from '@/components/ui/VendorCard';
import VendorDetailPanel       from '@/components/ui/VendorDetailPanel';
import QuestionCategoryCard    from '@/components/ui/QuestionCategoryCard';

// ── Module-level static data (resolved once) ─────────────────────────────────
const summary         = getIntegrationSummary();
const categories      = getCategoryStats();
const allVendors      = getVendorsByCategory(null);
const allCombos       = getCombos([]);
const questionCats    = getQuestionCategories();

// Tier-1 available vendors (recommended next connections)
const nextRecommended = allVendors
  .filter(v => v.tier === 1 && v.status === 'available')
  .slice(0, 3);

export default function Integrations() {
  const [activeCategory, setActiveCategory]     = useState(null);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [expandedCombo, setExpandedCombo]       = useState(null);
  const [activeQuestion, setActiveQuestion]     = useState(null);
  const comboRef = useRef(null);

  const filteredVendors   = getVendorsByCategory(activeCategory);
  const connectedVendors  = filteredVendors.filter(v => v.status === 'connected');
  const remainingVendors  = filteredVendors.filter(v => v.status !== 'connected');
  const selectedVendor    = selectedVendorId ? getVendorById(selectedVendorId) : null;
  const vendorCombos      = selectedVendorId ? getCombosForVendor(selectedVendorId) : [];
  const activeQCat        = activeQuestion ? questionCats.find(q => q.id === activeQuestion) : null;
  const displayCombos     = selectedVendorId
    ? vendorCombos
    : activeQuestion
      ? getCombosByQuestion(activeQuestion)
      : allCombos;

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

      {/* 2 — Questions You Can Answer */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
          <div>
            <div style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary }}>
              Questions You Can Answer
            </div>
            <div style={{ fontSize: '11px', color: theme.colors.textMuted, marginTop: '2px' }}>
              Each question requires specific systems to be connected. Click any to explore the insights it unlocks.
            </div>
          </div>
          <button onClick={scrollToCombos} style={{
            fontSize: '11px', color: theme.colors.accent, fontWeight: 600,
            background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
          }}>
            View all {allCombos.length} insights →
          </button>
        </div>

        {/* Tier 1 questions — 2-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
          {questionCats.filter(q => q.tier === 1 && !q.flagship).map(q => (
            <QuestionCategoryCard
              key={q.id}
              question={q}
              readiness={getQuestionReadiness(q.id)}
              comboCount={getCombosByQuestion(q.id).length}
              onExplore={() => { scrollToCombos(); setActiveQuestion(q.id); }}
            />
          ))}
        </div>

        {/* Flagship — full width */}
        {questionCats.filter(q => q.flagship).map(q => (
          <QuestionCategoryCard
            key={q.id}
            question={q}
            readiness={getQuestionReadiness(q.id)}
            comboCount={getCombosByQuestion(q.id).length}
            onExplore={() => { scrollToCombos(); setActiveQuestion(q.id); }}
          />
        ))}

        {/* Tier 2/3 — collapsed summary row */}
        <div style={{
          marginTop: theme.spacing.sm,
          borderTop: `1px solid ${theme.colors.bgDeep}`,
          paddingTop: theme.spacing.sm,
          display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '11px', color: theme.colors.textMuted, fontWeight: 600 }}>Also available:</span>
          {questionCats.filter(q => q.tier > 1 && !q.flagship).map(q => (
            <button key={q.id} onClick={() => { scrollToCombos(); setActiveQuestion(q.id); }} style={{
              fontSize: '11px', color: theme.colors.textMuted,
              background: theme.colors.bgDeep, border: 'none',
              borderRadius: theme.radius.sm, padding: '3px 10px',
              cursor: 'pointer',
            }}>
              {q.icon} {q.label}
            </button>
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
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
          <SectionHeader
            title={selectedVendorId
              ? `Insights: ${selectedVendor?.name}`
              : activeQCat
                ? activeQCat.label
                : 'All Cross-System Insights'}
            sub={selectedVendorId
              ? `${vendorCombos.length} insight${vendorCombos.length !== 1 ? 's' : ''} for this vendor`
              : activeQCat
                ? `"${activeQCat.question}"`
                : `${allCombos.length} insights across your connected and available systems`}
          />
          {(activeQuestion || selectedVendorId) && (
            <button onClick={() => { setActiveQuestion(null); setSelectedVendorId(null); }} style={{
              fontSize: '11px', color: theme.colors.textMuted, flexShrink: 0,
              background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline',
            }}>
              Show all
            </button>
          )}
        </div>
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


