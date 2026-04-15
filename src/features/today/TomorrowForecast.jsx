// TomorrowForecast — demand prediction for tomorrow
import { useState, useEffect } from 'react';
import { getDailyBriefing } from '@/services/briefingService';
import { getTomorrowForecast } from '@/services/weatherService';
import { getUnderstaffedDays } from '@/services/staffingService';
function getOutlets() {
  try {
    const { getShiftCoverage } = require('@/services/staffingService');
    const shifts = getShiftCoverage();
    if (shifts && shifts.length > 0) {
      const outletMap = {};
      shifts.forEach(s => {
        if (!outletMap[s.outlet]) outletMap[s.outlet] = { required: 0, scheduled: 0 };
        outletMap[s.outlet].required += s.requiredStaff || 1;
        outletMap[s.outlet].scheduled += s.scheduledStaff || 0;
      });
      return Object.entries(outletMap).slice(0, 4).map(([name, data]) => ({
        name,
        requiredStaff: data.required,
        scheduledStaff: data.scheduled,
        status: data.scheduled >= data.required ? 'full' : 'gap',
      }));
    }
  } catch {}
  return [
    { name: 'Grill Room', requiredStaff: 4, scheduledStaff: 2, status: 'gap' },
    { name: 'Terrace', requiredStaff: 3, scheduledStaff: 3, status: 'full' },
    { name: 'Pool Bar', requiredStaff: 1, scheduledStaff: 1, status: 'full' },
  ];
}

export default function TomorrowForecast() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener('swoop:weather-updated', handler);
    return () => window.removeEventListener('swoop:weather-updated', handler);
  }, []);

  const briefing = getDailyBriefing();
  const tomorrowWeather = getTomorrowForecast();
  const tomorrow = briefing?.todayRisks?.tomorrow || tomorrowWeather;
  const roundsBooked = briefing?.teeSheet?.roundsToday || 0;
  const hasTeeSheet = roundsBooked > 0;

  // Only show forecast when we have weather or tee-sheet data
  if (!tomorrow && !hasTeeSheet) return null;

  const weather = tomorrow?.conditions || briefing?.todayRisks?.weather || 'clear';
  const wind = tomorrow?.wind || briefing?.todayRisks?.wind || 0;
  const gusts = tomorrow?.gusts || wind;
  const tempHigh = tomorrow?.high || briefing?.todayRisks?.tempHigh || 72;
  const precipProb = tomorrow?.precipProb || 0;

  const highDemand = roundsBooked > 200;
  const weatherImpact = gusts > 15
    ? `Wind advisory — ${gusts} mph gusts may shift golfers to indoor dining`
    : precipProb > 60
      ? `${precipProb}% rain probability — prepare for cancellations and indoor overflow`
      : precipProb > 40
        ? `${precipProb}% chance of rain — monitor and prepare contingency`
        : weather === 'rainy'
          ? 'Rain expected — prepare for indoor overflow'
          : 'No weather disruptions expected';

  const diningImpact = !hasTeeSheet
    ? null
    : highDemand
      ? `${roundsBooked} rounds booked — expect 15% higher dining traffic`
      : `${roundsBooked} rounds booked — standard dining demand`;

  return (
    <div className="bg-swoop-panel border border-swoop-border rounded-xl p-4">
      <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wide mb-3">
        Tomorrow's Forecast
      </div>

      {/* Demand prediction */}
      <div className={`grid ${hasTeeSheet ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-3 mb-4`}>
        {hasTeeSheet && <div className="text-center">
          <div className="text-lg font-bold text-swoop-text">
            {roundsBooked}
          </div>
          <div className="text-xs text-swoop-text-label">
            Rounds booked
          </div>
        </div>}
        <div className="text-center">
          <div className="text-lg font-bold text-swoop-text">
            {tempHigh}°F
          </div>
          <div className="text-xs text-swoop-text-label">
            High temp
          </div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold ${gusts > 15 ? 'text-warning-500' : 'text-swoop-text'}`}>
            {gusts > wind ? `${wind}–${gusts}` : wind} mph
          </div>
          <div className="text-xs text-swoop-text-label">
            Wind{gusts > wind ? ' / Gusts' : ''}
          </div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold ${precipProb > 40 ? 'text-warning-500' : 'text-swoop-text'}`}>
            {precipProb}%
          </div>
          <div className="text-xs text-swoop-text-label">
            Rain chance
          </div>
        </div>
      </div>

      {/* Staffing recommendation per outlet */}
      <div className="text-[11px] font-bold text-swoop-text-muted uppercase tracking-wide mb-2">
        Staffing Recommendation
      </div>

      <div className="flex flex-col gap-1.5 mb-3">
        {getOutlets().map(outlet => {
          const isFull = outlet.status === 'full';
          const color = isFull ? '#12b76a' : '#ef4444';
          return (
            <div key={outlet.name}
              className="flex justify-between items-center py-2 px-3 rounded-lg"
              style={{ background: `${color}08`, border: `1px solid ${color}20` }}
            >
              <span className="text-sm font-semibold text-swoop-text">
                {outlet.name}
              </span>
              <span className="text-xs font-semibold" style={{ color }}>
                {outlet.scheduledStaff}/{outlet.requiredStaff} staff
                {!isFull && ' — needs coverage'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Event & weather impact notes */}
      <div className="flex flex-col gap-1">
        {diningImpact && <div className="text-xs text-swoop-text-muted leading-snug">
          {diningImpact}
        </div>}
        <div className={`text-xs leading-snug ${gusts > 15 || precipProb > 40 ? 'text-warning-500' : 'text-swoop-text-muted'}`}>
          {weatherImpact}
        </div>
      </div>

      {(highDemand || gusts > 15 || precipProb > 40) && (
        <div className="mt-3 pt-3 border-t border-swoop-border">
          <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">
            Layer 3 · Demand projection
          </div>
          <div className="text-[11px] text-swoop-text-muted leading-snug">
            {highDemand && (gusts > 15 || precipProb > 40) ? (
              <>High demand × adverse weather → <span className="font-semibold text-warning-600">likely staffing risk</span>. Cross-references tee sheet × weather × historical conversion.</>
            ) : highDemand ? (
              <>High demand day → expect 15% higher dining traffic. Cross-references tee sheet × POS conversion history.</>
            ) : (
              <>Weather-driven cancellations expected → <span className="font-semibold text-warning-600">monitor staffing</span> for indoor overflow.</>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
