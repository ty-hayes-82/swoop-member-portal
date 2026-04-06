/**
 * Club Onboarding API — Sprint 9
 * POST /api/onboard-club — create new club and initial setup
 * GET /api/onboard-club?clubId=xxx — get onboarding progress
 * PUT /api/onboard-club — update onboarding step
 *
 * Guided setup: create club → connect systems → import data → invite team → configure
 */
import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import { rateLimit } from './lib/rateLimit.js';
import { cors } from './lib/cors.js';

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

const ONBOARDING_STEPS = [
  { key: 'club_created', label: 'Club profile created', order: 1 },
  { key: 'crm_connected', label: 'CRM/Membership system connected', order: 2 },
  { key: 'members_imported', label: 'Member data imported (300+ records)', order: 3 },
  { key: 'tee_sheet_connected', label: 'Tee sheet system connected', order: 4 },
  { key: 'pos_connected', label: 'POS system connected', order: 5 },
  { key: 'health_scores_computed', label: 'Initial health scores computed', order: 6 },
  { key: 'team_invited', label: 'Team members invited', order: 7 },
  { key: 'notifications_configured', label: 'Notification preferences set', order: 8 },
  { key: 'pilot_live', label: 'Club is live', order: 9 },
];

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const rl = rateLimit(req, { maxAttempts: 3, windowMs: 3600000 });
  if (rl.limited) {
    return res.status(429).json({ error: 'Too many requests. Try again later.', retryAfter: rl.retryAfter });
  }

  // Ensure onboarding table exists
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS onboarding_progress (
        club_id TEXT NOT NULL,
        step_key TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMPTZ,
        notes TEXT,
        PRIMARY KEY (club_id, step_key)
      )
    `;
  } catch {}

  if (req.method === 'GET') {
    const { clubId } = req.query;
    if (!clubId) return res.status(400).json({ error: 'clubId required' });

    const progress = await sql`
      SELECT step_key, completed, completed_at, notes
      FROM onboarding_progress WHERE club_id = ${clubId}
    `;
    const completedSteps = new Set(progress.rows.filter(r => r.completed).map(r => r.step_key));

    const steps = ONBOARDING_STEPS.map(s => ({
      ...s,
      completed: completedSteps.has(s.key),
      completedAt: progress.rows.find(r => r.step_key === s.key)?.completed_at || null,
    }));

    const completedCount = steps.filter(s => s.completed).length;

    return res.status(200).json({
      clubId,
      steps,
      progress: `${completedCount}/${steps.length}`,
      percentComplete: Math.round(completedCount / steps.length * 100),
      isComplete: completedCount === steps.length,
    });
  }

  if (req.method === 'POST') {
    const { clubName, city, state, zip, memberCount, courseCount, outletCount, adminEmail, adminName, adminPassword } = req.body;

    if (!clubName || !adminEmail || !adminName || !adminPassword) {
      return res.status(400).json({ error: 'Please provide your club name, admin name, email, and password.' });
    }

    if (adminPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const clubId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(adminPassword, salt);

    try {
      // Create club
      await sql`
        INSERT INTO club (club_id, name, city, state, zip, member_count, course_count, outlet_count)
        VALUES (${clubId}, ${clubName}, ${city || null}, ${state || null}, ${zip || null}, ${memberCount || null}, ${courseCount || null}, ${outletCount || null})
      `;

      // Geocode city/state/zip for weather API (non-blocking)
      if (city || zip) {
        try {
          const addr = encodeURIComponent(`${city || ''}, ${state || ''} ${zip || ''}`);
          const geoRes = await fetch(`https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${addr}&benchmark=Public_AR_Current&format=json`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const match = geoData?.result?.addressMatches?.[0]?.coordinates;
            if (match?.y && match?.x) {
              await sql`UPDATE club SET latitude = ${match.y}, longitude = ${match.x} WHERE club_id = ${clubId}`;
            }
          }
        } catch { /* geocoding is non-critical */ }
      }

      // Create admin user with hashed password
      await sql`
        INSERT INTO users (user_id, club_id, email, name, role, title, active, password_hash, password_salt)
        VALUES (${userId}, ${clubId}, ${adminEmail.toLowerCase()}, ${adminName}, 'gm', 'General Manager', TRUE, ${passwordHash}, ${salt})
      `;

      // Initialize onboarding steps
      for (const step of ONBOARDING_STEPS) {
        const completed = step.key === 'club_created';
        await sql`
          INSERT INTO onboarding_progress (club_id, step_key, completed, completed_at)
          VALUES (${clubId}, ${step.key}, ${completed}, ${completed ? new Date().toISOString() : null})
        `;
      }

      // Create a session token so the user is immediately logged in
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await sql`
        INSERT INTO sessions (token, user_id, club_id, role, expires_at)
        VALUES (${token}, ${userId}, ${clubId}, 'gm', ${expiresAt.toISOString()})
      `;

      res.status(201).json({
        clubId,
        userId,
        token,
        user: { userId, clubId, name: adminName, email: adminEmail.toLowerCase(), role: 'gm', title: 'General Manager', clubName },
        message: `Club "${clubName}" created. Onboarding started.`,
        nextStep: 'crm_connected',
      });
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('users_email_key') || msg.includes('duplicate key')) {
        return res.status(409).json({ error: 'An account with this email already exists. Please use a different email or sign in.' });
      }
      res.status(500).json({ error: 'Something went wrong creating your club. Please try again.' });
    }
  }

  if (req.method === 'PUT') {
    const { clubId, stepKey, completed, notes } = req.body;
    if (!clubId || !stepKey) return res.status(400).json({ error: 'clubId and stepKey required' });

    await sql`
      UPDATE onboarding_progress
      SET completed = ${completed !== false}, completed_at = ${completed !== false ? new Date().toISOString() : null}, notes = ${notes || null}
      WHERE club_id = ${clubId} AND step_key = ${stepKey}
    `;

    res.status(200).json({ ok: true, message: `Step "${stepKey}" updated` });
  }

  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT') {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
