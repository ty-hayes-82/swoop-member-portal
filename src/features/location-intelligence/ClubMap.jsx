import { memo } from 'react';
import { theme } from '@/config/theme';

const HEALTH_COLORS = {
  healthy: theme.colors.success,
  watch: theme.colors.warning,
  'at-risk': theme.colors.urgent,
  critical: '#8E1C17',
};

const ZONE_SHAPES = [
  { id: 'course', type: 'path', d: 'M120 80 Q80 200 180 320 T420 520 Q520 600 720 540 T900 340 Q960 260 910 180 T760 80 Z', label: 'Course', labelX: 520, labelY: 200 },
  { id: 'driving-range', type: 'rect', x: 90, y: 90, width: 140, height: 80, label: 'Range', labelX: 160, labelY: 80 },
  { id: 'practice-green', type: 'circle', cx: 300, cy: 120, r: 45, label: 'Practice', labelX: 300, labelY: 80 },
  { id: 'clubhouse', type: 'rect', x: 600, y: 260, width: 180, height: 140, label: 'Clubhouse', labelX: 690, labelY: 250 },
  { id: 'grill-room', type: 'rect', x: 610, y: 270, width: 70, height: 60, label: 'Grill', labelX: 645, labelY: 260 },
  { id: 'main-dining', type: 'rect', x: 690, y: 270, width: 70, height: 60, label: 'Dining', labelX: 725, labelY: 260 },
  { id: 'lounge', type: 'rect', x: 610, y: 340, width: 150, height: 50, label: 'Lounge', labelX: 685, labelY: 405 },
  { id: 'pool', type: 'rect', x: 500, y: 420, width: 140, height: 90, label: 'Pool', labelX: 570, labelY: 525 },
  { id: 'fitness', type: 'rect', x: 450, y: 410, width: 40, height: 80, label: 'Fitness', labelX: 470, labelY: 390 },
  { id: 'pro-shop', type: 'rect', x: 360, y: 250, width: 80, height: 60, label: 'Pro Shop', labelX: 400, labelY: 240 },
  { id: 'parking', type: 'rect', x: 200, y: 500, width: 260, height: 80, label: 'Parking', labelX: 330, labelY: 595 },
  { id: 'tennis', type: 'rect', x: 840, y: 360, width: 90, height: 160, label: 'Tennis', labelX: 885, labelY: 350 },
];

function ZoneShape({ zone, intensity }) {
  const fillColor = `rgba(243,146,45, ${0.08 + intensity * 0.25})`;
  const stroke = '#2B2B2B';
  if (zone.type === 'rect') {
    return (
      <rect
        x={zone.x}
        y={zone.y}
        width={zone.width}
        height={zone.height}
        rx={12}
        ry={12}
        fill={fillColor}
        stroke={stroke}
        strokeWidth={1.5}
      />
    );
  }
  if (zone.type === 'circle') {
    return (
      <circle
        cx={zone.cx}
        cy={zone.cy}
        r={zone.r}
        fill={fillColor}
        stroke={stroke}
        strokeWidth={1.5}
      />
    );
  }
  return (
    <path
      d={zone.d}
      fill={fillColor}
      stroke={stroke}
      strokeWidth={1.5}
    />
  );
}

function MemberDot({ member, isSelected, onSelect }) {
  const size = isSelected ? 8 : 6;
  const color = HEALTH_COLORS[member.status] ?? theme.colors.textPrimary;
  return (
    <g onClick={() => onSelect?.(member.memberId)} style={{ cursor: 'pointer' }}>
      {member.needsAttention && (
        <circle
          cx={member.x}
          cy={member.y}
          r={20}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          opacity={0.4}
        >
          <animate attributeName="r" values="10;26" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0" dur="2.4s" repeatCount="indefinite" />
        </circle>
      )}
      <circle
        cx={member.x}
        cy={member.y}
        r={size}
        fill={color}
        stroke={isSelected ? theme.colors.white : '#1F1F1F'}
        strokeWidth={isSelected ? 2 : 1.2}
      />
      <title>{member.name}</title>
    </g>
  );
}

function ClubMap({ members, selectedMemberId, onSelectMember, densityByZone }) {
  const maxDensity = Math.max(...Object.values(densityByZone ?? { course: 1 }));
  return (
    <svg viewBox="0 0 1000 650" role="img" aria-label="Oakmont Hills property map" style={{ width: '100%', height: '100%' }}>
      <rect x={0} y={0} width={1000} height={650} fill={theme.colors.bgSidebar} rx={32} />
      {ZONE_SHAPES.map((zone) => (
        <g key={zone.id}>
          <ZoneShape zone={zone} intensity={(densityByZone?.[zone.id] ?? 0) / Math.max(maxDensity, 1)} />
          <text
            x={zone.labelX}
            y={zone.labelY}
            textAnchor="middle"
            fontSize="22"
            fill={theme.colors.textOnDark}
            opacity={0.35}
          >
            {zone.label}
          </text>
        </g>
      ))}
      {members.map((member) => (
        <MemberDot
          key={member.memberId}
          member={member}
          isSelected={member.memberId === selectedMemberId}
          onSelect={onSelectMember}
        />
      ))}
    </svg>
  );
}

export default memo(ClubMap);
