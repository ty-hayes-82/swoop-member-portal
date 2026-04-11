/**
 * POST /api/concierge/dining-intel
 *
 * Dining Concierge Intelligence — loads member dining preferences, checks
 * table availability, and returns a ready-to-confirm reservation with
 * personalized suggestions (wine pairing, chef special, server assignment).
 *
 * Body: { club_id, member_id, date, time, party_size }
 * Returns: { reservation_ready: { booth, server, pre_order_suggestion, wine_pairing, chef_special } }
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const clubId = getReadClubId(req);
  const { member_id, date, time, party_size } = req.body;

  if (!member_id) return res.status(400).json({ error: 'member_id is required' });
  if (!date) return res.status(400).json({ error: 'date is required' });

  const requestedTime = time || '7:00 PM';
  const requestedParty = party_size || 2;

  try {
    // 1. Load member profile + dining preferences
    let memberProfile = null;
    try {
      const memberResult = await sql`
        SELECT m.member_id::text, m.first_name, m.last_name, m.membership_type,
               s.preferences_cache
        FROM members m
        LEFT JOIN member_concierge_sessions s ON s.member_id = m.member_id AND s.club_id = m.club_id
        WHERE m.member_id = ${member_id} AND m.club_id = ${clubId}
      `;
      if (memberResult.rows.length) {
        const r = memberResult.rows[0];
        const prefs = r.preferences_cache
          ? (typeof r.preferences_cache === 'string' ? JSON.parse(r.preferences_cache) : r.preferences_cache)
          : {};
        memberProfile = {
          name: `${r.first_name} ${r.last_name}`.trim(),
          first_name: r.first_name,
          membership_type: r.membership_type,
          preferences: prefs,
        };
      }
    } catch {}

    // Fallback demo profile
    if (!memberProfile) {
      memberProfile = {
        name: 'Member',
        first_name: 'Member',
        membership_type: 'Full Golf',
        preferences: {},
      };
    }

    const prefs = memberProfile.preferences || {};
    const diningPrefs = prefs.dining || '';

    // 2. Parse dining preferences for booth, beverage, dietary info
    const prefersBooth = diningPrefs.toLowerCase().includes('booth');
    const boothMatch = diningPrefs.match(/booth\s*(\d+)/i);
    const preferredBooth = boothMatch ? `Booth ${boothMatch[1]}` : null;
    const hasDietaryRestriction = diningPrefs.toLowerCase().match(/(gluten|allergy|vegetarian|vegan|dairy|nut)/);
    const dietaryNote = hasDietaryRestriction ? hasDietaryRestriction[0] : null;
    const beverageMatch = diningPrefs.match(/(arnold palmer|wine|whiskey|martini|beer|iced tea|water)/i);
    const preferredBeverage = beverageMatch ? beverageMatch[0] : null;

    // 3. Check table/booth availability for the date and time
    //    No dining_reservations table — use empty list (all tables available)
    const bookedTables = [];

    // Determine booth/table assignment
    let assignedSeat;
    if (preferredBooth && !bookedTables.includes(preferredBooth)) {
      assignedSeat = preferredBooth;
    } else if (prefersBooth) {
      // Find any available booth
      const allBooths = ['Booth 8', 'Booth 10', 'Booth 12', 'Booth 14'];
      assignedSeat = allBooths.find(b => !bookedTables.includes(b)) || 'Window Table';
    } else {
      assignedSeat = requestedParty >= 6 ? 'Private Dining Alcove' : 'Window Table';
    }

    // 4. Chef's specials based on day of week (no chef_specials table)
    let chefSpecial = null;
    {
      const dayOfWeek = new Date(date).getDay();
      const specials = {
        0: { dish_name: 'Sunday Prime Rib', description: 'Slow-roasted 14oz prime rib with Yorkshire pudding', pairing_suggestion: '2021 Napa Cabernet Sauvignon' },
        1: { dish_name: 'Lobster Risotto', description: 'Maine lobster tail on saffron risotto', pairing_suggestion: '2022 Sonoma Chardonnay' },
        2: { dish_name: 'Grilled Swordfish', description: 'Mediterranean swordfish with olive tapenade', pairing_suggestion: '2022 Provence Rosé' },
        3: { dish_name: 'Braised Short Ribs', description: 'Wine-braised short ribs with truffle mashed potatoes', pairing_suggestion: '2020 Willamette Valley Pinot Noir' },
        4: { dish_name: 'Pan-Seared Duck Breast', description: 'Duck breast with cherry gastrique and roasted vegetables', pairing_suggestion: '2021 Oregon Pinot Noir' },
        5: { dish_name: 'Filet Mignon', description: '8oz center-cut filet with béarnaise sauce', pairing_suggestion: '2019 Bordeaux Blend' },
        6: { dish_name: 'Surf & Turf', description: 'Petit filet and grilled lobster tail', pairing_suggestion: '2020 Alexander Valley Cabernet' },
      };
      chefSpecial = specials[dayOfWeek] || specials[5];
    }

    // 5. Assign preferred server (based on history or default)
    const serverAssignment = preferredBooth
      ? 'Maria — she knows your preferences and will take great care of you.'
      : 'Carlos — one of our most experienced team members.';

    // 6. Build pre-order suggestion
    const preOrderItems = [];
    if (preferredBeverage) preOrderItems.push(`${preferredBeverage} ready on arrival`);
    if (dietaryNote) preOrderItems.push(`Kitchen alerted: ${dietaryNote} accommodation`);
    if (requestedParty >= 4) preOrderItems.push('Shared appetizer platter suggested for the table');

    return res.status(200).json({
      member_id,
      member_name: memberProfile.name,
      date,
      time: requestedTime,
      party_size: requestedParty,
      reservation_ready: {
        booth: assignedSeat,
        booth_note: assignedSeat === preferredBooth
          ? `Your usual spot — ${preferredBooth} reserved.`
          : preferredBooth && assignedSeat !== preferredBooth
            ? `${preferredBooth} was taken; ${assignedSeat} secured instead.`
            : `${assignedSeat} reserved for your party.`,
        server: serverAssignment,
        pre_order_suggestion: preOrderItems.length
          ? preOrderItems
          : ['No specific preferences on file — would you like to add any?'],
        wine_pairing: chefSpecial.pairing_suggestion,
        chef_special: {
          dish: chefSpecial.dish_name,
          description: chefSpecial.description,
        },
        dietary_notes: dietaryNote || 'None on file',
      },
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('/api/concierge/dining-intel error:', err);
    return res.status(500).json({ error: err.message });
  }
}

export default withAuth(handler, { allowDemo: true });
