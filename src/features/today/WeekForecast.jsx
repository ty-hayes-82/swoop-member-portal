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
              className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-sm ${
                hasRain || hasWind
                  ? 'bg-warning-50/50 dark:bg-warning-500/5 border border-warning-200/50 dark:border-warning-500/10'
                  : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'
              }`}
            >
              {/* Day name */}
              <div className="w-[72px] flex-shrink-0">
                <span className="font-semibold text-gray-800 dark:text-white/90">{dayName}</span>
                <span className="text-gray-400 ml-1 text-xs">{dateStr}</span>
              </div>

              {/* Icon */}
              <div className="text-base w-6 text-center flex-shrink-0">{icon}</div>

              {/* Conditions */}
              <div className="flex-1 min-w-0 text-xs text-gray-500 truncate">
                {day.conditionsText || day.conditions}
              </div>

              {/* Precip */}
              {precipProb > 0 && (
                <div className={`text-xs font-semibold flex-shrink-0 ${hasRain ? 'text-blue-500' : 'text-gray-400'}`}>
                  {precipProb}%
                </div>
              )}

              {/* Wind */}
              {hasWind && (
                <div className="text-xs font-semibold text-warning-500 flex-shrink-0">
                  {Math.round(day.wind)} mph
                </div>
              )}

              {/* Temp range */}
              <div className="w-[80px] flex-shrink-0 text-right">
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
