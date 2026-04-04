// CategoryFilterBar — horizontal scrollable filter tabs for vendor categories

export default function CategoryFilterBar({ categories = [], activeCategory, onSelect }) {
  return (
    <div className="overflow-x-auto pb-0.5" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <div className="flex gap-3 items-center min-w-max py-1">
        {/* "All" pill */}
        <Pill
          label="All"
          icon={null}
          count={categories.reduce((s, c) => s + (c.count ?? 0), 0)}
          isActive={activeCategory === null}
          onSelect={() => onSelect(null)}
        />

        {categories.map(cat => (
          <Pill
            key={cat.id}
            label={cat.label}
            icon={cat.icon}
            count={cat.count ?? 0}
            isActive={activeCategory === cat.id}
            onSelect={() => onSelect(activeCategory === cat.id ? null : cat.id)}
          />
        ))}
      </div>
    </div>
  );
}

function Pill({ label, icon, count, isActive, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm whitespace-nowrap cursor-pointer transition-all duration-150 ${
        isActive
          ? 'bg-brand-500 text-white border-brand-500 font-bold'
          : 'bg-white text-gray-600 border-gray-200 font-medium hover:bg-gray-50 dark:bg-white/[0.03] dark:text-gray-400 dark:border-gray-700 dark:hover:bg-white/5'
      }`}
    >
      {icon && <span className="text-sm leading-none">{icon}</span>}
      {label}
      {count > 0 && (
        <span className={`text-[10px] font-bold px-1.5 py-px rounded-lg min-w-[18px] text-center ${
          isActive
            ? 'bg-white/25 text-white'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}
