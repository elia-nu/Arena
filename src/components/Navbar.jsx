import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoCart,
  IoLogOutOutline,
  IoFlame,
  IoChevronForward,
} from "react-icons/io5";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import NotificationBell from "./NotificationBell";
import logo from "../../public/logo.jpg";
import { contactAPI } from "../services/api";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [socialPageEnabled, setSocialPageEnabled] = useState(true);
  const [shopPageEnabled, setShopPageEnabled] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { getCartItemCount } = useCart();
  const cartItemCount = getCartItemCount();

  // Scroll detection with threshold
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch dynamic page toggles
  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const data = await contactAPI.getInfo();
        if (!isMounted) return;
        const socialEnabled = data?.contactInfo?.socialPageEnabled;
        const shopEnabled = data?.contactInfo?.shopPageEnabled;
        setSocialPageEnabled(typeof socialEnabled === "boolean" ? socialEnabled : true);
        setShopPageEnabled(typeof shopEnabled === "boolean" ? shopEnabled : true);
      } catch (error) {
        console.error("Error loading site settings:", error);
        if (isMounted) {
          setSocialPageEnabled(true);
          setShopPageEnabled(true);
        }
      }
    };
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const baseNavItems = [
    { label: "Home", href: "/", badge: null, tag: "01" },
    { label: "About", href: "/about-us", badge: null, tag: "02" },
    { label: "Events", href: "/events", badge: "LIVE", tag: "03" },
    { label: "Shop", href: "/shop", badge: null, tag: "04" },
    { label: "Gallery", href: "/gallery", badge: null, tag: "05" },
    { label: "Social", href: "/social", badge: null, tag: "06" },
    { label: "Contact", href: "/contact", badge: null, tag: "07" },
  ];

  const navItems = baseNavItems.filter((item) => {
    if (!socialPageEnabled && item.href === "/social") return false;
    if (!shopPageEnabled && item.href === "/shop") return false;
    return true;
  });

  const isActive = (href) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  // User display helper
  const userInitials =
    user?.username?.slice(0, 2).toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    "AR";

  const getRoleLabel = (role) => {
    switch (role) {
      case "admin":
        return { title: "ADMIN", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
      case "team_leader":
        return { title: "CAPTAIN", color: "bg-sky-500/20 text-sky-400 border-sky-500/30" };
      case "player":
        return { title: "BALLER", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" };
      default:
        return { title: "MEMBER", color: "bg-white/10 text-white/70 border-white/20" };
    }
  };

  const roleMeta = getRoleLabel(user?.role);

  return (
    <>
      {/* ── Main Floating Island Navbar (Clean, Flat, No Glow, No Gradient) ── */}
      <header
        className={`fixed top-2 sm:top-4 inset-x-2 sm:inset-x-5 md:inset-x-8 max-w-7xl mx-auto z-50 transition-all duration-300 ${
          isScrolled ? "translate-y-0" : "translate-y-0.5"
        }`}
      >
        <div
          className={`relative rounded-2xl md:rounded-full transition-all duration-300 ${
            isScrolled
              ? "bg-neutral-950/95 backdrop-blur-md border border-white/10 shadow-lg"
              : "bg-neutral-950/85 backdrop-blur-md border border-white/10 shadow-md"
          }`}
        >
          <div className="px-3 sm:px-5 md:px-6 lg:px-8">
            <div className="flex items-center justify-between h-15 sm:h-16 md:h-20">
              {/* ── Left: Logo & Wordmark & Matchday Beacon ── */}
              <div className="flex items-center gap-3 md:gap-5">
                <Link
                  to="/"
                  className="flex items-center gap-2.5 sm:gap-3 group select-none relative py-1"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  {/* Circular Dual-Cannon Badge */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="relative flex items-center justify-center rounded-full bg-secondary-500 transition-transform duration-300 group-hover:scale-105"
                      style={{
                        width: 44,
                        height: 44,
                        padding: 2,
                      }}
                    >
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-[#111113]"
                      >
                        <img
                          src={logo}
                          alt="The Arena"
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                    </div>

                    {/* Revolving tactical dashed ring */}
                    <div
                      className="absolute -inset-1 rounded-full border border-dashed border-secondary-500/40 pointer-events-none"
                      style={{ animation: "spin-slow 14s linear infinite" }}
                    />
                  </div>

                  {/* Brand Wordmark (Geometric Stencil display) */}
                  <div className="flex flex-col leading-none">
                    <span
                      className="text-sm sm:text-base uppercase tracking-wider text-white"
                      style={{
                        fontFamily: '"Saira Stencil One", "Allerta Stencil", sans-serif',
                      }}
                    >
                      THE{" "}
                      <span className="text-secondary-500">
                        ARENA
                      </span>
                    </span>
                    <span
                      className="uppercase text-[9px] text-secondary-400 mt-0.5 tracking-[0.24em]"
                      style={{
                        fontFamily: '"Big Shoulders Stencil Display", "Big Shoulders Stencil Text", sans-serif',
                        fontWeight: 800,
                      }}
                    >
                      LETS RUMBLE
                    </span>
                  </div>
                </Link>

                {/* Matchday / Season Active Badge (Desktop) */}
                <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-secondary-500/30 bg-secondary-500/10">
                  <span className="w-2 h-2 rounded-full bg-secondary-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-secondary-400">
                    SEASON 2026
                  </span>
                </div>
              </div>

              {/* ── Center: Flat Fluid Desktop Navigation ── */}
              <nav
                className="hidden lg:flex items-center gap-1 p-1.5 rounded-full bg-white/[0.04] border border-white/10"
                onMouseLeave={() => setHoveredItem(null)}
              >
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  const isHovered = hoveredItem === item.label;

                  return (
                    <Link
                      key={item.label}
                      to={item.href}
                      onMouseEnter={() => setHoveredItem(item.label)}
                      className={`relative px-3.5 xl:px-4 py-2 text-xs xl:text-sm font-semibold rounded-full transition-colors duration-150 select-none group flex items-center gap-1.5 ${
                        active
                          ? "text-white"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      {/* Clean flat pill indicator */}
                      {(isHovered || (active && !hoveredItem)) && (
                        <motion.span
                          layoutId="activeNavPill"
                          className="absolute inset-0 rounded-full bg-secondary-500/20 border border-secondary-500/40"
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 32,
                          }}
                        />
                      )}

                      <span className="relative z-10">{item.label}</span>

                      {/* Micro tag for Events */}
                      {item.badge && (
                        <span className="relative z-10 px-1.5 py-0.2 text-[9px] font-black uppercase rounded-full bg-secondary-500 text-white">
                          {item.badge}
                        </span>
                      )}

                      {/* Active tiny dot */}
                      {active && (
                        <motion.span
                          layoutId="activeDot"
                          className="relative z-10 w-1 h-1 rounded-full bg-secondary-400"
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* ── Right: Tactical Hub (Cart, Profile / Auth, Mobile Toggle) ── */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Cart Action Pill */}
                {shopPageEnabled && (
                  <Link
                    to="/cart"
                    className={`relative p-2 sm:p-2.5 rounded-full border transition-all duration-200 group flex items-center justify-center ${
                      isActive("/cart")
                        ? "border-secondary-500 bg-secondary-500/20 text-secondary-400"
                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white/80 hover:text-white"
                    }`}
                    aria-label="View Shopping Cart"
                  >
                    <IoCart className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-105" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-secondary-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Notifications */}
                {isAuthenticated && (
                  <div className="hidden sm:block">
                    <NotificationBell />
                  </div>
                )}

                {/* Divider on desktop */}
                <div className="hidden sm:block w-px h-6 bg-white/15 mx-1" />

                {/* User Auth Section (Desktop) */}
                {isAuthenticated ? (
                  <div className="hidden sm:flex items-center gap-2">
                    {/* User Capsule */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <div className="w-6 h-6 rounded-full bg-secondary-500 text-white font-black text-[10px] flex items-center justify-center">
                        {userInitials}
                      </div>
                      <span className="text-xs font-semibold text-white/90 max-w-[90px] xl:max-w-[130px] truncate">
                        {user?.username || user?.email}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border ${roleMeta.color}`}
                      >
                        {roleMeta.title}
                      </span>
                    </div>

                    {/* Role Dashboard Quick Link */}
                    {user?.role === "admin" && (
                      <Link
                        to="/admin"
                        className="px-3 py-1.5 text-xs font-bold rounded-full border border-secondary-500/40 bg-secondary-500/10 text-secondary-400 hover:bg-secondary-500 hover:text-white transition-colors duration-200"
                      >
                        Admin
                      </Link>
                    )}
                    {user?.role === "team_leader" && (
                      <Link
                        to="/team-leader"
                        className="px-3 py-1.5 text-xs font-bold rounded-full border border-secondary-500/40 bg-secondary-500/10 text-secondary-400 hover:bg-secondary-500 hover:text-white transition-colors duration-200"
                      >
                        Captain
                      </Link>
                    )}
                    {user?.role === "player" && (
                      <Link
                        to="/player"
                        className="px-3 py-1.5 text-xs font-bold rounded-full border border-secondary-500/40 bg-secondary-500/10 text-secondary-400 hover:bg-secondary-500 hover:text-white transition-colors duration-200"
                      >
                        Dashboard
                      </Link>
                    )}

                    {/* Logout Button */}
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        navigate("/");
                      }}
                      title="Log Out"
                      aria-label="Logout"
                      className="p-2 rounded-full border border-white/10 hover:border-red-500/50 bg-white/5 hover:bg-red-500/10 text-white/70 hover:text-red-400 transition-colors duration-200"
                    >
                      <IoLogOutOutline className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-2">
                    <Link
                      to="/login"
                      className={`px-3.5 py-2 text-xs xl:text-sm font-semibold rounded-full transition-colors duration-200 ${
                        isActive("/login")
                          ? "text-secondary-400 bg-secondary-500/10"
                          : "text-white/80 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Login
                    </Link>

                    {/* Flat Solid "Join Arena" CTA Button */}
                    <Link
                      to="/register"
                      className="relative px-4 xl:px-5 py-2 xl:py-2.5 font-black text-xs uppercase tracking-wider text-white rounded-full bg-secondary-500 hover:bg-secondary-600 transition-colors duration-200 flex items-center gap-1.5"
                    >
                      <IoFlame className="w-3.5 h-3.5 text-white" />
                      Join Arena
                      <IoChevronForward className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}

                {/* ── Mobile/Tablet Toggle Button ── */}
                <button
                  type="button"
                  className="lg:hidden p-2 sm:p-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors duration-200 focus:outline-none"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Toggle Navigation Menu"
                  aria-expanded={isMenuOpen}
                >
                  <div className="relative w-5 h-5 flex flex-col items-center justify-center gap-1">
                    <span
                      className={`h-0.5 w-4 bg-current rounded-full transition-all duration-300 ${
                        isMenuOpen ? "rotate-45 translate-y-1.5 w-4.5 bg-secondary-400" : ""
                      }`}
                    />
                    <span
                      className={`h-0.5 w-4 bg-current rounded-full transition-all duration-300 ${
                        isMenuOpen ? "opacity-0 -translate-x-2" : ""
                      }`}
                    />
                    <span
                      className={`h-0.5 w-4 bg-current rounded-full transition-all duration-300 ${
                        isMenuOpen ? "-rotate-45 -translate-y-1.5 w-4.5 bg-secondary-400" : ""
                      }`}
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile & Tablet Drawer (Flat, No Glows) ── */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/85 z-40 lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu Drawer */}
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="fixed top-20 sm:top-24 left-3 right-3 sm:left-6 sm:right-6 md:left-auto md:right-8 md:w-[420px] bg-neutral-950 z-50 lg:hidden rounded-2xl shadow-xl border border-white/10 overflow-hidden max-h-[calc(100vh-6.5rem)] flex flex-col"
            >
              {/* Tactical Header Strip */}
              <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                    THE ARENA HUD NAVIGATION
                  </span>
                </div>
                <span className="text-[10px] font-bold text-secondary-400 tracking-wider">
                  2026 TOUR
                </span>
              </div>

              {/* Navigation Links */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-1.5 flex-1">
                {navItems.map((item, index) => {
                  const active = isActive(item.href);
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Link
                        to={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 sm:py-3.5 rounded-xl text-sm font-bold transition-colors duration-150 border ${
                          active
                            ? "bg-secondary-500/15 border-secondary-500/50 text-secondary-400"
                            : "bg-white/[0.03] border-white/5 text-white/80 hover:bg-white/[0.07] hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-mono text-white/30 font-light">
                            {item.tag}
                          </span>
                          <span className="tracking-wide">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-secondary-500 text-white">
                              {item.badge}
                            </span>
                          )}
                          <IoChevronForward
                            className={`w-4 h-4 transition-transform duration-200 ${
                              active ? "text-secondary-400" : "text-white/20"
                            }`}
                          />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Cart link in mobile */}
                {shopPageEnabled && (
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: navItems.length * 0.03 }}
                  >
                    <Link
                      to="/cart"
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-colors duration-150 border ${
                        isActive("/cart")
                          ? "bg-secondary-500/15 border-secondary-500/50 text-secondary-400"
                          : "bg-white/[0.03] border-white/5 text-white/80 hover:bg-white/[0.07] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IoCart className="w-4 h-4 text-secondary-400" />
                        <span>Shopping Cart</span>
                      </div>
                      {cartItemCount > 0 ? (
                        <span className="px-2 py-0.5 bg-secondary-500 text-white text-xs font-black rounded-full">
                          {cartItemCount} item{cartItemCount > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-white/40">Empty</span>
                      )}
                    </Link>
                  </motion.div>
                )}
              </div>

              {/* Mobile Auth & Action Footer */}
              <div className="p-4 sm:p-5 border-t border-white/10 bg-neutral-950 space-y-2.5">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-secondary-500 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                          {userInitials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {user?.username || user?.email}
                          </p>
                          <span
                            className={`inline-block text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full border mt-0.5 ${roleMeta.color}`}
                          >
                            {roleMeta.title}
                          </span>
                        </div>
                      </div>
                      <div onClick={() => setIsMenuOpen(false)}>
                        <NotificationBell />
                      </div>
                    </div>

                    {/* Role Dashboards */}
                    {user?.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider rounded-xl bg-secondary-500/20 text-secondary-400 border border-secondary-500/40 hover:bg-secondary-500 hover:text-white transition-colors"
                      >
                        Open Admin Dashboard
                      </Link>
                    )}
                    {user?.role === "team_leader" && (
                      <Link
                        to="/team-leader"
                        onClick={() => setIsMenuOpen(false)}
                        className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider rounded-xl bg-secondary-500/20 text-secondary-400 border border-secondary-500/40 hover:bg-secondary-500 hover:text-white transition-colors"
                      >
                        Open Captain Dashboard
                      </Link>
                    )}
                    {user?.role === "player" && (
                      <Link
                        to="/player"
                        onClick={() => setIsMenuOpen(false)}
                        className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider rounded-xl bg-secondary-500/20 text-secondary-400 border border-secondary-500/40 hover:bg-secondary-500 hover:text-white transition-colors"
                      >
                        Open Baller Dashboard
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                        navigate("/");
                      }}
                      className="w-full py-2.5 text-xs font-bold rounded-xl border border-white/10 hover:border-red-500/40 text-white/70 hover:text-red-400 bg-white/5 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <IoLogOutOutline className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="py-3 text-center text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="py-3 text-center text-xs font-black uppercase tracking-wider rounded-xl text-white bg-secondary-500 hover:bg-secondary-600 transition-colors flex items-center justify-center gap-1"
                    >
                      <IoFlame className="w-3.5 h-3.5" />
                      Join Now
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default Navbar;
