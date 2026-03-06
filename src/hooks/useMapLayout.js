// useMapLayout — computes 10 category node positions + category-pair edges
// Returns: { nodes, edges }
// nodes: category circles placed evenly around a ring
// edges: one per unique category-pair that shares a combo
import { useMemo } from 'react';

export function useMapLayout(categories, vendors, combos, width, height) {
  return useMemo(() => {
    const cx = width / 2, cy = height / 2;
    const radius = Math.min(width, height) * 0.38;
    const count  = categories.length || 1;

    // Vendor count per category (for node sizing)
    const vendorCount = {};
    const connectedCats = new Set();
    vendors.forEach(v => {
      vendorCount[v.categoryId] = (vendorCount[v.categoryId] ?? 0) + 1;
      if (v.status === 'connected') connectedCats.add(v.categoryId);
    });

    // Place category nodes evenly around the ring, starting top
    const nodes = categories.map((cat, i) => {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      return {
        ...cat,
        x: Math.round(cx + radius * Math.cos(angle)),
        y: Math.round(cy + radius * Math.sin(angle)),
        count: vendorCount[cat.id] ?? 0,
        hasConnected: connectedCats.has(cat.id),
      };
    });

    // Build vendor → categoryId lookup
    const vendorCat = {};
    vendors.forEach(v => { vendorCat[v.id] = v.categoryId; });

    // Build unique category-pair edges from combos
    const nodeMap  = Object.fromEntries(nodes.map(n => [n.id, n]));
    const seenPairs = new Set();
    const edges = [];

    combos.forEach(combo => {
      const [aV, bV] = combo.systems;
      const aCat = vendorCat[aV], bCat = vendorCat[bV];
      if (!aCat || !bCat || aCat === bCat) return;
      const pairKey = [aCat, bCat].sort().join('|');
      if (seenPairs.has(pairKey)) return;
      seenPairs.add(pairKey);

      const a = nodeMap[aCat], b = nodeMap[bCat];
      if (!a || !b) return;

      // Bezier bowing inward toward center
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const dx = cx - mx, dy = cy - my;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const cpx  = mx + (dx / dist) * dist * 0.3;
      const cpy  = my + (dy / dist) * dist * 0.3;

      edges.push({
        id: pairKey,
        path: `M ${a.x} ${a.y} Q ${cpx} ${cpy} ${b.x} ${b.y}`,
        catA: aCat, catB: bCat,
        themeColor: categories.find(c => c.id === aCat)?.themeColor ?? 'operations',
      });
    });

    return { nodes, edges };
  }, [categories, vendors, combos, width, height]);
}
