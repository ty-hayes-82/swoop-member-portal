import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    // Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS experience_correlations (
        id SERIAL PRIMARY KEY,
        touchpoint TEXT NOT NULL,
        retention_impact NUMERIC(4,2) NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        segment TEXT NOT NULL DEFAULT 'all',
        archetype TEXT,
        trend_data JSONB,
        delta NUMERIC(6,2),
        delta_direction TEXT
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS correlation_insights (
        id TEXT PRIMARY KEY,
        headline TEXT NOT NULL,
        detail TEXT,
        domains TEXT[] NOT NULL,
        impact TEXT NOT NULL,
        metric_value TEXT,
        metric_label TEXT,
        archetype TEXT,
        trend_data JSONB,
        delta NUMERIC(6,2),
        delta_direction TEXT
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS event_roi_metrics (
        id SERIAL PRIMARY KEY,
        event_type TEXT NOT NULL,
        attendance_avg INTEGER NOT NULL,
        retention_rate INTEGER NOT NULL,
        avg_spend INTEGER NOT NULL,
        roi_score NUMERIC(4,1) NOT NULL,
        frequency TEXT NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS archetype_spend_gaps (
        id SERIAL PRIMARY KEY,
        archetype TEXT NOT NULL,
        count INTEGER NOT NULL,
        current_dining INTEGER NOT NULL,
        potential_dining INTEGER NOT NULL DEFAULT 100,
        current_events INTEGER NOT NULL,
        potential_events INTEGER NOT NULL DEFAULT 100,
        avg_annual_spend INTEGER NOT NULL,
        untapped_dining INTEGER NOT NULL,
        untapped_events INTEGER NOT NULL,
        total_untapped INTEGER NOT NULL,
        campaign TEXT
      )
    `;

    // Clear existing data
    await Promise.all([
      sql`DELETE FROM experience_correlations`,
      sql`DELETE FROM correlation_insights`,
      sql`DELETE FROM event_roi_metrics`,
      sql`DELETE FROM archetype_spend_gaps`,
    ]);

    // Seed experience_correlations (8 rows, segment='all', archetype=NULL)
    await sql`INSERT INTO experience_correlations (touchpoint, retention_impact, category, description, segment) VALUES
      ('Round Frequency', 0.89, 'golf', 'Strongest predictor. Members playing 3+ rounds/month have 94% renewal rate vs. 61% for <1 round/month.', 'all'),
      ('Post-Round Dining', 0.78, 'dining', 'Members who dine after rounds have 2.3x higher renewal rates. The round-to-dining connection is the strongest cross-domain signal.', 'all'),
      ('Event Attendance', 0.72, 'events', '2nd strongest predictor of retention after round frequency. Members attending 2+ events/quarter renew at 91%.', 'all'),
      ('Email Engagement', 0.64, 'email', 'Newsletter open rate above 40% correlates with 85% renewal. Drop below 15% is an early warning signal.', 'all'),
      ('Pro Shop Visits', 0.58, 'proshop', 'Equipment purchases signal commitment. Members with $500+/yr pro shop spend renew at 88%.', 'all'),
      ('Staff Interactions', 0.55, 'service', 'Members who are greeted by name by staff have 22% higher satisfaction scores.', 'all'),
      ('Course Condition Rating', 0.51, 'course', 'Course quality is table stakes. Members rating conditions below 3/5 are 3x more likely to resign.', 'all'),
      ('Complaint Resolution', 0.82, 'service', 'Each complaint resolved within 24hrs improves renewal probability by 18%. Unresolved complaints are the #1 resignation accelerator.', 'all')
    `;

    // Seed correlation_insights (6 rows)
    await sql`INSERT INTO correlation_insights (id, headline, detail, domains, impact, metric_value, metric_label) VALUES
      ('dining-after-rounds',
       'Members who dine after rounds have 2.3x higher renewal rates',
       'Of 182 members who regularly dine post-round, 168 renewed (92%). Of 118 who never dine after golf, only 72 renewed (61%). The round-to-dining connection is the strongest cross-domain retention signal.',
       ARRAY['Golf', 'Dining'], 'high', '2.3x', 'renewal rate multiplier'),
      ('complaint-resolution',
       'Complaints resolved within 24hrs improve renewal probability by 18%',
       'Across all 47 complaints this quarter, members whose issues were resolved same-day renewed at 89% vs. 71% for delayed resolution. James Whitfield is the proof case: unresolved complaint led to resignation within 4 days.',
       ARRAY['Service', 'Retention'], 'high', '+18%', 'renewal improvement'),
      ('event-retention',
       'Event attendance is the 2nd strongest predictor of retention after round frequency',
       'Members attending 2+ events per quarter renew at 91% vs. 67% for non-attendees. Social Butterflies who attend events but rarely golf still renew at 84% — events create emotional attachment independent of golf.',
       ARRAY['Events', 'Retention'], 'high', '91%', 'renewal rate (2+ events/qtr)'),
      ('email-decay-warning',
       'Email open rate below 15% precedes resignation by 6-8 weeks',
       'In 9 of 11 resignations this year, email engagement dropped below 15% at least 6 weeks before the member left. This makes email decay the earliest detectable disengagement signal across all touchpoints.',
       ARRAY['Email', 'Retention'], 'medium', '6-8 wks', 'early warning window'),
      ('staffing-experience',
       'Understaffed days generate 2.1x more complaints and cost $1,133/day in lost revenue',
       'On 3 understaffed Fridays in January, complaint rates doubled and F&B revenue ran 8% below normal. The compounding effect: staffing gaps create service failures, which create complaints, which accelerate disengagement.',
       ARRAY['Staffing', 'F&B', 'Service'], 'high', '2.1x', 'complaint rate on understaffed days'),
      ('multi-domain-decay',
       'Members declining in 3+ domains resign within 60 days without intervention',
       'When golf, dining, AND email all decline simultaneously, the member is in a resignation spiral. Swoop detected this pattern in Kevin Hurst (Oct: golf dropped, Nov: dining stopped, Dec: email went dark, Jan: resigned).',
       ARRAY['Golf', 'Dining', 'Email'], 'high', '60 days', 'avg time to resignation')
    `;

    // Seed event_roi_metrics (6 rows)
    await sql`INSERT INTO event_roi_metrics (event_type, attendance_avg, retention_rate, avg_spend, roi_score, frequency) VALUES
      ('Member-Guest Tournament', 48, 96, 285, 4.2, 'Quarterly'),
      ('Wine Dinner', 32, 94, 125, 3.8, 'Monthly'),
      ('Family Pool Day', 28, 92, 85, 3.1, 'Weekly (summer)'),
      ('Golf Clinic', 22, 90, 65, 2.7, 'Bi-weekly'),
      ('Chef''s Table', 12, 98, 195, 5.1, 'Monthly'),
      ('Holiday Gala', 120, 93, 175, 3.5, 'Annual')
    `;

    // Seed archetype_spend_gaps (6 rows)
    await sql`INSERT INTO archetype_spend_gaps (archetype, count, current_dining, potential_dining, current_events, potential_events, avg_annual_spend, untapped_dining, untapped_events, total_untapped, campaign) VALUES
      ('Balanced Active', 64, 62, 100, 54, 100, 4800, 3264, 2944, 6208,
       'Invite to themed dinner series + wine pairing events. These members are already engaged in golf — dining is the natural cross-sell.'),
      ('Social Butterfly', 38, 78, 100, 85, 100, 5200, 1672, 1140, 2812,
       'Already strong in events and dining. Offer golf clinic invites + member-guest tournament slots to deepen cross-domain engagement.'),
      ('Die-Hard Golfer', 52, 34, 100, 22, 100, 3600, 6864, 8112, 14976,
       'Biggest opportunity. Post-round dining incentive: "Your round includes a $15 Grill Room credit today." Event hook: 19th hole tournaments with dining built in.'),
      ('Weekend Warrior', 45, 41, 100, 28, 100, 3200, 5310, 6480, 11790,
       'Time-constrained members. Weekend brunch after golf, family-friendly events on Saturday afternoons. Make the club a weekend destination, not just a tee time.'),
      ('Declining', 26, 18, 100, 12, 100, 1800, 4284, 4576, 8860,
       'Re-engagement priority. Personal GM outreach + exclusive "welcome back" event invitation. Focus on reversing decline before revenue capture.'),
      ('New Member', 18, 45, 100, 35, 100, 2400, 1980, 2340, 4320,
       '90-day onboarding program: intro golf clinic, new member mixer, dining tour. Set cross-domain habits early.')
    `;

    res.status(200).json({
      success: true,
      seeded: {
        experience_correlations: 8,
        correlation_insights: 6,
        event_roi_metrics: 6,
        archetype_spend_gaps: 6,
      },
    });
  } catch (err) {
    console.error('/api/seed-experience-insights error:', err);
    res.status(500).json({ error: err.message });
  }
}
