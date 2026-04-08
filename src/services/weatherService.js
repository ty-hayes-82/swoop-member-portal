// weatherService.js — Phase 1 static · Phase 2 /api/weather
//
// Provides current conditions, hourly/daily forecast, and weather alerts.
// Falls back to static data from src/data/weather.js when API is unavailable.

import { weatherDaily as weatherData } from '../data/weather';
import { shouldUseStatic } from './demoGate';

let _current = null;
let _forecast = null;

function getClubId() {
  try {
    const cid = localStorage.getItem('swoop_club_id') || null;
    return (cid === 'demo' || cid?.startsWith('demo_')) ? 'club_001' : cid;
  } catch { return null; }
}

/**
 * Fetch weather from Open-Meteo by city name (used for demo/guided mode).
 * No API key needed. Geocodes city → lat/lng, then fetches forecast.
 */
async function fetchWeatherByCity(city, state) {
  if (!city) return null;
  try {
    // Geocode city → lat/lng via Open-Meteo geocoding
    const query = encodeURIComponent(`${city}${state ? ', ' + state : ''}`);
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1&language=en&format=json`);
    if (!geoRes.ok) return null;
    const geo = await geoRes.json();
    if (!geo.results?.length) return null;
    const { latitude, longitude, name } = geo.results[0];

    // Fetch current + hourly + daily forecast
    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,weather_code` +
      `&hourly=temperature_2m,weather_code,precipitation_probability` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code,wind_speed_10m_max,wind_gusts_10m_max,precipitation_probability_max,relative_humidity_2m_max` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=7&timezone=auto`
    );
    if (!wxRes.ok) return null;
    const wx = await wxRes.json();

    // Normalize to our format
    const codeToCondition = (c) => {
      if (c <= 1) return 'sunny';
      if (c <= 3) return 'partly_cloudy';
      if (c <= 48) return 'cloudy';
      if (c <= 67) return 'rainy';
      if (c <= 77) return 'snow';
      if (c <= 82) return 'rainy';
      if (c >= 95) return 'thunderstorm';
      return 'cloudy';
    };
    const codeToText = (c) => {
      if (c <= 1) return 'Sunny';
      if (c <= 3) return 'Partly Cloudy';
      if (c <= 48) return 'Cloudy';
      if (c <= 55) return 'Light Rain';
      if (c <= 67) return 'Rain';
      if (c <= 77) return 'Snow';
      if (c <= 82) return 'Heavy Rain';
      if (c >= 95) return 'Thunderstorm';
      return 'Cloudy';
    };

    const current = wx.current ? {
      temp: Math.round(wx.current.temperature_2m),
      condition: codeToCondition(wx.current.weather_code),
      conditionsText: codeToText(wx.current.weather_code),
      wind: Math.round(wx.current.wind_speed_10m),
      gusts: Math.round(wx.current.wind_gusts_10m || wx.current.wind_speed_10m),
      humidity: wx.current.relative_humidity_2m,
    } : null;

    const hourly = (wx.hourly?.time || []).slice(0, 24).map((t, i) => ({
      time: t,
      temp: Math.round(wx.hourly.temperature_2m[i]),
      conditions: codeToCondition(wx.hourly.weather_code[i]),
      conditionsText: codeToText(wx.hourly.weather_code[i]),
      precipProb: wx.hourly.precipitation_probability?.[i] || 0,
    }));

    const daily = (wx.daily?.time || []).map((d, i) => ({
      date: d,
      high: Math.round(wx.daily.temperature_2m_max[i]),
      low: Math.round(wx.daily.temperature_2m_min[i]),
      conditions: codeToCondition(wx.daily.weather_code[i]),
      conditionsText: codeToText(wx.daily.weather_code[i]),
      wind: Math.round(wx.daily.wind_speed_10m_max[i]),
      gusts: Math.round(wx.daily.wind_gusts_10m_max?.[i] || wx.daily.wind_speed_10m_max[i]),
      precipProb: wx.daily.precipitation_probability_max?.[i] || 0,
      humidity: wx.daily.relative_humidity_2m_max?.[i] || 0,
    }));

    return { current, hourly, daily, alerts: [], source: 'open_meteo', location: name };
  } catch {
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
  if (_current) return _current;
  if (!shouldUseStatic('weather')) return null;
  // Static fallback: Jan 17 demo day
  const today = weatherData.find(d => d.date === '2026-01-17') || weatherData[16];
  if (today) return { temp: today.tempHigh, condition: today.condition, wind: today.wind, humidity: 35 };
  return null;
}

// ─── Hourly Forecast ──────────────────────────────────────

export function getHourlyForecast() {
  if (_forecast?.hourly?.length) return _forecast.hourly;
  if (!shouldUseStatic('weather')) return [];
  return [];
}

// ─── Daily Forecast (up to 10 days) ──────────────────────

export function getDailyForecast(numDays = 10) {
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
