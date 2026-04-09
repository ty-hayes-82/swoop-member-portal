import { sql } from '@vercel/postgres';
import { cors } from '../../api/lib/cors.js';
import { logWarn } from '../../api/lib/logger.js';

const ALLOW_DEBUG = process.env.ALLOW_DEBUG === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (IS_PROD && !ALLOW_DEBUG) {
    logWarn('/api/seed-activity-log', 'operator endpoint blocked in production', { ip: req.headers['x-forwarded-for'] });
    return res.status(404).json({ error: 'Not found' });
  }
  try {
    // Create table
    await sql`
      CREATE TABLE IF NOT EXISTS activity_log (
        id              SERIAL PRIMARY KEY,
        action_type     VARCHAR(50) NOT NULL,
        action_subtype  VARCHAR(50),
        actor           VARCHAR(50) DEFAULT 'gm_default',
        member_id       VARCHAR(20),
        member_name     VARCHAR(100),
        agent_id        VARCHAR(50),
        reference_id    VARCHAR(100),
        reference_type  VARCHAR(50),
        description     TEXT,
        meta            JSONB DEFAULT '{}',
        status          VARCHAR(20) DEFAULT 'logged',
        created_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(action_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activity_log_member ON activity_log(member_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activity_log_reference ON activity_log(reference_id, reference_type)`;

    // Clear existing seed data
    await sql`DELETE FROM activity_log WHERE actor = 'gm_default'`;

    // Seed historical actions (last 48 hours)
    const now = new Date();
    const h = (hoursAgo) => new Date(now.getTime() - hoursAgo * 3600000).toISOString();

    const seeds = [
      // Agent approvals
      { action_type: 'approve', action_subtype: 'send', member_id: 'MBR-042', member_name: 'James Whitfield', agent_id: 'member-pulse', reference_id: 'agx_001', reference_type: 'agent_action', description: 'Prioritize personal outreach to James Whitfield before his 9:20 AM tee time.', meta: { priority: 'high', impact: '$18K dues retention at risk' }, created_at: h(36) },
      { action_type: 'approve', action_subtype: 'schedule', member_id: 'MBR-089', member_name: 'Sarah Mitchell', agent_id: 'service-recovery', reference_id: 'agx_003', reference_type: 'agent_action', description: 'Recovery outreach for unresolved dining complaint.', meta: { priority: 'high', impact: '$15K annual dues' }, created_at: h(28) },
      { action_type: 'approve', action_subtype: 'assign', member_id: 'MBR-156', member_name: 'Robert Chen', agent_id: 'engagement-autopilot', reference_id: 'agx_005', reference_type: 'agent_action', description: 'Re-engagement sequence for declining member.', meta: { priority: 'medium' }, created_at: h(12) },
      // Agent dismissals
      { action_type: 'dismiss', member_id: 'MBR-201', member_name: 'Linda Park', agent_id: 'demand-optimizer', reference_id: 'agx_004', reference_type: 'agent_action', description: 'Waitlist rebalancing — low-probability fill.', meta: { reason: 'Member already contacted directly' }, created_at: h(30) },
      { action_type: 'dismiss', member_id: 'MBR-078', member_name: 'Tom Bradley', agent_id: 'revenue-analyst', reference_id: 'agx_006', reference_type: 'agent_action', description: 'F&B upsell opportunity for Weekend Warrior.', meta: { reason: 'Already running seasonal promo' }, created_at: h(18) },
      // Calls scheduled
      { action_type: 'call', action_subtype: 'schedule', member_id: 'MBR-042', member_name: 'James Whitfield', description: 'GM follow-up call before Saturday round.', meta: { scheduledFor: '2026-01-18T09:00:00Z', owner: 'GM' }, created_at: h(24) },
      { action_type: 'call', action_subtype: 'schedule', member_id: 'MBR-089', member_name: 'Sarah Mitchell', description: 'Service recovery call re: dining complaint.', meta: { scheduledFor: '2026-01-17T14:00:00Z', owner: 'F&B Director' }, created_at: h(20) },
      // Playbooks activated
      { action_type: 'playbook', action_subtype: 'activate', description: 'Dining Dormancy Recovery', meta: { memberCount: 98, impact: '$11K/mo' }, created_at: h(40) },
      { action_type: 'playbook', action_subtype: 'activate', description: 'Service Failure Rapid Response', meta: { memberCount: 5, impact: '$24K/mo' }, created_at: h(22) },
      // Campaign launched
      { action_type: 'campaign', action_subtype: 'launch', description: 'Post-round dining credit for Die-Hard Golfers', meta: { archetype: 'Die-Hard Golfer', count: 55, untapped: 6864 }, created_at: h(16) },
      // Feedback logged
      { action_type: 'feedback', action_subtype: 'complaint', member_name: 'Pamela Ulrich', description: 'Waited 25 minutes for server at Grill Room lunch. Table was dirty.', meta: { type: 'Complaint' }, created_at: h(48) },
      // Tee sheet confirmations
      { action_type: 'confirm', action_subtype: 'confirmed', member_id: 'MBR-112', member_name: 'David Kowalski', reference_id: 'conf_001', reference_type: 'confirmation', description: 'Confirmed 8:00 AM tee time.', created_at: h(8) },
      { action_type: 'confirm', action_subtype: 'cancelled', member_id: 'MBR-067', member_name: 'Jennifer Walsh', reference_id: 'conf_003', reference_type: 'confirmation', description: 'Cancelled 10:40 AM tee time.', created_at: h(6) },
      // Reassignment approved
      { action_type: 'reassign', action_subtype: 'approve_fill', member_id: 'MBR-034', member_name: 'Michael Torres', reference_id: 'ra_001', reference_type: 'reassignment', description: 'Approved fill for cancelled 10:40 AM slot.', meta: { revenueRecovered: 156 }, created_at: h(5) },
      // Escalation
      { action_type: 'escalate', action_subtype: 'gm', member_id: 'MBR-089', member_name: 'Sarah Mitchell', description: 'Escalated unresolved complaint to GM for personal follow-up.', meta: { daysOpen: 48, duesAtRisk: 15000 }, created_at: h(44) },
      // Deploy action
      { action_type: 'deploy', action_subtype: 'ranger', description: 'Deploy Rangers activated', meta: { amount: 5760, action: 'Deploy ranger coverage on holes 4, 8, 12, 16 (Sat/Sun 8-11am).' }, created_at: h(32) },
      // Notes
      { action_type: 'note', action_subtype: 'personal', member_id: 'MBR-042', member_name: 'James Whitfield', description: 'Mentioned interest in Chef\'s Table — follow up with invitation.', meta: { owner: 'GM' }, created_at: h(10) },
    ];

    for (const s of seeds) {
      await sql`
        INSERT INTO activity_log (action_type, action_subtype, actor, member_id, member_name, agent_id, reference_id, reference_type, description, meta, created_at)
        VALUES (${s.action_type}, ${s.action_subtype ?? null}, 'gm_default', ${s.member_id ?? null}, ${s.member_name ?? null}, ${s.agent_id ?? null}, ${s.reference_id ?? null}, ${s.reference_type ?? null}, ${s.description ?? null}, ${JSON.stringify(s.meta ?? {})}, ${s.created_at ?? new Date().toISOString()})
      `;
    }

    const { rows } = await sql`SELECT COUNT(*) as count FROM activity_log`;
    res.status(200).json({ success: true, count: rows[0].count, seeded: seeds.length });
  } catch (error) {
    console.error('Seed activity log error:', error);
    res.status(500).json({ error: error.message });
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
