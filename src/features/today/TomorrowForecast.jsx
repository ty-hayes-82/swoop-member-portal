// TomorrowForecast — demand prediction for tomorrow
import { getDailyBriefing } from '@/services/briefingService';
import { getTomorrowForecast } from '@/services/weatherService';
import { understaffedDays } from '@/data/staffing';

const outlets = [
  { name: 'Grill Room', requiredStaff: 4, scheduledStaff: 2, status: 'gap' },
  { name: 'Terrace', requiredStaff: 3, scheduledStaff: 3, status: 'full' },
  { name: 'Pool Bar', requiredStaff: 1, scheduledStaff: 1, status: 'full' },
];

export default function TomorrowForecast() {
  const briefing = getDailyBriefing();
  const tomorrow = briefing?.todayRisks?.tomorrow || getTomorrowForecast();
  const roundsBooked = briefing?.teeSheet?.roundsToday || 220;

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

  const diningImpact = highDemand
    ? `${roundsBooked} rounds booked — expect 15% higher dining traffic`
    : `${roundsBooked} rounds booked — standard dining demand`;

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wide mb-3">
        Tomorrow's Forecast
      </div>

      {/* Demand prediction */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800 dark:text-white/90">
            {roundsBooked}
          </div>
          <div className="text-xs text-gray-400">
            Rounds booked
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800 dark:text-white/90">
            {tempHigh}°F
          </div>
          <div className="text-xs text-gray-400">
            High temp
          </div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold ${gusts > 15 ? 'text-warning-500' : 'text-gray-800 dark:text-white/90'}`}>
            {gusts > wind ? `${wind}–${gusts}` : wind} mph
          </div>
          <div className="text-xs text-gray-400">
            Wind{gusts > wind ? ' / Gusts' : ''}
          </div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold ${precipProb > 40 ? 'text-warning-500' : 'text-gray-800 dark:text-white/90'}`}>
            {precipProb}%
          </div>
          <div className="text-xs text-gray-400">
            Rain chance
          </div>
        </div>
      </div>

      {/* Staffing recommendation per outlet */}
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
        Staffing Recommendation
      </div>

      <div className="flex flex-col gap-1.5 mb-3">
        {outlets.map(outlet => {
          const isFull = outlet.status === 'full';
          const color = isFull ? '#22c55e' : '#ef4444';
          return (
            <div key={outlet.name}
              className="flex justify-between items-center py-2 px-3 rounded-lg"
              style={{ background: `${color}08`, border: `1px solid ${color}20` }}
            >
              <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
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
        <div className="text-xs text-gray-500 leading-snug">
          {diningImpact}
        </div>
        <div className={`text-xs leading-snug ${gusts > 15 || precipProb > 40 ? 'text-warning-500' : 'text-gray-500'}`}>
          {weatherImpact}
        </div>
      </div>
    </div>
  );
}
