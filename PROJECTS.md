# Member Portal Improvements - Progress Tracker

**Started:** March 11, 2026  
**Repo:** /data/swoop-member-portal  
**Branch:** dev

---

## Priority 1: P2 Polish (2-3 hours)

- [ ] **GMC-06**: Split marketing content from operational view (Integrations page)
  - Make "Two-Layer Intelligence" diagram collapsible/expandable
  - Make comparison table collapsible for returning users
  - Add toggle: "Show marketing content" / "Hide marketing content"
  - Default: collapsed for logged-in users (assume demo mode for now)

- [ ] **GMC-07**: Reorder Integrations page sections
  - Current order: intro → comparison → diagram → cards
  - New order: diagram → What Swoop Adds → comparison → cards
  - Move most compelling content higher

---

## Priority 2: Medium Improvements (20-30 hours)

- [ ] **DES-P05**: Redesign data tables (Member Risk, other pages)
  - Add hover states to table rows
  - Implement zebra striping (alternating row colors)
  - Make health scores color-coded (red/yellow/green)
  - Add sortable headers with sort indicators
  - Improve mobile table behavior (stack or horizontal scroll)
  - Files: `src/features/member-health/` table components

- [ ] **DES-P06**: Add loading & empty states
  - Create skeleton screen components
  - Add shimmer animations during data fetch
  - Design empty state cards for "no data" scenarios
  - Implement optimistic UI for actions
  - Apply to: Daily Briefing, Member Health, Revenue Leakage, Board Report

- [ ] **DES-P07**: Alert card density optimization
  - Improve padding/spacing consistency
  - Highlight recommended actions more prominently
  - Better visual hierarchy within cards
  - Ensure action buttons stand out
  - Files: `src/features/daily-briefing/` alert components

---

## Priority 3: Long-Term Features (30-50 hours)

- [ ] **DES-P08**: Interactive data visualizations
  - Add charts for Board Report (Recharts or Chart.js)
  - Add sparklines for trend data across dashboard
  - Member Health: trend lines for health score changes
  - Revenue: monthly comparison charts

- [ ] **DES-P09**: Mobile optimization overhaul
  - Implement bottom navigation for mobile
  - Add swipe gestures where appropriate
  - Simplify tables for mobile (collapsible rows)
  - Optimize touch targets (min 44px)
  - Test on 375px, 390px, 428px viewports

- [ ] **DES-P10**: Micro-interactions system
  - Add page transitions (fade, slide)
  - Card hover animations
  - Button press animations
  - Loading state transitions
  - Use Framer Motion or CSS animations

- [ ] **DES-P11**: Dark mode theme (if time allows)
  - Create dark color palette
  - Add theme toggle component
  - Implement theme context
  - Update all components for dark mode support

---

## Completed Tasks

_None yet_

---

## Notes

- All work done on `dev` branch
- Test with `npm run dev` before committing
- Commit format: `git commit -m "feat([task-id]): [description]"`
- Reference docs in `/data/.openclaw/workspace/docs/`
