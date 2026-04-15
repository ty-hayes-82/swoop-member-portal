// WeekForecast — hourly strip + 5-day card forecast (Google Weather)
import { useState, useEffect } from 'react';
import { getDailyForecast, getHourlyForecast, getWeatherSource, getWeatherLocation, useWeatherData } from '@/services/weatherService';

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
  const { data: weatherData, isLoading: weatherLoading, error: weatherError } = useWeatherData();

  const [, setTick] = useState(0);
  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener('swoop:weather-updated', handler);
    return () => window.removeEventListener('swoop:weather-updated', handler);
  }, []);

  // Prefer hook data when available; fall back to legacy getters for backwards compat
  // Use length check (not ??) so empty arrays also trigger the fallback
  const forecast = (weatherData?.daily?.length ? weatherData.daily.slice(0, 5) : null) ?? getDailyForecast(5);
  const hourly = (weatherData?.hourly?.length ? weatherData.hourly : null) ?? getHourlyForecast();
  const source = weatherData?.source ?? getWeatherSource();
  const location = weatherData?.location ?? getWeatherLocation();

  if (weatherLoading && !forecast?.length) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <div className="bg-swoop-panel border border-swoop-border rounded-xl px-4 py-3">
          <div className="h-3 w-24 bg-swoop-border rounded animate-pulse mb-3" />
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="h-2.5 w-6 bg-swoop-border rounded animate-pulse" />
                <div className="h-5 w-5 bg-swoop-border rounded-full animate-pulse" />
                <div className="h-3 w-8 bg-swoop-border rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (weatherError) {
    return (
      <div className="text-xs text-swoop-text-label px-2 py-3">Failed to load weather forecast.</div>
    );
  }

  if ((!forecast?.length && !hourly?.length) || source === 'static') return null;

  const getPrecip = (d) => typeof d.precipProb === 'object' ? d.precipProb?.percent : d.precipProb;

  return (
    <div className="flex flex-col gap-3">
      {/* Hourly strip */}
      {hourly.length > 0 && (() => {
        const slice = hourly.slice(0, 12);
        const peakTemp = Math.max(...slice.map(h => h.temp));
        return (
          <div className="bg-swoop-panel border border-swoop-border rounded-xl px-4 py-3 weather-hourly-enhanced">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Today's Hourly</span>
                {location && <span className="text-[10px] text-swoop-text-label">{location}</span>}
              </div>
              <span className="text-[9px] text-swoop-text-label">
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
                    <span className="text-[10px] text-swoop-text-muted font-medium">{formatHour(h.time)}</span>
                    <span className="text-sm my-0.5 leading-none">{icon}</span>
                    <span className="text-xs font-bold text-swoop-text">{Math.round(h.temp)}°</span>
                    {prob > 0 && (
                      <span className={`text-[9px] font-semibold mt-0.5 ${prob > 30 ? 'text-blue-500' : 'text-swoop-text-label'}`}>
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
              <span className="text-[9px] text-swoop-text-label">
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
                  className={`bg-swoop-panel rounded-lg border border-gray-200/80 px-2 py-2.5 flex flex-col forecast-card${i === 0 ? ' forecast-card-today' : ''}`}
                >
                  {/* Date header */}
                  <div className="text-center mb-1.5">
                    <div className={`text-xs font-bold leading-tight ${i === 0 ? 'text-blue-600' : 'text-swoop-text-2'}`}>
                      {dayName}
                    </div>
                    <div className="text-[9px] text-swoop-text-label">{dateStr}</div>
                  </div>

                  {/* Day temp + icon */}
                  <div className="flex flex-col items-center">
                    <span className="text-xl leading-none mb-0.5">{icon}</span>
                    <span className="text-lg font-bold text-swoop-text leading-tight">
                      {Math.round(day.high)}°
                    </span>
                    <span className="text-[10px] text-swoop-text-muted leading-tight truncate w-full text-center">
                      {day.conditionsText || day.conditions}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-swoop-border-inset my-1.5" />

                  {/* Night */}
                  <div className="flex flex-col items-center mb-1.5">
                    <span className="text-[9px] text-swoop-text-label uppercase font-semibold tracking-wide">Night</span>
                    <span className="text-sm font-bold text-swoop-text-muted leading-tight">
                      {Math.round(day.low)}°
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col gap-0.5 mt-auto">
                    {wind > 0 && (
                      <div className="flex justify-between text-[9px]">
                        <span className="text-swoop-text-label">Wind</span>
                        <span className={`font-semibold ${hasWind ? 'text-warning-500' : 'text-swoop-text-muted'}`}>
                          {Math.round(wind)} mph
                        </span>
                      </div>
                    )}
                    {precipProb > 0 && (
                      <div className="flex justify-between text-[9px]">
                        <span className="text-swoop-text-label">Precip</span>
                        <span className={`font-semibold ${hasRain ? 'text-blue-500' : 'text-swoop-text-muted'}`}>
                          {precipProb}%
                        </span>
                      </div>
                    )}
                    {day.humidity > 0 && (
                      <div className="flex justify-between text-[9px]">
                        <span className="text-swoop-text-label">Humid</span>
                        <span className="font-semibold text-swoop-text-muted">{day.humidity}%</span>
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
