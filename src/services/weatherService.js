// weatherService.js — Phase 1 static · Phase 2 /api/weather
//
// Provides current conditions, hourly/daily forecast, and weather alerts.
// Falls back to static data from src/data/weather.js when API is unavailable.

import { weatherDaily as weatherData } from '../data/weather';
import { isAuthenticatedClub } from '@/config/constants';

let _current = null;
let _forecast = null;

function getClubId() {
  try {
    const cid = localStorage.getItem('swoop_club_id') || null;
    return cid === 'demo' ? 'club_001' : cid;
  } catch { return null; }
}

export const _init = async () => {
  try {
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
  return null;
}

// ─── Hourly Forecast ──────────────────────────────────────

export function getHourlyForecast() {
  if (_forecast?.hourly?.length) return _forecast.hourly;
  return [];
}

// ─── Daily Forecast (up to 10 days) ──────────────────────

export function getDailyForecast(numDays = 10) {
  if (_forecast?.daily?.length) return _forecast.daily.slice(0, numDays);
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
  return [];
}

// ─── Forecast metadata ───────────────────────────────────

export function getWeatherSource() {
  return _forecast?.source || 'static';
}

export function isWeatherStale() {
  return _forecast?.stale || false;
}
