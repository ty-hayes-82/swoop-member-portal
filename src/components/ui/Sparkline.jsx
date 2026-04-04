// DES-P08: Sparkline component for inline trend visualization

export default function Sparkline({
  data = [],
  width = 80,
  height = 24,
  color = '#465fff',
  lineWidth = 2,
  showDots = false,
  className = ''
}) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });

  const pathData = points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`block ${className}`}
    >
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={lineWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots && points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={2}
          fill={color}
        />
      ))}
    </svg>
  );
}

// Sparkline with positive/negative coloring
export function TrendSparkline({
  data = [],
  width = 80,
  height = 24,
  positiveColor = '#12b76a',
  negativeColor = '#f04438',
  className = ''
}) {
  if (!data || data.length === 0) return null;

  const trend = data.length > 1 ? data[data.length - 1] - data[0] : 0;
  const color = trend >= 0 ? positiveColor : negativeColor;

  return <Sparkline data={data} width={width} height={height} color={color} className={className} />;
}

// Bar chart sparkline
export function SparkBar({
  data = [],
  width = 80,
  height = 24,
  color = '#465fff',
  gap = 2,
  className = ''
}) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data) || 1;
  const barWidth = (width - (data.length - 1) * gap) / data.length;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`block ${className}`}
    >
      {data.map((value, index) => {
        const barHeight = (value / max) * height;
        const x = index * (barWidth + gap);
        const y = height - barHeight;

        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            fill={color}
            rx={1}
          />
        );
      })}
    </svg>
  );
}

// Win/loss sparkline (positive/negative bars)
export function WinLossSparkline({
  data = [],
  width = 80,
  height = 24,
  positiveColor = '#12b76a',
  negativeColor = '#f04438',
  gap = 2,
  className = ''
}) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map(Math.abs)) || 1;
  const barWidth = (width - (data.length - 1) * gap) / data.length;
  const zeroY = height / 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`block ${className}`}
    >
      {/* Zero line */}
      <line
        x1={0}
        y1={zeroY}
        x2={width}
        y2={zeroY}
        stroke="#e4e7ec"
        strokeWidth={1}
      />

      {data.map((value, index) => {
        const barHeight = (Math.abs(value) / max) * (height / 2);
        const x = index * (barWidth + gap);
        const y = value >= 0 ? zeroY - barHeight : zeroY;

        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            fill={value >= 0 ? positiveColor : negativeColor}
            rx={1}
          />
        );
      })}
    </svg>
  );
}
