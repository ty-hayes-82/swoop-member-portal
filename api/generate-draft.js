/**
 * AI Draft Generation API
 * POST /api/generate-draft
 *
 * Generates contextual email or SMS drafts using member data and AI.
 * Supports Claude (default) and Gemini via AI_DRAFT_PROVIDER env var.
 *
 * Body: { memberId, draftType ('email'|'sms'), context?, templateHint? }
 * Returns: { subject?, body, memberEmail, memberPhone, memberName }
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from './lib/withAuth.js';
import { generateText } from './lib/aiClient.js';

// Demo member data for demo mode (mirrors static data in src/data/members.js)
const DEMO_MEMBERS = {
  mbr_t01: { name: 'James Whitfield', email: 'james.whitfield@example.com', phone: '(480) 555-0129', archetype: 'Balanced Active', healthScore: 42, tier: 'Full Golf', joinDate: '2019-04-12', duesAnnual: 18000, riskSignals: ['Complaint unresolved 6 days'], recentActivity: ['Grill Room lunch — 42 min ticket time', 'Back nine with foursome'], preferences: 'Prefers slow mornings, Grill Room booth 12, Thu/Fri 7:00–8:30 AM tee times' },
  mbr_t04: { name: 'Anne Jordan', email: 'anne.j@email.com', phone: '(480) 555-0234', archetype: 'Weekend Warrior', healthScore: 28, tier: 'Full Golf', joinDate: '2016-03-15', duesAnnual: 14000, riskSignals: ['Zero rounds since Jan 7 walkoff'], recentActivity: ['Saturday 7:08 AM tee time with Marcus'], preferences: 'Saturday morning 7-8 AM with husband Marcus, Terrace patio lunch, chicken Caesar' },
  mbr_t05: { name: 'Robert Callahan', email: 'robert.c@email.com', phone: '(480) 555-0456', archetype: 'Declining', healthScore: 22, tier: 'Full Golf', joinDate: '2021-06-01', duesAnnual: 18000, riskSignals: ['9-day complaint unresolved', 'Obligation-only F&B spending'], recentActivity: ['Main Dining Room — hitting minimum only'], preferences: 'Weekday mornings, Main Dining Room quiet corner, steak and red wine' },
  mbr_t06: { name: 'Sandra Chen', email: 'sandra.chen@example.com', phone: '(480) 555-0567', archetype: 'Social Butterfly', healthScore: 36, tier: 'Social', joinDate: '2021-05-22', duesAnnual: 9000, riskSignals: ['Dining spend down 87%', 'Declined 3 consecutive event invites'], recentActivity: ['Grill Room grab-and-go salad · $18', 'Lounge visit — no spend'], preferences: 'Wine enthusiast, booth 6, pescatarian. Spouse David Chen (Full Golf), daughter Lily Chen (Junior)' },
  mbr_t03: { name: 'Kevin Hurst', email: 'kevin.hurst@example.com', phone: '(480) 555-0789', archetype: 'Declining', healthScore: 18, tier: 'Full Golf', joinDate: '2018-01-20', duesAnnual: 18000, riskSignals: ['High churn risk — 82% cancel probability'], recentActivity: ['7:00 AM tee time with guest'], preferences: 'Coffee black, granola bar. High churn risk — needs pro shop greet by name.' },
};

async function fetchMemberContext(clubId, memberId, isDemo) {
  if (isDemo || clubId?.startsWith('demo')) {
    return DEMO_MEMBERS[memberId] || { name: 'Member', email: '', phone: '', archetype: 'Unknown', healthScore: 50, tier: 'Standard', riskSignals: [], recentActivity: [], preferences: '' };
  }

  try {
    const [memberRes, weeklyRes, feedbackRes] = await Promise.all([
      sql`
        SELECT member_id, first_name, last_name, membership_type, join_date,
               annual_dues, archetype, email, phone, preferred_dining_spot,
               tee_time_preference, dining_preference, member_notes, family_members,
               last_seen_location
        FROM members WHERE member_id = ${memberId} AND club_id = ${clubId}
      `,
      sql`
        SELECT engagement_score FROM member_engagement_weekly
        WHERE member_id = ${memberId} ORDER BY week_number DESC LIMIT 1
      `,
      sql`
        SELECT category, description, status, created_at
        FROM feedback WHERE member_id = ${memberId} AND club_id = ${clubId}
        AND status != 'resolved' ORDER BY created_at DESC LIMIT 3
      `,
    ]);

    const m = memberRes.rows[0];
    if (!m) return null;

    const healthScore = weeklyRes.rows[0]?.engagement_score || 50;
    const openComplaints = feedbackRes.rows.map(f => `${f.category}: ${f.description} (${f.status})`);

    return {
      name: `${m.first_name} ${m.last_name}`.trim(),
      email: m.email || '',
      phone: m.phone || '',
      archetype: m.archetype || 'Unknown',
      healthScore,
      tier: m.membership_type || 'Standard',
      joinDate: m.join_date,
      duesAnnual: m.annual_dues,
      riskSignals: openComplaints,
      recentActivity: [],
      preferences: [m.preferred_dining_spot, m.tee_time_preference, m.dining_preference, m.member_notes].filter(Boolean).join('. '),
      family: m.family_members,
      lastSeenLocation: m.last_seen_location,
    };
  } catch (e) {
    console.error('[generate-draft] DB error:', e.message);
    return null;
  }
}

function buildPrompt(member, sender, draftType, context, templateHint) {
  const isEmail = draftType === 'email';
  const healthLabel = member.healthScore >= 70 ? 'Healthy' : member.healthScore >= 50 ? 'Watch' : member.healthScore >= 30 ? 'At Risk' : 'Critical';

  return `You are ${sender.name}, ${sender.title || 'General Manager'} at a private club. Write a ${isEmail ? 'professional but warm email' : 'brief SMS text message'} to a club member.

MEMBER CONTEXT:
- Name: ${member.name}
- Membership: ${member.tier}, member since ${member.joinDate || 'unknown'}
- Health Score: ${member.healthScore}/100 (${healthLabel})
- Archetype: ${member.archetype}
- Annual Dues: $${(member.duesAnnual || 0).toLocaleString()}
${member.riskSignals?.length ? `- Risk Signals: ${member.riskSignals.join('; ')}` : '- No active risk signals'}
${member.recentActivity?.length ? `- Recent Activity: ${member.recentActivity.join('; ')}` : ''}
${member.preferences ? `- Preferences: ${member.preferences}` : ''}
${member.family ? `- Family: ${typeof member.family === 'string' ? member.family : JSON.stringify(member.family)}` : ''}
${context ? `\nADDITIONAL CONTEXT FROM SENDER: ${context}` : ''}
${templateHint ? `\nTONE HINT: ${templateHint.replace(/_/g, ' ')}` : ''}

INSTRUCTIONS:
${isEmail ? `Write a personalized email. Include specific details from their profile (favorite spots, recent activity, family). Be warm but professional. Reference specific things you know about them.

Respond in this exact JSON format:
{"subject": "email subject line", "body": "email body text"}` : `Write a short, warm SMS message (under 160 characters). Be personal and action-oriented. Use their first name only.

Respond in this exact JSON format:
{"body": "sms text here"}`}

Return ONLY the JSON, no other text.`;
}

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { memberId, draftType = 'email', context, templateHint } = req.body || {};

  if (!memberId) {
    return res.status(400).json({ error: 'memberId is required' });
  }

  if (!['email', 'sms'].includes(draftType)) {
    return res.status(400).json({ error: 'draftType must be "email" or "sms"' });
  }

  const clubId = getReadClubId(req);
  const sender = { name: req.auth.name || 'Club Manager', title: 'General Manager', email: req.auth.email };

  // Fetch member context
  const member = await fetchMemberContext(clubId, memberId, req.auth.isDemo);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  try {
    const prompt = buildPrompt(member, sender, draftType, context, templateHint);
    const rawResponse = await generateText(prompt);

    // Parse JSON from AI response
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI response did not contain valid JSON');
    }

    const draft = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      subject: draft.subject || undefined,
      body: draft.body || '',
      memberEmail: member.email,
      memberPhone: member.phone,
      memberName: member.name,
    });
  } catch (e) {
    console.error('[generate-draft] AI generation error:', e.message);

    // Fallback: return a generic template
    const firstName = member.name.split(' ')[0];
    if (draftType === 'sms') {
      return res.status(200).json({
        body: `Hi ${firstName}, just wanted to check in and see how things are going at the club. Would love to connect when you have a moment.`,
        memberPhone: member.phone,
        memberName: member.name,
        fallback: true,
      });
    }
    return res.status(200).json({
      subject: `A note from ${sender.name}`,
      body: `Hi ${firstName},\n\nI wanted to reach out personally to see how things are going at the club. We value your membership and I would love to hear from you directly.\n\nWarm regards,\n${sender.name}`,
      memberEmail: member.email,
      memberName: member.name,
      fallback: true,
    });
  }
}, { allowDemo: true });
