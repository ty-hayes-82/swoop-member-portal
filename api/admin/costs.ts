import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

// Anthropic pricing per million tokens (input / output)
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-7':          { input: 15,   output: 75  },
  'claude-sonnet-4-6':        { input: 3,    output: 15  },
  'claude-haiku-4-5-20251001':{ input: 0.80, output: 4   },
  opus:   { input: 15,  output: 75  },
  sonnet: { input: 3,   output: 15  },
  haiku:  { input: 0.80,output: 4   },
}

// Rough token estimates per agent turn (input / output)
const AVG_TOKENS = { input: 2000, output: 600 }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const clubId = (req.query.club_id as string) || 'bowling-green-cc'

  let totalTurns = 0, sessions30d = 0, totalSessions = 0, handoffCount = 0
  let registryRows: { agent_name: string }[] = []

  try {
    const [sessions, registry, handoffs] = await Promise.all([
      sql`
        SELECT
          COUNT(*)::int AS total_sessions,
          COUNT(*)::int AS sessions_30d,
          0::int        AS total_turns
        FROM agent_sessions
        WHERE club_id = ${clubId}
      `,
      sql`
        SELECT agent_name
        FROM agent_registry
        WHERE club_id = ${clubId}
      `,
      sql`
        SELECT COUNT(*)::int AS cnt FROM agent_handoffs WHERE club_id = ${clubId}
      `,
    ])
    totalTurns    = sessions.rows[0]?.total_turns   ?? 0
    sessions30d   = sessions.rows[0]?.sessions_30d  ?? 0
    totalSessions = sessions.rows[0]?.total_sessions ?? 0
    handoffCount  = handoffs.rows[0]?.cnt ?? 0
    registryRows  = registry.rows as { agent_name: string }[]
  } catch {
    // tables not yet provisioned — return zeroed estimates
  }

  // Build per-model cost breakdown from registry (all agents default to sonnet)
  const modelCounts: Record<string, number> = {}
  for (const r of registryRows) {
    const m = 'sonnet'
    modelCounts[m] = (modelCounts[m] ?? 0) + 1
  }

  const agentCount = registryRows.length || 18
  const turnsPerAgent = agentCount > 0 ? totalTurns / agentCount : 0

  const byModel = Object.entries(modelCounts).map(([model, count]) => {
    const price = PRICING[model] ?? PRICING.sonnet
    const agentTurns = turnsPerAgent * count
    const inputCost  = (agentTurns * AVG_TOKENS.input)  / 1_000_000 * price.input
    const outputCost = (agentTurns * AVG_TOKENS.output) / 1_000_000 * price.output
    return { model, agents: count, estimated_turns: Math.round(agentTurns), cost_usd: +(inputCost + outputCost).toFixed(2) }
  })

  const totalApiCost = byModel.reduce((s, r) => s + r.cost_usd, 0)

  // Infrastructure estimates (fixed per club/month)
  const neonCostPerClub   = 5.00   // Neon serverless ~$5/mo per club at pilot scale
  const vercelCostPerClub = 3.50   // Vercel pro prorated for 1 club
  const totalInfraCost    = neonCostPerClub + vercelCostPerClub
  const totalMonthlyCost  = totalApiCost + totalInfraCost

  // Breakeven ARR at 50% gross margin
  const breakevenArr = totalMonthlyCost * 12 / 0.5

  res.json({
    club_id: clubId,
    period: '30d',
    sessions_30d: sessions30d,
    total_sessions: totalSessions,
    total_turns: totalTurns,
    handoff_count: handoffCount,
    agent_count: agentCount,
    by_model: byModel,
    api_cost_usd: +totalApiCost.toFixed(2),
    infra_cost_usd: +totalInfraCost.toFixed(2),
    total_monthly_usd: +totalMonthlyCost.toFixed(2),
    breakeven_arr_usd: +breakevenArr.toFixed(2),
    note: 'Token counts estimated from turn counts × avg tokens/turn (2000 in / 600 out). Actual cost requires Anthropic usage export.',
  })
}
