import { useEffect, useMemo, useRef, useState } from 'react';
import { theme } from '@/config/theme';
import { useNavigation } from '@/context/NavigationContext';
import {
  getConnectedSystems,
  getCombinations,
  getIntegrationHealth,
} from '@/services/integrationsService';
import { IntegrationCard } from './IntegrationCard';
import { IntegrationHealthStrip } from './IntegrationHealthStrip';
import { ComboInsightCard } from './ComboInsightCard';
import { IntegrationMap } from './IntegrationMap';

const CATEGORY_LABELS = {
  'tee-sheet': 'Tee Sheet',
  pos: 'POS',
  crm: 'CRM',
  staffing: 'Staffing',
  waitlist: 'Waitlist',
};

export function IntegrationsPage() {
  const { navigate } = useNavigation();
  const systems = useMemo(() => getConnectedSystems(), []);
  const combos = useMemo(() => getCombinations(), []);
  const health = useMemo(() => getIntegrationHealth(), []);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [activeSystemId, setActiveSystemId] = useState(null);
  const cardRefs = useRef({});
  const [flowOffset, setFlowOffset] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setFlowOffset((prev) => (prev + 2) % 200), 80);
    return () => clearInterval(timer);
  }, []);

  const systemsById = useMemo(
    () => Object.fromEntries(systems.map((system) => [system.id, system])),
    [systems],
  );
  const activeSystem = activeSystemId ? systemsById[activeSystemId] : null;

  const visibleSystems = useMemo(() => systems.filter((system) => {
    const categoryMatch = category === 'all' || system.category === category;
    const searchNeedle = search.toLowerCase().trim();
    const searchMatch = !searchNeedle
      || system.name.toLowerCase().includes(searchNeedle)
      || system.endpoints.join(' ').toLowerCase().includes(searchNeedle);
    return categoryMatch && searchMatch;
  }), [category, search, systems]);

  const visibleCombos = useMemo(() => {
    if (!activeSystemId) return combos;
    return combos.filter((combo) => combo.systems.includes(activeSystemId));
  }, [activeSystemId, combos]);

  const categories = useMemo(
    () => ['all', ...new Set(systems.map((system) => system.category))],
    [systems],
  );

  function selectSystemFromMap(systemId) {
    setActiveSystemId((prev) => (prev === systemId ? null : systemId));
    const target = cardRefs.current[systemId];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  return (
    <div>
      <section style={{
        borderRadius: theme.radius.lg,
        background: `linear-gradient(120deg, ${theme.colors.integrationHeroStart} 0%, ${theme.colors.integrationHeroMid} 45%, ${theme.colors.integrationHeroEnd} 100%)`,
        padding: '36px 42px',
        color: theme.colors.white,
        marginBottom: 18,
      }}>
        <h1 style={{ margin: '0 0 10px', fontSize: 30, lineHeight: 1.2 }}>The Intelligence Layer on Top of Your Systems</h1>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, maxWidth: 760, color: 'rgba(255,255,255,0.82)' }}>
          Your systems collect data. Swoop connects them, adds real-time location intelligence and behavioral signals, then turns cross-system patterns into actionable recommendations. No single integration can provide this — it's what they unlock together.
        </p>
      </section>

      <section style={{
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        padding: '18px 20px',
        background: theme.colors.bgCard,
        marginBottom: 18,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ maxWidth: 520 }}>
          <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary }}>No API? No problem.</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>Upload CSV or XLSX exports for members, tee sheet, staffing, reservations, complaints, and more. The CSV Import Hub handles mapping, validation, and audit trails for any vendor.</div>
        </div>
        <button
          type='button'
          onClick={() => navigate('integrations/csv-import')}
          style={{
            padding: '10px 18px',
            borderRadius: theme.radius.sm,
            border: 'none',
            background: theme.colors.accent,
            color: theme.colors.white,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Open CSV Import Hub →
        </button>
      </section>

      <IntegrationHealthStrip health={health} />

      <IntegrationMap
        systems={systems}
        combos={combos}
        activeSystemId={activeSystemId}
        onSelectSystem={selectSystemFromMap}
      />

      <section style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                border: `1px solid ${cat === category ? theme.colors.operations : theme.colors.border}`,
                background: cat === category ? `${theme.colors.operations}14` : theme.colors.white,
                color: cat === category ? theme.colors.operations : theme.colors.textSecondary,
                borderRadius: 999,
                padding: '6px 11px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search systems or endpoints"
          style={{
            width: '100%',
            maxWidth: 360,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 9,
            padding: '9px 12px',
            fontSize: 13,
            color: theme.colors.textPrimary,
            background: theme.colors.white,
          }}
        />
      </section>

      <section style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.colors.textMuted, marginBottom: 10 }}>
          Connected Systems
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
          {visibleSystems.map((system) => (
            <IntegrationCard
              key={system.id}
              system={system}
              isSelected={activeSystemId === system.id}
              onClick={() => setActiveSystemId((prev) => (prev === system.id ? null : system.id))}
              cardRef={(el) => {
                cardRefs.current[system.id] = el;
              }}
            />
          ))}
        </div>
      </section>

      {activeSystem && (
        <section style={{ marginBottom: 24, padding: '16px 18px', border: `1px solid ${theme.colors.border}`, borderRadius: 12, background: theme.colors.bgCard }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary }}>{activeSystem.name}</div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Status: {activeSystem.status} · Tier {activeSystem.tier}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
              Last sync: {activeSystem.lastSync ?? 'Not connected yet'}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {activeSystem.endpoints.map((endpoint) => (
              <span key={endpoint} style={{ padding: '4px 10px', borderRadius: 20, background: theme.colors.bgDeep, fontSize: 11 }}>
                {endpoint}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.colors.textMuted, marginBottom: 6 }}>Connection Flow</div>
            <div style={{ height: 6, borderRadius: 999, background: theme.colors.border, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: '200%',
                  background: 'linear-gradient(90deg, rgba(34,197,94,0.9), rgba(59,130,246,0.9), rgba(34,197,94,0.9))',
                  backgroundSize: '200% 100%',
                  backgroundPosition: `${flowOffset}% 0`,
                  transition: 'background-position 0.15s linear',
                }}
              />
            </div>
          </div>
        </section>
      )}
      <section>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.colors.textMuted, marginBottom: 10 }}>
          Cross-System Intelligence
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {visibleCombos.map((combo) => (
            <ComboInsightCard key={combo.id} combo={combo} systemsById={systemsById} />
          ))}
        </div>
      </section>
    </div>
  );
}
