// DES-P06: Skeleton loader components with Tailwind animate-pulse

export function SkeletonLine({ width = '100%', height = 16, marginBottom = 8, style = {} }) {
  return (
    <div
      className="animate-pulse bg-gray-200 rounded-lg dark:bg-gray-700"
      style={{ width, height, marginBottom, ...style }}
    />
  );
}

export function SkeletonCircle({ size = 40, style = {} }) {
  return (
    <div
      className="animate-pulse bg-gray-200 rounded-full dark:bg-gray-700"
      style={{ width: size, height: size, ...style }}
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
      className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]"
      style={style}
    >
      {/* Header skeleton */}
      <div className="mb-4">
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
      <div className="mb-4">
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
      className="rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-gray-800 dark:bg-white/[0.03]"
      style={style}
    >
      {/* Table header */}
      <div className="p-4 border-b border-gray-200 flex gap-4 dark:border-gray-800">
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
          className="p-4 border-b border-gray-200 flex gap-4 items-center dark:border-gray-800"
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
      className="gap-4"
      style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, ...style }}
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-3 dark:border-gray-800 dark:bg-white/[0.03]"
          style={{ height: cardHeight }}
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
    <div className="flex flex-col gap-6">
      <SkeletonLine width="300px" height={32} />
      <SkeletonGrid cards={4} columns={4} />
      <SkeletonCard headerLines={1} bodyLines={4} hasButton={true} />
      <SkeletonCard headerLines={1} bodyLines={3} hasButton={true} />
    </div>
  );
}

export function SkeletonMemberList() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonGrid cards={4} columns={4} cardHeight={100} />
      <SkeletonTable rows={8} columns={6} />
    </div>
  );
}
