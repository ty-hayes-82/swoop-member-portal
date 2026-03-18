import { useState } from 'react';
import { theme } from '@/config/theme';

/* ───────── Flow Data ───────── */

const SECTIONS = [
  {
    id: 'retention',
    title: 'Member Retention & Risk',
    accent: theme.colors.members,
    flows: [
      {
        num: '01',
        persona: 'Sarah (GM)',
        desc: 'Detect & Act on Attrition Risk',
        steps: [
          { tag: 'REAL-TIME COCKPIT', tagColor: theme.colors.operations, icon: '\u{1F6A8}', title: 'Risk Alert', subtitle: 'Morning Briefing', desc: 'Sarah opens Swoop and sees 53 members flagged at-risk \u2014 $733K in annual dues need attention today.' },
          { tag: 'MEMBER RISK', tagColor: theme.colors.danger500, icon: '\u{1F4C9}', title: 'Risk Deep-Dive', subtitle: 'Archetype \xB7 Engagement', desc: 'She drills into the \u201CGhost\u201D segment: 24 members with zero visits in 90+ days. Revenue exposure is $198K/yr.' },
          { tag: 'OUTREACH PLAYBOOK', tagColor: theme.colors.info500, icon: '\u{1F4CB}', title: 'Select Playbook', subtitle: 'Ghost Archetype', desc: 'Swoop recommends the Ghost playbook: personal GM call, \u201CWe Miss You\u201D tee-time hold, and a guest pass offer.', gap: '#1' },
          { tag: 'AI AGENT', tagColor: theme.colors.accent, icon: '\u{1F916}', title: 'Auto-Draft Outreach', subtitle: 'Personalized Messages', desc: 'Swoop AI drafts 24 personalized emails referencing each member\u2019s last round, favorite holes, and dining history.', gap: '#2' },
          { tag: 'LIVE ACTION', tagColor: theme.colors.success500, icon: '\u2705', title: 'Execute & Track', subtitle: 'Outreach Sent', desc: 'Sarah approves and sends. Swoop tracks opens, tee-time bookings, and re-engagement within 14 days. 9 of 24 ghosts return.' },
        ],
      },
      {
        num: '02',
        persona: 'Lisa (Membership Director)',
        desc: 'Understand & Nurture New Members',
        steps: [
          { tag: 'EXPERIENCE INSIGHTS', tagColor: theme.colors.info500, icon: '\u{1F50D}', title: 'Engagement Scan', subtitle: 'New Member Cohort', desc: 'Lisa checks the New Member segment: 24 members joined in 6 months. 8 have golfed only once. 5 have never dined at the club.' },
          { tag: 'MEMBER RISK', tagColor: theme.colors.danger500, icon: '\u26A0\uFE0F', title: 'Early Warning', subtitle: '90-Day Drop-Off', desc: 'Swoop flags 6 new members trending toward \u201CGhost\u201D archetype \u2014 engagement fell sharply after month two. Classic early attrition.', gap: '#3' },
          { tag: 'MEMBER OUTREACH', tagColor: theme.colors.pipeline, icon: '\u{1F48C}', title: 'Nurture Playbook', subtitle: 'New Member Specific', desc: 'Activates the New Member playbook: buddy program match, spouse welcome experience, complimentary dining, and a GM dinner invite.' },
          { tag: 'AI AGENT', tagColor: theme.colors.accent, icon: '\u{1F4AC}', title: 'Personalized Nudges', subtitle: 'Multi-Channel Drip', desc: 'AI agent schedules a 30-day drip: welcome text from the pro, event invite email, and a \u201CHow\u2019s your first season?\u201D call from Lisa.', gap: '#4' },
          { tag: 'LIVE ACTION', tagColor: theme.colors.success500, icon: '\u{1F389}', title: 'Retention Wins', subtitle: 'Cohort Health', desc: 'After 60 days, 5 of 6 at-risk new members are multi-facility users. First-year retention projects at 91% \u2014 up from 74% last year.', gap: '#5' },
        ],
      },
    ],
  },
  {
    id: 'revenue',
    title: 'Revenue & F&B',
    accent: theme.colors.fb,
    flows: [
      {
        num: '03',
        persona: 'Mike (Head Golf Pro)',
        desc: 'Quantify Revenue Leakage & Retain',
        steps: [
          { tag: 'REVENUE LEAKAGE', tagColor: theme.colors.warning500, icon: '\u{1F4B0}', title: 'Leakage Dashboard', subtitle: 'Tee Sheet \xB7 F&B \xB7 Events', desc: 'Mike sees $42K/mo in empty prime tee times. Die-Hard Golfers are booking less \u2014 down 18% this quarter.' },
          { tag: 'TEE SHEET DEMAND', tagColor: theme.colors.operations, icon: '\u{1F4CA}', title: 'Demand Heatmap', subtitle: 'Peak vs. Off-Peak', desc: 'Tee sheet analysis shows Saturday 7\u20139 AM at 94% booked, but weekday afternoons sit at 31%. Die-Hards could fill the gap.', gap: '#6' },
          { tag: 'OUTREACH PLAYBOOK', tagColor: theme.colors.info500, icon: '\u{1F3AF}', title: 'Targeted Action', subtitle: 'Die-Hard Golfer Plays', desc: 'Playbook suggests: complimentary lesson, paired round with a compatible handicap partner, and a \u201Cbest conditions\u201D text alert.' },
          { tag: 'AI AGENT', tagColor: theme.colors.accent, icon: '\u26A1', title: 'Smart Scheduling', subtitle: 'Proactive Tee Holds', desc: 'AI agent reserves preferred weekday slots for 12 Die-Hards and sends \u201CConditions look perfect Wednesday\u201D texts.', gap: '#7' },
          { tag: 'BOARD REPORT', tagColor: theme.colors.info700, icon: '\u{1F4C8}', title: 'Prove the Impact', subtitle: 'Revenue Recovered', desc: 'Board report shows $28K in recovered tee-time revenue and 22% increase in weekday utilization. Data-backed proof for the board.' },
        ],
      },
      {
        num: '04',
        persona: 'Chef Marco (F&B Director)',
        desc: 'Convert Golfers into Diners',
        steps: [
          { tag: 'REVENUE LEAKAGE', tagColor: theme.colors.warning500, icon: '\u{1F37D}\uFE0F', title: 'Dining Gap Alert', subtitle: '$0 F&B from Golfers', desc: 'Swoop flags 98 Die-Hards and Weekend Warriors who play 4+ times/month but spend $0 in dining. They leave within 22 minutes of their round.' },
          { tag: 'EXPERIENCE INSIGHTS', tagColor: theme.colors.info500, icon: '\u{1F50E}', title: 'Behavioral Pattern', subtitle: 'Post-Round Timing', desc: 'Data shows these members finish rounds at peak lunch hours but bypass the clubhouse. The bridge from course to kitchen doesn\u2019t exist yet.', gap: '#8' },
          { tag: 'OUTREACH PLAYBOOK', tagColor: theme.colors.info500, icon: '\u{1F468}\u200D\u{1F373}', title: 'Dining Recovery', subtitle: 'Chef\u2019s Table \xB7 Locker Surprise', desc: 'Playbook triggers a 3-touch sequence: Chef\u2019s Table invite on Day 1, family dining on Day 3, and a wine bottle in the locker after next round.' },
          { tag: 'AI AGENT', tagColor: theme.colors.accent, icon: '\u{1F4E8}', title: 'Personalized Invites', subtitle: 'Member-Specific Menus', desc: 'AI drafts invitations referencing each member\u2019s round schedule: \u201CTom \u2014 you\u2019ve been on the course all month. Let us treat you to Thursday\u2019s Chef\u2019s Table.\u201D' },
          { tag: 'LIVE ACTION', tagColor: theme.colors.success500, icon: '\u{1F4B5}', title: 'F&B Revenue Lift', subtitle: '$0 \u2192 $94/mo Avg', desc: '12 of 18 targeted members begin dining within 2 weeks. Post-round dining conversion jumps from 11% to 38%. $14K/mo in new F&B revenue.', gap: '#9' },
        ],
      },
    ],
  },
  {
    id: 'service',
    title: 'Service & Operations',
    accent: theme.colors.staffing,
    flows: [
      {
        num: '05',
        persona: 'Sarah (GM)',
        desc: 'Service Failure Crisis Response',
        steps: [
          { tag: 'MEMBER RISK', tagColor: theme.colors.danger500, icon: '\u{1F6A9}', title: 'Complaint Detected', subtitle: 'High-Value Member', desc: 'James Whitfield \u2014 6-year member, $18K/yr dues \u2014 files a complaint about slow lunch service. Sentiment is negative. Swoop auto-escalates.' },
          { tag: 'OUTREACH PLAYBOOK', tagColor: theme.colors.info500, icon: '\u{1F4CB}', title: 'Service Save Protocol', subtitle: 'Auto-Triggered', desc: 'Within 1 hour: complaint routes to F&B Director with full member profile. Within 2 hours: GM gets a personal alert with context and call recommendation.', gap: '#10' },
          { tag: 'MEMBER OUTREACH', tagColor: theme.colors.pipeline, icon: '\u{1F4DE}', title: 'GM Personal Call', subtitle: 'Same-Day Recovery', desc: 'Sarah calls James with full context: member since 2019, $18K/yr, complaint unresolved 4 days. She apologizes, offers a complimentary dinner for his family.' },
          { tag: 'AI AGENT', tagColor: theme.colors.accent, icon: '\u{1F4DD}', title: 'Follow-Up Sequence', subtitle: 'Automated Check-Ins', desc: 'AI schedules a follow-up survey at Day 7 and a \u201CHow was your dinner?\u201D note at Day 14. Tracks sentiment recovery over 30 days.' },
          { tag: 'BOARD REPORT', tagColor: theme.colors.info700, icon: '\u{1F6E1}\uFE0F', title: 'Save Documented', subtitle: '$216K/yr Protected', desc: 'One saved resignation protects $18K\u2013$22K in dues plus $3K\u2013$5K ancillary. Board report logs the save with full timeline and ROI.' },
        ],
      },
      {
        num: '06',
        persona: 'Dan (Operations Manager)',
        desc: 'Staffing Gap Before Peak Weekend',
        steps: [
          { tag: 'OPERATIONS', tagColor: theme.colors.operations, icon: '\u{1F6A8}', title: 'Coverage Alert', subtitle: 'Saturday Understaffed', desc: 'Two servers call out Friday afternoon. Saturday has a tournament plus a private event. Swoop detects coverage has dropped below the service threshold.' },
          { tag: 'TEE SHEET DEMAND', tagColor: theme.colors.operations, icon: '\u{1F4CA}', title: 'Demand Forecast', subtitle: '142 Rounds + 60 Event', desc: 'Tee sheet shows 142 rounds booked plus a 60-person event. Current staffing can handle 120 covers. Gap: 80+ members risk poor experience.', gap: '#11' },
          { tag: 'OUTREACH PLAYBOOK', tagColor: theme.colors.info500, icon: '\u{1F527}', title: 'Staffing Protocol', subtitle: 'Auto-Triggered', desc: 'Staffing Gap Protocol fires: cross-training recalls sent to 4 eligible staff, pacing adjusted on tee sheet (12-min \u2192 14-min), beverage cart doubled.' },
          { tag: 'AI AGENT', tagColor: theme.colors.accent, icon: '\u{1F4CB}', title: 'Service Pacing', subtitle: 'Dynamic Adjustments', desc: 'AI adjusts kitchen prep timeline, extends turn times by 10 minutes, and pre-stages grab-and-go options at the turn. Quality maintained with fewer hands.' },
          { tag: 'LIVE ACTION', tagColor: theme.colors.success500, icon: '\u2705', title: 'Crisis Averted', subtitle: 'Zero Complaints Filed', desc: 'Saturday runs smoothly. Post-event survey scores 4.6/5. Zero service complaints despite being 2 servers short. Dan avoided a $24K service failure event.' },
        ],
      },
    ],
  },
  {
    id: 'growth',
    title: 'Growth & Strategy',
    accent: theme.colors.pipeline,
    flows: [
      {
        num: '07',
        persona: 'Rachel (Events Manager)',
        desc: 'Fill Events with Social Butterflies',
        steps: [
          { tag: 'EXPERIENCE INSIGHTS', tagColor: theme.colors.info500, icon: '\u{1F4C5}', title: 'Low Registration', subtitle: 'Wine Dinner at 42%', desc: 'The Spring Wine Dinner is 10 days out and only at 42% capacity. Revenue target at risk. Rachel needs to fill 35 seats fast.' },
          { tag: 'MEMBER RISK', tagColor: theme.colors.danger500, icon: '\u{1F3AF}', title: 'Identify Amplifiers', subtitle: 'Social Butterfly Archetype', desc: 'Swoop identifies 44 Social Butterflies \u2014 members who thrive on events, bring guests, and drive organic word-of-mouth. They\u2019re the event-fill engine.' },
          { tag: 'OUTREACH PLAYBOOK', tagColor: theme.colors.info500, icon: '\u{1F37E}', title: 'Butterfly Amplifier', subtitle: 'VIP Early Access', desc: 'Playbook activates: exclusive early access for Butterflies, \u201CBring 2 guests free\u201D incentive, and a personal invite from Rachel highlighting the chef lineup.', gap: '#12' },
          { tag: 'AI AGENT', tagColor: theme.colors.accent, icon: '\u{1F4E3}', title: 'Targeted Blitz', subtitle: '44 Personalized Invites', desc: 'AI crafts 44 invitations tailored to each Butterfly\u2019s event history: \u201CYou loved the Harvest Dinner \u2014 this Spring Wine Dinner features the same sommelier.\u201D' },
          { tag: 'LIVE ACTION', tagColor: theme.colors.success500, icon: '\u{1F389}', title: 'Event Sold Out', subtitle: '42% \u2192 100% in 6 Days', desc: '22 Butterflies register within 48 hours, bringing 18 guests. Event sells out 4 days early. $9K in incremental event revenue.' },
        ],
      },
      {
        num: '08',
        persona: 'Sarah (GM)',
        desc: 'Board Meeting Prep \u2014 Prove ROI',
        steps: [
          { tag: 'REAL-TIME COCKPIT', tagColor: theme.colors.operations, icon: '\u{1F4CA}', title: 'Monthly Snapshot', subtitle: 'January 2026 Health', desc: 'Board meeting is Friday. Sarah opens the cockpit: 300 members, 53 at-risk, $733K exposed. She needs a data story, not a spreadsheet.' },
          { tag: 'MEMBER RISK', tagColor: theme.colors.danger500, icon: '\u{1F4C9}', title: 'Risk Trends', subtitle: 'Quarter-over-Quarter', desc: 'Risk module shows attrition risk dropped 12% from Q3 after playbook adoption. Ghost segment shrank from 31 to 24. She screenshots the trend chart.' },
          { tag: 'REVENUE LEAKAGE', tagColor: theme.colors.warning500, icon: '\u{1F4B0}', title: 'Revenue Proof', subtitle: 'Recovered vs. Leaking', desc: 'Revenue Leakage dashboard shows $68K recovered this quarter through outreach playbooks. Dining recovery alone added $14K/mo. Hard numbers the board wants.', gap: '#13' },
          { tag: 'BOARD REPORT', tagColor: theme.colors.info700, icon: '\u{1F4D1}', title: 'Auto-Generate Report', subtitle: 'One-Click Export', desc: 'Swoop auto-generates a board-ready PDF: member health score, archetype breakdown, revenue impact, playbook ROI, and YoY retention delta. Zero manual work.', gap: '#14' },
          { tag: 'LIVE ACTION', tagColor: theme.colors.success500, icon: '\u{1F3E2}', title: 'Board Confidence', subtitle: 'Data-Backed Strategy', desc: 'Sarah presents with confidence. Board sees retention up 8%, $68K recovered, and clear before/after metrics. First standing ovation in 3 years.' },
        ],
      },
    ],
  },
];

const OPPORTUNITIES = [
  { num: '#1', text: 'AI-recommended playbook per archetype with one-click activation', ref: 'Sarah 01' },
  { num: '#2', text: 'Auto-drafted personalized outreach using member behavioral data', ref: 'Sarah 01' },
  { num: '#3', text: 'Early attrition detection for new members within first 90 days', ref: 'Lisa 02' },
  { num: '#4', text: 'Multi-channel drip campaigns orchestrated by AI agents', ref: 'Lisa 02' },
  { num: '#5', text: 'Cohort-level retention tracking with before/after proof', ref: 'Lisa 02' },
  { num: '#6', text: 'Tee sheet demand intelligence linked to member archetypes', ref: 'Mike 03' },
  { num: '#7', text: 'Proactive smart scheduling with AI-driven tee-time holds', ref: 'Mike 03' },
  { num: '#8', text: 'Post-round behavioral analysis to identify F&B conversion gaps', ref: 'Marco 04' },
  { num: '#9', text: 'Cross-facility revenue lift tracking (golf \u2192 dining pipeline)', ref: 'Marco 04' },
  { num: '#10', text: 'Real-time complaint escalation with value-weighted prioritization', ref: 'Sarah 05' },
  { num: '#11', text: 'Demand-aware staffing gap detection with auto-pacing adjustments', ref: 'Dan 06' },
  { num: '#12', text: 'Archetype-targeted event fill campaigns with guest multiplier', ref: 'Rachel 07' },
  { num: '#13', text: 'Automated revenue recovery attribution across playbooks', ref: 'Sarah 08' },
  { num: '#14', text: 'One-click board report generation with YoY retention delta', ref: 'Sarah 08' },
];

const LEGEND = [
  { color: theme.colors.operations, label: 'Real-Time Cockpit / Live' },
  { color: theme.colors.danger500, label: 'Member Risk' },
  { color: theme.colors.info500, label: 'Playbook / Board' },
  { color: theme.colors.accent, label: 'AI Agent' },
  { color: theme.colors.pipeline, label: 'Outreach' },
  { color: theme.colors.staffing, label: 'Operations' },
  { color: theme.colors.success500, label: 'Opportunity' },
];

const FILTERS = [
  { key: 'all', label: 'All Flows' },
  { key: 'retention', label: 'Retention & Risk' },
  { key: 'revenue', label: 'Revenue & F&B' },
  { key: 'service', label: 'Service & Ops' },
  { key: 'growth', label: 'Growth & Strategy' },
];

/* ───────── Styles ───────── */

const s = {
  page: { maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' },
  title: { fontFamily: theme.fonts.serif, fontSize: theme.fontSize.xl, color: theme.colors.textPrimary, fontWeight: 700, margin: 0 },
  subtitle: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, marginTop: 4 },
  badgeRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  badge: { fontSize: 12, fontFamily: theme.fonts.mono, fontWeight: 500, padding: '4px 12px', borderRadius: 20, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, color: theme.colors.textSecondary },
  filters: { display: 'flex', gap: 2, marginBottom: 32, background: theme.colors.bgCard, borderRadius: 10, padding: 3, width: 'fit-content', border: `1px solid ${theme.colors.border}` },
  filterTab: (active) => ({ fontSize: 14, padding: '8px 16px', borderRadius: 8, color: active ? theme.colors.accent : theme.colors.textMuted, background: active ? `${theme.colors.accent}14` : 'none', fontWeight: active ? 600 : 400, cursor: 'pointer', border: 'none', fontFamily: theme.fonts.sans, transition: 'all 0.15s' }),
  section: { marginBottom: 48 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  sectionBar: (color) => ({ width: 4, height: 24, borderRadius: 2, background: color }),
  sectionTitle: { fontFamily: theme.fonts.serif, fontSize: theme.fontSize.lg, color: theme.colors.textPrimary, fontWeight: 600, margin: 0 },
  sectionCount: { fontSize: 12, fontFamily: theme.fonts.mono, color: theme.colors.textMuted, padding: '2px 8px', borderRadius: 20, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}` },
  flow: { background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: 16, padding: 24, marginBottom: 16, transition: 'box-shadow 0.15s' },
  flowHeader: { display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  flowNum: { fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xl, fontWeight: 700, color: theme.colors.textMuted, opacity: 0.35, lineHeight: 1 },
  flowPersona: { fontFamily: theme.fonts.serif, fontSize: theme.fontSize.lg, color: theme.colors.textPrimary, fontWeight: 600 },
  flowDesc: { fontSize: theme.fontSize.md, color: theme.colors.textMuted },
  stepsRow: { display: 'flex', alignItems: 'stretch', gap: 0, overflowX: 'auto', paddingBottom: 8 },
  arrow: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: theme.colors.border, flexShrink: 0, padding: '0 4px', alignSelf: 'center' },
  step: { flex: 1, minWidth: 180, maxWidth: 240, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', transition: 'border-color 0.15s, box-shadow 0.15s' },
  stepTag: (color) => ({ fontSize: 9, fontFamily: theme.fonts.mono, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, padding: '3px 8px', borderRadius: 4, width: 'fit-content', background: `${color}18`, color }),
  stepIcon: (color) => ({ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, background: `${color}12` }),
  stepTitle: { fontFamily: theme.fonts.serif, fontSize: theme.fontSize.md, color: theme.colors.textPrimary, fontWeight: 600, lineHeight: 1.2 },
  stepSubtitle: { fontSize: 12, color: theme.colors.textMuted, fontFamily: theme.fonts.mono },
  stepDesc: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.5, flex: 1 },
  gap: { position: 'absolute', top: 8, right: 8, fontSize: 10, fontFamily: theme.fonts.mono, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: `${theme.colors.accent}18`, color: theme.colors.accent, border: `1px solid ${theme.colors.accent}30` },
  legend: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16, padding: '14px 20px', background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: 10, marginBottom: 20 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: theme.colors.textMuted },
  legendDot: (color) => ({ width: 10, height: 10, borderRadius: 3, background: color }),
  legendBrand: { marginLeft: 'auto', fontSize: 12, color: theme.colors.textMuted, fontFamily: theme.fonts.mono },
  opps: { background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: 16, padding: 24 },
  oppsTitle: { fontFamily: theme.fonts.mono, fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.accent, letterSpacing: 1, marginBottom: 16 },
  oppsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 8 },
  oppsItem: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 16px', borderRadius: 8, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, transition: 'border-color 0.15s' },
  oppsNum: { fontFamily: theme.fonts.mono, fontSize: 12, fontWeight: 700, color: theme.colors.accent, background: `${theme.colors.accent}14`, padding: '2px 6px', borderRadius: 4, flexShrink: 0, minWidth: 28, textAlign: 'center' },
  oppsText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, flex: 1, lineHeight: 1.4 },
  oppsRef: { fontSize: 12, fontFamily: theme.fonts.mono, color: theme.colors.textMuted, whiteSpace: 'nowrap', flexShrink: 0 },
};

/* ───────── Components ───────── */

function StepCard({ step }) {
  return (
    <div style={s.step}>
      <div style={s.stepTag(step.tagColor)}>{step.tag}</div>
      <div style={s.stepIcon(step.tagColor)}>{step.icon}</div>
      <div style={s.stepTitle}>{step.title}</div>
      <div style={s.stepSubtitle}>{step.subtitle}</div>
      <div style={s.stepDesc}>{step.desc}</div>
      {step.gap && <div style={s.gap}>{step.gap}</div>}
    </div>
  );
}

function FlowRow({ flow }) {
  return (
    <div style={s.flow}>
      <div style={s.flowHeader}>
        <span style={s.flowNum}>{flow.num}</span>
        <span style={s.flowPersona}>{flow.persona}</span>
        <span style={s.flowDesc}> \u2014 {flow.desc}</span>
      </div>
      <div style={s.stepsRow}>
        {flow.steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'stretch' }}>
            <StepCard step={step} />
            {i < flow.steps.length - 1 && <div style={s.arrow}>\u203A</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionGroup({ section }) {
  return (
    <div style={s.section}>
      <div style={s.sectionHeader}>
        <div style={s.sectionBar(section.accent)} />
        <h3 style={s.sectionTitle}>{section.title}</h3>
        <span style={s.sectionCount}>{section.flows.length} flows</span>
      </div>
      {section.flows.map((flow) => (
        <FlowRow key={flow.num} flow={flow} />
      ))}
    </div>
  );
}

/* ───────── Main ───────── */

export default function StoryboardFlows() {
  const [activeFilter, setActiveFilter] = useState('all');
  const filtered = activeFilter === 'all' ? SECTIONS : SECTIONS.filter((sec) => sec.id === activeFilter);
  const totalFlows = SECTIONS.reduce((sum, sec) => sum + sec.flows.length, 0);
  const personas = new Set(SECTIONS.flatMap((sec) => sec.flows.map((f) => f.persona.split(' (')[0])));

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Member Intelligence Storyboard Flows</h2>
          <p style={s.subtitle}>Persona-driven journeys from signal to action to proof</p>
        </div>
        <div style={s.badgeRow}>
          <span style={s.badge}>{personas.size} Personas</span>
          <span style={s.badge}>{totalFlows} Flows</span>
          <span style={s.badge}>{OPPORTUNITIES.length} Opportunities</span>
        </div>
      </div>

      <div style={s.filters}>
        {FILTERS.map((f) => (
          <button key={f.key} style={s.filterTab(activeFilter === f.key)} onClick={() => setActiveFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.map((section) => (
        <SectionGroup key={section.id} section={section} />
      ))}

      <div style={s.legend}>
        {LEGEND.map((l) => (
          <div key={l.label} style={s.legendItem}>
            <span style={s.legendDot(l.color)} />
            <span>{l.label}</span>
          </div>
        ))}
        <div style={s.legendBrand}>Swoop Golf \xB7 Member Intelligence Storyboard Flows</div>
      </div>

      <div style={s.opps}>
        <div style={s.oppsTitle}>\u26A1 OPPORTUNITIES SUMMARY</div>
        <div style={s.oppsGrid}>
          {OPPORTUNITIES.map((o) => (
            <div key={o.num} style={s.oppsItem}>
              <span style={s.oppsNum}>{o.num}</span>
              <span style={s.oppsText}>{o.text}</span>
              <span style={s.oppsRef}>{o.ref}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
