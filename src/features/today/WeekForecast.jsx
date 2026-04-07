// WeekForecast — compact 10-day horizontal card strip
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

  const getPrecip = (d) => typeof d.precipProb === 'object' ? d.precipProb?.percent : d.precipProb;
  const rainDays = forecast.filter(d => getPrecip(d) > 40).length;
  const windDays = forecast.filter(d => (d.wind || 0) > 20).length;

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5">
      <div className="flex items-center justify-between mb-2">
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

      <div className="grid grid-cols-5 gap-1.5">
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
              className={`flex flex-col items-center py-2 px-1 rounded-lg text-center ${
                hasRain || hasWind
                  ? 'bg-warning-50/60 dark:bg-warning-500/5 ring-1 ring-warning-200/50 dark:ring-warning-500/10'
                  : 'bg-gray-50/50 dark:bg-white/[0.02]'
              }`}
            >
              <div className="text-[11px] font-semibold text-gray-800 dark:text-white/90 leading-tight">{dayName}</div>
              <div className="text-[9px] text-gray-400 leading-tight">{dateStr}</div>
              <div className="text-base my-1 leading-none">{icon}</div>
              <div className="text-xs font-bold text-gray-800 dark:text-white/90 leading-tight">
                {Math.round(day.high)}°<span className="text-gray-400 font-normal">/{Math.round(day.low)}°</span>
              </div>
              {precipProb > 0 && (
                <div className={`text-[10px] font-semibold leading-tight mt-0.5 ${hasRain ? 'text-blue-500' : 'text-gray-400'}`}>
                  {precipProb}%
                </div>
              )}
              {hasWind && (
                <div className="text-[10px] font-semibold text-warning-500 leading-tight">
                  {Math.round(day.wind)}mph
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
