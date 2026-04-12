/**
 * POST /api/agents/arrival-trigger
 *
 * Arrival Anticipation Engine — generates role-specific staff briefs
 * for an upcoming member tee time.
 *
 * Body: { member_id, tee_time, course, club_id }
 *
 * Loads member profile, preferences, recent visits, POS history,
 * open complaints, booking details, and pace data, then either
 * calls the managed arrival-anticipation agent or generates a
 * simulated response with 3 role-specific briefs.
 *
 * Briefs are stored in staff_briefs (created if not exists).
 */
import { sql } from '@vercel/postgres';
import { withAuth, getWriteClubId } from '../lib/withAuth.js';
import { createManagedSession, sendSessionEvent } from './managed-config.js';
import { logError } from '../lib/logger.js';
import { checkDataAvailable, TRIGGER_REQUIREMENTS } from './data-availability-check.js';
import { realAgentCall } from './real-agent-call.js';

const SIMULATION_MODE = !process.env.ANTHROPIC_API_KEY || !process.env.MANAGED_ENV_ID || !process.env.MANAGED_AGENT_ID;

async function arrivalHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getWriteClubId(req);
  const { member_id, tee_time, course } = req.body;

  if (!member_id || !tee_time) {
    return res.status(400).json({ error: 'member_id and tee_time are required' });
  }

  const gate = await checkDataAvailable(clubId, TRIGGER_REQUIREMENTS['arrival-trigger']);
  if (!gate.ok) {
    return res.status(200).json({ triggered: false, reason: gate.reason, missing: gate.missing });
  }

  if (SIMULATION_MODE) {
    try {
      const { rows: memRows } = await sql`
        SELECT first_name, last_name, annual_dues, archetype, membership_type
        FROM members WHERE member_id = ${member_id} AND club_id = ${clubId}
      `;
      const m = memRows[0] || {};
      await realAgentCall({
        clubId,
        agentId: 'arrival-anticipation',
        actionType: 'arrival_brief',
        memberId: member_id,
        systemPrompt: `You are the Arrival Anticipation agent for a private golf and country club. A high-value member has a tee time today. Recommend ONE concrete pre-arrival preparation step the staff should take in the next 30 minutes. Reference the member's archetype, dues tier, and tee time. Be specific (which staff role, what to prepare).`,
        contextData: {
          member: { name: `${m.first_name || ''} ${m.last_name || ''}`.trim(), annual_dues: m.annual_dues, archetype: m.archetype, membership_type: m.membership_type },
          tee_time, course: course || null,
        },
      });
    } catch (err) {
      console.warn('[arrival-trigger] real agent call failed:', err.message);
    }
  }

  try {
    // Ensure staff_briefs table exists
    await sql`
      CREATE TABLE IF NOT EXISTS staff_briefs (
        brief_id      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        club_id       TEXT NOT NULL,
        member_id     TEXT NOT NULL,
        tee_time      TEXT NOT NULL,
        role          TEXT NOT NULL,
        brief_text    TEXT NOT NULL,
        priority      TEXT DEFAULT 'normal',
        generated_at  TIMESTAMPTZ DEFAULT NOW(),
        read_at       TIMESTAMPTZ
      )
    `;

    // 1. Load member profile
    const { rows: [member] } = await sql`
      SELECT m.member_id, m.first_name, m.last_name, m.membership_type,
             m.annual_dues, m.household_id, m.archetype, m.email, m.phone,
             m.health_score, m.health_tier,
             h.member_count AS household_count, h.address
      FROM members m
      LEFT JOIN households h ON m.household_id = h.household_id
      WHERE m.member_id = ${member_id} AND m.club_id = ${clubId}
    `;
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // 2. Load member preferences (concierge session cache)
    let preferences = {};
    try {
      const { rows: [prefRow] } = await sql`
        SELECT preferences_cache FROM member_concierge_sessions
        WHERE member_id = ${member_id} AND club_id = ${clubId}
      `;
      if (prefRow?.preferences_cache) {
        preferences = typeof prefRow.preferences_cache === 'string'
          ? JSON.parse(prefRow.preferences_cache)
          : prefRow.preferences_cache;
      }
    } catch { /* no preferences available */ }

    // 3. Load last 5 visits (bookings with check-in)
    const { rows: recentVisits } = await sql`
      SELECT b.booking_date, b.tee_time, b.transportation, b.duration_minutes,
             b.round_type, c.name AS course_name
      FROM bookings b
      JOIN booking_players bp ON b.booking_id = bp.booking_id
      JOIN courses c ON b.course_id = c.course_id
      WHERE bp.member_id = ${member_id} AND b.club_id = ${clubId}
      ORDER BY b.booking_date DESC, b.tee_time DESC
      LIMIT 5
    `;

    // 4. Load recent POS line items (last 10 transactions)
    const { rows: recentPOS } = await sql`
      SELECT li.item_name, li.category, li.line_total, li.quantity,
             pc.opened_at, pc.total AS check_total
      FROM pos_line_items li
      JOIN pos_checks pc ON li.check_id = pc.check_id
      WHERE pc.member_id = ${member_id}
      ORDER BY pc.opened_at DESC
      LIMIT 10
    `;

    // 5. Load open complaints
    const { rows: openComplaints } = await sql`
      SELECT complaint_id, category, description, priority, reported_at
      FROM complaints
      WHERE member_id = ${member_id} AND club_id = ${clubId}
        AND status != 'resolved'
      ORDER BY reported_at DESC
    `;

    // Also check service requests
    const { rows: openServiceReqs } = await sql`
      SELECT request_id, request_type, requested_at
      FROM service_requests
      WHERE member_id = ${member_id}
        AND resolved_at IS NULL
      ORDER BY requested_at DESC
    `;

    // 6. Load today's booking details
    const today = new Date().toISOString().slice(0, 10);
    const { rows: todayBookings } = await sql`
      SELECT b.booking_id, b.tee_time, b.player_count, b.has_guest,
             b.transportation, b.has_caddie, b.round_type, b.status,
             c.name AS course_name
      FROM bookings b
      JOIN booking_players bp ON b.booking_id = bp.booking_id
      JOIN courses c ON b.course_id = c.course_id
      WHERE bp.member_id = ${member_id} AND b.club_id = ${clubId}
        AND b.booking_date = ${today}
      ORDER BY b.tee_time
    `;

    // 7. Load pace data (avg duration from last 3 completed rounds). Must
    // be a subquery — you can't ORDER BY + LIMIT the outer rows of an
    // aggregate-only SELECT in Postgres.
    const { rows: paceData } = await sql`
      SELECT AVG(duration_minutes) AS avg_duration,
             COUNT(*) AS round_count
      FROM (
        SELECT b.duration_minutes
        FROM bookings b
        JOIN booking_players bp ON b.booking_id = bp.booking_id
        WHERE bp.member_id = ${member_id} AND b.club_id = ${clubId}
          AND b.duration_minutes IS NOT NULL
        ORDER BY b.booking_date DESC
        LIMIT 3
      ) t
    `;

    // 8. Assemble context payload
    const context = {
      member: {
        member_id: member.member_id,
        name: `${member.first_name} ${member.last_name}`,
        first_name: member.first_name,
        last_name: member.last_name,
        membership_type: member.membership_type,
        annual_dues: member.annual_dues,
        archetype: member.archetype,
        health_score: member.health_score,
        health_tier: member.health_tier,
        household_count: member.household_count,
      },
      preferences,
      tee_time: tee_time,
      course: course || todayBookings[0]?.course_name || 'Main Course',
      recent_visits: recentVisits,
      recent_pos: recentPOS,
      open_complaints: openComplaints,
      open_service_requests: openServiceReqs,
      today_bookings: todayBookings,
      pace: {
        avg_duration_minutes: paceData[0]?.avg_duration ? Math.round(paceData[0].avg_duration) : null,
        rounds_sampled: paceData[0]?.round_count || 0,
      },
    };

    let briefs;

    if (!SIMULATION_MODE) {
      // 9. Call managed arrival-anticipation agent
      const session = await createManagedSession();
      const prompt = [
        'You are the Arrival Anticipation Engine for a private club.',
        'Generate 3 concise staff briefs (pro_shop, grill_room, beverage_cart) for the arriving member.',
        'Each brief should be 1-3 sentences with actionable intel for that role.',
        'Return valid JSON: { "pro_shop": "...", "grill_room": "...", "beverage_cart": "..." }',
        '',
        'Member context:',
        JSON.stringify(context, null, 2),
      ].join('\n');

      const response = await sendSessionEvent(session.id, {
        type: 'user.message',
        content: [{ type: 'text', text: prompt }],
      });

      // Parse agent response
      try {
        const text = response?.content?.[0]?.text || response?.completion || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        briefs = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        briefs = null;
      }

      // Fall back to simulation if agent response was unparseable
      if (!briefs || !briefs.pro_shop) {
        briefs = generateSimulatedBriefs(member, tee_time, course, preferences, recentPOS, openComplaints, paceData, todayBookings);
      }
    } else {
      // 10. Simulation mode
      briefs = generateSimulatedBriefs(member, tee_time, course, preferences, recentPOS, openComplaints, paceData, todayBookings);
    }

    // 11. Store briefs in staff_briefs
    const stored = [];
    for (const [role, text] of Object.entries(briefs)) {
      const priority = openComplaints.length > 0 ? 'high' : 'normal';
      const { rows: [inserted] } = await sql`
        INSERT INTO staff_briefs (club_id, member_id, tee_time, role, brief_text, priority)
        VALUES (${clubId}, ${member_id}, ${tee_time}, ${role}, ${text}, ${priority})
        RETURNING brief_id, role, brief_text, priority, generated_at
      `;
      stored.push(inserted);
    }

    // 12. Return briefs
    return res.status(200).json({
      member_id,
      member_name: `${member.first_name} ${member.last_name}`,
      tee_time,
      course: context.course,
      simulation: SIMULATION_MODE,
      briefs: stored,
    });
  } catch (err) {
    logError('/api/agents/arrival-trigger', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Generate simulated briefs when no ANTHROPIC_API_KEY is set.
 */
function generateSimulatedBriefs(member, teeTime, course, preferences, recentPOS, openComplaints, paceData, todayBookings) {
  const walkRide = todayBookings[0]?.transportation || preferences.walkRide || 'cart';
  const avgPace = paceData[0]?.avg_duration ? formatPace(paceData[0].avg_duration) : '4:12';
  const playerCount = todayBookings[0]?.player_count || 4;
  const groupLabel = playerCount === 4 ? 'Regular foursome' : `Group of ${playerCount}`;

  // Beverage history from POS
  const beverageItems = recentPOS
    .filter(i => ['beer', 'wine', 'cocktail', 'na_beverage'].includes(i.category))
    .map(i => i.item_name);
  const recentBeverages = beverageItems.length > 0
    ? [...new Set(beverageItems)].slice(0, 3).join(', ')
    : 'No beverage history';
  const recentBevCount = beverageItems.length > 0
    ? `${Math.min(beverageItems.length, 3)}`
    : '1-2';

  // Dining preferences from POS
  const diningItems = recentPOS
    .filter(i => ['entree', 'sandwich', 'salad', 'appetizer'].includes(i.category))
    .map(i => i.item_name);
  const diningPref = preferences.dining
    || (diningItems.length > 0 ? diningItems[0] : 'no preference noted');

  // Post-round dining rate
  const postRoundPct = recentPOS.length > 0 ? '~85%' : 'occasionally';

  const householdNote = member.household_count > 1
    ? ` Household of ${member.household_count}.`
    : '';

  return {
    pro_shop: `${member.first_name} ${member.last_name}, ${teeTime} on ${course || 'Main Course'}. ${walkRide === 'walk' ? 'Walks' : 'Cart'}. Avg pace: ${avgPace}. ${groupLabel}.${householdNote}`,
    grill_room: `${member.first_name} dines post-round ${postRoundPct} of visits. Prefers ${diningPref}. ${openComplaints.length ? '\u26A0\uFE0F Open complaint: ' + openComplaints[0].description : 'No open complaints.'}`,
    beverage_cart: `${member.first_name}: ${recentBeverages}. Typically ${recentBevCount} per round.`,
  };
}

function formatPace(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hrs}:${String(mins).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Export: cron-key bypass or standard withAuth
// ---------------------------------------------------------------------------

export default function handler(req, res) {
  const cronKey = req.headers['x-cron-key'];
  if (cronKey && process.env.CRON_SECRET && cronKey === process.env.CRON_SECRET) {
    req.auth = req.auth || { clubId: req.body?.club_id || 'unknown', role: 'system' };
    return arrivalHandler(req, res);
  }
  return withAuth(arrivalHandler, { roles: ['gm', 'admin'] })(req, res);
}
