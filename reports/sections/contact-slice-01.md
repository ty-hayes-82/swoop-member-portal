# Contact Slice 01 — Section Score

**Overall Grade: C+**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | B | Left-side copy reinforces the offer but doesn't add new information |
| Design/Visual | C+ | Dark overlay on a golf background makes left-side body text borderline unreadable |
| CRO/Conversion | B- | Form is present and the CTA button is orange, but the form asks for Phone which will kill conversions |
| Trust/Credibility | C | "No credit card required" and "Cancel anytime" are irrelevant for a free demo — signals product confusion |
| Mobile UX | D+ | Two-column form layout will stack incorrectly; dark background with light text fails WCAG AA on mobile |
| Navigation/UX | B- | Footer is sparse; Investor Information link is low-priority for a GM buyer |
| B2B Buyer Journey | C+ | Form fires before buyer is fully qualified; no "what to expect" content adjacent to the form |
| Copy/Voice | C+ | Left-side copy repeats the hero with minor wording changes; "Book a live walkthrough" is weaker than hero headline |
| Technical Credibility | D+ | Footer says "Swoop Golf" — inconsistent with brand name "swoop" used throughout nav and hero |

---

## Messaging/Positioning
**Grade: B**
- What's working: "BOOK A DEMO" label and "See what your club misses today and can recover tomorrow" maintains the page-level message. The left-side bullet points (tee sheet leakage, at-risk members, F&B staffing pressure, revenue pipeline blind spots) correctly translate the abstract headline into specific club operations problems.
- What's broken: "Book a live walkthrough with your own operating scenarios" is a weaker frame than the hero's "on your club's real data." "Operating scenarios" sounds like a sales demo playbook rather than a live analysis of the GM's own data. This is a downgrade in specificity at the most critical conversion moment.
- Fix: Change "Book a live walkthrough with your own operating scenarios" to: "We run Swoop on your club's actual tee-sheet and member data — live, in 30 minutes. You see your numbers, not a demo."

---

## Design/Visual
**Grade: C+**
- What's working: Two-column layout (copy left, form right) is a conventional and proven contact page pattern for B2B SaaS. Orange CTA button has high contrast against the dark form panel.
- What's broken: The dark photographic overlay behind the left-side copy significantly reduces text readability. White body text over a dark golf-course background with variable luminance fails WCAG AA contrast requirements in several areas — particularly the body paragraph lines where the background lightens near the image horizon. The footer area transitions to a flat white, which creates an unresolved tonal jump.
- Fix: Add a semi-transparent dark overlay to the background image: `background: linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.55) 100%)` on the left-side column. Alternatively, ditch the background image entirely for a solid dark-green (#1a2e1a) — cleaner, more premium, fully accessible.

---

## CRO/Conversion
**Grade: B-**
- What's working: The form is clean — Name, Club, Email, Phone in a logical sequence. Orange "Book Your Demo" button is prominent. "No credit card required · 30-minute walkthrough · Cancel anytime" micro-copy exists.
- What's broken: (1) Phone is a required-feeling field. Phone number requests in B2B demo forms drop conversion rates by 15–30% (Hubspot/Unbounce benchmark data). A GM who is casually curious will abandon the form at Phone. (2) "Cancel anytime" is SaaS subscription language — this is a free demo booking, not a subscription sign-up. It creates cognitive dissonance and makes the offer feel like it has hidden commitment. (3) The form lacks a headline — it opens with NAME/CLUB fields immediately, with no label like "Book Your Free 30-Minute Walkthrough" above it.
- Fix: (1) Make Phone optional and label it "(optional — for scheduling)". (2) Remove "Cancel anytime" and replace micro-copy with: "No credit card · 30 minutes · Your club's own data · Founding partner pricing." (3) Add above the form fields: `<h2 class="text-white text-xl font-bold mb-4">Book Your Free Walkthrough</h2>`.

---

## Trust/Credibility
**Grade: C**
- What's working: "Or email us at demo@swoopgolf.com · (860) 325-5102" provides direct contact alternatives, which is a strong trust signal — it says there are real people behind the form.
- What's broken: "No credit card required · Cancel anytime" are subscription SaaS trust signals that are contextually wrong for a free demo request. They do not build trust; they introduce doubt ("wait, am I signing up for something?"). The "Limited founding partner slots available" line is correct scarcity, but placing it below the body copy in a smaller/lighter font minimizes its impact.
- Fix: Replace the form footer micro-copy entirely: "Free for founding partners · No contracts · We'll confirm your slot within 1 business day." Promote the scarcity line to appear directly above the CTA button in bold orange text: "9 founding partner slots remaining."

---

## Mobile UX
**Grade: D+**
- What's working: Form fields are full-width within the form panel, which will stack acceptably.
- What's broken: (1) The two-column section layout will collapse to stacked on mobile — left-side copy with dark overlay image above, then form below. The background image behind the copy will likely be cropped to a narrow horizontal band, destroying the visual. (2) The contact links ("demo@swoopgolf.com · (860) 325-5102") in the form footer will wrap awkwardly on 375px screens. (3) The footer "Investor Information | © 2024 Swoop Golf" line will be very tight on small screens with no padding evident.
- Fix: On mobile (`@media (max-width: 768px)`): remove background image from left column entirely, replace with solid `bg-[#1a2e1a]`. Set `flex-direction: column` on the section container with left copy above the form panel. Add `flex-col sm:flex-row` on the contact links line so email and phone stack vertically on mobile.

---

## Navigation/UX
**Grade: B-**
- What's working: Main nav remains accessible at the top, consistent with other pages.
- What's broken: The footer contains "Investor Information" as the only footer link. For a GM buyer, this is an irrelevant link at the worst moment (right after they've decided whether to submit the form). It signals that Swoop's primary audience is investors, not club operators — which is the wrong impression to leave on the contact page. The copyright year reads "2024" which is outdated (current year is 2026).
- Fix: Replace footer links with GM-relevant links: "Privacy Policy · Terms of Service · Results · FAQ". Remove or move "Investor Information" to the About page footer. Update copyright to "© 2026 Swoop."

---

## B2B Buyer Journey
**Grade: C+**
- What's working: The left-side bullet list ("tee sheet leakage, at-risk members, F&B staffing pressure, revenue pipeline blind spots") reiterates what the demo will cover, which reduces uncertainty about what they're signing up for.
- What's broken: The contact page moves directly from "here's what we'll look at" to "give us your details" — it skips "here's what you'll walk away with." A GM's internal blocker at this stage is not "what is this product" but "what do I tell my board if this goes nowhere?" They need a low-risk exit: what's the output of this 30 minutes?
- Fix: Add a 3-point "What you'll leave with" list on the left panel below the current bullet list: "✓ A ranked list of your top 5 revenue and retention gaps. ✓ Benchmarks against comparable clubs. ✓ A draft 90-day action plan — yours to keep, no strings attached." This frames the demo as a deliverable, not a sales call.

---

## Copy/Voice
**Grade: C+**
- What's working: "Limited founding partner slots available — early clubs get hands-on onboarding and direct input on the roadmap." This is the best line on the contact page — it makes founding partnership feel like a privilege, not a guinea pig arrangement.
- What's broken: "Book a live walkthrough with your own operating scenarios: tee sheet leakage, at-risk members, F&B staffing pressure, and revenue pipeline blind spots." — "operating scenarios" is vague corporate language. The colon-list that follows reads like a product spec. The left panel as a whole is a weaker rewrite of the hero copy rather than a distinct conversion-stage message.
- Fix: Rewrite the left panel body: "In 30 minutes, we load your club's tee-sheet data into Swoop and show you exactly where revenue is leaking and which members are quietly disengaging. You leave with a prioritized action list — not a pitch deck. [line break] Founding partners get hands-on onboarding and a direct line to the product team. We're keeping this cohort small on purpose."

---

## Technical Credibility
**Grade: D+**
- What's working: Providing a direct phone number (860-325-5102) signals a real business with real people.
- What's broken: (1) The footer brand name reads "Swoop Golf" but the nav logo reads "swoop" — this inconsistency undermines credibility. Is the company Swoop, Swoop Golf, or SwoopGolf? A buyer Googling after the demo will be confused. (2) The email domain is swoopgolf.com — also inconsistent with the "swoop" nav branding. (3) No mention of data security, PMS compatibility, or what technical setup is required before the 30-minute call. A COO reviewing this page will not greenlight the demo without knowing whether there's an IT dependency.
- Fix: (1) Align brand name everywhere to a single canonical form — either "Swoop" or "Swoop Golf." Update footer, email domain, and all copy to match. (2) Add a one-line data note below the bullet list: "Works with Jonas, Cobalt, Club Prophet, and Northstar. Bring a tee-sheet CSV export — no IT setup required."

---

## Top 3 Priority Fixes for This Section
1. Remove the Phone field or make it explicitly optional — it is the single highest-friction element on the form and will suppress conversion more than any other factor on this page.
2. Fix the "Cancel anytime" micro-copy — this is subscription language on a free demo form, and it creates confusion that will cause abandonment right at the button.
3. Align the brand name ("swoop" vs. "Swoop Golf") across nav, footer, email domain, and all copy — inconsistency at the form submission stage is a credibility killer for a B2B buyer who is about to hand over their contact information.
