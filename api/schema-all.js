import { sql } from "@vercel/postgres";
export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG) return res.status(403).json({ error: 'Disabled in production' });
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
