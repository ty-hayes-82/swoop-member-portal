import { theme } from '@/config/theme';
import Icon from './Icon';

const cellBase = {
  padding: '18px 20px',
  fontSize: 15,
  textAlign: 'center',
  verticalAlign: 'middle',
};

function Mark({ value, highlight }) {
  if (value === true) {
    const color = highlight ? theme.colors.accent : 'rgba(17,17,17,0.55)';
    return <Icon name="Check" size={22} color={color} strokeWidth={2.75} />;
  }
  if (value === 'partial') {
    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'rgba(17,17,17,0.45)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        Partial
      </span>
    );
  }
  return <Icon name="X" size={18} color="rgba(17,17,17,0.2)" strokeWidth={2.5} />;
}

export default function ComparisonTable({ features, columns }) {
  return (
    <div
      className="landing-table-wrap"
      style={{
        background: theme.neutrals.paper,
        borderRadius: 20,
        boxShadow: theme.shadow.card,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        border: '1px solid rgba(17,17,17,0.06)',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: 720,
        }}
      >
        <thead>
          <tr style={{ background: '#FAF7F2' }}>
            <th
              style={{
                ...cellBase,
                textAlign: 'left',
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: theme.colors.textMuted,
              }}
            >
              Feature
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  ...cellBase,
                  fontSize: 14,
                  fontWeight: 700,
                  color: col.highlight ? theme.colors.accent : theme.neutrals.ink,
                  background: col.highlight ? 'rgba(243,146,45,0.08)' : 'transparent',
                  borderBottom: col.highlight ? `3px solid ${theme.colors.accent}` : 'none',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((row, idx) => (
            <tr
              key={row.feature}
              style={{
                borderTop: idx === 0 ? 'none' : '1px solid rgba(17,17,17,0.06)',
              }}
            >
              <td
                style={{
                  ...cellBase,
                  textAlign: 'left',
                  fontWeight: 600,
                  color: theme.neutrals.ink,
                }}
              >
                {row.feature}
              </td>
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    ...cellBase,
                    background: col.highlight ? 'rgba(243,146,45,0.07)' : 'transparent',
                  }}
                >
                  <Mark value={row[col.key]} highlight={col.highlight} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
