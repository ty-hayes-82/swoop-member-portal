import { theme } from '@/config/theme';
import { SectionShell, Card } from '@/landing/ui';

const proveStats = [
  { value: '$32K', label: 'one save · one call' },
  { value: '9 / 14', label: 'members retained' },
  { value: '$67K', label: 'dues protected' },
];

function FixItPanel() {
  return (
    <div>
      <span
        style={{
          display: 'inline-block',
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: theme.colors.accent,
          marginBottom: 12,
        }}
      >
        Fix it
      </span>
      <h3
        style={{
          fontSize: 'clamp(24px, 2.5vw, 32px)',
          fontWeight: 700,
          color: theme.neutrals.ink,
          margin: '0 0 14px',
          letterSpacing: '-0.02em',
        }}
      >
        The right action. The right person. Before the problem compounds.
      </h3>
      <p style={{ color: theme.colors.textSecondary, fontSize: 16, lineHeight: 1.65, margin: '0 0 24px' }}>
        A health score isn't useful if nobody acts on it. Swoop drafts the specific intervention —
        the callback, the comp, the shift change — tied to a named member and a time window.
        One tap on your phone. The message sends. The member gets saved.
      </p>

      {/* Approved action card */}
      <div
        style={{
          background: '#0F0F0F',
          borderRadius: 16,
          padding: '20px 24px',
          fontFamily: theme.fonts.mono,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
          }}
        >
          <span
            style={{
              background: '#22c55e',
              color: '#FFFFFF',
              fontSize: 10,
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            ✓ APPROVED · 06:31
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Mark Henderson · 14-yr family</span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          {['rounds ↓42%', 'complaint aging 4d', 'spend ↓31%'].map(s => (
            <span
              key={s}
              style={{
                background: 'rgba(243,146,45,0.15)',
                color: theme.colors.accent,
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 6,
              }}
            >
              {s}
            </span>
          ))}
        </div>
        <p
          style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: 14,
            fontFamily: theme.fonts.sans,
            fontStyle: 'italic',
            lineHeight: 1.6,
            margin: '0 0 14px',
            borderLeft: `3px solid ${theme.colors.accent}`,
            paddingLeft: 14,
          }}
        >
          "Mark — it's been a rough month. I'd like to personally comp two guest passes for your
          son's group this Sunday. — GM"
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
          ✓ GM approved · $8,400 dues protected · 1 tap · 0 spreadsheets
        </p>
      </div>
    </div>
  );
}

function ProveItPanel() {
  return (
    <div>
      <span
        style={{
          display: 'inline-block',
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: theme.colors.accent,
          marginBottom: 12,
        }}
      >
        Prove it
      </span>
      <h3
        style={{
          fontSize: 'clamp(24px, 2.5vw, 32px)',
          fontWeight: 700,
          color: theme.neutrals.ink,
          margin: '0 0 14px',
          letterSpacing: '-0.02em',
        }}
      >
        Take a dollar number to the board. Not a feeling.
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {proveStats.map(s => (
          <div
            key={s.value}
            style={{
              background: theme.neutrals.paper,
              border: `1px solid rgba(17,17,17,0.08)`,
              borderRadius: 14,
              padding: '18px 14px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: 'clamp(24px, 3vw, 36px)',
                fontWeight: 800,
                fontFamily: theme.fonts.mono,
                color: theme.colors.accent,
                margin: '0 0 4px',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {s.value}
            </p>
            <p style={{ fontSize: 12, color: theme.colors.textMuted, margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Karen Wittman case */}
      <Card style={{ padding: 24, gap: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: theme.colors.accent, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
          Six weeks before non-renewal
        </p>
        <p style={{ fontSize: 17, fontWeight: 600, color: theme.neutrals.ink, margin: 0 }}>
          Karen Wittman, <em>nine years</em>.
        </p>
        <p style={{ fontSize: 14, color: theme.colors.textSecondary, lineHeight: 1.65, margin: 0 }}>
          CRM said <em>active</em>. POS: last tab 18 days ago. Tee sheet: no-show three Wednesdays.{' '}
          <strong style={{ color: theme.neutrals.ink }}>Not one system flagged her.</strong> Together they did.
          A comp dinner went out Tuesday. Karen renewed in November.
        </p>
      </Card>

      <p style={{ fontSize: 14, color: theme.colors.textSecondary, marginTop: 20, lineHeight: 1.65 }}>
        Every signal sourced. Every action approved. Every outcome attributed — and a board-ready
        deck you forward without rewriting.
      </p>
    </div>
  );
}

export default function SaveStorySection() {
  return (
    <SectionShell band="cream">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 'clamp(40px, 6vw, 80px)',
          alignItems: 'start',
        }}
        className="landing-split"
      >
        <FixItPanel />
        <ProveItPanel />
      </div>
    </SectionShell>
  );
}
