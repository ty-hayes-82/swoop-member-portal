import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    const benchmarks = await sql`SELECT * FROM industry_benchmarks ORDER BY metric_key`;

    res.status(200).json({
      benchmarks: benchmarks.rows.map(b => ({
        key: b.metric_key,
        clubValue: Number(b.club_value),
        industryValue: Number(b.industry_value),
        unit: b.unit,
        label: b.label,
        comparisonText: b.comparison_text,
        direction: b.direction,
      })),
    });
  } catch (err) {
    console.error('/api/benchmarks error:', err);
    res.status(500).json({ error: err.message });
  }
}
