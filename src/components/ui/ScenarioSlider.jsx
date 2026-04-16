// ScenarioSlider — Pillar 3 (PROVE IT) interactive scenario modeling
// "If we reduce slow rounds by X%, we recover $Y/month."
// Drag the slider; the dollar number updates in real-time.

import { useState, useMemo } from 'react';
import { AnimatedNumber } from './PageTransition';
import { getRevenueScenario } from '@/services/revenueService';

export default function ScenarioSlider({
  baseSlowRounds = 668,
  dollarPerSlowRound = 31,
  staffingRecoveryPotential = 850,
}) {
  const [reductionPct, setReductionPct] = useState(20);

  const scenario = useMemo(
    () => getRevenueScenario(reductionPct / 100),
    [reductionPct]
  );

  const slowRoundsEliminated = Math.round(baseSlowRounds * (reductionPct / 100));
  const monthlyRecovery = scenario.totalRecovery;
  const annualRecovery = monthlyRecovery * 12;

  return (
    <div className="bg-swoop-panel border border-swoop-border rounded-2xl p-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-base font-bold text-swoop-text mb-0.5">
            Recovery Scenario Modeling
          </h3>
          <p className="text-xs text-swoop-text-muted">
            Drag the slider to model what slow-round reduction would recover
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wide text-swoop-text-label">
            Monthly Recovery
          </div>
          <div className="text-3xl font-bold text-success-500 font-mono leading-none mt-1">
            $<AnimatedNumber value={monthlyRecovery} duration={400} />
          </div>
          <div className="text-[11px] text-swoop-text-muted mt-1">
            ${annualRecovery.toLocaleString()}/yr
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-swoop-text-muted mb-2">
          <span>Slow round reduction</span>
          <span className="font-mono font-bold text-brand-500 text-sm">
            {reductionPct}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="50"
          step="5"
          value={reductionPct}
          onChange={(e) => setReductionPct(Number(e.target.value))}
          className="w-full h-2 bg-swoop-border rounded-lg appearance-none cursor-pointer accent-brand-500"
          aria-label="Slow round reduction percentage"
        />
        <div className="flex justify-between text-[10px] text-swoop-text-label mt-1 font-mono">
          <span>0%</span>
          <span>10%</span>
          <span>20%</span>
          <span>30%</span>
          <span>40%</span>
          <span>50%</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          {[
            { label: 'Conservative', value: 10, color: '#9CA3AF' },
            { label: 'Realistic', value: 20, color: '#12b76a' },
            { label: 'Aggressive', value: 30, color: '#f59e0b' },
            { label: 'Best case', value: 40, color: '#8b5cf6' },
          ].map(preset => {
            const isActive = reductionPct === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => setReductionPct(preset.value)}
                className={`px-2 py-1.5 rounded-md text-[10px] font-bold cursor-pointer transition-all border-2 ${
                  isActive ? 'scale-105 shadow-md' : 'hover:scale-105'
                }`}
                style={{
                  borderColor: preset.color,
                  background: isActive ? preset.color : `${preset.color}10`,
                  color: isActive ? '#fff' : preset.color,
                }}
              >
                <div>{preset.label}</div>
                <div className="font-mono">{preset.value}%</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-swoop-border">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-swoop-text-label">
            Slow rounds eliminated
          </div>
          <div className="text-lg font-bold text-swoop-text font-mono mt-0.5">
            <AnimatedNumber value={slowRoundsEliminated} duration={400} />
            <span className="text-xs text-swoop-text-label font-normal">/mo</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-swoop-text-label">
            Pace recovery
          </div>
          <div className="text-lg font-bold text-success-500 font-mono mt-0.5">
            $<AnimatedNumber value={scenario.recoveredPace} duration={400} />
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-swoop-text-label">
            Staffing recovery
          </div>
          <div className="text-lg font-bold text-success-500 font-mono mt-0.5">
            $<AnimatedNumber value={scenario.recoveredStaffing} duration={400} />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-swoop-border">
        <p className="text-[11px] text-swoop-text-muted italic leading-relaxed">
          Lever 1: ranger on Hole 12, modeled at{' '}
          <span className="font-mono font-semibold text-swoop-text-2">${dollarPerSlowRound}/slow round</span>{' '}
          (22% slow vs 41% fast dining conversion). Lever 2: add one server to Friday lunch based on weather-demand forecast, closing the Understaffed Fridays root cause. Combined recovery: <span className="font-mono font-semibold text-success-600">~$2,000+/mo</span> from two operational changes. Board-ready in one slide.
        </p>
      </div>
    </div>
  );
}
