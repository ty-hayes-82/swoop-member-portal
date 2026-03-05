// features/integrations/AllCombinationsGrid.jsx
import { theme } from '@/config/theme';
import { allCombinations } from '@/data/combinations';
import { integrationsById } from '@/data/integrations';

function CombinationMiniCard({ combo, onClick }) {
  const [idA, idB] = combo.key.split('+');
  const intA = integrationsById[idA];
  const intB = integrationsById[idB];

  if (!intA || !intB) return null;

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#1a7a3c';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,122,60,0.12)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = theme.colors.border;
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 28, height: 28, borderRadius: 6,
          background: `${intA.color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14,
        }}>{intA.icon}</span>
        <span style={{ fontSize: 10, color: theme.colors.textMuted }}>+</span>
        <span style={{
          width: 28, height: 28, borderRadius: 6,
          background: `${intB.color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14,
        }}>{intB.icon}</span>
      </div>
      <div style={{ fontSize: theme.fontSize.xs, fontWeight: 600, color: theme.colors.textPrimary, lineHeight: 1.3 }}>
        {combo.title}
      </div>
      <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
        {combo.insights.length} insights · {combo.automations.length} automations
      </div>
    </div>
  );
}

export function AllCombinationsGrid({ onSelect }) {
  return (
    <div>
      <div style={{
        fontSize: theme.fontSize.xs,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '1.2px',
        color: '#7a8a7a',
        marginBottom: 16,
      }}>
        ALL POSSIBLE COMBINATIONS
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 12,
      }}>
        {allCombinations.map(combo => (
          <CombinationMiniCard
            key={combo.key}
            combo={combo}
            onClick={() => {
              const [idA, idB] = combo.key.split('+');
              onSelect([idA, idB]);
              setTimeout(() => {
                document.getElementById('combination-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 50);
            }}
          />
        ))}
      </div>
    </div>
  );
}
