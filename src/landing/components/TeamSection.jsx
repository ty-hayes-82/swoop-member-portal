import { theme } from '@/config/theme';
import { SectionShell, Card } from '@/landing/ui';

const team = [
  {
    name: 'Tyler Hayes',
    title: 'Co-founder & CEO',
    bio: 'I ran member ops at a 300-member desert club before writing a line of code. I built Swoop because the GM tools I needed didn\'t exist.',
  },
  {
    name: 'Jordan Mitchell',
    title: 'Co-founder & CTO',
    bio: 'Eight years building predictive models in hospitality tech. I retrained the models on 12 months of club-specific behavioral data — that\'s the engine under the briefing.',
  },
  {
    name: 'Alex Chen',
    title: 'Head of Club Success',
    bio: 'Six years turning enterprise data into daily operational workflows. Now I do the same thing for GMs — your onboarding and your morning brief come from me personally.',
  },
];

export default function TeamSection() {
  return (
    <SectionShell
      band="paper"
      eyebrow="Who you'll work with"
      title="The humans in your clubhouse for six months."
      subtitle="Swoop is in closed pilot with founding-partner clubs. Every pilot is hands-on — we're in your systems, on your calls, and in your board deck."
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
          marginBottom: 48,
        }}
      >
        {team.map(member => (
          <Card key={member.name} interactive style={{ padding: 28, gap: 16 }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1A2E20 0%, #2d4a35 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid rgba(181, 149, 106, 0.3)',
                marginBottom: 16,
              }}
            >
              <span style={{ color: '#B5956A', fontSize: 28, fontWeight: 800, fontFamily: 'serif' }}>
                {member.name?.charAt(0) || 'S'}
              </span>
            </div>
            <div>
              <p style={{ fontSize: 17, fontWeight: 700, color: theme.neutrals.ink, margin: '0 0 2px' }}>
                {member.name}
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: theme.colors.accent, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {member.title}
              </p>
              <p style={{ fontSize: 14, color: theme.colors.textSecondary, lineHeight: 1.65, margin: 0 }}>
                {member.bio}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Moat */}
      <div
        style={{
          background: theme.neutrals.ink,
          borderRadius: 20,
          padding: 'clamp(24px, 4vw, 40px)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 32,
          alignItems: 'center',
        }}
        className="landing-split"
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: theme.colors.accent,
              margin: '0 0 10px',
            }}
          >
            Moat
          </p>
          <h3
            style={{
              fontSize: 'clamp(22px, 2.5vw, 30px)',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: '0 0 14px',
              letterSpacing: '-0.02em',
            }}
          >
            Why this is hard to copy.
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.65, margin: 0 }}>
            Proprietary cross-system intelligence from 12 months of pilot data.{' '}
            <strong style={{ color: '#FFFFFF' }}>Preferred Jonas Club integration partner.</strong>{' '}
            First MCP-native club platform with 46 production tools — no competitor has shipped
            agent-to-club-system orchestration at this depth.
          </p>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          {[
            { stat: '46', label: 'production tools in orchestration' },
            { stat: '12 mo', label: 'of pilot data + model training' },
            { stat: '#1', label: 'preferred Jonas Club integration partner' },
          ].map(s => (
            <div
              key={s.stat}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                padding: '14px 18px',
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  fontFamily: theme.fonts.mono,
                  color: theme.colors.accent,
                  lineHeight: 1,
                  minWidth: 60,
                }}
              >
                {s.stat}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
