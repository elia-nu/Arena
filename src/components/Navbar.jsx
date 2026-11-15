import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoCart,
  IoLogOutOutline,
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

  // Scroll detection
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
    { label: "Home", href: "/", badge: null },
    { label: "About", href: "/about-us", badge: null },
    { label: "Events", href: "/events", badge: "Live" },
    { label: "Shop", href: "/shop", badge: null },
    { label: "Gallery", href: "/gallery", badge: null },
    { label: "Social", href: "/social", badge: null },
    { label: "Contact", href: "/contact", badge: null },
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

  const userInitials =
    user?.username?.slice(0, 2).toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    "AR";

  const getRoleLabel = (role) => {
    switch (role) {
      case "admin":
        return { title: "Admin", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" };
      case "team_leader":
        return { title: "Captain", color: "bg-sky-500/10 text-sky-400 border-sky-500/30" };
      case "player":
        return { title: "Player", color: "bg-orange-500/10 text-orange-400 border-orange-500/30" };
      default:
        return { title: "Member", color: "bg-white/10 text-neutral-300 border-white/10" };
    }
  };

  const roleMeta = getRoleLabel(user?.role);

  return (
    <>
      {/* ── Main Floating Navigation Bar ── */}
      <header
        className={`fixed top-3 sm:top-4 inset-x-3 sm:inset-x-6 md:inset-x-8 max-w-6xl mx-auto z-50 transition-transform duration-200 ${
          isScrolled ? "translate-y-0" : "translate-y-0"
        }`}
      >
        <div
          className={`relative rounded-xl border transition-colors duration-200 ${
            isScrolled
              ? "bg-[#111215]/95 backdrop-blur-md border-neutral-800 shadow-lg"
              : "bg-[#111215]/85 backdrop-blur-md border-neutral-800/80 shadow-md"
          }`}
        >
          <div className="px-4 sm:px-6">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* ── Left: Logo & Wordmark ── */}
              <div className="flex items-center gap-4">
                <Link
                  to="/"
                  className="flex items-center gap-3 select-none py-1 group"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  {/* Clean circular logo */}
                  <div className="relative flex-shrink-0 w-9 h-9 rounded-full overflow-hidden bg-neutral-900 border border-neutral-700/60">
                    <img
                      src={logo}
                      alt="The Arena"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Clean wordmark */}
                  <div className="flex flex-col leading-none">
                    <span
                      className="text-sm font-semibold tracking-wide text-neutral-100"
                      style={{
                        fontFamily: '"Saira Stencil One", "Allerta Stencil", sans-serif',
                      }}
                    >
                      THE <span className="text-secondary-500">ARENA</span>
                    </span>
                    <span className="text-[10px] text-neutral-400 mt-0.5 tracking-wider font-medium">
                      Street Soccer
                    </span>
                  </div>
                </Link>
              </div>

              {/* ── Center: Quiet Desktop Navigation ── */}
              <nav
                className="hidden lg:flex items-center gap-1 p-1 rounded-lg bg-neutral-900/60 border border-neutral-800"
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
                      className={`relative px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 select-none flex items-center gap-1.5 ${
                        active
                          ? "text-neutral-100 bg-neutral-800"
                          : isHovered
                          ? "text-neutral-200 bg-neutral-800/40"
                          : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <span>{item.label}</span>

                      {item.badge && (
                        <span className="px-1.5 py-0.2 text-[9px] font-semibold uppercase rounded bg-secondary-500/20 text-secondary-400 border border-secondary-500/30">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* ── Right: Cart & User Actions ── */}
              <div className="flex items-center gap-2.5">
                {shopPageEnabled && (
                  <Link
                    to="/cart"
                    className={`relative p-2 rounded-lg border transition-colors duration-150 flex items-center justify-center ${
                      isActive("/cart")
                        ? "border-secondary-500/50 bg-secondary-500/10 text-secondary-400"
                        : "border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:text-white hover:bg-neutral-800"
                    }`}
                    aria-label="View Shopping Cart"
                  >
                    <IoCart className="w-4 h-4" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 bg-secondary-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center tabular-nums">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                )}

                {isAuthenticated && (
                  <div className="hidden sm:block">
                    <NotificationBell />
                  </div>
                )}

                {isAuthenticated ? (
                  <div className="hidden sm:flex items-center gap-2 pl-1">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800">
                      <div className="w-5 h-5 rounded-md bg-secondary-500 text-white font-semibold text-[10px] flex items-center justify-center">
                        {userInitials}
                      </div>
                      <span className="text-xs font-medium text-neutral-200 max-w-[110px] truncate">
                        {user?.username || user?.email}
                      </span>
                      <span
                        className={`text-[9px] font-medium uppercase px-1.5 py-0.2 rounded border ${roleMeta.color}`}
                      >
                        {roleMeta.title}
                      </span>
                    </div>

                    {user?.role === "admin" && (
                      <Link
                        to="/admin"
                        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition-colors"
                      >
                        Admin
                      </Link>
                    )}
                    {user?.role === "team_leader" && (
                      <Link
                        to="/team-leader"
                        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition-colors"
                      >
                        Captain
                      </Link>
                    )}
                    {user?.role === "player" && (
                      <Link
                        to="/player"
                        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition-colors"
                      >
                        Dashboard
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        navigate("/");
                      }}
                      title="Log out"
                      aria-label="Log out"
                      className="p-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition-colors"
                    >
                      <IoLogOutOutline className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-2 pl-1">
                    <Link
                      to="/login"
                      className="px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
                    >
                      Log in
                    </Link>

                    <Link
                      to="/register"
                      className="px-3.5 py-1.5 text-xs font-medium text-white rounded-lg bg-secondary-500 hover:bg-secondary-600 transition-colors"
                    >
                      Register
                    </Link>
                  </div>
                )}

                {/* Mobile Hamburger Toggle */}
                <button
                  type="button"
                  className="lg:hidden p-2 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white transition-colors focus:outline-none"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Toggle Navigation Menu"
                  aria-expanded={isMenuOpen}
                >
                  <div className="w-4 h-4 flex flex-col items-center justify-center gap-1">
                    <span
                      className={`h-0.5 w-4 bg-current rounded-full transition-transform duration-200 ${
                        isMenuOpen ? "rotate-45 translate-y-1.5" : ""
                      }`}
                    />
                    <span
                      className={`h-0.5 w-4 bg-current rounded-full transition-opacity duration-200 ${
                        isMenuOpen ? "opacity-0" : ""
                      }`}
                    />
                    <span
                      className={`h-0.5 w-4 bg-current rounded-full transition-transform duration-200 ${
                        isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                      }`}
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="fixed top-18 inset-x-3 sm:inset-x-6 md:w-[380px] md:left-auto md:right-8 bg-[#131418] z-50 lg:hidden rounded-xl border border-neutral-800 shadow-xl overflow-hidden max-h-[calc(100vh-5.5rem)] flex flex-col"
            >
              <div className="p-4 space-y-1 overflow-y-auto flex-1">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.label}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        active
                          ? "bg-neutral-800 text-neutral-100"
                          : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
                      }`}
                    >
                      <span>{item.label}</span>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span className="px-1.5 py-0.2 text-[9px] font-medium uppercase rounded bg-secondary-500/20 text-secondary-400">
                            {item.badge}
                          </span>
                        )}
                        <IoChevronForward className="w-3.5 h-3.5 text-neutral-600" />
                      </div>
                    </Link>
                  );
                })}

                {shopPageEnabled && (
                  <Link
                    to="/cart"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive("/cart")
                        ? "bg-neutral-800 text-neutral-100"
                        : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IoCart className="w-3.5 h-3.5" />
                      <span>Shopping Cart</span>
                    </div>
                    {cartItemCount > 0 ? (
                      <span className="px-1.5 py-0.2 bg-secondary-500 text-white text-[10px] font-semibold rounded">
                        {cartItemCount}
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-600">0</span>
                    )}
                  </Link>
                )}
              </div>

              {/* Mobile Auth Footer */}
              <div className="p-4 border-t border-neutral-800 bg-[#0f1013]">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded bg-secondary-500 text-white font-semibold text-[10px] flex items-center justify-center">
                          {userInitials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-neutral-200 truncate">
                            {user?.username || user?.email}
                          </p>
                          <span
                            className={`inline-block text-[9px] font-medium uppercase px-1 py-0.1 rounded border ${roleMeta.color}`}
                          >
                            {roleMeta.title}
                          </span>
                        </div>
                      </div>
                      <div onClick={() => setIsMenuOpen(false)}>
                        <NotificationBell />
                      </div>
                    </div>

                    {user?.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="block w-full py-2 text-center text-xs font-medium rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition-colors"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    {user?.role === "team_leader" && (
                      <Link
                        to="/team-leader"
                        onClick={() => setIsMenuOpen(false)}
                        className="block w-full py-2 text-center text-xs font-medium rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition-colors"
                      >
                        Captain Dashboard
                      </Link>
                    )}
                    {user?.role === "player" && (
                      <Link
                        to="/player"
                        onClick={() => setIsMenuOpen(false)}
                        className="block w-full py-2 text-center text-xs font-medium rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition-colors"
                      >
                        Player Dashboard
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                        navigate("/");
                      }}
                      className="w-full py-2 text-xs font-medium rounded-lg border border-neutral-800 text-neutral-400 hover:text-neutral-200 bg-neutral-900 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <IoLogOutOutline className="w-3.5 h-3.5" />
                      Log out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="py-2 text-center text-xs font-medium rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 transition-colors"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="py-2 text-center text-xs font-medium rounded-lg text-white bg-secondary-500 hover:bg-secondary-600 transition-colors"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
