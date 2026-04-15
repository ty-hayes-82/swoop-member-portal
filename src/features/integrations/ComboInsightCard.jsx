const trendColor = (trend) => (trend === 'down' ? '#ef4444' : '#12b76a');

export function ComboInsightCard({ combo, systemsById }) {
  const [leftId, rightId] = combo.systems;
  const left = systemsById[leftId];
  const right = systemsById[rightId];

  if (!left || !right) return null;

  return (
    <article className="bg-swoop-panel border border-swoop-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-swoop-text-label">
          <NodeChip name={left.name} logo={left.logo} />
          <span>↔</span>
          <NodeChip name={right.name} logo={right.logo} />
        </div>
        <div className="text-right">
          <div className="text-lg font-bold font-mono text-swoop-text">
            {combo.kpi.value}
          </div>
          <div className="text-[10px] text-swoop-text-label">{combo.kpi.label}</div>
        </div>
      </div>

      <p className="m-0 text-[13px] text-swoop-text-muted leading-normal">
        {combo.insight}
      </p>

      {combo.preview?.type === 'sparkline' ? (
        <SparklinePreview preview={combo.preview} />
      ) : (
        <div className="bg-swoop-row rounded-lg py-2.5 px-3 text-xs text-swoop-text-muted">
          <strong className="text-swoop-text">{combo.preview?.value}</strong> {combo.preview?.label}
        </div>
      )}
    </article>
  );
}

function NodeChip({ name, logo }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-5 h-5 rounded-md border border-swoop-border inline-flex items-center justify-center text-[10px] font-bold">
        {logo}
      </span>
      <span>{name}</span>
    </span>
  );
}

function SparklinePreview({ preview }) {
  const points = preview.data ?? [];
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);
  const step = points.length > 1 ? 160 / (points.length - 1) : 0;
  const path = points
    .map((value, index) => {
      const x = index * step;
      const y = 32 - ((value - min) / range) * 32;
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  return (
    <div className="bg-swoop-row rounded-lg py-2.5 px-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wide text-swoop-text-label">
          {preview.label}
        </span>
        <span className="text-xs font-bold" style={{ color: trendColor(preview.trend) }}>{preview.value}</span>
      </div>
      <svg width="160" height="36" viewBox="0 0 160 36" aria-hidden="true">
        <path d={path} fill="none" stroke={trendColor(preview.trend)} strokeWidth="2" />
      </svg>
    </div>
  );
}
