import { sql } from '@vercel/postgres';
import { cors } from './lib/cors.js';
import { logWarn } from './lib/logger.js';

const ALLOW_DEBUG = process.env.ALLOW_DEBUG === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (IS_PROD && !ALLOW_DEBUG) {
    logWarn('/api/check-email', 'operator endpoint blocked in production', { ip: req.headers['x-forwarded-for'] });
    return res.status(404).json({ error: 'Not found' });
  }
  const results = {};
  try {
    const types = await sql`SELECT event_type, COUNT(*) AS n FROM email_events GROUP BY event_type ORDER BY n DESC`;
    results.event_types = types.rows;
  } catch(e) { results.event_types = e.message.slice(0,100); }
  try {
    const sample = await sql`SELECT * FROM email_events LIMIT 3`;
    results.sample_events = sample.rows;
  } catch(e) { results.sample_events = e.message.slice(0,100); }
  try {
    const camps = await sql`SELECT campaign_id, subject, type FROM email_campaigns LIMIT 3`;
    results.sample_campaigns = camps.rows;
  } catch(e) { results.sample_campaigns = e.message.slice(0,100); }
  try {
    const j = await sql`SELECT COUNT(*) AS n FROM email_events ee JOIN email_campaigns ec ON ec.campaign_id = ee.campaign_id`;
    results.join_count = parseInt(j.rows[0].n);
  } catch(e) { results.join_count = e.message.slice(0,100); }
  res.status(200).json(results);
}
