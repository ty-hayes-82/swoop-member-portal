/**
 * POST /api/demo/reseed
 *
 * One-click full database reseed: runs all 6 phases of seed-from-csv sequentially.
 * Each phase calls the seed endpoint internally via HTTP to stay under Vercel's 60s timeout.
 *
 * Total time: ~10-15 seconds for ~36K rows.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const baseUrl = req.headers['x-forwarded-proto'] && req.headers['x-forwarded-host']
    ? `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host']}`
    : `https://${req.headers.host}`;

  const phases = ['1', '2', '3', '4', '5', '6'];
  const results = {};
  const errors = [];
  const startTime = Date.now();

  for (const phase of phases) {
    try {
      const resp = await fetch(`${baseUrl}/api/demo/seed-from-csv?phase=${phase}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await resp.json();
      results[`phase_${phase}`] = {
        success: data.success,
        rows: data.total_rows,
        elapsed: data.elapsed_seconds,
        tables: data.tables,
        errors: data.errors,
      };
      if (!data.success) {
        errors.push(`Phase ${phase}: ${data.error || 'unknown error'}`);
      }
    } catch (e) {
      results[`phase_${phase}`] = { success: false, error: e.message };
      errors.push(`Phase ${phase}: ${e.message}`);
    }
  }

  const totalRows = Object.values(results).reduce((sum, r) => sum + (r.rows || 0), 0);
  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  return res.status(200).json({
    success: errors.length === 0,
    total_rows: totalRows,
    total_elapsed_seconds: Number(totalElapsed),
    phases: results,
    errors: errors.length ? errors : undefined,
  });
}
