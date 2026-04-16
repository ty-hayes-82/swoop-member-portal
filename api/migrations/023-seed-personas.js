/**
 * Migration 023: Seed Test Personas for Pinetree Country Club
 *
 * Creates stable user accounts for all test personas:
 *   - 7 staff roles: gm, assistant_gm, fb_director, head_pro,
 *                    membership_director, controller, dining_room_manager
 *   - 3 member accounts: James Whitfield, Sandra Chen, Linda Leonard
 *
 * All accounts use password: Pinetree1!
 * Idempotent — skips users that already exist (by email).
 *
 * Run via: GET /api/migrations/023-seed-personas
 * Returns: JSON with credentials for all created/existing personas.
 */

import crypto from 'crypto';
import { sql } from '@vercel/postgres';
import { withAuth } from '../lib/withAuth.js';

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

const PASSWORD = 'Pinetree1!';

// ── Persona definitions ────────────────────────────────────────────────────────
// Staff personas — one per club role
const STAFF_PERSONAS = [
  { id: 'usr_gm_pinetree',         email: 'sarah.mitchell@pinetree.test',   name: 'Sarah Mitchell',    role: 'gm',                   title: 'General Manager' },
  { id: 'usr_agm_pinetree',        email: 'david.chen@pinetree.test',       name: 'David Chen',        role: 'assistant_gm',         title: 'Assistant General Manager' },
  { id: 'usr_fb_pinetree',         email: 'maria.garcia@pinetree.test',     name: 'Maria Garcia',      role: 'fb_director',          title: 'F&B Director' },
  { id: 'usr_pro_pinetree',        email: 'tom.bradley@pinetree.test',      name: 'Tom Bradley',       role: 'head_pro',             title: 'Head Professional' },
  { id: 'usr_mem_pinetree',        email: 'jennifer.walsh@pinetree.test',   name: 'Jennifer Walsh',    role: 'membership_director',  title: 'Director of Membership' },
  { id: 'usr_ctrl_pinetree',       email: 'robert.kim@pinetree.test',       name: 'Robert Kim',        role: 'controller',           title: 'Controller' },
  { id: 'usr_drm_pinetree',        email: 'lisa.park@pinetree.test',        name: 'Lisa Park',         role: 'dining_room_manager',  title: 'Dining Room Manager' },
];

// Member personas — linked to existing seeded member_ids
const MEMBER_PERSONAS = [
  { id: 'usr_mbr_whitfield',  email: 'james.whitfield@pinetree.test',  name: 'James Whitfield',  role: 'viewer', title: 'Member', memberId: 'mbr_t01', profile: 'Active full golf member, high engagement' },
  { id: 'usr_mbr_schen',      email: 'sandra.chen@pinetree.test',      name: 'Sandra Chen',      role: 'viewer', title: 'Member', memberId: 'mbr_t06', profile: 'At-risk social member, recent service complaint' },
  { id: 'usr_mbr_lleonard',   email: 'linda.leonard@pinetree.test',    name: 'Linda Leonard',    role: 'viewer', title: 'Member', memberId: 'mbr_t07', profile: 'Ghost member, no recent activity, long absence' },
];

export default withAuth(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Load the club_id from the request auth context
  const clubId = req.auth?.clubId;
  if (!clubId) {
    return res.status(401).json({ error: 'Club ID not found in session' });
  }

  const created = [];
  const skipped = [];
  const credentials = { clubId, staff: [], members: [] };

  const allPersonas = [
    ...STAFF_PERSONAS.map(p => ({ ...p, group: 'staff' })),
    ...MEMBER_PERSONAS.map(p => ({ ...p, group: 'members' })),
  ];

  for (const persona of allPersonas) {
    try {
      // Check if user already exists
      const existing = await sql`
        SELECT user_id, email, role FROM users
        WHERE email = ${persona.email} AND club_id = ${clubId}
      `;

      if (existing.rows.length > 0) {
        // User already exists — generate a fresh session token and return credentials
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await sql`
          INSERT INTO sessions (token, user_id, club_id, role, expires_at)
          VALUES (${token}, ${existing.rows[0].user_id}, ${clubId}, ${existing.rows[0].role}, ${expiresAt.toISOString()})
        `;

        const entry = {
          userId: existing.rows[0].user_id,
          email: persona.email,
          password: PASSWORD,
          name: persona.name,
          role: persona.role,
          title: persona.title,
          token,
          ...(persona.memberId ? { memberId: persona.memberId, profile: persona.profile } : {}),
        };
        credentials[persona.group].push(entry);
        skipped.push(persona.email);
        continue;
      }

      // Create the user
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(PASSWORD, salt);
      const userId = persona.id;

      await sql`
        INSERT INTO users (user_id, club_id, email, name, role, title, active, password_hash, password_salt)
        VALUES (${userId}, ${clubId}, ${persona.email}, ${persona.name}, ${persona.role}, ${persona.title}, TRUE, ${passwordHash}, ${salt})
      `;

      // Create a long-lived session token (30 days)
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await sql`
        INSERT INTO sessions (token, user_id, club_id, role, expires_at)
        VALUES (${token}, ${userId}, ${clubId}, ${persona.role}, ${expiresAt.toISOString()})
      `;

      const entry = {
        userId,
        email: persona.email,
        password: PASSWORD,
        name: persona.name,
        role: persona.role,
        title: persona.title,
        token,
        ...(persona.memberId ? { memberId: persona.memberId, profile: persona.profile } : {}),
      };
      credentials[persona.group].push(entry);
      created.push(persona.email);

    } catch (err) {
      console.error(`[023-seed-personas] Failed to create ${persona.email}:`, err.message);
      credentials[persona.group].push({ email: persona.email, error: err.message });
    }
  }

  return res.status(200).json({
    created: created.length,
    skipped: skipped.length,
    created_emails: created,
    skipped_emails: skipped,
    credentials,
  });

}, { requireAdmin: true });
