/**
 * Debug: stream all events from a session and log types.
 * Usage: npx tsx scripts/test_stream.ts --session-id=sesn_...
 */
import { getClient } from '../harness/client.ts';

const args = process.argv.slice(2);
const sessionId = args.find(a => a.startsWith('--session-id='))?.split('=')[1];

if (!sessionId) {
  console.error('Usage: npx tsx scripts/test_stream.ts --session-id=sesn_...');
  process.exit(1);
}

async function main() {
  const client = getClient();
  console.log(`Streaming from session: ${sessionId}`);
  console.log('Events:');

  const stream = await client.beta.sessions.events.stream(sessionId as string);

  let count = 0;
  for await (const event of stream) {
    count++;
    const e = event as unknown as Record<string, unknown>;
    const type = e['type'];
    console.log(`[${count}] type=${type}`, JSON.stringify(e).slice(0, 200));
    if (count > 30) { console.log('(stopping after 30 events)'); break; }
  }

  console.log(`\nStream ended. Total events: ${count}`);
}

main().catch(err => { console.error(err); process.exit(1); });
