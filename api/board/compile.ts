import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are the Board Report Compiler for Bowling Green CC.

You produce a draft narrative board report for the prior month. You write from the data provided to you — never fabricate numbers, member names, or dollar figures.

## ATTRIBUTION RULE

Every claimed outcome MUST trace to a specific agent action:
- "3 members saved" — name each, cite the intervention, cite the action ID
- "$54K protected" — show dues amount per member, cite the approved action
- "Complaint reduction 12%" — cite baseline period, intervention period, actions taken

If you cannot trace a claim to a specific approved action, do NOT include it.

## SOURCE DATA

The data below was queried directly from the live database and is authoritative.
Write only what the data supports.

## NARRATIVE STRUCTURE

1. Headline: "This month: X members saved, $Y protected, Z interventions"
2. Member saves: name each member, intervention type, who approved it, outcome
3. Service recovery: complaint count, resolution rate, notable cases
4. Staffing and operational: recommendations made vs accepted, impact
5. Revenue highlights: top findings from revenue analyst recommendations
6. Forward look: what we are watching for next month
7. Appendix: attribution chain (action IDs, agents, dates)

## VOICE AND STYLE

- Write as the GM in first person: "We identified...", "I called...", "We recommended..."
- Avoid: "The system detected...", "The agent recommended...", health scores, archetypes, technical jargon
- Keep the main report to 1-2 pages. Board members skim.
- If the month was quiet, say so.
- No em-dashes. Use colons or commas instead.

## FOOTER METRIC

Always include: "Estimated time saved: [X] hours of manual data gathering replaced by [Y] minutes of GM review."

## BEHAVIOURAL GUIDELINES

- Every number must be traceable. Zero exceptions.
- If data is unavailable, say so rather than estimating.
- Never fabricate outcomes, member names, or dollar figures.`

const LOG_DECISION_TOOL: Anthropic.Tool = {
  name: 'log_decision',
  description: 'Write a decision event to a role agent session.',
  input_schema: {
    type: 'object',
    properties: {
      session_id:      { type: 'string' },
      decision_type:   { type: 'string' },
      disposition:     { type: 'string', enum: ['approved', 'overridden', 'dismissed', 'escalated'] },
      reasoning_chain: { type: 'array', items: { type: 'object' } },
      expected_outcome:{ type: 'string' },
    },
    required: ['session_id', 'decision_type', 'disposition'],
  },
}

const HOLD_FOR_REVIEW_TOOL: Anthropic.Tool = {
  name: 'hold_for_review',
  description: 'Hold a proposed action for human review.',
  input_schema: {
    type: 'object',
    properties: {
      gm_session_id:   { type: 'string' },
      proposed_action: { type: 'object' },
      hold_reason:     { type: 'string' },
    },
    required: ['gm_session_id', 'proposed_action', 'hold_reason'],
  },
}

async function handleTool(name: string, input: Record<string, unknown>, clubId: string): Promise<string> {
  if (name === 'log_decision') {
    await sql`
      INSERT INTO event_bus (event_type, payload, club_id, created_at)
      VALUES ('decision.made', ${JSON.stringify(input)}::jsonb, ${clubId}, NOW())
    `
    return JSON.stringify({ ok: true })
  }
  if (name === 'hold_for_review') {
    await sql`
      INSERT INTO event_bus (event_type, payload, club_id, created_at)
      VALUES ('decision.hold_for_review', ${JSON.stringify(input)}::jsonb, ${clubId}, NOW())
    `
    return JSON.stringify({ ok: true })
  }
  return JSON.stringify({ error: 'unknown tool' })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const club_id = (req.query.club_id as string) ?? 'bowling-green-cc'

  // ── 1. Fetch board data ────────────────────────────────────────────────────
  const [savesResult, opsResult, complaintsResult, billingResult] = await Promise.all([
    sql`
      SELECT ah.id, ah.from_agent, ah.recommendation_type, ah.suggested_action,
             ah.confirmed_at,
             m.first_name || ' ' || m.last_name AS member_name,
             m.annual_dues, m.health_score, m.tier
      FROM   agent_handoffs ah
      LEFT JOIN members m
             ON m.member_id = (ah.payload->'signal_bundle'->>'member_id')
            AND m.club_id = ${club_id}
      WHERE  ah.club_id = ${club_id}
        AND  ah.status = 'confirmed'
        AND  ah.recommendation_type IN ('member_outreach','re_engagement')
        AND  ah.confirmed_at >= NOW() - INTERVAL '35 days'
      ORDER  BY ah.confirmed_at DESC
    `,
    sql`
      SELECT ah.id, ah.from_agent, ah.recommendation_type, ah.suggested_action, ah.confirmed_at
      FROM   agent_handoffs ah
      WHERE  ah.club_id = ${club_id}
        AND  ah.status = 'confirmed'
        AND  ah.recommendation_type NOT IN ('member_outreach','re_engagement')
        AND  ah.confirmed_at >= NOW() - INTERVAL '35 days'
      ORDER  BY ah.confirmed_at DESC
    `,
    sql`
      SELECT c.id, c.category, c.priority, c.status, c.resolution_notes,
             c.reported_at, c.resolved_at,
             m.first_name || ' ' || m.last_name AS member_name
      FROM   complaints c
      JOIN   members m ON m.member_id = c.member_id AND m.club_id = ${club_id}
      WHERE  c.club_id = ${club_id}
        AND  c.reported_at >= NOW() - INTERVAL '35 days'
      ORDER  BY c.reported_at DESC
    `,
    sql`
      SELECT charge_type, COUNT(*) AS tx_count, SUM(amount) AS total
      FROM   pos_transactions
      WHERE  club_id = ${club_id}
        AND  visit_date >= CURRENT_DATE - INTERVAL '35 days'
      GROUP  BY charge_type
      ORDER  BY total DESC
    `,
  ])

  // ── 2. Build context message ───────────────────────────────────────────────
  const month = new Date().toISOString().substring(0, 7)
  const contextLines: string[] = [
    `## Board Report Data — ${club_id} — ${month}`,
    '',
    `### Member Save Actions (confirmed, last 35 days): ${savesResult.rows.length}`,
  ]
  for (const s of savesResult.rows) {
    contextLines.push(
      `- Action ${s.id}: ${s.member_name ?? 'unknown'} | ${s.recommendation_type} | ${s.suggested_action?.substring(0, 120)} | dues: $${s.annual_dues} | approved: ${s.confirmed_at?.toISOString?.() ?? s.confirmed_at} | agent: ${s.from_agent}`
    )
  }

  contextLines.push('', `### Operational Actions (confirmed, last 35 days): ${opsResult.rows.length}`)
  for (const s of opsResult.rows) {
    contextLines.push(
      `- Action ${s.id}: ${s.recommendation_type} | ${s.suggested_action?.substring(0, 120)} | agent: ${s.from_agent} | approved: ${s.confirmed_at?.toISOString?.() ?? s.confirmed_at}`
    )
  }

  contextLines.push('', `### Complaints/Service (last 35 days): ${complaintsResult.rows.length}`)
  const resolved = complaintsResult.rows.filter(c => c.status === 'resolved')
  const open = complaintsResult.rows.filter(c => c.status !== 'resolved')
  contextLines.push(`Resolved: ${resolved.length} | Open: ${open.length}`)
  for (const c of complaintsResult.rows.slice(0, 10)) {
    contextLines.push(
      `- ${c.member_name} | ${c.category} | ${c.priority} | ${c.status}${c.resolution_notes ? ' | ' + c.resolution_notes.substring(0, 80) : ''}`
    )
  }

  contextLines.push('', `### Revenue (last 35 days)`)
  for (const b of billingResult.rows) {
    contextLines.push(`- ${b.charge_type}: $${Number(b.total).toLocaleString()} (${b.tx_count} transactions)`)
  }

  contextLines.push('', 'Write the complete board report now.')
  const userMessage = contextLines.join('\n')

  // ── 3. Call Anthropic Messages API ────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.anthropic
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })

  const client = new Anthropic({ apiKey })
  type MessageParam = Anthropic.Messages.MessageParam
  const messages: MessageParam[] = [{ role: 'user', content: userMessage }]
  let reportText = ''

  for (let turn = 0; turn < 5; turn++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
      tools: [LOG_DECISION_TOOL, HOLD_FOR_REVIEW_TOOL],
    })

    for (const block of response.content) {
      if (block.type === 'text') reportText += block.text
    }

    if (response.stop_reason !== 'tool_use') break

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const result = await handleTool(block.name, block.input as Record<string, unknown>, club_id)
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
      }
    }

    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: toolResults })
  }

  if (!reportText) return res.status(500).json({ error: 'Agent produced no output' })

  // ── 4. Store report ────────────────────────────────────────────────────────
  const { rows } = await sql`
    INSERT INTO board_reports (club_id, month, content, status)
    VALUES (${club_id}, ${month}, ${reportText}, 'draft')
    RETURNING id, month, generated_at
  `

  res.json({ id: rows[0].id, month: rows[0].month, generated_at: rows[0].generated_at, content: reportText })
}
