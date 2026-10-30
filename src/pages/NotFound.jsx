import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { IoFootballOutline, IoHomeOutline, IoTrophyOutline } from "react-icons/io5";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-950 via-primary-900 to-primary-950 flex items-center justify-center px-4 py-24 relative overflow-hidden">
      {/* Decorative soccer ball gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        className="max-w-md w-full text-center relative z-10 space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-secondary-500/20 text-secondary-400 mb-2 border border-secondary-400/30"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <IoFootballOutline className="text-5xl" />
        </motion.div>

        <h1 className="text-7xl font-black text-white tracking-tight">404</h1>
        <h2 className="text-2xl font-bold text-secondary-400 uppercase tracking-widest">
          Offside! Page Not Found
        </h2>
        <p className="text-sm md:text-base text-primary-200/80 leading-relaxed max-w-sm mx-auto">
          The page, bracket, or match you&apos;re looking for has been moved or doesn&apos;t exist.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-secondary-500 text-primary-950 font-bold text-sm hover:bg-secondary-400 transition-all duration-300 shadow-lg shadow-secondary-500/20"
          >
            <IoHomeOutline className="text-lg" />
            Back to Home
          </Link>
          <Link
            to="/events"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-primary-700 text-white font-medium text-sm hover:bg-white/10 hover:border-white transition-all duration-300"
          >
            <IoTrophyOutline className="text-lg" />
            Browse Events
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
