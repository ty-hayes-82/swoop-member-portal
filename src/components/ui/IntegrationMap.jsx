// IntegrationMap — SVG constellation showing system nodes + combo edges
// Props: systems, combos, selectedIds, onSelectSystem, width, height
import { useState } from 'react';
import { theme } from '@/config/theme';
import { useMapLayout } from '@/hooks/useMapLayout';

export default function IntegrationMap({ systems, combos, selectedIds, onSelectSystem, width = 520, height = 380 }) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const { nodes, edges } = useMapLayout(systems, combos, width, height);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: width, margin: '0 auto' }}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
        {/* Edges */}
        {edges.map(edge => {
          const isActive = hoveredNode ? edge.systems.includes(hoveredNode) : true;
          const isHovered = hoveredEdge === edge.id;
          const color = theme.colors[edge.themeColor] ?? theme.colors.accent;
          return (
            <path key={edge.id} d={edge.path}
              stroke={color} strokeWidth={isHovered ? 2.5 : 1.5}
              fill="none" strokeLinecap="round"
              opacity={isActive ? (isHovered ? 0.9 : 0.35) : 0.05}
              style={{ transition: 'opacity 0.2s, stroke-width 0.2s', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredEdge(edge.id)}
              onMouseLeave={() => setHoveredEdge(null)}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const isSelected = selectedIds.includes(node.id);
          const isHovered = hoveredNode === node.id;
          const color = theme.colors[node.themeColor] ?? theme.colors.accent;
          const r = isSelected || isHovered ? 32 : 28;
          return (
            <g key={node.id} style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onSelectSystem(node.id)}
            >
              <circle cx={node.x} cy={node.y} r={r + 6} fill={color} opacity={0.08} style={{ transition: 'all 0.15s' }} />
              <circle cx={node.x} cy={node.y} r={r} fill={isSelected ? color : theme.colors.bgCard}
                stroke={color} strokeWidth={isSelected ? 0 : 2}
                style={{ transition: 'all 0.15s' }} />
              <text x={node.x} y={node.y - 2} textAnchor="middle" dominantBaseline="middle"
                fontSize="16" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                {node.icon}
              </text>
              <text x={node.x} y={node.y + r + 12} textAnchor="middle"
                fontSize="9" fontWeight="700" fill={color}
                style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {node.name.length > 10 ? node.name.slice(0, 9) + '…' : node.name}
              </text>
            </g>
          );
        })}

        {/* Center Swoop wordmark */}
        <circle cx={width / 2} cy={height / 2} r={26} fill={theme.colors.bgSidebar} />
        <text x={width / 2} y={height / 2 - 4} textAnchor="middle" dominantBaseline="middle"
          fontSize="8" fontWeight="800" fill={theme.colors.accent}
          style={{ fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.1em', userSelect: 'none' }}>
          SWOOP
        </text>
        <text x={width / 2} y={height / 2 + 8} textAnchor="middle" dominantBaseline="middle"
          fontSize="6" fill="#FFFFFF80" style={{ fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.06em', userSelect: 'none' }}>
          GOLF
        </text>
      </svg>

      {/* Edge tooltip */}
      {hoveredEdge && (() => {
        const edge = edges.find(e => e.id === hoveredEdge);
        const combo = edge?.combo;
        if (!combo) return null;
        return (
          <div style={{
            position: 'absolute', top: '8px', right: '8px',
            background: theme.colors.bgCard, border: `1px solid ${theme.colors.border ?? '#E5E5E5'}`,
            borderRadius: theme.radius.sm, padding: '8px 12px', maxWidth: '220px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: theme.colors.textPrimary, marginBottom: '2px' }}>{combo.label}</div>
            <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>{combo.preview.value} — {combo.preview.subtext}</div>
          </div>
        );
      })()}
    </div>
  );
}
