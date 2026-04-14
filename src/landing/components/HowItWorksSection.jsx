import { theme } from '@/config/theme';
import { SectionShell } from '@/landing/ui';

const briefRows = [
  { label: 'James Whitfield', detail: 'complaint · rounds ↓42% · tee time 9:20am', value: '$8.4K', rank: 1 },
  { label: 'Grill Room staffing gap', detail: 'Sat lunch · 95 covers · 6 scheduled', value: '$3.2K', rank: 2 },
  { label: 'Revenue leak · F&B mix', detail: 'beverage ratio ↓ 3 weeks', value: '$22K', rank: 3 },
];

function MorningBriefCard() {
  return (
    <div
      style={{
        background: '#0F0F0F',
        borderRadius: 20,
        padding: 'clamp(20px, 3vw, 32px)',
        fontFamily: theme.fonts.mono,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 60px rgba(15,15,15,0.35)',
      }}
    >
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ff5f57','#febc2e','#28c840'].map(c => (
            <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 8 }}>swoop.os / brief</span>
      </div>

      {/* Alert badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(243,146,45,0.15)',
          border: '1px solid rgba(243,146,45,0.35)',
          borderRadius: 8,
          padding: '6px 12px',
          marginBottom: 16,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.colors.accent, display: 'inline-block', animation: 'landing-pulse 2s infinite' }} />
        <span style={{ color: theme.colors.accent, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          BRIEF · 06:14 · MEMBER PULSE
        </span>
      </div>

      {/* Member alert */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          At-risk member detected · <span style={{ color: theme.colors.accent }}>92% confidence</span>
        </p>
        <p style={{ color: '#FFFFFF', fontSize: 17, fontWeight: 700, margin: '0 0 4px', fontFamily: theme.fonts.sans }}>
          Mark Henderson · Silver · 14 yrs
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {['Rounds ↓42% in 6 wks', 'Complaint aging 4 days', 'POS spend ↓31%'].map(s => (
            <span key={s} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Recommended action */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 16,
        }}
      >
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Recommended action
        </p>
        <p style={{ color: '#FFFFFF', fontSize: 14, margin: 0, fontFamily: theme.fonts.sans, lineHeight: 1.5 }}>
          GM callback + 2-guest pass offer · send before Friday
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 14,
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>assembled from 4 systems · gm@yourclub.com</span>
        <span style={{ color: theme.colors.accent, fontSize: 13, fontWeight: 700, fontFamily: theme.fonts.sans }}>
          $8,400 protected
        </span>
      </div>
    </div>
  );
}

function OneBriefPanel() {
  return (
    <div>
      <p style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>
        This morning's brief · $42.2K across 6 actions
      </p>
      <div style={{ display: 'grid', gap: 10 }}>
        {briefRows.map(row => (
          <div
            key={row.rank}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 18px',
              background: '#FFFFFF',
              border: '1px solid rgba(17,17,17,0.08)',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(17,17,17,0.04)',
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: theme.colors.accent,
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {row.rank}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: theme.neutrals.ink }}>{row.label}</p>
              <p style={{ margin: 0, fontSize: 13, color: theme.colors.textMuted, lineHeight: 1.4 }}>{row.detail}</p>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: theme.colors.accent, fontFamily: theme.fonts.mono, flexShrink: 0 }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
      <p style={{ color: theme.colors.textMuted, fontSize: 13, marginTop: 14, textAlign: 'center' }}>
        assembled from 4 systems · delivered to gm@yourclub.com · 90-second read
      </p>
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    <SectionShell
      band="paper"
      eyebrow="How it works"
      title="One screen. Every signal. Before the first tee time."
      subtitle="Your tee sheet knows rounds. Your POS knows spend. Your CRM knows complaints. None of them know what James Whitfield's morning looks like. Swoop does — and it tells your GM before 6:15 AM."
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 'clamp(32px, 5vw, 64px)',
          alignItems: 'center',
        }}
        className="landing-split"
      >
        <MorningBriefCard />
        <OneBriefPanel />
      </div>
    </SectionShell>
  );
}
