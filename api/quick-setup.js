/**
 * POST /api/quick-setup
 *
 * Minimal club setup — just club name + city + state.
 * Two modes:
 *   1. Authenticated (Bearer token): Updates an existing club's name/location
 *   2. Unauthenticated: Creates a new club (for the NewClubSetup flow)
 *
 * Triggers geocoding in the background (Census API → Nominatim fallback).
 */
import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import { logError, logInfo } from './lib/logger.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { club_id, club_name, city, state, create_new } = req.body || {};

  if (!club_name || club_name.trim().length < 2) {
    return res.status(400).json({ error: 'club_name is required (min 2 characters)' });
  }
  if (!city || city.trim().length < 2) {
    return res.status(400).json({ error: 'city is required' });
  }
  if (!state || state.length < 2) {
    return res.status(400).json({ error: 'state is required' });
  }

  const name = club_name.trim();
  const cleanCity = city.trim();
  const cleanState = state.trim().toUpperCase().slice(0, 2);

  try {
    // Check if this is an authenticated user updating their club
    const authHeader = req.headers.authorization;
    let clubId = club_id;
    let isUpdate = false;

    if (authHeader?.startsWith('Bearer ') && !create_new) {
      const token = authHeader.slice(7);
      const session = await sql`
        SELECT s.user_id, s.club_id FROM sessions s
        WHERE s.token = ${token} AND s.expires_at > NOW()
      `;
      if (session.rows.length > 0) {
        clubId = session.rows[0].club_id;
        isUpdate = true;
      }
    }

    if (isUpdate && clubId) {
      // Update existing club
      await sql`
        UPDATE club
        SET name = ${name}, city = ${cleanCity}, state = ${cleanState}, updated_at = NOW()
        WHERE club_id = ${clubId}
      `;
      logInfo('quick-setup', `Updated club ${clubId}: ${name}, ${cleanCity}, ${cleanState}`);
    } else {
      // Create new club
      clubId = `club_${crypto.randomBytes(6).toString('hex')}`;

      // Ensure club table exists
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS club (
            club_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            city TEXT NOT NULL DEFAULT 'Unknown',
            state TEXT NOT NULL DEFAULT 'US',
            zip TEXT NOT NULL DEFAULT '00000',
            founded_year INTEGER,
            member_count INTEGER,
            course_count INTEGER DEFAULT 1,
            outlet_count INTEGER DEFAULT 3,
            logo_url TEXT,
            brand_voice TEXT DEFAULT 'professional',
            timezone TEXT DEFAULT 'America/New_York',
            latitude REAL,
            longitude REAL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `;
      } catch {}

      await sql`
        INSERT INTO club (club_id, name, city, state)
        VALUES (${clubId}, ${name}, ${cleanCity}, ${cleanState})
      `;
      logInfo('quick-setup', `Created club ${clubId}: ${name}, ${cleanCity}, ${cleanState}`);
    }

    // Background geocoding (non-blocking)
    geocodeClub(clubId, cleanCity, cleanState).catch(() => {});

    // Initialize onboarding progress
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
      await sql`
        INSERT INTO onboarding_progress (club_id, step_key, completed, completed_at)
        VALUES (${clubId}, 'club_created', TRUE, NOW())
        ON CONFLICT (club_id, step_key) DO UPDATE SET completed = TRUE, completed_at = NOW()
      `;
    } catch {}

    return res.status(200).json({
      clubId,
      clubName: name,
      city: cleanCity,
      state: cleanState,
      isUpdate,
      nextStep: 'Import your member data to activate health scores and insights.',
    });

  } catch (err) {
    logError('quick-setup', err);
    return res.status(500).json({ error: 'Setup failed — please try again' });
  }
}

// ---------------------------------------------------------------------------
// Background geocoding — Census Bureau primary, Nominatim fallback
// ---------------------------------------------------------------------------
async function geocodeClub(clubId, city, state) {
  let lat = null, lon = null;

  // Try Census Bureau Geocoder
  try {
    const addr = encodeURIComponent(`${city}, ${state}`);
    const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${addr}&benchmark=Public_AR_Current&format=json`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await resp.json();
    const match = data?.result?.addressMatches?.[0];
    if (match) {
      lat = match.coordinates.y;
      lon = match.coordinates.x;
    }
  } catch {}

  // Fallback to Nominatim/OpenStreetMap
  if (!lat) {
    try {
      const q = encodeURIComponent(`${city}, ${state}, USA`);
      const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'SwoopGolf/1.0' },
        signal: AbortSignal.timeout(5000),
      });
      const data = await resp.json();
      if (data?.[0]) {
        lat = parseFloat(data[0].lat);
        lon = parseFloat(data[0].lon);
      }
    } catch {}
  }

  if (lat && lon) {
    await sql`UPDATE club SET latitude = ${lat}, longitude = ${lon} WHERE club_id = ${clubId}`;
  }
}
