// Fix: Ensure decaying members have clear, diverse decay curves
// that the detection SQL (25% drop over 3 weeks) will find.
// Run once via: /api/fix-decay-curves

import { sql } from '@vercel/postgres';
import { cors } from '../../api/lib/cors.js';
import { logWarn } from '../../api/lib/logger.js';

const ALLOW_DEBUG = process.env.ALLOW_DEBUG === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (IS_PROD && !ALLOW_DEBUG) {
    logWarn('/api/fix-decay-curves', 'operator endpoint blocked in production', { ip: req.headers['x-forwarded-for'] });
    return res.status(404).json({ error: 'Not found' });
  }
  try {
    const maxWeekResult = await sql`SELECT MAX(week_number) AS mw FROM member_engagement_weekly`;
    const maxWeek = Number(maxWeekResult.rows[0]?.mw ?? 12);

    // Get all active members with archetypes
    const membersResult = await sql`
      SELECT DISTINCT mew.member_id, m.archetype
      FROM member_engagement_weekly mew
      JOIN members m ON m.member_id = mew.member_id
      WHERE m.membership_status = 'active'
    `;
    const members = membersResult.rows;

    const archetypeBaselines = {
      'Social Butterfly': 0.68, 'Balanced Active': 0.52, 'Die-Hard Golfer': 0.38,
      'Weekend Warrior': 0.34, 'New Member': 0.58, 'Snowbird': 0.44,
      'Declining': 0.24, 'Ghost': 0.12,
    };

    function hash(s, i) {
      let h = 0;
      const str = s + String(i);
      for (let c = 0; c < str.length; c++) h = ((h << 5) - h + str.charCodeAt(c)) | 0;
      return (Math.abs(h) % 10000) / 10000;
    }

    // Pick 8 members for decay — spread across archetypes
    const archetypeGroups = {};
    members.forEach((m, i) => {
      if (!archetypeGroups[m.archetype]) archetypeGroups[m.archetype] = [];
      archetypeGroups[m.archetype].push({ ...m, idx: i });
    });

    const decayMembers = [];
    const targetArchetypes = ['Social Butterfly', 'Balanced Active', 'Die-Hard Golfer', 'Weekend Warrior', 'New Member', 'Snowbird', 'Declining', 'Ghost'];
    for (const arch of targetArchetypes) {
      const group = archetypeGroups[arch];
      if (group && group.length > 0) {
        const pick = group[Math.floor(hash(arch, 42) * group.length)];
        decayMembers.push(pick);
      }
    }

    const decayMemberIds = new Set(decayMembers.map(m => m.member_id));
    let updated = 0;

    // Define unique decay curves per archetype — last 3 weeks MUST drop 25%+
    const decayCurves = {
      'Social Butterfly': [0.76, 0.72, 0.68, 0.65, 0.61, 0.58, 0.54, 0.49, 0.42, 0.31, 0.18, 0.06],
      'Balanced Active':  [0.55, 0.53, 0.50, 0.48, 0.46, 0.43, 0.40, 0.36, 0.30, 0.22, 0.13, 0.04],
      'Die-Hard Golfer':  [0.40, 0.38, 0.37, 0.35, 0.34, 0.32, 0.30, 0.27, 0.22, 0.16, 0.09, 0.03],
      'Weekend Warrior':  [0.38, 0.36, 0.34, 0.33, 0.31, 0.29, 0.27, 0.24, 0.20, 0.14, 0.07, 0.02],
      'New Member':       [0.72, 0.68, 0.63, 0.58, 0.52, 0.46, 0.39, 0.31, 0.22, 0.14, 0.08, 0.03],
      'Snowbird':         [0.48, 0.46, 0.44, 0.42, 0.39, 0.36, 0.32, 0.27, 0.20, 0.13, 0.07, 0.02],
      'Declining':        [0.28, 0.26, 0.24, 0.22, 0.20, 0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0.01],
      'Ghost':            [0.14, 0.13, 0.12, 0.11, 0.10, 0.09, 0.08, 0.06, 0.05, 0.03, 0.02, 0.01],
    };

    // Update ALL members
    for (const member of members) {
      const base = archetypeBaselines[member.archetype] ?? 0.40;
      const isDecaying = decayMemberIds.has(member.member_id);

      for (let week = 1; week <= maxWeek; week++) {
        let rate;

        if (isDecaying) {
          // Use the archetype-specific decay curve
          const curve = decayCurves[member.archetype] ?? decayCurves['Balanced Active'];
          const curveIdx = Math.min(week - 1, curve.length - 1);
          rate = curve[curveIdx];
          // Add tiny per-member noise so even same-archetype decayers differ slightly
          rate += (hash(member.member_id, week) - 0.5) * 0.03;
        } else {
          // Stable: fluctuate naturally around archetype baseline
          const offset = (hash(member.member_id, 0) - 0.5) * 0.15;
          const noise = (hash(member.member_id, week) - 0.5) * 0.08;
          rate = base + offset + noise;
        }

        rate = Math.max(0.01, Math.min(0.95, Math.round(rate * 100) / 100));

        await sql`
          UPDATE member_engagement_weekly
          SET email_open_rate = ${rate}
          WHERE member_id = ${member.member_id} AND week_number = ${week}
        `;
        updated++;
      }
    }

    res.status(200).json({
      success: true,
      updated,
      totalMembers: members.length,
      decayingMembers: decayMembers.map(m => ({ id: m.member_id, archetype: m.archetype })),
    });
  } catch (err) {
    console.error('/api/fix-decay-curves error:', err);
    res.status(500).json({ error: err.message });
  }
}

// CLI entry point — run directly via `ALLOW_DEBUG=true node scripts/operator/<file>`
import { fileURLToPath as __cliFileURLToPath } from 'node:url';
import { readFileSync as __cliReadFileSync, existsSync as __cliExistsSync } from 'node:fs';
import { dirname as __cliDirname, join as __cliJoin, resolve as __cliResolve } from 'node:path';
if (process.argv[1] === __cliFileURLToPath(import.meta.url)) {
  // Load .env.local if POSTGRES_URL not already set
  if (!process.env.POSTGRES_URL && !process.env.POSTGRES_URL_NON_POOLING) {
    const __cliRepoRoot = __cliResolve(__cliDirname(__cliFileURLToPath(import.meta.url)), '..', '..');
    const __cliEnvFile = __cliJoin(__cliRepoRoot, '.env.local');
    if (__cliExistsSync(__cliEnvFile)) {
      const __cliRaw = __cliReadFileSync(__cliEnvFile, 'utf8');
      for (const __cliLine of __cliRaw.split(/\r?\n/)) {
        const __cliM = __cliLine.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (!__cliM) continue;
        let __cliVal = __cliM[2];
        if ((__cliVal.startsWith('"') && __cliVal.endsWith('"')) ||
            (__cliVal.startsWith("'") && __cliVal.endsWith("'"))) {
          __cliVal = __cliVal.slice(1, -1);
        }
        if (!process.env[__cliM[1]]) process.env[__cliM[1]] = __cliVal;
      }
    }
  }
  const __cliMockReq = { method: 'POST', query: {}, body: {}, headers: {} };
  const __cliMockRes = {
    statusCode: 200,
    _body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this._body = b; console.log(JSON.stringify(b, null, 2)); return this; },
    send(b) { this._body = b; return this; },
    setHeader() { return this; },
    end() { return this; },
  };
  handler(__cliMockReq, __cliMockRes).then(() => {
    const ok = __cliMockRes.statusCode >= 200 && __cliMockRes.statusCode < 300;
    if (ok) console.log('OK');
    else console.error(`FAILED: HTTP ${__cliMockRes.statusCode}`);
    process.exit(ok ? 0 : 1);
  }).catch((err) => {
    console.error('FAILED:', err && err.message ? err.message : err);
    process.exit(1);
  });
}
