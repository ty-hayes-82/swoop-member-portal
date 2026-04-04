import { useState } from 'react';

const SYSTEMS = [
  { id: 'tee-sheet', label: 'Tee Sheet', connected: true, lastSync: '2 min ago', signals: ['Round bookings', 'Cancellations', 'Pace of play'] },
  { id: 'pos-fb', label: 'POS/F&B', connected: true, lastSync: '5 min ago', signals: ['Dining spend', 'Check averages', 'Outlet mix'] },
  { id: 'crm', label: 'Member CRM', connected: true, lastSync: '1 hour ago', signals: ['Member profiles', 'Dues status', 'Lifecycle notes'] },
  { id: 'scheduling', label: 'Scheduling', connected: true, lastSync: '10 min ago', signals: ['Staff coverage', 'Labor hours', 'Shift patterns'] },
  { id: 'complaints', label: 'Feedback', connected: true, lastSync: '30 min ago', signals: ['Service issues', 'Complaint themes', 'Response time'] },
  { id: 'weather', label: 'Weather', connected: true, lastSync: 'Live', signals: ['Conditions', 'Forecasts', 'Impact predictions'] },
  { id: 'gps-app', label: 'Swoop App', connected: true, lastSync: 'Live', signals: ['GPS tracking', 'In-app orders', 'Push engagement'] },
];

export default function UnifiedExperienceMap() {
  const [hoveredNode, setHoveredNode] = useState(null);

  const width = 800;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;
  const centerRadius = 70;
  const nodeRadius = 50;
  const orbitRadius = 200;

  const nodePositions = SYSTEMS.map((system, index) => {
    const angle = (index * 2 * Math.PI) / SYSTEMS.length - Math.PI / 2;
    return { ...system, x: centerX + orbitRadius * Math.cos(angle), y: centerY + orbitRadius * Math.sin(angle) };
  });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 mb-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4">
        <div className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold dark:text-gray-400">Cross-Domain Intelligence</div>
        <div className="text-lg font-bold text-gray-800 mt-1 dark:text-white/90">Unified Experience Map</div>
        <div className="text-sm text-gray-600 mt-1 dark:text-gray-400">Layer 3 Intelligence connects all your club systems in real time. Hover over nodes to see live data signals.</div>
      </div>

      <div className="flex justify-center items-center min-h-[500px] relative">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="max-w-full h-auto">
          {nodePositions.map((node) => (
            <line key={`line-${node.id}`} x1={centerX} y1={centerY} x2={node.x} y2={node.y}
              stroke={node.connected ? '#ff8b00' : '#e4e7ec'} strokeWidth={node.connected ? 3 : 2}
              strokeDasharray={node.connected ? '0' : '8,4'} opacity={node.connected ? 0.6 : 0.3}
              style={{ transition: 'all 0.3s ease' }}
            />
          ))}

          <g>
            <circle cx={centerX} cy={centerY} r={centerRadius} fill="#ff8b00" stroke="#ff8b00" strokeWidth={4}
              style={{ filter: 'drop-shadow(0 0 20px rgba(70,95,255,0.4))' }} />
            <text x={centerX} y={centerY - 10} textAnchor="middle" fill="white" fontSize="16" fontWeight="700">Layer 3</text>
            <text x={centerX} y={centerY + 10} textAnchor="middle" fill="white" fontSize="16" fontWeight="700">Intelligence</text>
          </g>

          {nodePositions.map((node) => {
            const isHovered = hoveredNode === node.id;
            return (
              <g key={node.id} onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)} style={{ cursor: 'pointer' }}>
                <circle cx={node.x} cy={node.y} r={nodeRadius}
                  fill={node.connected ? 'rgba(70,95,255,0.13)' : '#f9fafb'}
                  stroke={node.connected ? '#ff8b00' : '#98a2b3'} strokeWidth={isHovered ? 4 : 3}
                  style={{ transition: 'all 0.3s ease', filter: node.connected && isHovered ? 'drop-shadow(0 0 12px rgba(70,95,255,0.4))' : 'none' }}
                />
                <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="middle"
                  fill={node.connected ? '#ff8b00' : '#98a2b3'} fontSize="14" fontWeight="600"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {node.label}
                </text>
                {node.connected && (
                  <circle cx={node.x + nodeRadius - 15} cy={node.y - nodeRadius + 15} r={6} fill="#12b76a" stroke="white" strokeWidth={2} />
                )}
              </g>
            );
          })}
        </svg>

        {hoveredNode && (
          <div className="absolute top-5 right-5 bg-white border-2 border-brand-500 rounded-xl p-4 max-w-[280px] shadow-theme-lg z-10 dark:bg-white/[0.03]">
            {(() => {
              const node = SYSTEMS.find((s) => s.id === hoveredNode);
              return (
                <>
                  <div className="text-base font-bold text-gray-800 mb-2 dark:text-white/90">{node.label}</div>
                  <div className={`text-xs font-semibold uppercase tracking-widest mb-2 ${node.connected ? 'text-success-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {node.connected ? `\u25CF Connected \u2014 ${node.lastSync}` : '\u25CB Available'}
                  </div>
                  {node.connected && (
                    <>
                      <div className="text-xs text-gray-500 mb-1 font-semibold dark:text-gray-400">Live Signals:</div>
                      <ul className="m-0 pl-4 text-xs text-gray-600 dark:text-gray-400">
                        {node.signals.map((signal) => (<li key={signal}>{signal}</li>))}
                      </ul>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      <div className="mt-4 px-4 py-3 bg-gray-100 rounded-lg text-sm text-gray-600 text-center dark:bg-gray-800 dark:text-gray-400">
        <strong className="text-gray-800 dark:text-white/90">Layer 3 Intelligence:</strong>
        {' '}Correlates data across all systems to answer questions no single source can answer.
      </div>
    </div>
  );
}
