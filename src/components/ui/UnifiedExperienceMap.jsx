import { useState } from 'react';
import { theme } from '@/config/theme';

// System node definitions - connected systems light up green, available systems stay gray
const SYSTEMS = [
  {
    id: 'tee-sheet',
    label: 'Tee Sheet',
    connected: true,
    lastSync: '2 min ago',
    signals: ['Round bookings', 'Cancellations', 'Pace of play'],
  },
  {
    id: 'pos-fb',
    label: 'POS/F&B',
    connected: true,
    lastSync: '5 min ago',
    signals: ['Dining spend', 'Check averages', 'Outlet mix'],
  },
  {
    id: 'crm',
    label: 'Member CRM',
    connected: true,
    lastSync: '1 hour ago',
    signals: ['Member profiles', 'Dues status', 'Lifecycle notes'],
  },
  {
    id: 'scheduling',
    label: 'Scheduling',
    connected: true,
    lastSync: '10 min ago',
    signals: ['Staff coverage', 'Labor hours', 'Shift patterns'],
  },
  {
    id: 'complaints',
    label: 'Feedback',
    connected: true,
    lastSync: '30 min ago',
    signals: ['Service issues', 'Complaint themes', 'Response time'],
  },
  {
    id: 'weather',
    label: 'Weather',
    connected: true,
    lastSync: 'Live',
    signals: ['Conditions', 'Forecasts', 'Impact predictions'],
  },
  {
    id: 'gps-app',
    label: 'Swoop App',
    connected: true,
    lastSync: 'Live',
    signals: ['GPS tracking', 'In-app orders', 'Push engagement'],
  },
];

export default function UnifiedExperienceMap() {
  const [hoveredNode, setHoveredNode] = useState(null);

  // SVG dimensions and layout
  const width = 800;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;
  const centerRadius = 70;
  const nodeRadius = 50;
  const orbitRadius = 200;

  // Calculate positions for nodes in a circle around the center
  const nodePositions = SYSTEMS.map((system, index) => {
    const angle = (index * 2 * Math.PI) / SYSTEMS.length - Math.PI / 2; // Start from top
    return {
      ...system,
      x: centerX + orbitRadius * Math.cos(angle),
      y: centerY + orbitRadius * Math.sin(angle),
    };
  });

  return (
    <div style={{
      background: theme.colors.bgCard,
      border: '1px solid ' + theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    }}>
      <div style={{ marginBottom: theme.spacing.md }}>
        <div style={{
          fontSize: '11px',
          color: theme.colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
        }}>
          Cross-Domain Intelligence
        </div>
        <div style={{
          fontSize: theme.fontSize.lg,
          fontWeight: 700,
          color: theme.colors.textPrimary,
          marginTop: '4px',
        }}>
          Unified Experience Map
        </div>
        <div style={{
          fontSize: theme.fontSize.sm,
          color: theme.colors.textSecondary,
          marginTop: '4px',
        }}>
          Layer 3 Intelligence connects all your club systems in real time. Hover over nodes to see live data signals.
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '500px',
        position: 'relative',
      }}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ maxWidth: '100%', height: 'auto' }}
        >
          {/* Connection lines from center to each system */}
          {nodePositions.map((node) => (
            <line
              key={`line-${node.id}`}
              x1={centerX}
              y1={centerY}
              x2={node.x}
              y2={node.y}
              stroke={node.connected ? theme.colors.accent : theme.colors.borderLight}
              strokeWidth={node.connected ? 3 : 2}
              strokeDasharray={node.connected ? '0' : '8,4'}
              opacity={node.connected ? 0.6 : 0.3}
              style={{
                transition: 'all 0.3s ease',
              }}
            />
          ))}

          {/* Center node - Layer 3 Intelligence (always lit) */}
          <g>
            <circle
              cx={centerX}
              cy={centerY}
              r={centerRadius}
              fill={theme.colors.accent}
              stroke={theme.colors.accent}
              strokeWidth={4}
              style={{
                filter: `drop-shadow(0 0 20px ${theme.colors.accent}66)`,
              }}
            />
            <text
              x={centerX}
              y={centerY - 10}
              textAnchor="middle"
              fill={theme.colors.white}
              fontSize="16"
              fontWeight="700"
            >
              Layer 3
            </text>
            <text
              x={centerX}
              y={centerY + 10}
              textAnchor="middle"
              fill={theme.colors.white}
              fontSize="16"
              fontWeight="700"
            >
              Intelligence
            </text>
          </g>

          {/* System nodes */}
          {nodePositions.map((node) => {
            const isHovered = hoveredNode === node.id;
            const nodeColor = node.connected ? theme.colors.accent : theme.colors.textMuted;
            const nodeFill = node.connected ? theme.colors.accent + '22' : theme.colors.bgDeep;

            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius}
                  fill={nodeFill}
                  stroke={nodeColor}
                  strokeWidth={isHovered ? 4 : 3}
                  style={{
                    transition: 'all 0.3s ease',
                    filter: node.connected && isHovered
                      ? `drop-shadow(0 0 12px ${theme.colors.accent}66)`
                      : 'none',
                  }}
                />
                
                {/* Node label */}
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={nodeColor}
                  fontSize="14"
                  fontWeight="600"
                  style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  {node.label}
                </text>

                {/* Status indicator dot */}
                {node.connected && (
                  <circle
                    cx={node.x + nodeRadius - 15}
                    cy={node.y - nodeRadius + 15}
                    r={6}
                    fill={theme.colors.success}
                    stroke={theme.colors.white}
                    strokeWidth={2}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip overlay - shown when hovering a node */}
        {hoveredNode && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: theme.colors.bgCard,
            border: `2px solid ${theme.colors.accent}`,
            borderRadius: theme.radius.md,
            padding: '16px',
            maxWidth: '280px',
            boxShadow: theme.shadow.lg,
            zIndex: 10,
          }}>
            {(() => {
              const node = SYSTEMS.find((s) => s.id === hoveredNode);
              return (
                <>
                  <div style={{
                    fontSize: theme.fontSize.md,
                    fontWeight: 700,
                    color: theme.colors.textPrimary,
                    marginBottom: '8px',
                  }}>
                    {node.label}
                  </div>
                  <div style={{
                    fontSize: theme.fontSize.xs,
                    color: node.connected ? theme.colors.success : theme.colors.textMuted,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '8px',
                  }}>
                    {node.connected ? `● Connected — ${node.lastSync}` : '○ Available'}
                  </div>
                  {node.connected && (
                    <>
                      <div style={{
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.textMuted,
                        marginBottom: '4px',
                        fontWeight: 600,
                      }}>
                        Live Signals:
                      </div>
                      <ul style={{
                        margin: 0,
                        paddingLeft: '16px',
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.textSecondary,
                      }}>
                        {node.signals.map((signal) => (
                          <li key={signal}>{signal}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      <div style={{
        marginTop: theme.spacing.md,
        padding: '12px 16px',
        background: theme.colors.bgDeep,
        borderRadius: theme.radius.sm,
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
      }}>
        <strong style={{ color: theme.colors.textPrimary }}>
          Layer 3 Intelligence:
        </strong>
        {' '}Correlates data across all systems to answer questions no single source can answer.
      </div>
    </div>
  );
}
