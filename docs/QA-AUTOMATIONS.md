# QA Test: Automations Section

**App URL:** https://swoop-member-portal-dev.vercel.app
**Page:** Sidebar → Automations (lightning bolt icon), or direct: `#/automations`
**Purpose:** Verify the Automations hub with 4 tabs — Inbox, Playbooks, Agents, Settings — renders correctly, handles state properly, and works on mobile.

---

## Prerequisites

1. Log in to the app (any mode — demo or authenticated)
2. Navigate to **Automations** in the sidebar
3. Keep DevTools Console open for error checking
4. Test on both desktop and a mobile device (or DevTools responsive mode at 375px width)

---

## Section 1: Navigation & Tab Bar

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 1.1 | Sidebar shows Automations | Look at left sidebar | Lightning bolt icon with label "Automations" between Board Report and Admin. | |
| 1.2 | Page loads | Click Automations in sidebar | Page shows title "Automations", subtitle "AI agents, action inbox, and automated playbooks." 4-tab bar: Inbox, Playbooks, Agents, Settings. No JS errors. | |
| 1.3 | Inbox is default tab | Observe active tab on load | Inbox tab is highlighted (white bg, shadow). Other 3 tabs are gray. | |
| 1.4 | Tab switching works | Click each tab in order | Content changes to match the selected tab. Active tab gets white background. Previously active tab returns to gray. | |
| 1.5 | Pending badge on Inbox tab | Check Inbox tab label | If pending actions exist, an orange badge with count appears next to "Inbox". If no pending actions, no badge shown. | |
| 1.6 | Legacy route redirects | Navigate to `#/playbooks` | Redirects to `#/automations`. Same for `#/agent-command`, `#/actions`, `#/automation-dashboard`. | |
| 1.7 | Mobile tab bar | Resize to 375px width (or view on phone) | All 4 tabs fit horizontally. Tab icons hidden on small screens. Text is readable (~11px). No horizontal scrolling required. | |

---

## Section 2: Inbox Tab

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 2.1 | Pending count shown | View Inbox tab | Header shows "N pending actions" with correct count. | |
| 2.2 | Priority filter buttons | Click All, High, Medium, Low | List filters to show only actions of selected priority. "All" shows everything. | |
| 2.3 | Action cards render | View any pending action | Card shows: description, source + action type, impact metric (if any), colored left border (red=high, amber=medium, blue=low), priority badge. | |
| 2.4 | Approve action | Click "Approve" on any action | Card disappears from pending list. Count decreases by 1. If all approved, "All caught up" empty state with checkmark shows. | |
| 2.5 | Dismiss action | Click "Dismiss" on any action | Card disappears from pending list. Count decreases by 1. | |
| 2.6 | Recently handled section | After approving/dismissing at least 1 action | Collapsible "Recently handled (N)" link appears below pending list. Click to expand: shows handled actions with checkmark (approved) or x (dismissed) and timestamp. | |
| 2.7 | Empty state | Approve/dismiss all actions | "All caught up" screen with checkmark icon, "No pending actions right now." message. | |
| 2.8 | Filter + empty state | Set filter to "High" when no high-priority actions exist | Shows "No high priority actions. Try 'All' filter." | |
| 2.9 | Mobile layout | View on 375px screen | Action cards stack vertically, full width. Filter buttons fit without scrolling. Approve/Dismiss buttons are tappable (44px hit target). | |

---

## Section 3: Playbooks Tab

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 3.1 | Playbooks load | Click Playbooks tab | Grid of playbook cards appears. No standalone page title (embedded mode). Category filter bar visible. | |
| 3.2 | Playbook cards show data | Check any card | Shows: category badge (color-coded), name, description (2 lines max), step count, triggered count, track record. | |
| 3.3 | Category filter works | Click "Service Recovery" filter | Only Service Recovery playbooks shown. Click "All" to reset. | |
| 3.4 | Select a playbook | Click any playbook card | Detail panel opens on right (desktop) or below (mobile). Shows: playbook name, description, triggered for member, monthly impact, steps, track record, before/after metrics. | |
| 3.5 | Steps display | View steps in detail | Numbered steps (1, 2, 3) with badge, title, description, timing window. | |
| 3.6 | Customize Steps button | Look above the steps list | "Customize Steps" button with pencil icon on the right. If steps were previously customized, shows orange "Customized" badge. | |
| 3.7 | Open step editor | Click "Customize Steps" | Step editor replaces the detail view. Shows: header "Customize: [playbook name]", list of editable steps, "+ Add Step" button, "Reset to Defaults" and "Save Customizations" buttons. | |
| 3.8 | Edit step title | Click "Edit" on any step, change title | Title field is editable. Changes appear immediately in the step header. | |
| 3.9 | Edit step description | Change the description textarea | Text updates. | |
| 3.10 | Edit step timing | Change the timing input | Timing label updates in the step header. | |
| 3.11 | Change badge/action type | Click a different badge preset | 10 badge options: Staff Alert, GM Flag, Comp Offer, Email, SMS, Phone Call, Introduction, Survey, Schedule, Tag. Selected badge gets highlighted ring. Step badge updates. | |
| 3.12 | Reorder steps | Click up arrow on step 2 | Step 2 moves to position 1. Step numbers update accordingly. | |
| 3.13 | Add a step | Click "+ Add Step" | New step appears at the bottom with "New step" title, default badge, and "Day 1" timing. | |
| 3.14 | Remove a step | Click x on any step (must have 2+ steps) | Step is removed. Remaining steps renumber. | |
| 3.15 | Cannot remove last step | Have only 1 step | Remove button (x) is not shown — minimum 1 step required. | |
| 3.16 | Save customizations | Click "Save Customizations" | Button briefly shows "Saved!". Refresh the page → Navigate back to Automations → Playbooks → select same playbook. Customized steps persist. "Customized" badge visible on the "Customize Steps" button. | |
| 3.17 | Reset to defaults | Click "Reset to Defaults" | Steps revert to original playbook defaults. "Customized" badge disappears after saving. | |
| 3.18 | Close editor | Click "Done" | Returns to normal playbook detail view with the customized (or default) steps displayed. | |

---

## Section 4: Agents Tab

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 4.1 | Summary strip renders | Click Agents tab | Top strip shows: Active Agents count (green), Pending Actions count (orange), Approved This Period count (gray). | |
| 4.2 | Agent cards load | Below summary strip | 6 agent cards in responsive grid (2-col on desktop, 1-col on mobile). Each shows: robot icon, name, status badge (Active/Idle/Learning/Paused), accuracy %, description, source system tags. | |
| 4.3 | Pause an agent | Click "Pause" on any Active agent | Button changes to "Resume". Status badge changes to amber "Paused". | |
| 4.4 | Resume a paused agent | Click "Resume" on a Paused agent | Button changes to "Pause". Status returns to previous state. | |
| 4.5 | Agent settings panel | Click "Settings" on any agent card | Expandable panel opens below the card content with: auto-approve threshold slider, tone override dropdown, max actions/day slider, notify toggle, custom instructions textarea, "Save Agent Settings" button. | |
| 4.6 | Auto-approve threshold | Drag the slider | Label updates: "Auto-approve threshold: XX%". Range: 50% to 99%. | |
| 4.7 | Tone override dropdown | Click dropdown | Options: "Use Global Setting", Warm & Professional, Casual & Friendly, Formal & Executive, Empathetic & Supportive, Energetic & Enthusiastic. Selecting one changes the value. | |
| 4.8 | Max actions per day | Drag the slider | Label updates: "Max actions/day: N". Range: 1 to 50. | |
| 4.9 | Notify toggle | Click the toggle | Switches between on (orange) and off (gray). Label: "Notify me when this agent proposes an action". | |
| 4.10 | Custom instructions | Type in the textarea | Text input works. Placeholder shows example guidance text. | |
| 4.11 | Save agent settings | Click "Save Agent Settings" | Settings persist. Close and reopen the settings panel — values should remain. Refresh page — values should persist (stored in localStorage). | |
| 4.12 | Activity panel | Click "Activity (N)" on any agent | Expandable panel shows recent actions by this agent with descriptions and timestamps. | |
| 4.13 | Settings/Activity toggle | Click Settings, then Activity | Opening one closes the other. Only one panel open at a time. | |
| 4.14 | Empty state | If no agents exist (new club) | Shows "No agents configured" message with robot icon. | |
| 4.15 | Mobile layout | View at 375px width | Cards stack to single column. Settings panel is full-width. Sliders are usable on touch. | |

---

## Section 5: Settings Tab

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 5.1 | Settings tab loads | Click Settings tab | Shows sections: AI Model, Model Parameters, Brand Voice & Tone, Sender Identity, Example Messages, Auto-Approve. | |
| 5.2 | AI Model selection | Click each model card | 5 cards: Claude Sonnet 4, Claude Opus 4, Claude Haiku 4, GPT-4o, GPT-4o Mini. Each shows provider badge (Anthropic/OpenAI) and description. Selected card has orange border. | |
| 5.3 | Temperature slider | Drag the slider | Label updates: "Temperature: X.X". Range 0.0 to 1.5. Endpoints labeled "Precise" and "Creative". | |
| 5.4 | Max tokens slider | Drag the slider | Label updates: "Max Response Length: N tokens". Range 100 to 2000. Endpoints labeled "Brief" and "Detailed". | |
| 5.5 | Tone presets | Click each tone option | 6 options: Warm & Professional, Casual & Friendly, Formal & Executive, Energetic & Enthusiastic, Empathetic & Supportive, Custom Voice. Selected option has orange border. | |
| 5.6 | Tone preview | Select any preset (not Custom) | Preview box appears below showing an example message in that tone style (italic, quoted). | |
| 5.7 | Custom voice | Select "Custom Voice" | Textarea appears: "Describe your club's voice" with placeholder text. No preview box (custom has no preview). | |
| 5.8 | Sender Identity | Edit Title/Role and Custom Sign-off | Both inputs are editable text fields. Title placeholder: "General Manager". Sign-off placeholder: "See you at the club!" | |
| 5.9 | Example messages — defaults | View Example Messages section | 3 default examples: Service Recovery, Re-engagement, New Member Welcome. Each has an editable category label and message textarea. | |
| 5.10 | Edit example category | Change the category label of any example | Updates inline. | |
| 5.11 | Edit example text | Change the message text of any example | Updates in textarea. | |
| 5.12 | Remove example | Click x on any example | Example is removed from the list. | |
| 5.13 | Add example | Click "+ Add Example" | New blank example appears with empty category and message fields. | |
| 5.14 | Auto-approve toggle | Click the toggle switch | Switches between OFF ("manual review for all actions") and ON ("Auto-approve is ON"). When ON, threshold slider appears. | |
| 5.15 | Auto-approve threshold | Enable auto-approve, drag slider | Label: "Confidence Threshold: XX%". Range 50% to 99%. Endpoints: "More actions auto-approved" and "Only high-confidence". | |
| 5.16 | Save settings | Click "Save Settings" | Button shows "Saved!" briefly. Refresh page, navigate back to Settings tab — all values persist. | |
| 5.17 | Mobile layout | View at 375px | AI Model cards stack to single column. Tone presets are full-width. Sliders are usable on touch. All content scrollable without horizontal overflow. | |

---

## Section 6: Actions Drawer (Quick Access from Today)

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 6.1 | Drawer still works | Go to Today page, click on any action queue card or "Review all" | Actions drawer slides in from right. | |
| 6.2 | Drawer shows inbox only | Check drawer content | Shows action cards (max 5) with Approve/Dismiss buttons. No Playbooks tab. | |
| 6.3 | "View all in Automations" link | Look at bottom of drawer | Footer button "View all in Automations →". Clicking it closes the drawer and navigates to `#/automations`. | |
| 6.4 | Approve from drawer | Click Approve on any action in drawer | Action disappears from drawer. Also disappears from Automations → Inbox tab. | |

---

## Section 7: Cross-Feature Integration

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 7.1 | Sidebar icon visible | Check sidebar | Lightning bolt icon renders correctly in both expanded and collapsed sidebar states. | |
| 7.2 | No "Oakmont Hills" references | Scan all visible text on Automations tabs | No hardcoded "Oakmont Hills" club name anywhere. Should show dynamic club name or generic text. | |
| 7.3 | State persistence across tabs | Approve an action in Inbox, switch to Agents tab, switch back | Approved action stays removed. Pending count updates. | |
| 7.4 | Settings persist across sessions | Save settings on Settings tab, close browser, reopen app | All settings (model, tone, examples, thresholds) are preserved. | |
| 7.5 | Playbook customizations persist | Customize steps on any playbook, navigate away and back | Customized steps are still present. "Customized" badge shows. | |

---

## Section 8: Mobile-Specific Tests

Test all of these at 375px viewport width (iPhone SE) or on an actual phone.

| # | Check | Expected | Pass? |
|---|-------|----------|-------|
| 8.1 | Tab bar fits without scrolling | All 4 tabs (Inbox, Playbooks, Agents, Settings) visible and tappable. No horizontal scroll. Icons hidden on small screens. | |
| 8.2 | Inbox cards are full-width | Action cards stretch to full width. Approve/Dismiss buttons are tappable (min 44px height). | |
| 8.3 | Playbook detail is readable | Playbook detail text wraps properly. Steps are stacked vertically. No text overflow or cut-off. | |
| 8.4 | Agent cards stack to 1 column | All 6 agent cards in single column. Settings panel expands full-width below card. | |
| 8.5 | Settings sliders usable on touch | Temperature, max tokens, and threshold sliders can be dragged with a finger. Values update. | |
| 8.6 | Tone presets scroll vertically | 6 tone preset buttons stack vertically, each full-width and tappable. | |
| 8.7 | Step editor usable on mobile | Playbook step editor: reorder arrows, edit fields, badge selector all work with touch. | |
| 8.8 | No horizontal overflow anywhere | On any tab, no content causes horizontal scrolling of the page body. | |

---

## Pass Criteria

| Criterion | Requirement |
|-----------|-------------|
| All 4 tabs load | No JS errors, content renders for Inbox, Playbooks, Agents, Settings |
| Tab switching | Instant, correct content displayed, active state clear |
| Action approve/dismiss | Updates count, removes card, shows in "recently handled" |
| Playbook customization | Edit/reorder/add/remove steps, save persists, reset works |
| Agent config | All 5 controls work (threshold, tone, max/day, notify, instructions), save persists |
| Settings save | AI model, tone, parameters, examples, auto-approve all persist across refresh |
| Mobile | All 4 tabs fit horizontally, no overflow, touch-friendly controls |
| Legacy redirects | `#/playbooks`, `#/agent-command`, `#/actions` all land on `#/automations` |
| No console errors | Zero JS errors across all tab interactions |
