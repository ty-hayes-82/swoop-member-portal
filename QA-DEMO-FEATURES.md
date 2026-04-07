# QA Script — Demo Features (Gmail Integration + 5 Wow Scenarios)

**Environment:** https://swoop-member-portal-dev.vercel.app (or localhost:5173)
**Login:** Click "Enter Demo Mode (Pinetree CC)" on the login page, then click "Start Demo"
**Browser:** Chrome recommended (Gmail compose URLs open in new tab)
**Time:** ~25 minutes for full pass

---

## Pre-Test Setup

1. Log in via Demo Mode
2. Go to **Profile** (click your name in top-right > Profile)
3. Under **Message Delivery > Email Delivery**, select **"Gmail Draft"**
4. Under **Test Overrides**, enter your real email and phone number
5. Click **Save Changes**

---

## Test 1: Gmail Draft Integration (Profile Page)

**Page:** Profile (`#/profile`)

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 1.1 | Verify three email delivery options are visible | "Local", "Cloud", and "Gmail Draft" buttons appear side by side | |
| 1.2 | Click "Gmail Draft" | Button highlights with orange border, description reads "AI generates a draft and opens it in Gmail..." | |
| 1.3 | Click "Save Changes" | "Saved!" confirmation appears briefly | |
| 1.4 | Reload the page | Gmail Draft option is still selected (persists in localStorage) | |

---

## Test 2: Cart Prep Confirmation Text (#15)

**Page:** Tee Sheet (`#/tee-sheet`)

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 2.1 | Scroll to bottom, click "Cart Prep Recommendations" to expand | Cart prep cards appear for all 22 tee times | |
| 2.2 | Find any cart prep card (e.g., Kevin Hurst) | Card shows beverage, snack, group, and operational note | |
| 2.3 | Verify two action buttons appear on each card | "Send Cart Prep Text" (orange) and "Post-Round Dining Nudge" (amber) | |
| 2.4 | Click **"Send Cart Prep Text"** on Kevin Hurst's card | Toast "Generating cart prep text..." appears, then your SMS app opens with a pre-filled message mentioning their beverage/snack preferences and tee time | |
| 2.5 | Verify SMS content | Message should be personalized (e.g., "Hi Kevin! Your cart is ready for your 7:00 AM tee time: Coffee black, Granola bar...") and sent to your override phone number | |

**Note:** If no ANTHROPIC_API_KEY is set, the app falls back to a template message — this is expected in demo mode.

---

## Test 3: Post-Round Dining Nudge (#16)

**Page:** Tee Sheet (`#/tee-sheet`)

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 3.1 | On any cart prep card, click **"Post-Round Dining Nudge"** | Toast "Generating dining offer..." appears | |
| 3.2 | SMS app opens | Pre-filled message mentions the member by first name, references their round, and suggests dining (e.g., Grill Room, chef's special, their usual table) | |
| 3.3 | Try on an at-risk member card (e.g., James Whitfield) | Message should be more personal, acknowledging their situation | |

---

## Test 4: GM Greeting Alert (#67)

**Page:** Today (`#/today`)

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 4.1 | Navigate to the Today page | Morning briefing header appears with greeting | |
| 4.2 | Wait 3 seconds | First check-in alert slides in (e.g., "AT-RISK CHECK-IN: Kevin Hurst just checked in") | |
| 4.3 | Wait 8 seconds from page load | Second alert appears (a different at-risk or VIP member) | |
| 4.4 | Wait 13 seconds from page load | Third alert appears | |
| 4.5 | Inspect any alert card | Shows: badge (AT-RISK or VIP), member name (clickable), health score, archetype, tee time, dues, and a "Talking Points" section with 3 bullet points | |
| 4.6 | Click the member's name in the alert | Member profile drawer opens | |
| 4.7 | Click the "x" button on an alert | Alert dismisses and disappears | |
| 4.8 | Navigate away and back to Today | Alerts restart (they are simulated per page load) | |

---

## Test 5: Proactive Service Recovery (#32)

**Page:** Tee Sheet (`#/tee-sheet`)

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 5.1 | Look at the "At-Risk Members on Course Today" section at the top | Alert cards for at-risk members (health < 50) appear | |
| 5.2 | Find James Whitfield's card (has "CRITICAL" complaint note) | Card shows two action buttons: "Send Recovery Email" (red) and "Send Apology Text" (orange) | |
| 5.3 | Click **"Send Recovery Email"** | Toast "Generating recovery message..." appears. Gmail compose opens in a new tab with pre-filled To, Subject, and Body — the body acknowledges the service failure and offers a specific remedy | |
| 5.4 | Click **"Send Apology Text"** on a different at-risk member | SMS app opens with a personalized apology/check-in text | |
| 5.5 | Find a card WITHOUT a complaint (e.g., Sandra Chen) | Button reads "Personal Check-in Text" instead of "Send Apology Text" | |

---

## Test 6: Personal GM Call with Talking Points (#1)

**Page:** Any member profile drawer

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 6.1 | Open any member's profile drawer (click a member name anywhere in the app) | Drawer slides in with member details | |
| 6.2 | Scroll to "Quick actions" section at the bottom | Buttons: Schedule call, Draft in Gmail (or Draft email), Draft SMS, Offer comp | |
| 6.3 | Click **"Schedule call"** in the Quick Actions panel | Call scheduling panel expands with a green "AI-Generated Talking Points" card | |
| 6.4 | Verify talking points are loading | "Generating personalized talking points..." pulse animation appears | |
| 6.5 | Wait for talking points to load (~2-3 seconds) | 4-5 personalized bullet points appear, referencing the member's specific situation (health score, risk signals, preferences) | |
| 6.6 | Select a time (e.g., "Friday AM") | Time chip highlights green | |
| 6.7 | Click "Add to calendar" | Toast confirmation "Call scheduled for [Member Name]" appears | |

**Fallback behavior:** If API is unavailable, 4 generic talking points appear as bullet list — this is acceptable for demo.

---

## Test 7: AI-Powered Email Draft (QuickActions)

**Page:** Any member profile drawer

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 7.1 | Click **"Draft personal note"** in the Quick Actions panel | Note panel expands with "PERSONAL NOTE TO [NAME]" header | |
| 7.2 | Verify AI draft loading | "Generating draft..." pulse animation in the textarea area | |
| 7.3 | Wait for AI draft (~2-3 seconds) | Textarea populates with AI-generated email content. "AI-generated draft" label appears in header | |
| 7.4 | Edit the draft text | Textarea is editable — changes persist | |
| 7.5 | Click the send button | If Gmail mode: button reads "Open in Gmail" — click opens Gmail compose with the draft. If Local mode: button reads "Draft email" — opens mailto. If Cloud mode: button reads "Send via email" — sends via API | |

**Fallback:** If AI fails, the textarea shows a generic template starting with "Dear [FirstName]..."

---

## Test 8: Agent Inbox — New Demo Scenarios

**Page:** Automations (`#/automations`)

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 8.1 | Navigate to Automations page | Inbox tab shows pending actions | |
| 8.2 | Verify these 6 new action types appear in the inbox (they may require scrolling): | | |
| | - **Post-round dining offer** (John Harrison, high priority, "🍽 Post-Round Dining") | Revenue Analyst source, $152 F&B capture metric | |
| | - **Staff push alert** (Robert Callaway, high priority, "📲 Staff Alert") | Member Pulse source, $22K VIP member | |
| | - **Snowbird welcome-back** (Ronald Petersen, medium priority, "🌴 Welcome Back") | Engagement Autopilot source, $20K seasonal member | |
| | - **Rapid response** (James Whitfield, high priority, "⚡ Rapid Response") | Service Recovery source, 42-min ticket time detail | |
| | - **Day-30 check-in** (Jason Rivera, medium priority, "📞 Day-30 Check-in") | Member Pulse source, 30-day milestone | |
| | - **Dining dormancy** (Sandra Chen, medium priority, "🍷 Dining Nudge") | Revenue Analyst source, $480/mo at risk | |
| 8.3 | Click **Approve** on the Post-round dining offer | SMS app opens with personalized dining offer for John Harrison | |
| 8.4 | Click **Approve** on the Snowbird welcome-back | Gmail compose (or mailto) opens with welcome-back email for Ronald Petersen | |
| 8.5 | Click **Approve** on the Staff push alert | SMS opens with staff alert content (push notifications simulated via SMS in demo) | |
| 8.6 | Click **Approve** on the Rapid response | SMS opens with proactive apology text for James Whitfield | |
| 8.7 | Click **Approve** on the Day-30 check-in | Since channel is "Call", this goes through as a staff task (toast confirmation) | |
| 8.8 | Click **Dismiss** on the Dining dormancy | Action moves to "Recently Handled" section with dismissed status | |

---

## Test 9: Actions Drawer (Quick Panel)

**Page:** Any page — click the notification bell or pending actions count

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 9.1 | Click the actions count/bell in the header | Actions drawer slides in from the right | |
| 9.2 | Verify new demo actions appear | Top 5 pending actions shown, including new demo scenarios | |
| 9.3 | Click **Approve** on any action | Correct channel opens (SMS for SMS-recommended, Gmail/email for email-recommended) | |

---

## Test 10: Member Drawer Quick Actions — Email & SMS

**Page:** Any member profile drawer

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 10.1 | Open a member drawer | Quick action buttons at the bottom | |
| 10.2 | Verify email button label matches your Profile setting | Gmail mode: "Draft in Gmail". Local mode: "Draft email". Cloud mode: "Send email" | |
| 10.3 | Verify SMS button reads "Draft SMS" | Label updated from "Send SMS" to "Draft SMS" | |
| 10.4 | Click **"Draft in Gmail"** (or "Draft email") | Toast "Generating draft..." appears, then Gmail compose (or mailto) opens with AI-generated subject and body personalized to the member | |
| 10.5 | Click **"Draft SMS"** | Toast "Generating draft..." appears, then SMS app opens with AI-generated short message (< 160 chars) | |

---

## Known Limitations / Expected Behaviors

- **AI drafts require ANTHROPIC_API_KEY** — if not configured on the server, all AI calls return a fallback template. The UX still works (buttons, toasts, compose windows) but content will be generic.
- **Gmail compose opens in a new tab** — requires the tester to be logged into Gmail in their browser. The draft is NOT saved to Gmail drafts; it opens a compose window with pre-filled fields.
- **SMS links** use `sms:` URI scheme — behavior varies by OS. On Mac/Windows desktop, this may open iMessage or the default SMS app. On mobile it opens the native messaging app.
- **GM Greeting Alerts reset on page navigation** — they are simulated per page load, not persisted.
- **Demo mode** uses static member data — the same members and scenarios appear every time.

---

## Bug Report Template

If a test fails, please report:
- **Test #:** (e.g., 2.4)
- **Browser/OS:** (e.g., Chrome 120 / macOS 14)
- **What happened:** 
- **What was expected:**
- **Console errors:** (open DevTools > Console, screenshot any red errors)
- **Screenshot:** (if visual issue)
