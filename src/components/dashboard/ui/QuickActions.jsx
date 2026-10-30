import { motion } from "framer-motion";

const QuickActions = ({ actions = [], className = "" }) => {
  if (!actions || actions.length === 0) return null;

  return (
    <div className={`overflow-x-auto pb-2 scrollbar-none ${className}`}>
      <div className="flex items-center gap-2.5 min-w-max">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id || action.label || idx}
              onClick={action.onClick}
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-primary-200/80 dark:border-primary-800 bg-white/90 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200 shadow-xs hover:border-secondary-500 hover:text-secondary-600 dark:hover:border-secondary-500 transition-all duration-200 cursor-pointer"
            >
              {Icon && (
                <span className="p-1 rounded-lg bg-primary-100/70 dark:bg-primary-800 text-secondary-500">
                  <Icon className="w-3.5 h-3.5" />
                </span>
              )}
              <span>{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
