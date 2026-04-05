import { sql } from '@vercel/postgres';
export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG) return res.status(403).json({ error: 'Disabled in production' });
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
