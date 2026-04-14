# Pricing Desktop — Technical Score

**Grade: D+**

## What's Working
- Three concrete tiers ($0, $499, $1,499) remove pricing ambiguity — IT procurement can at least forecast budget.
- "What is member turnover costing your club?" calculator implies the platform does real math on real data, not just a static brochure.
- FAQ ("Things GMs ask us") hints at direct answers, which is the right shape for technical objections.

## What's Broken
- No mention of what each tier includes technically — seat count, agent count, API calls, data-refresh frequency, storage, retention period.
- No integration scope per tier (does $0 include POS? Does $499 include CRM write-back?).
- No implementation/onboarding cost line — a CFO/IT buyer cannot price the full year.
- No security/compliance call-out, no data-processing agreement mention, no SSO availability, no audit-log retention tied to tier.
- No SLA or uptime commitment attached to any plan — standard at $1,499/mo.
- FAQ entries are not visible/expanded, so technical Q&A (data ownership, cancellation export, DPA) can't be evaluated.

## Exact Fix
Edit `src/landing/components/PricingSection.jsx` (or `src/landing/pages/PricingPage.jsx`) to add a fourth row to each tier card titled "Included technically":

Free / $0: "Read-only connection to 1 system (tee sheet OR POS). Daily refresh. 30-day data retention. 1 GM seat. Email support."
Standard / $499: "Read + write to all 4 systems (tee sheet, POS, CRM, F&B). Hourly refresh. 12-month retention. 5 seats. SSO (Google/Microsoft). CSV export. Business-hours support, 4-hour response."
Club / $1,499: "Unlimited integrations and seats. 15-min refresh. 36-month retention. SSO + SAML. Role-based access. 90-day audit log. DPA on request. 99.9% uptime SLA with credits. 1-hour response, dedicated Slack channel."

Add a technical FAQ row at the bottom of `FaqSection.jsx` answering: "Who owns the data?" ("You do. Full CSV export on demand, and on cancellation."), "Is there a DPA?" ("Yes, on request. We're SOC 2 Type II in progress."), "Does member PII train AI models?" ("No. We use Anthropic Claude API under a zero-retention enterprise agreement."), "How long does onboarding take?" ("30-minute data load, first board-ready briefing in 24 hours, full rollout in 7 days.").
