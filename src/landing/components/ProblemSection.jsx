import { theme } from '@/config/theme';
import { problemCards } from '@/landing/data';
import { SectionShell, Card, IconBadge, Stat } from '@/landing/ui';

const sourceIconMap = {
  'CRM + POS + Email': 'Radio',
  'Member CRM + Service Desk': 'Headphones',
  'Tee Sheet + Weather + POS': 'CloudRain',
};

export default function ProblemSection() {
  return (
    <SectionShell
      band="sand"
      title="Most clubs are flying blind."
      subtitle="Your tee sheet, CRM, and POS each hold a fragment. Nobody connects the dots until a member is already gone."
      align="center"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}
      >
        {problemCards.map((card) => (
          <Card key={card.title} interactive>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <IconBadge name={sourceIconMap[card.source] || 'Radio'} tone="orange" />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: theme.colors.accent,
                  background: 'rgba(243,146,45,0.1)',
                  padding: '6px 12px',
                  borderRadius: 999,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {card.confidence}
              </span>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 4px', color: theme.neutrals.ink }}>{card.title}</h3>
            <p style={{ fontSize: 15, lineHeight: 1.55, color: theme.colors.textSecondary, margin: 0 }}>
              {card.summary}
            </p>
            {card.highlights?.length > 0 && (
              <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: theme.neutrals.ink, fontSize: 14, lineHeight: 1.6 }}>
                {card.highlights.map((highlight) => (
                  <li key={highlight} style={{ marginBottom: 4 }}>{highlight}</li>
                ))}
              </ul>
            )}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 16,
                borderTop: '1px solid rgba(17,17,17,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.colors.textMuted, marginBottom: 4 }}>
                  Why this surfaced
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: theme.neutrals.ink, maxWidth: 180 }}>{card.why}</div>
              </div>
              {card.metric && <Stat value={card.metric.value} label={card.metric.label} />}
            </div>
          </Card>
        ))}
      </div>
    </SectionShell>
  );
}
