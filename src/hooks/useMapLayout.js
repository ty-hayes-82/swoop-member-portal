// useMapLayout — computes node positions and edge paths for IntegrationMap
// Returns: { nodes: [{id, x, y, ...}], edges: [{id, path, systems, themeColor, combo}] }
import { useMemo } from 'react';
import { theme } from '@/config/theme';

export function useMapLayout(systems, combos, width, height) {
  return useMemo(() => {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.36;
    const count = systems.length;

    // Arrange nodes in a circle; start at top (-90 deg)
    const nodes = systems.map((sys, i) => {
      const angle = ((i / count) * 2 * Math.PI) - Math.PI / 2;
      return {
        ...sys,
        x: Math.round(cx + radius * Math.cos(angle)),
        y: Math.round(cy + radius * Math.sin(angle)),
      };
    });

    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

    // Build one edge per combo (connecting the two primary systems)
    const edges = combos.map(combo => {
      const [aId, bId] = combo.systems;
      const a = nodeMap[aId];
      const b = nodeMap[bId];
      if (!a || !b) return null;

      // Cubic bezier bowing inward toward center
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const dx = cx - mx;
      const dy = cy - my;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const bow = 0.35;
      const cpx = mx + (dx / dist) * dist * bow;
      const cpy = my + (dy / dist) * dist * bow;

      const srcSys = systems.find(s => s.id === aId);
      return {
        id: combo.id,
        path: `M ${a.x} ${a.y} Q ${cpx} ${cpy} ${b.x} ${b.y}`,
        systems: combo.systems,
        themeColor: srcSys?.themeColor ?? 'operations',
        combo,
      };
    }).filter(Boolean);

    return { nodes, edges };
  }, [systems, combos, width, height]);
}
