import { sql } from "@vercel/postgres";
import { cors } from './lib/cors.js';
import { logWarn } from './lib/logger.js';

const ALLOW_DEBUG = process.env.ALLOW_DEBUG === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (IS_PROD && !ALLOW_DEBUG) {
    logWarn('/api/schema-all', 'operator endpoint blocked in production', { ip: req.headers['x-forwarded-for'] });
    return res.status(404).json({ error: 'Not found' });
  }
  try {
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
    const result = {};
    for (const t of tables.rows) {
      const cols = await sql.query(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name='${t.table_name}' ORDER BY ordinal_position`);
      result[t.table_name] = cols.rows;
    }
    res.status(200).json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
}
