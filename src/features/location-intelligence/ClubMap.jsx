import { useEffect, useRef, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { theme } from '@/config/theme';

// Oakmont Hills CC — placed on a real Scottsdale golf course footprint
const CENTER = [33.6095, -111.8985];
const DEFAULT_ZOOM = 17;

const ZONES = [
  { id: 'clubhouse', label: 'Clubhouse', coords: [[33.6098, -111.8992], [33.6098, -111.8978], [33.6093, -111.8978], [33.6093, -111.8992]], color: '#F3922D' },
  { id: 'grill-room', label: 'Grill Room', coords: [[33.6097, -111.8990], [33.6097, -111.8985], [33.6095, -111.8985], [33.6095, -111.8990]], color: '#F3922D' },
  { id: 'main-dining', label: 'Main Dining', coords: [[33.6097, -111.8985], [33.6097, -111.8980], [33.6095, -111.8980], [33.6095, -111.8985]], color: '#F3922D' },
  { id: 'pro-shop', label: 'Pro Shop', coords: [[33.6100, -111.8988], [33.6100, -111.8982], [33.6098, -111.8982], [33.6098, -111.8988]], color: '#2E7BB8' },
  { id: 'driving-range', label: 'Driving Range', coords: [[33.6105, -111.8998], [33.6105, -111.8980], [33.6102, -111.8980], [33.6102, -111.8998]], color: '#7B5DC0' },
  { id: 'pool', label: 'Pool & Fitness', coords: [[33.6092, -111.8995], [33.6092, -111.8988], [33.6089, -111.8988], [33.6089, -111.8995]], color: '#2E7BB8' },
  { id: 'tennis', label: 'Tennis Courts', coords: [[33.6092, -111.8975], [33.6092, -111.8968], [33.6089, -111.8968], [33.6089, -111.8975]], color: '#7B5DC0' },
  { id: 'parking', label: 'Parking', coords: [[33.6088, -111.8998], [33.6088, -111.8975], [33.6085, -111.8975], [33.6085, -111.8998]], color: '#444' },
];

const HEALTH_COLORS = {
  healthy: '#22c55e',
  watch: '#eab308',
  'at-risk': '#F3922D',
  critical: '#dc2626',
};

function ClubMap({ members, selectedMemberId, onSelectMember, densityByZone }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const heatLayerRef = useRef(null);

  // Initialize map once
  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    // Esri satellite imagery (free, no API key)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 20 }
    ).addTo(map);

    // Subtle road labels overlay
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 20, opacity: 0.35 }
    ).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Zone polygons with dashed outlines
    ZONES.forEach((zone) => {
      const polygon = L.polygon(zone.coords, {
        color: zone.color,
        weight: 2,
        opacity: 0.7,
        fillColor: zone.color,
        fillOpacity: 0.15,
        dashArray: '6 4',
      }).addTo(map);
      polygon.bindTooltip(zone.label, {
        permanent: true,
        direction: 'center',
        className: 'zone-label',
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Heatmap layer — Tableau-style gradient
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !members.length) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    const heatPoints = members.map((m) => {
      const intensity =
        m.status === 'critical' ? 1.0 :
        m.status === 'at-risk' ? 0.8 :
        m.status === 'watch' ? 0.5 : 0.3;
      return [m.lat, m.lng, intensity];
    });

    heatLayerRef.current = L.heatLayer(heatPoints, {
      radius: 35,
      blur: 25,
      maxZoom: 19,
      max: 1.0,
      gradient: {
        0.15: '#3b82f6',
        0.35: '#22c55e',
        0.55: '#eab308',
        0.75: '#F3922D',
        1.0: '#dc2626',
      },
    }).addTo(map);
  }, [members]);

  // Member markers with pulse animation for at-risk
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    members.forEach((member) => {
      const isSelected = member.memberId === selectedMemberId;
      const color = HEALTH_COLORS[member.status] || '#888';
      const size = isSelected ? 16 : member.needsAttention ? 12 : 9;

      const pulseHtml = member.needsAttention
        ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:30px;height:30px;border-radius:50%;border:2px solid ${color};animation:pulse-ring 2s ease-out infinite;opacity:0.6;"></div>`
        : '';

      const icon = L.divIcon({
        className: 'member-dot',
        html: `<div style="position:relative;">${pulseHtml}<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid ${isSelected ? '#fff' : 'rgba(0,0,0,0.5)'};box-shadow:0 0 8px ${color}40;position:relative;z-index:2;"></div></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([member.lat, member.lng], { icon }).addTo(map);

      marker.bindTooltip(
        `<div style="font-family:system-ui;font-size:12px;line-height:1.5;min-width:160px;">` +
        `<strong>${member.name}</strong><br/>` +
        `<span style="color:${color};">\u25cf </span>${member.status} \u00b7 Score ${member.healthScore}<br/>` +
        `<span style="opacity:0.7;">${member.zone} \u00b7 ${member.timeInZone}</span>` +
        (member.needsAttention ? `<br/><strong style="color:#F3922D;">\u26a0 Needs attention</strong>` : '') +
        `</div>`,
        { direction: 'top', offset: [0, -10] }
      );

      marker.on('click', () => onSelectMember?.(member.memberId));
      markersRef.current.push(marker);
    });
  }, [members, selectedMemberId, onSelectMember]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: theme.radius.md, overflow: 'hidden' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <style>{`
        .zone-label {
          background: rgba(0,0,0,0.75) !important;
          border: 1px solid rgba(243,146,45,0.4) !important;
          color: #fff !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          padding: 2px 8px !important;
          border-radius: 4px !important;
          box-shadow: none !important;
          letter-spacing: 0.03em !important;
        }
        .zone-label::before { display: none !important; }
        .member-dot { background: none !important; border: none !important; }
        @keyframes pulse-ring {
          0% { transform: translate(-50%,-50%) scale(0.5); opacity: 0.7; }
          100% { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
        }
        .leaflet-container { background: #1a1a1a !important; }
      `}</style>
    </div>
  );
}

export default memo(ClubMap);
