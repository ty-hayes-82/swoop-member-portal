import { theme } from '@/config/theme';

// DES-P06: Skeleton loader components with shimmer animation

const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}
`;

const shimmerStyle = {
  background: `linear-gradient(
    90deg,
    ${theme.colors.bgDeep} 0%,
    ${theme.colors.border} 50%,
    ${theme.colors.bgDeep} 100%
  )`,
  backgroundSize: '2000px 100%',
  animation: 'shimmer 1.8s infinite linear',
  borderRadius: theme.radius.sm,
};

// Inject shimmer animation keyframes
if (typeof document !== 'undefined' && !document.getElementById('shimmer-keyframes')) {
  const style = document.createElement('style');
  style.id = 'shimmer-keyframes';
  style.innerHTML = shimmerKeyframes;
  document.head.appendChild(style);
}

export function SkeletonLine({ width = '100%', height = 16, marginBottom = 8, style = {} }) {
  return (
    <div
      style={{
        ...shimmerStyle,
        width,
        height,
        marginBottom,
        ...style,
      }}
    />
  );
}

export function SkeletonCircle({ size = 40, style = {} }) {
  return (
    <div
      style={{
        ...shimmerStyle,
        width: size,
        height: size,
        borderRadius: '50%',
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ 
  headerLines = 2, 
  bodyLines = 3, 
  hasButton = true,
  style = {} 
}) {
  return (
    <div
      style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
        ...style,
      }}
    >
      {/* Header skeleton */}
      <div style={{ marginBottom: theme.spacing.md }}>
        {Array.from({ length: headerLines }).map((_, i) => (
          <SkeletonLine
            key={i}
            width={i === 0 ? '70%' : '50%'}
            height={i === 0 ? 20 : 16}
            marginBottom={8}
          />
        ))}
      </div>

      {/* Body skeleton */}
      <div style={{ marginBottom: theme.spacing.md }}>
        {Array.from({ length: bodyLines }).map((_, i) => (
          <SkeletonLine
            key={i}
            width={i === bodyLines - 1 ? '60%' : '100%'}
            height={14}
            marginBottom={6}
          />
        ))}
      </div>

      {/* Button skeleton */}
      {hasButton && (
        <SkeletonLine width="120px" height={36} marginBottom={0} />
      )}
    </div>
  );
}

export function SkeletonTable({ 
  rows = 5, 
  columns = 6,
  style = {} 
}) {
  return (
    <div
      style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Table header */}
      <div style={{ 
        padding: theme.spacing.md,
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        gap: theme.spacing.md,
      }}>
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonLine
            key={i}
            width={`${100 / columns}%`}
            height={12}
            marginBottom={0}
          />
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            padding: theme.spacing.md,
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            gap: theme.spacing.md,
            alignItems: 'center',
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonLine
              key={colIndex}
              width={colIndex === 0 ? '25%' : `${75 / (columns - 1)}%`}
              height={14}
              marginBottom={0}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ 
  cards = 4, 
  columns = 4,
  cardHeight = 140,
  style = {} 
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: theme.spacing.md,
        ...style,
      }}
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          style={{
            background: theme.colors.bgCard,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            height: cardHeight,
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.sm,
          }}
        >
          <SkeletonLine width="60%" height={16} />
          <SkeletonLine width="100%" height={32} marginBottom={8} />
          <SkeletonLine width="40%" height={12} marginBottom={0} />
        </div>
      ))}
    </div>
  );
}

// Preset skeleton layouts for common page patterns
export function SkeletonDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <SkeletonLine width="300px" height={32} />
      <SkeletonGrid cards={4} columns={4} />
      <SkeletonCard headerLines={1} bodyLines={4} hasButton={true} />
      <SkeletonCard headerLines={1} bodyLines={3} hasButton={true} />
    </div>
  );
}

export function SkeletonMemberList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <SkeletonGrid cards={4} columns={4} cardHeight={100} />
      <SkeletonTable rows={8} columns={6} />
    </div>
  );
}
