// WeekForecast — 10-day weather outlook for club operations planning
import { getDailyForecast, getWeatherSource } from '@/services/weatherService';

const conditionIcons = {
  sunny: '☀️', partly_cloudy: '⛅', cloudy: '☁️',
  rainy: '🌧️', snow: '❄️', thunderstorm: '⛈️',
  fog: '🌫️', windy: '💨', unknown: '🌤️',
};

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeekForecast() {
  const forecast = getDailyForecast(10);
  const source = getWeatherSource();

  if (!forecast?.length || source === 'static') return null;

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">
          10-Day Forecast
        </div>
        <div className="text-[10px] text-gray-400">
          Source: {source === 'google' ? 'Google Weather' : source === 'open_meteo' ? 'Open-Meteo' : source}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {forecast.map((day, i) => {
          const date = new Date(day.date + 'T12:00:00');
          const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[date.getDay()];
          const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
          const icon = conditionIcons[day.conditions] || conditionIcons.unknown;
          const precipProb = typeof day.precipProb === 'object' ? day.precipProb?.percent : day.precipProb;
          const hasRain = precipProb > 30;
          const hasWind = (day.wind || 0) > 15;

          return (
            <div
              key={day.date}
              className={`grid items-center py-1.5 px-2.5 rounded-lg text-sm ${
                hasRain || hasWind
                  ? 'bg-warning-50/50 dark:bg-warning-500/5 border border-warning-200/50 dark:border-warning-500/10'
                  : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'
              }`}
              style={{ gridTemplateColumns: '72px 24px 1fr auto auto auto' }}
            >
              {/* Day name */}
              <div className="flex-shrink-0">
                <span className="font-semibold text-gray-800 dark:text-white/90">{dayName}</span>
                <span className="text-gray-400 ml-1 text-xs">{dateStr}</span>
              </div>

              {/* Icon */}
              <div className="text-base text-center">{icon}</div>

              {/* Conditions */}
              <div className="text-xs text-gray-500 truncate px-2">
                {day.conditionsText || day.conditions}
              </div>

              {/* Precip */}
              <div className={`text-xs font-semibold text-right min-w-[32px] ${precipProb > 0 ? (hasRain ? 'text-blue-500' : 'text-gray-400') : 'text-transparent'}`}>
                {precipProb > 0 ? `${precipProb}%` : ''}
              </div>

              {/* Wind */}
              <div className={`text-xs font-semibold text-right min-w-[48px] ${hasWind ? 'text-warning-500' : 'text-transparent'}`}>
                {hasWind ? `${Math.round(day.wind)} mph` : ''}
              </div>

              {/* Temp range */}
              <div className="text-right min-w-[68px]">
                <span className="font-bold text-gray-800 dark:text-white/90">{Math.round(day.high)}°</span>
                <span className="text-gray-400 mx-0.5">/</span>
                <span className="text-gray-400">{Math.round(day.low)}°</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operational impact summary */}
      {(() => {
        const precipProb = (d) => typeof d.precipProb === 'object' ? d.precipProb?.percent : d.precipProb;
        const rainDays = forecast.filter(d => precipProb(d) > 40);
        const windDays = forecast.filter(d => (d.wind || 0) > 20);
        if (!rainDays.length && !windDays.length) return null;

        return (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Operations Impact
            </div>
            <div className="flex flex-col gap-1">
              {rainDays.length > 0 && (
                <div className="text-xs text-blue-500">
                  {rainDays.length} day{rainDays.length > 1 ? 's' : ''} with rain likely — plan for indoor dining overflow and potential cancellations
                </div>
              )}
              {windDays.length > 0 && (
                <div className="text-xs text-warning-500">
                  {windDays.length} day{windDays.length > 1 ? 's' : ''} with high winds (20+ mph) — cart path only conditions possible
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
