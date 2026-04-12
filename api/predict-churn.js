/**
 * Churn Prediction API — Sprint 11
 * POST /api/predict-churn?clubId=xxx — compute churn probabilities for all members
 * GET /api/predict-churn?clubId=xxx&memberId=xxx — get prediction for one member
 *
 * Phase 1: Rules-based scoring using health score trends and engagement patterns.
 * Phase 2 (Sprint 11+): Replace with ML model trained on accumulated club data.
 *
 * Returns: 30/60/90 day resignation probability + contributing factors.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId, getWriteClubId } from './lib/withAuth.js';

export default withAuth(async function handler(req, res) {
  // B25: GET fetches a single member's prediction (read);
  // POST recomputes and writes churn_predictions for the whole club (write).
  const clubId = req.method === 'POST' ? getWriteClubId(req) : getReadClubId(req);
  // Ensure predictions table exists
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS churn_predictions (
        prediction_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        club_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        prob_30d REAL,
        prob_60d REAL,
        prob_90d REAL,
        confidence REAL,
        risk_factors JSONB DEFAULT '[]',
        model_version TEXT DEFAULT 'rules_v1',
        computed_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(club_id, member_id)
      )
    `;
  } catch {}

  if (req.method === 'GET') {
    const { memberId } = req.query;
    if (!memberId) return res.status(400).json({ error: 'memberId required' });

    const result = await sql`
      SELECT cp.*, m.first_name, m.last_name, m.health_score, m.archetype, m.annual_dues
      FROM churn_predictions cp JOIN members m ON cp.member_id = m.member_id
      WHERE cp.club_id = ${clubId} AND cp.member_id = ${memberId}
    `;
    if (result.rows.length === 0) return res.status(404).json({ error: 'No prediction found' });
    return res.status(200).json(result.rows[0]);
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'POST or GET only' });

  try {
    const members = await sql`
      SELECT m.member_id, m.health_score, m.health_tier, m.archetype, m.annual_dues, m.join_date
      FROM members m WHERE m.club_id = ${clubId} AND m.status = 'active'
    `;

    let computed = 0;
    for (const member of members.rows) {
      const factors = [];
      let baseRisk30 = 0;
      let baseRisk60 = 0;
      let baseRisk90 = 0;

      const score = Number(member.health_score) || 50;
      const tier = member.health_tier;
      const archetype = member.archetype;

      // Factor 1: Current health score
      if (score < 20) { baseRisk30 += 45; baseRisk60 += 65; baseRisk90 += 80; factors.push({ factor: 'Critical health score', weight: 0.35, detail: `Score ${score} — severe disengagement across multiple domains` }); }
      else if (score < 35) { baseRisk30 += 25; baseRisk60 += 45; baseRisk90 += 60; factors.push({ factor: 'At-risk health score', weight: 0.25, detail: `Score ${score} — declining engagement` }); }
      else if (score < 50) { baseRisk30 += 10; baseRisk60 += 25; baseRisk90 += 35; factors.push({ factor: 'Watch-tier health score', weight: 0.15, detail: `Score ${score} — early warning signals` }); }

      // Factor 2: Score trajectory (last 4 scores)
      const history = await sql`
        SELECT score, computed_at FROM health_scores
        WHERE member_id = ${member.member_id} AND club_id = ${clubId}
        ORDER BY computed_at DESC LIMIT 4
      `;
      if (history.rows.length >= 2) {
        const recent = Number(history.rows[0]?.score) || score;
        const older = Number(history.rows[history.rows.length - 1]?.score) || score;
        const trend = recent - older;
        if (trend < -15) { baseRisk30 += 20; baseRisk60 += 25; baseRisk90 += 30; factors.push({ factor: 'Rapid score decline', weight: 0.20, detail: `Dropped ${Math.abs(trend)} points recently` }); }
        else if (trend < -5) { baseRisk30 += 8; baseRisk60 += 15; baseRisk90 += 20; factors.push({ factor: 'Moderate score decline', weight: 0.12, detail: `Dropped ${Math.abs(trend)} points` }); }
      }

      // Factor 3: Open complaints
      const complaints = await sql`
        SELECT COUNT(*) as count FROM complaints
        WHERE club_id = ${clubId} AND member_id = ${member.member_id} AND status = 'open'
      `;
      const openComplaints = Number(complaints.rows[0]?.count) || 0;
      if (openComplaints > 0) {
        baseRisk30 += 15 * openComplaints; baseRisk60 += 12 * openComplaints; baseRisk90 += 10 * openComplaints;
        factors.push({ factor: 'Unresolved complaints', weight: 0.18, detail: `${openComplaints} open complaint(s)` });
      }

      // Factor 4: Archetype risk modifier
      const archetypeRisk = { 'Ghost': 20, 'Declining': 15, 'Snowbird': -5, 'New Member': 5, 'Weekend Warrior': 3, 'Die-Hard Golfer': -3, 'Balanced Active': -5, 'Social Butterfly': -3 };
      const archMod = archetypeRisk[archetype] || 0;
      if (archMod > 5) {
        baseRisk30 += archMod; baseRisk60 += archMod; baseRisk90 += archMod;
        factors.push({ factor: `${archetype} archetype risk`, weight: 0.10, detail: `${archetype} members have historically higher churn rates` });
      }

      // Factor 5: Tenure (new members churn more)
      if (member.join_date) {
        const tenureDays = Math.floor((Date.now() - new Date(member.join_date).getTime()) / 86400000);
        if (tenureDays < 180) { baseRisk30 += 8; baseRisk60 += 12; baseRisk90 += 15; factors.push({ factor: 'New member (<6 months)', weight: 0.08, detail: 'First-year members have 2x higher churn risk' }); }
      }

      // Clamp and compute confidence
      const prob30 = Math.min(95, Math.max(2, Math.round(baseRisk30)));
      const prob60 = Math.min(95, Math.max(5, Math.round(baseRisk60)));
      const prob90 = Math.min(95, Math.max(8, Math.round(baseRisk90)));
      const confidence = Math.min(0.95, 0.5 + (history.rows.length * 0.1) + (openComplaints > 0 ? 0.1 : 0));

      await sql`
        INSERT INTO churn_predictions (club_id, member_id, prob_30d, prob_60d, prob_90d, confidence, risk_factors, model_version)
        VALUES (${clubId}, ${member.member_id}, ${prob30}, ${prob60}, ${prob90}, ${confidence}, ${JSON.stringify(factors)}::jsonb, 'rules_v1')
        ON CONFLICT (club_id, member_id) DO UPDATE SET
          prob_30d = EXCLUDED.prob_30d, prob_60d = EXCLUDED.prob_60d, prob_90d = EXCLUDED.prob_90d,
          confidence = EXCLUDED.confidence, risk_factors = EXCLUDED.risk_factors, computed_at = NOW()
      `;
      computed++;
    }

    return res.status(200).json({ clubId, computed, message: `Churn predictions computed for ${computed} members` });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}, { allowDemo: true });
