// features/integrations/IntegrationsPage.jsx
import { useState } from 'react';
import { theme } from '@/config/theme';
import { integrations } from '@/data/integrations';
import { IntegrationsHero } from './IntegrationsHero';
import { SelectionPrompt } from './SelectionPrompt';
import { IntegrationCard } from './IntegrationCard';
import { CombinationPanel } from './CombinationPanel';
import { AllCombinationsGrid } from './AllCombinationsGrid';

export function IntegrationsPage() {
  const [selected, setSelected] = useState([]);

  function handleCardClick(id) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id); // deselect
      if (prev.length >= 2) return [...prev.slice(1), id];       // FIFO: drop oldest
      return [...prev, id];
    });
  }

  function handleMiniCardSelect(pair) {
    setSelected(pair);
  }

  return (
    <div>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtlePulse {
          0%, 100% { border-color: rgba(26,122,60,0.2); }
          50%       { border-color: rgba(26,122,60,0.5); }
        }
      `}</style>

      <IntegrationsHero integrationCount={integrations.length} comboCount={14} />

      <SelectionPrompt selected={selected} />

      {/* Cards section label */}
      <div style={{
        fontSize: theme.fontSize.xs,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '1.2px',
        color: '#7a8a7a',
        marginBottom: 16,
      }}>
        YOUR CLUB'S DATA SOURCES
      </div>

      {/* 4-column card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
        marginBottom: theme.spacing.xl,
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

      {/* Combination result */}
      <CombinationPanel selected={selected} />

      {/* All combinations */}
      <AllCombinationsGrid onSelect={handleMiniCardSelect} />
    </div>
  );
}
