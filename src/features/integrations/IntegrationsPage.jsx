// features/integrations/IntegrationsPage.jsx
import { useState } from 'react';
import { theme } from '@/config/theme';
import { integrations } from '@/data/integrations';
import { IntegrationsHero } from './IntegrationsHero';
import { SelectionPrompt } from './SelectionPrompt';
import { IntegrationCard } from './IntegrationCard';
import { StickyPanel } from './StickyPanel';
import { AllCombinationsGrid } from './AllCombinationsGrid';

export function IntegrationsPage() {
  const [selected, setSelected] = useState([]);

  function handleCardClick(id) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id);
      if (prev.length >= 2) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

  function handleMiniCardSelect(pair) {
    setSelected(pair);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <IntegrationsHero integrationCount={integrations.length} comboCount={14} />

      {/* Two-column body */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: 24,
        alignItems: 'start',
      }}>

        {/* LEFT — scrollable content */}
        <div>
          <SelectionPrompt selected={selected} />

          <div style={{
            fontSize: theme.fontSize.xs,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            color: '#7a8a7a',
            marginBottom: 14,
          }}>
            YOUR CLUB&apos;S DATA SOURCES
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            marginBottom: 32,
          }}>
            {integrations.map(integration => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                isSelected={selected.includes(integration.id)}
                onClick={() => handleCardClick(integration.id)}
              />
            ))}
          </div>

          <AllCombinationsGrid onSelect={handleMiniCardSelect} />
        </div>

        {/* RIGHT — sticky panel */}
        <div style={{ position: 'sticky', top: 24 }}>
          <StickyPanel selected={selected} />
        </div>

      </div>
    </div>
  );
}
