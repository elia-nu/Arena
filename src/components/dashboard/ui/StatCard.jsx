import { motion } from "framer-motion";

const colorMap = {
  blue: {
    bg: "bg-blue-50/70 dark:bg-blue-950/20",
    border: "border-blue-200/80 dark:border-blue-800/40",
    iconBg: "bg-blue-500",
    iconColor: "text-white",
    text: "text-blue-950 dark:text-blue-100",
    sub: "text-blue-700 dark:text-blue-300",
  },
  green: {
    bg: "bg-emerald-50/70 dark:bg-emerald-950/20",
    border: "border-emerald-200/80 dark:border-emerald-800/40",
    iconBg: "bg-emerald-500",
    iconColor: "text-white",
    text: "text-emerald-950 dark:text-emerald-100",
    sub: "text-emerald-700 dark:text-emerald-300",
  },
  purple: {
    bg: "bg-purple-50/70 dark:bg-purple-950/20",
    border: "border-purple-200/80 dark:border-purple-800/40",
    iconBg: "bg-purple-500",
    iconColor: "text-white",
    text: "text-purple-950 dark:text-purple-100",
    sub: "text-purple-700 dark:text-purple-300",
  },
  amber: {
    bg: "bg-amber-50/70 dark:bg-amber-950/20",
    border: "border-amber-200/80 dark:border-amber-800/40",
    iconBg: "bg-amber-500",
    iconColor: "text-white",
    text: "text-amber-950 dark:text-amber-100",
    sub: "text-amber-700 dark:text-amber-300",
  },
  orange: {
    bg: "bg-orange-50/70 dark:bg-orange-950/20",
    border: "border-orange-200/80 dark:border-orange-800/40",
    iconBg: "bg-secondary-500",
    iconColor: "text-white",
    text: "text-orange-950 dark:text-orange-100",
    sub: "text-orange-700 dark:text-orange-300",
  },
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  color = "blue",
  trend,
  subtitle,
  delay = 0,
}) => {
  const c = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      className={`${c.bg} border ${c.border} rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 backdrop-blur-xs flex flex-col justify-between`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className={`text-xs font-semibold ${c.sub} uppercase tracking-wider`}>
          {label}
        </p>
        {Icon && (
          <div className={`${c.iconBg} p-2.5 rounded-xl shadow-xs flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${c.iconColor}`} />
          </div>
        )}
      </div>

      <div>
        <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${c.text}`}>
          {value}
        </p>
        {(subtitle || trend !== undefined) && (
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            {trend !== undefined && (
              <span
                className={`font-semibold px-1.5 py-0.5 rounded-md ${
                  trend >= 0
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                }`}
              >
                {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
              </span>
            )}
            {subtitle && (
              <span className="text-primary-500 dark:text-primary-400 font-medium">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
