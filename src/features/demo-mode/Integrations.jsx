// Integrations.jsx — Connected Intelligence page for Demo Mode
// Sections: HealthStrip → Map → System Cards → Combo Explorer
// Data flow: integrationsService → this component → primitives
import { useState, useRef } from 'react';
import { theme } from '@/config/theme';
import {
  getSystems, getIntegrationHealth, getCombos, resolveSparklineData, getVendorLandscape,
} from '@/services/integrationsService';
import IntegrationHealthStrip from '@/components/ui/IntegrationHealthStrip';
import IntegrationCard from '@/components/ui/IntegrationCard';
import ComboInsightCard from '@/components/ui/ComboInsightCard';
import IntegrationMap from '@/components/ui/IntegrationMap';
import VendorLandscapeSection from '@/components/ui/VendorLandscapeSection';

const systems = getSystems();
const health = getIntegrationHealth();
const vendorLandscape = getVendorLandscape();

export default function Integrations() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedCombo, setExpandedCombo] = useState(null);
  const comboRef = useRef(null);

  const combos = getCombos(selectedIds.length >= 2 ? selectedIds : []);

  function toggleSystem(id) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function scrollToCombos() {
    comboRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>

      {/* Section 1 — Health Strip */}
      <IntegrationHealthStrip
        {...health}
        onClickConnected={() => {}}
        onClickCombos={scrollToCombos}
      />

      {/* Section 2a — Constellation Map */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border ?? '#E5E5E5'}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
      }}>
        <SectionHeader
          title="Connected Systems"
          sub={selectedIds.length
            ? `${selectedIds.length} selected — click another to filter insights`
            : 'Click a node to filter cross-system insights below'}
        />
        <IntegrationMap
          systems={systems} combos={getCombos([])}
          selectedIds={selectedIds}
          onSelectSystem={id => { toggleSystem(id); scrollToCombos(); }}
        />

        {/* Clear selection */}
        {selectedIds.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button onClick={() => setSelectedIds([])} style={{
              fontSize: '11px', color: theme.colors.textMuted, background: 'none',
              border: 'none', cursor: 'pointer', textDecoration: 'underline',
            }}>
              Clear selection
            </button>
          </div>
        )}
      </div>

      {/* Section 2b — System Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: theme.spacing.sm }}>
        {systems.map(sys => (
          <IntegrationCard
            key={sys.id} {...sys}
            isSelected={selectedIds.includes(sys.id)}
            onSelect={() => { toggleSystem(sys.id); scrollToCombos(); }}
          />
        ))}
      </div>

      {/* Section 3 — Combo Insight Explorer */}
      <div ref={comboRef}>
        <SectionHeader
          title={selectedIds.length >= 2
            ? `Cross-System Insights — ${selectedIds.length} systems selected`
            : 'Cross-System Insights'}
          sub={selectedIds.length >= 2
            ? `Showing combos involving your selected systems`
            : 'Select two systems above to filter, or browse all insights'}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {combos.length === 0 && (
            <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, padding: theme.spacing.md, textAlign: 'center' }}>
              No cross-system insights match that combination. Try a different pair.
            </div>
          )}
          {combos.map(combo => (
            <ComboInsightCard
              key={combo.id}
              {...combo}
              allSystems={systems}
              isExpanded={expandedCombo === combo.id}
              onToggle={() => setExpandedCombo(prev => prev === combo.id ? null : combo.id)}
              sparklineData={combo.preview.sparklineKey
                ? resolveSparklineData(combo.preview.sparklineKey)
                : undefined}
            />
          ))}
        </div>
      </div>

      {/* Section 4 — Vendor Landscape */}
      <VendorLandscapeSection categories={vendorLandscape} />

      {/* Closing stat */}
      <div style={{
        background: `${theme.colors.bgSidebar}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '28px', fontWeight: 800, color: theme.colors.accent, fontFamily: 'DM Serif Display, serif' }}>
          Live in under 2 weeks.
        </div>
        <div style={{ fontSize: theme.fontSize.sm, color: '#FFFFFFAA', marginTop: '6px' }}>
          Most clubs are connected within 3–5 business days. Swoop handles the integration — no IT team required.
        </div>
      </div>

    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: theme.spacing.sm }}>
      <div style={{ fontSize: theme.fontSize.md ?? '14px', fontWeight: 700, color: theme.colors.textPrimary }}>
        {title}
      </div>
      {sub && <div style={{ fontSize: '11px', color: theme.colors.textMuted, marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}
