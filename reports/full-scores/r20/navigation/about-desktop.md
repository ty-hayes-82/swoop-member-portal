# About Desktop — Navigation Score

**Grade: F**

## What's Working
- Nothing verifiable — the captured screenshot renders as a blank near-white canvas with no visible nav, content, or footer.

## What's Broken
- **Critical: the About desktop page is rendering blank.** Either (a) `AboutPage.jsx` returns null/empty on desktop viewport, (b) the sticky nav has `background: white` over empty content and the screenshot capture happened before hydration, or (c) there is a JS error wiping the page tree.
- With no nav rendered, every navigation metric is zero: no wayfinding, no active state, no footer, no escape hatch. GM landing here from an external link hits an unusable dead end.
- No breadcrumb, no fallback content, no error boundary message.

## Exact Fix
File: `src/landing/pages/AboutPage.jsx`

1. First, open the file and verify it is not returning `null` or early-returning on a mount condition. Ensure default export renders at least `<LandingNav /> <main>...</main> <LandingFooter />`.

2. Wrap page body in an error boundary at `src/landing/LandingShell.jsx` so a render error falls back to a visible "Something went wrong — [return home]" card instead of a blank page.

3. Re-run the screenshot pipeline with an explicit `await page.waitForSelector('.landing-nav')` before `page.screenshot()` in `scripts/screenshot-sections.mjs` to confirm whether this is a capture timing issue vs. a real render bug.

4. If AboutPage is intentionally unfinished, at minimum add a placeholder:
```jsx
export default function AboutPage() {
  return (<><LandingNav /><section style={{padding:'120px 24px', textAlign:'center'}}><h1>About Swoop</h1><p>Coming soon.</p><a href="#/landing">← Back home</a></section><LandingFooter /></>);
}
```
