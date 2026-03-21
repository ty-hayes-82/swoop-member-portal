# Swoop Golf — Mobile Product Plan
## Club Intelligence in Your Pocket

---

## 1. Core Objective

Swoop's desktop experience is a comprehensive club intelligence platform built for seated, analytical work. The mobile experience must be fundamentally different — it exists to enable GMs and on-the-ground staff to **act on club intelligence in real time**, wherever they are.

### Top 5 Daily GM Decisions (Mobile Must Answer)

| # | Decision | Desktop Data | Mobile Surface |
|---|----------|-------------|----------------|
| 1 | Which at-risk members need my attention today? | 65 at-risk, $733K exposure | Top 3 calls with names + dollar values |
| 2 | Are there unresolved service failures? | Pamela Ulrich 50 days, $75K LTV | Push notification with "Call Now" |
| 3 | Is staffing aligned with demand? | Labor Optimizer flagged lunch server | Approve/override in seconds |
| 4 | What's the highest-impact revenue action? | $84K/mo across 4 categories | Deploy rangers → $5,760/mo with "Act" button |
| 5 | How did this week perform? | 6 WoW trend metrics | 3 trend arrows: Revenue, Complaints, At-Risk |

### Top 5 Real-Time Staff Actions

1. Look up member health score + preferences before live interaction (10 seconds)
2. Log complaint/feedback on the spot (server at table, not "remember for later")
3. Approve/dismiss AI agent recommendations (one-tap from notification)
4. Fill tee-sheet cancellations using retention-priority queue
5. Execute outreach: call, SMS, email, comp — from anywhere on property

---

## 2. Mobile User Segmentation

### General Manager (Strategic + Oversight)
- **Mobile goals:** Triage highest-risk moments, approve AI actions, make 2-3 retention calls while moving
- **Key workflows:** Morning briefing scan, action inbox triage, one-tap call initiation, end-of-day check
- **Hide on mobile:** Full member roster, archetype deep dives, scenario modeling, board report generation, AI agent config, playbook editing, connected systems, data upload, churn anatomy timelines, correlation analytics

### F&B / Service Staff (Execution + Service Recovery)
- **Mobile goals:** Recognize members during service, log complaints immediately, receive staffing alerts
- **Key workflows:** Member lookup (health score, archetype, preferences, complaints), complaint logging form, staffing alert acknowledgment
- **Hide on mobile:** Revenue breakdowns, dues-at-risk totals, board reports, AI agent management, waitlist management, email decay analytics

### Golf Ops / Pro Shop (Tee Sheet + Experience)
- **Mobile goals:** Fill cancellations via retention-priority routing, manage waitlist, identify at-risk golfers on today's sheet
- **Key workflows:** Cancellation alert → retention candidate → confirm fill, tee-sheet with health overlay, ranger deployment confirmation
- **Hide on mobile:** F&B analytics, dining spend gaps, staffing optimization, board reports, outreach configuration

### Events / Membership (Engagement + Retention)
- **Mobile goals:** See at-risk members for personal event invites, track outreach progress, log touchpoint outcomes
- **Key workflows:** At-risk list filtered to outreach responsibility, outreach status tracking, member quick view during events
- **Hide on mobile:** Pace-of-play analytics, ranger deployment, tee-sheet management, staffing optimization, revenue leakage

---

## 3. Mobile Product Principles

### Surfaced vs. Hidden

| Surfaced (Mobile) | Hidden (Desktop Only) |
|---|---|
| Dollar-denominated urgency | Methodology and timelines |
| Pending action count | Churn anatomy decay sequence |
| Top 3 at-risk members | Full archetype correlation matrix |
| Single highest-impact action | Scenario modeling sliders |
| Health score as large colored number | Score breakdown by dimension |
| One-line member status | Full engagement history |

### Alert vs. Dashboard

| Alert (Push Notification) | Dashboard (In-App, On-Demand) |
|---|---|
| Complaint aged past SLA threshold | Week-over-week performance trends |
| Health score drops to Critical | Health distribution (200/35/39/26) |
| Tee-time cancellation with fill candidate | Revenue snapshot with breakdown |
| Staffing gap for today's shift | Action history log |
| AI action requiring approval > $5K impact | |

**Principle:** If inaction causes measurable harm within 24 hours, it's a push notification. Everything else is pull.

### Action vs. Insight

| Action (One-Tap) | Insight (Read-Only) |
|---|---|
| Approve/dismiss AI recommendation | Health score breakdown |
| Initiate call to at-risk member | WoW performance comparisons |
| Assign complaint owner | Revenue category distribution |
| Confirm tee-time fill | Intervention outcome history |
| Acknowledge staffing alert | |

**Principle:** Every mobile screen must answer "what should I do?" — not "what happened?"

### Real-Time vs. Periodic

| Real-Time (Live Sync) | Periodic (Morning + EOD) |
|---|---|
| Complaint filings and escalations | WoW performance metrics |
| Tee-time cancellations and waitlist changes | Revenue opportunity calculations |
| Health score threshold crossings | Archetype distributions |
| Staffing demand forecasts | Outreach sequence progress |

---

## 4. Core Mobile Experience

### Screen 1: Home / Cockpit
**Purpose:** Complete situational picture in one glance. Zero interaction required.

```
┌─────────────────────────────────┐
│ 🔴 CRITICAL: Pamela Ulrich     │
│ 50 days unresolved · $75K LTV  │
│                    [Call Now]   │
├────────────────┬────────────────┤
│ 65 At-Risk     │ 3 Complaints  │
│ $733K exposure │ unresolved    │
├────────────────┬────────────────┤
│ 9 Pending      │ Revenue       │
│ actions        │ ↑ 10.7% WoW   │
├────────────────┴────────────────┤
│ ⚡ Deploy rangers → +$5,760/mo │
│                         [Act]   │
├─────────────────────────────────┤
│ Since last visit: +2 at-risk,  │
│ 3 actions completed, net ↑     │
└─────────────────────────────────┘
```

**Key elements:**
- Critical alert banner (red) with member name, issue age, dollar value, "Call Now"
- 4 metric tiles (2x2): At-Risk, Complaints, Pending Actions, Revenue Trend
- Highest-impact action card with "Act" button
- "Since your last visit" delta line

### Screen 2: Alerts / Notifications
**Purpose:** Centralized push notification inbox organized by urgency.

- Cards grouped: "Requires Action" (red) and "Informational" (gray)
- Each card: category icon, member name, summary, dollar impact, timestamp
- Swipe right → approve/acknowledge, swipe left → dismiss/defer
- Filter toggles: All, Service, Retention, Operations
- Every notification contains exactly one embedded action

### Screen 3: Tasks / Actions
**Purpose:** Swipeable action inbox — where work gets done.

- Card stack of pending AI recommendations
- Each card: action type badge, member name, description, impact, source agent
- Swipe right → approve (optional note), swipe left → dismiss (reason required)
- Tap → expand signals, member context, "What happens next?"
- Counter: "X pending · Y approved today · Z dismissed"
- Overdue items pinned to top (cannot dismiss without action or deferral reason)

### Screen 4: Member Profile (Mobile Card)
**Purpose:** Instant contextual intelligence during live interactions.

```
┌─────────────────────────────────┐
│ James Whitfield          ⛳     │
│ Die-Hard Golfer · Since 2019   │
├─────────────────────────────────┤
│          42                     │
│     Health Score                │
│     ████████░░░░ At Risk       │
├─────────────────────────────────┤
│ Dues: $18,500/yr               │
│ Last visit: 3 days ago (Golf)  │
│ ⚠ Open complaint: slow lunch   │
│   service, Jan 8               │
├─────────────────────────────────┤
│ [📞 Call] [💬 SMS] [✉️ Email]  │
│ [🎁 Comp] [📝 Log Feedback]   │
└─────────────────────────────────┘
```

**Key elements:**
- Name, archetype icon, tenure, health score (large, color-coded)
- Annual dues, last visit, one-line status
- Action buttons: Call, SMS, Email, Comp, Log Feedback
- "View Full Profile on Desktop" link

### Screen 5: Opportunities / Revenue Feed
**Purpose:** Daily highest-value revenue actions.

- Total addressable: $84K/mo headline
- 3-5 action cards ranked by impact
- Each: description, category tag, monthly impact, effort tag (Quick Win / High Value)
- "This Week's Wins" counter
- "Act" → execute or "Assign" → pick staff member

### Navigation
Bottom tab bar: **Cockpit** (home) · **Alerts** (bell + badge) · **Tasks** (checkbox + badge) · **Members** (person + search) · **Opportunities** (dollar)

---

## 5. Feature Prioritization

### Tier 1 — Must Have (Day 1 Launch)

| Feature | Description | Ties To |
|---------|-------------|---------|
| Daily Operator Cockpit | Single-screen morning briefing | Revenue, Retention, Efficiency |
| Push Notification Engine | 5 notification categories with embedded actions | Retention, Revenue, Efficiency |
| Action Inbox (Swipeable) | Approve/dismiss AI recommendations via swipe | Efficiency, Revenue, Retention |
| Member Quick Lookup | Name search → mobile member card in <500ms | Experience, Retention, Efficiency |
| Complaint/Feedback Logger | 3-field form, auto-timestamps, routes to queue | Retention, Efficiency, Experience |

### Tier 2 — High Impact Enhancements

| Feature | Description | Ties To |
|---------|-------------|---------|
| Tee-Time Fill Flow | Cancellation → retention candidate → one-tap fill | Revenue, Retention |
| Revenue Opportunity Feed | Daily Top 3-5 actions with Act/Assign buttons | Revenue, Efficiency |
| Staff-Specific Task Views | Role-filtered action lists (F&B, Pro Shop, Events) | Efficiency, Experience |
| Outreach Quick Actions | One-tap call, SMS, email, comp from member cards | Retention, Efficiency |
| Intervention Outcome Tracking | Log response + outcome after outreach actions | Retention, Revenue |

### Tier 3 — Future / Expansion

| Feature | Description | Ties To |
|---------|-------------|---------|
| Predictive Daily Briefing | AI-generated morning narrative with weather + tee times | Efficiency, Revenue, Experience |
| Check-In Triggered Cards | Auto-surface member card on POS/check-in event | Experience, Retention |
| Voice-Activated Logging | Speech-to-text complaint logging, hands-free | Efficiency, Experience |
| Geo-Fenced Contextual Alerts | Zone-specific intelligence (Grill Room, Pro Shop, 1st Tee) | Efficiency, Experience |
| Team Performance Dashboard | Per-staff execution metrics and coaching data | Efficiency, Retention |

---

## 6. UX Simplification Strategy

### Remove Entirely from Mobile
- Full 300-member table with sorting/pagination
- Archetype correlation analytics and insight cards
- Churn anatomy decay timeline visualization
- Scenario modeling sliders
- Board report generator and export/print
- AI agent configuration, thought logs, baseline tracking
- Connected systems settings and data upload
- Full revenue leakage breakdown with comparison grids
- Bottleneck hole detail cards
- Spend potential by archetype campaign launcher
- Playbook editing and response plan configuration
- Historical resignation case studies

### Condense into Summaries
- Health distribution (200/35/39/26) → single colored bar + at-risk count
- WoW trend table (6 metrics) → 3 trend arrows on cockpit
- Revenue breakdown ($19K + $9.7K + $4K + $61K) → "$84K/mo addressable" + top action
- Recent interventions (3 items) → "3 actions, $3,400 protected" counter
- First Domino Alert (7 members) → badge count on at-risk tile

### Convert into Alerts/Actions
- Pamela Ulrich complaint → push on Day 1, 3, 7, then weekly
- Staffing gap → push with Approve/Dismiss
- Tee-time cancellation with candidate → push with "Fill"
- Health score threshold crossing → push with "Call"
- "Call top 3 Critical members" → 8 AM morning push with names + deep link

---

## 7. Development Plan

### Phase 1: MVP (Weeks 1-8)

**Ships:** Cockpit, Push Notifications (service + health only), Action Inbox (swipeable), Member Quick Lookup

**Acceptance Criteria:**
- Cockpit loads < 2 seconds with all 5 elements
- Push delivers within 60 seconds of trigger
- Swipe approve/dismiss with confirmation
- Member search returns results within 500ms at 3+ characters
- Functional on iOS + Android (375-428px viewports)

**Dependencies:**
- Real-time data sync from 17 connected systems
- Push notification service (Firebase/APNs)
- Auth + role-based access (reuse desktop)
- API endpoints: cockpit summary, notification triggers, action CRUD, member search

**Key Decision:** PWA vs. native app. Recommendation: **PWA first** — no app store install friction, works from mobile browser bookmark, can be converted to native later with Capacitor/Expo if needed.

### Phase 2: Workflow Depth (Weeks 9-16)

**Ships:** Complaint Logger, Tee-Time Fill, Staff Task Views, Outreach Quick Actions, Revenue Feed

**Acceptance Criteria:**
- Feedback logger: < 3 taps + 1 text field
- Tee-time fill: < 15 seconds from notification to confirmation
- Staff views: role-filtered (F&B never sees tee-sheet)
- Quick actions: calls initiate, messages send
- Revenue feed refreshes daily at 6 AM

**Dependencies:**
- POS integration for complaint categorization
- Tee-sheet write access for fill confirmations
- SMS/email sending infrastructure
- Role definitions in admin settings
- Staff training materials

### Phase 3: Intelligence Layer (Weeks 17-24)

**Ships:** Predictive Daily Briefing, Check-In Triggered Cards, Outcome Tracking, Expanded Notifications, Team Dashboard

**Acceptance Criteria:**
- Daily briefing generates by 6 AM, contextually accurate
- Check-in triggers member card within 3 seconds
- Outcome tracking feeds back into health scores
- Team dashboard shows per-staff execution metrics

**Dependencies:**
- POS event stream for triggered cards
- NLG model for briefing (leverage existing AI agents)
- Outcome-to-health feedback loop
- Staff performance data aggregation

---

## 8. Success Criteria

### Daily Active Usage

| Role | Target | Timeline | Leading Indicator |
|------|--------|----------|-------------------|
| GM | 85% daily open rate | 60 days post-launch | "Morning briefing" sessions 6-9 AM (target 70%+) |
| Staff | 50% use 3x/shift | 90 days post-Phase 2 | Mobile complaint logs as % of total (target 80%+) |

### Time-to-Decision Reduction

| Metric | Current (Desktop) | Target (Mobile) | Timeline |
|--------|-------------------|-----------------|----------|
| Complaint response time | 4.2 hours | < 2 hours | 90 days post-Phase 1 |
| Action approval latency | 12-24 hours | < 2 hours (high), < 8 hours (standard) | 90 days |
| Tee-time fill speed | Hours (manual) | < 30 minutes | Phase 2 launch |

### Revenue / Retention Impact

| Metric | Baseline | Target | Timeline |
|--------|----------|--------|----------|
| Members saved (mobile-initiated) | 14/quarter | +25% increase | 6 months |
| Revenue from mobile actions | $0 | 30% of total recovered | 6 months |
| Staffing alerts acted on proactively | ~0% | 80% before shift starts | 6 months |
| Board report ROI | 16:1 | 20:1 | 12 months |

---

## 9. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| GMs won't install another app | Launch as PWA — bookmark, not install |
| Notification fatigue in Week 1 | Launch with only 2 categories (service + health), expand later |
| Staff resist carrying phones during service | Design 10-second one-hand complaint logger, position as accountability tool |
| Tee-time fill trust | GM reviews fills before auto-routing in Phase 1 |
| Predictive briefing accuracy | Run 2 weeks shadow mode comparing predictions to actuals before surfacing |
| POS integration latency for triggered cards | Test extensively with club's specific POS vendor pre-launch |

---

## Design Principles

> **Desktop = Analysis. Mobile = Execution.**
>
> Every mobile screen is a decision surface, not a dashboard.
> If a screen can't answer "what should I do right now?" — it doesn't belong on mobile.
> The app succeeds when a GM checks it more than their email.
