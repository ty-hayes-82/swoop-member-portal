# QA Script — Full Feature Regression + New Inline Actions

> **Repo:** swoop-member-portal | **Branch:** autoresearch/apr11 | **Updated:** 2026-04-11  
> **Type:** Point-in-time snapshot — do not edit, create new version instead

**Environment:** https://swoop-member-portal-dev.vercel.app (or localhost:5173)
**Login:** Click "Enter Demo Mode (Pinetree CC)" on the login page, then click "Start Demo"
**Browser:** Chrome recommended (Gmail compose URLs open in new tab)
**Time:** ~45 minutes for full pass (18 tests)

---

## Pre-Test Setup

1. Log in via Demo Mode
2. Go to **Profile** (click your name in top-right > Profile)
3. Under **Message Delivery > Email Delivery**, select **"Gmail Draft"**
4. Under **Test Overrides**, enter your real email and phone number
5. Click **Save Changes**

---

## Test 1: Profile Page — Layout & Settings

**Page:** Profile (`#/profile`)

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 1.1 | Verify three email delivery options are visible | "Local", "Cloud", and "Gmail Draft" buttons appear side by side | |
| 1.2 | Click "Gmail Draft" | Button highlights with orange border, description reads "AI generates a draft and opens it in Gmail..." | |
| 1.3 | Click "Save Changes" | Toast "Saved!" appears and stays visible for ~4 seconds (long enough to read) | |
| 1.4 | Reload the page | Gmail Draft option is still selected (persists in localStorage) | |
| 1.5 | Scroll down the page | Header and sidebar remain fixed/pinned at top. Page content scrolls independently. No blank areas or layout collapse | |
| 1.6 | Scroll back to top | All elements render correctly, no visual glitches | |

---

## Test 2: Demo Mode API Access (No 401s)

**Page:** Any page with AI features — open DevTools Network tab (F12 > Network)

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 2.1 | Open DevTools Network tab, filter by "generate-draft" | Ready to monitor | |
| 2.2 | Open a member profile drawer, click "Draft personal note" | Network shows POST to `/api/generate-draft` — response should be **200** (with AI content) or **200** (with fallback template), **not 401** | |
| 2.3 | Go to Tee Sheet, click "Send Cart Prep Text" on any cart card | POST to `/api/generate-draft` returns **200**, SMS opens with content | |
| 2.4 | Click "Post-Round Dining Nudge" on any cart card | POST returns **200**, SMS opens with dining content | |
| 2.5 | Verify no 401 errors in console | Console should show no `[apiFetch] 401` warnings | |

**Note:** If ANTHROPIC_API_KEY is not configured on the server, the API returns a 200 with `fallback: true` — the content will be a generic template. This is correct behavior.

---

## Test 3: Inline Action Panel — Today Page (NEW)

**Page:** Today (`#/today`)

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 3.1 | Find the "Action Queue" section | Shows priority count (e.g., "Action Queue (12)") with hero card + pending action cards below | |
| 3.2 | Click the **hero card** (red "Priority" / "Act Now") | Card expands **in place** below itself showing an ActionPanel with "Recommended" section — 1-2 scoped actions (e.g., "Send Email", "Schedule GM Call"). **No sidebar opens** | |
| 3.3 | Verify recommended actions are scoped | Actions shown are relevant to the hero item's member/context, not a generic list of all pending actions | |
| 3.4 | Click **"Approve"** on a recommended action | Toast confirms (e.g., "Send Email approved for [Name]"). Gmail/SMS opens based on action type. The action row shows as handled | |
| 3.5 | Click **"Skip"** on a recommended action | Action row disappears. If all recommended actions are skipped, "All actions handled" message appears | |
| 3.6 | Click **"More actions"** in the panel | A secondary row of action buttons expands: Send Email, Send SMS, Schedule Call, Staff Alert, Front Desk Flag, Comp Offer | |
| 3.7 | Click any "More actions" button (e.g., "Staff Alert") | Toast confirms "Staff Alert triggered for [Name]". Action is logged | |
| 3.8 | Click **"Collapse"** at bottom of panel | ActionPanel collapses, card returns to normal state | |
| 3.9 | Click a **pending action card** (non-hero) | Same inline expansion with scoped recommended actions. No sidebar | |
| 3.10 | Click **"Review all N actions in Inbox"** button | Navigates to **Automations** page (not a sidebar). URL changes to `#/automations` | |

---

## Test 4: Inline Action Panel — Tee Sheet Risk Cards (NEW)

**Page:** Tee Sheet (`#/tee-sheet`)

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 4.1 | Find "At-Risk Members on Course Today" section | Alert cards for at-risk members (health < 50) appear with existing action buttons | |
| 4.2 | Verify existing buttons still work | "Send Recovery Email" (red) and "Send Apology Text" / "Personal Check-in Text" buttons still appear and function as before | |
| 4.3 | Find the **"More actions"** button on any at-risk card | New button appears after the existing action buttons | |
| 4.4 | Click **"More actions"** | ActionPanel expands inline below the card with context-specific recommended actions | |
| 4.5 | Verify recommendations are contextual | Cards WITH complaints show: "Send Recovery Email", "Send Apology Text". Cards WITHOUT complaints show: "Personal Check-in Text", "Send Personal Email". VIP cards ($18K+ dues) also show "Comp Offer" | |
| 4.6 | Click **"Approve"** on a recommended action | Toast confirms, action opens correct channel (email/SMS) | |
| 4.7 | Click **"More actions"** in the expanded panel | Shows full action picker (Email, SMS, Call, Staff Alert, etc.) | |
| 4.8 | Click **"Less"** to collapse | Panel collapses back to just the quick buttons | |
| 4.9 | Click the card body (name/health score area) | Panel toggles — click to expand, click again to collapse | |

---

## Test 5: Inline Action Panel — Service Complaints (NEW)

**Page:** Service (`#/service`) > Complaints tab

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 5.1 | Navigate to Service page, click Complaints tab | List of open complaints appears | |
| 5.2 | Verify complaint rows show a **"Act"** indicator | Each unresolved complaint has a small "▸ Act" label on the right side | |
| 5.3 | Click any **unresolved** complaint row | ActionPanel expands inline below the row with recommended actions | |
| 5.4 | Verify recommended actions for a complaint open **>3 days** | Should include "Escalate to GM" (with "X days unresolved" description), "Send Recovery Email", "Send Apology Text" | |
| 5.5 | Verify recommended actions for a **recent** complaint (≤3 days) | Should include "Send Recovery Email" and "Send Apology Text" but NOT "Escalate to GM" | |
| 5.6 | Click **"Approve"** on "Escalate to GM" | Toast confirms "Escalate to GM approved for [Name]" | |
| 5.7 | Click **"More actions"** | Full action picker appears (Email, SMS, Call, Staff Alert, Front Desk Flag, Comp Offer) | |
| 5.8 | Click a **resolved** complaint row | Nothing expands — resolved complaints have no ActionPanel | |
| 5.9 | Click the same complaint row again | Panel collapses | |

---

## Test 6: Cart Prep & Dining Nudge

**Page:** Tee Sheet (`#/tee-sheet`)

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 6.1 | Scroll to bottom, click "Cart Prep Recommendations" to expand | Cart prep cards appear for all 20 tee times | |
| 6.2 | Find any cart prep card (e.g., Kevin Hurst) | Card shows beverage, snack, group, and operational note | |
| 6.3 | Click **"Send Cart Prep Text"** | Toast appears (~4 seconds), SMS app opens with personalized message | |
| 6.4 | Click **"Post-Round Dining Nudge"** on another card | Toast appears, SMS app opens with dining suggestion | |

---

## Test 7: GM Greeting Alert

**Page:** Today (`#/today`)

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 7.1 | Navigate to the Today page | Morning briefing header appears | |
| 7.2 | Wait 3 seconds | First check-in alert slides in | |
| 7.3 | Wait 8 seconds from page load | Second alert appears | |
| 7.4 | Wait 13 seconds from page load | Third alert appears | |
| 7.5 | Inspect any alert card | Shows: badge (AT-RISK or VIP), member name (clickable), health score, archetype, tee time, dues, and "Talking Points" | |
| 7.6 | Click the member's name | Member profile drawer opens | |
| 7.7 | Click "x" on an alert | Alert dismisses | |

---

## Test 8: Inline Action Panel — Members List (NEW)

**Page:** Member Health (`#/member-health`)

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 8.1 | Find "Members Needing Attention" section | Priority-sorted list of at-risk members appears | |
| 8.2 | Verify rows show **"Act"** indicator on the right | Each row has a "▸ Act" label instead of Call/Email/SMS icon buttons | |
| 8.3 | Click any member row to expand | ActionPanel expands inline with "Recommended" section showing 2 context-specific actions, plus "Full Actions" section with QuickActions below | |
| 8.4 | Verify **complaint member** recommendations | Members with complaints show: "Escalate to GM" + "Send Recovery Email" | |
| 8.5 | Verify **Ghost member** recommendations | Ghost members show: "GM Personal Call" + "Send Personal Email" | |
| 8.6 | Verify **golfer archetype** recommendations | Weekend Warrior / Die-Hard show: "Send Tee Time Offer" + "Pro Shop Check-in Call" | |
| 8.7 | Verify **Social Butterfly** recommendations | Shows: "Send Event Invitation" + "Personal Event Nudge" | |
| 8.8 | Click **"Approve"** on a recommended action | Toast confirms, action opens correct channel | |
| 8.9 | Click **"More actions"** in ActionPanel | Full action picker appears (Email, SMS, Call, Staff Alert, etc.) | |
| 8.10 | Verify QuickActions section below ActionPanel | "Full Actions" label visible. Draft personal note, Schedule a call, Assign to staff buttons work as before | |
| 8.11 | Click **"▾ Collapse"** or click the row again | Panel collapses | |

---

## Test 9: Service Recovery (Tee Sheet)

**Page:** Tee Sheet (`#/tee-sheet`)

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 9.1 | Find James Whitfield's at-risk card (CRITICAL complaint) | Shows "Send Recovery Email" (red) and "Send Apology Text" buttons | |
| 9.2 | Click **"Send Recovery Email"** | Toast appears, Gmail compose opens with recovery content | |
| 9.3 | Click **"Send Apology Text"** on a different member | SMS opens with apology/check-in text | |
| 9.4 | Find a card WITHOUT a complaint (e.g., Sandra Chen) | Button reads "Personal Check-in Text" | |

---

## Test 10: Personal GM Call with Talking Points

**Page:** Any member profile drawer

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 10.1 | Open a member profile drawer | Drawer slides in | |
| 10.2 | Click **"Schedule a call"** | Call panel expands with AI-Generated Talking Points | |
| 10.3 | Wait for talking points (~2-3 seconds) | 4-5 personalized bullet points appear | |
| 10.4 | Select a time, click "Add to calendar" | Toast "Call scheduled for [Name]" appears | |

---

## Test 11: AI-Powered Email Draft

**Page:** Any member profile drawer

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 11.1 | Click **"Draft personal note"** | Note panel expands, "Generating draft..." pulse shows | |
| 11.2 | Wait for draft (~2-3 seconds) | Textarea populates with AI content, "AI-generated draft" label appears | |
| 11.3 | Edit the text | Textarea is editable | |
| 11.4 | Click send button | Gmail compose opens (or mailto/cloud depending on setting) | |
| 11.5 | Navigate to **Automations > Inbox** | A "Personal note drafted for [Name]" action appears with source "Quick Action" | |

---

## Test 12: Automations Inbox — Bulk Review

**Page:** Automations (`#/automations`)

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 12.1 | Navigate to Automations page | Inbox tab shows pending actions with priority filters | |
| 12.2 | Click **Approve** on any action | Correct channel opens. Action moves to "Recently Handled" with timestamp | |
| 12.3 | Click **Dismiss** on any action | Action moves to "Recently Handled" with dismissed status | |
| 12.4 | Click **"Recently handled"** expander | Shows list of approved/dismissed actions with timestamps | |
| 12.5 | Use priority filter buttons (All/High/Medium/Low) | List filters correctly by priority level | |

---

## Test 13: Action Logging & Audit Trail

**Page:** Automations + Member Profile Drawer + DevTools Console

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 13.1 | Open DevTools Console (F12 > Console tab) | Console visible | |
| 13.2 | In Automations Inbox, **Approve** an action | No `console.error` about failed persistence | |
| 13.3 | **Dismiss** an action | No console errors | |
| 13.4 | Open member drawer > "Draft personal note" > send | Toast confirms | |
| 13.5 | Navigate to Automations Inbox | "Personal note drafted for [Name]" appears | |
| 13.6 | Open member drawer > "Schedule a call" > pick time > send | "Call scheduled with [Name]" appears in inbox | |
| 13.7 | Open member drawer > "Assign to staff" > pick staff > send | "Task assigned to [Staff]" appears in inbox | |
| 13.8 | Verify Follow-up Tracker below QuickActions buttons | Shows all 3 actions with statuses (Completed/Scheduled/Assigned) | |
| 13.9 | Click **"Mark done"** on a Scheduled entry | Status changes to "Completed" | |

---

## Test 14: Playbook Activation & State

**Page:** Member Health (`#/member-health`) and Playbooks (`#/playbooks`)

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 14.1 | Navigate to Member Health page | Two response plans visible: "Service Save Protocol" and "Engagement Decay Intervention" | |
| 14.2 | On **Service Save Protocol**, click "Activate this response plan" | Confirmation panel: "Confirm activation" with step preview | |
| 14.3 | Click "Yes, activate this plan" | Trail animation fires (4 steps with checkmarks). Button changes to "Active — Deactivate". Monthly impact shows green | |
| 14.4 | On **Engagement Decay Intervention**, click activate | Trail shows 3 steps. Monthly impact shows **$9K** (not $0) | |
| 14.5 | Click "Active — Deactivate" on Service Save | Playbook deactivates, button returns to "Activate this response plan" | |
| 14.6 | Verify **Track Record** sections | Service Save: Q4+Q3 2025 data. Engagement Decay: Q4 2025 data | |
| 14.7 | Navigate to **Playbooks** page | Playbook catalog loads | |
| 14.8 | Select **Service Save Protocol** | Triggered for "James Whitfield" with memberId visible in Network tab | |
| 14.9 | Click **"Activate this playbook"** | Toast confirms. Action appears in Automations inbox. DevTools Network shows POST to `/api/execute-playbook` with `memberId: mbr_203` | |
| 14.10 | Select **New Member 90-Day Integration** | Track Record shows Q4 2025 (8 runs, 7 integrated) and Q3 2025 data — **not empty** | |

---

## Test 15: Error Feedback on Failed Actions

**Page:** Automations (`#/automations`)

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 15.1 | In Profile, set Email Delivery to **"Cloud"** and save | Cloud send mode active | |
| 15.2 | Disconnect from internet (DevTools > Network > Offline) | Network offline | |
| 15.3 | Go to Automations > Inbox, click **Approve** on any action | Error toast: "Failed to send action — please retry" | |
| 15.4 | Reconnect to internet | Network restored | |
| 15.5 | Reset Email Delivery to **"Gmail Draft"** in Profile | Ready for next tests | |

---

## Test 16: Actor Attribution

**Page:** Admin Hub (`#/admin`) + Member Profile Drawer

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 16.1 | Open a member drawer, click "Draft personal note", send it | Action logged | |
| 16.2 | Open the member drawer again, scroll to outreach history | Logged action shows "Initiated by: **GM**" (or your configured name) — **not** "Sarah Mitchell" | |
| 16.3 | Navigate to Admin Hub, check Activity Log | Recent entries show correct actor name | |

---

## Test 17: Toast Visibility

**Page:** Any page where toasts appear

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 17.1 | Trigger any toast (e.g., save Profile, approve an action) | Toast appears at bottom-right | |
| 17.2 | Time the toast | Toast stays visible for approximately **4 seconds** before fading — long enough to read and screenshot | |
| 17.3 | Trigger multiple toasts quickly (e.g., approve 2 actions) | Toasts stack or replace cleanly without visual glitch | |

---

## Test 18: Full Page Scroll (Regression)

**Page:** Profile, Member Health, Playbooks, Automations

| # | Step | Expected Result | Pass? |
|---|------|-----------------|-------|
| 18.1 | Navigate to **Profile** page | Header and sidebar remain fixed while content scrolls | |
| 18.2 | Navigate to **Member Health** page | Same: header/sidebar pinned, content scrolls independently | |
| 18.3 | Navigate to **Playbooks** page | Same behavior | |
| 18.4 | Navigate to **Automations** page | Same behavior | |
| 18.5 | On any page, resize browser to narrow width (<768px) | Layout switches to mobile-responsive mode. Sidebar collapses. Content fills width | |

---

## Known Limitations / Expected Behaviors

- **AI drafts require ANTHROPIC_API_KEY** — if not configured on the server, all AI calls return a 200 with a fallback template. The UX still works (buttons, toasts, compose windows) but content will be generic.
- **Gmail compose opens in a new tab** — requires the tester to be logged into Gmail in their browser.
- **SMS links** use `sms:` URI scheme — behavior varies by OS (iMessage on Mac, native SMS on mobile).
- **GM Greeting Alerts reset on page navigation** — simulated per page load, not persisted.
- **Demo mode** uses static member data — the same members and scenarios appear every time.
- **Playbook API calls** require a club ID in localStorage (set automatically in demo mode). If missing, the playbook activates in the UI but doesn't create a run in the database.
- **Actor name** resolves from `swoop_user_name` or `swoop_demo_name` in localStorage. In demo mode this defaults to "GM".
- **Actions Drawer** still exists as a secondary access point from the header bell icon. The primary action flow is now inline panels on each page.
- **Inline ActionPanel "Approve"** routes through the same approveAction pipeline — email/SMS will open based on your Profile delivery setting.

---

## Bug Report Template

If a test fails, please report:
- **Test #:** (e.g., 3.4)
- **Browser/OS:** (e.g., Chrome 120 / macOS 14)
- **What happened:**
- **What was expected:**
- **Console errors:** (open DevTools > Console, screenshot any red errors)
- **Network errors:** (open DevTools > Network, screenshot any red/failed requests)
- **Screenshot:** (if visual issue)
