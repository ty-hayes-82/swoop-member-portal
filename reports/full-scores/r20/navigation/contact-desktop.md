# Contact Desktop — Navigation Score

**Grade: A-**

## What's Working
- Full top nav visible with "Contact" in the active accent color — perfect wayfinding.
- Footer duplicates the nav with an additional highlighted "Book a Demo" link in accent orange.
- Footer legal row (Privacy Policy | Terms of Service) rendered on the same line as copyright — clean and complete.
- The form panel is the page's primary focus, with email + phone fallbacks clearly listed as alternative nav paths.
- Short page (no long scroll) means no navigation fatigue; user sees nav, hero, form, footer in one viewport.
- Brand link top-left gives escape back to home.

## What's Broken
- Footer Privacy/Terms links route to `#/contact` — which is **this page** — creating an infinite self-loop dead end on the very page legal scrutiny is highest.
- No breadcrumb ("Home > Contact") to confirm entry context.
- No inline success/next-step preview — user doesn't know what happens after "Book Your Demo" (Calendly? email confirmation? form POST?).

## Exact Fix
File: `src/landing/components/LandingFooter.jsx`

Lines 77-78, replace:
```jsx
<a href="#/contact" style={{...}}>Privacy Policy</a>
<a href="#/contact" style={{...}}>Terms of Service</a>
```
with real routes `#/privacy` and `#/terms`, OR (if those pages don't exist yet) `href="/legal/privacy.html"` pointing to static legal files. A contact page that self-loops on legal links is a credibility blocker.

File: `src/landing/pages/ContactPage.jsx` — add under the form: `<p style={{ fontSize:12, color:theme.colors.textMuted, marginTop:12 }}>After submit, you'll get a confirmation email within 5 min and a calendar link to pick a 30-min slot.</p>` so users understand the nav transition post-submit.
