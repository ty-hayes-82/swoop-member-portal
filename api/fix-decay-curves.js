// One-shot fix: Update member_engagement_weekly for 8 decaying members
// to create unique, archetype-appropriate email decay curves.
// Run once via: /api/fix-decay-curves

import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    // Get the max week number
    const maxWeekResult = await sql`SELECT MAX(week_number) AS mw FROM member_engagement_weekly`;
    const maxWeek = Number(maxWeekResult.rows[0]?.mw ?? 5);

    // Define realistic decay curves per member
    // Each member gets unique open rates for the last 5 weeks
    const decayProfiles = [
      // Declining archetype — starts low, drops to near-zero
      { memberId: 'mbr_063', openRates: [0.32, 0.24, 0.14, 0.06, 0.02] },
      // Social Butterfly — starts high, sharp drop
      { memberId: 'mbr_131', openRates: [0.78, 0.61, 0.43, 0.22, 0.08] },
      // Social Butterfly — moderate start, steady decline
      { memberId: 'mbr_154', openRates: [0.65, 0.52, 0.38, 0.19, 0.05] },
      // Weekend Warrior — starts medium, slow grind down
      { memberId: 'mbr_185', openRates: [0.42, 0.38, 0.29, 0.18, 0.09] },
      // Weekend Warrior — another pattern, plateaus then drops
      { memberId: 'mbr_193', openRates: [0.48, 0.46, 0.44, 0.21, 0.07] },
      // New Member — starts very high (honeymoon), then collapses
      { memberId: 'mbr_228', openRates: [0.82, 0.71, 0.48, 0.25, 0.11] },
      // Snowbird — seasonal pattern, tapers off
      { memberId: 'mbr_249', openRates: [0.55, 0.44, 0.31, 0.16, 0.04] },
      // Snowbird — different pattern
      { memberId: 'mbr_255', openRates: [0.51, 0.42, 0.28, 0.14, 0.03] },
    ];

    let updated = 0;

    for (const profile of decayProfiles) {
      for (let i = 0; i < profile.openRates.length; i++) {
        const weekNum = maxWeek - (profile.openRates.length - 1 - i);
        if (weekNum < 1) continue;

        const result = await sql`
          UPDATE member_engagement_weekly
          SET email_open_rate = ${profile.openRates[i]}
          WHERE member_id = ${profile.memberId}
            AND week_number = ${weekNum}
        `;
        updated += result.rowCount;
      }
    }

    res.status(200).json({
      success: true,
      message: `Updated ${updated} rows across ${decayProfiles.length} members`,
      maxWeek,
      profiles: decayProfiles.map(p => ({ memberId: p.memberId, rates: p.openRates })),
    });
  } catch (err) {
    console.error('/api/fix-decay-curves error:', err);
    res.status(500).json({ error: err.message });
  }
}
