import { theme } from '@/config/theme';

const layers = [
  {
    label: 'Layer 1 — Swoop Member App',
    color: theme.colors.accent,
    description: 'Real-time behavioral data your existing systems cannot capture.',
    signals: ['GPS on-course tracking', 'In-app ordering and requests', 'Push notification engagement', 'Social activity and preferences'],
    tagline: 'The Swoop app captures what happens between transactions.',
  },
  {
    label: 'Layer 2 — Club System Integrations',
    color: theme.colors.success,
    description: '28 integrations with your existing tee sheet, POS, CRM, and scheduling systems.',
    signals: ['Tee times and rounds played', 'F&B spend and dining frequency', 'Dues payments and member status', 'Staff schedules and event calendars'],
    tagline: 'Your existing systems tell us what happened. The app tells us what is happening now.',
  },
];

export default function TwoLayerDiagram({ variant = 'full' }) {
  const isCompact = variant === 'compact';

  return (
    <div style={{
      background: theme.colors.bgCard,
      border: '1px solid ' + theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.lg,
    }}>
      {!isCompact && (
        <div style={{ marginBottom: theme.spacing.md }}>
          <div style={{ fontSize: '11px', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            Why Swoop sees what others miss
          </div>
          <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary, marginTop: '4px' }}>
            Two layers of intelligence. One view.
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        {layers.map((layer, i) => (
          <div key={i} style={{
            borderLeft: '4px solid ' + layer.color,
            background: layer.color + '08',
            borderRadius: theme.radius.sm,
            padding: theme.spacing.md,
          }}>
            <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: layer.color, marginBottom: '4px' }}>
              {layer.label}
            </div>
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: '8px' }}>
              {layer.description}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px' }}>
              {layer.signals.map((signal) => (
                <div key={signal} style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textPrimary,
                  background: theme.colors.bgCard,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid ' + theme.colors.border,
                }}>
                  {signal}
                </div>
              ))}
            </div>
            {!isCompact && (
              <div style={{ fontSize: theme.fontSize.xs, fontStyle: 'italic', color: theme.colors.textMuted, marginTop: '8px' }}>
                {layer.tagline}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{
        marginTop: theme.spacing.md,
        textAlign: 'center',
        fontSize: theme.fontSize.sm,
        fontWeight: 700,
        color: theme.colors.textPrimary,
        padding: '10px',
        background: theme.colors.bgDeep,
        borderRadius: theme.radius.sm,
      }}>
        Together: cross-domain intelligence that catches disengagement signals competitors miss.
      </div>
    </div>
  );
}
