import { sql } from '@vercel/postgres';

function seededRand(seed) {
  let s = ((seed * 1103515245 + 12345) & 0x7fffffff);
  return (s % 10000) / 10000;
}

function padId(n) {
  return String(n).padStart(3, '0');
}

function pick(arr, seed) {
  return arr[Math.floor(seededRand(seed) * arr.length)];
}

// --- Archetype-based personalization data ---

const ARCHETYPES = {
  'Die-Hard Golfer': {
    teeTime: '6:30-7:30 AM weekdays',
    dining: 'Quick bite at Halfway House',
    spots: ['Practice Range', 'First Tee', 'Halfway House'],
    familyRange: [0, 2],
    notes: null,
  },
  'Social Butterfly': {
    teeTime: '9:00-10:00 AM weekends',
    dining: 'Weekend brunch, wine dinners',
    spots: ['Main Dining Room', 'Bar/Lounge', 'Pool'],
    familyRange: [1, 3],
    notes: null,
  },
  'Balanced Active': {
    teeTime: '7:30-9:00 AM',
    dining: 'Regular Thursday dinner',
    spots: ['Grill Room', 'Fitness Center', 'Pool'],
    familyRange: [1, 4],
    notes: null,
  },
  'Weekend Warrior': {
    teeTime: '8:00-9:30 AM Sat/Sun only',
    dining: 'Post-round beers at the bar',
    spots: ['First Tee', 'Bar/Lounge'],
    familyRange: [0, 2],
    notes: null,
  },
  'New Member': {
    teeTime: 'Flexible, still exploring',
    dining: 'Trying different outlets',
    spots: ['Grill Room', 'Pro Shop'],
    familyRange: [0, 3],
    notes: 'mentor',
  },
  Snowbird: {
    teeTime: '10:00-11:00 AM Oct-Mar',
    dining: 'Light lunch, sunset cocktails',
    spots: ['Pool Bar', 'Main Dining Room', 'Tennis Courts'],
    familyRange: [0, 2],
    notes: null,
  },
  Declining: {
    teeTime: 'Less frequent, was 8 AM regular',
    dining: 'Rarely dines anymore',
    spots: ['Was regular at Grill Room'],
    familyRange: [0, 1],
    notes: null,
  },
  Ghost: {
    teeTime: null,
    dining: null,
    spots: [],
    familyRange: [0, 0],
    notes: 'Minimal club engagement',
  },
};

// Deterministic archetype assignment based on member index
function getArchetype(memberIndex) {
  const r = seededRand(memberIndex * 3 + 17);
  if (r < 0.20) return 'Die-Hard Golfer';
  if (r < 0.35) return 'Social Butterfly';
  if (r < 0.55) return 'Balanced Active';
  if (r < 0.70) return 'Weekend Warrior';
  if (r < 0.80) return 'New Member';
  if (r < 0.88) return 'Snowbird';
  if (r < 0.95) return 'Declining';
  return 'Ghost';
}

// --- Realistic name pools ---

const SPOUSE_FIRST_NAMES_F = [
  'Jennifer', 'Sarah', 'Emily', 'Michelle', 'Jessica', 'Amanda', 'Stephanie', 'Nicole',
  'Lauren', 'Ashley', 'Megan', 'Rachel', 'Hannah', 'Samantha', 'Katherine', 'Elizabeth',
  'Heather', 'Natalie', 'Christina', 'Danielle', 'Victoria', 'Allison', 'Rebecca', 'Melissa',
  'Andrea', 'Laura', 'Kelly', 'Courtney', 'Kimberly', 'Patricia',
];

const SPOUSE_FIRST_NAMES_M = [
  'Michael', 'David', 'Robert', 'James', 'William', 'John', 'Richard', 'Thomas',
  'Christopher', 'Daniel', 'Matthew', 'Andrew', 'Mark', 'Steven', 'Brian', 'Kevin',
  'Timothy', 'Scott', 'Jeffrey', 'Eric', 'Patrick', 'Gregory', 'Kenneth', 'Stephen',
  'Nathan', 'Paul', 'Benjamin', 'Dennis', 'Gerald', 'Douglas',
];

const CHILD_NAMES = [
  'Tyler', 'Madison', 'Connor', 'Emma', 'Ethan', 'Olivia', 'Aiden', 'Sophia',
  'Liam', 'Ava', 'Mason', 'Isabella', 'Logan', 'Mia', 'Lucas', 'Charlotte',
  'Jackson', 'Amelia', 'Noah', 'Harper', 'Caleb', 'Ella', 'Owen', 'Lily',
  'Dylan', 'Grace', 'Ryan', 'Chloe', 'Jake', 'Zoe',
];

const MENTOR_NAMES = [
  'Bob Henderson', 'Jim Patterson', 'Mike Sullivan', 'Tom Bradley', 'Dave Kowalski',
  'Bill Thornton', 'Rick Castillo', 'Steve Yamamoto', 'Dan Moretti', 'Frank Nguyen',
];

const LAST_SEEN_LOCATIONS = [
  'Main Dining Room', 'Grill Room', 'Bar/Lounge', 'Pro Shop', 'Practice Range',
  'First Tee', 'Halfway House', 'Pool', 'Pool Bar', 'Fitness Center',
  'Tennis Courts', 'Lobby', 'Members Lounge', 'Card Room', 'Patio',
];

function generateFamily(memberIndex, archetype) {
  const config = ARCHETYPES[archetype] || ARCHETYPES['Balanced Active'];
  const [minFamily, maxFamily] = config.familyRange;
  const familySize = minFamily + Math.floor(seededRand(memberIndex * 59 + 101) * (maxFamily - minFamily + 1));

  if (familySize === 0) return '[]';

  const members = [];

  // Spouse (if any family at all, there's usually a spouse)
  const isFemaleMember = seededRand(memberIndex * 61 + 103) > 0.65;
  const spouseNames = isFemaleMember ? SPOUSE_FIRST_NAMES_M : SPOUSE_FIRST_NAMES_F;
  const spouseName = pick(spouseNames, memberIndex * 63 + 107);
  members.push({
    name: spouseName,
    relationship: 'Spouse',
    age: 35 + Math.floor(seededRand(memberIndex * 67 + 109) * 30),
    memberStatus: seededRand(memberIndex * 69 + 111) > 0.4 ? 'Active' : 'Social',
  });

  // Children
  for (let c = 1; c < familySize; c++) {
    const childName = pick(CHILD_NAMES, memberIndex * 71 + c * 73 + 113);
    const childAge = 4 + Math.floor(seededRand(memberIndex * 77 + c * 79 + 117) * 18);
    members.push({
      name: childName,
      relationship: 'Child',
      age: childAge,
      memberStatus: childAge >= 16 ? 'Junior' : 'Dependent',
    });
  }

  return JSON.stringify(members);
}

function generateNotes(memberIndex, archetype) {
  const config = ARCHETYPES[archetype] || ARCHETYPES['Balanced Active'];
  if (archetype === 'Ghost') return 'Minimal club engagement. Last activity over 6 months ago.';
  if (archetype === 'Declining') {
    const reasons = [
      'Mentioned health issues limiting play. Follow up with wellness team.',
      'Spouse no longer interested in club activities. Consider couples events.',
      'Frustrated with pace of play on weekends. Discussed marshal program.',
      'Travel schedule increased significantly. Offered flexible dining credits.',
      'Considering downgrade to social membership. Schedule GM meeting.',
    ];
    return pick(reasons, memberIndex * 83 + 127);
  }
  if (archetype === 'New Member') {
    const mentor = pick(MENTOR_NAMES, memberIndex * 87 + 131);
    const joinMonth = pick(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], memberIndex * 89 + 133);
    return `Joined ${joinMonth} 2025. Assigned mentor: ${mentor}. Attended new member orientation.`;
  }
  if (archetype === 'Snowbird') {
    const homeState = pick(['Minnesota', 'Wisconsin', 'Illinois', 'Michigan', 'Ohio', 'New York', 'Connecticut'], memberIndex * 91 + 137);
    return `Primary residence in ${homeState}. In-season Oct through Mar. Prefers email communication.`;
  }

  // General notes for other archetypes
  const generalNotes = [
    'Prefers window seating in dining room. Allergic to shellfish.',
    'Regular in the Thursday couples league. Handicap improving steadily.',
    'Hosts monthly business dinners in private dining. High F&B spend.',
    'Active in the men\'s invitational committee. Volunteers for events.',
    'Daughter getting married at the club in Fall 2026. Event deposit placed.',
    'Recently upgraded to Full Golf from Social. Very engaged since switch.',
    'Prefers cart #7 (medical accommodation). Always tips staff well.',
    'Participates in every member-guest event. Brings high-value guests.',
    'Fitness center regular. Uses personal trainer twice weekly.',
    'Wine club member. Attends every tasting event.',
    'Enjoys sunset dining on the patio. Regular Friday reservation.',
    'Kids in junior golf program. Very positive about youth activities.',
    'Organized the charity golf scramble last year. Key community member.',
    'Tennis enthusiast in addition to golf. Uses courts 3x per week.',
    'Birthday in April. Last year celebrated at the club with 40 guests.',
  ];
  return pick(generalNotes, memberIndex * 93 + 139);
}

function getLastSeenLocation(memberIndex, archetype) {
  const config = ARCHETYPES[archetype] || ARCHETYPES['Balanced Active'];
  if (archetype === 'Ghost') return null;
  if (config.spots.length > 0) {
    return pick(config.spots, memberIndex * 97 + 143);
  }
  return pick(LAST_SEEN_LOCATIONS, memberIndex * 97 + 143);
}

function getDiningPreference(memberIndex, archetype) {
  const config = ARCHETYPES[archetype];
  if (!config || !config.dining) return null;
  // Add slight variation
  const variations = {
    'Die-Hard Golfer': [
      'Quick bite at Halfway House',
      'Breakfast burrito before early tee time',
      'Post-round lunch at the Grill Room',
    ],
    'Social Butterfly': [
      'Weekend brunch, wine dinners',
      'Friday night prix fixe, Sunday brunch regular',
      'Hosts wine dinners, loves chef\'s table events',
    ],
    'Balanced Active': [
      'Regular Thursday dinner',
      'Thursday dinner and Sunday brunch',
      'Family dinner Fridays, casual lunch weekdays',
    ],
    'Weekend Warrior': [
      'Post-round beers at the bar',
      'Saturday lunch after 18 holes',
      'Beer and burger after weekend round',
    ],
    'New Member': [
      'Trying different outlets',
      'Exploring the menu, open to recommendations',
      'Enjoys the Grill Room so far',
    ],
    Snowbird: [
      'Light lunch, sunset cocktails',
      'Poolside lunch, evening cocktails on the patio',
      'Prefers lighter fare, enjoys happy hour',
    ],
    Declining: [
      'Rarely dines anymore',
      'Used to dine weekly, now monthly at best',
      'Occasional lunch only',
    ],
    Ghost: [null],
  };
  const opts = variations[archetype] || [config.dining];
  return pick(opts, memberIndex * 99 + 147);
}

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG) return res.status(403).json({ error: 'Disabled in production' });
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Add columns if they don't exist (Postgres doesn't have IF NOT EXISTS for ADD COLUMN,
    // so we use a DO block)
    await sql`
      DO $$
      BEGIN
        BEGIN ALTER TABLE members ADD COLUMN preferred_dining_spot TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
        BEGIN ALTER TABLE members ADD COLUMN tee_time_preference TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
        BEGIN ALTER TABLE members ADD COLUMN dining_preference TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
        BEGIN ALTER TABLE members ADD COLUMN member_notes TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
        BEGIN ALTER TABLE members ADD COLUMN family_members TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
        BEGIN ALTER TABLE members ADD COLUMN last_seen_location TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
      END
      $$
    `;

    let updatedCount = 0;

    for (let m = 1; m <= 300; m++) {
      const memberId = `mbr_${padId(m)}`;

      // Look up actual archetype from DB, fall back to deterministic assignment
      const memberResult = await sql`SELECT archetype FROM members WHERE member_id = ${memberId}`;
      const archetype = memberResult.rows.length > 0 && memberResult.rows[0].archetype
        ? memberResult.rows[0].archetype
        : getArchetype(m);

      const config = ARCHETYPES[archetype] || ARCHETYPES['Balanced Active'];

      const teeTimePref = config.teeTime;
      const diningPref = getDiningPreference(m, archetype);
      const preferredSpot = config.spots.length > 0 ? pick(config.spots, m * 101 + 151) : null;
      const familyMembers = generateFamily(m, archetype);
      const notes = generateNotes(m, archetype);
      const lastSeen = getLastSeenLocation(m, archetype);

      await sql`
        UPDATE members SET
          preferred_dining_spot = ${preferredSpot},
          tee_time_preference = ${teeTimePref},
          dining_preference = ${diningPref},
          member_notes = ${notes},
          family_members = ${familyMembers},
          last_seen_location = ${lastSeen}
        WHERE member_id = ${memberId}
      `;

      updatedCount++;
    }

    return res.status(200).json({
      success: true,
      message: `Updated personalization data for ${updatedCount} members`,
      columnsAdded: [
        'preferred_dining_spot',
        'tee_time_preference',
        'dining_preference',
        'member_notes',
        'family_members',
        'last_seen_location',
      ],
      archetypeDistribution: {
        'Die-Hard Golfer': '~20%',
        'Social Butterfly': '~15%',
        'Balanced Active': '~20%',
        'Weekend Warrior': '~15%',
        'New Member': '~10%',
        'Snowbird': '~8%',
        'Declining': '~7%',
        'Ghost': '~5%',
      },
    });
  } catch (error) {
    console.error('Error seeding personalization:', error);
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}
