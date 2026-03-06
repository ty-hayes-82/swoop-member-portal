// IntegrationMap — SVG constellation showing 28 vendor nodes grouped by category
// Props: categories, vendors, combos, selectedVendorId, onSelectVendor, width, height
// Sprint 4: category arc strokes, 28-node layout, vendor-driven selection
import { useState } from 'react';
import { theme } from '@/config/theme';
import { useMapLayout } from '@/hooks/useMapLayout';

export default function IntegrationMap({
  categories = [], vendors = [], combos = [],
  selectedVendorId = null, onSelectVendor,
  width = 640, height = 460,
}) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const { nodes, arcs, edges } = useMapLayout(categories, vendors, combos, width, height);
  const nodeR = 13;

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: width, margin: '0 auto' }}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', overflow: 'visible' }}>

        {/* Category arc strokes */}
        {arcs.map(arc => {
          const color   = theme.colors[arc.themeColor] ?? theme.colors.accent;
          const isActive = hoveredNode
            ? vendors.find(v => v.id === hoveredNode)?.categoryId === arc.id
            : false;
          return (
            <path key={arc.id} d={arc.path}
              stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round"
              opacity={isActive ? 0.6 : 0.2}
              style={{ transition: 'opacity 0.2s' }}
            />
          );
        })}

        {/* Combo edges */}
        {edges.map(edge => {
          const isLit  = hoveredNode ? edge.systems.includes(hoveredNode) : true;
          const isHov  = hoveredEdge === edge.id;
          const color  = theme.colors[edge.themeColor] ?? theme.colors.accent;
          return (
            <path key={edge.id} d={edge.path}
              stroke={color} strokeWidth={isHov ? 2 : 1}
              fill="none" strokeLinecap="round"
              opacity={isLit ? (isHov ? 0.85 : 0.28) : 0.04}
              style={{ transition: 'opacity 0.2s, stroke-width 0.15s', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredEdge(edge.id)}
              onMouseLeave={() => setHoveredEdge(null)}
            />
          );
        })}

        {/* Vendor nodes */}
        {nodes.map(node => {
          const isSelected = selectedVendorId === node.id;
          const isHov      = hoveredNode === node.id;
          const color      = theme.colors[node.themeColor] ?? theme.colors.accent;
          const r          = isSelected || isHov ? nodeR + 3 : nodeR;
          return (
            <g key={node.id} style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onSelectVendor?.(node.id)}
            >
              <circle cx={node.x} cy={node.y} r={r + 5}
                fill={color} opacity={0.07}
                style={{ transition: 'all 0.15s' }}
              />
              <circle cx={node.x} cy={node.y} r={r}
                fill={isSelected ? color : theme.colors.bgCard}
                stroke={color} strokeWidth={isSelected ? 0 : 1.5}
                style={{ transition: 'all 0.15s' }}
              />
              <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="middle"
                fontSize={isSelected ? '11' : '10'}
                style={{ pointerEvents: 'none', userSelect: 'none' }}>
                {node.icon}
              </text>
            </g>
          );
        })}

        {/* Center Swoop mark */}
        <circle cx={width / 2} cy={height / 2} r={22} fill={theme.colors.bgSidebar} />
        <text x={width / 2} y={height / 2 - 3} textAnchor="middle" dominantBaseline="middle"
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

      {/* Edge tooltip */}
      {hoveredEdge && (() => {
        const edge  = edges.find(e => e.id === hoveredEdge);
        const combo = edge?.combo;
        if (!combo) return null;
        return (
          <div style={{
            position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
            background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.sm, padding: '6px 12px', pointerEvents: 'none',
            boxShadow: theme.shadow.md, whiteSpace: 'nowrap', zIndex: 10,
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: theme.colors.textPrimary }}>
              {combo.label}
            </span>
            <span style={{ fontSize: '10px', color: theme.colors.accent, marginLeft: '6px',
              fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Swoop Only
            </span>
          </div>
        );
      })()}
    </div>
  );
}
