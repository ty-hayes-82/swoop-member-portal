# Sentiment Layer Architecture Spike

## Purpose
Add a lightweight self-reported satisfaction layer to complement Swoop's behavioral signals. Currently, member health is inferred entirely from activity data (golf rounds, dining visits, email opens, event attendance). A member who plays 3 rounds/week but privately complains to friends is invisible until behavioral decay begins. Sentiment data closes this gap by catching dissatisfied members before their behavior changes.

## Problem Statement
- Theme C (Experience-Outcome Links) scores 4.7/5 but satisfaction is inferred, not measured
- No NPS, CSAT, or post-experience feedback currently flows into health scores
- A member with high activity but low sentiment is a hidden churn risk
- The `feedback` table in Postgres already has a `sentiment_score` column (0-1) that is unused

---

## Data Model

### New Table: `member_sentiment_ratings`

```sql
CREATE TABLE member_sentiment_ratings (
  rating_id       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  club_id         TEXT NOT NULL,
  member_id       TEXT NOT NULL,
  rating_type     TEXT NOT NULL,        -- 'post_round', 'post_dining', 'post_event', 'general'
  score           REAL NOT NULL,        -- 1-5 scale (maps to 0.0-1.0 internally)
  normalized      REAL GENERATED ALWAYS AS ((score - 1) / 4.0) STORED, -- 0.0-1.0
  comment         TEXT,                 -- optional free-text (max 500 chars)
  context_id      TEXT,                 -- links to round_id, reservation_id, or event_id
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source          TEXT NOT NULL,        -- 'kiosk', 'sms_survey', 'email_survey', 'app'
  archived        BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_sentiment_member ON member_sentiment_ratings(member_id, submitted_at DESC);
CREATE INDEX idx_sentiment_club   ON member_sentiment_ratings(club_id, rating_type);
```

### Aggregated View: `member_sentiment_summary`

```sql
CREATE MATERIALIZED VIEW member_sentiment_summary AS
SELECT
  member_id,
  club_id,
  COUNT(*)                                          AS total_ratings,
  ROUND(AVG(normalized)::NUMERIC, 2)               AS avg_sentiment,
  ROUND(AVG(normalized) FILTER (WHERE submitted_at > NOW() - INTERVAL '30 days')::NUMERIC, 2) AS sentiment_30d,
  ROUND(AVG(normalized) FILTER (WHERE submitted_at > NOW() - INTERVAL '90 days')::NUMERIC, 2) AS sentiment_90d,
  ROUND(AVG(score) FILTER (WHERE rating_type = 'post_round')::NUMERIC, 1)   AS avg_round_rating,
  ROUND(AVG(score) FILTER (WHERE rating_type = 'post_dining')::NUMERIC, 1)  AS avg_dining_rating,
  ROUND(AVG(score) FILTER (WHERE rating_type = 'post_event')::NUMERIC, 1)   AS avg_event_rating,
  COUNT(*) FILTER (WHERE score <= 2)                AS detractor_count,
  COUNT(*) FILTER (WHERE score >= 4)                AS promoter_count,
  MAX(submitted_at)                                 AS last_rating_at
FROM member_sentiment_ratings
WHERE archived = FALSE
GROUP BY member_id, club_id;
```

### Existing Table Integration: `feedback`

The existing `feedback` table already has:
- `sentiment_score REAL` (0-1 range)
- `category TEXT` (course_conditions, dining_service, events, etc.)
- `member_id TEXT`

**Migration**: Backfill `member_sentiment_ratings` from existing feedback rows where `sentiment_score IS NOT NULL`, mapping 0-1 to 1-5 scale (`score = sentiment_score * 4 + 1`).

---

## Collection Points

### 1. Post-Round SMS Survey (Primary)
- **Trigger**: Tee sheet check-in completion + 30 minutes
- **Channel**: SMS to member's phone (already have phone numbers in member profile)
- **Format**: "How was your round today? Reply 1-5 (1=poor, 5=great)" + optional follow-up for scores <= 2
- **Expected response rate**: 35-45% (industry benchmark for single-question SMS)
- **Integration**: Tee sheet system fires webhook → Swoop API → `member_sentiment_ratings`

### 2. Post-Dining Kiosk/QR (Secondary)
- **Trigger**: POS transaction completion at F&B outlets
- **Channel**: QR code on receipt or table tent → mobile web form
- **Format**: 5-star rating + optional 1-line comment
- **Expected response rate**: 15-25%
- **Integration**: QR links to `{club_domain}/feedback?member={id}&type=post_dining&context={receipt_id}`

### 3. Post-Event Email (Tertiary)
- **Trigger**: Event attendance record + 24 hours
- **Channel**: Email with embedded 1-click rating (1-5 star images in email body)
- **Format**: Click a star to rate, lands on confirmation page with optional comment
- **Expected response rate**: 20-30%
- **Integration**: Email tracking system → rating API endpoint

### 4. In-App General Rating (Future)
- **Trigger**: Monthly prompt in mobile app or desktop dashboard
- **Channel**: In-app modal
- **Format**: "How is your overall club experience this month?" 1-5 + optional text
- **Integration**: Direct API call from client

---

## Health Score Integration

### Current Weight Distribution
```
Golf Engagement:  30%
Dining Frequency: 25%
Email Engagement: 25%
Event Attendance: 20%
─────────────────────
Total:           100%
```

### Proposed Weight Distribution (Phase 1 — Overlay)
```
Golf Engagement:  30%  (unchanged)
Dining Frequency: 25%  (unchanged)
Email Engagement: 25%  (unchanged)
Event Attendance: 20%  (unchanged)
─────────────────────
Behavioral Total: 100%

Sentiment Modifier: ±5 points
```

**Phase 1 approach**: Sentiment does NOT replace any behavioral dimension. It acts as a modifier:
- `avg_sentiment >= 0.8` (scores 4-5): +5 points to health score
- `avg_sentiment 0.5-0.79` (scores 3): no modifier
- `avg_sentiment 0.3-0.49` (scores 2): -3 points
- `avg_sentiment < 0.3` (score 1): -5 points
- No ratings submitted: no modifier (don't penalize non-respondents)

**Rationale**: A ±5 point modifier is enough to push a Watch member (score 68) to Healthy (73) or an At-Risk member (score 32) to Critical (27), but won't override strong behavioral signals. This is intentionally conservative for Phase 1.

### Proposed Weight Distribution (Phase 2 — Full Dimension)
```
Golf Engagement:  25%  (-5)
Dining Frequency: 20%  (-5)
Email Engagement: 20%  (-5)
Event Attendance: 15%  (-5)
Sentiment Rating: 20%  (new)
─────────────────────
Total:           100%
```

Phase 2 only activates when a member has 5+ sentiment ratings (sufficient data). Members with fewer ratings stay on the Phase 1 modifier model.

---

## Service Layer

### New File: `src/services/sentimentService.js`

```javascript
// sentimentService.js — sentiment rating data
let _d = { ratings: [], summaries: [] };

export const _init = async () => {
  try {
    const res = await fetch('/api/sentiment');
    if (res.ok) {
      const data = await res.json();
      _d = data;
    }
  } catch {}
};

export const getMemberSentiment = (memberId) => {
  return _d.summaries.find(s => s.member_id === memberId) || null;
};

export const getRecentRatings = (memberId, limit = 10) => {
  return _d.ratings
    .filter(r => r.member_id === memberId)
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    .slice(0, limit);
};

export const getSentimentDistribution = () => {
  const summaries = _d.summaries;
  return {
    total: summaries.length,
    positive: summaries.filter(s => s.avg_sentiment >= 0.7).length,
    neutral: summaries.filter(s => s.avg_sentiment >= 0.3 && s.avg_sentiment < 0.7).length,
    negative: summaries.filter(s => s.avg_sentiment < 0.3).length,
    avgScore: summaries.length
      ? summaries.reduce((sum, s) => sum + s.avg_sentiment, 0) / summaries.length
      : null,
  };
};

export const getSentimentHealthModifier = (memberId) => {
  const s = getMemberSentiment(memberId);
  if (!s || s.total_ratings === 0) return 0;
  if (s.avg_sentiment >= 0.8) return 5;
  if (s.avg_sentiment >= 0.5) return 0;
  if (s.avg_sentiment >= 0.3) return -3;
  return -5;
};
```

### API Endpoint: `api/sentiment.js`

```javascript
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { member_id, club_id, rating_type, score, comment, context_id, source } = req.body;
    await sql`
      INSERT INTO member_sentiment_ratings (club_id, member_id, rating_type, score, comment, context_id, source)
      VALUES (${club_id}, ${member_id}, ${rating_type}, ${score}, ${comment}, ${context_id}, ${source})
    `;
    // Refresh materialized view
    await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY member_sentiment_summary`;
    return res.json({ ok: true });
  }

  // GET — return all summaries + recent ratings
  const summaries = await sql`SELECT * FROM member_sentiment_summary`;
  const ratings = await sql`
    SELECT * FROM member_sentiment_ratings
    WHERE submitted_at > NOW() - INTERVAL '90 days'
    ORDER BY submitted_at DESC
    LIMIT 500
  `;
  res.json({ summaries: summaries.rows, ratings: ratings.rows });
}
```

---

## UI Integration Points

### A. Member Profile Drawer — Sentiment Overlay
**File**: `src/features/member-profile/MemberProfileDrawer.jsx`

Add below the Health Score Breakdown section:
- If member has ratings: show average sentiment (1-5 stars), last 3 ratings with timestamps, and the health modifier being applied
- If no ratings: show "No satisfaction ratings yet" with a muted tone
- Display format: star icons (filled/empty) + numeric average + trend sparkline

### B. Health Overview — Sentiment Risk Signal
**File**: `src/features/member-health/tabs/HealthOverview.jsx`

New alert card (similar to Volatile Members):
- "Silent Dissatisfaction" — members with high behavioral scores (>60) but low sentiment (<0.3)
- These are the "playing but unhappy" members the review identified as a blind spot
- Card shows: member name, health score, avg sentiment, last complaint/comment

### C. Insights Tab — Sentiment Correlation Card
**File**: `src/services/experienceInsightsService.js`

New correlation insight:
```javascript
{
  id: 'sentiment-retention',
  headline: 'Members with sentiment scores above 4.0 renew at 96% vs. 71% for below 2.5',
  detail: 'Self-reported satisfaction correlates with retention independent of activity levels...',
  domains: ['Sentiment', 'Retention'],
  impact: 'high',
  metric: { value: '96%', label: 'renewal (high sentiment)' },
  trend: [...], delta: '+25pp', deltaDirection: 'up',
}
```

### D. Survey Intelligence Tab — Live Sentiment Dashboard
**File**: `src/features/experience-insights/tabs/SurveyTab.jsx`

Replace the current NPS sample data with live sentiment data:
- Distribution chart (1-5 rating histogram)
- Sentiment by archetype (table: archetype, avg score, response rate, trend)
- Sentiment by touchpoint (post-round vs. post-dining vs. post-event)
- Recent low-score alerts with member names and comments
- Response rate tracking over time

### E. Board Report — Sentiment KPI
**File**: `src/features/board-report/BoardReport.jsx`

Add to KPI strip:
- "Member Satisfaction: 4.2/5" (or NPS equivalent)
- Include in industry benchmarks comparison
- Add to "What We Learned" if significant correlations emerge

---

## Risk Signal Integration

### New Risk Signal Type
When a member submits a rating of 1 or 2:

```javascript
// In sentiment API POST handler
if (score <= 2) {
  // Create automatic risk signal
  await sql`
    INSERT INTO member_risk_signals (member_id, signal_type, description, source, created_at)
    VALUES (
      ${member_id},
      'low_sentiment',
      ${`Low satisfaction rating (${score}/5) after ${rating_type.replace('_', ' ')}`},
      'Sentiment Survey',
      NOW()
    )
  `;
}
```

This integrates directly into the existing risk signal framework — the member's profile will show "Low satisfaction rating (2/5) after post-round" as a risk signal with source "Sentiment Survey."

### Auto-Escalation Rule
- 2 consecutive low ratings (score <= 2) within 14 days → create a HIGH priority action in the Inbox
- Action: "Service recovery outreach recommended — {member_name} has submitted 2 low satisfaction ratings"
- Routes to GM with the specific feedback comments attached

---

## Implementation Phases

### Phase 1: Foundation (1-2 weeks)
- Create `member_sentiment_ratings` table and materialized view
- Build `sentimentService.js` with static fallback data
- Add sentiment overlay to member profile (display only)
- Wire into DataProvider initialization
- Add ±5 point health modifier

### Phase 2: Collection (2-3 weeks)
- Build POST endpoint for rating submission
- Build mobile-friendly rating submission page (QR code target)
- Set up post-round SMS trigger integration point (requires tee sheet webhook)
- Add post-event email rating template
- Build response rate tracking

### Phase 3: Intelligence (1-2 weeks)
- Add "Silent Dissatisfaction" alert to Health Overview
- Add sentiment correlation card to Insights tab
- Replace SurveyTab sample data with live sentiment dashboard
- Add sentiment KPI to Board Report
- Implement auto-escalation for consecutive low ratings

### Phase 4: Weight Rebalance (after 90 days of data)
- Analyze whether sentiment predicts churn better than behavioral signals alone
- If yes: shift to Phase 2 weight distribution (20% sentiment)
- If no: keep as ±5 modifier and investigate why

---

## Static Fallback Data (Demo/Phase 1)

For the demo environment, seed with plausible data:

```javascript
// src/data/sentiment.js
export const sentimentRatings = [
  { member_id: 'mbr_042', rating_type: 'post_round', score: 2, comment: 'Pace of play was terrible today. Over 5 hours.', submitted_at: '2026-01-18T16:30:00Z', source: 'sms_survey' },
  { member_id: 'mbr_042', rating_type: 'post_dining', score: 1, comment: 'Waited 25 minutes for a table at the Grill Room.', submitted_at: '2026-01-22T19:15:00Z', source: 'kiosk' },
  { member_id: 'mbr_203', rating_type: 'post_round', score: 4, comment: null, submitted_at: '2026-01-20T14:00:00Z', source: 'sms_survey' },
  { member_id: 'mbr_203', rating_type: 'post_round', score: 2, comment: 'Starter was rude to my guest.', submitted_at: '2026-01-25T11:00:00Z', source: 'sms_survey' },
  { member_id: 'mbr_089', rating_type: 'general', score: 3, comment: 'Club is fine but nothing exciting happening.', submitted_at: '2026-01-15T10:00:00Z', source: 'email_survey' },
  // ... 30-50 sample ratings across 15-20 members
];

export const sentimentSummaries = [
  { member_id: 'mbr_042', avg_sentiment: 0.25, sentiment_30d: 0.19, total_ratings: 8, detractor_count: 5, promoter_count: 1, avg_round_rating: 2.1, avg_dining_rating: 1.8 },
  { member_id: 'mbr_203', avg_sentiment: 0.56, sentiment_30d: 0.50, total_ratings: 4, detractor_count: 1, promoter_count: 1, avg_round_rating: 3.0, avg_dining_rating: null },
  { member_id: 'mbr_089', avg_sentiment: 0.44, sentiment_30d: 0.38, total_ratings: 3, detractor_count: 1, promoter_count: 0, avg_round_rating: 2.5, avg_dining_rating: 3.5 },
  // ... summaries for seeded members
];
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Response rate (SMS post-round) | >35% within 90 days | Ratings submitted / rounds played |
| Response rate (QR post-dining) | >15% within 90 days | Ratings submitted / dining transactions |
| Sentiment-churn correlation | r > 0.6 | Pearson correlation: avg_sentiment vs. renewal |
| Early detection improvement | +2 weeks | Time from first low sentiment to behavioral decay |
| "Silent dissatisfaction" catches | 5+ members/quarter | Members with high activity but low sentiment flagged before behavioral change |
| Health score accuracy improvement | +5% | Prediction accuracy of 6-month churn with sentiment vs. without |

---

## Dependencies

- **Tee sheet webhook** for post-round SMS trigger (requires vendor integration)
- **SMS provider** (Twilio or similar) for survey delivery
- **POS receipt customization** for QR code on F&B receipts
- **Email template system** for post-event rating emails
- None of the UI integration points require these — they work with static fallback data immediately

## Constraints

- NEVER add puppeteer/prerenderer (breaks Vercel builds)
- All calculations from contract/config, not hardcoded formulas
- Sentiment must not override strong behavioral signals in Phase 1
- Non-respondents must not be penalized (absence of data ≠ low satisfaction)
