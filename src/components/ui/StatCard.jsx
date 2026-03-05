import { useState } from 'react';
import TrendArrow from './TrendArrow.jsx';
import Sparkline from './Sparkline.jsx';
import Badge from './Badge.jsx';
import SourceBadge from './SourceBadge.jsx';

function formatValue(value, format) {
  if (format === 'currency') {
    return typeof value === 'number'
      ? '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 })
      : value;
  }
  if (format === 'percent') return typeof value === 'number' ? value + '%' : value;
  return typeof value === 'number' ? value.toLocaleString() : value;
}

export default function StatCard({
  label, value, format, trend, sparklineData, badge, onClick, source,
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered && onClick ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        border: `1px solid var(--border)`,
        borderRadius: '10px',
        padding: '20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.03em', lineHeight: 1.3 }}>
          {label}
        </span>
        {badge && <Badge text={badge.text} variant={badge.variant} size="sm" />}
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {formatValue(value, format)}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {trend && (
          <TrendArrow
            direction={trend.direction}
            value={trend.value}
            period={trend.period}
            inverted={trend.inverted}
          />
        )}
        {sparklineData && sparklineData.length > 1 && (
          <div style={{ width: '80px', height: '28px', marginLeft: 'auto' }}>
            <Sparkline data={sparklineData} height={28} />
          </div>
        )}
      </div>
      {source && (
        <div style={{ marginTop: '2px' }}>
          <SourceBadge system={source} size="xs" />
        </div>
      )}
    </div>
  );
}
