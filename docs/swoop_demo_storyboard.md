# Swoop Golf — Pilot Demo Storyboard

> **Version:** v1.0 — April 2026
> **Total runtime:** ~10 minutes
> **Theme:** See It → Fix It → Prove It

---

## Stories Overview

| # | Story | Persona | Duration | Pillars |
|---|---|---|:---:|---|
| 1 | The Saturday Morning Briefing | Daniel — Director of Golf | ~4 min | See It · Fix It · Cross-Domain |
| 2 | The Quiet Resignation Catch | GM — Tuesday Morning Review | ~3 min | See It · Fix It · Cross-Domain |
| 3 | The Revenue Leakage Discovery | GM — Monthly Board Prep | ~3 min | See It · Prove It · Cross-Domain |

---

# Story 1 — The Saturday Morning Briefing

**Setting:** Bowling Green CC — Daniel Soehren, Director of Golf
**Pillars:** See It · Fix It · Cross-Domain
**Theme:** Operational Visibility + Staffing

### Setup

It's 7:15 AM Saturday. Daniel opens Swoop before heading to the club. The Today view immediately tells him what his tee sheet, weather, staffing, and member health data are saying together. **220 rounds booked**, **3 at-risk members on the tee sheet**, and he's **2 servers short** for projected dining demand. No single system told him any of this. Swoop connected the dots overnight.

### Validation Data

- **Cockpit preference:** 50% of GMs
- **Service consistency:** 70% top-3 priority
- **Staffing alignment:** 60% top-3 priority

---

## Step 1 — Set the Scene: Saturday at the Club  *(Slides)*

### 🎙 Presenter Script

> "Meet Daniel. He's the Director of Golf at Bowling Green Country Club. It's 7:15 on a Saturday morning. 220 rounds are booked, the weather is 82 and clear, and he has no idea that three of his at-risk members have tee times today, or that his dining room is about to be short two servers."

*Pause. Let the audience picture the chaos.*

> "Right now, Daniel would need to check his tee sheet, pull up the POS schedule, cross-reference his CRM, and check the weather app. **Four systems. Four logins. On a Saturday morning. Nobody does that.**"

### ⚙ Demo Notes

Opening slide: split-screen showing 4 separate club systems (Jonas tee sheet, POS schedule, member CRM, weather) vs. one Swoop screen. Emphasize the "4 logins" friction.

> 💡 **Survey data:** 70% of GMs spend 2-5 hrs/wk bridging system gaps manually. 90% are only partially connected. **0% fully integrated.**

---

## Step 2 — Today View: The Morning Briefing  *(Live UI · Layer 3)*

### 🎙 Presenter Script

> "Daniel opens Swoop and sees one screen. The Today view. Right at the top: **'220 rounds booked. Weather: 82°F, clear. 3 at-risk members on today's tee sheet. Staffing gap: 2 servers short for projected post-round dining demand.'**"

*Point to each data element. Let the cross-domain connection sink in.*

> "Notice what just happened. Tee sheet data, weather data, member health data, and staffing data all came together in one sentence. **No single system at this club can produce that sentence. That's the Layer 3 difference.**"

### ⚙ Demo Notes

**Click path:** Swoop → Today view → Morning Briefing banner

Walk through each banner element slowly. The hero is the cross-domain synthesis, not any single metric.

> ⚡ **KEY MOMENT:** This is the "See It" wedge. The audience should feel the relief of one screen replacing four systems.

---

## Step 3 — At-Risk Members on Today's Sheet  *(Live UI)*

### 🎙 Presenter Script

> "Daniel clicks into the at-risk alert. **Three members.** One has a 9:20 AM tee time. Her health score dropped from 82 to 61 over the past three weeks. Email opens fell first, then golf frequency dipped, and her last dining visit was 18 days ago."

*Point to the decay sequence visualization. This is the member health score in action.*

> "The CRM says she's an active member. The tee sheet says she booked today. **Only the composite health score reveals that she's pulling away.** This is the first domino insight that Jonas MetricsFirst cannot produce, because it can't see email engagement, dining frequency, and golf behavior together."

### ⚙ Demo Notes

**Click path:** Today → At-Risk Members → Member card with health score + decay sequence

Show the source system badges: **Tee Sheet + POS + Email + CRM**. This builds trust by making the cross-domain synthesis visible.

> 💡 **Survey data:** 90% value daily health score. 43.5/100 budget points to member visibility. Two clubs allocated 100% to visibility alone.

---

## Step 4 — Staffing Gap: The $31 Per Slow Round Insight  *(Live UI · $ Impact)*

### 🎙 Presenter Script

> "Now Daniel sees the staffing recommendation. **220 rounds with post-round dining projected at 41% conversion** on properly staffed days. But he's 2 servers short. Swoop knows from historical data that **understaffed Saturdays drop dining conversion to 22%. That's a $31 revenue gap per slow round.**"

*Let the dollar number land. This is the staffing-to-revenue connection.*

> "This isn't a guess. This is tee sheet volume, cross-referenced with weather demand, cross-referenced with POS dining conversion rates, cross-referenced with staffing coverage. **Four data sources. One actionable recommendation: call in one more server.**"

### ⚙ Demo Notes

**Click path:** Today → Staffing Gap card → Revenue impact projection

Highlight the **$31/slow round** figure prominently. This is the demo-stopping data point from the audit.

> ⚡ **KEY MOMENT:** The audience should think "wait, slow rounds cost us dining revenue?" This is the cross-domain insight no single vendor delivers.

---

## Step 5 — Take Action: Approve from the Queue  *(Live UI)*

### 🎙 Presenter Script

> "Daniel opens the Actions queue. **Two recommended actions are waiting.** First: 'Call in one additional server for Saturday lunch.' Second: 'Send personalized welcome-back touch to the at-risk member with the 9:20 tee time.' **Daniel approves both with one tap each.**"

*Emphasize: manual approval. No auto-execution. The GM stays in control.*

> "Notice: Swoop recommended. Daniel decided. The system doesn't act on its own. **3 out of 4 club operators told us they want full manual control, especially at launch.** This is intelligence with a human in the loop."

### ⚙ Demo Notes

**Click path:** Today → Actions queue → Approve staffing action → Approve member touch action

Keep this fast. Two taps. The speed is the point.

> ✅ **Survey validation:** 3/4 qualitative respondents want full manual control. Auto-execution is OFF by default.

---

### Layer 3 Differentiator — What to hammer home

Four data sources (tee sheet + weather + POS + member health) synthesized into one morning briefing with dollar-quantified staffing recommendations and at-risk member alerts. **Jonas shows tee times. ForeTees shows bookings. Swoop shows what's about to go wrong and what to do about it.** That's the difference between a system of record and a system of intelligence.

### Outcome — Close the story

Saturday runs smoothly. The at-risk member gets a personal greeting from the pro shop. **Post-round dining captures 41% conversion** instead of the 22% from understaffed days. Zero complaints. Daniel went from guessing to knowing, and his Saturday was the best in a month. All before his first cup of coffee.

> *"I went from guessing to knowing. I staffed correctly, caught an at-risk member, and my Saturday was the best in a month."*
> — **What Daniel tells his GM on Monday morning**

---

# Story 2 — The Quiet Resignation Catch

**Setting:** 400-Member Club — GM, Tuesday Morning Review
**Pillars:** See It · Fix It · Cross-Domain
**Theme:** Member Health & Early Warning

### Setup

A GM opens the Today view on a Tuesday and sees a member who just moved from Healthy to At-Risk. **No single system flagged the change.** CRM shows an active member. Tee sheet shows reduced but present activity. Only the composite health score, drawing on email + golf + dining + events, reveals a decay pattern that started three weeks ago. The GM catches it before the resignation letter is written.

### Validation Data

- **Health score value:** 90% of GMs
- **Visibility budget:** 43.5/100 points
- **Currently reactive:** 70%

---

## Step 1 — Set the Scene: The Invisible Churn  *(Slides)*

### 🎙 Presenter Script

> "Here's a question every GM has asked: **'Why didn't I see that coming?'** A member who was playing twice a week, dining regularly, opening every email. Then one day the resignation letter lands on your desk. Blindsided. But if you look at the data, **the signals were there for weeks.**"

*Pause.*

> "The problem is that the signals were scattered across four different systems. Your CRM said 'active member.' Your tee sheet said 'booked last week.' Your POS said 'dined 18 days ago.' None of them raised a flag. **But together, they tell a very different story.**"

### ⚙ Demo Notes

Opening slide: a timeline showing a member's engagement across 4 systems over 6 weeks. Each system looks fine individually. Together, the decay is obvious.

> 💡 **70% of GMs learn about member dissatisfaction only after complaints.** This story shows proactive intelligence.

---

## Step 2 — Today View: Status Change Alert  *(Live UI)*

### 🎙 Presenter Script

> "Tuesday morning. The GM opens Swoop and the Today view shows a status change: **'Member 203 moved from Healthy to At-Risk.' Health score dropped from 78 to 54.**"

*Click into the member card.*

> "Here's the decay sequence. **Email opens dropped first, three weeks ago. Then golf frequency dipped two weeks ago. Last dining visit was 18 days ago.** This is a multi-domain pattern. The first domino was email. Then golf. Then dining. **It's a textbook disengagement arc.**"

### ⚙ Demo Notes

**Click path:** Swoop → Today → Status Changes → Member 203 card → Decay sequence timeline

The decay sequence visualization is the hero. Show the "first domino" clearly: **email → golf → dining**. Walk it slowly.

> ⚡ **KEY MOMENT:** "The CRM says active. The tee sheet says present. **Only the composite view reveals the trajectory.**" This line should land hard.

---

## Step 3 — Member Profile: The Full Cross-Domain Picture  *(Live UI · Layer 3)*

### 🎙 Presenter Script

> "Click into the full profile. Here's everything Swoop knows about this member.
> - **Golf:** 2 rounds/week down to 1 in the last month
> - **Dining:** average 1.5 visits/week, now zero for 18 days
> - **Email:** 85% open rate, dropped to 20%
> - **Events:** attended the Spring Social, but nothing since
>
> Source system badges on every data point: Tee Sheet, POS, Email, CRM."

*Point to the source system badges. This is the trust-building mechanism.*

> "Every insight shows you where it came from. **'How do you know this?'** is the first question a skeptical GM will ask. Swoop answers it automatically."

### ⚙ Demo Notes

**Click path:** Member 203 card → Full profile → Multi-domain engagement chart

Highlight source system badges on each data point: `[Tee Sheet] [POS] [Email] [CRM]`. This addresses trust and transparency.

> ✅ **Audit strength:** "Source System Transparency builds trust by making cross-domain synthesis visible."

---

## Step 4 — Take Action: GM Personal Call Playbook  *(Live UI)*

### 🎙 Presenter Script

> "Swoop recommends an action: **'GM Personal Call. Check in, offer complimentary round with guest.'** Daniel approves it. After the call, he marks it complete and logs a note: 'Member frustrated with pace of play on weekends. Rerouted to weekday morning tee times.'"

*Show the action completion flow.*

> "**That member is worth $32,000 a year in dues.** Without Swoop, the GM would have found out when the resignation letter hit his desk. Instead, he caught it in the first week of decay."

### ⚙ Demo Notes

**Click path:** Member profile → Recommended action → Approve "GM Call" → Mark complete → Log note

The **$32K/year** figure is the anchor. Let it land. This connects the human action to the dollar value of the save.

> ⚡ **KEY MOMENT:** The dollar quantification. **"$32K/year in dues. Found out from a phone call, not a resignation letter."**

---

### Layer 3 Differentiator — What to hammer home

The CRM says active. The tee sheet says booked. **Only Swoop's cross-domain health score reveals the decay trajectory.** The "first domino" insight (email drops → golf drops → dining drops) is unique to Layer 3. Jonas MetricsFirst has a member risk score, but it's display-only and single-ecosystem. **Swoop is real-time, action-oriented, and cross-domain.**

### Outcome — Close the story

Member appreciates the call. Mentions frustration with pace of play on weekends. GM reroutes them to weekday morning tee times with faster pace. Health score stabilizes over the next month. **Member renews 4 months later.** $32K in annual dues protected from one phone call that Swoop recommended.

> *"That member is worth $32,000 a year. Without Swoop, I would have found out when the resignation letter hit my desk."*
> — **What the GM tells the board**

---

# Story 3 — The Revenue Leakage Discovery

**Setting:** Monthly Board Prep — GM with F&B Committee
**Pillars:** See It · Prove It · Cross-Domain
**Theme:** Staffing-to-Service-to-Revenue Connection

### Setup

A GM is preparing for a board meeting. He opens the Revenue view and discovers that **$9,580/month in F&B revenue is being lost** to operational failures he didn't know existed. The decomposition traces the loss to three root causes: slow rounds skipping dining, understaffed Fridays, and weather-driven no-shows. He presents the board with a specific remediation plan, dollar-quantified, with scenario projections. **Budget approved.**

### Validation Data

- **F&B running at loss:** 80% of clubs
- **Staffing pain:** 60% top-3 priority
- **Board #1 concern:** Financial performance (40%)

---

## Step 1 — Set the Scene: Board Meeting in 3 Days  *(Slides)*

### 🎙 Presenter Script

> "Board meeting is Thursday. The F&B committee wants to know why the dining operation is losing money. The GM knows it's losing money. Everybody knows it's losing money. **80% of private clubs run F&B at a loss.** But nobody can tell the board exactly where the money is going and what to do about it."

*Pause.*

> "That's because the answer lives across three systems. **The tee sheet knows pace of play. The POS knows dining revenue. The schedule knows staffing levels. Nobody has ever connected all three.**"

### ⚙ Demo Notes

Opening slide: "80% of private clubs run F&B at a loss." Then: "But how much is operational vs. structural?" This frames the discovery.

> 💡 **Survey:** 80% negative or subsidized F&B. 30% cite labor mismatch as biggest leakage source. 40% say financial performance is #1 board concern.

---

## Step 2 — Revenue View: The $9,580/Month Decomposition  *(Live UI · Layer 3 · $ Impact)*

### 🎙 Presenter Script

> "The GM opens the Revenue view. Right at the top: **'$9,580 per month in F&B revenue lost to operational failures.'** And here's the decomposition."

*Walk through each line item slowly.*

> "**$5,760 from pace of play.** Slow rounds are skipping the dining room. **$3,400 from understaffed Fridays.** And **$420 from weather-driven no-shows** with no cancellation outreach. Three root causes. Three different source systems. **One number the GM has never seen before.**"

### ⚙ Demo Notes

**Click path:** Swoop → Revenue → F&B Revenue Leakage → Decomposition chart

This is the hero visualization. The stacked bar or waterfall chart showing **$5,760 + $3,400 + $420 = $9,580**.

> ⚡ **KEY MOMENT:** Slow down on the **$9,580 total**. The GM has never seen this number. It was invisible until Swoop connected the systems.

---

## Step 3 — The Hole 12 Bottleneck: Pace-to-Dining Link  *(Live UI · Layer 3)*

### 🎙 Presenter Script

> "Let's drill into the $5,760. Swoop identified that **Hole 12 is the primary bottleneck. 9.1 minute average delay.** And here's the cross-domain insight: **slow rounds produce 22% post-round dining conversion. Fast rounds produce 41%. That's a $31 revenue gap per slow round.**"

*This is THE demo-stopping data point. Let the $31/round figure land.*

> "Nobody at this club has ever connected pace of play on Hole 12 to dining revenue. **The tee sheet knows the pace. The POS knows the dining. Neither knows the other exists. Swoop sees both.**"

### ⚙ Demo Notes

**Click path:** Revenue → Leakage → Pace of Play → Hole 12 detail → Dining conversion comparison

Show the **22% vs 41% dining conversion** side by side. The **$31/round** figure is the anchor for everything that follows.

> ⚡ **DEMO-STOPPING MOMENT:** "$31 per slow round. **Every slow round that skips dining costs you $31.**" Repeat this once. Let the board math happen in the audience's heads.

---

## Step 4 — Scenario Slider: What Recovery Looks Like  *(Live UI)*

### 🎙 Presenter Script

> "Now the GM uses the scenario slider. **'If we reduce slow rounds by 20%, we recover $1,152 per month.'** Add one server to Friday lunch based on weather-demand correlation, that's another $850. Deploy a ranger to Hole 12 on high-demand days. **Total recoverable: $2,000+ per month from two operational changes.**"

*Move the slider in real-time. The number should update dynamically.*

> "This is what the GM takes to the board. Not 'we have a dining problem.' But **'here's exactly where we're losing, here's why, here's the fix, and here's what it's worth.'** Budget approved."

### ⚙ Demo Notes

**Click path:** Revenue → Scenario section → Drag "Slow Round Reduction" slider to 20% → Show monthly recovery amount

The dynamic slider is the interaction moment. Move it slowly. Let the audience see the dollars change.

> ✅ This transitions directly to the Board Report. If time allows, click into "Generate Board Report" to show the pre-structured 4-tab output.

---

## Step 5 — Board Report: The Story Writes Itself  *(Live UI)*

### 🎙 Presenter Script

> "**One click: 'Generate Board Report.'** Four tabs are pre-structured. **Summary:** 14 members saved, $168K in protected dues, 23 service failures caught early, 4.2-hour average response time versus the industry standard of 6+ weeks. **Member Saves. Operational Saves. What We Learned.**"

*Click through the tabs quickly. The breadth is the point.*

> "The GM used to spend 6 hours pulling reports from 4 systems. **Now he opens one page and the story is already there.** Board meeting runs 20 minutes instead of 45 because every number has a source and every insight has a dollar value."

### ⚙ Demo Notes

**Click path:** Revenue → "Generate Board Report" → Board Report → Summary / Member Saves / Operational Saves / What We Learned tabs

Don't linger on every tab. The message is: **the work is already done.** Click through briskly.

> ✅ **Audit:** "The Board Report alone could justify a subscription for many clubs." 4-tab structure is complete and validated.

---

### Layer 3 Differentiator — What to hammer home

Revenue leakage decomposition connecting pace of play (tee sheet) to dining conversion (POS) to staffing gaps (scheduling) is **genuinely Layer 3**. No single vendor can produce this insight. The **$31 per slow round** figure is proprietary cross-domain intelligence. **Jonas sees tee times. Northstar sees POS. Swoop sees the $9,580/month they're losing together.**

### Outcome — Close the story

Board sees exact dollar impact, specific root cause, and concrete remediation plan. Ranger deployed to Hole 12. One server added to Friday lunch. Dining conversion recovers. **Budget approved based on data, not anecdote.** The GM's credibility with the board increased because the numbers came with sources.

> *"I used to spend 6 hours pulling reports from 4 systems. Now I open one page and the story is already there."*
> — **What GMs say after seeing the Board Report**

---

# Storyboard Summary

## The Three Dollar Anchors

| Story | The Number | The Insight |
|---|---|---|
| Saturday Briefing | **$31/slow round** | Pace of play → dining conversion gap |
| Quiet Resignation | **$32K/year** | Annual dues protected per save |
| Revenue Leakage | **$9,580/month** | F&B revenue lost to operational failures |

## The Layer 3 Throughline

**Layer 1** = Systems of Record (Jonas, ForeTees, Northstar). They store data.
**Layer 2** = Single-domain analytics (Jonas MetricsFirst). They report within one silo.
**Layer 3** = **Cross-domain intelligence (Swoop).** We connect the dots between systems and produce insights that are impossible within any single vendor's ecosystem.

> **Jonas sees tee times. Northstar sees POS. Swoop sees the $9,580/month they're losing together.**
> *That's the difference between a system of record and a system of intelligence.*

## Demo Mechanics

- **Total runtime:** ~10 minutes (4 + 3 + 3)
- **Format mix:** Slides for set-up, Live UI for the proof
- **Recurring badges:** `Slides` · `Live UI` · `Layer 3` · `$ Impact`
- **Recurring callouts:** Survey data, Key Moments, Demo-Stopping Moments, Audit strengths

## Survey Data Quick Reference

| Stat | Value |
|---|---|
| GMs spending 2-5 hrs/wk bridging systems | 70% |
| Clubs only partially connected | 90% |
| Clubs fully integrated | **0%** |
| GMs valuing daily health score | 90% |
| GMs reactive (post-complaint) | 70% |
| Clubs with F&B at a loss | 80% |
| Operators wanting full manual control | 3 of 4 |
| Visibility budget allocation | 43.5/100 |
| Boards citing financial perf as #1 | 40% |
