/**
 * WeatherService — Unified weather data abstraction
 *
 * Routes:
 *   Current conditions + Forecast → Google Weather API
 *   Historical day lookups       → Visual Crossing Timeline API
 *
 * Fallback: Google → Visual Crossing → cached data
 */
import { sql } from '@vercel/postgres';

// ─── Helpers ──────────────────────────────────────────────

async function getClubCoordinates(clubId) {
  const { rows } = await sql`
    SELECT latitude, longitude FROM club WHERE club_id = ${clubId}
  `;
  if (!rows.length || !rows[0].latitude || !rows[0].longitude) {
    throw new Error(`No coordinates found for club ${clubId}`);
  }
  return { lat: rows[0].latitude, lon: rows[0].longitude };
}

function normalizeConditionCode(code) {
  // Google Weather uses descriptive codes; normalize to simple categories
  const map = {
    CLEAR: 'sunny', MOSTLY_CLEAR: 'sunny',
    PARTLY_CLOUDY: 'partly_cloudy', MOSTLY_CLOUDY: 'cloudy', CLOUDY: 'cloudy',
    FOG: 'fog', LIGHT_FOG: 'fog',
    DRIZZLE: 'rainy', RAIN: 'rainy', LIGHT_RAIN: 'rainy', HEAVY_RAIN: 'rainy',
    SNOW: 'snow', LIGHT_SNOW: 'snow', HEAVY_SNOW: 'snow',
    THUNDERSTORM: 'thunderstorm', THUNDERSTORMS: 'thunderstorm',
    WINDY: 'windy',
  };
  return map[code] || code?.toLowerCase() || 'unknown';
}

function normalizeVCCondition(icon) {
  // Visual Crossing icon → simple category
  if (!icon) return 'unknown';
  if (icon.includes('clear') || icon.includes('sun')) return 'sunny';
  if (icon.includes('cloud') && icon.includes('part')) return 'partly_cloudy';
  if (icon.includes('cloud')) return 'cloudy';
  if (icon.includes('rain') || icon.includes('shower')) return 'rainy';
  if (icon.includes('snow')) return 'snow';
  if (icon.includes('thunder')) return 'thunderstorm';
  if (icon.includes('fog')) return 'fog';
  if (icon.includes('wind')) return 'windy';
  return icon;
}

// ─── Cache Layer ──────────────────────────────────────────

async function getCachedForecast(clubId) {
  try {
    const { rows } = await sql`
      SELECT forecast_json, fetched_at, expires_at
      FROM weather_hourly_cache
      WHERE club_id = ${clubId} AND expires_at > NOW()
    `;
    return rows.length ? { data: rows[0].forecast_json, stale: false } : null;
  } catch { return null; }
}

async function getCachedForecastStale(clubId) {
  try {
    const { rows } = await sql`
      SELECT forecast_json, fetched_at, expires_at
      FROM weather_hourly_cache
      WHERE club_id = ${clubId}
      ORDER BY fetched_at DESC LIMIT 1
    `;
    return rows.length ? { data: rows[0].forecast_json, stale: true } : null;
  } catch { return null; }
}

async function cacheForecast(clubId, data, ttlMinutes = 60) {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString();
  const json = JSON.stringify(data);
  try {
    await sql`
      INSERT INTO weather_hourly_cache (club_id, fetched_at, expires_at, forecast_json)
      VALUES (${clubId}, NOW(), ${expiresAt}::timestamptz, ${json}::jsonb)
      ON CONFLICT (club_id) DO UPDATE SET
        fetched_at = NOW(),
        expires_at = ${expiresAt}::timestamptz,
        forecast_json = ${json}::jsonb
    `;
  } catch (e) {
    console.error('Failed to cache forecast:', e.message);
  }
}

// ─── Google Weather API ───────────────────────────────────

const GOOGLE_BASE = 'https://weather.googleapis.com';

async function googleCurrentConditions(lat, lon) {
  const key = process.env.GOOGLE_WEATHER_API_KEY;
  if (!key) throw new Error('GOOGLE_WEATHER_API_KEY not configured');

  const params = new URLSearchParams({
    key,
    'location.latitude': lat,
    'location.longitude': lon,
    languageCode: 'en',
    unitsSystem: 'IMPERIAL',
  });
  const res = await fetch(`${GOOGLE_BASE}/v1/currentConditions:lookup?${params}`);

  if (!res.ok) throw new Error(`Google Weather current: ${res.status} ${await res.text()}`);
  const d = await res.json();

  return {
    temp: d.temperature?.degrees,
    feelsLike: d.feelsLikeTemperature?.degrees,
    humidity: d.relativeHumidity,
    wind: d.wind?.speed?.value,
    gusts: d.wind?.gust?.value || 0,
    windDirection: d.wind?.direction?.degrees,
    uvIndex: d.uvIndex,
    cloudCover: d.cloudCover,
    conditions: normalizeConditionCode(d.weatherCondition?.type),
    conditionsText: d.weatherCondition?.description?.text || d.weatherCondition?.type,
    precipProbability: d.precipitation?.probability?.percent || 0,
    visibility: d.visibility?.distance?.value,
    dewPoint: d.dewPoint?.degrees,
    pressure: d.pressure?.meanSeaLevelMillibars,
    thunderstormProbability: d.thunderstormProbability || 0,
  };
}

async function googleForecast(lat, lon, { hours, days } = {}) {
  const key = process.env.GOOGLE_WEATHER_API_KEY;
  if (!key) throw new Error('GOOGLE_WEATHER_API_KEY not configured');

  let gotData = false;
  const result = { hourly: [], daily: [], alerts: [] };

  // Hourly forecast
  if (hours) {
    const hParams = new URLSearchParams({
      key, 'location.latitude': lat, 'location.longitude': lon,
      languageCode: 'en', unitsSystem: 'IMPERIAL', hours: Math.min(hours, 240),
    });
    const res = await fetch(`${GOOGLE_BASE}/v1/forecast/hours:lookup?${hParams}`);
    if (res.ok) {
      const d = await res.json();
      result.hourly = (d.forecastHours || []).map(h => ({
        time: h.interval?.startTime,
        temp: h.temperature?.degrees,
        feelsLike: h.feelsLikeTemperature?.degrees,
        wind: h.wind?.speed?.value,
        gusts: h.wind?.gust?.value || 0,
        precipProb: h.precipitation?.probability?.percent ?? h.precipitation?.probability ?? 0,
        precipAmount: h.precipitation?.qpf?.quantity ?? h.precipitation?.qpf?.value ?? 0,
        humidity: h.relativeHumidity,
        conditions: normalizeConditionCode(h.weatherCondition?.type),
        conditionsText: h.weatherCondition?.description?.text || h.weatherCondition?.type,
        cloudCover: h.cloudCover,
        uvIndex: h.uvIndex,
        thunderstormProb: h.thunderstormProbability || 0,
      }));
    }
  }

  // Daily forecast
  if (days) {
    const dParams = new URLSearchParams({
      key, 'location.latitude': lat, 'location.longitude': lon,
      languageCode: 'en', unitsSystem: 'IMPERIAL', days: Math.min(days, 10),
    });
    const res = await fetch(`${GOOGLE_BASE}/v1/forecast/days:lookup?${dParams}`);
    if (res.ok) {
      const d = await res.json();
      result.daily = (d.forecastDays || []).map(day => {
        const df = day.daytimeForecast || {};
        const displayDate = day.displayDate;
        const dateStr = displayDate
          ? `${displayDate.year}-${String(displayDate.month).padStart(2,'0')}-${String(displayDate.day).padStart(2,'0')}`
          : day.interval?.startTime?.split('T')[0];
        return {
          date: dateStr,
          high: day.maxTemperature?.degrees,
          low: day.minTemperature?.degrees,
          wind: df.wind?.speed?.value || 0,
          gusts: df.wind?.gust?.value || 0,
          precipProb: df.precipitation?.probability?.percent ?? 0,
          precipAmount: df.precipitation?.qpf?.quantity ?? 0,
          conditions: normalizeConditionCode(df.weatherCondition?.type),
          conditionsText: df.weatherCondition?.description?.text || df.weatherCondition?.type,
          humidity: df.relativeHumidity || 0,
          uvIndex: df.uvIndex || 0,
          thunderstormProb: df.thunderstormProbability || 0,
        };
      });
    }
  }

  // Weather alerts (piggyback on current conditions)
  try {
    const aParams = new URLSearchParams({
      key, 'location.latitude': lat, 'location.longitude': lon,
      languageCode: 'en', unitsSystem: 'IMPERIAL',
    });
    const alertRes = await fetch(`${GOOGLE_BASE}/v1/currentConditions:lookup?${aParams}`);
    if (alertRes.ok) {
      const ad = await alertRes.json();
      result.alerts = (ad.currentWeatherAlerts || []).map(a => ({
        type: a.type,
        severity: a.severity,
        headline: a.headline?.text,
        description: a.description?.text,
        expires: a.expires,
      }));
    }
  } catch { /* alerts are best-effort */ }

  // If no hourly or daily data returned, treat as failure so fallback kicks in
  if (!result.hourly.length && !result.daily.length) {
    throw new Error('Google Weather returned no forecast data');
  }

  return result;
}

// ─── Open-Meteo API (free, no key) ───────────────────────

function normalizeWMOCode(code) {
  // WMO weather interpretation codes → simple categories
  if (code <= 1) return 'sunny';
  if (code <= 3) return 'partly_cloudy';
  if (code <= 48) return 'cloudy'; // fog codes 45-48
  if (code <= 67) return 'rainy';  // drizzle + rain codes
  if (code <= 77) return 'snow';
  if (code <= 82) return 'rainy';  // rain showers
  if (code <= 86) return 'snow';   // snow showers
  if (code >= 95) return 'thunderstorm';
  return 'cloudy';
}

function wmoCodeText(code) {
  const map = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
  };
  return map[code] || 'Unknown';
}

async function openMeteoCurrent(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,cloud_cover,uv_index&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo current: ${res.status}`);
  const d = await res.json();
  const c = d.current;
  if (!c) throw new Error('No current conditions from Open-Meteo');

  return {
    temp: Math.round(c.temperature_2m),
    feelsLike: Math.round(c.apparent_temperature),
    humidity: Math.round(c.relative_humidity_2m || 0),
    wind: Math.round(c.wind_speed_10m || 0),
    gusts: Math.round(c.wind_gusts_10m || 0),
    uvIndex: Math.round(c.uv_index || 0),
    cloudCover: Math.round(c.cloud_cover || 0),
    conditions: normalizeWMOCode(c.weather_code),
    conditionsText: wmoCodeText(c.weather_code),
    precipProbability: 0, // current doesn't include precip prob
    thunderstormProbability: c.weather_code >= 95 ? 80 : 0,
  };
}

async function openMeteoForecast(lat, lon, { hours = 24, days = 10 } = {}) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,cloud_cover,uv_index,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_hours=${Math.min(hours, 240)}&forecast_days=${Math.min(days, 16)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo forecast: ${res.status}`);
  const d = await res.json();

  const hourly = [];
  if (d.hourly?.time) {
    for (let i = 0; i < Math.min(d.hourly.time.length, hours); i++) {
      hourly.push({
        time: d.hourly.time[i],
        temp: Math.round(d.hourly.temperature_2m[i]),
        feelsLike: Math.round(d.hourly.apparent_temperature[i]),
        wind: Math.round(d.hourly.wind_speed_10m[i] || 0),
        gusts: Math.round(d.hourly.wind_gusts_10m[i] || 0),
        precipProb: d.hourly.precipitation_probability[i] || 0,
        precipAmount: d.hourly.precipitation[i] || 0,
        humidity: Math.round(d.hourly.relative_humidity_2m[i] || 0),
        conditions: normalizeWMOCode(d.hourly.weather_code[i]),
        conditionsText: wmoCodeText(d.hourly.weather_code[i]),
        cloudCover: Math.round(d.hourly.cloud_cover[i] || 0),
        uvIndex: Math.round(d.hourly.uv_index[i] || 0),
        thunderstormProb: d.hourly.weather_code[i] >= 95 ? 80 : 0,
      });
    }
  }

  const daily = [];
  if (d.daily?.time) {
    for (let i = 0; i < Math.min(d.daily.time.length, days); i++) {
      daily.push({
        date: d.daily.time[i],
        high: Math.round(d.daily.temperature_2m_max[i]),
        low: Math.round(d.daily.temperature_2m_min[i]),
        wind: Math.round(d.daily.wind_speed_10m_max[i] || 0),
        gusts: Math.round(d.daily.wind_gusts_10m_max[i] || 0),
        precipProb: d.daily.precipitation_probability_max[i] || 0,
        precipAmount: d.daily.precipitation_sum[i] || 0,
        conditions: normalizeWMOCode(d.daily.weather_code[i]),
        conditionsText: wmoCodeText(d.daily.weather_code[i]),
        humidity: 0, // daily doesn't include avg humidity
        uvIndex: Math.round(d.daily.uv_index_max[i] || 0),
        thunderstormProb: d.daily.weather_code[i] >= 95 ? 80 : 0,
      });
    }
  }

  return { hourly, daily, alerts: [] };
}

// ─── Visual Crossing API ──────────────────────────────────

async function visualCrossingHistorical(lat, lon, date) {
  const key = process.env.VISUAL_CROSSING_API_KEY;
  if (!key) throw new Error('VISUAL_CROSSING_API_KEY not configured');

  const location = `${lat},${lon}`;
  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}/${date}?unitGroup=us&include=days&key=${key}&contentType=json`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Visual Crossing: ${res.status} ${await res.text()}`);
  const d = await res.json();
  const day = d.days?.[0];
  if (!day) throw new Error('No data returned for date');

  return {
    date: day.datetime,
    high: Math.round(day.tempmax),
    low: Math.round(day.tempmin),
    feelsLikeHigh: Math.round(day.feelslikemax || day.tempmax),
    wind: Math.round(day.windspeed || 0),
    gusts: Math.round(day.windgust || 0),
    precipTotal: day.precip || 0,
    precipType: day.preciptype?.join(', ') || null,
    conditions: normalizeVCCondition(day.icon),
    conditionsText: day.conditions,
    cloudCover: Math.round(day.cloudcover || 0),
    humidity: Math.round(day.humidity || 0),
    uvIndex: Math.round(day.uvindex || 0),
    source: 'visual_crossing',
  };
}

async function visualCrossingCurrent(lat, lon) {
  const key = process.env.VISUAL_CROSSING_API_KEY;
  if (!key) throw new Error('VISUAL_CROSSING_API_KEY not configured');

  const location = `${lat},${lon}`;
  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}/today?unitGroup=us&include=current&key=${key}&contentType=json`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Visual Crossing current: ${res.status}`);
  const d = await res.json();
  const c = d.currentConditions;
  if (!c) throw new Error('No current conditions returned');

  return {
    temp: Math.round(c.temp),
    feelsLike: Math.round(c.feelslike || c.temp),
    humidity: Math.round(c.humidity || 0),
    wind: Math.round(c.windspeed || 0),
    gusts: Math.round(c.windgust || 0),
    uvIndex: Math.round(c.uvindex || 0),
    cloudCover: Math.round(c.cloudcover || 0),
    conditions: normalizeVCCondition(c.icon),
    conditionsText: c.conditions,
    precipProbability: Math.round(c.precipprob || 0),
    thunderstormProbability: 0,
  };
}

// ─── Public Interface ─────────────────────────────────────

/**
 * Get current weather conditions for a club.
 * Falls back: Google → Open-Meteo → Visual Crossing → cached
 */
export async function getCurrentConditions(clubId) {
  const { lat, lon } = await getClubCoordinates(clubId);

  // Try Google first
  try {
    const data = await googleCurrentConditions(lat, lon);
    return { ...data, source: 'google', stale: false };
  } catch (e) {
    console.warn('Google Weather current failed:', e.message);
  }

  // Fallback to Open-Meteo (free, no key)
  try {
    const data = await openMeteoCurrent(lat, lon);
    return { ...data, source: 'open_meteo', stale: false };
  } catch (e) {
    console.warn('Open-Meteo current failed:', e.message);
  }

  // Fallback to Visual Crossing
  try {
    const data = await visualCrossingCurrent(lat, lon);
    return { ...data, source: 'visual_crossing', stale: false };
  } catch (e) {
    console.warn('Visual Crossing current failed, using cache:', e.message);
  }

  // Last resort: cached forecast data
  const cached = await getCachedForecastStale(clubId);
  if (cached?.data?.current) {
    return { ...cached.data.current, source: 'cache', stale: true };
  }

  throw new Error('All weather sources unavailable');
}

/**
 * Get forecast for a club (hourly and/or daily).
 * @param {string} clubId
 * @param {{ hours?: number, days?: number }} opts
 */
export async function getForecast(clubId, { hours = 24, days = 10 } = {}) {
  // Check cache first
  const cached = await getCachedForecast(clubId);
  if (cached) return { ...cached.data, source: 'cache', stale: false };

  const { lat, lon } = await getClubCoordinates(clubId);

  // Try Google first
  let googleData = null;
  try {
    googleData = await googleForecast(lat, lon, { hours, days });
    const current = await googleCurrentConditions(lat, lon).catch(() => null);

    // Google may return fewer days than requested — supplement with Open-Meteo
    if (googleData.daily.length < days) {
      try {
        const supplement = await openMeteoForecast(lat, lon, { hours: 0, days });
        const googleDates = new Set(googleData.daily.map(d => d.date));
        const extraDays = supplement.daily.filter(d => !googleDates.has(d.date));
        googleData.daily = [...googleData.daily, ...extraDays].slice(0, days);
      } catch { /* supplement is best-effort */ }
    }

    const result = { current, ...googleData, source: 'google', stale: false };
    await cacheForecast(clubId, result);
    return result;
  } catch (e) {
    console.warn('Google Weather forecast failed:', e.message);
  }

  // Fallback to Open-Meteo (free, no key)
  try {
    const data = await openMeteoForecast(lat, lon, { hours, days });
    const current = await openMeteoCurrent(lat, lon).catch(() => null);
    const result = { current, ...data, source: 'open_meteo', stale: false };
    await cacheForecast(clubId, result);
    return result;
  } catch (e) {
    console.warn('Open-Meteo forecast failed:', e.message);
  }

  // Fallback: stale cache
  const stale = await getCachedForecastStale(clubId);
  if (stale) return { ...stale.data, source: 'cache', stale: true };

  throw new Error('Forecast unavailable');
}

/**
 * Get historical weather for a specific date.
 * Checks weather_daily_log first, then calls Visual Crossing.
 */
export async function getHistoricalDay(clubId, date) {
  // Check our own archive first
  try {
    const { rows } = await sql`
      SELECT * FROM weather_daily_log
      WHERE club_id = ${clubId} AND date = ${date}::date
    `;
    if (rows.length) {
      const r = rows[0];
      return {
        date: r.date,
        high: r.high_temp,
        low: r.low_temp,
        feelsLikeHigh: r.feels_like_high,
        wind: r.wind_max_mph,
        gusts: r.wind_gust_max_mph,
        precipTotal: r.precip_total_in,
        precipType: r.precip_type,
        conditions: r.conditions_code,
        conditionsText: r.conditions_text,
        cloudCover: r.cloud_cover_pct,
        humidity: r.humidity_avg,
        source: 'archive',
      };
    }
  } catch { /* fall through to API */ }

  // Call Visual Crossing
  const { lat, lon } = await getClubCoordinates(clubId);
  const data = await visualCrossingHistorical(lat, lon, date);

  // Store in archive for future lookups
  try {
    await sql`
      INSERT INTO weather_daily_log (club_id, date, high_temp, low_temp, feels_like_high,
        wind_max_mph, wind_gust_max_mph, precip_total_in, precip_type,
        conditions_code, conditions_text, cloud_cover_pct, humidity_avg, uv_index_max, source)
      VALUES (${clubId}, ${date}::date, ${data.high}, ${data.low}, ${data.feelsLikeHigh},
        ${data.wind}, ${data.gusts}, ${data.precipTotal}, ${data.precipType},
        ${data.conditions}, ${data.conditionsText}, ${data.cloudCover}, ${data.humidity},
        ${data.uvIndex}, 'visual_crossing')
      ON CONFLICT (club_id, date) DO NOTHING
    `;
  } catch (e) {
    console.warn('Failed to archive historical weather:', e.message);
  }

  return data;
}

/**
 * Determine if weather conditions on a given day should be flagged as impactful.
 * Returns { impacted: boolean, reason: string|null }
 */
export function assessWeatherImpact(weather) {
  const reasons = [];
  if (weather.gusts > 20 || weather.wind > 20) reasons.push(`High winds (${weather.gusts || weather.wind} mph)`);
  if (weather.precipTotal > 0) reasons.push(`Precipitation (${weather.precipTotal} in)`);
  if (weather.high < 40) reasons.push(`Cold conditions (${weather.high}°F)`);
  if (weather.high > 100) reasons.push(`Extreme heat (${weather.high}°F)`);

  return {
    impacted: reasons.length > 0,
    reason: reasons.length ? reasons.join('; ') : null,
  };
}

/**
 * Generate a human-readable weather advisory from hourly forecast data.
 */
export function generateAdvisory(hourlyForecast, alerts = []) {
  if (!hourlyForecast?.length) return null;

  const advisories = [];

  // Check for severe weather alerts first
  for (const alert of alerts) {
    advisories.push(alert.headline || `${alert.type} — ${alert.severity}`);
  }

  // Scan next 12 hours for concerning conditions
  const next12 = hourlyForecast.slice(0, 12);

  const windHours = next12.filter(h => (h.gusts || 0) > 15);
  if (windHours.length) {
    const maxGusts = Math.max(...windHours.map(h => h.gusts || 0));
    const peakHour = windHours.find(h => h.gusts === maxGusts);
    const timeStr = peakHour?.time ? new Date(peakHour.time).toLocaleTimeString('en-US', { hour: 'numeric' }) : '';
    advisories.push(`Wind advisory — ${maxGusts} mph gusts expected${timeStr ? ` by ${timeStr}` : ''}`);
  }

  const rainHours = next12.filter(h => (h.precipProb || 0) > 40);
  if (rainHours.length && !windHours.length) {
    const maxProb = Math.max(...rainHours.map(h => h.precipProb));
    advisories.push(`${maxProb}% chance of rain in the next ${rainHours.length} hours`);
  }

  const coldHours = next12.filter(h => (h.temp || 72) < 40);
  if (coldHours.length) {
    const minTemp = Math.min(...coldHours.map(h => h.temp));
    advisories.push(`Cold conditions — temps dropping to ${minTemp}°F`);
  }

  const thunderHours = next12.filter(h => (h.thunderstormProb || 0) > 30);
  if (thunderHours.length) {
    advisories.push('Thunderstorm risk — monitor conditions for potential course closure');
  }

  if (advisories.length) return advisories.join('. ');

  // No alerts — generate neutral summary from first hour
  const now = next12[0];
  return `${Math.round(now.temp || 72)}°F, ${now.conditionsText || 'fair'} — good conditions for play`;
}

/**
 * Write a day's actual conditions to the archive.
 */
export async function archiveDailyWeather(clubId, date, weather) {
  await sql`
    INSERT INTO weather_daily_log (club_id, date, high_temp, low_temp, feels_like_high,
      wind_max_mph, wind_gust_max_mph, precip_total_in, precip_type,
      conditions_code, conditions_text, cloud_cover_pct, humidity_avg,
      uv_index_max, thunderstorm_prob, source)
    VALUES (${clubId}, ${date}::date, ${weather.high}, ${weather.low}, ${weather.feelsLikeHigh || weather.high},
      ${weather.wind}, ${weather.gusts}, ${weather.precipTotal || 0}, ${weather.precipType || null},
      ${weather.conditions}, ${weather.conditionsText}, ${weather.cloudCover || 0}, ${weather.humidity || 0},
      ${weather.uvIndex || 0}, ${weather.thunderstormProb || 0}, ${weather.source || 'google'})
    ON CONFLICT (club_id, date) DO UPDATE SET
      high_temp = EXCLUDED.high_temp, low_temp = EXCLUDED.low_temp,
      feels_like_high = EXCLUDED.feels_like_high,
      wind_max_mph = EXCLUDED.wind_max_mph, wind_gust_max_mph = EXCLUDED.wind_gust_max_mph,
      precip_total_in = EXCLUDED.precip_total_in, precip_type = EXCLUDED.precip_type,
      conditions_code = EXCLUDED.conditions_code, conditions_text = EXCLUDED.conditions_text,
      cloud_cover_pct = EXCLUDED.cloud_cover_pct, humidity_avg = EXCLUDED.humidity_avg,
      uv_index_max = EXCLUDED.uv_index_max, thunderstorm_prob = EXCLUDED.thunderstorm_prob,
      source = EXCLUDED.source
  `;
}
