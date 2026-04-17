/**
 * Quick test: create a member session and send one message.
 * Usage: npx tsx scripts/test_session.ts --club-id=club_001 --member-id=mbr_t01
 */
import { createMemberSession } from '../sessions/bootstrap/create_member_session.ts';
import { sendAndConsumeStream } from '../harness/events.ts';
import { ALL_HANDLERS } from '../tools/handlers/index.ts';

const args = process.argv.slice(2);
const clubId = args.find(a => a.startsWith('--club-id='))?.split('=')[1] ?? 'club_test2';
const memberId = args.find(a => a.startsWith('--member-id='))?.split('=')[1] ?? 'mbr_test2';
const message = args.find(a => a.startsWith('--message='))?.split('=')[1] ?? 'Hello! What can you help me with?';

async function main() {
  console.log(`Testing session for club=${clubId} member=${memberId}`);

  const { managedSessionId, created } = await createMemberSession(clubId, memberId);
  console.log(`Session: ${managedSessionId} (created=${created})`);

  console.log('Sending message and streaming...');
  const response = await sendAndConsumeStream(managedSessionId, message, ALL_HANDLERS, (chunk) => {
    process.stdout.write(chunk);
  });

  console.log('\n--- Full response ---');
  console.log(response || '(empty)');
}

main().catch(err => { console.error(err); process.exit(1); });
