import { memo, useMemo } from 'react';
import { theme } from '@/config/theme';

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 640;

const ZONES = [
  { id: 'clubhouse', label: 'Clubhouse', polygon: '120,180 290,150 340,260 160,290', tone: '#2A2A2A' },
  { id: 'grill-room', label: 'Grill Room', polygon: '220,250 320,230 350,300 250,320', tone: '#F3922D' },
  { id: 'main-dining', label: 'Main Dining', polygon: '260,190 360,170 390,230 290,250', tone: '#FFB347' },
  { id: 'pro-shop', label: 'Pro Shop', polygon: '365,265 455,245 495,315 400,335', tone: '#D97706' },
  { id: 'driving-range', label: 'Driving Range', polygon: '510,150 790,120 900,280 620,320', tone: '#F5B97A' },
  { id: 'pool', label: 'Pool & Fitness', polygon: '120,335 260,320 300,430 145,470', tone: '#A1A1AA' },
  { id: 'course', label: 'Course', polygon: '390,330 940,280 960,610 430,620', tone: '#3F3F46' },
];

const HEALTH_COLORS = {
  healthy: theme.colors.accent,
  watch: theme.colors.warning,
  'at-risk': theme.colors.urgent,
  critical: '#8E1C17',
};

const minMax = (arr) => ({ min: Math.min(...arr), max: Math.max(...arr) });

function scalePosition(value, min, max, size, padding = 44) {
  if (!Number.isFinite(value) || max === min) return size / 2;
  const ratio = (value - min) / (max - min);
  return padding + ratio * (size - padding * 2);
}

function getMemberXY(member, latMin, latMax, lngMin, lngMax) {
  return {
    x: scalePosition(member.lng, lngMin, lngMax, MAP_WIDTH),
    y: MAP_HEIGHT - scalePosition(member.lat, latMin, latMax, MAP_HEIGHT),
  };
}

function ClubMap({ members = [], staffMembers = [], selectedMemberId, onSelectMember, densityByZone = {} }) {
  const latStats = useMemo(() => members.length ? minMax(members.map((m) => m.lat)) : { min: 34.038, max: 34.045 }, [members]);
  const lngStats = useMemo(() => members.length ? minMax(members.map((m) => m.lng)) : { min: -84.602, max: -84.594 }, [members]);

  const memberPoints = useMemo(() => members.map((member) => ({
    member,
    ...getMemberXY(member, latStats.min, latStats.max, lngStats.min, lngStats.max),
  })), [members, latStats.max, latStats.min, lngStats.max, lngStats.min]);

  const selected = memberPoints.find((entry) => entry.member.memberId === selectedMemberId);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 420, borderRadius: theme.radius.md, overflow: 'hidden', background: '#101010' }}>
      <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} width="100%" height="100%" role="img" aria-label="Oakmont Hills location map">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2A2A2A" strokeWidth="1" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="#0F0F0F" />
        <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#grid)" opacity="0.7" />

        {ZONES.map((zone) => {
          const density = densityByZone[zone.id] ?? 0;
          const opacity = Math.min(0.44, 0.12 + density * 0.02);
          return (
            <g key={zone.id}>
              <polygon points={zone.polygon} fill={zone.tone} opacity={opacity} stroke={zone.tone} strokeWidth="2" />
              <text
                x={zone.id === 'course' ? 640 : zone.id === 'driving-range' ? 700 : zone.id === 'clubhouse' ? 220 : zone.id === 'pool' ? 210 : 300}
                y={zone.id === 'course' ? 470 : zone.id === 'driving-range' ? 190 : zone.id === 'clubhouse' ? 210 : zone.id === 'pool' ? 390 : 280}
                fill="#EFEFEF"
                fontSize="14"
                fontWeight="600"
                textAnchor="middle"
              >
                {zone.label}
              </text>
            </g>
          );
        })}

        {staffMembers.map((staff) => {
          const point = getMemberXY(staff, latStats.min, latStats.max, lngStats.min, lngStats.max);
          return (
            <g key={staff.id}>
              <rect x={point.x - 7} y={point.y - 7} width="14" height="14" rx="2" fill={theme.colors.accent} transform={`rotate(45 ${point.x} ${point.y})`} />
            </g>
          );
        })}

        {memberPoints.map(({ member, x, y }) => {
          const color = HEALTH_COLORS[member.status] ?? theme.colors.warning;
          const isSelected = member.memberId === selectedMemberId;
          return (
            <g key={member.memberId} onClick={() => onSelectMember?.(member.memberId)} style={{ cursor: 'pointer' }}>
              {member.needsAttention && (
                <circle cx={x} cy={y} r="16" fill="none" stroke={color} strokeWidth="2" opacity="0.6">
                  <animate attributeName="r" values="9;23" dur="1.7s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0" dur="1.7s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={x} cy={y} r={isSelected ? 8 : 6} fill={color} stroke="#FFFFFF" strokeWidth={isSelected ? 2 : 1.5} />
            </g>
          );
        })}
      </svg>

      {selected && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(78, (selected.x / MAP_WIDTH) * 100)}%`,
            top: `${Math.max(8, (selected.y / MAP_HEIGHT) * 100 - 8)}%`,
            transform: 'translate(-20%, -110%)',
            background: 'rgba(15,15,15,0.95)',
            border: `1px solid ${theme.colors.accent}66`,
            borderRadius: theme.radius.sm,
            color: theme.colors.white,
            minWidth: 210,
            padding: theme.spacing.sm,
            boxShadow: theme.shadow.md,
          }}
        >
          <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700 }}>{selected.member.name}</div>
          <div style={{ fontSize: theme.fontSize.xs, color: '#E4E4E7' }}>{selected.member.zone} · {selected.member.timeInZone}</div>
          <div style={{ marginTop: 4, fontSize: theme.fontSize.xs, color: HEALTH_COLORS[selected.member.status] ?? theme.colors.warning }}>
            Health {selected.member.healthScore}
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', right: 10, bottom: 10, background: 'rgba(24,24,24,0.92)', border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, padding: '8px 10px', color: theme.colors.white, fontSize: 11 }}>
        Oakmont Hills zones · live member telemetry
      </div>
    </div>
  );
}

export default memo(ClubMap);
