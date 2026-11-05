import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { HiMenu, HiX, HiChevronDown } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../../public/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setActiveDropdown(null);
  }, [location]);

  const navLinks = [
    {
      name: "Home",
      path: "/",
    },
    {
      name: "Programs",
      path: "/events",
      submenu: [
        { name: "Youth Soccer", path: "/events/youth" },
        { name: "Adult Leagues", path: "/events/adult" },
        { name: "Training Camps", path: "/events/camps" },
      ],
    },
    {
      name: "Teams",
      path: "/teams",
      submenu: [
        { name: "Competitive", path: "/teams/competitive" },
        { name: "Recreational", path: "/teams/recreational" },
        { name: "Coaching Staff", path: "/teams/coaches" },
      ],
    },
    {
      name: "Gallery",
      path: "/gallery",
    },
    {
      name: "Shop",
      path: "/shop",
    },
    {
      name: "Contact",
      path: "/contact",
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white shadow-lg border-b border-gray-200"
            : "bg-white/90 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <img
                    src={logo}
                    alt="The Arena"
                    className="h-10 w-10 lg:h-12 lg:w-12 object-contain transition-transform duration-300 group-hover:rotate-12"
                  />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                    The Arena
                  </h1>
                  <p className="text-xs text-gray-600 -mt-1">Soccer Academy</p>
                </div>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <div
                  key={link.name}
                  className="relative"
                  onMouseEnter={() =>
                    link.submenu && setActiveDropdown(link.name)
                  }
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    to={link.path}
                    className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive(link.path)
                        ? "bg-yellow-100 text-yellow-800"
                        : "text-gray-700 hover:bg-yellow-50 hover:text-yellow-700"
                    }`}
                  >
                    <span className="flex items-center space-x-1">
                      <span>{link.name}</span>
                      {link.submenu && (
                        <HiChevronDown
                          className={`w-4 h-4 transition-transform duration-300 ${
                            activeDropdown === link.name ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </span>

                    {/* Active indicator */}
                    {isActive(link.path) && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500 rounded-full"
                      />
                    )}
                  </Link>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {link.submenu && activeDropdown === link.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 overflow-hidden"
                      >
                        <div className="absolute -top-1 left-6 w-2 h-2 bg-white border-l border-t border-gray-200 rotate-45"></div>
                        {link.submenu.map((item, index) => (
                          <motion.div
                            key={item.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Link
                              to={item.path}
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors duration-200 group"
                            >
                              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                              {item.name}
                            </Link>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden lg:flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/events"
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Join Now
                </Link>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-yellow-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HiX className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HiMenu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Mobile Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="fixed top-16 lg:top-20 left-0 right-0 bg-white z-50 lg:hidden shadow-2xl border-b border-gray-200 max-h-[calc(100vh-4rem)] overflow-y-auto"
            >
              <div className="px-6 py-8 space-y-6">
                {/* Mobile Navigation Links */}
                <div className="space-y-2">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={link.path}
                        className={`flex items-center justify-between px-4 py-4 text-lg font-medium rounded-xl transition-all duration-300 ${
                          isActive(link.path)
                            ? "bg-yellow-100 text-yellow-800 shadow-sm"
                            : "text-gray-700 hover:bg-yellow-50"
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        <span>{link.name}</span>
                        {link.submenu && (
                          <HiChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </Link>

                      {/* Mobile Submenu */}
                      {link.submenu && (
                        <div className="mt-2 ml-4 space-y-1 border-l-2 border-yellow-200 pl-4">
                          {link.submenu.map((item, subIndex) => (
                            <motion.div
                              key={item.name}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                delay: index * 0.1 + subIndex * 0.05 + 0.2,
                              }}
                            >
                              <Link
                                to={item.path}
                                className="block px-3 py-2 text-sm text-gray-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                                onClick={() => setIsOpen(false)}
                              >
                                {item.name}
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Mobile CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="pt-6 border-t border-gray-200"
                >
                  <Link
                    to="/events"
                    className="block w-full px-6 py-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-center rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    Join Now
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
