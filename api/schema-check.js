import { sql } from '@vercel/postgres';
import { cors } from './lib/cors.js';
import { logWarn } from './lib/logger.js';

const ALLOW_DEBUG = process.env.ALLOW_DEBUG === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (IS_PROD && !ALLOW_DEBUG) {
    logWarn('/api/schema-check', 'operator endpoint blocked in production', { ip: req.headers['x-forwarded-for'] });
    return res.status(404).json({ error: 'Not found' });
  }
  const tables = ['members','member_engagement_weekly','feedback','email_events','email_campaigns','visit_sessions','event_registrations','event_definitions','pos_checks','bookings','close_outs','pace_of_play','pace_hole_segments','weather_daily','waitlist_entries'];
  const result = {};
  for (const t of tables) {
    try {
      const cols = await sql.query(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = '${t}' ORDER BY ordinal_position`);
      result[t] = cols.rows;
    } catch(e) {
      result[t] = { error: e.message };
    }
  }
  res.status(200).json(result);
}
