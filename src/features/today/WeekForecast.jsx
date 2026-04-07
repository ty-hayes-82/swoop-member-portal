// WeekForecast — compact 10-day weather outlook
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

  // Pre-compute impact counts
  const getPrecip = (d) => typeof d.precipProb === 'object' ? d.precipProb?.percent : d.precipProb;
  const rainDays = forecast.filter(d => getPrecip(d) > 40).length;
  const windDays = forecast.filter(d => (d.wind || 0) > 20).length;

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">10-Day Forecast</span>
          {(rainDays > 0 || windDays > 0) && (
            <span className="text-[10px] text-gray-400">
              {rainDays > 0 && <span className="text-blue-500">{rainDays}d rain</span>}
              {rainDays > 0 && windDays > 0 && <span className="mx-1">·</span>}
              {windDays > 0 && <span className="text-warning-500">{windDays}d wind 20+</span>}
            </span>
          )}
        </div>
        <div className="text-[9px] text-gray-400">
          {source === 'google' ? 'Google' : source === 'open_meteo' ? 'Open-Meteo' : source}
        </div>
      </div>

      <div className="flex flex-col gap-px">
        {forecast.map((day, i) => {
          const date = new Date(day.date + 'T12:00:00');
          const dayName = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : dayNames[date.getDay()];
          const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
          const icon = conditionIcons[day.conditions] || conditionIcons.unknown;
          const precipProb = getPrecip(day);
          const hasRain = precipProb > 30;
          const hasWind = (day.wind || 0) > 15;

          return (
            <div
              key={day.date}
              className={`grid items-center py-1 px-2 rounded text-xs ${
                hasRain || hasWind
                  ? 'bg-warning-50/50 dark:bg-warning-500/5'
                  : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'
              }`}
              style={{ gridTemplateColumns: '58px 20px 1fr auto auto auto' }}
            >
              <div>
                <span className="font-semibold text-gray-800 dark:text-white/90">{dayName}</span>
                <span className="text-gray-400 ml-1 text-[10px]">{dateStr}</span>
              </div>

              <div className="text-sm text-center leading-none">{icon}</div>

              <div className="text-[11px] text-gray-500 truncate px-1.5">
                {day.conditionsText || day.conditions}
              </div>

              <div className={`text-[11px] font-semibold text-right min-w-[28px] ${precipProb > 0 ? (hasRain ? 'text-blue-500' : 'text-gray-400') : 'text-transparent'}`}>
                {precipProb > 0 ? `${precipProb}%` : ''}
              </div>

              <div className={`text-[11px] font-semibold text-right min-w-[42px] ${hasWind ? 'text-warning-500' : 'text-transparent'}`}>
                {hasWind ? `${Math.round(day.wind)}mph` : ''}
              </div>

              <div className="text-right min-w-[56px]">
                <span className="font-bold text-gray-800 dark:text-white/90">{Math.round(day.high)}°</span>
                <span className="text-gray-400 mx-px">/</span>
                <span className="text-gray-400">{Math.round(day.low)}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
