import { theme } from '@/config/theme';

const CATEGORY_COLORS = {
  'tee-sheet': theme.colors.integrationTeeSheet,
  pos: theme.colors.integrationPos,
  crm: theme.colors.integrationCrm,
  staffing: theme.colors.operations,
  waitlist: theme.colors.integrationWaitlist,
};

const STATUS_COLORS = {
  connected: theme.colors.operations,
  available: theme.colors.integrationPos,
  'coming-soon': theme.colors.integrationMuted,
};

export function IntegrationCard({ system, isSelected, onClick, cardRef }) {
  const categoryColor = CATEGORY_COLORS[system.category] ?? theme.colors.integrationNeutral;
  const statusColor = STATUS_COLORS[system.status] ?? theme.colors.integrationNeutral;

  return (
    <article
      ref={cardRef}
      onClick={onClick}
      style={{
        background: theme.colors.white,
        border: isSelected ? `2px solid ${categoryColor}` : `1px solid ${theme.colors.border}`,
        borderRadius: 12,
        padding: 16,
        cursor: 'pointer',
        boxShadow: isSelected ? '0 0 0 2px rgba(26,122,60,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: theme.fontSize.md, color: theme.colors.textPrimary }}>{system.name}</h3>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <Badge text={system.category} color={categoryColor} />
            <Badge text={`Tier ${system.tier}`} color={theme.colors.integrationNeutral} />
          </div>
        </div>
        <span style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          border: `1px solid ${theme.colors.border}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
        }}>
          {system.logo}
        </span>
      </div>

      <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 10 }}>
        <strong style={{ color: statusColor }}>{system.status}</strong>
        {' · '}
        Last sync: {system.lastSync ?? 'Not connected yet'}
      </div>

      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.colors.textMuted, marginBottom: 6 }}>
        Key Endpoints
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {system.endpoints.map((endpoint) => (
          <span key={endpoint} style={{
            background: theme.colors.bgDeep,
            borderRadius: 6,
            padding: '3px 7px',
            fontSize: 11,
            color: theme.colors.textSecondary,
          }}>
            {endpoint}
          </span>
        ))}
      </div>
    </article>
  );
}

function Badge({ text, color }) {
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color,
      background: `${color}18`,
      borderRadius: 4,
      padding: '2px 6px',
    }}>
      {text}
    </span>
  );
}
