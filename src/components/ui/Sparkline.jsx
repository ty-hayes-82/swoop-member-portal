import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function Sparkline({ data = [], color = '#4ADE80', height = 32, showDots = false }) {
  if (!data.length) return null;

  const chartData = data.map((v, i) => ({ i, v }));
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = (max - min) * 0.1 || 1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={showDots ? { r: 2, fill: color } : false}
          activeDot={false}
          domain={[min - pad, max + pad]}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
