import { theme } from '@/config/theme';

// DES-P08: Sparkline component for inline trend visualization

export default function Sparkline({ 
  data = [], 
  width = 80, 
  height = 24,
  color = theme.colors.accent,
  lineWidth = 2,
  showDots = false,
  style = {}
}) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1; // Avoid division by zero

  // Normalize data points to SVG coordinates
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });

  // Build path string
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
      style={{ display: 'block', ...style }}
    >
      {/* Line */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={lineWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Dots at each point */}
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
  positiveColor = theme.colors.success,
  negativeColor = theme.colors.urgent,
  style = {}
}) {
  if (!data || data.length === 0) return null;

  const trend = data.length > 1 ? data[data.length - 1] - data[0] : 0;
  const color = trend >= 0 ? positiveColor : negativeColor;

  return <Sparkline data={data} width={width} height={height} color={color} style={style} />;
}

// Bar chart sparkline
export function SparkBar({ 
  data = [], 
  width = 80, 
  height = 24,
  color = theme.colors.accent,
  gap = 2,
  style = {}
}) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data) || 1;
  const barWidth = (width - (data.length - 1) * gap) / data.length;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', ...style }}
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
  positiveColor = theme.colors.success,
  negativeColor = theme.colors.urgent,
  gap = 2,
  style = {}
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
      style={{ display: 'block', ...style }}
    >
      {/* Zero line */}
      <line
        x1={0}
        y1={zeroY}
        x2={width}
        y2={zeroY}
        stroke={theme.colors.border}
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
