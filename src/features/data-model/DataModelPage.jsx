import { useEffect, useMemo, useState } from 'react';
import { theme } from '@/config/theme';
import { vercelPostgresSchema } from '@/data/schema/vercelPostgresSchema';

const cardStyle = {
  background: theme.colors.bgCard,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.md,
  boxShadow: theme.shadow.sm,
};

function truncateValue(value, maxLength = 32) {
  if (value == null) return '—';
  const text = String(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function isMonospaceField(columnName, value) {
  const normalizedColumnName = String(columnName || '').toLowerCase();
  if (
    normalizedColumnName.endsWith('_id') ||
    normalizedColumnName === 'id' ||
    normalizedColumnName.includes('date') ||
    normalizedColumnName.endsWith('_at') ||
    normalizedColumnName.endsWith('_time')
  ) {
    return true;
  }

  if (typeof value !== 'string') return false;
  const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  const looksLikeIsoTimestamp = /^\d{4}-\d{2}-\d{2}T/.test(value);
  return looksLikeUuid || looksLikeIsoTimestamp;
}

function TableListItem({ table, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(table.name)}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '10px 12px',
        borderRadius: theme.radius.sm,
        border: `1px solid ${isActive ? theme.colors.accent : theme.colors.border}`,
        background: isActive ? `${theme.colors.accent}10` : theme.colors.bgCard,
        color: theme.colors.textPrimary,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <span style={{ fontSize: theme.fontSize.sm, fontWeight: 700 }}>{table.name}</span>
      {table.description && (
        <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, lineHeight: 1.35 }}>
          {table.description}
        </span>
      )}
    </button>
  );
}

export default function DataModelPage() {
  const tables = vercelPostgresSchema.tables;
  const [query, setQuery] = useState('');
  const [selectedTableName, setSelectedTableName] = useState(tables[0]?.name ?? '');
  const [isNarrowViewport, setIsNarrowViewport] = useState(() => window.innerWidth < 980);

  useEffect(() => {
    const onResize = () => setIsNarrowViewport(window.innerWidth < 980);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const filteredTables = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return tables;
    return tables.filter((table) => {
      const searchable = `${table.name} ${table.description || ''}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [query, tables]);

  const selectedTable = useMemo(
    () => tables.find((table) => table.name === selectedTableName) ?? filteredTables[0] ?? null,
    [tables, selectedTableName, filteredTables],
  );

  const navigateToTable = (tableName) => {
    setSelectedTableName(tableName);
    setQuery('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <div style={{ ...cardStyle, padding: 16 }}>
        <h2 style={{ fontSize: theme.fontSize.lg, marginBottom: 6 }}>Vercel Postgres Data Model</h2>
        <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
          Browse table structure and foreign key relationships. This is an ERD-lite navigator for schema discovery.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isNarrowViewport ? '1fr' : 'minmax(260px, 320px) minmax(0, 1fr)',
          gap: theme.spacing.md,
        }}
      >
        <aside style={{ ...cardStyle, padding: 14, alignSelf: 'start' }}>
          <label htmlFor="table-search" style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
            Search tables
          </label>
          <input
            id="table-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="members, tee_times, action..."
            style={{
              width: '100%',
              marginTop: 6,
              marginBottom: 12,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.sm,
              background: theme.colors.bgCard,
              color: theme.colors.textPrimary,
              padding: '8px 10px',
              minHeight: 40,
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 560, overflowY: 'auto' }}>
            {filteredTables.map((table) => (
              <TableListItem
                key={table.name}
                table={table}
                isActive={selectedTable?.name === table.name}
                onSelect={setSelectedTableName}
              />
            ))}
            {filteredTables.length === 0 && (
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted, padding: '8px 4px' }}>
                No tables match your search.
              </div>
            )}
          </div>
        </aside>

        <section style={{ ...cardStyle, padding: 18 }}>
          {selectedTable ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h3 style={{ fontSize: theme.fontSize.lg }}>{selectedTable.name}</h3>
                {selectedTable.description && (
                  <p style={{ marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }}>
                    {selectedTable.description}
                  </p>
                )}
              </div>

              <div>
                <h4 style={{ marginBottom: 10, fontSize: theme.fontSize.md }}>Columns</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                    <thead>
                      <tr style={{ background: theme.colors.bgDeep }}>
                        <th style={thStyle}>Name</th>
                        <th style={thStyle}>Type</th>
                        <th style={thStyle}>Nullable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTable.columns.map((column) => (
                        <tr key={column.name}>
                          <td style={tdStyle}>{column.name}</td>
                          <td style={tdStyle}>{column.type}</td>
                          <td style={tdStyle}>{column.nullable ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: 10, fontSize: theme.fontSize.md }}>Relationships</h4>
                {selectedTable.relationships.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedTable.relationships.map((relationship) => (
                      <div
                        key={`${relationship.fromColumn}-${relationship.toTable}-${relationship.toColumn}`}
                        style={{
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: theme.radius.sm,
                          padding: '10px 12px',
                          background: theme.colors.bgCard,
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 8,
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs }}>
                          {selectedTable.name}.{relationship.fromColumn}
                        </span>
                        <span style={{ color: theme.colors.textMuted }}>→</span>
                        <button
                          type="button"
                          onClick={() => navigateToTable(relationship.toTable)}
                          style={{
                            color: theme.colors.accent,
                            fontWeight: 700,
                            textDecoration: 'underline',
                            minHeight: 0,
                          }}
                        >
                          {relationship.toTable}.{relationship.toColumn}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
                    No foreign key relationships from this table.
                  </p>
                )}
              </div>

              <div>
                <h4 style={{ marginBottom: 10, fontSize: theme.fontSize.md }}>Sample Rows</h4>
                {selectedTable.sampleRows?.length ? (
                  <div
                    style={{
                      overflow: 'auto',
                      maxHeight: 220,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radius.sm,
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                      <thead>
                        <tr style={{ background: theme.colors.bgDeep }}>
                          {selectedTable.columns.map((column) => (
                            <th key={column.name} style={thStyle}>
                              {column.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTable.sampleRows.slice(0, 5).map((row, rowIndex) => (
                          <tr key={`${selectedTable.name}-sample-row-${rowIndex}`}>
                            {selectedTable.columns.map((column) => {
                              const rawValue = row[column.name];
                              return (
                                <td
                                  key={`${rowIndex}-${column.name}`}
                                  title={rawValue == null ? '' : String(rawValue)}
                                  style={{
                                    ...tdStyle,
                                    fontFamily: isMonospaceField(column.name, rawValue)
                                      ? theme.fonts.mono
                                      : theme.fonts.body,
                                  }}
                                >
                                  {truncateValue(rawValue)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
                    No sample rows are defined for this table yet.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div style={{ color: theme.colors.textMuted }}>No table selected.</div>
          )}
        </section>
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: `1px solid ${theme.colors.border}`,
  fontSize: theme.fontSize.xs,
  color: theme.colors.textSecondary,
  fontWeight: 700,
};

const tdStyle = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: `1px solid ${theme.colors.borderLight}`,
  fontSize: theme.fontSize.sm,
  color: theme.colors.textPrimary,
};
