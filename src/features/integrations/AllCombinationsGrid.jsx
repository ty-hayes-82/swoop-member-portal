// features/integrations/AllCombinationsGrid.jsx
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
      className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-[10px] py-3.5 px-4 cursor-pointer transition-all duration-150 flex flex-col gap-2 hover:border-success-500 hover:shadow-md hover:-translate-y-px"
    >
      <div className="flex items-center gap-2">
        <span
          className="w-7 h-7 rounded-md flex items-center justify-center text-sm"
          style={{ background: `${intA.color}15` }}
        >{intA.icon}</span>
        <span className="text-[10px] text-gray-400">+</span>
        <span
          className="w-7 h-7 rounded-md flex items-center justify-center text-sm"
          style={{ background: `${intB.color}15` }}
        >{intB.icon}</span>
      </div>
      <div className="text-xs font-semibold text-gray-800 dark:text-white/90 leading-tight">
        {combo.title}
      </div>
      <div className="text-[11px] text-gray-400">
        {combo.insights.length} insights · {combo.automations.length} automations
      </div>
    </div>
  );
}

export function AllCombinationsGrid({ onSelect }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[1.2px] text-brand-500 mb-4">
        ALL POSSIBLE COMBINATIONS
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {allCombinations.map(combo => (
          <CombinationMiniCard
            key={combo.key}
            combo={combo}
            onClick={() => {
              const [idA, idB] = combo.key.split('+');
              onSelect([idA, idB]);
            }}
          />
        ))}
      </div>
    </div>
  );
}
