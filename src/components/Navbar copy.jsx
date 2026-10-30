import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { IoMenu, IoClose } from "react-icons/io5";
import logo from "../../public/logo.png";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const { scrollY } = useScroll();
  const location = useLocation();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const navItems = [
    { label: "Events", href: "/events", color: "yellow" },
    { label: "Shop", href: "/shop", color: "black" },
    { label: "Gallery", href: "/gallery", color: "yellow" },
  ];

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-xl border-b border-black/5 shadow-sm"
            : "bg-white/10 backdrop-blur-md mx-20 rounded-full mt-4 shadow-2xl"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
          <div className="flex items-center justify-between h-24">
            {/* Logo - Enhanced */}
            <Link
              to="/"
              className="flex items-center gap-4 group relative"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <motion.div
                className="relative"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.img
                  src={logo}
                  alt="Logo"
                  className="w-12 h-12 relative z-10"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                />
                <motion.div
                  className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
              <div className="flex flex-col">
                <motion.span
                  className={`text-sm font-extralight tracking-[0.3em] uppercase leading-none ${
                    isScrolled ? "text-black" : "text-yellow-500"
                  }`}
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.3 }}
                >
                  Les
                </motion.span>
                <motion.span
                  className={`text-lg font-light tracking-[0.2em] uppercase leading-none ${
                    isScrolled ? "text-yellow-500" : "text-yellow-500"
                  }`}
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.3 }}
                >
                  Les Kick't
                </motion.span>
              </div>
            </Link>

            {/* Desktop Navigation - Ultra Elegant */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  className="relative"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                  onMouseEnter={() => setHoveredItem(item.label)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Link
                    to={item.href}
                    className={`relative block px-6 py-3 text-sm font-extralight text-black uppercase tracking-[0.2em] transition-all duration-500 ${
                      isScrolled
                        ? hoveredItem === item.label
                          ? "text-yellow-500"
                          : "text-black/70"
                        : hoveredItem === item.label
                          ? "text-yellow-500"
                          : "text-yellow-500"
                    }`}
                  >
                    {item.label}

                    {/* Elegant Underline Animation */}
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-px bg-yellow-500 origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{
                        scaleX: hoveredItem === item.label ? 1 : 0,
                      }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />

                    {/* Hover Glow Effect */}
                    <motion.div
                      className="absolute inset-0 bg-yellow-500/5 blur-xl -z-10"
                      animate={{
                        opacity: hoveredItem === item.label ? 1 : 0,
                        scale: hoveredItem === item.label ? 1.5 : 0.8,
                      }}
                      transition={{ duration: 0.4 }}
                    />
                  </Link>
                </motion.div>
              ))}

              {/* Elegant Divider */}
              <motion.div
                className="w-px h-8 bg-black/10 mx-4"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              />

              {/* CTA Button - Premium Design */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/events"
                  className="group relative px-8 py-3.5 bg-yellow-500 text-black text-xs font-light uppercase tracking-[0.3em] overflow-hidden inline-flex items-center gap-3"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Register
                    <motion.span
                      className="text-lg"
                      animate={{ x: [0, 4, 0] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      →
                    </motion.span>
                  </span>

                  {/* Hover Slide Effect */}
                  <motion.div
                    className="absolute inset-0 bg-yellow-400"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "0%" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />

                  {/* Shine Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-200%" }}
                    whileHover={{ x: "200%" }}
                    transition={{ duration: 0.6 }}
                  />
                </Link>
              </motion.div>
            </div>

            {/* Mobile Menu Button - Enhanced */}
            <motion.button
              className={`md:hidden p-3 transition-colors relative ${
                isScrolled ? "text-black" : "text-white"
              }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <IoClose className="text-2xl" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <IoMenu className="text-2xl" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu - Premium Design */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              className="fixed top-24 left-0 right-0 bg-white z-50 md:hidden border-b border-black/10 shadow-2xl"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="px-6 py-8 space-y-1">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    <Link
                      to={item.href}
                      className="group relative block px-4 py-4 text-black text-sm font-light uppercase tracking-[0.2em] hover:text-yellow-500 transition-colors duration-300 border-l-2 border-transparent hover:border-yellow-500"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="relative z-10 flex items-center justify-between">
                        {item.label}
                        <motion.span
                          className="text-yellow-500 opacity-0 group-hover:opacity-100"
                          initial={{ x: -10 }}
                          whileHover={{ x: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          →
                        </motion.span>
                      </span>
                      <motion.div
                        className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 origin-top"
                        initial={{ scaleY: 0 }}
                        whileHover={{ scaleY: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    </Link>
                  </motion.div>
                ))}

                {/* Mobile CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: navItems.length * 0.1, duration: 0.4 }}
                  className="pt-4 mt-4 border-t border-black/10"
                >
                  <Link
                    to="/events"
                    className="block w-full px-6 py-4 bg-yellow-500 text-black text-sm font-light uppercase tracking-[0.3em] text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register Now →
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
