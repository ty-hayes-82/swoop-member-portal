// IntegrationMap — SVG constellation showing category nodes + cross-category edges
import { useState } from 'react';
import { useMapLayout } from '@/hooks/useMapLayout';

const NODE_R = 30;

export default function IntegrationMap({
  categories = [], vendors = [], combos = [],
  activeCategory = null, onSelectCategory,
  width = 580, height = 440,
}) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const { nodes, edges } = useMapLayout(categories, vendors, combos, width, height);

  return (
    <div className="relative w-full mx-auto" style={{ maxWidth: width }}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="block overflow-visible">

        {/* Cross-category edges */}
        {edges.map(edge => {
          const isLit = hoveredNode
            ? edge.catA === hoveredNode || edge.catB === hoveredNode
            : activeCategory
              ? edge.catA === activeCategory || edge.catB === activeCategory
              : true;
          const isHov = hoveredEdge === edge.id;
          return (
            <path key={edge.id} d={edge.path}
              stroke="#ff8b00" strokeWidth={isHov ? 2 : 1.5}
              fill="none" strokeLinecap="round"
              opacity={isLit ? (isHov ? 0.8 : 0.3) : 0.05}
              style={{ transition: 'opacity 0.2s, stroke-width 0.15s', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredEdge(edge.id)}
              onMouseLeave={() => setHoveredEdge(null)}
            />
          );
        })}

        {/* Category nodes */}
        {nodes.map(node => {
          const isActive  = activeCategory === node.id;
          const isHov     = hoveredNode === node.id;
          const r         = isActive || isHov ? NODE_R + 4 : NODE_R;
          const words = node.label.split(' ');
          const mid   = Math.ceil(words.length / 2);
          const line1 = words.slice(0, mid).join(' ');
          const line2 = words.slice(mid).join(' ');

          return (
            <g key={node.id} style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onSelectCategory?.(node.id)}
            >
              <circle cx={node.x} cy={node.y} r={r + 8}
                fill="#ff8b00" opacity={isActive || isHov ? 0.12 : 0.05}
                style={{ transition: 'all 0.15s' }}
              />
              <circle cx={node.x} cy={node.y} r={r}
                fill={isActive ? '#ff8b00' : '#ffffff'}
                stroke="#ff8b00" strokeWidth={isActive ? 0 : 2}
                style={{ transition: 'all 0.15s' }}
              />
              <text x={node.x} y={node.y - 5}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={isActive ? 17 : 15}
                style={{ pointerEvents: 'none', userSelect: 'none', transition: 'font-size 0.15s' }}>
                {node.icon}
              </text>
              <text x={node.x} y={node.y + 12}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="8" fontWeight="700"
                fill={isActive ? '#ffffff' : '#ff8b00'}
                style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'monospace', transition: 'fill 0.15s' }}>
                {node.count}
              </text>
              {node.hasConnected && (
                <circle cx={node.x + r - 5} cy={node.y - r + 5} r={4}
                  fill="#12b76a" stroke="#ffffff" strokeWidth={1.5}
                />
              )}
              <text x={node.x} y={node.y + r + 13}
                textAnchor="middle" fontSize="8" fontWeight="600"
                fill={isActive ? '#ff8b00' : '#667085'}
                style={{ pointerEvents: 'none', userSelect: 'none', textTransform: 'uppercase', letterSpacing: '0.04em', transition: 'fill 0.15s' }}>
                {line1}
              </text>
              {line2 && (
                <text x={node.x} y={node.y + r + 23}
                  textAnchor="middle" fontSize="8" fontWeight="600"
                  fill={isActive ? '#ff8b00' : '#667085'}
                  style={{ pointerEvents: 'none', userSelect: 'none', textTransform: 'uppercase', letterSpacing: '0.04em', transition: 'fill 0.15s' }}>
                  {line2}
                </text>
              )}
            </g>
          );
        })}

        {/* Center Swoop mark */}
        <circle cx={width / 2} cy={height / 2} r={26} fill="#1d2939" />
        <text x={width / 2} y={height / 2 - 4} textAnchor="middle" dominantBaseline="middle"
          fontSize="7" fontWeight="800" fill="#ff8b00"
          style={{ letterSpacing: '0.1em', userSelect: 'none' }}>
          SWOOP
        </text>
        <text x={width / 2} y={height / 2 + 7} textAnchor="middle" dominantBaseline="middle"
          fontSize="5" fill="rgba(255,255,255,0.5)"
          style={{ letterSpacing: '0.06em', userSelect: 'none' }}>
          GOLF
        </text>
      </svg>

      {/* Active category label */}
      {activeCategory && (() => {
        const cat = categories.find(c => c.id === activeCategory);
        if (!cat) return null;
        return (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg px-3.5 py-1.5 pointer-events-none shadow-theme-md whitespace-nowrap z-10 dark:bg-white/[0.03] dark:border-gray-800">
            <span className="text-[11px] text-gray-800 font-semibold dark:text-white/90">
              {cat.icon} {cat.label}
            </span>
            <span className="text-[10px] text-gray-500 ml-1.5 dark:text-gray-400">
              \u2014 click again to clear
            </span>
          </div>
        );
      })()}
    </div>
  );
}
