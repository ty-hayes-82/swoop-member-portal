// Fix: Randomize email_open_rate for ALL members in member_engagement_weekly
// so decay detection produces diverse, realistic curves.
// Run once via: /api/fix-decay-curves

import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    const maxWeekResult = await sql`SELECT MAX(week_number) AS mw FROM member_engagement_weekly`;
    const maxWeek = Number(maxWeekResult.rows[0]?.mw ?? 12);

    // Get all distinct members
    const membersResult = await sql`
      SELECT DISTINCT mew.member_id, m.archetype
      FROM member_engagement_weekly mew
      JOIN members m ON m.member_id = mew.member_id
      WHERE m.membership_status = 'active'
    `;

    // Archetype baseline open rates (realistic ranges)
    const archetypeBaselines = {
      'Social Butterfly': { base: 0.68, variance: 0.12 },
      'Balanced Active':  { base: 0.52, variance: 0.10 },
      'Die-Hard Golfer':  { base: 0.38, variance: 0.08 },
      'Weekend Warrior':  { base: 0.34, variance: 0.10 },
      'New Member':       { base: 0.58, variance: 0.15 },
      'Snowbird':         { base: 0.44, variance: 0.12 },
      'Declining':        { base: 0.24, variance: 0.08 },
      'Ghost':            { base: 0.12, variance: 0.06 },
    };

    // Simple seeded random based on member_id string
    function seededRandom(seed, i) {
      let h = 0;
      const s = seed + String(i);
      for (let c = 0; c < s.length; c++) {
        h = ((h << 5) - h + s.charCodeAt(c)) | 0;
      }
      return (Math.abs(h) % 1000) / 1000;
    }

    let updated = 0;
    const members = membersResult.rows;

    // Pick ~15 members to have a clear decay pattern (these become the "decaying" members)
    const decayCount = Math.min(15, Math.floor(members.length * 0.05));
    const decayIndices = new Set();
    for (let i = 0; i < decayCount; i++) {
      decayIndices.add(Math.floor(seededRandom('decay', i) * members.length));
    }

    for (let mi = 0; mi < members.length; mi++) {
      const member = members[mi];
      const archConfig = archetypeBaselines[member.archetype] ?? { base: 0.40, variance: 0.10 };
      const isDecaying = decayIndices.has(mi);

      // Generate a unique per-member offset
      const memberOffset = (seededRandom(member.member_id, 0) - 0.5) * archConfig.variance * 2;

      for (let week = 1; week <= maxWeek; week++) {
        let rate;

        if (isDecaying) {
          // Decaying members: start at archetype baseline, decline steadily
          const decayProgress = week / maxWeek;
          const startRate = archConfig.base + memberOffset;
          // Each decaying member has a unique decay speed
          const decaySpeed = 0.6 + seededRandom(member.member_id, 99) * 0.35;
          rate = startRate * Math.pow(1 - decaySpeed, decayProgress * 3);
          // Add small noise
          rate += (seededRandom(member.member_id, week) - 0.5) * 0.04;
        } else {
          // Stable members: fluctuate around their archetype baseline
          const weekNoise = (seededRandom(member.member_id, week) - 0.5) * archConfig.variance;
          rate = archConfig.base + memberOffset + weekNoise;
        }

        // Clamp to 0.01 - 0.95
        rate = Math.max(0.01, Math.min(0.95, rate));
        rate = Math.round(rate * 100) / 100;

        await sql`
          UPDATE member_engagement_weekly
          SET email_open_rate = ${rate}
          WHERE member_id = ${member.member_id}
            AND week_number = ${week}
        `;
        updated++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Updated ${updated} rows across ${members.length} members (${decayCount} decaying)`,
      maxWeek,
      totalMembers: members.length,
      decayingCount: decayCount,
    });
  } catch (err) {
    console.error('/api/fix-decay-curves error:', err);
    res.status(500).json({ error: err.message });
  }
}
