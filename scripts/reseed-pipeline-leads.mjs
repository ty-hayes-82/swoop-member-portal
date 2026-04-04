import { createClient } from '@vercel/postgres';

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('Error: POSTGRES_URL_NON_POOLING or POSTGRES_URL environment variable required');
  process.exit(1);
}

const client = createClient({ connectionString });

const hotLeads = [
  { name: 'Lisa Hart', visits: 5 },
  { name: 'David Chen', visits: 5 },
  { name: 'Priya Kapoor', visits: 4 },
  { name: 'Jordan Miles', visits: 4 },
  { name: 'Samantha Ortiz', visits: 4 },
  { name: 'Noah Sinclair', visits: 4 },
  { name: 'Elena Brooks', visits: 4 },
  { name: 'Marcus Lee', visits: 5 },
  { name: 'Vivian Park', visits: 4 },
  { name: 'Henry Patel', visits: 4 },
  { name: 'Quinn Foster', visits: 5 },
  { name: 'Naomi Blake', visits: 4 },
  { name: 'Caleb Rogers', visits: 4 },
  { name: 'Brooke Atkinson', visits: 4 },
  { name: 'Diego Alvarez', visits: 4 },
  { name: 'Ivy Chen', visits: 4 },
  { name: 'Leo Navarro', visits: 4 },
  { name: 'Stella Grimes', visits: 4 }
];

const warmLeads = [
  'Avery Collins',
  'Mei Lin',
  'Zoe Whitaker',
  'Miles Dorsey',
  'Gabriela Ruiz',
  'Trent Dawson',
  'Hannah Ellison',
  'Colin Pierce',
  'Riya Bhandari',
  'Andre Coleman',
  'Paige Walters',
  'Maya Sterling',
  'Ethan Ross',
  'Logan Spencer',
  'Mariah Bowen',
  'Kara Jennings',
  'Owen McAllister',
  'Isabel Sharpe',
  'Selene Holt',
  'Cam Riley'
].map((name) => ({ name, visits: 2 }));

const coldLeads = [
  'Reed Holloway',
  'Summer Patel',
  'Cassidy Monroe',
  'Declan Price',
  'Lucia Bennett',
  'Tyler Gage',
  'Anika Sethi',
  'Brody Stokes',
  'Phoebe Grant',
  'Rafael Cortez',
  'Callie Winters',
  'Imani Rhodes',
  'Spencer Vaughn',
  'Nina Alvarez',
  'Darren Cole',
  'Ellie Snyder',
  'Mason Kirk',
  'Gemma Lowe'
].map((name) => ({ name, visits: 1 }));

const leadPlan = [...hotLeads, ...warmLeads, ...coldLeads];

const totalVisitsNeeded = leadPlan.reduce((sum, item) => sum + item.visits, 0);

async function main() {
  await client.connect();
  const { rows } = await client.sql`
    SELECT bp.player_id
    FROM booking_players bp
    JOIN bookings b ON b.booking_id = bp.booking_id
    WHERE bp.is_guest = 1
    ORDER BY b.booking_date::date, b.tee_time::time, bp.player_id
  `;

  if (rows.length < totalVisitsNeeded) {
    throw new Error(`Need ${totalVisitsNeeded} guest rows but only found ${rows.length}`);
  }

  await client.sql`BEGIN`;
  await client.sql`UPDATE booking_players SET is_warm_lead = 0 WHERE is_guest = 1`;

  let cursor = 0;
  for (const lead of leadPlan) {
    const slice = rows.slice(cursor, cursor + lead.visits);
    cursor += lead.visits;
    const playerIds = slice.map((row) => row.player_id);
    if (playerIds.length !== lead.visits) {
      throw new Error(`Insufficient rows for lead ${lead.name}`);
    }
    await client.query({
      text: 'UPDATE booking_players SET guest_name = $1, is_warm_lead = 1 WHERE player_id = ANY($2::text[])',
      values: [lead.name, playerIds],
    });
  }

  await client.sql`COMMIT`;
  console.log(`Reassigned ${leadPlan.length} warm leads using ${totalVisitsNeeded} rounds.`);
  await client.end();
}

main().catch(async (err) => {
  console.error(err);
  await client.sql`ROLLBACK`;
  process.exitCode = 1;
  try {
    await client.end();
  } catch (e) {
    // ignore
  }
});
