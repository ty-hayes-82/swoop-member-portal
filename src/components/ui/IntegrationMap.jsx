// IntegrationMap — SVG constellation showing 10 category nodes + cross-category edges
// Props: categories[], vendors[], combos[], activeCategory (string|null), onSelectCategory fn
// Click a node = select/deselect that category (syncs with CategoryFilterBar)
import { useState } from 'react';
import { theme } from '@/config/theme';
import { useMapLayout } from '@/hooks/useMapLayout';

const NODE_R = 30; // base radius for category circles

export default function IntegrationMap({
  categories = [], vendors = [], combos = [],
  activeCategory = null, onSelectCategory,
  width = 580, height = 440,
}) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const { nodes, edges } = useMapLayout(categories, vendors, combos, width, height);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: width, margin: '0 auto' }}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', overflow: 'visible' }}>

        {/* Cross-category edges */}
        {edges.map(edge => {
          const isLit = hoveredNode
            ? edge.catA === hoveredNode || edge.catB === hoveredNode
            : activeCategory
              ? edge.catA === activeCategory || edge.catB === activeCategory
              : true;
          const isHov = hoveredEdge === edge.id;
          const color = theme.colors[edge.themeColor] ?? theme.colors.accent;
          return (
            <path key={edge.id} d={edge.path}
              stroke={color} strokeWidth={isHov ? 2 : 1.5}
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
          const color     = theme.colors[node.themeColor] ?? theme.colors.accent;
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
              {/* Glow ring */}
              <circle cx={node.x} cy={node.y} r={r + 8}
                fill={color} opacity={isActive || isHov ? 0.12 : 0.05}
                style={{ transition: 'all 0.15s' }}
              />
              {/* Main circle */}
              <circle cx={node.x} cy={node.y} r={r}
                fill={isActive ? color : theme.colors.bgCard}
                stroke={color} strokeWidth={isActive ? 0 : 2}
                style={{ transition: 'all 0.15s' }}
              />
              {/* Icon */}
              <text x={node.x} y={node.y - 5}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={isActive ? 17 : 15}
                style={{ pointerEvents: 'none', userSelect: 'none', transition: 'font-size 0.15s' }}>
                {node.icon}
              </text>
              {/* Vendor count badge */}
              <text x={node.x} y={node.y + 12}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="8" fontWeight="700"
                fill={isActive ? theme.colors.bgCard : color}
                style={{ pointerEvents: 'none', userSelect: 'none',
                  fontFamily: theme.fonts.mono, transition: 'fill 0.15s' }}>
                {node.count}
              </text>
              {/* Connected dot */}
              {node.hasConnected && (
                <circle cx={node.x + r - 5} cy={node.y - r + 5} r={4}
                  fill={theme.colors.success} stroke={theme.colors.bgCard} strokeWidth={1.5}
                />
              )}
              {/* Label below node */}
              <text x={node.x} y={node.y + r + 13}
                textAnchor="middle" fontSize="8" fontWeight="600"
                fill={isActive ? color : theme.colors.textMuted}
                style={{ pointerEvents: 'none', userSelect: 'none',
                  fontFamily: theme.fonts.sans, textTransform: 'uppercase',
                  letterSpacing: '0.04em', transition: 'fill 0.15s' }}>
                {line1}
              </text>
              {line2 && (
                <text x={node.x} y={node.y + r + 23}
                  textAnchor="middle" fontSize="8" fontWeight="600"
                  fill={isActive ? color : theme.colors.textMuted}
                  style={{ pointerEvents: 'none', userSelect: 'none',
                    fontFamily: theme.fonts.sans, textTransform: 'uppercase',
                    letterSpacing: '0.04em', transition: 'fill 0.15s' }}>
                  {line2}
                </text>
              )}
            </g>
          );
        })}

        {/* Center Swoop mark */}
        <circle cx={width / 2} cy={height / 2} r={26} fill={theme.colors.bgSidebar} />
        <text x={width / 2} y={height / 2 - 4} textAnchor="middle" dominantBaseline="middle"
          fontSize="7" fontWeight="800" fill={theme.colors.accent}
          style={{ fontFamily: theme.fonts.sans, letterSpacing: '0.1em', userSelect: 'none' }}>
          SWOOP
        </text>
        <text x={width / 2} y={height / 2 + 7} textAnchor="middle" dominantBaseline="middle"
          fontSize="5" fill={`${theme.colors.bgCard}80`}
          style={{ fontFamily: theme.fonts.sans, letterSpacing: '0.06em', userSelect: 'none' }}>
          GOLF
        </text>
      </svg>

      {/* Active category label */}
      {activeCategory && (() => {
        const cat = categories.find(c => c.id === activeCategory);
        if (!cat) return null;
        return (
          <div style={{
            position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
            background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.sm, padding: '5px 14px', pointerEvents: 'none',
            boxShadow: theme.shadow.md, whiteSpace: 'nowrap', zIndex: 10,
          }}>
            <span style={{ fontSize: '11px', color: theme.colors.textPrimary, fontWeight: 600 }}>
              {cat.icon} {cat.label}
            </span>
            <span style={{ fontSize: '10px', color: theme.colors.textMuted, marginLeft: '6px' }}>
              — click again to clear
            </span>
          </div>
        );
      })()}
    </div>
  );
}
