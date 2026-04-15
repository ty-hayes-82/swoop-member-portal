/**
 * Daily Weather Cron Job
 * Schedule: 11 PM ET daily (0 23 * * *)
 *
 * For each club with coordinates:
 * 1. Fetches today's actual weather from Google Weather API
 * 2. Archives it to weather_daily_log
 * 3. Refreshes tomorrow's forecast in weather_hourly_cache
 * 4. Auto-creates operational_interventions for severe weather events
 */
import { sql } from '@vercel/postgres';
import {
  getCurrentConditions,
  getForecast,
  archiveDailyWeather,
  assessWeatherImpact,
} from '../services/weather.js';
import { logWarn, logInfo } from '../lib/logger.js';

export default async function handler(req, res) {
  // Vercel cron sends `Authorization: Bearer <CRON_SECRET>` automatically
  // when the scheduled tick fires. Reject every other invocation. This is
  // fail-closed: if CRON_SECRET isn't provisioned in the Vercel project env,
  // the cron does not run.
  const auth = req.headers['authorization'] || '';
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    logWarn('/api/cron/weather-daily', 'unauthorized cron invocation', {
      ip: req.headers['x-forwarded-for'],
      hasAuthHeader: !!req.headers['authorization'],
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }
  logInfo('/api/cron/weather-daily', 'cron tick start');

  // Accept GET (Vercel cron) or POST (manual trigger)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'GET or POST only' });
  }

  const results = [];

  try {
    // Get all clubs with coordinates
    const { rows: clubs } = await sql`
      SELECT club_id, name, latitude, longitude
      FROM club
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `;

    if (!clubs.length) {
      return res.json({ message: 'No clubs with coordinates configured', results });
    }

    const today = new Date().toISOString().split('T')[0];

    for (const club of clubs) {
      const clubResult = { clubId: club.club_id, name: club.name, steps: [] };

      // Step 1: Refresh 5-day forecast cache first so the cache is always
      // populated with 5 days. Doing this before the archive step lets the
      // archive step reuse the cached result instead of making a separate
      // 1-day call that would overwrite the cache with fewer days.
      let refreshedForecast = null;
      try {
        refreshedForecast = await getForecast(club.club_id, { hours: 24, days: 5 });
        clubResult.steps.push({ step: 'refresh_forecast', status: 'ok' });
      } catch (e) {
        clubResult.steps.push({ step: 'refresh_forecast', status: 'error', message: e.message });
      }

      // Step 2: Archive today's actual conditions
      try {
        const current = await getCurrentConditions(club.club_id);

        // Get today's high/low from the already-fetched 5-day forecast
        let dailyData = {};
        try {
          const todayForecast = refreshedForecast?.daily?.[0] || {};
          dailyData = {
            high: todayForecast.high || Math.round(current.temp),
            low: todayForecast.low || Math.round(current.temp),
            precipTotal: todayForecast.precipAmount || 0,
            precipType: null,
            uvIndex: todayForecast.uvIndex || current.uvIndex || 0,
            thunderstormProb: todayForecast.thunderstormProb || 0,
          };
        } catch { /* use current data as fallback */ }

        const archiveData = {
          high: dailyData.high || Math.round(current.temp),
          low: dailyData.low || Math.round(current.temp),
          feelsLikeHigh: Math.round(current.feelsLike || current.temp),
          wind: current.wind || 0,
          gusts: current.gusts || 0,
          precipTotal: dailyData.precipTotal || 0,
          precipType: dailyData.precipType,
          conditions: current.conditions,
          conditionsText: current.conditionsText,
          cloudCover: current.cloudCover || 0,
          humidity: current.humidity || 0,
          uvIndex: dailyData.uvIndex || 0,
          thunderstormProb: dailyData.thunderstormProb || 0,
          source: current.source || 'google',
        };

        await archiveDailyWeather(club.club_id, today, archiveData);
        clubResult.steps.push({ step: 'archive_today', status: 'ok' });

        // Step 3: Check for severe weather → create operational intervention
        const { impacted, reason } = assessWeatherImpact(archiveData);
        if (impacted && (archiveData.gusts > 25 || archiveData.precipTotal > 0.5)) {
          try {
            // Check if we already created an intervention for today
            const { rows: existing } = await sql`
              SELECT id FROM operational_interventions
              WHERE event_date = ${today}::date
              AND event LIKE 'Weather:%'
            `;
            if (!existing.length) {
              const eventLabel = archiveData.gusts > 25
                ? `Weather: Wind Advisory (${archiveData.gusts} mph gusts)`
                : `Weather: ${archiveData.conditionsText || archiveData.conditions}`;

              await sql`
                INSERT INTO operational_interventions (event, event_date, detection, action, outcome, revenue_protected)
                VALUES (
                  ${eventLabel},
                  ${today}::date,
                  ${'Automated detection via Weather API: ' + reason},
                  'Auto-notification sent to operations team',
                  '',
                  0
                )
              `;
              clubResult.steps.push({ step: 'create_intervention', status: 'ok', reason });
            }
          } catch (e) {
            clubResult.steps.push({ step: 'create_intervention', status: 'error', message: e.message });
          }
        }
      } catch (e) {
        clubResult.steps.push({ step: 'archive_today', status: 'error', message: e.message });
      }

      results.push(clubResult);
    }

    return res.json({ date: today, clubsProcessed: clubs.length, results });
  } catch (e) {
    console.error('Weather cron error:', e);
    return res.status(500).json({ error: e.message });
  }
}
