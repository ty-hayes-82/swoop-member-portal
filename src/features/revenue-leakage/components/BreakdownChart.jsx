export default function BreakdownChart({ totalLoss, paceAmount, staffingAmount, weatherAmount, proshopAmount }) {
  const pacePct = ((paceAmount / totalLoss) * 100).toFixed(0);
  const staffPct = ((staffingAmount / totalLoss) * 100).toFixed(0);
  const weatherPct = ((weatherAmount / totalLoss) * 100).toFixed(0);
  const proshopPct = ((proshopAmount / totalLoss) * 100).toFixed(0);

  const segments = [
    { icon: '\u26A1', amount: paceAmount, pct: pacePct, label: 'Pace-of-Play Impact',
      gradient: 'linear-gradient(135deg, rgb(245, 158, 11), rgb(249, 115, 22))',
      cardBg: 'rgba(249, 115, 22, 0.06)', cardBorder: 'rgba(249, 115, 22, 0.15)',
      iconBg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(245, 158, 11, 0.08))',
      iconBorder: 'rgba(249, 115, 22, 0.15)', dotColor: 'rgb(249, 115, 22)',
      textColor: 'rgb(249, 115, 22)', width: (paceAmount / totalLoss * 100), first: true },
    { icon: '\uD83D\uDC65', amount: staffingAmount, pct: staffPct, label: 'Staffing Gaps',
      gradient: 'linear-gradient(135deg, rgb(217, 119, 6), rgb(180, 83, 9))',
      cardBg: 'rgba(217, 119, 6, 0.06)', cardBorder: 'rgba(217, 119, 6, 0.15)',
      iconBg: 'linear-gradient(135deg, rgba(217, 119, 6, 0.12), rgba(180, 83, 9, 0.08))',
      iconBorder: 'rgba(217, 119, 6, 0.15)', dotColor: 'rgb(217, 119, 6)',
      textColor: 'rgb(217, 119, 6)', width: (staffingAmount / totalLoss * 100) },
    { icon: '\uD83C\uDF26\uFE0F', amount: weatherAmount, pct: weatherPct, label: 'Weather Shifts',
      gradient: 'linear-gradient(135deg, rgb(59, 130, 246), rgb(37, 99, 235))',
      cardBg: 'rgba(59, 130, 246, 0.06)', cardBorder: 'rgba(59, 130, 246, 0.15)',
      iconBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(37, 99, 235, 0.08))',
      iconBorder: 'rgba(59, 130, 246, 0.15)', dotColor: 'rgb(59, 130, 246)',
      textColor: 'rgb(59, 130, 246)', width: Math.max(weatherAmount / totalLoss * 100, 5), minWidth: '65px' },
    { icon: '\uD83D\uDECD\uFE0F', amount: proshopAmount, pct: proshopPct, label: 'Pro Shop & Lessons',
      gradient: 'linear-gradient(135deg, rgb(139, 92, 246), rgb(109, 40, 217))',
      cardBg: 'rgba(139, 92, 246, 0.06)', cardBorder: 'rgba(139, 92, 246, 0.15)',
      iconBg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(109, 40, 217, 0.08))',
      iconBorder: 'rgba(139, 92, 246, 0.15)', dotColor: 'rgb(139, 92, 246)',
      textColor: 'rgb(139, 92, 246)', width: (proshopAmount / totalLoss * 100) },
  ];

  return (
    <div style={{
      border: '1px solid rgba(228, 228, 231, 0.6)',
      borderRadius: '16px',
      padding: '36px 32px 32px',
      background: 'linear-gradient(rgba(249, 115, 22, 0.016) 0%, white 30%)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.03)',
      transition: 'box-shadow 0.2s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: 'linear-gradient(90deg, rgb(249, 115, 22) 40%, rgb(217, 119, 6) 60%, rgb(59, 130, 246) 75%, rgb(139, 92, 246) 100%)',
        borderRadius: '16px 16px 0 0',
      }} />

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid rgba(228, 228, 231, 0.5)',
      }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f0f0f', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Revenue Leakage Breakdown
          </h3>
          <p style={{ fontSize: '13px', color: '#71717a', margin: 0, fontStyle: 'normal' }}>
            How ${totalLoss.toLocaleString()}/month breaks down across operational categories
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#a1a1aa', letterSpacing: '0.08em', marginBottom: '4px', textAlign: 'right', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            TOTAL MONTHLY LEAKAGE
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#0f0f0f', letterSpacing: '-0.03em', lineHeight: 1, position: 'relative' }}>
            ${totalLoss.toLocaleString()}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: 'rgba(239, 68, 68, 0.08)', color: '#dc2626',
            padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
            marginTop: '6px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}>
            {'\u2191'} 8% vs last month
          </div>
        </div>
      </div>

      {/* Distribution label */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '8px', fontSize: '11px', fontWeight: 600, color: '#a1a1aa',
        letterSpacing: '0.04em', textTransform: 'uppercase',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}>
        DISTRIBUTION
      </div>

      {/* Stacked bar */}
      <div style={{
        height: '48px', borderRadius: '12px', overflow: 'hidden', display: 'flex',
        marginBottom: '28px', border: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'relative',
      }}>
        {segments.map((seg, i) => (
          <div key={seg.label} style={{
            width: seg.width + '%', minWidth: seg.minWidth,
            background: seg.gradient,
            display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            position: 'relative', transition: '0.3s', cursor: 'pointer', gap: '6px',
            borderLeft: i > 0 ? '2px solid rgba(255,255,255,0.3)' : 'none',
            borderRadius: seg.first ? '12px 0 0 12px' : (i === segments.length - 1 ? '0 12px 12px 0' : '0'),
            padding: seg.first ? '0 12px' : '0 8px',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'white', fontFamily: "'JetBrains Mono', monospace", textShadow: '0 1px 2px rgba(0,0,0,0.12)', lineHeight: 1, letterSpacing: '-0.01em' }}>
              ${seg.amount.toLocaleString()}
            </span>
            <span style={{ fontSize: i === segments.length - 1 ? '10px' : '11px', fontWeight: 500, color: 'rgba(255,255,255,0.65)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", lineHeight: 1 }}>
              {seg.pct}%
            </span>
          </div>
        ))}
      </div>

      {/* Category cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {segments.map((seg) => (
          <div key={seg.label} style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
            background: seg.cardBg, borderRadius: '12px',
            border: '1px solid ' + seg.cardBorder, transition: '0.2s', cursor: 'pointer',
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px',
              background: seg.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', flexShrink: 0, border: '1px solid ' + seg.iconBorder,
            }}>{seg.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '13px', fontWeight: 600, color: '#3f3f46', marginBottom: '4px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                letterSpacing: '-0.01em', display: 'flex', alignItems: 'center',
              }}>
                <span style={{
                  display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                  background: seg.dotColor, marginRight: '6px', verticalAlign: 'middle', flexShrink: 0,
                }} />
                {seg.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '17px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: seg.textColor, letterSpacing: '-0.02em' }}>
                  ${seg.amount.toLocaleString()}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa' }}>({seg.pct}%)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
