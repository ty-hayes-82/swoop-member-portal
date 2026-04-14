import { theme } from '@/config/theme';
import { SectionShell, Card } from '@/landing/ui';

const team = [
  {
    initials: 'TH',
    name: 'Tyler Hayes',
    title: 'Founder & CEO',
    bio: 'Former club-tech operator. Ran member experience at a 300-member desert club. Ten years building SaaS for private clubs.',
  },
  {
    initials: 'JM',
    name: 'Jordan Mitchell',
    title: 'CTO',
    bio: 'Ex-Agilysys (hospitality tech, NASDAQ: AGYS). Eight years building behavioral prediction systems for clubs, resorts, and cruise lines.',
  },
  {
    initials: 'AC',
    name: 'Alex Chen',
    title: 'Head of Club Success',
    bio: 'Ex-Salesforce Industries. Six years turning operational data into daily workflows. Your onboarding lead for the pilot.',
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
          <Card key={member.initials} interactive style={{ padding: 28, gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.colors.accent}, #e07820)`,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                flexShrink: 0,
              }}
            >
              {member.initials}
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
