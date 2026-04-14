# Contact Mobile — Navigation Score

**Grade: B+**

## What's Working
- Hamburger icon top-right, logo top-left — standard mobile pattern preserved.
- Form stacks cleanly into a single column; all fields thumb-reachable.
- "Book Your Demo" CTA is a large orange block-level button inside the thumb zone — easy to tap.
- Footer nav (Platform, Pricing, About, Contact, Book a Demo) stacks legibly below the form.
- Short-scroll page means minimal risk of getting lost.

## What's Broken
- Same Privacy/Terms self-loop bug as desktop — both route to `#/contact`.
- Hamburger does not show "Contact" active state in the collapsed top bar, so on page load the user sees no confirmation they're on Contact.
- No "success state" preview, same as desktop — mobile users especially need reassurance about what happens after tapping submit (nav transition unclear).
- No sticky "scroll to form" or anchor at top if the nav/hero pushes the form below the fold — demo conversion risks being missed on short mobile viewports.
- Email fallback `demo@swoopgolf.com` is shown but is not a `mailto:` link — breaks the expected mobile nav pattern (tap to open mail app).

## Exact Fix
File: `src/landing/pages/ContactPage.jsx`

1. Wrap the email text in a real mailto link:
```jsx
<a href="mailto:demo@swoopgolf.com" style={{ color:theme.colors.accent }}>demo@swoopgolf.com</a>
```
and the phone number in `<a href="tel:+14801257703">`.

2. Add `scrollIntoView` on the form wrapper on mount if mobile:
```jsx
useEffect(() => { if (window.innerWidth < 768) formRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }); }, []);
```

File: `src/landing/components/LandingFooter.jsx` — fix the Privacy/Terms self-loop (lines 77-78) as described in contact-desktop.md.
