import { sql } from '@vercel/postgres';

// ============================================================
// Swoop Golf — Realistic Seed Script
// POST /api/seed-realistic
// Populates ALL tables with 300 unique country-club members
// and correlated operational data.
// Deterministic: uses index-based pseudo-random (no Math.random)
// ============================================================

// ---------- deterministic pseudo-random helpers ----------

function seededRand(seed) {
  // Simple LCG — deterministic from seed
  let s = ((seed * 1103515245 + 12345) & 0x7fffffff);
  return (s % 10000) / 10000;
}

function seededRandRange(seed, min, max) {
  return Math.floor(seededRand(seed) * (max - min + 1)) + min;
}

function pick(arr, seed) {
  return arr[seededRandRange(seed, 0, arr.length - 1)];
}

function pad(n, w = 2) {
  return String(n).padStart(w, '0');
}

function memberId(i) {
  return `mbr_${pad(i + 1, 3)}`;
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function isoDatetime(d) {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// ---------- reference data ----------

const FIRST_NAMES = [
  'James','Robert','John','Michael','David','William','Richard','Joseph','Thomas','Christopher',
  'Charles','Daniel','Matthew','Anthony','Mark','Donald','Steven','Paul','Andrew','Joshua',
  'Kenneth','Kevin','Brian','George','Timothy','Ronald','Edward','Jason','Jeffrey','Ryan',
  'Jacob','Gary','Nicholas','Eric','Jonathan','Stephen','Larry','Justin','Scott','Brandon',
  'Benjamin','Samuel','Raymond','Gregory','Frank','Alexander','Patrick','Jack','Dennis','Henry',
  'Mary','Patricia','Jennifer','Linda','Barbara','Elizabeth','Susan','Jessica','Sarah','Karen',
  'Lisa','Nancy','Betty','Margaret','Sandra','Ashley','Dorothy','Kimberly','Emily','Donna',
  'Michelle','Carol','Amanda','Melissa','Deborah','Stephanie','Rebecca','Sharon','Laura','Cynthia',
  'Kathleen','Amy','Angela','Shirley','Anna','Brenda','Pamela','Emma','Nicole','Helen',
  'Samantha','Katherine','Christine','Debra','Rachel','Carolyn','Janet','Catherine','Maria','Heather',
  'Carlos','Miguel','Luis','Jorge','Pedro','Alejandro','Diego','Fernando','Rafael','Manuel',
  'Sofia','Isabella','Valentina','Camila','Lucia','Elena','Adriana','Gabriela','Rosa','Carmen',
  'Wei','Jun','Lei','Hao','Tao','Ming','Yan','Lin','Fang','Xiu',
  'Yuki','Kenji','Haruki','Sora','Akira','Hana','Sakura','Ren','Kaito','Mio',
  'Priya','Raj','Anika','Vikram','Deepa','Arjun','Nisha','Rohan','Sanjay','Meera',
  'Kwame','Amara','Kofi','Nia','Jelani','Zara','Idris','Aaliyah','Darius','Tariq',
  'Liam','Noah','Oliver','Ethan','Lucas','Mason','Logan','Aiden','Harper','Evelyn',
  'Abigail','Mia','Charlotte','Sophia','Avery','Ella','Scarlett','Grace','Victoria','Riley',
  'Owen','Dylan','Nathan','Caleb','Hunter','Connor','Eli','Nolan','Parker','Cooper',
  'Claire','Lily','Hannah','Natalie','Leah','Hazel','Violet','Aurora','Savannah','Audrey',
  'Marcus','Derek','Troy','Terrence','Andre','Malik','Jamal','DeShawn','Lamar','Cedric',
  'Tyrone','Maurice','Clarence','Vernon','Curtis','Wesley','Reginald','Darryl','Lonnie','Otis',
  'Pierre','Jean','Francois','Laurent','Philippe','Colette','Simone','Monique','Genevieve','Eloise',
  'Henrik','Lars','Sven','Ingrid','Astrid','Freya','Magnus','Gunnar','Bjorn','Sigrid',
  'Dmitri','Natasha','Sergei','Olga','Ivan','Katya','Alexei','Marina','Yuri','Tatiana',
  'Giuseppe','Marco','Luca','Francesca','Giulia','Matteo','Paolo','Chiara','Elisa','Giovanni',
  'Hiroshi','Takeshi','Naomi','Yoko','Satoshi','Emiko','Koji','Midori','Ryo','Asami',
  'Jin','Soo','Hyun','Min','Jae','Eun','Dong','Yong','Chul','Sung',
  'Ravi','Anita','Suresh','Kavita','Ashok','Geeta','Mohan','Sunita','Ramesh','Lakshmi',
  'Ahmed','Fatima','Omar','Leila','Hassan','Yasmin','Ali','Nadia','Karim','Amina'
];

const LAST_NAMES = [
  'Thornton','Anderson','Mitchell','Caldwell','Harrison','Preston','Whitfield','Montgomery','Pemberton','Ashworth',
  'Sinclair','Wellington','Beaumont','Lancaster','Kensington','Hartford','Worthington','Blackwood','Sterling','Crawford',
  'Rodriguez','Martinez','Gutierrez','Hernandez','Flores','Morales','Castillo','Reyes','Delgado','Navarro',
  'Chen','Wang','Liu','Zhang','Park','Kim','Nakamura','Tanaka','Yamamoto','Watanabe',
  'Patel','Sharma','Gupta','Singh','Reddy','Nair','Mehta','Chopra','Desai','Agarwal',
  'Williams','Jackson','Thompson','Robinson','Harris','Walker','Lewis','Hall','Young','Wright',
  'Davis','Johnson','Brown','Wilson','Taylor','Moore','Martin','White','Clark','Lee',
  'Dupont','Moreau','Lefevre','Laurent','Fontaine','Bergman','Lindqvist','Johansson','Eriksson','Nilsson',
  'OBrien','Sullivan','Murphy','Kennedy','Quinn','Riley','Brennan','Gallagher','Doyle','Walsh',
  'Romano','Bianchi','Ferrari','Russo','Esposito','Petrov','Volkov','Sokolov','Ivanov','Kuznetsov',
  'Fox','Reed','Cooper','Bailey','Bell','Ross','Wood','Price','Sanders','Butler',
  'Hoffman','Weber','Schneider','Fischer','Schmidt','Mueller','Becker','Schulz','Wagner','Braun',
  'Carmichael','Fitzgerald','Stanton','Prescott','Remington','Ellington','Wentworth','Harrington','Livingston','Cunningham',
  'Brooks','Griffin','Hayes','Coleman','Howard','Russell','Barnes','Long','Foster','Powell',
  'Hawkins','Cole','Stone','Warren','Burns','Gordon','Palmer','Grant','Henderson','Reynolds',
  'Burke','Chambers','Drake','Fletcher','Graham','Hunt','Jennings','Knight','Lambert','Maxwell',
  'Nash','Owens','Perry','Ramsey','Shaw','Spencer','Tucker','Vaughn','Warner','York',
  'Abbott','Barton','Chandler','Dalton','Emerson','Forrest','Garrison','Holden','Irving','Jefferson',
  'Kendall','Lawson','Mercer','Norris','Osborne','Paxton','Quincy','Ryder','Sawyer','Trent',
  'Underwood','Vance','Weston','Xavier','Yates','Zimmerman','Aldridge','Bradford','Compton','Donovan',
  'Erickson','Freeman','Gibson','Hampton','Ingram','Jordan','Kemp','Logan','Monroe','Newton',
  'Oakley','Pearson','Quinn','Randolph','Sutton','Turner','Upton','Vernon','Wagner','Young',
  'Adler','Bloom','Carter','Dixon','Easton','Flynn','Gates','Holland','Ives','Jacobs',
  'Kane','Langston','Marsh','Neal','Oliver','Page','Quill','Rhodes','Sharp','Todd',
  'Urban','Vale','West','Xu','Yeager','Zane','Archer','Bishop','Cross','Dean',
  'Ellis','Frost','Greer','Hart','Irwin','Joyce','Kirk','Lane','Miles','Norwood',
  'Pace','Ray','Sims','Tate','Ulrich','Vega','Wade','Yoder','Ziegler','Avery',
  'Boyd','Craig','Drake','Ewing','Fry','Glass','Horn','Ives','Jett','King',
  'Love','Mack','Nye','Odom','Pike','Rand','Starr','Troy','Uhl','Vine',
  'Wolf','Yang','Zook','Ash','Beck','Clay','Duff','Eden','Falk','Gale'
];

const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'icloud.com', 'outlook.com', 'aol.com'];

const AREA_CODES = ['480', '602', '623', '520'];

const ARCHETYPES = [
  { name: 'Die-Hard Golfer', count: 60 },
  { name: 'Balanced Active', count: 55 },
  { name: 'Social Butterfly', count: 45 },
  { name: 'Weekend Warrior', count: 45 },
  { name: 'New Member', count: 30 },
  { name: 'Snowbird', count: 25 },
  { name: 'Declining', count: 25 },
  { name: 'Ghost', count: 15 },
];

const MEMBERSHIP_TYPES = [
  { code: 'FG', weight: 55, dues: 18000 },
  { code: 'SOC', weight: 20, dues: 6000 },
  { code: 'SPT', weight: 12, dues: 12000 },
  { code: 'JR', weight: 5, dues: 8000 },
  { code: 'LEG', weight: 5, dues: 22000 },
  { code: 'NR', weight: 3, dues: 15000 },
];

const CAMPAIGN_SUBJECTS = [
  'March Newsletter', 'Pro Shop Spring Sale', 'Wine Dinner: March 15',
  'Member-Guest Registration Open', 'Course Renovation Update', 'Easter Brunch RSVP',
  'Junior Golf Camp Signup', 'Summer Hours Announced', 'Board Meeting Minutes',
  'Fitness Center Grand Opening', 'Super Bowl Watch Party', 'Valentine\'s Dinner',
  'St. Patrick\'s Day Tournament', 'New Chef Introduction', 'Pool Opening Day',
  'Ladies Golf League', 'Men\'s Night Returns', 'Holiday Party Save the Date',
  'Annual Meeting Notice', 'Tee Time Policy Update',
];

const CAMPAIGN_TYPES = ['newsletter', 'promotional', 'event'];

const EVENT_NAMES = [
  'Member-Guest Tournament', 'Wine Dinner', 'Family BBQ', 'Ladies Golf League',
  'Men\'s Night', 'Super Bowl Party', 'Valentine\'s Dinner', 'St. Patrick\'s Tournament',
  'Easter Brunch', 'Junior Golf Clinic', 'Fitness Challenge', 'New Member Welcome',
  'Board Town Hall', 'Pro-Am Qualifier', 'Spring Gala',
];

const EVENT_TYPES = ['golf', 'social', 'dining', 'fitness'];

const FEEDBACK_CATEGORIES = ['course_conditions', 'slow_play', 'food_quality', 'staff_service', 'facilities'];
const FEEDBACK_STATUSES = ['open', 'in_progress', 'resolved'];
const WEATHER_CONDITIONS = ['sunny', 'clear', 'partly_cloudy', 'cloudy', 'windy', 'rain', 'overcast'];
const ANCHOR_TYPES = ['golf', 'dining', 'event', 'fitness'];
const OUTLET_IDS = ['outlet_grill', 'outlet_bar', 'outlet_dining'];
const PAYMENT_METHODS = ['member_charge', 'credit_card', 'cash'];
const GENDERS = ['M', 'F'];
const TRANSPORTATION = ['cart', 'walk', 'push_cart'];
const ROUND_TYPES = ['18', '9', '18'];

// ---------- date helpers ----------

function getToday() {
  return new Date('2026-03-10');
}

function getMonday(weeksAgo) {
  const d = getToday();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  d.setDate(d.getDate() - diff - (weeksAgo * 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// ---------- member generation ----------

function generateMembers() {
  const members = [];

  // Build archetype assignment
  const archetypeAssignments = [];
  for (const a of ARCHETYPES) {
    for (let i = 0; i < a.count; i++) {
      archetypeAssignments.push(a.name);
    }
  }

  // Membership type assignment by weight
  const membershipPool = [];
  for (const mt of MEMBERSHIP_TYPES) {
    const count = Math.round((mt.weight / 100) * 300);
    for (let i = 0; i < count; i++) {
      membershipPool.push(mt);
    }
  }
  // pad or trim to 300
  while (membershipPool.length < 300) membershipPool.push(MEMBERSHIP_TYPES[0]);
  while (membershipPool.length > 300) membershipPool.pop();

  // Shuffle membership pool deterministically
  for (let i = membershipPool.length - 1; i > 0; i--) {
    const j = seededRandRange(i * 7 + 31, 0, i);
    [membershipPool[i], membershipPool[j]] = [membershipPool[j], membershipPool[i]];
  }

  // Track used name combinations
  const usedNames = new Set();

  for (let i = 0; i < 300; i++) {
    // Pick unique first+last combo
    let firstName, lastName;
    let attempts = 0;
    do {
      const fi = (i * 7 + attempts * 13 + 3) % FIRST_NAMES.length;
      const li = (i * 11 + attempts * 17 + 5) % LAST_NAMES.length;
      firstName = FIRST_NAMES[fi];
      lastName = LAST_NAMES[li];
      attempts++;
    } while (usedNames.has(`${firstName}_${lastName}`) && attempts < 50);
    usedNames.add(`${firstName}_${lastName}`);

    const mt = membershipPool[i];
    const archetype = archetypeAssignments[i];

    // Join date: New Members joined 2024-2025, others 2015-2023
    let joinYear;
    if (archetype === 'New Member') {
      joinYear = seededRandRange(i * 3 + 100, 2024, 2025);
    } else if (archetype === 'Ghost' || archetype === 'Declining') {
      joinYear = seededRandRange(i * 3 + 200, 2015, 2019);
    } else {
      joinYear = seededRandRange(i * 3 + 300, 2016, 2023);
    }
    const joinMonth = seededRandRange(i * 5 + 1, 1, 12);
    const joinDay = seededRandRange(i * 5 + 2, 1, 28);
    const joinDate = `${joinYear}-${pad(joinMonth)}-${pad(joinDay)}`;

    // Status
    let status = 'active';
    let resignedOn = null;
    if (i >= 280 && i < 292) {
      status = 'resigned';
      resignedOn = `${seededRandRange(i * 3 + 400, 2024, 2025)}-${pad(seededRandRange(i * 5 + 3, 1, 12))}-${pad(seededRandRange(i * 5 + 4, 1, 28))}`;
    } else if (i >= 292) {
      status = 'suspended';
    }

    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${pick(EMAIL_DOMAINS, i * 9 + 4)}`;
    const areaCode = pick(AREA_CODES, i * 11 + 7);
    const phoneNum = `(${areaCode}) 555-${pad(seededRandRange(i * 13, 10, 99))}${pad(seededRandRange(i * 17, 10, 99))}`;
    const householdId = `hh_${pad(Math.floor(i / 2) + 1, 3)}`;
    const balance = seededRandRange(i * 23, -500, 3000);

    // date_of_birth: generate ages 25-80
    const birthYear = 2026 - seededRandRange(i * 31 + 7, 25, 80);
    const birthMonth = seededRandRange(i * 31 + 8, 1, 12);
    const birthDay = seededRandRange(i * 31 + 9, 1, 28);
    const dateOfBirth = `${birthYear}-${pad(birthMonth)}-${pad(birthDay)}`;

    const gender = pick(GENDERS, i * 37 + 2);

    const ghinNumber = seededRand(i * 41 + 5) < 0.6 ? `${seededRandRange(i * 43, 1000000, 9999999)}` : null;

    const communicationOptIn = seededRand(i * 47 + 3) < 0.85 ? 1 : 0;

    members.push({
      member_id: memberId(i),
      member_number: i + 1,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phoneNum,
      date_of_birth: dateOfBirth,
      gender,
      membership_type: mt.code,
      membership_status: status,
      join_date: joinDate,
      resigned_on: resignedOn,
      household_id: householdId,
      archetype,
      annual_dues: mt.dues,
      account_balance: balance,
      ghin_number: ghinNumber,
      communication_opt_in: communicationOptIn,
    });
  }

  return members;
}

// ---------- engagement weekly ----------

function generateEngagementWeekly(members) {
  const rows = [];
  for (let mi = 0; mi < members.length; mi++) {
    const m = members[mi];
    for (let w = 1; w <= 12; w++) {
      const weekStartDate = getMonday(12 - w);
      const weekStart = isoDate(weekStartDate);
      const weekEnd = isoDate(addDays(weekStartDate, 6));
      const seed = mi * 100 + w;

      let baseScore, rounds, diningSpend, diningVisits, events, emailRate;
      const variance = seededRandRange(seed + 1, -5, 5);

      switch (m.archetype) {
        case 'Die-Hard Golfer':
          baseScore = 82 + variance + Math.floor(w * 0.3);
          rounds = seededRandRange(seed + 10, 2, 4);
          diningVisits = seededRandRange(seed + 15, 1, 3);
          diningSpend = seededRandRange(seed + 20, 30, 120);
          events = seededRandRange(seed + 30, 0, 1);
          emailRate = seededRandRange(seed + 40, 40, 65) / 100;
          break;
        case 'Balanced Active':
          baseScore = 68 + variance;
          rounds = seededRandRange(seed + 10, 1, 2);
          diningVisits = seededRandRange(seed + 15, 1, 4);
          diningSpend = seededRandRange(seed + 20, 40, 150);
          events = seededRandRange(seed + 30, 0, 2);
          emailRate = seededRandRange(seed + 40, 50, 75) / 100;
          break;
        case 'Social Butterfly':
          baseScore = 72 + variance;
          rounds = seededRandRange(seed + 10, 0, 1);
          diningVisits = seededRandRange(seed + 15, 3, 6);
          diningSpend = seededRandRange(seed + 20, 80, 220);
          events = seededRandRange(seed + 30, 1, 3);
          emailRate = seededRandRange(seed + 40, 55, 80) / 100;
          break;
        case 'Weekend Warrior':
          baseScore = 58 + variance + (w % 2 === 0 ? 5 : 0);
          rounds = w % 2 === 0 ? seededRandRange(seed + 10, 1, 2) : seededRandRange(seed + 10, 0, 1);
          diningVisits = seededRandRange(seed + 15, 0, 2);
          diningSpend = seededRandRange(seed + 20, 20, 80);
          events = seededRandRange(seed + 30, 0, 1);
          emailRate = seededRandRange(seed + 40, 35, 55) / 100;
          break;
        case 'New Member':
          baseScore = 60 + variance + Math.floor(w * 1.2);
          rounds = seededRandRange(seed + 10, 0, 2);
          diningVisits = seededRandRange(seed + 15, 1, 3);
          diningSpend = seededRandRange(seed + 20, 20, 100);
          events = seededRandRange(seed + 30, 0, 2);
          emailRate = seededRandRange(seed + 40, 60, 85) / 100;
          break;
        case 'Snowbird':
          baseScore = 78 + variance;
          rounds = seededRandRange(seed + 10, 2, 3);
          diningVisits = seededRandRange(seed + 15, 2, 4);
          diningSpend = seededRandRange(seed + 20, 50, 160);
          events = seededRandRange(seed + 30, 0, 2);
          emailRate = seededRandRange(seed + 40, 50, 70) / 100;
          break;
        case 'Declining':
          baseScore = 70 + variance - Math.floor(w * 1.5);
          rounds = Math.max(0, seededRandRange(seed + 10, 0, 2) - Math.floor(w / 4));
          diningVisits = Math.max(0, seededRandRange(seed + 15, 0, 2) - Math.floor(w / 6));
          diningSpend = Math.max(0, seededRandRange(seed + 20, 20, 80) - w * 3);
          events = w < 6 ? seededRandRange(seed + 30, 0, 1) : 0;
          emailRate = Math.max(0.05, (seededRandRange(seed + 40, 30, 50) - w * 2) / 100);
          break;
        case 'Ghost':
        default:
          baseScore = 12 + variance;
          rounds = seededRandRange(seed + 10, 0, 0);
          diningVisits = seededRandRange(seed + 15, 0, 1);
          diningSpend = seededRandRange(seed + 20, 0, 15);
          events = 0;
          emailRate = seededRandRange(seed + 40, 0, 10) / 100;
          break;
      }

      baseScore = Math.max(0, Math.min(100, baseScore));
      emailRate = Math.max(0, Math.min(1, emailRate));

      const rowId = `ew_${m.member_id}_${w}`;

      rows.push({
        row_id: rowId,
        member_id: m.member_id,
        week_number: w,
        week_start: weekStart,
        week_end: weekEnd,
        rounds_played: rounds,
        dining_visits: diningVisits,
        dining_spend: diningSpend,
        events_attended: events,
        email_open_rate: Math.round(emailRate * 100) / 100,
        engagement_score: baseScore,
      });
    }
  }
  return rows;
}

// ---------- email campaigns ----------

function generateCampaigns() {
  return CAMPAIGN_SUBJECTS.map((subject, i) => {
    const weekOffset = Math.floor(i / 2);
    const sendDate = addDays(getMonday(11 - weekOffset), seededRandRange(i * 3, 0, 4));
    return {
      campaign_id: `camp_${pad(i + 1, 3)}`,
      club_id: 'club_001',
      subject,
      type: pick(CAMPAIGN_TYPES, i * 7 + 1),
      send_date: isoDate(sendDate),
      recipient_count: 300,
      html_content_url: null,
    };
  });
}

// ---------- email events ----------

function generateEmailEvents(members, campaigns) {
  const rows = [];
  let eventCounter = 1;

  for (let mi = 0; mi < members.length; mi++) {
    const m = members[mi];
    let openRate;
    switch (m.archetype) {
      case 'Die-Hard Golfer': openRate = 0.55; break;
      case 'Balanced Active': openRate = 0.60; break;
      case 'Social Butterfly': openRate = 0.70; break;
      case 'Weekend Warrior': openRate = 0.45; break;
      case 'New Member': openRate = 0.75; break;
      case 'Snowbird': openRate = 0.55; break;
      case 'Declining': openRate = 0.25; break;
      case 'Ghost': openRate = 0.05; break;
      default: openRate = 0.50;
    }

    for (let ci = 0; ci < campaigns.length; ci++) {
      const seed = mi * 50 + ci;
      // Everyone gets a "sent" event
      const weekOffset = Math.floor(ci / 2);
      const sentDate = addDays(getMonday(11 - weekOffset), seededRandRange(seed, 0, 4));

      rows.push({
        event_id: `ee_${pad(eventCounter++, 5)}`,
        campaign_id: campaigns[ci].campaign_id,
        member_id: m.member_id,
        event_type: 'sent',
        occurred_at: isoDatetime(sentDate),
        link_clicked: null,
        device_type: null,
      });

      // Open?
      if (seededRand(seed + 999) < openRate) {
        const openDate = addDays(sentDate, seededRandRange(seed + 500, 0, 2));
        const deviceTypes = ['desktop', 'mobile', 'tablet'];
        rows.push({
          event_id: `ee_${pad(eventCounter++, 5)}`,
          campaign_id: campaigns[ci].campaign_id,
          member_id: m.member_id,
          event_type: 'opened',
          occurred_at: isoDatetime(openDate),
          link_clicked: null,
          device_type: pick(deviceTypes, seed + 700),
        });

        // Click? (30% of openers)
        if (seededRand(seed + 888) < 0.30) {
          rows.push({
            event_id: `ee_${pad(eventCounter++, 5)}`,
            campaign_id: campaigns[ci].campaign_id,
            member_id: m.member_id,
            event_type: 'clicked',
            occurred_at: isoDatetime(addDays(openDate, 0)),
            link_clicked: 'https://swoopgolf.com/promo',
            device_type: pick(deviceTypes, seed + 701),
          });
        }
      }
    }
  }
  return rows;
}

// ---------- event definitions ----------

function generateEventDefinitions() {
  const events = [];
  for (let i = 0; i < EVENT_NAMES.length; i++) {
    const daysAgo = seededRandRange(i * 7, 5, 85);
    const eventDate = addDays(getToday(), -daysAgo);
    events.push({
      event_id: `evt_${pad(i + 1, 3)}`,
      club_id: 'club_001',
      name: EVENT_NAMES[i],
      type: pick(EVENT_TYPES, i * 5 + 3),
      event_date: isoDate(eventDate),
      capacity: seededRandRange(i * 11 + 2, 20, 120),
      registration_fee: seededRandRange(i * 11 + 3, 0, 150),
      description: null,
    });
  }
  return events;
}

// ---------- event registrations ----------

function generateEventRegistrations(members, eventDefs) {
  const rows = [];
  let regCounter = 1;

  for (let mi = 0; mi < members.length; mi++) {
    const m = members[mi];
    let attendRate;
    switch (m.archetype) {
      case 'Social Butterfly': attendRate = 0.70; break;
      case 'Die-Hard Golfer': attendRate = 0.35; break;
      case 'Balanced Active': attendRate = 0.40; break;
      case 'Weekend Warrior': attendRate = 0.25; break;
      case 'New Member': attendRate = 0.45; break;
      case 'Snowbird': attendRate = 0.30; break;
      case 'Declining': attendRate = 0.15; break;
      case 'Ghost': attendRate = 0.03; break;
      default: attendRate = 0.30;
    }

    for (let ei = 0; ei < eventDefs.length; ei++) {
      const seed = mi * 30 + ei;
      if (seededRand(seed + 777) < attendRate) {
        const checkedIn = seededRand(seed + 666) < 0.85;
        const fee = seededRandRange(seed + 555, 0, 75);
        const guestCount = seededRandRange(seed + 444, 0, 3);
        // registered_at: a few days before the event
        const eventDateObj = new Date(eventDefs[ei].event_date + 'T00:00:00');
        const regDaysBefore = seededRandRange(seed + 333, 1, 14);
        const registeredAt = isoDatetime(addDays(eventDateObj, -regDaysBefore));
        rows.push({
          registration_id: `reg_${pad(regCounter++, 4)}`,
          event_id: eventDefs[ei].event_id,
          member_id: m.member_id,
          status: checkedIn ? 'attended' : 'registered',
          guest_count: guestCount,
          fee_paid: fee,
          registered_at: registeredAt,
          checked_in_at: checkedIn ? isoDatetime(new Date(eventDefs[ei].event_date + 'T10:00:00')) : null,
        });
      }
    }
  }
  return rows;
}

// ---------- visit sessions ----------

function generateVisitSessions(members) {
  const rows = [];
  let sessionCounter = 1;

  for (let mi = 0; mi < members.length; mi++) {
    const m = members[mi];
    let visitCount;
    switch (m.archetype) {
      case 'Die-Hard Golfer': visitCount = seededRandRange(mi * 3, 6, 8); break;
      case 'Balanced Active': visitCount = seededRandRange(mi * 3, 4, 7); break;
      case 'Social Butterfly': visitCount = seededRandRange(mi * 3, 5, 8); break;
      case 'Weekend Warrior': visitCount = seededRandRange(mi * 3, 3, 5); break;
      case 'New Member': visitCount = seededRandRange(mi * 3, 3, 6); break;
      case 'Snowbird': visitCount = seededRandRange(mi * 3, 4, 7); break;
      case 'Declining': visitCount = seededRandRange(mi * 3, 1, 3); break;
      case 'Ghost': visitCount = seededRandRange(mi * 3, 0, 1); break;
      default: visitCount = 3;
    }

    for (let v = 0; v < visitCount; v++) {
      const seed = mi * 20 + v;
      const daysAgo = seededRandRange(seed, 1, 83);
      const sessionDate = isoDate(addDays(getToday(), -daysAgo));
      const anchor = pick(ANCHOR_TYPES, seed + 100);
      const spend = seededRandRange(seed + 200, 20, 200);
      const activities = [];
      if (anchor === 'golf') activities.push('golf');
      if (seededRand(seed + 300) > 0.4) activities.push('dining');
      if (seededRand(seed + 400) > 0.7) activities.push('pro_shop');
      if (anchor === 'fitness') activities.push('fitness');

      const arrivalHour = seededRandRange(seed + 500, 6, 18);
      const arrivalMin = seededRandRange(seed + 501, 0, 59);
      const durationMin = seededRandRange(seed + 502, 30, 300);
      const arrivalDate = addDays(getToday(), -daysAgo);
      arrivalDate.setHours(arrivalHour, arrivalMin, 0);
      const departureDate = new Date(arrivalDate.getTime() + durationMin * 60000);

      const touchpoints = activities.length > 0 ? activities.length : 1;

      rows.push({
        session_id: `ses_${pad(sessionCounter++, 4)}`,
        member_id: m.member_id,
        session_date: sessionDate,
        anchor_type: anchor,
        arrival_time: isoDatetime(arrivalDate),
        departure_time: isoDatetime(departureDate),
        duration_minutes: durationMin,
        touchpoints,
        total_spend: spend,
        activities: JSON.stringify(activities),
      });
    }
  }
  return rows;
}

// ---------- POS checks ----------

function generatePosChecks(members) {
  const rows = [];
  let checkCounter = 1;

  for (let mi = 0; mi < members.length; mi++) {
    const m = members[mi];
    let checkCount;
    switch (m.archetype) {
      case 'Die-Hard Golfer': checkCount = seededRandRange(mi * 5, 6, 10); break;
      case 'Balanced Active': checkCount = seededRandRange(mi * 5, 5, 8); break;
      case 'Social Butterfly': checkCount = seededRandRange(mi * 5, 8, 14); break;
      case 'Weekend Warrior': checkCount = seededRandRange(mi * 5, 3, 6); break;
      case 'New Member': checkCount = seededRandRange(mi * 5, 3, 7); break;
      case 'Snowbird': checkCount = seededRandRange(mi * 5, 5, 9); break;
      case 'Declining': checkCount = seededRandRange(mi * 5, 1, 3); break;
      case 'Ghost': checkCount = seededRandRange(mi * 5, 0, 1); break;
      default: checkCount = 4;
    }

    for (let c = 0; c < checkCount; c++) {
      const seed = mi * 25 + c;
      const daysAgo = seededRandRange(seed + 50, 1, 83);
      const openedDate = addDays(getToday(), -daysAgo);
      const hour = seededRandRange(seed + 60, 7, 20);
      openedDate.setHours(hour, seededRandRange(seed + 61, 0, 59), 0);

      const subtotal = seededRandRange(seed + 70, 18, 180);
      const taxAmount = Math.round(subtotal * 0.085 * 100) / 100;
      const tipAmount = Math.round(subtotal * seededRandRange(seed + 71, 15, 25) / 100 * 100) / 100;
      const compAmount = seededRand(seed + 72) < 0.05 ? seededRandRange(seed + 73, 5, 30) : 0;
      const discountAmount = seededRand(seed + 74) < 0.1 ? seededRandRange(seed + 75, 5, 20) : 0;
      const voidAmount = seededRand(seed + 76) < 0.02 ? seededRandRange(seed + 77, 5, 25) : 0;
      const total = Math.round((subtotal + taxAmount + tipAmount - compAmount - discountAmount - voidAmount) * 100) / 100;

      const postRound = seededRand(seed + 80) < 0.3 ? 1 : 0;
      const linkedBooking = postRound ? `bkg_${pad(seededRandRange(seed + 90, 1, 500), 4)}` : null;
      const outletId = pick(OUTLET_IDS, seed + 95);
      const paymentMethod = pick(PAYMENT_METHODS, seed + 96);
      const isUnderstaffedDay = seededRand(seed + 97) < 0.12 ? 1 : 0;

      // closed_at: 30-90 min after opened
      const closedDate = new Date(openedDate.getTime() + seededRandRange(seed + 81, 30, 90) * 60000);
      // first_item_fired_at: 5-15 min after opened
      const firstItemDate = new Date(openedDate.getTime() + seededRandRange(seed + 82, 5, 15) * 60000);
      // last_item_fulfilled_at: 5-15 min before closed
      const lastItemDate = new Date(closedDate.getTime() - seededRandRange(seed + 83, 5, 15) * 60000);

      rows.push({
        check_id: `chk_${pad(checkCounter++, 5)}`,
        outlet_id: outletId,
        member_id: m.member_id,
        opened_at: isoDatetime(openedDate),
        closed_at: isoDatetime(closedDate),
        first_item_fired_at: isoDatetime(firstItemDate),
        last_item_fulfilled_at: isoDatetime(lastItemDate),
        subtotal,
        tax_amount: taxAmount,
        tip_amount: tipAmount,
        comp_amount: compAmount,
        discount_amount: discountAmount,
        void_amount: voidAmount,
        total: Math.max(0, total),
        payment_method: paymentMethod,
        post_round_dining: postRound,
        linked_booking_id: null,
        event_id: null,
        is_understaffed_day: isUnderstaffedDay,
      });
    }
  }
  return rows;
}

// ---------- feedback ----------

function generateFeedback(members) {
  const rows = [];
  let fbCounter = 1;

  for (let mi = 0; mi < members.length; mi++) {
    const seed = mi * 7 + 42;
    // ~12% of members have feedback
    if (seededRand(seed) > 0.12) continue;

    const daysAgo = seededRandRange(seed + 1, 1, 60);
    const submittedAt = addDays(getToday(), -daysAgo);
    const category = pick(FEEDBACK_CATEGORIES, seed + 2);
    const sentiment = -(seededRandRange(seed + 3, 10, 100) / 100);
    const status = pick(FEEDBACK_STATUSES, seed + 4);

    const descriptions = [
      `The ${category.replace('_', ' ')} needs significant improvement. I've been a member for years and this is disappointing.`,
      `Had an issue with ${category.replace('_', ' ')} last week. Would like management to address this promptly.`,
      `Concerned about declining ${category.replace('_', ' ')}. This affects my overall experience at the club.`,
      `${category.replace('_', ' ')} was below expectations during my recent visit. Please review.`,
      `Multiple members have mentioned ${category.replace('_', ' ')} concerns. Hope the board takes action.`,
    ];

    const isResolved = status === 'resolved';
    const resolvedAt = isResolved ? isoDatetime(addDays(submittedAt, seededRandRange(seed + 6, 1, 7))) : null;
    const isUnderstaffedDay = seededRand(seed + 7) < 0.12 ? 1 : 0;

    rows.push({
      feedback_id: `fb_${pad(fbCounter++, 3)}`,
      member_id: members[mi].member_id,
      club_id: 'club_001',
      submitted_at: isoDatetime(submittedAt),
      category,
      sentiment_score: Math.round(sentiment * 100) / 100,
      description: pick(descriptions, seed + 5),
      status,
      resolved_at: resolvedAt,
      is_understaffed_day: isUnderstaffedDay,
    });
  }
  return rows;
}

// ---------- bookings ----------

function generateBookings(members) {
  const rows = [];
  let bkgCounter = 1;

  for (let mi = 0; mi < members.length; mi++) {
    const m = members[mi];
    let weeklyRate;
    switch (m.archetype) {
      case 'Die-Hard Golfer': weeklyRate = 2.5; break;
      case 'Balanced Active': weeklyRate = 1.2; break;
      case 'Social Butterfly': weeklyRate = 0.3; break;
      case 'Weekend Warrior': weeklyRate = 1.0; break;
      case 'New Member': weeklyRate = 1.0; break;
      case 'Snowbird': weeklyRate = 2.0; break;
      case 'Declining': weeklyRate = 0.5; break;
      case 'Ghost': weeklyRate = 0.05; break;
      default: weeklyRate = 1.0;
    }

    const totalBookings = Math.round(weeklyRate * 12);
    for (let b = 0; b < totalBookings; b++) {
      const seed = mi * 40 + b;
      const daysAgo = seededRandRange(seed, 1, 83);
      const bookingDate = addDays(getToday(), -daysAgo);

      // Weekend Warriors play on weekends
      if (m.archetype === 'Weekend Warrior') {
        const dow = bookingDate.getDay();
        if (dow !== 0 && dow !== 6) {
          bookingDate.setDate(bookingDate.getDate() + (6 - dow)); // push to Saturday
        }
      }

      const hour = seededRandRange(seed + 10, 6, 16);
      const minute = pick([0, 10, 20, 30, 40, 50], seed + 11);
      const teeTime = `${pad(hour)}:${pad(minute)}`;
      const playerCount = seededRandRange(seed + 12, 1, 4);
      const hasGuest = seededRand(seed + 13) < 0.25 ? 1 : 0;
      const transportation = pick(TRANSPORTATION, seed + 14);
      const hasCaddie = seededRand(seed + 15) < 0.1 ? 1 : 0;
      const roundType = pick(ROUND_TYPES, seed + 16);
      const statusVal = seededRand(seed + 17) < 0.9 ? 'confirmed' : 'cancelled';

      // Times for completed rounds
      const checkedIn = statusVal === 'confirmed' && seededRand(seed + 18) < 0.85;
      let checkInTime = null;
      let roundStart = null;
      let roundEnd = null;
      let durationMinutes = null;
      if (checkedIn) {
        const baseDate = new Date(isoDate(bookingDate) + `T${teeTime}:00`);
        checkInTime = isoDatetime(new Date(baseDate.getTime() - seededRandRange(seed + 19, 10, 30) * 60000));
        roundStart = isoDatetime(baseDate);
        const dur = roundType === '9' ? seededRandRange(seed + 20, 110, 160) : seededRandRange(seed + 20, 220, 320);
        durationMinutes = dur;
        roundEnd = isoDatetime(new Date(baseDate.getTime() + dur * 60000));
      }

      rows.push({
        booking_id: `bkg_${pad(bkgCounter++, 4)}`,
        club_id: 'club_001',
        course_id: 'course_main',
        booking_date: isoDate(bookingDate),
        tee_time: teeTime,
        player_count: playerCount,
        has_guest: hasGuest,
        transportation,
        has_caddie: hasCaddie,
        round_type: roundType,
        status: statusVal,
        check_in_time: checkInTime,
        round_start: roundStart,
        round_end: roundEnd,
        duration_minutes: durationMinutes,
      });
    }
  }
  return rows;
}

// ---------- close-outs (84 days) ----------

function generateCloseOuts() {
  const rows = [];

  for (let d = 83; d >= 0; d--) {
    const date = addDays(getToday(), -d);
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const seed = d * 13;

    const golfRevenue = isWeekend ? seededRandRange(seed, 7000, 12000) : seededRandRange(seed, 3000, 7000);
    const fbRevenue = isWeekend ? seededRandRange(seed + 1, 4000, 8000) : seededRandRange(seed + 1, 1500, 4500);

    const weatherSeed = seededRand(seed + 99);
    let weather;
    if (weatherSeed < 0.4) weather = 'sunny';
    else if (weatherSeed < 0.7) weather = 'clear';
    else if (weatherSeed < 0.85) weather = 'partly_cloudy';
    else if (weatherSeed < 0.92) weather = 'windy';
    else weather = 'rain';

    // Rain days lower revenue
    const rainFactor = weather === 'rain' ? 0.5 : 1.0;
    const isUnderstaffed = seededRand(seed + 50) < 0.12 ? 1 : 0;

    const finalGolf = Math.round(golfRevenue * rainFactor);
    const finalFb = Math.round(fbRevenue * (weather === 'rain' ? 1.2 : 1.0));
    const totalRevenue = finalGolf + finalFb;
    const roundsPlayed = isWeekend ? seededRandRange(seed + 2, 60, 120) : seededRandRange(seed + 2, 20, 60);
    const covers = isWeekend ? seededRandRange(seed + 3, 80, 200) : seededRandRange(seed + 3, 30, 100);

    rows.push({
      closeout_id: `co_${pad(84 - d, 3)}`,
      club_id: 'club_001',
      date: isoDate(date),
      golf_revenue: finalGolf,
      fb_revenue: finalFb,
      total_revenue: totalRevenue,
      rounds_played: roundsPlayed,
      covers,
      weather,
      is_understaffed: isUnderstaffed,
    });
  }
  return rows;
}

// ---------- pace of play ----------

function generatePaceOfPlay(bookings) {
  const rows = [];
  let paceCounter = 1;
  // ~65% of bookings have pace data
  for (let i = 0; i < bookings.length; i++) {
    const seed = i * 11 + 7;
    if (seededRand(seed) > 0.65) continue;

    const totalMinutes = seededRandRange(seed + 1, 220, 320);
    const isSlowRound = totalMinutes > 270 ? 1 : 0;
    const groupsPassed = seededRandRange(seed + 2, 0, 3);
    const rangerInterventions = isSlowRound ? seededRandRange(seed + 3, 0, 2) : 0;

    rows.push({
      pace_id: `pace_${pad(paceCounter++, 4)}`,
      booking_id: bookings[i].booking_id,
      total_minutes: totalMinutes,
      is_slow_round: isSlowRound,
      groups_passed: groupsPassed,
      ranger_interventions: rangerInterventions,
    });
  }
  return rows;
}

// ---------- pace hole segments ----------

function generatePaceHoleSegments(paceRows) {
  const rows = [];
  let segCounter = 1;
  for (let pi = 0; pi < paceRows.length; pi++) {
    const avgPerHole = paceRows[pi].total_minutes / 18;
    for (let hole = 1; hole <= 18; hole++) {
      const seed = pi * 18 + hole;
      const segMin = Math.round(avgPerHole + seededRandRange(seed, -4, 4));
      const isBottleneck = segMin > (avgPerHole + 3) ? 1 : 0;

      // Generate tee_time and green_time for the segment
      // Approximate: tee time = round start + cumulative minutes
      const cumulativeMin = Math.round(avgPerHole * (hole - 1));
      const segDate = new Date('2026-03-01T07:00:00');
      const teeTimeDate = new Date(segDate.getTime() + cumulativeMin * 60000);
      const greenTimeDate = new Date(teeTimeDate.getTime() + Math.max(8, segMin) * 60000);

      rows.push({
        segment_id: `seg_${pad(segCounter++, 5)}`,
        pace_id: paceRows[pi].pace_id,
        hole_number: hole,
        tee_time: isoDatetime(teeTimeDate),
        green_time: isoDatetime(greenTimeDate),
        segment_minutes: Math.max(8, segMin),
        is_bottleneck: isBottleneck,
      });
    }
  }
  return rows;
}

// ---------- weather daily (84 days) ----------

function generateWeatherDaily() {
  const rows = [];
  let weatherCounter = 1;
  for (let d = 83; d >= 0; d--) {
    const date = addDays(getToday(), -d);
    const seed = d * 17 + 3;
    const month = date.getMonth(); // 0-based

    // Arizona temps by month (Dec=11, Jan=0, Feb=1, Mar=2)
    let highBase, lowBase;
    if (month === 11 || month === 0) { highBase = 66; lowBase = 42; }
    else if (month === 1) { highBase = 70; lowBase = 45; }
    else if (month === 2) { highBase = 78; lowBase = 50; }
    else { highBase = 85; lowBase = 58; }

    const tempHigh = highBase + seededRandRange(seed, -5, 8);
    const tempLow = lowBase + seededRandRange(seed + 1, -4, 6);

    const condSeed = seededRand(seed + 2);
    let condition;
    if (condSeed < 0.45) condition = 'sunny';
    else if (condSeed < 0.70) condition = 'clear';
    else if (condSeed < 0.82) condition = 'partly_cloudy';
    else if (condSeed < 0.90) condition = 'windy';
    else if (condSeed < 0.95) condition = 'overcast';
    else condition = 'rain';

    const precipitationIn = condition === 'rain' ? seededRandRange(seed + 3, 1, 8) / 10 : 0;
    const windMph = condition === 'windy' ? seededRandRange(seed + 4, 15, 35) : seededRandRange(seed + 4, 0, 12);

    // Demand modifiers: rain/wind lower golf demand, rain boosts F&B
    let golfDemandMod = 0;
    let fbDemandMod = 0;
    if (condition === 'rain') { golfDemandMod = -0.4; fbDemandMod = 0.2; }
    else if (condition === 'windy') { golfDemandMod = -0.15; fbDemandMod = 0.05; }
    else if (condition === 'sunny' || condition === 'clear') { golfDemandMod = 0.1; fbDemandMod = 0; }

    rows.push({
      weather_id: `wx_${pad(weatherCounter++, 3)}`,
      date: isoDate(date),
      condition,
      temp_high: tempHigh,
      temp_low: tempLow,
      wind_mph: windMph,
      precipitation_in: precipitationIn,
      golf_demand_modifier: golfDemandMod,
      fb_demand_modifier: fbDemandMod,
    });
  }
  return rows;
}

// ---------- waitlist entries ----------

function generateWaitlistEntries() {
  const rows = [];
  let entryCounter = 1;
  for (let d = 83; d >= 0; d--) {
    const date = addDays(getToday(), -d);
    const dow = date.getDay();
    const seed = d * 19 + 11;

    // Only weekends and some weekdays have waitlist pressure
    if (dow !== 0 && dow !== 6 && seededRand(seed) > 0.3) continue;

    const peakSlot = seededRand(seed + 1) < 0.7;
    const waitlistCount = peakSlot
      ? seededRandRange(seed + 2, 3, 12)
      : seededRandRange(seed + 2, 0, 4);
    const hasEventOverlap = seededRand(seed + 3) < 0.2 ? 1 : 0;
    const requestedTeeTime = `${pad(seededRandRange(seed + 4, 6, 11))}:${pad(pick([0, 10, 20, 30, 40, 50], seed + 5))}`;

    rows.push({
      entry_id: `wl_${pad(entryCounter++, 3)}`,
      club_id: 'club_001',
      course_id: 'course_main',
      requested_date: isoDate(date),
      requested_tee_time: requestedTeeTime,
      waitlist_count: waitlistCount,
      has_event_overlap: hasEventOverlap,
      peak_slot: peakSlot ? 'morning' : null,
    });
  }
  return rows;
}

// ---------- batch insert helper ----------

function buildBatchInsert(table, columns, rows, batchSize = 100) {
  const statements = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = batch.map(row => {
      const vals = columns.map(col => {
        const v = row[col];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'boolean') return v ? '1' : '0';
        if (typeof v === 'number') return String(v);
        // Escape single quotes
        return `'${String(v).replace(/'/g, "''")}'`;
      });
      return `(${vals.join(',')})`;
    });
    statements.push(`INSERT INTO ${table} (${columns.join(',')}) VALUES ${values.join(',')}`);
  }
  return statements;
}

// ---------- main handler ----------

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG) return res.status(403).json({ error: 'Disabled in production' });
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const startTime = Date.now();
    const summary = {};

    // 1. TRUNCATE all tables (CASCADE handles FK dependencies)
    await sql.query(`
      TRUNCATE TABLE
        pace_hole_segments,
        pace_of_play,
        pos_checks,
        visit_sessions,
        event_registrations,
        event_definitions,
        email_events,
        email_campaigns,
        feedback,
        member_engagement_weekly,
        bookings,
        close_outs,
        weather_daily,
        waitlist_entries,
        members
      CASCADE
    `);

    // 1b. Seed parent/lookup tables that have FK constraints
    // dining_outlets
    await sql.query(`DELETE FROM dining_outlets`).catch(() => {});
    await sql.query(`
      INSERT INTO dining_outlets (outlet_id, club_id, name, type, meal_periods, weekday_covers, weekend_covers) VALUES
        ('outlet_grill', 'club_001', 'The Grill Room', 'casual', 'lunch,dinner', 80, 120),
        ('outlet_bar', 'club_001', 'The 19th Hole Bar', 'bar', 'lunch,dinner', 60, 90),
        ('outlet_dining', 'club_001', 'The Veranda', 'fine_dining', 'dinner', 40, 70)
      ON CONFLICT (outlet_id) DO NOTHING
    `).catch(() => {});
    summary.dining_outlets = 3;

    // courses
    await sql.query(`DELETE FROM courses`).catch(() => {});
    await sql.query(`
      INSERT INTO courses (course_id, club_id, name, holes, par, tee_interval_min, first_tee, last_tee) VALUES
        ('course_main', 'club_001', 'Championship Course', 18, 72, 10, '06:30', '15:00')
      ON CONFLICT (course_id) DO NOTHING
    `).catch(() => {});
    summary.courses = 1;

    // clubs (if exists)
    await sql.query(`
      INSERT INTO club (club_id, name, city, state, zip) VALUES ('club_001', 'Oakmont Hills Country Club', 'Scottsdale', 'AZ', '85255')
      ON CONFLICT (club_id) DO NOTHING
    `).catch(() => {});

    // 2. Generate all data
    const members = generateMembers();
    const engagementWeekly = generateEngagementWeekly(members);
    const campaigns = generateCampaigns();
    const emailEvents = generateEmailEvents(members, campaigns);
    const eventDefs = generateEventDefinitions();
    const eventRegistrations = generateEventRegistrations(members, eventDefs);
    const visitSessions = generateVisitSessions(members);
    const posChecks = generatePosChecks(members);
    const feedbackRows = generateFeedback(members);
    const bookings = generateBookings(members);
    const closeOuts = generateCloseOuts();
    const paceOfPlay = generatePaceOfPlay(bookings);
    const paceHoleSegments = generatePaceHoleSegments(paceOfPlay);
    const weatherDaily = generateWeatherDaily();
    const waitlistEntries = generateWaitlistEntries();

    // 3. Insert members
    const memberCols = ['member_id','member_number','first_name','last_name','email','phone','date_of_birth','gender','membership_type','membership_status','join_date','resigned_on','household_id','archetype','annual_dues','account_balance','ghin_number','communication_opt_in'];
    for (const stmt of buildBatchInsert('members', memberCols, members, 50)) {
      await sql.query(stmt);
    }
    summary.members = members.length;

    // 4. Insert engagement weekly
    const engCols = ['row_id','member_id','week_number','week_start','week_end','rounds_played','dining_visits','dining_spend','events_attended','email_open_rate','engagement_score'];
    for (const stmt of buildBatchInsert('member_engagement_weekly', engCols, engagementWeekly, 200)) {
      await sql.query(stmt);
    }
    summary.member_engagement_weekly = engagementWeekly.length;

    // 5. Insert email campaigns
    const campCols = ['campaign_id','club_id','subject','type','send_date','recipient_count','html_content_url'];
    for (const stmt of buildBatchInsert('email_campaigns', campCols, campaigns, 20)) {
      await sql.query(stmt);
    }
    summary.email_campaigns = campaigns.length;

    // 6. Insert email events
    const eeCols = ['event_id','campaign_id','member_id','event_type','occurred_at','link_clicked','device_type'];
    for (const stmt of buildBatchInsert('email_events', eeCols, emailEvents, 200)) {
      await sql.query(stmt);
    }
    summary.email_events = emailEvents.length;

    // 7. Insert event definitions
    const edCols = ['event_id','club_id','name','type','event_date','capacity','registration_fee','description'];
    for (const stmt of buildBatchInsert('event_definitions', edCols, eventDefs, 15)) {
      await sql.query(stmt);
    }
    summary.event_definitions = eventDefs.length;

    // 8. Insert event registrations
    const erCols = ['registration_id','event_id','member_id','status','guest_count','fee_paid','registered_at','checked_in_at'];
    for (const stmt of buildBatchInsert('event_registrations', erCols, eventRegistrations, 100)) {
      await sql.query(stmt);
    }
    summary.event_registrations = eventRegistrations.length;

    // 9. Insert visit sessions
    const vsCols = ['session_id','member_id','session_date','anchor_type','arrival_time','departure_time','duration_minutes','touchpoints','total_spend','activities'];
    for (const stmt of buildBatchInsert('visit_sessions', vsCols, visitSessions, 100)) {
      await sql.query(stmt);
    }
    summary.visit_sessions = visitSessions.length;

    // 10. Insert POS checks
    const posCols = ['check_id','outlet_id','member_id','opened_at','closed_at','first_item_fired_at','last_item_fulfilled_at','subtotal','tax_amount','tip_amount','comp_amount','discount_amount','void_amount','total','payment_method','post_round_dining','linked_booking_id','event_id','is_understaffed_day'];
    for (const stmt of buildBatchInsert('pos_checks', posCols, posChecks, 100)) {
      await sql.query(stmt);
    }
    summary.pos_checks = posChecks.length;

    // 11. Insert feedback
    const fbCols = ['feedback_id','member_id','club_id','submitted_at','category','sentiment_score','description','status','resolved_at','is_understaffed_day'];
    for (const stmt of buildBatchInsert('feedback', fbCols, feedbackRows, 50)) {
      await sql.query(stmt);
    }
    summary.feedback = feedbackRows.length;

    // 12. Insert bookings
    const bkgCols = ['booking_id','club_id','course_id','booking_date','tee_time','player_count','has_guest','transportation','has_caddie','round_type','status','check_in_time','round_start','round_end','duration_minutes'];
    for (const stmt of buildBatchInsert('bookings', bkgCols, bookings, 100)) {
      await sql.query(stmt);
    }
    summary.bookings = bookings.length;

    // 13. Insert close-outs
    const coCols = ['closeout_id','club_id','date','golf_revenue','fb_revenue','total_revenue','rounds_played','covers','weather','is_understaffed'];
    for (const stmt of buildBatchInsert('close_outs', coCols, closeOuts, 84)) {
      await sql.query(stmt);
    }
    summary.close_outs = closeOuts.length;

    // 14. Insert pace of play
    const popCols = ['pace_id','booking_id','total_minutes','is_slow_round','groups_passed','ranger_interventions'];
    for (const stmt of buildBatchInsert('pace_of_play', popCols, paceOfPlay, 100)) {
      await sql.query(stmt);
    }
    summary.pace_of_play = paceOfPlay.length;

    // 15. Insert pace hole segments
    const phsCols = ['segment_id','pace_id','hole_number','tee_time','green_time','segment_minutes','is_bottleneck'];
    for (const stmt of buildBatchInsert('pace_hole_segments', phsCols, paceHoleSegments, 200)) {
      await sql.query(stmt);
    }
    summary.pace_hole_segments = paceHoleSegments.length;

    // 16. Insert weather daily
    const wdCols = ['weather_id','date','condition','temp_high','temp_low','wind_mph','precipitation_in','golf_demand_modifier','fb_demand_modifier'];
    for (const stmt of buildBatchInsert('weather_daily', wdCols, weatherDaily, 84)) {
      await sql.query(stmt);
    }
    summary.weather_daily = weatherDaily.length;

    // 17. Insert waitlist entries
    const wlCols = ['entry_id','club_id','course_id','requested_date','requested_tee_time','waitlist_count','has_event_overlap','peak_slot'];
    for (const stmt of buildBatchInsert('waitlist_entries', wlCols, waitlistEntries, 50)) {
      await sql.query(stmt);
    }
    summary.waitlist_entries = waitlistEntries.length;

    const elapsed = Date.now() - startTime;
    const totalRows = Object.values(summary).reduce((a, b) => a + b, 0);

    return res.status(200).json({
      success: true,
      message: `Seeded ${totalRows.toLocaleString()} rows across ${Object.keys(summary).length} tables in ${elapsed}ms`,
      elapsed_ms: elapsed,
      tables: summary,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
