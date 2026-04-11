import { theme } from '@/config/theme';

const trustSignals = [
  '28 System Integrations',
  'Live in Under 2 Weeks',
  'No Rip-and-Replace',
  'Data Encrypted at Rest & in Transit',
];

export default function TrustStrip() {
  return (
    <section style={{ marginBottom: theme.spacing.xl }}>
      <p
        style={{
          textAlign: 'center',
          color: theme.colors.textMuted,
          fontSize: theme.fontSize.sm,
          letterSpacing: '0.02em',
        }}
      >
        {trustSignals.join(' · ')}
      </p>
    </section>
  );
}
