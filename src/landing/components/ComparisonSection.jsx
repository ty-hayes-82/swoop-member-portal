import { theme } from '@/config/theme';
import { comparisonFeatures } from '@/landing/data';

function Cell({ value }) {
  const color = value === true
    ? theme.colors.success
    : value === 'partial'
      ? theme.colors.warning
      : theme.colors.urgent;
  const symbol = value === true ? '✓' : value === 'partial' ? '◐' : '✕';
  const label = value === true ? 'Yes' : value === 'partial' ? 'Partial' : 'No';
  return (
    <td style={{
      textAlign: 'center',
      color,
      fontWeight: 700,
      fontSize: theme.fontSize.lg,
      padding: '12px 10px',
      borderBottom: `1px solid ${theme.colors.borderLight}`,
    }}>
      <span aria-label={label} title={label}>{symbol}</span>
    </td>
  );
}

export default function ComparisonSection() {
  return (
    <section style={{ marginBottom: theme.spacing.xxl }}>
      <h2 style={{ fontSize: theme.fontSize.xxl, marginBottom: theme.spacing.md }}>
        Built to replace patchwork ops.
      </h2>
      <p style={{
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xl,
        fontSize: theme.fontSize.lg,
      }}>
        Swoop is not another single-point tool. It is the operating layer across member demand,
        service quality, labor, and revenue.
      </p>
      <div className="landing-table-wrap" style={{
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        background: theme.colors.bgCard,
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
          <thead>
            <tr style={{ background: theme.colors.bgDeep }}>
              {['Feature', 'Swoop', 'Noteefy', 'Your CRM Alone', 'Spreadsheets'].map((header) => (
                <th
                  key={header}
                  style={{
                    textAlign: header === 'Feature' ? 'left' : 'center',
                    padding: '14px 14px',
                    fontWeight: 700,
                    color: theme.colors.textPrimary,
                    borderBottom: `1px solid ${theme.colors.border}`,
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonFeatures.map((row) => (
              <tr key={row.feature}>
                <td style={{
                  padding: '12px 14px',
                  borderBottom: `1px solid ${theme.colors.borderLight}`,
                  fontWeight: 500,
                }}>
                  {row.feature}
                </td>
                <Cell value={row.swoop} />
                <Cell value={row.noteefy} />
                <Cell value={row.crm} />
                <Cell value={row.sheets} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
