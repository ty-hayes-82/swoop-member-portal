# New Club SMS Setup: Complete Implementation Map

---

## Overview

This document maps every step from "a club signs up" to "agents are sending SMS to members and staff." It covers infrastructure, data requirements, consent, configuration, message templates, inbound reply handling, and the exact database schema and API routes needed.

---

## Phase 1: Club Registration & Data Import

### Step 1.1: Create the Club

**Existing endpoint:** `POST /api/onboard-club`

Already handles club creation, generates `club_id`, creates onboarding progress tracker. No changes needed.

**What's collected at registration:**
```
Club name, city, state, zip
Member count (approximate)
Course count, outlet count
Admin contact: name, email
```

**What's NOT collected yet but needed for SMS:**
```
Club phone identity (the "From" number or brand name members see)
SMS consent policy acknowledgment
Staff phone numbers for alert routing
```

### Step 1.2: Import Members with Phone Numbers

**Existing endpoint:** `POST /api/import-csv`

The `members` table already has a `phone` column. The import pipeline already handles it. The gap: phone numbers are optional in the current schema, and there's no validation or normalization.

**New: Phone normalization on import**

Add to the import pipeline (in `api/import-csv.js`, within the members processing block):

```javascript
function normalizePhone(raw) {
  if (!raw) return null;
  // Strip everything except digits
  const digits = raw.replace(/\D/g, '');
  // US numbers: ensure +1 prefix
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  // Already has country code
  if (digits.length >= 11) return `+${digits}`;
  return null; // Invalid
}
```

**Verify:** After import, run:
```sql
SELECT count(*) as total,
       count(phone) as has_phone,
       count(*) - count(phone) as missing_phone
FROM members WHERE club_id = 'club_XXXXX';
```

Target: 80%+ phone coverage. If below 60%, SMS channel will have limited reach and the club should supplement with an email-first strategy.

### Step 1.3: Import Staff / Team Members

**Existing endpoint:** `POST /api/onboard-club` (team invite step)

The `users` table exists but doesn't have a `phone` column for staff SMS alerts.

**New: Add phone to users table**

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_alerts_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS alert_categories TEXT[] DEFAULT '{}';
```

**Staff roles and their default alert categories:**

| Role | Default SMS Alert Categories |
|------|------------------------------|
| General Manager | `complaint_escalation`, `health_critical`, `staffing_gap`, `high_value_action` |
| Assistant GM | `complaint_escalation`, `staffing_gap` |
| F&B Director | `complaint_escalation` (F&B), `staffing_gap` (F&B), `dining_surge` |
| Head Golf Pro | `tee_time_cancellation`, `pace_alert`, `weather_disruption` |
| Membership Director | `health_critical`, `new_member_milestone`, `resignation_risk` |
| Events Manager | `event_capacity`, `weather_disruption` |

---

## Phase 2: SMS Infrastructure Setup

### Step 2.1: Twilio Configuration (Per-Club)

**Current state:** One Twilio account with one phone number shared across all clubs. This works for a pilot but doesn't scale.

**Target architecture:** Each club gets either:
- **Option A: Shared number with club-identifying text** (cheapest, works for 1-10 clubs)
  - Messages start with the club name: "Oakmont Hills: Great round, James..."
  - All clubs share one Twilio number
  - Inbound replies routed by matching the member's phone to a club

- **Option B: Dedicated number per club** (better for 10+ clubs)
  - Each club has its own Twilio number
  - Members see a consistent number associated with their club
  - Inbound routing is automatic (number → club mapping)

- **Option C: Twilio Messaging Service with A2P 10DLC** (required at scale)
  - Registered brand + campaign with carriers
  - Higher throughput, better deliverability, no spam filtering
  - Required by US carriers for application-to-person messaging at volume

**For V1 (pilot): Option A.** Shared number, club name prefix on every message.

**New: Club SMS config table**

```sql
CREATE TABLE IF NOT EXISTS club_sms_config (
  club_id              TEXT PRIMARY KEY REFERENCES club(club_id),
  enabled              BOOLEAN DEFAULT FALSE,
  twilio_phone_number  TEXT,                    -- null = use shared default
  messaging_service_sid TEXT,                   -- null = use default
  sender_name          TEXT NOT NULL,           -- "Oakmont Hills CC"
  quiet_hours_start    TEXT DEFAULT '21:00',    -- no SMS after 9 PM
  quiet_hours_end      TEXT DEFAULT '07:00',    -- no SMS before 7 AM
  max_daily_per_member INTEGER DEFAULT 3,       -- rate limit per member
  consent_required     BOOLEAN DEFAULT TRUE,
  default_opt_in       BOOLEAN DEFAULT FALSE,   -- new members auto-opted-in?
  welcome_message      TEXT,                    -- sent on first opt-in
  opt_out_message       TEXT DEFAULT 'You have been unsubscribed from club messages. Reply START to re-subscribe.',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 2.2: Member SMS Consent

**This is legally required.** TCPA (Telephone Consumer Protection Act) mandates prior express consent before sending marketing or informational text messages. Private clubs have some latitude (existing business relationship), but opt-in/opt-out must be respected.

**New: Member communication preferences table**

```sql
CREATE TABLE IF NOT EXISTS member_comm_preferences (
  member_id            TEXT NOT NULL REFERENCES members(member_id),
  club_id              TEXT NOT NULL REFERENCES club(club_id),
  sms_opted_in         BOOLEAN DEFAULT FALSE,
  sms_consent_date     TIMESTAMPTZ,
  sms_consent_method   TEXT,          -- 'import', 'app', 'text_reply', 'paper_form'
  email_opted_in       BOOLEAN DEFAULT TRUE,
  push_opted_in        BOOLEAN DEFAULT FALSE,
  quiet_hours_override TEXT,          -- member-specific quiet hours
  preferred_channel    TEXT DEFAULT 'sms',  -- sms, email, push
  opt_out_date         TIMESTAMPTZ,
  opt_out_reason       TEXT,
  categories_enabled   TEXT[] DEFAULT '{tee_time, dining, weather, milestone, general}',
  categories_disabled  TEXT[] DEFAULT '{}',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (member_id, club_id)
);
```

**Three paths to SMS consent:**

**Path A: Bulk import with pre-existing consent**
The club confirms that members have previously consented to club communications (most private clubs include this in membership agreements). Swoop records the consent as `consent_method: 'import'` with the import date.

```javascript
// During member import, if club has confirmed blanket consent:
await sql`
  INSERT INTO member_comm_preferences (member_id, club_id, sms_opted_in, sms_consent_date, sms_consent_method)
  VALUES (${memberId}, ${clubId}, true, NOW(), 'import')
  ON CONFLICT (member_id, club_id) DO NOTHING
`;
```

**Path B: Opt-in via welcome text**
Club sends a one-time welcome text to all members with phone numbers. Members reply YES to opt in.

```
Oakmont Hills CC: We're upgrading how we communicate with 
members. Reply YES to receive tee time updates, dining 
specials, and club alerts via text. Reply STOP at any time 
to opt out. Msg&data rates may apply.
```

Members who reply YES → `sms_opted_in = true, consent_method = 'text_reply'`
Members who don't reply → remain opted out.

**Path C: Opt-in via member app / web form**
When the member-facing PWA exists, members can toggle SMS preferences in their profile. For now, this is deferred.

### Step 2.3: Inbound Reply Handler

**Existing endpoint:** `POST /api/twilio/inbound`

Currently logs inbound messages but doesn't process them. Needs to handle:

**New: Enhanced inbound handler**

```javascript
// api/twilio/inbound.js — enhanced
const KEYWORDS = {
  // Opt-out (legally required to honor immediately)
  'STOP':       { action: 'opt_out' },
  'UNSUBSCRIBE':{ action: 'opt_out' },
  'CANCEL':     { action: 'opt_out' },
  'QUIT':       { action: 'opt_out' },
  
  // Opt-in
  'START':      { action: 'opt_in' },
  'YES':        { action: 'opt_in' },
  'SUBSCRIBE':  { action: 'opt_in' },
  
  // Action responses (from agent nudges)
  'HOLD':       { action: 'accept_hold' },
  'BOOK':       { action: 'accept_booking' },
  'EARLY':      { action: 'accept_early_tee_time' },
  'SIM':        { action: 'accept_simulator' },
  'CONFIRM':    { action: 'confirm_action' },
  'LATER':      { action: 'snooze' },
};

export default async function handler(req, res) {
  const { From, Body, MessageSid } = req.body || {};
  const keyword = (Body || '').trim().toUpperCase().split(/\s+/)[0];
  
  // Find the member by phone number
  const member = await sql`
    SELECT m.member_id, m.club_id, m.first_name, m.last_name
    FROM members m
    WHERE m.phone = ${From}
    LIMIT 1
  `;
  
  if (!member.rows[0]) {
    // Unknown number — log and ignore
    await logInbound(From, Body, MessageSid, null, null, 'unknown_sender');
    return respondTwiml(res, null);
  }
  
  const { member_id, club_id, first_name } = member.rows[0];
  const handler = KEYWORDS[keyword];
  
  if (!handler) {
    // Free-text reply — log it, potentially route to staff
    await logInbound(From, Body, MessageSid, member_id, club_id, 'free_text');
    // Notify GM that a member replied with something unexpected
    await createStaffNotification(club_id, member_id, `${first_name} replied: "${Body}"`);
    return respondTwiml(res, null);
  }
  
  switch (handler.action) {
    case 'opt_out':
      await sql`
        UPDATE member_comm_preferences 
        SET sms_opted_in = false, opt_out_date = NOW(), updated_at = NOW()
        WHERE member_id = ${member_id} AND club_id = ${club_id}
      `;
      await logInbound(From, Body, MessageSid, member_id, club_id, 'opt_out');
      const config = await getClubSmsConfig(club_id);
      return respondTwiml(res, config.opt_out_message);
      
    case 'opt_in':
      await sql`
        INSERT INTO member_comm_preferences (member_id, club_id, sms_opted_in, sms_consent_date, sms_consent_method)
        VALUES (${member_id}, ${club_id}, true, NOW(), 'text_reply')
        ON CONFLICT (member_id, club_id) DO UPDATE SET
          sms_opted_in = true, sms_consent_date = NOW(), sms_consent_method = 'text_reply', 
          opt_out_date = NULL, updated_at = NOW()
      `;
      await logInbound(From, Body, MessageSid, member_id, club_id, 'opt_in');
      return respondTwiml(res, `Welcome, ${first_name}! You'll now receive updates from your club. Reply STOP at any time to opt out.`);
      
    case 'accept_hold':
    case 'accept_booking':
    case 'accept_early_tee_time':
    case 'accept_simulator':
    case 'confirm_action':
      // Find the most recent pending intent for this member
      await processActionReply(member_id, club_id, handler.action, Body);
      await logInbound(From, Body, MessageSid, member_id, club_id, handler.action);
      return respondTwiml(res, null); // Confirmation sent by the processing function
      
    case 'snooze':
      await snoozeLatestIntent(member_id, club_id);
      await logInbound(From, Body, MessageSid, member_id, club_id, 'snooze');
      return respondTwiml(res, null);
  }
}

function respondTwiml(res, message) {
  res.setHeader('Content-Type', 'text/xml');
  if (message) {
    return res.status(200).send(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`
    );
  }
  return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
}
```

---

## Phase 3: SMS Message Templates

### The Message Catalog

Every SMS the system sends is a template with variable slots. Templates are stored per-club so clubs can customize their voice.

**New: Message templates table**

```sql
CREATE TABLE IF NOT EXISTS sms_templates (
  template_id     TEXT PRIMARY KEY,
  club_id         TEXT REFERENCES club(club_id),  -- null = system default
  category        TEXT NOT NULL,     -- tee_time, dining, weather, milestone, staff_alert, consent
  trigger_type    TEXT NOT NULL,     -- agent intent type that fires this template
  body            TEXT NOT NULL,     -- template with {{variables}}
  reply_keywords  TEXT[],            -- expected reply keywords
  max_length      INTEGER DEFAULT 160,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Member-Facing Templates

**Category: Dining**

```
TEMPLATE: dining_nudge
TRIGGER: post_round_dining_bridge
BODY: "{{club_name}}: Great round, {{first_name}}. {{table_info}} is open{{special_text}}. Hold it for 20 min? Reply HOLD or tap: {{hold_link}}"
REPLY KEYWORDS: [HOLD]
EXAMPLE: "Oakmont Hills: Great round, James. Booth 12 is open and Chef's doing the ribeye today. Hold it for 20 min? Reply HOLD or tap: swoop.golf/h/jw203"
```

```
TEMPLATE: dining_hold_confirmed
TRIGGER: member_replied_HOLD
BODY: "{{club_name}}: Done. {{table_info}} is held until {{hold_until}}. See you in there, {{first_name}}."
EXAMPLE: "Oakmont Hills: Done. Booth 12 is held until 1:15 PM. See you in there, James."
```

**Category: Tee Times**

```
TEMPLATE: tee_time_offer
TRIGGER: demand_optimizer_slot_available
BODY: "{{club_name}}: {{slot_time}} just opened on {{course}}. {{partner_text}}Book it? Reply BOOK or tap: {{book_link}}"
REPLY KEYWORDS: [BOOK]
EXAMPLE: "Oakmont Hills: Sat 8:30 AM just opened on North Course. Dave's free too. Book it? Reply BOOK or tap: swoop.golf/b/jw203-sat"
```

```
TEMPLATE: tee_time_confirmed
TRIGGER: member_replied_BOOK
BODY: "{{club_name}}: Booked. {{slot_time}} {{course}}{{partner_confirm}}. See you out there."
EXAMPLE: "Oakmont Hills: Booked. Sat 8:30 AM North Course, you and Dave. See you out there."
```

```
TEMPLATE: tee_time_reminder
TRIGGER: tee_time_t_minus_90
BODY: "{{club_name}}: {{first_name}}, your {{slot_time}} tee time is in 90 min. {{course}}, {{equipment}}. {{weather_note}}"
EXAMPLE: "Oakmont Hills: James, your 9:20 AM tee time is in 90 min. North Course, pull cart staged. 72F, clear skies."
```

**Category: Weather**

```
TEMPLATE: weather_pivot
TRIGGER: weather_pivot_concierge
BODY: "{{club_name}}: {{weather_alert}}. We can {{option_1}} or {{option_2}}. Reply EARLY or SIM, or tap: {{pivot_link}}"
REPLY KEYWORDS: [EARLY, SIM]
EXAMPLE: "Oakmont Hills: Afternoon storms expected 2-4 PM. We can move you to 11:30 AM or hold a sim bay at 2 PM. Reply EARLY or SIM"
```

**Category: Milestones**

```
TEMPLATE: milestone_celebration
TRIGGER: milestone_concierge
BODY: "{{club_name}}: {{first_name}}, {{milestone_text}}. We left a little something for you at the pro shop."
EXAMPLE: "Oakmont Hills: James, congratulations on your 100th round on the North Course. We left a little something for you at the pro shop."
```

**Category: Consent**

```
TEMPLATE: welcome_opt_in
TRIGGER: bulk_consent_request
BODY: "{{club_name}}: We're upgrading how we stay in touch. Reply YES to get tee time updates, dining alerts, and club news via text. Reply STOP anytime. Msg&data rates may apply."
REPLY KEYWORDS: [YES, STOP]
```

### Staff-Facing Templates

```
TEMPLATE: staff_complaint_escalation
TRIGGER: service_recovery_escalation
BODY: "SWOOP [{{club_name}}]: {{member_name}} (health {{health_score}}, ${{dues}} dues) — complaint unresolved {{days}} days. {{recommended_action}}. Open dashboard: {{link}}"
EXAMPLE: "SWOOP [Oakmont Hills]: James Whitfield (health 34, $18K dues) — complaint unresolved 6 days. Call before 10:15 AM. Open dashboard: swoop.golf/a/agx_011"
```

```
TEMPLATE: staff_cancellation_fill
TRIGGER: demand_optimizer_cancellation
BODY: "SWOOP [{{club_name}}]: {{slot_time}} cancellation. Top fill candidate: {{candidate_name}} (${{spend}}/mo). Approve fill? Reply CONFIRM or open: {{link}}"
REPLY KEYWORDS: [CONFIRM]
```

```
TEMPLATE: staff_staffing_gap
TRIGGER: labor_optimizer_gap
BODY: "SWOOP [{{club_name}}]: {{outlet}} short {{count}} staff {{shift_time}}. {{at_risk_note}}. Reassign floater? Reply CONFIRM or open: {{link}}"
REPLY KEYWORDS: [CONFIRM]
```

```
TEMPLATE: staff_arrival_brief
TRIGGER: arrival_anticipation_engine
BODY: "SWOOP [{{club_name}}]: {{member_name}} arriving {{arrival_time}}. {{brief_summary}}. Full brief: {{link}}"
EXAMPLE: "SWOOP [Oakmont Hills]: James Whitfield arriving 9:20 AM. Pull cart, North Course. OPEN COMPLAINT — priority service. 100th round — ball marker staged. Full brief: swoop.golf/brief/jw203"
```

---

## Phase 4: The SMS Send Engine

### The Outbound Pipeline

Every SMS in the system flows through one function. This is the single point of control for rate limiting, quiet hours, consent checking, template rendering, and delivery logging.

**New: `api/sms/send.js`**

```javascript
export async function sendMemberSms({ clubId, memberId, templateId, variables, priority }) {
  // 1. Check club SMS is enabled
  const config = await getClubSmsConfig(clubId);
  if (!config.enabled) return { sent: false, reason: 'club_sms_disabled' };
  
  // 2. Check member consent
  const prefs = await getMemberCommPrefs(memberId, clubId);
  if (!prefs.sms_opted_in) return { sent: false, reason: 'member_not_opted_in' };
  
  // 3. Check quiet hours (unless urgent)
  if (priority !== 'urgent' && isQuietHours(config)) {
    return { sent: false, reason: 'quiet_hours', queued_for: config.quiet_hours_end };
  }
  
  // 4. Check daily rate limit
  const todayCount = await getMemberSmsTodayCount(memberId, clubId);
  if (todayCount >= config.max_daily_per_member && priority !== 'urgent') {
    return { sent: false, reason: 'daily_limit_reached' };
  }
  
  // 5. Get member phone
  const member = await getMember(memberId);
  if (!member.phone) return { sent: false, reason: 'no_phone' };
  
  // 6. Render template
  const template = await getTemplate(templateId, clubId);
  const body = renderTemplate(template.body, variables);
  
  // 7. Prepend club name if not already in template
  const finalBody = body.startsWith(config.sender_name) ? body : `${config.sender_name}: ${body}`;
  
  // 8. Send via Twilio
  const result = await twilioSend({
    to: member.phone,
    body: finalBody,
    from: config.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER,
    messagingServiceSid: config.messaging_service_sid || process.env.TWILIO_MESSAGING_SERVICE_SID,
    statusCallback: `${BASE_URL}/api/twilio/status`,
  });
  
  // 9. Log the send
  await sql`
    INSERT INTO sms_log (club_id, member_id, template_id, direction, body, 
                         twilio_sid, status, sent_at)
    VALUES (${clubId}, ${memberId}, ${templateId}, 'outbound', ${finalBody},
            ${result.sid}, ${result.status}, NOW())
  `;
  
  // 10. Increment daily counter
  await incrementDailyCounter(memberId, clubId);
  
  return { sent: true, sid: result.sid };
}

export async function sendStaffSms({ clubId, userId, templateId, variables, priority }) {
  // Staff SMS skips consent check (they opted in by adding their phone)
  // Staff SMS skips quiet hours only for urgent priority
  const user = await getUser(userId);
  if (!user.phone || !user.sms_alerts_enabled) return { sent: false, reason: 'staff_sms_disabled' };
  
  const template = await getTemplate(templateId, clubId);
  const body = renderTemplate(template.body, variables);
  
  const result = await twilioSend({ to: user.phone, body, /* ... */ });
  
  await sql`
    INSERT INTO sms_log (club_id, user_id, template_id, direction, body,
                         twilio_sid, status, sent_at)
    VALUES (${clubId}, ${userId}, ${templateId}, 'outbound_staff', ${body},
            ${result.sid}, ${result.status}, NOW())
  `;
  
  return { sent: true, sid: result.sid };
}
```

### SMS Log Table

```sql
CREATE TABLE IF NOT EXISTS sms_log (
  log_id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  club_id        TEXT NOT NULL,
  member_id      TEXT,              -- null for staff messages
  user_id        TEXT,              -- null for member messages
  template_id    TEXT,
  direction      TEXT NOT NULL,     -- outbound, outbound_staff, inbound
  body           TEXT NOT NULL,
  twilio_sid     TEXT,
  status         TEXT DEFAULT 'queued',  -- queued, sent, delivered, failed, received
  error_message  TEXT,
  intent_id      TEXT,              -- links to the agent intent that triggered this
  reply_keyword  TEXT,              -- if this is an inbound reply, what keyword was detected
  sent_at        TIMESTAMPTZ DEFAULT NOW(),
  delivered_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sms_log_member ON sms_log(member_id, club_id, sent_at DESC);
CREATE INDEX idx_sms_log_club_date ON sms_log(club_id, sent_at DESC);
```

---

## Phase 5: Agent Integration

### How Agents Trigger SMS

Agents don't send SMS directly. They emit intents. The intent router checks whether the delivery channel should be SMS and calls the send engine.

**Flow:**

```
Agent (e.g., Post-Round Dining Bridge)
  │
  ├─ Emits intent: { type: "dining_nudge", member_id: "mbr_203", ... }
  │
  └─ Intent Router (api/intents/route.js)
       │
       ├─ Checks member_comm_preferences: sms_opted_in? preferred_channel?
       ├─ Checks club_sms_config: enabled? quiet_hours?
       ├─ Checks member category preferences: dining notifications enabled?
       ├─ Selects template: dining_nudge
       ├─ Renders variables from intent context
       │
       └─ Calls sendMemberSms()
            │
            └─ SMS delivered to member
```

**New: Intent router endpoint**

```javascript
// api/intents/route.js
export default async function handler(req, res) {
  const { intent } = req.body;
  
  // Determine delivery channel
  const prefs = await getMemberCommPrefs(intent.target_member_id, intent.club_id);
  const channel = prefs.preferred_channel || 'sms';
  
  // Check category opt-in
  const intentCategory = mapIntentToCategory(intent.intent_type);
  if (prefs.categories_disabled.includes(intentCategory)) {
    return res.json({ delivered: false, reason: 'category_disabled' });
  }
  
  // Route to appropriate channel
  switch (channel) {
    case 'sms':
      const templateId = mapIntentToTemplate(intent.intent_type);
      const variables = buildTemplateVariables(intent);
      const result = await sendMemberSms({
        clubId: intent.club_id,
        memberId: intent.target_member_id,
        templateId,
        variables,
        priority: intent.priority,
      });
      return res.json(result);
      
    case 'email':
      // Future: route to SendGrid
      break;
      
    case 'push':
      // Future: route to PWA push
      break;
  }
}
```

---

## Phase 6: Club Onboarding Checklist

### The Complete Setup Flow (Staff-Guided, ~45 Minutes)

```
STEP 1: CREATE CLUB                              [5 min]
  ├─ Club name, location, size
  ├─ GM contact info (name, email, phone)
  └─ Output: club_id generated

STEP 2: IMPORT MEMBERS                           [10 min]
  ├─ Export from Jonas / CRM → CSV/XLSX
  ├─ Upload via wizard or API
  ├─ Phone number coverage check
  │   └─ If < 60% have phones → flag for staff to supplement
  └─ Output: members table populated

STEP 3: CONFIGURE SMS                            [10 min]
  ├─ Club sender name ("Oakmont Hills CC")
  ├─ Quiet hours (default 9 PM - 7 AM)
  ├─ Daily message limit per member (default 3)
  ├─ Consent approach:
  │   ├─ Option A: Club confirms blanket consent → bulk opt-in
  │   ├─ Option B: Send welcome text → wait for YES replies
  │   └─ Option C: Manual opt-in via member list
  └─ Output: club_sms_config populated, consent recorded

STEP 4: REGISTER STAFF PHONES                    [5 min]
  ├─ GM phone → receives all critical alerts
  ├─ F&B Director phone → F&B alerts
  ├─ Head Pro phone → golf ops alerts
  ├─ Membership Director phone → retention alerts
  └─ Output: users table phones populated, alert categories assigned

STEP 5: SEND TEST MESSAGES                       [5 min]
  ├─ Test SMS to GM's personal phone
  ├─ Test SMS to one opted-in member (the GM themselves or a friendly member)
  ├─ Verify inbound reply handling (reply STOP, then START)
  └─ Output: confirmed bidirectional SMS working

STEP 6: ACTIVATE AGENT SMS                       [5 min]
  ├─ Enable specific agent → SMS templates:
  │   ├─ Post-Round Dining Bridge → dining_nudge (start here)
  │   ├─ Demand Optimizer → tee_time_offer
  │   ├─ Service Recovery → staff_complaint_escalation (staff only)
  │   ├─ Weather Pivot → weather_pivot (after weather API connected)
  │   └─ Milestone Concierge → milestone_celebration
  ├─ Set initial volume: conservative (dining nudge only, top 20 post-round members)
  └─ Output: first agent SMS will fire on next qualifying event

STEP 7: COMPUTE HEALTH SCORES + FIRST BRIEFING   [5 min]
  ├─ Run health score computation
  ├─ Generate first morning briefing
  ├─ Send first staff SMS digest to GM
  └─ Output: club is live
```

### Admin Dashboard: SMS Configuration Panel

Add a new sub-tab to Admin called "SMS & Messaging" with:

**Section 1: Status**
- SMS enabled: YES/NO toggle
- Phone coverage: "247 of 300 members have phone numbers (82%)"
- Opted-in members: "189 of 247 (77%)"
- Messages sent (last 30 days): 342
- Delivery rate: 98.2%
- Reply rate: 23%

**Section 2: Staff Alert Routing**
Table showing each staff member, their phone, enabled categories, and a test button.

**Section 3: Message Templates**
List of all active templates with edit capability. GM can customize the wording while keeping the variable slots.

**Section 4: Message Log**
Searchable log of all sent/received SMS. Filterable by member, template, date, status.

**Section 5: Consent Management**
List of all members with their opt-in status, consent date, and method. Bulk actions: send opt-in request, export opted-out list.

---

## Phase 7: Monitoring & Analytics

### SMS Performance Dashboard

Track these metrics to prove SMS value and tune delivery:

```sql
-- Daily SMS summary view
CREATE OR REPLACE VIEW sms_daily_summary AS
SELECT 
  club_id,
  DATE(sent_at) as send_date,
  COUNT(*) FILTER (WHERE direction = 'outbound') as member_messages_sent,
  COUNT(*) FILTER (WHERE direction = 'outbound_staff') as staff_messages_sent,
  COUNT(*) FILTER (WHERE direction = 'inbound') as replies_received,
  COUNT(*) FILTER (WHERE direction = 'inbound' AND reply_keyword IS NOT NULL) as action_replies,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE reply_keyword = 'STOP') as opt_outs,
  COUNT(*) FILTER (WHERE reply_keyword IN ('YES','START')) as opt_ins
FROM sms_log
GROUP BY club_id, DATE(sent_at);
```

### Key Metrics to Track

| Metric | Target | What It Tells You |
|--------|--------|-------------------|
| Delivery rate | > 97% | Phone numbers are valid, no carrier blocking |
| Reply rate (action keywords) | > 15% | Members are engaging with nudges |
| Opt-out rate per month | < 2% | Messages aren't annoying members |
| Dining nudge → HOLD conversion | > 20% | Post-Round Dining Bridge is working |
| Tee time offer → BOOK conversion | > 30% | Demand Optimizer offers are well-targeted |
| Staff alert → CONFIRM rate | > 60% | Staff are acting on alerts |
| Time to first reply | < 5 min | Messages are reaching members at the right moment |

---

## Database Migration Script

Run this as a single migration when setting up SMS for a club:

```sql
-- SMS infrastructure migration

-- 1. Phone on users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_alerts_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS alert_categories TEXT[] DEFAULT '{}';

-- 2. Club SMS config
CREATE TABLE IF NOT EXISTS club_sms_config (
  club_id              TEXT PRIMARY KEY,
  enabled              BOOLEAN DEFAULT FALSE,
  twilio_phone_number  TEXT,
  messaging_service_sid TEXT,
  sender_name          TEXT NOT NULL DEFAULT 'Your Club',
  quiet_hours_start    TEXT DEFAULT '21:00',
  quiet_hours_end      TEXT DEFAULT '07:00',
  max_daily_per_member INTEGER DEFAULT 3,
  consent_required     BOOLEAN DEFAULT TRUE,
  default_opt_in       BOOLEAN DEFAULT FALSE,
  welcome_message      TEXT,
  opt_out_message      TEXT DEFAULT 'You have been unsubscribed. Reply START to re-subscribe.',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Member communication preferences
CREATE TABLE IF NOT EXISTS member_comm_preferences (
  member_id            TEXT NOT NULL,
  club_id              TEXT NOT NULL,
  sms_opted_in         BOOLEAN DEFAULT FALSE,
  sms_consent_date     TIMESTAMPTZ,
  sms_consent_method   TEXT,
  email_opted_in       BOOLEAN DEFAULT TRUE,
  push_opted_in        BOOLEAN DEFAULT FALSE,
  quiet_hours_override TEXT,
  preferred_channel    TEXT DEFAULT 'sms',
  opt_out_date         TIMESTAMPTZ,
  opt_out_reason       TEXT,
  categories_enabled   TEXT[] DEFAULT '{tee_time,dining,weather,milestone,general}',
  categories_disabled  TEXT[] DEFAULT '{}',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (member_id, club_id)
);

-- 4. SMS templates
CREATE TABLE IF NOT EXISTS sms_templates (
  template_id     TEXT PRIMARY KEY,
  club_id         TEXT,
  category        TEXT NOT NULL,
  trigger_type    TEXT NOT NULL,
  body            TEXT NOT NULL,
  reply_keywords  TEXT[],
  max_length      INTEGER DEFAULT 160,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SMS log
CREATE TABLE IF NOT EXISTS sms_log (
  log_id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  club_id        TEXT NOT NULL,
  member_id      TEXT,
  user_id        TEXT,
  template_id    TEXT,
  direction      TEXT NOT NULL,
  body           TEXT NOT NULL,
  twilio_sid     TEXT,
  status         TEXT DEFAULT 'queued',
  error_message  TEXT,
  intent_id      TEXT,
  reply_keyword  TEXT,
  sent_at        TIMESTAMPTZ DEFAULT NOW(),
  delivered_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_log_member ON sms_log(member_id, club_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_log_club_date ON sms_log(club_id, sent_at DESC);

-- 6. Seed system-default templates
INSERT INTO sms_templates (template_id, club_id, category, trigger_type, body, reply_keywords) VALUES
  ('dining_nudge', NULL, 'dining', 'post_round_dining_bridge', '{{club_name}}: Great round, {{first_name}}. {{table_info}} is open{{special_text}}. Hold for 20 min? Reply HOLD', '{HOLD}'),
  ('dining_hold_confirmed', NULL, 'dining', 'member_replied_HOLD', '{{club_name}}: Done. {{table_info}} held until {{hold_until}}. See you in there, {{first_name}}.', NULL),
  ('tee_time_offer', NULL, 'tee_time', 'demand_optimizer_slot', '{{club_name}}: {{slot_time}} just opened on {{course}}. {{partner_text}}Reply BOOK to grab it.', '{BOOK}'),
  ('tee_time_confirmed', NULL, 'tee_time', 'member_replied_BOOK', '{{club_name}}: Booked. {{slot_time}} {{course}}. See you out there.', NULL),
  ('tee_time_reminder', NULL, 'tee_time', 'tee_time_t_minus_90', '{{club_name}}: {{first_name}}, your {{slot_time}} is in 90 min. {{course}}, {{equipment}}. {{weather_note}}', NULL),
  ('weather_pivot', NULL, 'weather', 'weather_pivot_concierge', '{{club_name}}: {{weather_alert}}. We can {{option_1}} or {{option_2}}. Reply EARLY or SIM.', '{EARLY,SIM}'),
  ('milestone', NULL, 'milestone', 'milestone_concierge', '{{club_name}}: {{first_name}}, {{milestone_text}}. We left a little something at the pro shop.', NULL),
  ('welcome_opt_in', NULL, 'consent', 'bulk_consent_request', '{{club_name}}: We''re upgrading how we stay in touch. Reply YES for tee time, dining, and club updates via text. Reply STOP anytime. Msg&data rates apply.', '{YES,STOP}'),
  ('staff_complaint', NULL, 'staff_alert', 'service_recovery_escalation', 'SWOOP [{{club_name}}]: {{member_name}} (health {{health_score}}, ${{dues}} dues) — complaint {{days}}d unresolved. {{action}}. {{link}}', '{CONFIRM}'),
  ('staff_cancellation', NULL, 'staff_alert', 'demand_optimizer_cancellation', 'SWOOP [{{club_name}}]: {{slot_time}} cancelled. Fill candidate: {{candidate_name}}. Reply CONFIRM to approve.', '{CONFIRM}'),
  ('staff_staffing_gap', NULL, 'staff_alert', 'labor_optimizer_gap', 'SWOOP [{{club_name}}]: {{outlet}} short {{count}} staff {{shift}}. Reply CONFIRM to reassign floater.', '{CONFIRM}'),
  ('staff_arrival_brief', NULL, 'staff_alert', 'arrival_anticipation', 'SWOOP [{{club_name}}]: {{member_name}} arriving {{time}}. {{brief}}. Full brief: {{link}}', NULL)
ON CONFLICT (template_id) DO NOTHING;
```
