import { useMemo, useRef, useState } from 'react';
import { theme } from '@/config/theme';
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
  const systems = useMemo(() => getConnectedSystems(), []);
  const combos = useMemo(() => getCombinations(), []);
  const health = useMemo(() => getIntegrationHealth(), []);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [activeSystemId, setActiveSystemId] = useState(null);
  const cardRefs = useRef({});

  const systemsById = useMemo(
    () => Object.fromEntries(systems.map((system) => [system.id, system])),
    [systems],
  );

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
        <h1 style={{ margin: '0 0 10px', fontSize: 30, lineHeight: 1.2 }}>Integrations Power Real Club Intelligence</h1>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, maxWidth: 760, color: 'rgba(255,255,255,0.82)' }}>
          One system can report activity. Connected systems explain cause and impact. Swoop links tee sheet, POS, CRM, staffing, and waitlist signals so teams can see problems early and act with confidence.
        </p>
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
