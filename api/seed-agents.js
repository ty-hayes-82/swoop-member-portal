import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG) return res.status(403).json({ error: 'Disabled in production' });
  try {
    // Create tables if not exists
    await sql`CREATE TABLE IF NOT EXISTS agent_definitions (
      agent_id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100),
      description TEXT,
      status VARCHAR(20) DEFAULT 'active',
      model VARCHAR(50),
      avatar VARCHAR(100),
      source_systems TEXT[],
      last_run TIMESTAMPTZ
    )`;
    await sql`ALTER TABLE agent_definitions ALTER COLUMN avatar TYPE VARCHAR(100)`;
    await sql`CREATE TABLE IF NOT EXISTS agent_actions (
      action_id VARCHAR(50) PRIMARY KEY,
      agent_id VARCHAR(50) REFERENCES agent_definitions(agent_id),
      action_type VARCHAR(50),
      priority VARCHAR(20),
      source VARCHAR(100),
      description TEXT,
      impact_metric VARCHAR(100),
      member_id VARCHAR(20),
      status VARCHAR(20) DEFAULT 'pending',
      approval_action TEXT,
      dismissal_reason TEXT,
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      approved_at TIMESTAMPTZ,
      dismissed_at TIMESTAMPTZ
    )`;

    // Seed agent_definitions
    await sql`INSERT INTO agent_definitions (agent_id, name, description, status, model, avatar, source_systems, last_run)
      VALUES
        ('member-pulse', 'Member Pulse', 'Detects early disengagement signals by correlating visit frequency, spend trends, and sentiment across dining, golf, and events.', 'active', 'swoop-core-v2', '/agents/member-pulse.svg', ARRAY['Member CRM','POS','Tee Sheet','Event RSVP'], NOW() - INTERVAL '2 hours'),
        ('demand-optimizer', 'Demand Optimizer', 'Balances waitlist demand with cancellation probability to maximize tee-sheet utilization and member satisfaction.', 'active', 'swoop-core-v2', '/agents/demand-optimizer.svg', ARRAY['Tee Sheet','Waitlist','Weather API'], NOW() - INTERVAL '1 hour'),
        ('service-recovery', 'Service Recovery', 'Surfaces unresolved complaints and at-risk moments, recommending immediate staff action before members disengage.', 'learning', 'swoop-core-v2', '/agents/service-recovery.svg', ARRAY['Feedback System','POS','Staff Notes'], NOW() - INTERVAL '3 hours'),
        ('revenue-analyst', 'Revenue Analyst', 'Flags preventable revenue leakage from no-shows, underpriced slots, and declining ancillary spend per round.', 'active', 'swoop-core-v2', '/agents/revenue-analyst.svg', ARRAY['POS','Tee Sheet','Billing'], NOW() - INTERVAL '30 minutes'),
        ('engagement-autopilot', 'Engagement Autopilot', 'Monitors declining participation across club programs and drafts personalized re-engagement outreach.', 'idle', 'swoop-core-v2', '/agents/engagement-autopilot.svg', ARRAY['Event RSVP','Email Platform','Member CRM'], NOW() - INTERVAL '6 hours'),
        ('labor-optimizer', 'Labor Optimizer', 'Forecasts staffing gaps by correlating reservation volume, weather, and historical service-speed data.', 'active', 'swoop-core-v2', '/agents/labor-optimizer.svg', ARRAY['Staff Scheduling','Tee Sheet','Weather API','POS'], NOW() - INTERVAL '45 minutes')
      ON CONFLICT (agent_id) DO NOTHING`;

    // Seed agent_actions
    await sql`INSERT INTO agent_actions (action_id, agent_id, action_type, priority, source, description, impact_metric, member_id, status, timestamp)
      VALUES
        ('agx_001', 'member-pulse', 'outreach', 'high', 'Member Pulse + POS', 'James Whitfield: 60% drop in dining spend over 8 weeks. Last visit lacked server greeting.', '$4,200 annual spend at risk', 'mbr_038', 'pending', NOW() - INTERVAL '2 hours'),
        ('agx_002', 'demand-optimizer', 'rebalance', 'high', 'Tee Sheet + Waitlist', 'Saturday 7-9 AM block is 94% booked with 3 waitlisted. Slot at 7:40 AM has 42% cancel probability.', '1 recovered slot = $312 revenue', NULL, 'pending', NOW() - INTERVAL '1 hour'),
        ('agx_003', 'service-recovery', 'alert', 'high', 'Feedback System + POS', 'Anne Jordan filed noise complaint about patio event on 6/1. No staff follow-up recorded in 6 days.', 'Retention risk: 12-yr member, $8k/yr spend', 'mbr_059', 'pending', NOW() - INTERVAL '3 hours'),
        ('agx_004', 'revenue-analyst', 'flag', 'medium', 'Tee Sheet + Billing', 'Weekend PM slots consistently underpriced vs. demand. Yield gap estimated at $1,800/month.', '$1,800/mo revenue gap', NULL, 'pending', NOW() - INTERVAL '30 minutes'),
        ('agx_005', 'member-pulse', 'outreach', 'medium', 'Member Pulse + Event RSVP', 'Robert Callahan skipped last 3 monthly mixers after attending 11 consecutively. Sentiment dip detected.', 'Engagement score dropped 22pts', 'mbr_072', 'pending', NOW() - INTERVAL '4 hours'),
        ('agx_006', 'labor-optimizer', 'schedule', 'high', 'Staff Scheduling + Weather', 'Saturday forecast: 92F, sunny. Model predicts 18% higher beverage cart demand. Current staffing short by 1.', 'Estimated $600 missed bev-cart revenue', NULL, 'pending', NOW() - INTERVAL '45 minutes'),
        ('agx_007', 'engagement-autopilot', 'draft', 'low', 'Email Platform + Member CRM', 'Draft re-engagement email for 14 members who have not booked a tee time in 30+ days.', '14 members, avg $3,100/yr spend', NULL, 'pending', NOW() - INTERVAL '6 hours'),
        ('agx_008', 'service-recovery', 'alert', 'medium', 'POS + Staff Notes', 'David Chen waited 22 min for starter. Pro shop noted he seemed frustrated. No recovery action logged.', 'Health score dropped to 54', 'mbr_146', 'pending', NOW() - INTERVAL '5 hours'),
        ('agx_009', 'demand-optimizer', 'rebalance', 'medium', 'Tee Sheet + Waitlist', 'Sunday 2-4 PM has 40% open slots. 5 waitlisted members prefer afternoon. Auto-offer recommended.', '3 potential fills = $936 revenue', NULL, 'pending', NOW() - INTERVAL '2 hours'),
        ('agx_010', 'revenue-analyst', 'flag', 'high', 'POS + Tee Sheet', 'No-show rate spiked to 14% last weekend vs. 6% avg. Top 5 repeat offenders identified.', '$2,400 estimated lost revenue', NULL, 'pending', NOW() - INTERVAL '1 hour'),
        ('agx_011', 'member-pulse', 'outreach', 'low', 'Member Pulse + POS', 'Lisa Park increased dining visits 40% this quarter. Potential upsell to wine club membership.', 'Upsell opportunity: $1,200/yr', 'mbr_315', 'pending', NOW() - INTERVAL '8 hours'),
        ('agx_012', 'labor-optimizer', 'schedule', 'medium', 'Staff Scheduling + Tee Sheet', 'Tuesday PM shift overstaffed by 2 based on historical booking volume. Reallocation to Thursday recommended.', 'Save $320 labor cost/week', NULL, 'pending', NOW() - INTERVAL '3 hours')
      ON CONFLICT (action_id) DO NOTHING`;

    res.status(200).json({ ok: true, message: 'Agent seed data inserted.' });
  } catch (err) {
    console.error('/api/seed-agents error:', err);
    res.status(500).json({ error: err.message });
  }
}
