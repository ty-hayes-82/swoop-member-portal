// WeekForecast — hourly strip + 5-day card forecast (Google Weather)
import { useState, useEffect } from 'react';
import { getDailyForecast, getHourlyForecast, getWeatherSource, getWeatherLocation } from '@/services/weatherService';

const conditionIcons = {
  sunny: '☀️', partly_cloudy: '⛅', cloudy: '☁️',
  rainy: '🌧️', snow: '❄️', thunderstorm: '⛈️',
  fog: '🌫️', windy: '💨', unknown: '🌤️',
};

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatHour(iso) {
  const d = new Date(iso);
  const h = d.getHours();
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  return h > 12 ? `${h - 12}p` : `${h}a`;
}

export default function WeekForecast() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener('swoop:weather-updated', handler);
    return () => window.removeEventListener('swoop:weather-updated', handler);
  }, []);

  const forecast = getDailyForecast(5);
  const hourly = getHourlyForecast();
  const source = getWeatherSource();
  const location = getWeatherLocation();

  if ((!forecast?.length && !hourly?.length) || source === 'static') return null;

  const getPrecip = (d) => typeof d.precipProb === 'object' ? d.precipProb?.percent : d.precipProb;

  return (
    <div className="flex flex-col gap-3">
      {/* Hourly strip */}
      {hourly.length > 0 && (() => {
        const slice = hourly.slice(0, 12);
        const peakTemp = Math.max(...slice.map(h => h.temp));
        return (
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 weather-hourly-enhanced">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Today's Hourly</span>
                {location && <span className="text-[10px] text-gray-400">{location}</span>}
              </div>
              <span className="text-[9px] text-gray-400">
                {source === 'google' ? 'Google Weather' : source}
              </span>
            </div>
            <div className="grid pb-1" style={{ gridTemplateColumns: `repeat(${Math.min(slice.length, 12)}, 1fr)` }}>
              {slice.map((h, i) => {
                const icon = conditionIcons[h.conditions] || conditionIcons.unknown;
                const prob = getPrecip(h);
                const isPeak = Math.round(h.temp) === Math.round(peakTemp);
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center py-1${isPeak ? ' hourly-peak' : ''}`}
                    style={isPeak ? { background: 'rgba(232,167,50,0.06)', borderRadius: 10 } : undefined}
                  >
                    <span className="text-[10px] text-gray-500 font-medium">{formatHour(h.time)}</span>
                    <span className="text-sm my-0.5 leading-none">{icon}</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-white/90">{Math.round(h.temp)}°</span>
                    {prob > 0 && (
                      <span className={`text-[9px] font-semibold mt-0.5 ${prob > 30 ? 'text-blue-500' : 'text-gray-400'}`}>
                        {prob}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 5-Day cards */}
      {forecast.length > 0 && (
        <div className="forecast-enhanced rounded-xl p-2.5">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">5-Day Forecast</span>
            {!hourly.length && (
              <span className="text-[9px] text-gray-400">
                {source === 'google' ? 'Google Weather' : source}
              </span>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {forecast.map((day, i) => {
              const date = new Date(day.date + 'T12:00:00');
              const dayName = i === 0 ? 'Today' : dayNames[date.getDay()];
              const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
              const icon = conditionIcons[day.conditions] || conditionIcons.unknown;
              const precipProb = getPrecip(day);
              const hasRain = precipProb > 30;
              const wind = day.wind || 0;
              const hasWind = wind > 15;

              return (
                <div
                  key={day.date}
                  className={`bg-white dark:bg-white/[0.04] rounded-lg border border-gray-200/80 dark:border-gray-700/50 px-2 py-2.5 flex flex-col forecast-card${i === 0 ? ' forecast-card-today' : ''}`}
                >
                  {/* Date header */}
                  <div className="text-center mb-1.5">
                    <div className={`text-xs font-bold leading-tight ${i === 0 ? 'text-blue-600' : 'text-gray-700 dark:text-white/80'}`}>
                      {dayName}
                    </div>
                    <div className="text-[9px] text-gray-400">{dateStr}</div>
                  </div>

                  {/* Day temp + icon */}
                  <div className="flex flex-col items-center">
                    <span className="text-xl leading-none mb-0.5">{icon}</span>
                    <span className="text-lg font-bold text-gray-800 dark:text-white/90 leading-tight">
                      {Math.round(day.high)}°
                    </span>
                    <span className="text-[10px] text-gray-500 leading-tight truncate w-full text-center">
                      {day.conditionsText || day.conditions}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100 dark:border-gray-700/50 my-1.5" />

                  {/* Night */}
                  <div className="flex flex-col items-center mb-1.5">
                    <span className="text-[9px] text-gray-400 uppercase font-semibold tracking-wide">Night</span>
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400 leading-tight">
                      {Math.round(day.low)}°
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col gap-0.5 mt-auto">
                    {wind > 0 && (
                      <div className="flex justify-between text-[9px]">
                        <span className="text-gray-400">Wind</span>
                        <span className={`font-semibold ${hasWind ? 'text-warning-500' : 'text-gray-500'}`}>
                          {Math.round(wind)} mph
                        </span>
                      </div>
                    )}
                    {precipProb > 0 && (
                      <div className="flex justify-between text-[9px]">
                        <span className="text-gray-400">Precip</span>
                        <span className={`font-semibold ${hasRain ? 'text-blue-500' : 'text-gray-500'}`}>
                          {precipProb}%
                        </span>
                      </div>
                    )}
                    {day.humidity > 0 && (
                      <div className="flex justify-between text-[9px]">
                        <span className="text-gray-400">Humid</span>
                        <span className="font-semibold text-gray-500">{day.humidity}%</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
