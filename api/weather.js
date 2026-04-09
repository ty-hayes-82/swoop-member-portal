/**
 * Weather API endpoint
 *
 * PUBLIC (no auth):
 *   GET  /api/weather?city=xxx[&state=xx]              → forecast by city (demo mode)
 *   GET  /api/weather?clubId=xxx&type=current          → live current conditions
 *   GET  /api/weather?clubId=xxx&type=forecast         → hourly + daily forecast
 *   GET  /api/weather?clubId=xxx&type=historical&date= → historical day lookup
 *
 * AUTHED (session required, clubId sourced from session — NEVER from request):
 *   POST /api/weather?action=tag-complaint             → tag a complaint with weather
 *   POST /api/weather?action=batch-tag                 → batch-tag untagged complaints
 */
import {
  getCurrentConditions,
  getForecast,
  getForecastByCity,
  getHistoricalDay,
  assessWeatherImpact,
} from './services/weather.js';
import { sql } from '@vercel/postgres';
import { logInfo, logWarn, logError } from './lib/logger.js';

/**
 * Inline session verification for POST write paths.
 * We intentionally do NOT wrap this handler in withAuth(), because that would
 * break the public GET (?city=) lookup used by demo mode. This mirrors the
 * token-validation logic from api/lib/withAuth.js verbatim.
 *
 * Returns: { userId, clubId, role } on success, or null on failure.
 */
async function verifyWriteSession(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  try {
    const result = await sql`
      SELECT s.user_id, s.club_id, s.role, s.expires_at
      FROM sessions s
      WHERE s.token = ${token} AND s.expires_at > NOW()
    `;
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return { userId: row.user_id, clubId: row.club_id, role: row.role };
  } catch (e) {
    logError('/api/weather', e, { phase: 'verifyWriteSession' });
    return null;
  }
}

export default async function handler(req, res) {
  const { clubId: queryClubId, city, state } = req.query; // lint-clubid-allow: public GET weather lookup, POST write path uses verifyWriteSession

  // ─── PUBLIC: City/state-based lookup (demo mode — no clubId needed) ──
  if (req.method === 'GET' && city) {
    try {
      const { days, hours } = req.query;
      const data = await getForecastByCity(city, state, {
        hours: hours ? parseInt(hours) : 24,
        days: days ? parseInt(days) : 5,
      });
      return res.json(data);
    } catch (e) {
      logError('/api/weather', e, { phase: 'getForecastByCity', city });
      return res.status(200).json({
        temp: null, conditions: 'unavailable', conditionsText: 'Weather data unavailable',
        source: 'none', stale: true, error: e.message,
      });
    }
  }

  // ─── PUBLIC: GET weather data lookups (by clubId query param) ────────
  if (req.method === 'GET') {
    if (!queryClubId) return res.status(400).json({ error: 'clubId required' });
    const { type, date, hours, days } = req.query;
    if (!type) return res.status(400).json({ error: 'type required (current|forecast|historical)' });

    try {
      switch (type) {
        case 'current': {
          const data = await getCurrentConditions(queryClubId);
          return res.json(data);
        }
        case 'forecast': {
          const data = await getForecast(queryClubId, {
            hours: hours ? parseInt(hours) : 24,
            days: days ? parseInt(days) : 5,
          });
          return res.json(data);
        }
        case 'historical': {
          if (!date) return res.status(400).json({ error: 'date required for historical lookup' });
          const data = await getHistoricalDay(queryClubId, date);
          const impact = assessWeatherImpact(data);
          return res.json({ ...data, ...impact });
        }
        default:
          return res.status(400).json({ error: `Unknown type: ${type}` });
      }
    } catch (e) {
      logError('/api/weather', e, { phase: 'GET', type });
      // Return graceful fallback instead of 500 when weather sources are unavailable
      if (e.message?.includes('No coordinates found') || e.message?.includes('All weather sources unavailable')) {
        return res.status(200).json({
          temp: null, conditions: 'unavailable', conditionsText: 'Weather data unavailable',
          source: 'none', stale: true, error: e.message,
        });
      }
      return res.status(500).json({ error: e.message });
    }
  }

  // ─── AUTHED: POST weather tagging actions ────────────────────────────
  if (req.method === 'POST') {
    const { action } = req.query;

    // Verify session manually. We can't use withAuth() as a wrapper because
    // the public GET path above must stay open.
    const session = await verifyWriteSession(req);
    if (!session) {
      logWarn('/api/weather', 'unauthorized write attempt', {
        action,
        ip: req.headers['x-forwarded-for'] || null,
      });
      return res.status(401).json({ error: 'Authentication required' });
    }

    // CRITICAL: clubId ALWAYS comes from the verified session, NEVER from
    // req.query.clubId or req.body.clubId. A valid user from club A could
    // otherwise pass clubId=club_B in the payload and write to club B's data.
    const clubId = session.clubId;

    if (action === 'tag-complaint') {
      const { complaintId, complaintType = 'feedback', date } = req.body || {};
      if (!complaintId || !date) {
        return res.status(400).json({ error: 'complaintId and date required' });
      }

      try {
        const { rows: existing } = await sql`
          SELECT id FROM complaint_weather_context WHERE complaint_id = ${complaintId}
        `;
        if (existing.length) {
          return res.json({ status: 'already_tagged', id: existing[0].id });
        }

        const weather = await getHistoricalDay(clubId, date);
        const { impacted, reason } = assessWeatherImpact(weather);

        await sql`
          INSERT INTO complaint_weather_context
            (complaint_id, complaint_type, date, club_id, conditions_text,
             high_temp, wind_mph, wind_gust_mph, precip_in,
             is_weather_impacted, impact_reason, source)
          VALUES
            (${complaintId}, ${complaintType}, ${date}::date, ${clubId},
             ${weather.conditionsText}, ${weather.high}, ${weather.wind}, ${weather.gusts},
             ${weather.precipTotal || 0}, ${impacted}, ${reason},
             ${weather.source || 'visual_crossing'})
        `;

        logInfo('/api/weather', 'tag-complaint applied', {
          clubId, complaintId, impacted, userId: session.userId,
        });
        return res.json({ status: 'tagged', impacted, reason, weather });
      } catch (e) {
        logError('/api/weather', e, { phase: 'tag-complaint', clubId, complaintId });
        return res.status(500).json({ error: e.message });
      }
    }

    if (action === 'batch-tag') {
      // Tag all untagged feedback complaints with weather context, scoped to
      // the authenticated user's club.
      try {
        const { rows: untagged } = await sql`
          SELECT f.feedback_id, f.submitted_at, f.club_id
          FROM feedback f
          LEFT JOIN complaint_weather_context cwc ON cwc.complaint_id = f.feedback_id
          WHERE cwc.id IS NULL AND f.club_id = ${clubId}
          ORDER BY f.submitted_at DESC
          LIMIT 50
        `;

        const results = [];
        for (const row of untagged) {
          const date = row.submitted_at?.split('T')[0] || row.submitted_at;
          try {
            // Row club_id is guaranteed to match session clubId by the SELECT above.
            const weather = await getHistoricalDay(clubId, date);
            const { impacted, reason } = assessWeatherImpact(weather);

            await sql`
              INSERT INTO complaint_weather_context
                (complaint_id, complaint_type, date, club_id, conditions_text,
                 high_temp, wind_mph, wind_gust_mph, precip_in,
                 is_weather_impacted, impact_reason, source)
              VALUES
                (${row.feedback_id}, 'feedback', ${date}::date, ${clubId},
                 ${weather.conditionsText}, ${weather.high}, ${weather.wind}, ${weather.gusts},
                 ${weather.precipTotal || 0}, ${impacted}, ${reason},
                 ${weather.source || 'visual_crossing'})
              ON CONFLICT (complaint_id) DO NOTHING
            `;
            results.push({ id: row.feedback_id, impacted, reason });
          } catch (e) {
            results.push({ id: row.feedback_id, error: e.message });
          }
        }

        logInfo('/api/weather', 'batch-tag applied', {
          clubId, tagged: results.length, userId: session.userId,
        });
        return res.json({ tagged: results.length, results });
      } catch (e) {
        logError('/api/weather', e, { phase: 'batch-tag', clubId });
        return res.status(500).json({ error: e.message });
      }
    }

    return res.status(400).json({ error: 'Unknown action. Use tag-complaint or batch-tag' });
  }

  return res.status(405).json({ error: 'GET or POST only' });
}
