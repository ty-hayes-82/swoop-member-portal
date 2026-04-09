// features/integrations/StickyPanel.jsx
// The sticky right-column panel. Shows empty state or full combination result.
import { combinations } from '@/data/combinations';
import { integrationsById } from '@/data/integrations';

// ── Empty / one-selected state ──────────────────────────────────────────────
function EmptyState({ selected }) {
  const hasOne = selected.length === 1;
  const item = hasOne ? integrationsById[selected[0]] : null;

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl py-9 px-6 text-center min-h-[320px] flex flex-col items-center justify-center gap-3">
      {hasOne ? (
        <>
          <div
            className="w-14 h-14 rounded-[14px] flex items-center justify-center text-[26px] mb-1"
            style={{ background: `${item.color}15` }}
          >{item.icon}</div>
          <div className="font-semibold text-base text-gray-800 dark:text-white/90">
            {item.name} selected
          </div>
          <div className="text-sm text-gray-400 leading-normal max-w-[240px]">
            Now pick a second system from the grid to see what they unlock together.
          </div>
          {/* Ghost icons of remaining options */}
          <div className="flex gap-2 mt-2 flex-wrap justify-center">
            {Object.values(integrationsById)
              .filter(i => i.id !== selected[0])
              .slice(0, 6)
              .map(i => (
                <div key={i.id} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base opacity-50">
                  {i.icon}
                </div>
              ))}
          </div>
        </>
      ) : (
        <>
          <div className="text-[40px] mb-1 opacity-30">⚡</div>
          <div className="font-semibold text-base text-gray-800 dark:text-white/90">
            Pick two systems
          </div>
          <div className="text-sm text-gray-400 leading-normal max-w-[240px]">
            Select any two integrations from the grid to see the insights and automations they unlock together.
          </div>
          <div className="flex gap-2 mt-2">
            {['💳','⛳','👥','🌤'].map((icon, i) => (
              <div key={i} className="w-9 h-9 rounded-[9px] bg-gray-100 flex items-center justify-center text-lg opacity-40">
                {icon}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ color, children }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-[1.1px] mb-2.5" style={{ color }}>
      {children}
    </div>
  );
}

function ListItem({ color, text, last }) {
  return (
    <div
      className="flex gap-[9px] items-start py-2 text-sm text-gray-500 leading-normal"
      style={{ borderBottom: last ? 'none' : '1px solid #E5E7EB' }}
    >
      <span className="w-1.5 h-1.5 rounded-full mt-[7px] shrink-0" style={{ background: color }} />
      {text}
    </div>
  );
}

// ── Combination result ───���───────────────────────────────────────────────────
function ComboResult({ idA, idB }) {
  const combo = combinations[`${idA}+${idB}`];
  const intA = integrationsById[idA];
  const intB = integrationsById[idB];

  if (!combo) {
    return (
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-md animate-[fadeSlideIn_0.3s_ease]">
        <div className="py-7 px-5 text-center">
          <div className="text-[28px] mb-2.5">{intA.icon} + {intB.icon}</div>
          <div className="font-semibold text-base text-gray-800 dark:text-white/90 mb-2">
            Cross-System Intelligence
          </div>
          <p className="text-sm text-gray-500 leading-normal m-0">
            Contact our team to explore what <strong>{intA.name}</strong> + <strong>{intB.name}</strong> can reveal for your club.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-md animate-[fadeSlideIn_0.3s_ease]" id="combination-panel">
      {/* Header */}
      <div className="py-[18px] px-5 border-b border-gray-200 dark:border-gray-800 bg-[rgba(247,245,242,0.6)] flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className="w-[38px] h-[38px] rounded-[9px] flex items-center justify-center text-lg"
            style={{ background: `${intA.color}18` }}
          >{intA.icon}</span>
          <span className="text-sm text-gray-400">+</span>
          <span
            className="w-[38px] h-[38px] rounded-[9px] flex items-center justify-center text-lg"
            style={{ background: `${intB.color}18` }}
          >{intB.icon}</span>
        </div>
        <div>
          <div className="font-bold text-base text-gray-800 dark:text-white/90 leading-tight">
            {combo.title}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {intA.name} × {intB.name}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="px-5 pt-4">
        <SectionLabel color={'#1a7a3c'}>Insights Unlocked</SectionLabel>
        {combo.insights.map((text, i) => (
          <ListItem key={i} color={'#1a7a3c'} text={text} last={i === combo.insights.length - 1} />
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 dark:bg-gray-800 my-3" />

      {/* Automations */}
      <div className="px-5">
        <SectionLabel color={'#12b76a'}>Automations Enabled</SectionLabel>
        {combo.automations.map((text, i) => (
          <ListItem key={i} color={'#12b76a'} text={text} last={i === combo.automations.length - 1} />
        ))}
      </div>

      {/* Example insight */}
      <div className="mx-5 mt-3.5 mb-5 bg-[rgba(139,100,32,0.05)] border border-[rgba(139,100,32,0.18)] border-l-4 border-l-[#8b6420] rounded-r-lg py-3 px-3.5">
        <div className="text-[10px] font-semibold text-[#8b6420] tracking-wide uppercase mb-1.5">
          Example Swoop Insight
        </div>
        <p className="text-sm italic text-gray-800 dark:text-white/90 leading-normal m-0 font-medium">
          "{combo.example}"
        </p>
      </div>
    </div>
  );
}

// ── Export ────────���───────────────────────────────���──────────────────────────
export function StickyPanel({ selected }) {
  if (selected.length < 2) {
    return <EmptyState selected={selected} />;
  }
  return <ComboResult idA={selected[0]} idB={selected[1]} />;
}
