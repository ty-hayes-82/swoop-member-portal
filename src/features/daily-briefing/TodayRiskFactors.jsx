import Badge from '@/components/ui/Badge.jsx';

const WEATHER_ICONS = {
  sunny: '☀️', cloudy: '⛅', rainy: '🌧️', windy: '💨', closed: '🔒',
};

export default function TodayRiskFactors({ data, onNavigate }) {
  const { weather, tempHigh, wind, atRiskTeetimes, staffingGaps, fullyStaffed } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Weather row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
      }}>
        <span style={{ fontSize: '24px' }}>{WEATHER_ICONS[weather] || '☀️'}</span>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {tempHigh}°F · {weather.charAt(0).toUpperCase() + weather.slice(1)}
            {wind > 15 && <span style={{ color: '#F59E0B', fontSize: '12px', marginLeft: '8px' }}>Wind advisory: {wind} mph</span>}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Saturday Jan 17 — {wind < 12 ? 'Ideal golf conditions' : 'Elevated pace risk on exposed holes'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Badge text={fullyStaffed ? '✓ Fully Staffed' : '⚠ Staffing Gap'} variant={fullyStaffed ? 'success' : 'urgent'} />
        </div>
      </div>

      {/* At-risk tee times */}
      {atRiskTeetimes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 600 }}>
            AT-RISK MEMBERS WITH TEE TIMES TODAY
          </div>
          {atRiskTeetimes.map(m => (
            <div key={m.memberId}
              onClick={() => onNavigate?.('member-health')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px',
                background: '#A78BFA08',
                border: '1px solid #A78BFA22',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#A78BFA22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#A78BFA', fontWeight: 700, flexShrink: 0 }}>
                {m.score}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.topRisk}</div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{m.time}</div>
            </div>
          ))}
        </div>
      )}

      {/* Staffing gaps */}
      {staffingGaps.length > 0 && (
        <div style={{ padding: '10px 14px', background: '#EF444410', border: '1px solid #EF444430', borderRadius: '8px' }}>
          {staffingGaps.map((gap, i) => (
            <div key={i} style={{ fontSize: '13px', color: '#EF4444' }}>⚠ {gap}</div>
          ))}
        </div>
      )}
    </div>
  );
}
