import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

// Simplified ingest: accepts text/csv body, parses columns, upserts members
// Full health score / tier / archetype logic mirrors scripts/ingest_jonas_csv.ts

const TIER_THRESHOLDS = [
  { tier: 'Thriving', min: 75 },
  { tier: 'Engaged',  min: 55 },
  { tier: 'Watch',    min: 35 },
  { tier: 'At-Risk',  min: 15 },
  { tier: 'Inactive', min: 0  },
]

function computeHealthScore(row: Record<string, string>): number {
  let score = 50
  const dues = parseFloat(row['annual_dues'] ?? row['AnnualDues'] ?? '0') || 0
  const lastVisit = row['last_visit'] ?? row['LastVisit'] ?? ''
  const joinYear = parseInt(row['join_year'] ?? row['JoinYear'] ?? '0') || 0
  const complaints = parseInt(row['open_complaints'] ?? row['OpenComplaints'] ?? '0') || 0

  if (dues > 5000) score += 10
  if (dues > 15000) score += 10
  if (lastVisit) {
    const days = Math.floor((Date.now() - new Date(lastVisit).getTime()) / 86400_000)
    if (days < 14) score += 20
    else if (days < 30) score += 10
    else if (days < 60) score -= 5
    else if (days < 90) score -= 15
    else score -= 25
  }
  if (joinYear > 0 && (new Date().getFullYear() - joinYear) > 5) score += 5
  if (complaints > 0) score -= complaints * 5

  return Math.max(0, Math.min(100, score))
}

function computeTier(score: number): string {
  return TIER_THRESHOLDS.find(t => score >= t.min)?.tier ?? 'Inactive'
}

function computeArchetype(row: Record<string, string>): string {
  const dues = parseFloat(row['annual_dues'] ?? row['AnnualDues'] ?? '0') || 0
  const joinYear = parseInt(row['join_year'] ?? row['JoinYear'] ?? '0') || 0
  const age = parseInt(row['age'] ?? row['Age'] ?? '0') || 0
  const years = new Date().getFullYear() - joinYear
  if (dues > 20000) return 'Platinum Anchor'
  if (years > 15) return 'Legacy Member'
  if (age < 45 && years < 5) return 'Rising Member'
  if (dues < 5000) return 'Value Member'
  return 'Core Member'
}

function parseCSV(body: string): Record<string, string>[] {
  const lines = body.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
    return row
  }).filter(r => Object.values(r).some(v => v))
}

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const clubId = (req.query.club_id as string) || 'bowling-green-cc'

  const csvBody = typeof req.body === 'string'
    ? req.body
    : Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : JSON.stringify(req.body)

  const rows = parseCSV(csvBody)
  if (rows.length === 0) return res.status(400).json({ error: 'No valid CSV rows found' })

  const errors: string[] = []
  let inserted = 0
  const tierCounts: Record<string, number> = {}

  for (const row of rows) {
    const memberId = row['member_id'] ?? row['MemberID'] ?? row['member_number'] ?? row['MemberNumber']
    const firstName = row['first_name'] ?? row['FirstName'] ?? row['fname'] ?? ''
    const lastName  = row['last_name']  ?? row['LastName']  ?? row['lname'] ?? ''
    if (!memberId || !firstName) { errors.push(`Skipped row: missing member_id or first_name`); continue }

    const healthScore    = computeHealthScore(row)
    const engagementTier = computeTier(healthScore)
    const archetype      = computeArchetype(row)
    const annualDues     = parseFloat(row['annual_dues'] ?? row['AnnualDues'] ?? '0') || 0
    const email          = row['email'] ?? row['Email'] ?? ''
    const phone          = row['phone'] ?? row['Phone'] ?? ''
    const membershipType = row['membership_type'] ?? row['MembershipType'] ?? 'Full'
    const joinDate       = row['join_date'] ?? row['JoinDate'] ?? null

    tierCounts[engagementTier] = (tierCounts[engagementTier] ?? 0) + 1

    try {
      await sql`
        INSERT INTO members (
          member_id, club_id, first_name, last_name, email, phone,
          membership_type, annual_dues, health_score, engagement_tier, archetype,
          join_date, ingested_at
        ) VALUES (
          ${memberId}, ${clubId}, ${firstName}, ${lastName}, ${email}, ${phone},
          ${membershipType}, ${annualDues}, ${healthScore}, ${engagementTier}, ${archetype},
          ${joinDate ? new Date(joinDate).toISOString() : null}, NOW()
        )
        ON CONFLICT (member_id) DO UPDATE SET
          first_name       = EXCLUDED.first_name,
          last_name        = EXCLUDED.last_name,
          email            = EXCLUDED.email,
          phone            = EXCLUDED.phone,
          membership_type  = EXCLUDED.membership_type,
          annual_dues      = EXCLUDED.annual_dues,
          health_score     = EXCLUDED.health_score,
          engagement_tier  = EXCLUDED.engagement_tier,
          archetype        = EXCLUDED.archetype,
          ingested_at      = NOW()
      `
      inserted++
    } catch (e) {
      errors.push(`Row ${memberId}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const tierSummary = Object.entries(tierCounts).map(([tier, count]) => ({ tier, count }))
    .sort((a, b) => ['Thriving','Engaged','Watch','At-Risk','Inactive'].indexOf(a.tier) - ['Thriving','Engaged','Watch','At-Risk','Inactive'].indexOf(b.tier))

  res.json({
    club_id: clubId,
    total_rows: rows.length,
    inserted,
    errors: errors.slice(0, 20),
    tier_summary: tierSummary,
    message: `${inserted} members ingested for ${clubId}`,
  })
}
