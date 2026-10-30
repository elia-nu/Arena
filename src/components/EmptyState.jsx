import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const ILLUSTRATIONS = {
  events: EventsIllustration,
  shop: ShopIllustration,
  nonprofit: NonprofitIllustration,
  testimonials: TestimonialsIllustration,
  gallery: GalleryIllustration,
  social: SocialIllustration,
  cart: ShopIllustration,
  orders: ShopIllustration,
  error: ErrorIllustration,
};

/**
 * Branded empty / error state for public pages.
 * Illustrations use primary (black/white) + secondary (orange) brand colors.
 */
const EmptyState = ({
  variant = "events",
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  theme = "light",
  compact = false,
  className = "",
}) => {
  const Illustration = ILLUSTRATIONS[variant] || ILLUSTRATIONS.events;
  const isDark = theme === "dark";

  const actionClass = `group inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold uppercase tracking-wider rounded-full transition-all duration-300 ${
    isDark
      ? "border-2 border-secondary-500/40 text-secondary-50 hover:border-secondary-500 hover:bg-secondary-500/10 hover:text-secondary-400"
      : "bg-primary-950 text-secondary-400 hover:bg-primary-900 shadow-sm hover:shadow-md"
  }`;

  return (
    <motion.div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-8 px-3" : "py-12 md:py-16 px-4"
      } ${className}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        className={`relative ${compact ? "mb-5" : "mb-8"}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div
          className={`absolute inset-0 rounded-full blur-3xl scale-75 ${
            isDark ? "bg-secondary-500/20" : "bg-secondary-500/15"
          }`}
          aria-hidden
        />
        <Illustration isDark={isDark} compact={compact} />
      </motion.div>

      <h3
        className={`${
          compact ? "text-lg" : "text-xl md:text-2xl"
        } font-semibold tracking-tight mb-2 ${
          isDark ? "text-secondary-50" : "text-primary-900"
        }`}
      >
        {title}
      </h3>

      {description && (
        <p
          className={`text-sm ${
            compact ? "max-w-xs" : "md:text-base max-w-md"
          } leading-relaxed ${actionLabel ? "mb-8" : "mb-0"} ${
            isDark ? "text-secondary-200/80" : "text-primary-600"
          }`}
        >
          {description}
        </p>
      )}

      {actionLabel && actionTo && (
        <Link to={actionTo} className={actionClass}>
          <span>{actionLabel}</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </Link>
      )}

      {actionLabel && !actionTo && onAction && (
        <button type="button" onClick={onAction} className={actionClass}>
          <span>{actionLabel}</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </button>
      )}
    </motion.div>
  );
};

/* ─── Illustrations ─── */

function svgSize(compact) {
  return compact
    ? "relative w-28 h-24"
    : "relative w-44 h-36 md:w-52 md:h-40";
}

function EventsIllustration({ isDark, compact }) {
  const ink = isDark ? "#fff1e8" : "#202020";
  const soft = isDark ? "#ffaf7b" : "#ffd0ad";
  const accent = "#fe5723";

  return (
    <motion.svg
      viewBox="0 0 200 160"
      className={svgSize(compact)}
      fill="none"
      aria-hidden
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Field */}
      <ellipse cx="100" cy="130" rx="70" ry="12" fill={soft} opacity="0.45" />
      <rect
        x="40"
        y="78"
        width="120"
        height="52"
        rx="4"
        stroke={ink}
        strokeWidth="2"
        opacity="0.35"
      />
      <line
        x1="100"
        y1="78"
        x2="100"
        y2="130"
        stroke={ink}
        strokeWidth="1.5"
        opacity="0.25"
      />
      <circle
        cx="100"
        cy="104"
        r="14"
        stroke={ink}
        strokeWidth="1.5"
        opacity="0.25"
      />

      {/* Goal posts */}
      <path
        d="M48 78 V58 H58"
        stroke={accent}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M152 78 V58 H142"
        stroke={accent}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Ball */}
      <motion.g
        animate={{ rotate: [0, 12, 0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 52px" }}
      >
        <circle cx="100" cy="52" r="22" fill={ink} />
        <circle cx="100" cy="52" r="22" fill={accent} opacity="0.15" />
        <path
          d="M100 30 L108 42 L122 44 L112 54 L114 68 L100 62 L86 68 L88 54 L78 44 L92 42 Z"
          fill="none"
          stroke={isDark ? "#202020" : "#fff1e8"}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </motion.g>

      {/* Spark accents */}
      <circle cx="148" cy="36" r="3" fill={accent} opacity="0.8" />
      <circle cx="52" cy="44" r="2" fill={accent} opacity="0.5" />
      <circle cx="160" cy="70" r="2.5" fill={soft} />
    </motion.svg>
  );
}

function ShopIllustration({ isDark, compact }) {
  const ink = isDark ? "#fff1e8" : "#202020";
  const soft = isDark ? "#ffaf7b" : "#ffd0ad";
  const accent = "#fe5723";

  return (
    <motion.svg
      viewBox="0 0 200 160"
      className={svgSize(compact)}
      fill="none"
      aria-hidden
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <ellipse cx="100" cy="138" rx="55" ry="10" fill={soft} opacity="0.4" />

      {/* Jersey */}
      <path
        d="M70 48 L85 38 L100 48 L115 38 L130 48 L130 110 Q130 120 100 120 Q70 120 70 110 Z"
        fill={ink}
      />
      <path
        d="M70 48 L85 38 L100 48 L115 38 L130 48 L130 110 Q130 120 100 120 Q70 120 70 110 Z"
        fill={accent}
        opacity="0.2"
      />
      {/* Collar */}
      <path
        d="M90 48 Q100 58 110 48"
        stroke={accent}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Number */}
      <text
        x="100"
        y="92"
        textAnchor="middle"
        fill={accent}
        fontSize="28"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        7
      </text>

      {/* Tag / hangar */}
      <motion.g
        animate={{ rotate: [-4, 4, -4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "155px 55px" }}
      >
        <rect
          x="142"
          y="42"
          width="28"
          height="36"
          rx="3"
          fill={soft}
          stroke={accent}
          strokeWidth="1.5"
        />
        <line
          x1="156"
          y1="42"
          x2="156"
          y2="32"
          stroke={ink}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="156" cy="30" r="4" stroke={ink} strokeWidth="2" fill="none" />
        <text
          x="156"
          y="65"
          textAnchor="middle"
          fill={accent}
          fontSize="11"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          $
        </text>
      </motion.g>
    </motion.svg>
  );
}

function NonprofitIllustration({ isDark, compact }) {
  const ink = isDark ? "#fff1e8" : "#202020";
  const soft = isDark ? "#ffaf7b" : "#ffd0ad";
  const accent = "#fe5723";

  return (
    <motion.svg
      viewBox="0 0 200 160"
      className={svgSize(compact)}
      fill="none"
      aria-hidden
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <ellipse cx="100" cy="138" rx="58" ry="10" fill={soft} opacity="0.4" />

      {/* People silhouettes */}
      <circle cx="70" cy="58" r="14" fill={ink} opacity="0.85" />
      <path
        d="M48 110 Q48 78 70 78 Q92 78 92 110"
        fill={ink}
        opacity="0.85"
      />

      <circle cx="130" cy="58" r="14" fill={ink} opacity="0.7" />
      <path
        d="M108 110 Q108 78 130 78 Q152 78 152 110"
        fill={ink}
        opacity="0.7"
      />

      {/* Center heart / community */}
      <motion.path
        d="M100 95 C100 95 88 84 88 76 C88 70 93 66 100 72 C107 66 112 70 112 76 C112 84 100 95 100 95 Z"
        fill={accent}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 82px" }}
      />

      {/* Hands / connection arc */}
      <path
        d="M78 72 Q100 55 122 72"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />

      <circle cx="48" cy="48" r="2.5" fill={accent} opacity="0.6" />
      <circle cx="155" cy="52" r="3" fill={soft} />
    </motion.svg>
  );
}

function TestimonialsIllustration({ isDark, compact }) {
  const ink = isDark ? "#fff1e8" : "#202020";
  const soft = isDark ? "#ffaf7b" : "#ffd0ad";
  const accent = "#fe5723";

  return (
    <motion.svg
      viewBox="0 0 200 160"
      className={svgSize(compact)}
      fill="none"
      aria-hidden
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
    >
      <ellipse cx="100" cy="138" rx="55" ry="10" fill={soft} opacity="0.4" />

      {/* Quote bubble */}
      <motion.g
        animate={{ rotate: [-2, 2, -2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 70px" }}
      >
        <rect
          x="45"
          y="32"
          width="110"
          height="72"
          rx="16"
          fill={ink}
          opacity="0.08"
          stroke={ink}
          strokeWidth="2"
        />
        <path
          d="M85 104 L100 122 L115 104"
          fill={ink}
          opacity="0.08"
          stroke={ink}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Quote marks */}
        <text
          x="68"
          y="72"
          fill={accent}
          fontSize="36"
          fontWeight="700"
          fontFamily="Georgia, serif"
          opacity="0.9"
        >
          “
        </text>
        <line
          x1="88"
          y1="58"
          x2="138"
          y2="58"
          stroke={ink}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.25"
        />
        <line
          x1="88"
          y1="70"
          x2="128"
          y2="70"
          stroke={ink}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.2"
        />
        <line
          x1="88"
          y1="82"
          x2="118"
          y2="82"
          stroke={ink}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.15"
        />
      </motion.g>

      {/* Stars */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={72 + i * 28}
          cy={28}
          r="3"
          fill={accent}
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.15, 0.9] }}
          transition={{
            duration: 2,
            delay: i * 0.3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.svg>
  );
}

function GalleryIllustration({ isDark, compact }) {
  const ink = isDark ? "#fff1e8" : "#202020";
  const soft = isDark ? "#ffaf7b" : "#ffd0ad";
  const accent = "#fe5723";

  return (
    <motion.svg
      viewBox="0 0 200 160"
      className={svgSize(compact)}
      fill="none"
      aria-hidden
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <ellipse cx="100" cy="138" rx="55" ry="10" fill={soft} opacity="0.4" />
      <rect
        x="38"
        y="42"
        width="72"
        height="58"
        rx="8"
        fill={ink}
        opacity="0.12"
        stroke={ink}
        strokeWidth="2"
        transform="rotate(-8 74 71)"
      />
      <rect
        x="78"
        y="36"
        width="84"
        height="68"
        rx="8"
        fill={ink}
        opacity="0.08"
        stroke={ink}
        strokeWidth="2"
      />
      <circle cx="108" cy="58" r="10" fill={accent} opacity="0.35" />
      <path
        d="M88 88 L108 68 L128 82 L148 62 L162 88 Z"
        fill={accent}
        opacity="0.45"
      />
      <motion.circle
        cx="155"
        cy="40"
        r="4"
        fill={accent}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.svg>
  );
}

function SocialIllustration({ isDark, compact }) {
  const ink = isDark ? "#fff1e8" : "#202020";
  const soft = isDark ? "#ffaf7b" : "#ffd0ad";
  const accent = "#fe5723";

  return (
    <motion.svg
      viewBox="0 0 200 160"
      className={svgSize(compact)}
      fill="none"
      aria-hidden
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <ellipse cx="100" cy="138" rx="55" ry="10" fill={soft} opacity="0.4" />
      <rect
        x="55"
        y="28"
        width="90"
        height="100"
        rx="18"
        stroke={ink}
        strokeWidth="2.5"
        fill={ink}
        opacity="0.06"
      />
      <rect x="88" y="36" width="24" height="4" rx="2" fill={ink} opacity="0.25" />
      <circle cx="100" cy="78" r="22" fill={accent} opacity="0.2" />
      <path
        d="M92 78 L98 84 L110 70"
        stroke={accent}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="78" y="112" width="44" height="5" rx="2.5" fill={ink} opacity="0.2" />
      <circle cx="148" cy="48" r="3" fill={accent} opacity="0.7" />
      <circle cx="52" cy="60" r="2.5" fill={soft} />
    </motion.svg>
  );
}

function ErrorIllustration({ isDark, compact }) {
  const ink = isDark ? "#fff1e8" : "#202020";
  const soft = isDark ? "#ffaf7b" : "#ffd0ad";
  const accent = "#fe5723";

  return (
    <motion.svg
      viewBox="0 0 200 160"
      className={svgSize(compact)}
      fill="none"
      aria-hidden
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <ellipse cx="100" cy="138" rx="50" ry="10" fill={soft} opacity="0.4" />

      <motion.g
        animate={{ rotate: [0, -3, 3, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 75px" }}
      >
        <path
          d="M100 28 L168 140 H32 Z"
          fill={ink}
          opacity="0.08"
          stroke={ink}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M100 28 L168 140 H32 Z"
          fill={accent}
          opacity="0.12"
        />
        <line
          x1="100"
          y1="62"
          x2="100"
          y2="100"
          stroke={accent}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="100" cy="116" r="4" fill={accent} />
      </motion.g>
    </motion.svg>
  );
}

export default EmptyState;
