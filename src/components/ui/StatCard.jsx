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
      className={`rounded-xl border border-swoop-border p-5 flex flex-col gap-2 min-w-0 transition-all duration-150 ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      } ${
        hovered && onClick
          ? 'bg-swoop-row shadow-theme-md'
          : 'bg-swoop-panel shadow-theme-xs'
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="text-xs text-swoop-text-muted font-medium tracking-wide leading-tight">
          {label}
        </span>
        {badge && <Badge text={badge.text} variant={badge.variant} size="sm" />}
      </div>

      <div className="font-mono text-[28px] font-semibold text-swoop-text leading-none tracking-tight">
        {formatValue(value, format)}
      </div>

      <div className="flex justify-between items-end">
        {trend && (
          <TrendArrow
            direction={trend.direction}
            value={trend.value}
            period={trend.period}
            inverted={trend.inverted}
          />
        )}
        {sparklineData && sparklineData.length > 1 && (
          <div className="w-20 h-7 ml-auto">
            <Sparkline data={sparklineData} height={28} />
          </div>
        )}
      </div>
      {source && (
        <div className="mt-0.5">
          <SourceBadge system={source} size="xs" />
        </div>
      )}
    </div>
  );
}
