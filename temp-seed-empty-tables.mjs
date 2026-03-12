import { sql } from "@vercel/postgres";

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const BATCH = 200;

async function batchInsert(table, columns, rows) {
  const colStr = columns.join(",");
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await sql.query(`INSERT INTO ${table} (${colStr}) VALUES ${batch.join(",")}`);
  }
}

async function seed() {
  // =====================================================
  // 1. pos_line_items from pos_checks
  // =====================================================
  console.log("Seeding pos_line_items...");
  const checks = await sql`SELECT check_id, subtotal, opened_at FROM pos_checks ORDER BY check_id`;

  const foodItems = [
    "Grilled Salmon","Caesar Salad","Club Sandwich","Filet Mignon","Lobster Tail",
    "Cobb Salad","Chicken Parmigiana","Shrimp Scampi","NY Strip Steak","Tuna Tartare",
    "French Onion Soup","Wagyu Burger","Grilled Chicken","Pan-Seared Sea Bass",
    "Caprese Salad","BLT Wrap","Pulled Pork Sliders","Fish Tacos","Mushroom Risotto",
    "Braised Short Ribs","Crab Cake","Charcuterie Board","Wings Basket","Turkey Club",
    "Wedge Salad","Loaded Nachos","Hot Dog","Cheese Pizza","Garden Salad"
  ];
  const bevItems = [
    "Craft IPA Draft","Chardonnay Glass","Cabernet Glass","Pinot Noir Glass",
    "Margarita","Old Fashioned","Moscow Mule","Aperol Spritz","Modelo Draft",
    "Iced Tea","Arnold Palmer","Espresso","Cappuccino","Sparkling Water",
    "Coors Light Draft","Michelob Ultra","Bloody Mary","Mimosa","Paloma",
    "Ranch Water","Whiskey Sour","Gin and Tonic","Corona","Sauvignon Blanc"
  ];
  const foodPrices = [32,16.5,18,52,48,19,24,28,45,22,12,21,19,38,15,16,17,20,26,34,28,24,16,18,14,17,9,16,12];
  const bevPrices = [9,14,16,15,14,15,13,14,8,4,5,5,6,4,7,7,14,12,13,12,14,12,8,13];

  let liCount = 0;
  const liRows = [];

  for (let i = 0; i < checks.rows.length; i++) {
    const chk = checks.rows[i];
    const subtotal = parseFloat(chk.subtotal) || 50;
    const numItems = Math.max(1, Math.min(6, Math.round(subtotal / 25)));
    const openedAt = chk.opened_at || "2026-03-08T12:00:00Z";

    for (let j = 0; j < numItems; j++) {
      liCount++;
      const r = seededRandom(i * 10 + j);
      const isFood = r > 0.35;
      const items = isFood ? foodItems : bevItems;
      const prices = isFood ? foodPrices : bevPrices;
      const idx = Math.floor(seededRandom(i * 10 + j + 1000) * items.length);
      const itemName = items[idx];
      const category = isFood ? "food" : "beverage";
      const qty = isFood ? 1 : Math.ceil(seededRandom(i * 10 + j + 2000) * 2);
      const unitPrice = prices[idx] || 15;
      const lineTotal = Math.round(unitPrice * qty * 100) / 100;
      const isVoid = seededRandom(i * 10 + j + 3000) < 0.02 ? 1 : 0;
      const isComp = isVoid === 0 && seededRandom(i * 10 + j + 4000) < 0.03 ? 1 : 0;
      // fired_at = a few min after opened_at
      const firedDate = new Date(new Date(openedAt).getTime() + (j * 3 + 2) * 60000);
      const firedAt = firedDate.toISOString();

      liRows.push(`('li_${String(liCount).padStart(6,"0")}','${chk.check_id}','${itemName}','${category}',${unitPrice},${qty},${lineTotal},${isComp},${isVoid},'${firedAt}')`);
    }
  }
  await batchInsert("pos_line_items", ["line_item_id","check_id","item_name","category","unit_price","quantity","line_total","is_comp","is_void","fired_at"], liRows);
  console.log(`  pos_line_items: ${liCount} rows`);

  // =====================================================
  // 2. pos_payments — one per check
  // =====================================================
  console.log("Seeding pos_payments...");
  const checksForPay = await sql`SELECT check_id, total, closed_at, payment_method FROM pos_checks ORDER BY check_id`;

  let payCount = 0;
  const payRows = [];

  for (let i = 0; i < checksForPay.rows.length; i++) {
    const chk = checksForPay.rows[i];
    payCount++;
    const method = chk.payment_method || "member_charge";
    const processedAt = chk.closed_at || "2026-03-08T12:00:00Z";
    const isSplit = seededRandom(i * 3) < 0.08 ? 1 : 0;

    payRows.push(`('pay_${String(payCount).padStart(6,"0")}','${chk.check_id}','${method}',${chk.total},'${processedAt}',${isSplit})`);
  }
  await batchInsert("pos_payments", ["payment_id","check_id","payment_method","amount","processed_at","is_split"], payRows);
  console.log(`  pos_payments: ${payCount} rows`);

  // =====================================================
  // 3. service_requests
  // =====================================================
  console.log("Seeding service_requests...");
  const activeMembers = await sql`SELECT member_id FROM members WHERE membership_status = 'active' ORDER BY member_id LIMIT 120`;
  const bookingsList = await sql`SELECT booking_id FROM bookings ORDER BY booking_id LIMIT 200`;

  const requestTypes = ["forecaddie", "cart_cooler", "locker_issue", "dining_reservation", "range_setup", "club_repair", "tee_time_change", "guest_pass", "event_rsvp", "lesson_booking", "lost_found", "maintenance"];
  const resolutionNotes = [
    "Resolved same day", "Assigned to maintenance crew", "Forwarded to golf ops manager",
    "Completed — member notified via app", "Parts ordered, ETA 2 days",
    "Resolved by front desk", "Chef confirmed dietary accommodations",
    "Pro shop handled directly", "Maintenance completed before opening",
    "Follow-up call scheduled", "Resolved during shift", "Escalated to GM"
  ];

  let srCount = 0;
  const srRows = [];

  for (let i = 0; i < 200; i++) {
    srCount++;
    const memberIdx = Math.floor(seededRandom(i * 7) * activeMembers.rows.length);
    const member = activeMembers.rows[memberIdx];
    const bookingIdx = Math.floor(seededRandom(i * 7 + 1) * bookingsList.rows.length);
    const booking = seededRandom(i * 7 + 10) < 0.4 ? bookingsList.rows[bookingIdx] : null;
    const typeIdx = Math.floor(seededRandom(i * 7 + 2) * requestTypes.length);
    const reqType = requestTypes[typeIdx];

    const dayOffset = Math.floor(seededRandom(i * 7 + 3) * 30);
    const hour = 7 + Math.floor(seededRandom(i * 7 + 4) * 12);
    const min = Math.floor(seededRandom(i * 7 + 5) * 60);
    const requestedDate = new Date(2026, 1, 9 + dayOffset, hour, min);
    const requestedAt = requestedDate.toISOString();

    const responseTimeMin = 5 + Math.floor(seededRandom(i * 7 + 6) * 120);
    const isResolved = seededRandom(i * 7 + 7) < 0.75;
    const resolvedAt = isResolved ? new Date(requestedDate.getTime() + responseTimeMin * 60000).toISOString() : null;
    const noteIdx = Math.floor(seededRandom(i * 7 + 8) * resolutionNotes.length);
    const notes = isResolved ? resolutionNotes[noteIdx] : null;
    const isUnderstaffed = seededRandom(i * 7 + 9) < 0.15 ? 1 : 0;
    const bookingId = booking ? `'${booking.booking_id}'` : "null";
    const resolvedStr = resolvedAt ? `'${resolvedAt}'` : "null";
    const notesStr = notes ? `'${notes.replace(/'/g, "''")}'` : "null";

    srRows.push(`('sr_${String(srCount).padStart(4,"0")}','${member.member_id}',${bookingId},'${reqType}','${requestedAt}',${responseTimeMin},${resolvedStr},${notesStr},${isUnderstaffed})`);
  }
  await batchInsert("service_requests", ["request_id","member_id","booking_id","request_type","requested_at","response_time_min","resolved_at","resolution_notes","is_understaffed_day"], srRows);
  console.log(`  service_requests: ${srCount} rows`);

  // =====================================================
  // 4. member_engagement_daily — 300 members x 30 days
  // =====================================================
  console.log("Seeding member_engagement_daily...");
  const allMembers = await sql`SELECT member_id, membership_type, archetype, current_health_score FROM members ORDER BY member_id`;

  let edCount = 0;
  const edRows = [];

  for (let m = 0; m < allMembers.rows.length; m++) {
    const member = allMembers.rows[m];
    const healthBase = parseInt(member.current_health_score) || 70;
    const isGolfer = member.membership_type === "FG" || member.membership_type === "SPT";
    const archetype = member.archetype || "Balanced";

    for (let d = 0; d < 30; d++) {
      const date = new Date(2026, 1, 9 + d);
      const dateStr = date.toISOString().split("T")[0];
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const r1 = seededRandom(m * 1000 + d * 10 + 1);
      const r2 = seededRandom(m * 1000 + d * 10 + 2);
      const r3 = seededRandom(m * 1000 + d * 10 + 3);
      const r4 = seededRandom(m * 1000 + d * 10 + 4);
      const r5 = seededRandom(m * 1000 + d * 10 + 5);
      const r6 = seededRandom(m * 1000 + d * 10 + 6);

      const golfProb = isGolfer ? (isWeekend ? 0.35 : 0.15) : 0.02;
      const roundsPlayed = r1 < golfProb ? 1 : 0;

      const dineProb = archetype === "Social Butterfly" ? 0.4 : archetype === "Die-Hard Golfer" ? 0.25 : 0.2;
      const diningChecks = r2 < dineProb ? (r3 < 0.15 ? 2 : 1) : 0;
      const diningSpend = diningChecks > 0 ? Math.round((30 + r3 * 200) * diningChecks * 100) / 100 : 0;

      const eventsAttended = r4 < 0.04 ? 1 : 0;
      const emailsOpened = r5 < (healthBase > 80 ? 0.5 : healthBase > 60 ? 0.3 : 0.1) ? (r6 < 0.2 ? 2 : 1) : 0;
      const feedbackSubmitted = seededRandom(m * 1000 + d * 10 + 7) < 0.02 ? 1 : 0;
      const visitFlag = (roundsPlayed > 0 || diningChecks > 0 || eventsAttended > 0) ? 1 : 0;

      // Skip fully empty days
      if (roundsPlayed === 0 && diningChecks === 0 && eventsAttended === 0 && emailsOpened === 0 && feedbackSubmitted === 0 && visitFlag === 0) {
        continue;
      }

      edCount++;
      edRows.push(`('ed_${String(edCount).padStart(6,"0")}','${member.member_id}','${dateStr}',${roundsPlayed},${diningChecks},${diningSpend},${eventsAttended},${emailsOpened},${feedbackSubmitted},${visitFlag})`);
    }
  }
  await batchInsert("member_engagement_daily", ["row_id","member_id","date","rounds_played","dining_checks","dining_spend","events_attended","emails_opened","feedback_submitted","visit_flag"], edRows);
  console.log(`  member_engagement_daily: ${edCount} rows`);

  console.log("\nAll 4 tables seeded successfully!");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
