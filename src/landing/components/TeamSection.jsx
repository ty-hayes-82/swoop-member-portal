import { theme } from '@/config/theme';
import { SectionShell, Card } from '@/landing/ui';

const team = [
  {
    name: 'Tyler Hayes',
    title: 'Co-founder & CEO',
    priorRole: 'Former Member Ops Director, private club operations (2019–2023)',
    linkedinUrl: 'https://linkedin.com/in/tylerhayes',
    bio: 'I ran member ops at a 300-member desert club before writing a line of code. I built Swoop because the GM tools I needed didn\'t exist.',
  },
  {
    name: 'Jordan Mitchell',
    title: 'Co-founder & CTO',
    priorRole: 'Former Senior ML Engineer, hospitality tech (2015–2023)',
    linkedinUrl: 'https://linkedin.com/in/jordanmitchell',
    bio: 'Eight years building predictive models in hospitality tech. I retrained the models on 12 months of club-specific behavioral data — that\'s the engine under the briefing.',
  },
  {
    name: 'Alex Chen',
    title: 'Head of Club Success',
    priorRole: 'Former Director of Operations Analytics, enterprise hospitality (2017–2023)',
    linkedinUrl: 'https://linkedin.com/in/alexchen',
    bio: 'Six years turning enterprise data into daily operational workflows. Now I do the same thing for GMs — your onboarding and your morning brief come from me personally.',
  },
];

export default function TeamSection() {
  return (
    <SectionShell
      band="paper"
      eyebrow="Who you'll work with"
      title="The humans in your clubhouse for six months."
      subtitle="6 founding clubs — for six months we sit in your systems, on your calls, and in your board deck."
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
          marginBottom: 48,
        }}
      >
        {(team ?? []).map(member => (
          <Card key={member.name} interactive style={{ padding: 28, gap: 16 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(181,149,106,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 700,
                color: '#B5956A',
                border: '2px solid rgba(181,149,106,0.3)',
                marginBottom: 16,
              }}
            >
              {member.name.charAt(0)}
            </div>
            <div>
              <p style={{ fontSize: 17, fontWeight: 700, color: theme.neutrals.ink, margin: '0 0 2px' }}>
                {member.name}
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: theme.colors.accent, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {member.title}
              </p>
              <div style={{ marginTop: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#888' }}>{member.priorRole}</span>
              </div>
              <p style={{ fontSize: 14, color: theme.colors.textSecondary, lineHeight: 1.65, margin: '0 0 8px' }}>
                {member.bio}
              </p>
              {member.linkedinUrl && (
                <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer"
                   style={{ fontSize: 13, color: '#F3922D', textDecoration: 'none', display: 'inline-block' }}>
                  LinkedIn →
                </a>
              )}
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
