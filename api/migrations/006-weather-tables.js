/**
 * Migration 006: Weather integration tables
 * - Add lat/lon coordinates to club table
 * - Create weather_daily_log (richer historical archive)
 * - Create weather_hourly_cache (short-lived forecast cache)
 * - Create complaint_weather_context (weather tagging per complaint)
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const results = [];
  const run = async (label, query) => {
    try { await query; results.push({ step: label, status: 'ok' }); }
    catch (e) { results.push({ step: label, status: 'error', message: e.message }); }
  };

  // 1. Add coordinates to club table
  await run('add_club_latitude', sql`
    ALTER TABLE club ADD COLUMN IF NOT EXISTS latitude REAL
  `);
  await run('add_club_longitude', sql`
    ALTER TABLE club ADD COLUMN IF NOT EXISTS longitude REAL
  `);

  // Backfill Oakmont Hills CC (Stone Mountain, GA area)
  await run('backfill_club_001_coords', sql`
    UPDATE club SET latitude = 33.8101, longitude = -84.1734
    WHERE club_id = 'club_001' AND latitude IS NULL
  `);

  // 2. Historical daily weather log (one row per club per day)
  await run('create_weather_daily_log', sql`
    CREATE TABLE IF NOT EXISTS weather_daily_log (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      club_id TEXT NOT NULL,
      date DATE NOT NULL,
      high_temp INTEGER,
      low_temp INTEGER,
      feels_like_high INTEGER,
      wind_max_mph INTEGER,
      wind_gust_max_mph INTEGER,
      precip_total_in REAL DEFAULT 0,
      precip_type TEXT,
      conditions_code TEXT,
      conditions_text TEXT,
      cloud_cover_pct INTEGER,
      humidity_avg INTEGER,
      uv_index_max INTEGER,
      thunderstorm_prob INTEGER,
      source TEXT DEFAULT 'google',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(club_id, date)
    )
  `);

  // 3. Short-lived hourly forecast cache (one row per club, overwritten on refresh)
  await run('create_weather_hourly_cache', sql`
    CREATE TABLE IF NOT EXISTS weather_hourly_cache (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      club_id TEXT NOT NULL UNIQUE,
      fetched_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      forecast_json JSONB NOT NULL
    )
  `);

  // 4. Weather context per complaint (joins feedback/service_requests to weather)
  await run('create_complaint_weather_context', sql`
    CREATE TABLE IF NOT EXISTS complaint_weather_context (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      complaint_id TEXT NOT NULL UNIQUE,
      complaint_type TEXT NOT NULL DEFAULT 'feedback',
      date DATE NOT NULL,
      club_id TEXT NOT NULL,
      conditions_text TEXT,
      high_temp INTEGER,
      wind_mph INTEGER,
      wind_gust_mph INTEGER,
      precip_in REAL DEFAULT 0,
      is_weather_impacted BOOLEAN DEFAULT FALSE,
      impact_reason TEXT,
      source TEXT DEFAULT 'visual_crossing',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // 5. Indexes for common queries
  await run('idx_weather_daily_log_club_date', sql`
    CREATE INDEX IF NOT EXISTS idx_weather_daily_log_club_date
    ON weather_daily_log(club_id, date)
  `);
  await run('idx_complaint_weather_complaint_id', sql`
    CREATE INDEX IF NOT EXISTS idx_complaint_weather_complaint_id
    ON complaint_weather_context(complaint_id)
  `);
  await run('idx_complaint_weather_club_date', sql`
    CREATE INDEX IF NOT EXISTS idx_complaint_weather_club_date
    ON complaint_weather_context(club_id, date)
  `);

  res.status(200).json({ migration: '006-weather-tables', results });
}
