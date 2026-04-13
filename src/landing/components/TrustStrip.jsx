import { theme } from '@/config/theme';
import { Icon } from '@/landing/ui';

const stats = [
  {
    icon: 'Rocket',
    value: 'Founding partner program',
    sub: 'Open to the first 10 private clubs',
  },
  {
    icon: 'Database',
    value: '300-member Pinetree CC',
    sub: 'Live demo environment, real data',
  },
  {
    icon: 'Plug',
    value: '28 integrations',
    sub: '10 categories · no rip-and-replace',
  },
  {
    icon: 'Zap',
    value: 'Live in under 2 weeks',
    sub: 'Week 1: connectors · Week 2: agents',
  },
];

export default function TrustStrip() {
  return (
    <section className="landing-section-sm" style={{ paddingTop: 56, paddingBottom: 16 }}>
      <div className="landing-container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 20,
            padding: 'clamp(20px, 3vw, 32px)',
            borderRadius: 18,
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(17,17,17,0.08)',
            boxShadow: '0 8px 20px rgba(17,17,17,0.04)',
          }}
          className="landing-trust-stats"
        >
          {stats.map((s) => (
            <div key={s.value} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(243,146,45,0.12)',
                  flexShrink: 0,
                }}
              >
                <Icon name={s.icon} size={18} color={theme.colors.accent} strokeWidth={2.25} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: theme.neutrals.ink,
                    lineHeight: 1.3,
                    marginBottom: 3,
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, lineHeight: 1.45 }}>
                  {s.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
