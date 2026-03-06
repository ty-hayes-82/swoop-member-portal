// useMapLayout — computes node positions, category arc segments, and edge paths
// Used by IntegrationMap. Sprint 4: supports categories + vendors (28-vendor layout).
// Returns: { nodes, arcs, edges }
import { useMemo } from 'react';

const GAP = 0.05; // radians gap between category segments on the ring

export function useMapLayout(categories, vendors, combos, width, height) {
  return useMemo(() => {
    const cx = width / 2, cy = height / 2;
    const radius = Math.min(width, height) * 0.38;
    const arcR   = radius + 20;
    const total  = vendors.length || 1;

    // Build per-category angle ranges proportional to vendor count
    let cursor = -Math.PI / 2;
    const catRanges = {};
    categories.forEach(cat => {
      const cv = vendors.filter(v => v.categoryId === cat.id);
      if (!cv.length) return;
      const span = (cv.length / total) * 2 * Math.PI;
      catRanges[cat.id] = { start: cursor, span, vendors: cv, cat };
      cursor += span;
    });

    // Place vendor nodes evenly within each category's arc segment
    const nodes = [];
    Object.values(catRanges).forEach(({ start, span, vendors: cv }) => {
      cv.forEach((v, i) => {
        const frac  = cv.length === 1 ? 0.5 : i / (cv.length - 1);
        const angle = start + GAP / 2 + frac * (span - GAP);
        nodes.push({
          ...v,
          x: Math.round(cx + radius * Math.cos(angle)),
          y: Math.round(cy + radius * Math.sin(angle)),
        });
      });
    });

    // Build SVG arc strokes for each category
    const arcs = Object.values(catRanges).map(({ start, span, cat }) => {
      const a1 = start + GAP / 2, a2 = start + span - GAP / 2;
      const x1 = Math.round(cx + arcR * Math.cos(a1));
      const y1 = Math.round(cy + arcR * Math.sin(a1));
      const x2 = Math.round(cx + arcR * Math.cos(a2));
      const y2 = Math.round(cy + arcR * Math.sin(a2));
      const large = (span - GAP) > Math.PI ? 1 : 0;
      return {
        id: cat.id,
        themeColor: cat.themeColor,
        midAngle: start + span / 2,
        path: `M ${x1} ${y1} A ${arcR} ${arcR} 0 ${large} 1 ${x2} ${y2}`,
      };
    });

    // Build bezier edges from combo system pairs
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
    const edges = combos.map(combo => {
      const [aId, bId] = combo.systems;
      const a = nodeMap[aId], b = nodeMap[bId];
      if (!a || !b) return null;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const dx = cx - mx, dy = cy - my;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const cpx = mx + (dx / dist) * dist * 0.3;
      const cpy = my + (dy / dist) * dist * 0.3;
      const srcV = vendors.find(v => v.id === aId);
      return {
        id: combo.id,
        path: `M ${a.x} ${a.y} Q ${cpx} ${cpy} ${b.x} ${b.y}`,
        systems: combo.systems,
        themeColor: srcV?.themeColor ?? 'operations',
        combo,
      };
    }).filter(Boolean);

    return { nodes, arcs, edges };
  }, [categories, vendors, combos, width, height]);
}
