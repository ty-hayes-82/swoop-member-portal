/**
 * Weather API endpoint
 *
 * GET  /api/weather?clubId=xxx&type=current         → live current conditions
 * GET  /api/weather?clubId=xxx&type=forecast         → hourly + daily forecast
 * GET  /api/weather?clubId=xxx&type=historical&date= → historical day lookup
 * POST /api/weather?action=tag-complaint             → tag a complaint with weather
 * POST /api/weather?action=batch-tag                 → batch-tag untagged complaints
 */
import {
  getCurrentConditions,
  getForecast,
  getHistoricalDay,
  assessWeatherImpact,
} from './services/weather.js';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { clubId } = req.query;
  if (!clubId) return res.status(400).json({ error: 'clubId required' });

  // ─── GET: Weather data lookups ──────────────────────────
  if (req.method === 'GET') {
    const { type, date, hours, days } = req.query;
    if (!type) return res.status(400).json({ error: 'type required (current|forecast|historical)' });

    try {
      switch (type) {
        case 'current': {
          const data = await getCurrentConditions(clubId);
          return res.json(data);
        }
        case 'forecast': {
          const data = await getForecast(clubId, {
            hours: hours ? parseInt(hours) : 24,
            days: days ? parseInt(days) : 10,
          });
          return res.json(data);
        }
        case 'historical': {
          if (!date) return res.status(400).json({ error: 'date required for historical lookup' });
          const data = await getHistoricalDay(clubId, date);
          const impact = assessWeatherImpact(data);
          return res.json({ ...data, ...impact });
        }
        default:
          return res.status(400).json({ error: `Unknown type: ${type}` });
      }
    } catch (e) {
      console.error('Weather API error:', e);
      return res.status(500).json({ error: e.message });
    }
  }

  // ─── POST: Weather tagging actions ──────────────────────
  if (req.method === 'POST') {
    const { action } = req.query;

    if (action === 'tag-complaint') {
      const { complaintId, complaintType = 'feedback', date } = req.body;
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

        return res.json({ status: 'tagged', impacted, reason, weather });
      } catch (e) {
        console.error('Tag complaint error:', e);
        return res.status(500).json({ error: e.message });
      }
    }

    if (action === 'batch-tag') {
      // Tag all untagged feedback complaints with weather context
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
            const weather = await getHistoricalDay(row.club_id, date);
            const { impacted, reason } = assessWeatherImpact(weather);

            await sql`
              INSERT INTO complaint_weather_context
                (complaint_id, complaint_type, date, club_id, conditions_text,
                 high_temp, wind_mph, wind_gust_mph, precip_in,
                 is_weather_impacted, impact_reason, source)
              VALUES
                (${row.feedback_id}, 'feedback', ${date}::date, ${row.club_id},
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

        return res.json({ tagged: results.length, results });
      } catch (e) {
        console.error('Batch tag error:', e);
        return res.status(500).json({ error: e.message });
      }
    }

    return res.status(400).json({ error: 'Unknown action. Use tag-complaint or batch-tag' });
  }

  return res.status(405).json({ error: 'GET or POST only' });
}
