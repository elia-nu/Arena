const SectionHeader = ({
  title,
  subtitle,
  action,
  badge,
  className = "mb-6",
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-primary-200/60 dark:border-primary-800/60 ${className}`}
    >
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-primary-950 dark:text-primary-50">
            {title}
          </h2>
          {badge && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-secondary-100 text-secondary-800 dark:bg-secondary-900/50 dark:text-secondary-300">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {action.secondary && (
            <button
              onClick={action.secondary.onClick}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-800 text-primary-700 dark:text-primary-200 hover:bg-primary-50 dark:hover:bg-primary-700 transition-colors"
            >
              {action.secondary.label}
            </button>
          )}
          {action.primary && (
            <button
              onClick={action.primary.onClick}
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-secondary-500 hover:bg-secondary-600 text-white shadow-xs transition-colors"
            >
              {action.primary.icon && <action.primary.icon className="w-4 h-4" />}
              {action.primary.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
