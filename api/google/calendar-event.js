/**
 * Google Calendar — Create Event
 * POST /api/google/calendar-event
 *
 * Creates a calendar event for a scheduled member call.
 *
 * Body: { memberName, memberId, scheduledTime, talkingPoints?, duration? }
 * Returns: { eventId, htmlLink }
 */
import { withAuth } from '../lib/withAuth.js';
import { getGoogleAccessToken } from '../lib/googleTokens.js';

/**
 * Parse a friendly time label like "Today 4 PM" or "Friday AM" into
 * a start/end ISO pair.
 */
function parseScheduledTime(label) {
  const now = new Date();
  let start = new Date(now);

  const lower = (label || '').toLowerCase().trim();

  if (lower.startsWith('today')) {
    // "Today 4 PM" → today at 4 PM
    const hourMatch = lower.match(/(\d{1,2})\s*(am|pm)/);
    if (hourMatch) {
      let hour = parseInt(hourMatch[1], 10);
      if (hourMatch[2] === 'pm' && hour < 12) hour += 12;
      if (hourMatch[2] === 'am' && hour === 12) hour = 0;
      start.setHours(hour, 0, 0, 0);
    } else {
      start.setHours(16, 0, 0, 0); // default 4 PM
    }
  } else if (lower.includes('monday')) {
    start = nextWeekday(now, 1);
    start.setHours(lower.includes('afternoon') ? 14 : 9, 0, 0, 0);
  } else if (lower.includes('tuesday')) {
    start = nextWeekday(now, 2);
    start.setHours(9, 0, 0, 0);
  } else if (lower.includes('wednesday')) {
    start = nextWeekday(now, 3);
    start.setHours(9, 0, 0, 0);
  } else if (lower.includes('thursday')) {
    start = nextWeekday(now, 4);
    start.setHours(9, 0, 0, 0);
  } else if (lower.includes('friday')) {
    start = nextWeekday(now, 5);
    start.setHours(lower.includes('pm') ? 14 : 9, 0, 0, 0);
  } else if (lower.includes('saturday')) {
    start = nextWeekday(now, 6);
    start.setHours(lower.includes('tee') ? 8 : 10, 0, 0, 0);
  } else if (lower.includes('sunday')) {
    start = nextWeekday(now, 0);
    start.setHours(10, 0, 0, 0);
  } else {
    // Try to parse as a date string, fallback to tomorrow 10 AM
    const parsed = new Date(label);
    if (!isNaN(parsed.getTime())) {
      start = parsed;
    } else {
      start.setDate(start.getDate() + 1);
      start.setHours(10, 0, 0, 0);
    }
  }

  // If the computed time is in the past, push to tomorrow
  if (start < now) {
    start.setDate(start.getDate() + 1);
  }

  return start;
}

function nextWeekday(from, dayOfWeek) {
  const d = new Date(from);
  const diff = (dayOfWeek - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { memberName, memberId, scheduledTime, talkingPoints, duration = 30 } = req.body || {};

  if (!memberName) {
    return res.status(400).json({ error: 'memberName is required' });
  }

  const accessToken = await getGoogleAccessToken(req.auth.userId);
  if (!accessToken) {
    return res.status(401).json({ error: 'Google not connected. Please connect your Google account in Profile settings.' });
  }

  const start = parseScheduledTime(scheduledTime);
  const end = new Date(start.getTime() + duration * 60 * 1000);

  const event = {
    summary: `Call with ${memberName}`,
    description: [
      `Swoop Member Portal — Scheduled call with ${memberName}`,
      memberId ? `Member ID: ${memberId}` : '',
      talkingPoints ? `\nTalking Points:\n${talkingPoints}` : '',
    ].filter(Boolean).join('\n'),
    start: {
      dateTime: start.toISOString(),
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: 'America/New_York',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 15 },
      ],
    },
  };

  try {
    const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const calData = await calRes.json();

    if (!calRes.ok) {
      console.error('[google/calendar-event] API error:', calData);
      return res.status(calRes.status).json({
        error: 'Failed to create calendar event',
        detail: calData.error?.message,
      });
    }

    return res.status(200).json({
      eventId: calData.id,
      htmlLink: calData.htmlLink,
      start: calData.start?.dateTime,
      end: calData.end?.dateTime,
    });
  } catch (e) {
    console.error('[google/calendar-event] Error:', e.message);
    return res.status(500).json({ error: 'Failed to create calendar event' });
  }
}, { allowDemo: true });
