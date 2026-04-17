/**
 * pilot_club_bootstrap.ts
 *
 * One-command setup for a new pilot club. Runs all registration and
 * bootstrapping steps in sequence.
 *
 * Usage:
 *   npx tsx scripts/pilot_club_bootstrap.ts --club-id=<clubId> [--dry-run]
 *
 * Steps:
 *   1. Register all agents (identity + analyst)
 *   2. Publish all skills
 *   3. Bootstrap analyst sessions (one per analyst per club)
 *   4. Batch-create member sessions for all active members
 */

import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bootstrapAllMemberSessions } from '../sessions/bootstrap/create_member_session.ts';
import { bootstrapAllAnalystSessions } from '../sessions/bootstrap/create_analyst_session.ts';
import { seedMemberContext } from '../sessions/bootstrap/seed_member_context.ts';
import { sql } from '@vercel/postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const args = process.argv.slice(2);
const clubIdArg = args.find(a => a.startsWith('--club-id='))?.split('=')[1];
const dryRun = args.includes('--dry-run');

if (!clubIdArg) {
  console.error('Usage: npx tsx scripts/pilot_club_bootstrap.ts --club-id=<clubId> [--dry-run]');
  process.exit(1);
}

const clubId = clubIdArg;

function run(label: string, script: string, extraArgs = ''): void {
  const dryFlag = dryRun ? ' --dry-run' : '';
  const cmd = `npx tsx ${join(ROOT, 'scripts', script)}${dryFlag}${extraArgs ? ' ' + extraArgs : ''}`;
  console.log(`\n[${label}] ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

async function main() {
  console.log(`\nPilot bootstrap — club: ${clubId}${dryRun ? ' (dry-run)' : ''}`);
  console.log('='.repeat(60));

  // Step 1: Register all agents
  run('1/4 register agents', 'register_all_agents.ts', '--tier=all');

  // Step 2: Publish skills
  run('2/4 publish skills', 'publish_skills.ts');

  if (!dryRun) {
    console.log('\n[3/4 analyst sessions]');
    const analystResult = await bootstrapAllAnalystSessions(clubId);
    console.log(`  Analyst sessions: created=${analystResult.created}, existing=${analystResult.existing}, errors=${analystResult.errors}`);

    console.log('\n[4/4 member sessions]');
    const memberResult = await bootstrapAllMemberSessions(clubId);
    console.log(`  Member sessions: created=${memberResult.created}, existing=${memberResult.existing}, errors=${memberResult.errors}`);

    console.log('\n[4b/4 seed Jonas context]');
    const { rows: members } = await sql`
      SELECT member_id FROM members WHERE club_id = ${clubId} AND status = 'active' ORDER BY member_id
    `;
    let seeded = 0;
    let seedSkipped = 0;
    let seedErrors = 0;
    for (const { member_id } of members) {
      try {
        const result = await seedMemberContext(clubId, member_id as string);
        result.seeded ? seeded++ : seedSkipped++;
      } catch { seedErrors++; }
    }
    console.log(`  Seeded: ${seeded}, skipped (already seeded): ${seedSkipped}, errors: ${seedErrors}`);
  } else {
    console.log('\n[3/4 analyst sessions] dry-run — skipped');
    console.log('[4/4 member sessions] dry-run — skipped');
  }

  console.log('\n' + '='.repeat(60));
  console.log('Pilot bootstrap complete.');
}

main().catch(err => { console.error(err); process.exit(1); });
