// features/integrations/IntegrationsHero.jsx
export function IntegrationsHero({ integrationCount = 8, comboCount = 14 }) {
  return (
    <div className="bg-gradient-to-br from-[#1a1a2e] via-[#2d2d44] to-[#3d3d5c] rounded-2xl py-10 px-12 mb-8 text-white">
      <h1 className="font-serif text-[28px] font-bold text-white m-0 mb-3 leading-tight">
        The Intelligence Layer on Top of Your Systems
      </h1>
      <p className="text-base text-white/75 max-w-[560px] leading-relaxed m-0 mb-8">
        Your systems collect data. Swoop connects them, adds real-time location intelligence and behavioral signals, then turns cross-system patterns into actionable recommendations. No single integration can provide this — it's what they unlock together.
      </p>
      <div className="flex gap-12">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[28px] font-bold text-amber-400 leading-none">{integrationCount}</span>
          <span className="text-sm text-white/60 font-medium">Available Integrations</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[28px] font-bold text-amber-400 leading-none">{comboCount}</span>
          <span className="text-sm text-white/60 font-medium">Combo Insights</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[28px] font-bold text-amber-400 leading-none">∞</span>
          <span className="text-sm text-white/60 font-medium">Automations</span>
        </div>
      </div>
    </div>
  );
}
