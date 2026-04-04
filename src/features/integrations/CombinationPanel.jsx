// features/integrations/CombinationPanel.jsx
import { combinations } from '@/data/combinations';
import { integrationsById } from '@/data/integrations';

export function CombinationPanel({ selected }) {
  if (selected.length < 2) return null;

  const [idA, idB] = selected;
  const comboKey = `${idA}+${idB}`;
  const combo = combinations[comboKey];
  const intA = integrationsById[idA];
  const intB = integrationsById[idB];

  if (!combo) {
    return (
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mb-8 shadow-md animate-[fadeSlideIn_0.3s_ease]">
        <div className="py-8 px-9 text-center">
          <div className="text-[32px] mb-3">{intA.icon} + {intB.icon}</div>
          <div className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
            Cross-System Intelligence
          </div>
          <p className="text-sm text-gray-500 max-w-[480px] mx-auto">
            This combination unlocks powerful cross-system intelligence. Contact our team to explore what <strong>{intA.name}</strong> + <strong>{intB.name}</strong> can reveal for your club.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mb-8 shadow-md animate-[fadeSlideIn_0.3s_ease]" id="combination-panel">
      {/* Header */}
      <div className="py-6 px-9 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4 bg-[rgba(247,245,242,0.5)]">
        <div className="flex items-center gap-3">
          <span
            className="w-11 h-11 rounded-[10px] flex items-center justify-center text-[22px]"
            style={{ background: `${intA.color}15` }}
          >{intA.icon}</span>
          <span className="text-lg text-gray-400 font-light">+</span>
          <span
            className="w-11 h-11 rounded-[10px] flex items-center justify-center text-[22px]"
            style={{ background: `${intB.color}15` }}
          >{intB.icon}</span>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-800 dark:text-white/90">
            {combo.title}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {intA.name} × {intB.name}
          </div>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 py-7 px-9 gap-9">
        {/* Insights */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-[1.2px] text-[#1a7a3c] mb-3">Insights Unlocked</div>
          {combo.insights.map((insight, i) => (
            <div key={i} className="flex gap-2.5 py-2.5 items-start text-sm text-gray-500 leading-normal" style={{ borderBottom: i < combo.insights.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1a7a3c] mt-1.5 shrink-0" />
              {insight}
            </div>
          ))}
        </div>

        {/* Automations */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-[1.2px] text-success-500 mb-3">Automations Enabled</div>
          {combo.automations.map((auto, i) => (
            <div key={i} className="flex gap-2.5 py-2.5 items-start text-sm text-gray-500 leading-normal" style={{ borderBottom: i < combo.automations.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 mt-1.5 shrink-0" />
              {auto}
            </div>
          ))}
        </div>
      </div>

      {/* Example insight */}
      <div className="mx-9 mb-7 bg-[rgba(139,100,32,0.06)] border border-[rgba(139,100,32,0.2)] border-l-4 border-l-[#8b6420] rounded-r-lg py-3.5 px-[18px]">
        <div className="text-xs font-semibold text-[#8b6420] tracking-wide uppercase mb-1.5">
          Example Swoop Insight
        </div>
        <p className="text-sm italic text-gray-800 dark:text-white/90 leading-relaxed m-0 font-medium">
          "{combo.example}"
        </p>
      </div>
    </div>
  );
}
