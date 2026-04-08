// weatherService.js — Phase 1 static · Phase 2 /api/weather
//
// Provides current conditions, hourly/daily forecast, and weather alerts.
// Falls back to static data from src/data/weather.js when API is unavailable.

import { weatherDaily as weatherData } from '../data/weather';
import { shouldUseStatic, isGuidedMode, isSourceLoaded } from './demoGate';

let _current = null;
let _forecast = null;

// In guided demo, weather requires the Club Profile (gateId: 'pipeline') to be imported
function isWeatherGated() {
  return isGuidedMode() && !isSourceLoaded('pipeline');
}

function getClubId() {
  try {
    const cid = localStorage.getItem('swoop_club_id') || null;
    return (cid === 'demo' || cid?.startsWith('demo_')) ? 'club_001' : cid;
  } catch { return null; }
}

/**
 * Fetch weather from Google Weather API by city/state.
 * Geocodes city → lat/lon via Nominatim, then calls Google Weather via Vite proxy
 * (browser can't call weather.googleapis.com directly due to CORS).
 */
async function fetchWeatherByCity(city, state) {
  if (!city) return null;
  try {
    // In production (Vercel), use backend API; locally, use Vite proxy to bypass CORS
    const isLocal = import.meta.env?.DEV;
    if (!isLocal) {
      const params = new URLSearchParams({ city, state: state || '', days: '5' });
      const apiRes = await fetch(`/api/weather?${params}`);
      if (!apiRes.ok) return null;
      const apiData = await apiRes.json();
      if (apiData.source === 'none' || !apiData.daily?.length) return null;
      return apiData;
    }

    // Local dev: call Google Weather via Vite proxy (CORS bypass)
    const apiKey = import.meta.env?.VITE_GOOGLE_WEATHER_API_KEY;
    if (!apiKey) return null;

    // Geocode city → lat/lon via Nominatim (supports CORS)
    const query = encodeURIComponent(`${city}${state ? ' ' + state : ''} US`);
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
    if (!geoRes.ok) return null;
    const geoResults = await geoRes.json();
    if (!geoResults.length) return null;
    const lat = parseFloat(geoResults[0].lat);
    const lon = parseFloat(geoResults[0].lon);
    const locationName = geoResults[0].display_name?.split(',')[0] || city;

    const base = '/google-weather-proxy';
    const commonParams = { key: apiKey, 'location.latitude': lat, 'location.longitude': lon, languageCode: 'en', unitsSystem: 'IMPERIAL' };

    const condMap = {
      CLEAR: 'sunny', MOSTLY_CLEAR: 'sunny',
      PARTLY_CLOUDY: 'partly_cloudy', MOSTLY_CLOUDY: 'cloudy', CLOUDY: 'cloudy',
      FOG: 'fog', LIGHT_FOG: 'fog',
      DRIZZLE: 'rainy', RAIN: 'rainy', LIGHT_RAIN: 'rainy', HEAVY_RAIN: 'rainy',
      SNOW: 'snow', LIGHT_SNOW: 'snow', HEAVY_SNOW: 'snow',
      THUNDERSTORM: 'thunderstorm', THUNDERSTORMS: 'thunderstorm',
      WINDY: 'windy',
    };
    const normCond = (type) => condMap[type] || type?.toLowerCase() || 'unknown';

    // Fetch all three in parallel
    const [curRes, hRes, dRes] = await Promise.all([
      fetch(`${base}/v1/currentConditions:lookup?${new URLSearchParams(commonParams)}`),
      fetch(`${base}/v1/forecast/hours:lookup?${new URLSearchParams({ ...commonParams, hours: 24 })}`),
      fetch(`${base}/v1/forecast/days:lookup?${new URLSearchParams({ ...commonParams, days: 5 })}`),
    ]);

    const curData = curRes.ok ? await curRes.json() : null;
    const hData = hRes.ok ? await hRes.json() : null;
    const dData = dRes.ok ? await dRes.json() : null;

    if (!curData && !hData && !dData) return null;

    const current = curData ? {
      temp: curData.temperature?.degrees,
      feelsLike: curData.feelsLikeTemperature?.degrees,
      humidity: curData.relativeHumidity,
      wind: curData.wind?.speed?.value,
      gusts: curData.wind?.gust?.value || 0,
      conditions: normCond(curData.weatherCondition?.type),
      conditionsText: curData.weatherCondition?.description?.text || curData.weatherCondition?.type,
    } : null;

    const hourly = (hData?.forecastHours || []).map(h => ({
      time: h.interval?.startTime,
      temp: h.temperature?.degrees,
      wind: h.wind?.speed?.value,
      gusts: h.wind?.gust?.value || 0,
      precipProb: h.precipitation?.probability?.percent ?? 0,
      conditions: normCond(h.weatherCondition?.type),
      conditionsText: h.weatherCondition?.description?.text || h.weatherCondition?.type,
    }));

    const daily = (dData?.forecastDays || []).map(day => {
      const df = day.daytimeForecast || {};
      const dd = day.displayDate;
      const dateStr = dd ? `${dd.year}-${String(dd.month).padStart(2,'0')}-${String(dd.day).padStart(2,'0')}` : day.interval?.startTime?.split('T')[0];
      return {
        date: dateStr,
        high: day.maxTemperature?.degrees,
        low: day.minTemperature?.degrees,
        wind: df.wind?.speed?.value || 0,
        gusts: df.wind?.gust?.value || 0,
        precipProb: df.precipitation?.probability?.percent ?? 0,
        conditions: normCond(df.weatherCondition?.type),
        conditionsText: df.weatherCondition?.description?.text || df.weatherCondition?.type,
        humidity: df.relativeHumidity || 0,
      };
    });

    return { current, hourly, daily, alerts: [], source: 'google', location: locationName };
  } catch (e) {
    console.warn('Google Weather fetch failed:', e);
    return null;
  }
}

/**
 * Refresh weather for the current club location.
 * Called when club profile is imported or city/state changes.
 */
export async function refreshWeatherForLocation() {
  try {
    const city = localStorage.getItem('swoop_club_city');
    const state = localStorage.getItem('swoop_club_state');
    if (!city) return;
    const data = await fetchWeatherByCity(city, state);
    if (data) {
      _forecast = data;
      _current = data.current;
      // Notify listeners that weather data changed
      window.dispatchEvent(new CustomEvent('swoop:weather-updated'));
    }
  } catch {}
}

export const _init = async () => {
  try {
    // In guided demo, don't fetch weather until Club Profile is imported
    if (isWeatherGated()) return;
    // Check if we have a stored city for demo mode
    const city = localStorage.getItem('swoop_club_city');
    if (city) {
      await refreshWeatherForLocation();
      return;
    }
    const cid = getClubId();
    if (!cid) return;
    const res = await fetch(`/api/weather?clubId=${cid}&type=forecast`);
    if (res.ok) {
      _forecast = await res.json();
      _current = _forecast.current || null;
    }
  } catch { /* keep static fallback */ }
};

// ─── Current Conditions ───────────────────────────────────

export function getCurrentWeather() {
  if (isWeatherGated()) return null;
  if (_current) return _current;
  if (!shouldUseStatic('weather')) return null;
  // Static fallback: Jan 17 demo day
  const today = weatherData.find(d => d.date === '2026-01-17') || weatherData[16];
  if (today) return { temp: today.tempHigh, condition: today.condition, wind: today.wind, humidity: 35 };
  return null;
}

// ─── Hourly Forecast ──────────────────────────────────────

export function getHourlyForecast() {
  if (isWeatherGated()) return [];
  if (_forecast?.hourly?.length) return _forecast.hourly;
  if (!shouldUseStatic('weather')) return [];
  return [];
}

// ─── Daily Forecast (up to 5 days) ───────────────────────

export function getDailyForecast(numDays = 5) {
  if (isWeatherGated()) return [];
  if (_forecast?.daily?.length) return _forecast.daily.slice(0, numDays);
  if (!shouldUseStatic('weather')) return [];
  // Static fallback from weather data starting Jan 17
  const startIdx = weatherData.findIndex(d => d.date === '2026-01-17');
  if (startIdx >= 0) {
    return weatherData.slice(startIdx, startIdx + numDays).map(d => ({
      date: d.date, tempHigh: d.tempHigh, tempLow: d.tempHigh - 15,
      condition: d.condition, wind: d.wind, rain: d.rain || false,
      description: d.condition === 'sunny' ? 'Clear skies' : d.condition === 'rainy' ? 'Rain expected' : d.condition === 'windy' ? 'Wind advisory' : 'Partly cloudy',
    }));
  }
  return [];
}

// ─── Tomorrow's Forecast ──────────────────────────────────

export function getTomorrowForecast() {
  const daily = getDailyForecast(2);
  return daily.length > 1 ? daily[1] : daily[0] || null;
}

// ─── Weather Alerts ───────────────────────────────────────

export function getWeatherAlerts() {
  if (isWeatherGated()) return [];
  if (_forecast?.alerts?.length) return _forecast.alerts;
  if (!shouldUseStatic('weather')) return [];
  return [{
    type: 'Wind Advisory',
    severity: 'MODERATE',
    headline: 'Wind Advisory — gusts to 30-40 mph expected Saturday afternoon',
    description: 'Consider pre-notifying 32 afternoon tee times with reschedule options.',
  }];
}

// ─── Forecast metadata ───────────────────────────────────

export function getWeatherSource() {
  return _forecast?.source || 'static';
}

export function isWeatherStale() {
  return _forecast?.stale || false;
}
