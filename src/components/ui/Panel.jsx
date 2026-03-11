import { SourceBadge } from './index.js';

export default function Panel({
  title, subtitle, tabs, activeTab, onTabChange, actions, children,
  sourceSystems,
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px 0',
        borderBottom: tabs ? 'none' : '1px solid var(--border-light)',
        paddingBottom: tabs ? '0' : '16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                {subtitle}
              </p>
            )}
            {sourceSystems && sourceSystems.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Source:</span>
                {sourceSystems.map(s => <SourceBadge key={s} system={s} size="xs" />)}
              </div>
            )}
          </div>
          {actions && <div style={{ flexShrink: 0, marginLeft: '12px' }}>{actions}</div>}
        </div>

        {/* Tabs */}
        {tabs && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            columnGap: 0,
            rowGap: '8px',
            marginTop: '16px',
            maxWidth: '100%',
          }}>
            {tabs.map(tab => {
              const active = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange?.(tab.key)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: active ? 600 : 400,
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                    background: 'none',
                    transition: 'color 0.15s, border-color 0.15s',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flex: '0 1 auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: active ? 'var(--accent)' : 'var(--text-muted)',
                        background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${active ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}`,
                        borderRadius: '999px',
                        padding: '2px 8px',
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {children}
      </div>
    </div>
  );
}
