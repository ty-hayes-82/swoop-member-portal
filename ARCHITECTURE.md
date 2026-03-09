# Swoop Golf Five Lenses Platform — Architecture Reference

**Stack:** React 18 + Vite 5 · Recharts · Deployed via Vercel  
**Repo:** `github.com/ty-hayes-82/swoop-member-portal` · Branch: `dev`  
**Phase:** 1 (static demo data) — Phase 2 API endpoints are the next sprint

---

## 0. Hard Rules

| Rule | Limit |
|------|-------|
| File size — feature components | 200 lines target, **300 hard ceiling** |
| File size — ui primitives | 100 lines target, **150 hard ceiling** |
| File size — services | 80 lines target, **150 hard ceiling** |
| Colors | **Never** hardcoded. Always `theme.colors.*` from `config/theme.js` |
| Data access | Components never import from `data/` directly. Always through `services/` |
| New components | Define props contract in Section 7 of this document before building |

---

## 1. Data Flow (strictly enforced)

```
data/*.js  →  services/*.js  →  features/  →  components/
```

- `data/` files export raw arrays and objects. **Nothing else imports them.**
- `services/` are the **only** files that touch `data/`.
- `features/` import from `services/` and pass shaped data down as props.
- `components/ui/` and `components/charts/` receive props only.
- **Phase 2 swap:** Only `services/` files change. Everything above untouched.

---

## 2. Navigation (7 GM decision-based categories)

Daily Briefing · Operations · Revenue & F&B · Member Retention · Staffing & Service · Growth Pipeline · Demo Mode

---

## 3. Playbooks (4 active)

- Slow Saturday Recovery
- Service Save Protocol
- Engagement Decay Intervention
- Staffing Gap Prevention

---

## 4. Design System

| Token | Value |
|-------|-------|
| Background | `#F8F9FA` |
| Card | `#FFFFFF` |
| Sidebar | `#1A1A1A` (dark green) |
| Accent | `#F3922D` (Swoop orange) |
| Lens colors | `operations` · `fb` · `members` · `staffing` · `pipeline` · `briefing` |
| Fonts | Plus Jakarta Sans (body / hero) · JetBrains Mono (numbers) |

---

## 5. Demo Data Context

**Oakmont Hills Country Club, Scottsdale AZ, January 2026**

| Fact | Value |
|------|-------|
| Members | 300 |
| Courses | 2 (Championship 18H, Executive 9H) |
| Dining outlets | 5 |
| Staff | 45 |
| Simulated date | January 17, 2026 |
| Understaffed dates | Jan 9, 16, 28 (Grill Room) |
| Member resigned after complaint | mbr_203 (James Whitfield, Jan 22) |

---

## 6. Deployment

| Setting | Value |
|---------|-------|
| Platform | Vercel |
| Team | `tyhayesswoopgolfcos-projects` |
| Branch | `dev` (auto-deploys on push) |
| Git workflow | `git add -A` → `git commit -m "msg"` → `git push origin dev` |

---

## 7. Component Contracts

Define props contracts here before building any component. No exceptions.

---

### WaitlistRow *(Sprint A — ~80 lines)*

```js
{
  memberId: string,
  memberName: string,
  archetype: string,
  healthScore: number,
  riskLevel: 'Healthy' | 'Watch' | 'At Risk' | 'Critical',
  retentionPriority: 'HIGH' | 'NORMAL',
  requestedSlot: string,
  daysWaiting: number,
  lastRound: string,
  memberValueAnnual?: number,
  churnRiskScore?: number,
  onSelect?: (memberId: string) => void,
}
```

**Render:** single row for the retention-prioritized waitlist queue. No data access. All values passed as props.

---

### CancellationRiskRow *(Sprint A — ~80 lines)*

```js
{
  bookingId: string,
  memberId: string,
  memberName: string,
  archetype: string,
  teeTime: string,
  cancelProbability: number, // 0..1
  drivers: string[],
  recommendedAction: string,
  estimatedRevenueLost: number,
  onSelect?: (bookingId: string) => void,
}
```

**Render:** single row for cancellations-at-risk table, sorted by cancelProbability descending.

---

### IntegrationHealthStrip *(exists — ~50 lines)*

```js
{
  connected: number,
  total: number,
  combosActive: number,
  totalCombos: number,
  onClickConnected: () => void,
  onClickCombos: () => void,
}
```

---

### IntegrationCard *(exists — ~80 lines)*

```js
{
  id: string,
  name: string,
  category: string,
  icon: string,
  themeColor: string,
  status: 'connected' | 'available' | 'coming_soon',
  lastSync: string | null,
  partners: string[],
  description: string,
  isSelected: boolean,
  onSelect: () => void,
}
```

---

### ComboInsightCard *(exists — ~100 lines)*

```js
{
  id: string,
  systems: string[],
  label: string,
  insight: string,
  automations: string[],
  preview: { type: 'kpi' | 'sparkline', value: string, label: string, subtext: string, sparklineKey?: string, trend?: 'up' | 'down' },
  swoop_only: boolean,
  isExpanded: boolean,
  onToggle: () => void,
  allSystems: System[],
  sparklineData?: number[],
}
```

---

### IntegrationMap *(exists — ~120 lines)*

```js
{
  systems: System[],
  combos: Combo[],
  selectedIds: string[],
  onSelectSystem: (id: string) => void,
  width?: number,
  height?: number,
}
```

---

### TierBadge *(Sprint 2 — ~40 lines)*

```js
{
  tier: 1 | 2 | 3,
  // Tier 1 -> 'Priority'  (theme.colors.members — green)
  // Tier 2 -> 'Standard'  (theme.colors.operations — blue-ish)
  // Tier 3 -> 'Roadmap'   (theme.colors.textMuted — grey)
  size?: 'sm' | 'md',   // default: 'sm'
}
```

**Render:** Pill chip with label. Color comes from `theme.colors` — never hardcoded hex.  
`tier === 1` → `theme.colors.success` bg at 15% opacity, `theme.colors.success` text  
`tier === 2` → `theme.colors.info` bg at 15% opacity, `theme.colors.info` text  
`tier === 3` → `theme.colors.textMuted` bg at 15% opacity, `theme.colors.textMuted` text

---

### CategoryFilterBar *(Sprint 2 — ~70 lines)*

```js
{
  categories: Array<{
    id: string,
    label: string,
    icon: string,
    themeColor: string,
    count: number,
  }>,
  activeCategory: string | null,   // null = show all
  onSelect: (categoryId: string | null) => void,
}
```

**Render:** Horizontal scrollable pill row. First pill is always "All (28)".  
Active pill: filled background using `theme.colors[category.themeColor]` at 15% opacity, colored border.  
Inactive pill: `theme.colors.border` outline, `theme.colors.textMuted` text.  
Each pill: `icon + ' ' + label + ' ' + count` (e.g. "⛳ Tee Sheet 4").

---

### VendorCard *(Sprint 2 — ~90 lines)*

```js
{
  id: string,
  name: string,
  categoryId: string,
  categoryLabel: string,
  icon: string,
  themeColor: string,
  tier: 1 | 2 | 3,
  status: 'connected' | 'available' | 'coming_soon',
  lastSync: string | null,
  description: string,
  comboCount: number,
  isSelected: boolean,
  onSelect: () => void,
}
```

**Render:**  
- Header: icon + name + `<TierBadge tier={tier} />`  
- Status dot: green (connected) / amber (available) / grey (coming_soon)  
- If connected: shows `lastSync` string  
- If not connected: shows `goLive` estimate  
- Category tag: small pill with `categoryLabel`  
- Footer: "N combo insights" (only if comboCount > 0)  
- Selected state: `2px solid theme.colors[themeColor]` border  
- Hover: `theme.colors.bgCardHover` background

---

### VendorDetailPanel *(Sprint 2 — ~140 lines)*

```js
{
  vendor: {
    id: string,
    name: string,
    categoryLabel: string,
    icon: string,
    themeColor: string,
    tier: 1 | 2 | 3,
    status: string,
    lastSync: string | null,
    goLive: string,
    why: string,
    partners: string[],
  } | null,
  combos: Combo[],
  onClose: () => void,
}
```

**Render:** Fixed 300px right panel. CSS `transform: translateX(100%)` when `vendor === null`, `translateX(0)` when open.  
Sections (top to bottom):  
1. Header: icon + name + `<TierBadge />` + close button  
2. Status chip (connected / available / coming soon)  
3. "Why this integration" — `why` text in a `<SoWhatCallout>` or plain paragraph  
4. "Go live in" — `goLive` estimate  
5. "Works with" — `partners` list as comma-separated small badges  
6. "Combo insights" — mini list of combos (label + system badges), each clickable to expand

---

### Updated IntegrationMap *(Sprint 4 — replaces existing)*

```js
{
  categories: Category[],    // NEW — for arc segment rendering
  vendors: Vendor[],         // replaces systems[]
  combos: Combo[],
  selectedIds: string[],
  onSelectVendor: (id: string) => void,
  width?: number,            // default: 480
  height?: number,           // default: 360
}
```

**Changes from current version:**  
- Vendors within a category are clustered adjacent on the ring  
- Category arcs: thin 2px SVG arc between first+last node per group, `themeColor` at 20% opacity  
- Arc opacity animates to 60% on hover of any node in that category  
- All existing hover/click/edge behavior preserved


---

## §9 — Customer Language vs. Internal Architecture

### The Five Lenses Rule

**The Five Lenses are an internal strategic framework.** They're how Swoop's team thinks, sells to investors, and builds the product. They are NOT customer-facing language.

**Internal use (lenses ARE appropriate):**
- Pitch decks
- Sales training materials  
- Investor presentations
- Internal product documentation
- Engineering specs
- Strategic planning

**Customer-facing (lenses are HIDDEN):**
- GM Dashboard navigation
- Landing page copy
- Marketing website headlines
- In-app section labels
- Email communications
- Help documentation

### The Translation Table

| Internal Lens | What GMs Call It | Customer-Facing Label |
|---------------|------------------|----------------------|
| Operator's Lens | "What do I need to handle today?" | Daily Briefing |
| Economic Buyer Lens | "How are we performing? What's the number?" | Revenue & F&B |
| Member Retention Lens | "Who's about to leave and why?" | Member Health |
| Labor & Service Lens | "Are we staffed right? Are members happy?" | Staffing & Service |
| Growth Pipeline Lens | "Who's next? What's in the pipeline?" | Growth Pipeline |

### Positioning Principle

**The Five Lenses are how Swoop sees the club. The GM never has to know that.**

The lenses are a product architecture concept — they define what cross-domain questions each section can answer. But in the app and on the website, every label, headline, and navigation item should answer: **"What is the GM trying to do right now?"**

### Practical Rules

1. **Navigation labels** = GM actions/outcomes, never lens names
   - ✅ "Member Health" 
   - ❌ "Member Retention Lens"

2. **Section headlines** = questions a GM would ask out loud
   - ✅ "Who's at risk today?"
   - ❌ "Retention Intelligence Dashboard"

3. **Marketing copy** = outcomes and proof, not framework names
   - ✅ "Prevented 3 resignations this month"
   - ❌ "Member Health Lens detected churn signals"

4. **Feature descriptions** = what it does, not what it's called internally
   - ✅ "See which members need attention and why"
   - ❌ "The Member Retention Lens analyzes behavioral signals"

5. **Sales/demo materials** = lenses CAN live here because you're selling the platform holistically to a buyer who wants to understand the full architecture

### The Apple Analogy

Apple doesn't sell "the A18 chip architecture." They sell "the fastest iPhone ever."

The chip is real and it matters — it just lives in the engineering docs, not the billboard.

**The Five Lenses are your chip architecture.** Powerful. Essential. Internal.

### Enforcement

- Any PR that adds "lens" language to customer-facing copy = reject with reference to §9
- Marketing website can have /lenses/ URLs for SEO, but page headlines must be outcome-based
- Pricing copy: "Full platform access" not "All 5 Lenses"
- Landing page: Feature outcomes, not lens inventory


---

## §9 — Customer Language vs. Internal Architecture

### The Five Lenses Rule

**The Five Lenses are an internal strategic framework.** They're how Swoop's team thinks, sells to investors, and builds the product. They are NOT customer-facing language.

**Internal use (lenses ARE appropriate):**
- Pitch decks, sales training, investor presentations
- Internal product docs, engineering specs, strategic planning

**Customer-facing (lenses are HIDDEN):**
- GM Dashboard navigation, landing page, marketing website
- In-app labels, email comms, help docs

### The Translation Table

| Internal Lens | Customer-Facing Label |
|---------------|----------------------|
| Operator's Lens | Daily Briefing |
| Economic Buyer Lens | Revenue & F&B |
| Member Retention Lens | Member Health |
| Labor & Service Lens | Staffing & Service |
| Growth Pipeline Lens | Growth Pipeline |

### Positioning Principle

**The Five Lenses are how Swoop sees the club. The GM never has to know that.**

Navigation labels = GM actions/outcomes, never lens names. Headlines = questions GMs ask. Copy = outcomes and proof, not framework names.

### The Apple Analogy

Apple sells "the fastest iPhone ever," not "the A18 chip architecture." The Five Lenses are your chip architecture — powerful, essential, internal.

### Enforcement

- Any PR adding "lens" language to customer-facing copy = reject with §9 reference
- Marketing /lenses/ URLs OK for SEO, but headlines must be outcome-based
- Pricing: "Full platform access" not "All 5 Lenses"

