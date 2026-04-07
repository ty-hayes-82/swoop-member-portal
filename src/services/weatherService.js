// weatherService.js — Phase 1 static · Phase 2 /api/weather
//
// Provides current conditions, hourly/daily forecast, and weather alerts.
// Falls back to static data from src/data/weather.js when API is unavailable.

import { weatherDaily as weatherData } from '../data/weather';
import { isSourceLoaded } from './demoGate';
import { isAuthenticatedClub } from '@/config/constants';

let _current = null;
let _forecast = null;

function getClubId() {
  try {
    const cid = localStorage.getItem('swoop_club_id') || null;
    return (cid === 'demo' || cid?.startsWith('demo_')) ? 'club_001' : cid;
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
  if (!isSourceLoaded('weather')) return null;
  if (_current) return _current;
  // Static fallback: Jan 17 demo day
  const today = weatherData.find(d => d.date === '2026-01-17') || weatherData[16];
  if (today) return { temp: today.tempHigh, condition: today.condition, wind: today.wind, humidity: 35 };
  return null;
}

// ─── Hourly Forecast ──────────────────────────────────────

export function getHourlyForecast() {
  if (!isSourceLoaded('weather')) return [];
  if (_forecast?.hourly?.length) return _forecast.hourly;
  return [];
}

// ─── Daily Forecast (up to 10 days) ──────────────────────

export function getDailyForecast(numDays = 10) {
  if (!isSourceLoaded('weather')) return [];
  if (_forecast?.daily?.length) return _forecast.daily.slice(0, numDays);
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
  if (!isSourceLoaded('weather')) return [];
  if (_forecast?.alerts?.length) return _forecast.alerts;
  // Static fallback: wind advisory for demo day
  if (!isAuthenticatedClub()) {
    return [{
      type: 'Wind Advisory',
      severity: 'MODERATE',
      headline: 'Wind Advisory — gusts to 30-40 mph expected Saturday afternoon',
      description: 'Consider pre-notifying 32 afternoon tee times with reschedule options.',
    }];
  }
  return [];
}

// ─── Forecast metadata ───────────────────────────────────

export function getWeatherSource() {
  return _forecast?.source || 'static';
}

export function isWeatherStale() {
  return _forecast?.stale || false;
}
