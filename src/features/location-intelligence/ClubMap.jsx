import { memo, useEffect, useMemo, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { theme } from '@/config/theme';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVwMDAwMGwycm5rZXJ0MG1mZmNtIn0.demo';
const MAP_CENTER = [-84.5975, 34.0400];
const MAP_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';

const HEAT_OFFSETS = [
  [0, 0],
  [0.00018, 0.00012],
  [-0.00016, 0.0001],
  [0.00012, -0.00012],
  [-0.00014, -0.00008],
];

const ZONES = [
  { id: "course", name: "Golf Course", center: [-84.5975, 34.0425], defaultCount: 22, activity: "High" },
  { id: "grill-room", name: "Grill Room", center: [-84.5977, 34.0398], defaultCount: 5, activity: "High" },
  { id: "main-dining", name: "Main Dining", center: [-84.5972, 34.0397], defaultCount: 5, activity: "Medium" },
  { id: "clubhouse", name: "Clubhouse / Lounge", center: [-84.5980, 34.0396], defaultCount: 3, activity: "Medium" },
  { id: "pool", name: "Pool & Fitness", center: [-84.5982, 34.0390], defaultCount: 6, activity: "Medium" },
  { id: "pro-shop", name: "Pro Shop", center: [-84.5975, 34.0401], defaultCount: 3, activity: "Low" },
  { id: "driving-range", name: "Driving Range", center: [-84.5982, 34.0408], defaultCount: 4, activity: "Medium" },
];

const HEALTH_COLORS = {
  healthy: '#4ADE80',
  watch: '#F3922D',
  'at-risk': '#FF5C35',
  critical: '#8E1C17',
};

function buildZoneFeatures() {
  return {
    type: 'FeatureCollection',
    features: ZONES.flatMap((zone) => {
      const pointCount = Math.min(HEAT_OFFSETS.length, Math.max(3, Math.round(zone.defaultCount / 6)));
      return HEAT_OFFSETS.slice(0, pointCount).map((offset, index) => ({
        type: 'Feature',
        properties: {
          zoneId: zone.id,
          intensity: zone.defaultCount * (0.7 + index * 0.08),
        },
        geometry: {
          type: 'Point',
          coordinates: [
            zone.center[0] + offset[0] * (0.4 + index * 0.12),
            zone.center[1] + offset[1] * (0.4 + index * 0.12),
          ],
        },
      }));
    }),
  };
}

const zoneCenterMap = Object.fromEntries(ZONES.map((zone) => [zone.id, zone.center]));

function resolveZoneCenter(zoneId, zoneName) {
  if (zoneCenterMap[zoneId]) return zoneCenterMap[zoneId];
  if (zoneName) {
    const normalized = zoneName.toLowerCase();
    const match = ZONES.find((zone) =>
      zone.name.toLowerCase().includes(normalized) || normalized.includes(zone.name.toLowerCase())
    );
    if (match) return match.center;
  }
  return zoneCenterMap.clubhouse;
}

function offsetCoordinates(base, key) {
  if (!base) return MAP_CENTER;
  const hash = Array.from(key).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const latOffset = ((hash % 7) - 3) * 0.00006;
  const lngOffset = (((hash >> 3) % 7) - 3) * 0.00006;
  return [base[0] + lngOffset, base[1] + latOffset];
}

function buildMemberFeatures(members) {
  return {
    type: 'FeatureCollection',
    features: members.map((member) => {
      const zoneCenter = resolveZoneCenter(member.zoneId, member.zone);
      const coordinates = offsetCoordinates(zoneCenter, member.memberId);
      return {
        type: 'Feature',
        properties: {
          memberId: member.memberId,
          status: member.status,
          name: member.name,
        },
        geometry: {
          type: 'Point',
          coordinates,
        },
      };
    }),
  };
}

function buildStaffFeatures(staffMembers) {
  return {
    type: 'FeatureCollection',
    features: staffMembers.map((staff) => {
      const zoneCenter = resolveZoneCenter(staff.zoneId, staff.zone);
      const coordinates = offsetCoordinates(zoneCenter, staff.id ?? staff.name ?? 'staff');
      return {
        type: 'Feature',
        properties: {
          name: staff.name,
          role: staff.role,
          zone: staff.zone,
        },
        geometry: {
          type: 'Point',
          coordinates,
        },
      };
    }),
  };
}

function ClubMap({ members = [], staffMembers = [], selectedMemberId, onSelectMember, densityByZone = {} }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const heatmapFeatures = useMemo(() => buildZoneFeatures(), []);
  const memberGeoJson = useMemo(() => buildMemberFeatures(members), [members]);
  const staffGeoJson = useMemo(() => buildStaffFeatures(staffMembers), [staffMembers]);

  const legendZones = useMemo(() => ZONES.map((zone) => ({
    ...zone,
    count: densityByZone[zone.id] ?? zone.defaultCount,
  })), [densityByZone]);

  useEffect(() => {
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: MAP_CENTER,
      zoom: 15.7,
      pitch: 45,
      bearing: -12,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

    map.on('load', () => {
      map.addSource('member-activity', {
        type: 'geojson',
        data: heatmapFeatures,
      });
      map.addLayer({
        id: 'member-activity-heat',
        type: 'heatmap',
        source: 'member-activity',
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 40, 0.6, 70, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 14, 0.8, 17, 1.6],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 14, 22, 17, 40],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.2, 'rgba(16, 46, 30, 0.35)',
            0.4, 'rgba(28, 92, 54, 0.55)',
            0.65, 'rgba(52, 168, 95, 0.8)',
            1, 'rgba(74, 222, 128, 0.95)'
          ],
          'heatmap-opacity': 0.85,
        },
      });
      map.addLayer({
        id: 'member-activity-points',
        type: 'circle',
        source: 'member-activity',
        minzoom: 16,
        paint: {
          'circle-radius': 5,
          'circle-color': '#4ADE80',
          'circle-opacity': 0.7,
        },
      });

      map.addSource('live-members', {
        type: 'geojson',
        data: memberGeoJson,
      });
      map.addLayer({
        id: 'live-member-points',
        type: 'circle',
        source: 'live-members',
        paint: {
          'circle-radius': 5.5,
          'circle-color': [
            'match',
            ['get', 'status'],
            'healthy', HEALTH_COLORS.healthy,
            'watch', HEALTH_COLORS.watch,
            'at-risk', HEALTH_COLORS['at-risk'],
            'critical', HEALTH_COLORS.critical,
            '#F7A341'
          ],
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 1.5,
        },
      });
      map.addLayer({
        id: 'selected-member-glow',
        type: 'circle',
        source: 'live-members',
        paint: {
          'circle-radius': 10,
          'circle-color': 'rgba(255,255,255,0.0)',
          'circle-stroke-color': theme.colors.accent,
          'circle-stroke-width': 2.5,
        },
        filter: ['==', ['get', 'memberId'], '•'],
      });

      map.addSource('staff-members', {
        type: 'geojson',
        data: staffGeoJson,
      });
      map.addLayer({
        id: 'staff-members',
        type: 'symbol',
        source: 'staff-members',
        layout: {
          'icon-image': 'marker-15',
          'icon-size': 1.1,
          'icon-offset': [0, -6],
        },
        paint: {
          'icon-color': theme.colors.accent,
        },
      });

      map.on('click', 'live-member-points', (event) => {
        const memberId = event.features?.[0]?.properties?.memberId;
        if (memberId && onSelectMember) {
          onSelectMember(memberId);
        }
      });

      map.getCanvas().style.cursor = 'crosshair';
    });

    mapRef.current = map;
    return () => map.remove();
  }, [heatmapFeatures, onSelectMember]);

  useEffect(() => {
    if (!mapRef.current) return;
    const source = mapRef.current.getSource('live-members');
    if (source) source.setData(memberGeoJson);
  }, [memberGeoJson]);

  useEffect(() => {
    if (!mapRef.current) return;
    const source = mapRef.current.getSource('staff-members');
    if (source) source.setData(staffGeoJson);
  }, [staffGeoJson]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (map.getLayer('selected-member-glow')) {
      if (selectedMemberId) {
        map.setFilter('selected-member-glow', ['==', ['get', 'memberId'], selectedMemberId]);
      } else {
        map.setFilter('selected-member-glow', ['==', ['get', 'memberId'], '•']);
      }
    }
  }, [selectedMemberId]);

  const totalMembers = members.length || legendZones.reduce((sum, zone) => sum + zone.count, 0);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: 500, borderRadius: theme.radius.md, overflow: 'hidden' }} />

      <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(9,12,16,0.9)', color: theme.colors.white, borderRadius: theme.radius.md, border: `1px solid ${theme.colors.border}`, padding: '12px 16px', minWidth: 260, boxShadow: theme.shadow.lg }}>
        <div style={{ fontSize: theme.fontSize.xs, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.colors.textMuted }}>Live member density</div>
        <div style={{ fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.mono, fontWeight: 700 }}>{totalMembers}</div>
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: 10 }}>On property right now</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 210, overflowY: 'auto' }}>
          {legendZones.map((zone) => (
            <div key={zone.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
              <div>
                <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>{zone.name}</div>
                <div style={{ fontSize: theme.fontSize.xs, opacity: 0.75 }}>Activity · {zone.activity}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700 }}>{zone.count}</div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>members</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(ClubMap);
