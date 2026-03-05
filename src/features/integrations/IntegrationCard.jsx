// features/integrations/IntegrationCard.jsx
import { theme } from '@/config/theme';

const categoryStyle = (color) => ({
  display: 'inline-block',
  fontSize: theme.fontSize.xs,
  fontWeight: 600,
  color,
  background: `${color}14`,
  borderRadius: 4,
  padding: '2px 7px',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
});

const dataPointStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: theme.fontSize.xs,
  color: theme.colors.textMuted,
};

export function IntegrationCard({ integration, isSelected, onClick }) {
  const { name, icon, category, color, description, dataPoints } = integration;

  const cardStyle = {
    background: isSelected ? `rgba(26,122,60,0.04)` : '#fff',
    border: isSelected ? `2px solid #1a7a3c` : `1px solid ${theme.colors.border}`,
    boxShadow: isSelected ? '0 0 0 2px rgba(26,122,60,0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
    borderRadius: 10,
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    userSelect: 'none',
  };

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
        }
      }}
    >
      {isSelected && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          width: 22, height: 22, borderRadius: '50%',
          background: '#1a7a3c', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700,
        }}>✓</div>
      )}

      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: theme.fontSize.md, color: theme.colors.textPrimary, marginBottom: 6 }}>
        {name}
      </div>
      <div style={{ marginBottom: 10 }}>
        <span style={categoryStyle(color)}>{category}</span>
      </div>

      {isSelected && (
        <>
          <p style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.5, margin: '10px 0 10px' }}>
            {description}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {dataPoints.map((dp, i) => (
              <div key={i} style={dataPointStyle}>
                <span style={{ color, fontSize: 10 }}>●</span>
                {dp}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
