// weatherService.js — Phase 1 static · Phase 2 /api/weather
//
// Provides current conditions, hourly/daily forecast, and weather alerts.
// Falls back to static data from src/data/weather.js when API is unavailable.

import { weatherDaily as weatherData } from '../data/weather';
import { isRealClub } from '@/config/constants';

let _current = null;
let _forecast = null;

const CLUB_ID = 'club_001';

export const _init = async () => {
  try {
    const res = await fetch(`/api/weather?clubId=${CLUB_ID}&type=forecast`);
    if (res.ok) {
      _forecast = await res.json();
      _current = _forecast.current || null;
    }
  } catch { /* keep static fallback */ }
};

// ─── Current Conditions ───────────────────────────────────

export function getCurrentWeather() {
  if (_current) return _current;
  if (isRealClub()) return null;

  // Phase 1 static fallback — derive from weather.js seed data
  const today = weatherData?.find(d => d.date === '2026-01-17') || weatherData?.[0];
  if (!today) return null;

  return {
    temp: today.temp_high,
    feelsLike: today.temp_high,
    wind: today.wind_mph,
    gusts: today.wind_mph,
    humidity: 55,
    conditions: today.condition,
    conditionsText: today.condition,
    precipProbability: today.precipitation_in > 0 ? 80 : 0,
    source: 'static',
    stale: false,
  };
}

// ─── Hourly Forecast ──────────────────────────────────────

export function getHourlyForecast() {
  if (_forecast?.hourly?.length) return _forecast.hourly;
  if (isRealClub()) return [];

  // Phase 1 fallback — generate synthetic hourly from daily data
  const today = weatherData?.find(d => d.date === '2026-01-17') || weatherData?.[0];
  if (!today) return [];

  return Array.from({ length: 12 }, (_, i) => ({
    hour: i + 7,
    time: `2026-01-17T${String(i + 7).padStart(2, '0')}:00:00`,
    temp: Math.round(today.temp_low + (today.temp_high - today.temp_low) * Math.min(1, (i + 3) / 10)),
    wind: today.wind_mph + (i > 4 ? Math.round(today.wind_mph * 0.3) : 0),
    gusts: today.wind_mph + (i > 4 ? Math.round(today.wind_mph * 0.5) : 0),
    precipProb: today.precipitation_in > 0 ? 60 : 5,
    conditions: today.condition,
    conditionsText: today.condition,
    thunderstormProb: 0,
  }));
}

// ─── Daily Forecast (up to 10 days) ──────────────────────

export function getDailyForecast(numDays = 10) {
  if (_forecast?.daily?.length) return _forecast.daily.slice(0, numDays);
  if (isRealClub()) return [];

  // Phase 1 fallback — use weatherData seed
  const startIdx = weatherData?.findIndex(d => d.date === '2026-01-17') ?? 0;
  return (weatherData || []).slice(startIdx, startIdx + numDays).map(d => ({
    date: d.date,
    high: d.temp_high,
    low: d.temp_low,
    wind: d.wind_mph,
    gusts: d.wind_mph,
    precipProb: d.precipitation_in > 0 ? 70 : 10,
    precipAmount: d.precipitation_in,
    conditions: d.condition,
    conditionsText: d.condition,
  }));
}

// ─── Tomorrow's Forecast ──────────────────────────────────

export function getTomorrowForecast() {
  const daily = getDailyForecast(2);
  return daily.length > 1 ? daily[1] : daily[0] || null;
}

// ─── Weather Alerts ───────────────────────────────────────

export function getWeatherAlerts() {
  if (_forecast?.alerts?.length) return _forecast.alerts;
  return [];
}

// ─── Forecast metadata ───────────────────────────────────

export function getWeatherSource() {
  return _forecast?.source || 'static';
}

export function isWeatherStale() {
  return _forecast?.stale || false;
}
