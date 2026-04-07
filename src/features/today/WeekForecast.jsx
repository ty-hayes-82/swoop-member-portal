// WeekForecast — 5-day inline forecast strip
import { getDailyForecast, getWeatherSource } from '@/services/weatherService';

const conditionIcons = {
  sunny: '☀️', partly_cloudy: '⛅', cloudy: '☁️',
  rainy: '🌧️', snow: '❄️', thunderstorm: '⛈️',
  fog: '🌫️', windy: '💨', unknown: '🌤️',
};

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeekForecast() {
  const forecast = getDailyForecast(5);
  const source = getWeatherSource();

  if (!forecast?.length || source === 'static') return null;

  const getPrecip = (d) => typeof d.precipProb === 'object' ? d.precipProb?.percent : d.precipProb;

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3">
      <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wide whitespace-nowrap mr-1">
        5-Day
      </div>

      <div className="flex-1 grid grid-cols-5 gap-2">
        {forecast.map((day, i) => {
          const date = new Date(day.date + 'T12:00:00');
          const dayName = i === 0 ? 'Today' : dayNames[date.getDay()];
          const icon = conditionIcons[day.conditions] || conditionIcons.unknown;
          const precipProb = getPrecip(day);
          const hasRain = precipProb > 30;
          const hasWind = (day.wind || 0) > 15;
          const flagged = hasRain || hasWind;

          return (
            <div
              key={day.date}
              className={`flex flex-col items-center rounded-lg py-1.5 ${
                flagged
                  ? 'bg-warning-50/70 dark:bg-warning-500/5'
                  : ''
              }`}
            >
              <div className={`text-[11px] font-semibold leading-tight ${i === 0 ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>
                {dayName}
              </div>
              <div className="text-lg leading-none my-0.5">{icon}</div>
              <div className="text-[11px] font-bold text-gray-800 dark:text-white/90 leading-tight">
                {Math.round(day.high)}°
                <span className="text-gray-400 font-normal text-[10px]"> {Math.round(day.low)}°</span>
              </div>
              {(precipProb > 0 || hasWind) && (
                <div className="flex items-center gap-1 mt-0.5">
                  {precipProb > 0 && (
                    <span className={`text-[9px] font-semibold ${hasRain ? 'text-blue-500' : 'text-gray-400'}`}>
                      💧{precipProb}%
                    </span>
                  )}
                  {hasWind && (
                    <span className="text-[9px] font-semibold text-warning-500">
                      💨{Math.round(day.wind)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-[8px] text-gray-400 whitespace-nowrap">
        {source === 'google' ? 'Google' : source === 'open_meteo' ? 'Open-Meteo' : source}
      </div>
    </div>
  );
}
