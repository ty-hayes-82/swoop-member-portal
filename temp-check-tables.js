import { sql } from "@vercel/postgres";

async function check() {
  const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
  const results = [];
  for (const row of tables.rows) {
    const t = row.tablename;
    try {
      const res = await sql.query(`SELECT COUNT(*) as c FROM "${t}"`);
      results.push({ table: t, rows: parseInt(res.rows[0].c) });
    } catch(e) {
      results.push({ table: t, rows: -1, error: e.message });
    }
  }
  results.sort((a, b) => a.rows - b.rows);
  for (const r of results) {
    const status = r.rows === 0 ? "EMPTY" : r.rows === -1 ? "ERROR" : r.rows.toString();
    console.log(`${r.table.padEnd(35)} ${status}`);
  }
  console.log(`\nTotal tables: ${results.length}`);
  console.log(`Empty: ${results.filter(r => r.rows === 0).length}`);
  console.log(`With data: ${results.filter(r => r.rows > 0).length}`);
  process.exit(0);
}
check();
