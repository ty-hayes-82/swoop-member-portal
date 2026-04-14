import { theme } from '@/config/theme';
import { SectionShell, Card } from '@/landing/ui';

const agentRows = [
  { label: 'Member Pulse',         detail: 'Callback queued · Mark Henderson',      value: '$9.4K',  positive: true },
  { label: 'Service Recovery',     detail: 'Mid-comp drafted · Golf Room',           value: '$11K',   positive: true },
  { label: 'Demand Optimizer',     detail: 'Full-fare slots routed to 5 members',    value: '-$1.5K', positive: false },
  { label: 'Labor Optimizer',      detail: '2 FOH shifts added · Grill lunch',       value: '$3.2K',  positive: true },
  { label: 'Engagement Autopilot', detail: '18 member outreach sequences',           value: '$42.4K', positive: true },
  { label: 'Revenue Analyst',      detail: 'Board revenue report ready',             value: '$12K',   positive: true },
];

function MorningBriefingPanel() {
  return (
    <div
      style={{
        background: '#0D1A0E',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 24px 56px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div
        style={{
          background: '#0a1309',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.colors.brass || '#B5956A' }}>
          BRIEF · 06:14 · DELIVERED
        </span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>tonight's brief</span>
      </div>
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ fontFamily: theme.fonts.mono, fontSize: 42, fontWeight: 800, color: '#FFFFFF', lineHeight: 1, letterSpacing: '-0.02em' }}>
          $42.2K
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
          protected across 8 actions · delivered 06:14
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 0' }}>
        {agentRows.map((row) => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 20px', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{row.label}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginLeft: 8 }}>{row.detail}</span>
            </div>
            <span style={{ fontSize: 12, fontFamily: theme.fonts.mono, fontWeight: 700, color: row.positive ? theme.colors.brass || '#B5956A' : 'rgba(255,255,255,0.45)', flexShrink: 0 }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)' }}>sent to gm@pinetree.com — ready before the first tee time</span>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: theme.colors.brass || '#B5956A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#0D1A0E' }}>
          S
        </div>
      </div>
    </div>
  );
}

function ActionCard() {
  return (
    <div style={{ background: '#0F0F0F', borderRadius: 16, padding: '20px 24px', fontFamily: theme.fonts.mono }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ background: '#22c55e', color: '#FFFFFF', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          ✓ APPROVED · 06:31
        </span>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Mark Henderson · 14-yr family</span>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {['rounds ↓42%', 'complaint aging 4d', 'spend ↓31%'].map(s => (
          <span key={s} style={{ background: 'rgba(243,146,45,0.15)', color: theme.colors.accent, fontSize: 12, padding: '3px 10px', borderRadius: 6 }}>{s}</span>
        ))}
      </div>
      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontFamily: theme.fonts.sans, fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 14px', borderLeft: `3px solid ${theme.colors.accent}`, paddingLeft: 14 }}>
        "Mark — it's been a rough month. I'd like to personally comp two guest passes for your son's group this Sunday. — GM"
      </p>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
        ✓ GM approved · $8,400 dues protected · 1 tap · 0 spreadsheets
      </p>
    </div>
  );
}

function ProveStats() {
  const stats = [
    { value: '$32K', label: 'one save · one call' },
    { value: '9 / 14', label: 'members retained' },
    { value: '$67K', label: 'dues protected' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {stats.map(s => (
          <div key={s.value} style={{ background: theme.neutrals.paper, border: '1px solid rgba(17,17,17,0.08)', borderRadius: 14, padding: '18px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 'clamp(22px, 2.5vw, 32px)', fontWeight: 800, fontFamily: theme.fonts.mono, color: theme.colors.accent, margin: '0 0 4px', lineHeight: 1, letterSpacing: '-0.02em' }}>{s.value}</p>
            <p style={{ fontSize: 11, color: theme.colors.textMuted, margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>
      <Card style={{ padding: 24, gap: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: theme.colors.accent, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Six weeks before non-renewal</p>
        <p style={{ fontSize: 16, fontWeight: 600, color: theme.neutrals.ink, margin: 0 }}>Karen Wittman, <em>nine years</em>.</p>
        <p style={{ fontSize: 14, color: theme.colors.textSecondary, lineHeight: 1.65, margin: 0 }}>
          CRM said <em>active</em>. POS: last tab 18 days ago. Tee sheet: no-show three Wednesdays.{' '}
          <strong style={{ color: theme.neutrals.ink }}>Not one system flagged her.</strong> Together they did. A comp dinner went out Tuesday. Karen renewed in November.
        </p>
      </Card>
    </div>
  );
}

const blocks = [
  {
    eyebrow: 'SEE IT',
    headline: 'One screen. Every signal. Before the first tee time.',
    copy: 'Your tee sheet knows rounds. Your POS knows spend. Your CRM knows complaints. None of them know that James Whitfield has an unresolved complaint, a tee time in 90 minutes, and his dining visits dropped 40% this month. Swoop connects them into a single morning briefing that shows you exactly who needs attention and why.',
    visual: <MorningBriefingPanel />,
  },
  {
    eyebrow: 'FIX IT',
    headline: 'The right action. The right person. Before the problem compounds.',
    copy: "A health score isn't useful if nobody acts on it. Swoop recommends specific interventions tied to specific members, assigns them to the right staff member, and tracks whether they were completed. One phone call from the GM. $32K in dues protected. That's not a dashboard. That's an operating system.",
    visual: <ActionCard />,
  },
  {
    eyebrow: 'PROVE IT',
    headline: 'Take a dollar number to the board. Not a feeling.',
    copy: 'Every intervention is tracked. Every outcome is measured. Swoop generates a board-ready report that shows exactly how many members were protected, how much revenue was recovered, and what the retention rate looks like. One click. No spreadsheet assembly required.',
    visual: <ProveStats />,
  },
];

export default function SeeItFixItProveItSection() {
  return (
    <div style={{ background: theme.neutrals.paper }}>
      {blocks.map((block, idx) => {
        const isEven = idx % 2 === 0;
        return (
          <div
            key={block.eyebrow}
            style={{
              borderBottom: idx < blocks.length - 1 ? '1px solid rgba(17,17,17,0.06)' : 'none',
              padding: 'clamp(56px, 7vw, 96px) clamp(20px, 4vw, 40px)',
              maxWidth: 1200,
              margin: '0 auto',
            }}
          >
            <div
              className="landing-split"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: 'clamp(40px, 6vw, 80px)',
                alignItems: 'center',
                direction: isEven ? 'ltr' : 'rtl',
              }}
            >
              {/* Copy */}
              <div style={{ direction: 'ltr' }}>
                <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: theme.colors.accent, marginBottom: 12 }}>
                  {block.eyebrow}
                </span>
                <h2
                  style={{
                    fontFamily: theme.fonts.serif,
                    fontSize: 'clamp(26px, 2.8vw, 38px)',
                    fontWeight: 800,
                    color: theme.neutrals.ink,
                    margin: '0 0 16px',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                  }}
                >
                  {block.headline}
                </h2>
                <p style={{ color: theme.colors.textSecondary, fontSize: 16, lineHeight: 1.7, margin: 0 }}>
                  {block.copy}
                </p>
              </div>
              {/* Visual */}
              <div style={{ direction: 'ltr' }}>
                {block.visual}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
