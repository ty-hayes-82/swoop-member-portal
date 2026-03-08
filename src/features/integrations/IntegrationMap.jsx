import { useMemo } from 'react';
import { theme } from '@/config/theme';

const CATEGORY_COLORS = {
  'tee-sheet': theme.colors.integrationTeeSheet,
  pos: theme.colors.integrationPos,
  crm: theme.colors.integrationCrm,
  staffing: theme.colors.operations,
  waitlist: theme.colors.integrationWaitlist,
};

export function IntegrationMap({ systems, combos, activeSystemId, onSelectSystem }) {
  const width = 880;
  const height = 240;

  const nodes = useMemo(() => {
    const step = width / (systems.length + 1);
    return systems.map((system, index) => ({
      ...system,
      x: step * (index + 1),
      y: 120 + ((index % 2) * 28 - 14),
    }));
  }, [systems]);

  const links = useMemo(() => combos.map((combo) => {
    const a = nodes.find((node) => node.id === combo.systems[0]);
    const b = nodes.find((node) => node.id === combo.systems[1]);
    if (!a || !b) return null;
    return { id: combo.id, a, b };
  }).filter(Boolean), [combos, nodes]);

  return (
    <div style={{ background: theme.colors.white, border: `1px solid ${theme.colors.border}`, borderRadius: 12, marginBottom: 18, padding: 12 }}>
      <style>{`
        @keyframes edgePulse {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -24; }
        }
      `}</style>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        {links.map((link) => {
          const active = activeSystemId
            ? link.a.id === activeSystemId || link.b.id === activeSystemId
            : false;
          return (
            <line
              key={link.id}
              x1={link.a.x}
              y1={link.a.y}
              x2={link.b.x}
              y2={link.b.y}
              stroke={active ? theme.colors.operations : theme.colors.integrationLinkInactive}
              strokeWidth={active ? 2.5 : 1.5}
              strokeDasharray="6 6"
              style={active ? { animation: 'edgePulse 1.2s linear infinite' } : undefined}
            />
          );
        })}

        {nodes.map((node) => {
          const active = node.id === activeSystemId;
          const highlighted = activeSystemId && links.some((link) =>
            (link.a.id === activeSystemId && link.b.id === node.id)
            || (link.b.id === activeSystemId && link.a.id === node.id)
          );
          return (
            <g
              key={node.id}
              onClick={() => onSelectSystem(node.id)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={active ? 24 : 19}
                fill={active ? CATEGORY_COLORS[node.category] : theme.colors.white}
                stroke={CATEGORY_COLORS[node.category]}
                strokeWidth={active ? 0 : (highlighted ? 2.5 : 1.6)}
              />
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill={active ? theme.colors.white : CATEGORY_COLORS[node.category]}
              >
                {node.logo}
              </text>
              <text
                x={node.x}
                y={node.y + 36}
                textAnchor="middle"
                fontSize="10"
                fill={theme.colors.textMuted}
              >
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
