import { motion } from "framer-motion";

const EmptyState = ({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed border-primary-200 dark:border-primary-800 bg-primary-50/40 dark:bg-primary-900/10 ${className}`}
    >
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-secondary-50 dark:bg-secondary-950/40 border border-secondary-200/60 dark:border-secondary-800/40 flex items-center justify-center mb-4 text-secondary-500 shadow-xs">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-base font-bold text-primary-900 dark:text-primary-100 mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 max-w-sm mb-6 leading-relaxed">
        {message}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-secondary-500 hover:bg-secondary-600 active:scale-95 text-white shadow-xs transition-all duration-200"
          >
            {actionLabel}
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-primary-200 dark:border-primary-700 hover:bg-primary-100 dark:hover:bg-primary-800 text-primary-700 dark:text-primary-200 transition-all duration-200"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default EmptyState;
