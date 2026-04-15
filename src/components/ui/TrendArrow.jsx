export default function TrendArrow({ direction, value, period, inverted = false }) {
  const isGood = inverted ? direction === 'down' : direction === 'up';
  const isFlat = direction === 'flat';
  const colorCls = isFlat ? 'text-swoop-text-muted' : (isGood ? 'text-success-500' : 'text-error-500');
  const arrow = direction === 'up' ? '\u25B2' : direction === 'down' ? '\u25BC' : '\u2014';
  const pct   = value == null ? '' : typeof value === 'string' ? value : `${Math.abs(value).toFixed(1)}%`;

  return (
    <span className={`inline-flex items-center gap-[3px] text-sm font-semibold ${colorCls}`}>
      <span className="text-[10px]">{arrow}</span>
      <span>{pct}</span>
      {period && (
        <span className="text-swoop-text-muted font-normal text-[11px]">
          {period}
        </span>
      )}
    </span>
  );
}
