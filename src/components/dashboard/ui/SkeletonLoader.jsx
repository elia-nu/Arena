export const StatCardSkeleton = () => (
  <div className="bg-white/80 dark:bg-primary-900/40 border border-primary-200/70 dark:border-primary-800/50 rounded-2xl p-5 animate-pulse flex flex-col justify-between h-[120px]">
    <div className="flex justify-between items-center mb-3">
      <div className="h-3 bg-primary-200/70 dark:bg-primary-700/50 rounded w-24" />
      <div className="w-9 h-9 bg-primary-200/70 dark:bg-primary-700/50 rounded-xl" />
    </div>
    <div className="space-y-2">
      <div className="h-7 bg-primary-200/70 dark:bg-primary-700/50 rounded w-20" />
      <div className="h-2.5 bg-primary-100 dark:bg-primary-800/40 rounded w-28" />
    </div>
  </div>
);

export const ListItemSkeleton = ({ rows = 4 }) => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-between p-3.5 bg-primary-50/70 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800/40 rounded-xl"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 bg-primary-200/70 dark:bg-primary-700/50 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5 min-w-0 pr-4">
            <div className="h-3.5 bg-primary-200/70 dark:bg-primary-700/50 rounded w-3/4 max-w-[200px]" />
            <div className="h-2.5 bg-primary-100 dark:bg-primary-800/40 rounded w-1/2 max-w-[140px]" />
          </div>
        </div>
        <div className="w-16 h-5 bg-primary-200/70 dark:bg-primary-700/50 rounded-full flex-shrink-0" />
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="animate-pulse space-y-3 bg-white dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
    <div className="grid gap-4 pb-2 border-b border-primary-100 dark:border-primary-800" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, j) => (
        <div key={j} className="h-3.5 bg-primary-200/80 dark:bg-primary-700/60 rounded w-20" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="grid gap-4 py-2 border-b border-primary-50 dark:border-primary-800/30 last:border-0" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="h-3 bg-primary-100 dark:bg-primary-800/40 rounded w-full" />
        ))}
      </div>
    ))}
  </div>
);

export const ChartSkeleton = () => (
  <div className="animate-pulse h-64 bg-white dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-5 flex flex-col justify-between">
    <div className="flex justify-between items-center mb-6">
      <div className="h-4 bg-primary-200/70 dark:bg-primary-700/50 rounded w-32" />
      <div className="h-4 bg-primary-100 dark:bg-primary-800/40 rounded w-16" />
    </div>
    <div className="flex items-end justify-between gap-3 h-44 pt-4">
      {[45, 65, 30, 80, 55, 90, 70, 40].map((height, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div
            className="w-full bg-primary-200/60 dark:bg-primary-700/40 rounded-t"
            style={{ height: `${height}%` }}
          />
          <div className="h-2 bg-primary-100 dark:bg-primary-800/30 rounded w-6" />
        </div>
      ))}
    </div>
  </div>
);
