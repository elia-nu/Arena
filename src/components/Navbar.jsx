import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { IoMenu, IoClose, IoCart, IoLogOutOutline } from "react-icons/io5";
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
  const navRef = useRef(null);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { getCartItemCount } = useCart();
  const navigate = useNavigate();
  const cartItemCount = getCartItemCount();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    // Check initial scroll position
    handleScroll();

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load public settings so we can toggle Social and Shop links
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await contactAPI.getInfo();
        const socialEnabled = data?.contactInfo?.socialPageEnabled;
        const shopEnabled = data?.contactInfo?.shopPageEnabled;
        if (typeof socialEnabled === "boolean") {
          setSocialPageEnabled(socialEnabled);
        } else {
          setSocialPageEnabled(true);
        }
        if (typeof shopEnabled === "boolean") {
          setShopPageEnabled(shopEnabled);
        } else {
          setShopPageEnabled(true);
        }
      } catch (error) {
        console.error("Error loading site settings:", error);
        setSocialPageEnabled(true);
        setShopPageEnabled(true);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

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
    { label: "Home", href: "/" },
    { label: "About", href: "/about-us" },
    { label: "Events", href: "/events" },
    { label: "Community Impact", href: "/community-impact" },
    { label: "Shop", href: "/shop" },
    { label: "Gallery", href: "/gallery" },
    { label: "Social", href: "/social" },
    { label: "Contact", href: "/contact" },
  ];

  const navItems = baseNavItems.filter((item) => {
    if (!socialPageEnabled && item.href === "/social") return false;
    if (!shopPageEnabled && item.href === "/shop") return false;
    return true;
  });

  const isActive = (href) => {
    return location.pathname === href;
  };

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-3 left-3 right-3 sm:top-4 sm:left-6 sm:right-6 md:top-5 md:left-10 md:right-10 z-50 rounded-2xl md:rounded-full transition-all duration-500 ${
          isScrolled
            ? "bg-neutral-950/85 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.85)]"
            : "bg-black/45 backdrop-blur-xl border border-white/12 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        }`}
      >
        {/* Animated gradient background on hover */}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-14 sm:h-15 md:h-22">
            {/* Logo */}
            <a
              href="/"
              className="flex items-center gap-2.5 sm:gap-3 group relative py-1 select-none"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              {/* Badge mark — mirrors the circular logo */}
              <div className="relative flex-shrink-0">
                {/* Hover glow */}
                <div className="absolute -inset-1.5 rounded-full bg-secondary-500/25 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Outer orange ring */}
                <div
                  className="relative flex items-center justify-center rounded-full transition-transform duration-500 group-hover:scale-105"
                  style={{
                    width: 52,
                    height: 52,
                    background: "linear-gradient(135deg, #fe5723 0%, #ff8b42 50%, #fe5723 100%)",
                    padding: 2.5,
                  }}
                >
                  {/* Inner dark circle */}
                  <div
                    className="w-full h-full rounded-full flex flex-col items-center justify-center overflow-hidden"
                    style={{ background: "#1a1a1a" }}
                  >
                    {/* Actual logo image inside the dark circle */}
                    <img
                      src={logo}
                      alt="The Arena"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                </div>

                {/* Spinning ring on hover */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-dashed border-secondary-500/0 group-hover:border-secondary-500/40 transition-all duration-700"
                  style={{ animation: "spin-slow 8s linear infinite" }}
                />
              </div>

              {/* Wordmark — text version of the logo for desktop */}
              <div className="hidden sm:flex flex-col leading-none">
                <span
                  className="font-black uppercase tracking-tight text-white transition-colors duration-300"
                  style={{ fontSize: 15, letterSpacing: "-0.02em" }}
                >
                  THE{" "}
                  <span
                    style={{
                      background: "linear-gradient(135deg, #fe5723, #ff8b42)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    ARENA
                  </span>
                </span>
                <span
                  className="font-bold uppercase tracking-widest text-secondary-400 transition-colors duration-300 group-hover:text-secondary-300"
                  style={{ fontSize: 7.5, letterSpacing: "0.22em" }}
                >
                  LETS RUMBLE
                </span>
              </div>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.label)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`relative px-3 md:px-3 xl:px-4 py-2.5 text-sm transition-all duration-300 rounded-lg group ${
                    isActive(item.href)
                      ? "text-secondary-400 font-bold"
                      : "text-white/80 hover:text-white font-medium"
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>

                  {/* Orange underline animation - expands from center */}
                  <div
                    className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 transition-all duration-500 ease-out w-[80%] bg-secondary-500 ${
                      hoveredItem === item.label || isActive(item.href)
                        ? "w-full opacity-100 shadow-[0_0_8px_#fe5723]"
                        : "w-0 opacity-0"
                    }`}
                  />
                </a>
              ))}

              {/* Cart Icon */}
              {shopPageEnabled && (
                <a
                  href="/cart"
                  className={`relative p-2.5 transition-all duration-300 rounded-lg group ${
                    isActive("/cart")
                      ? "text-secondary-400 font-semibold"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  <IoCart className="w-5 h-5 xl:w-6 xl:h-6" />
                  {/* Cart Badge */}
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-secondary-500/50">
                      {cartItemCount}
                    </span>
                  )}
                </a>
              )}

              {/* Elegant Divider */}
              <div className="w-px h-6 bg-white/15 mx-2 xl:mx-3" />

              {/* Auth Buttons */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <span
                    className={`text-xs xl:text-sm font-medium text-white/90 max-w-[80px] xl:max-w-none truncate`}
                  >
                    {user?.username || user?.email}
                  </span>
                  {user?.role === "admin" && (
                    <a
                      href="/admin"
                      className="px-3 xl:px-4 py-1.5 text-xs xl:text-sm font-semibold rounded-lg transition-all duration-300 text-secondary-400 hover:text-white hover:bg-white/10"
                    >
                      Dashboard
                    </a>
                  )}
                  {user?.role === "team_leader" && (
                    <a
                      href="/team-leader"
                      className="px-3 xl:px-4 py-1.5 text-xs xl:text-sm font-semibold rounded-lg transition-all duration-300 text-secondary-400 hover:text-white hover:bg-white/10"
                    >
                      Dashboard
                    </a>
                  )}
                  {user?.role === "player" && (
                    <a
                      href="/player"
                      className="px-3 xl:px-4 py-1.5 text-xs xl:text-sm font-semibold rounded-lg transition-all duration-300 text-secondary-400 hover:text-white hover:bg-white/10"
                    >
                      Dashboard
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    aria-label="Logout"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs xl:text-sm border border-secondary-500/50 text-secondary-400 font-semibold rounded-lg transition-all duration-300 hover:bg-secondary-500 hover:text-white"
                  >
                    <IoLogOutOutline className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <a
                    href="/login"
                    className={`px-3 xl:px-4 py-2 text-xs xl:text-sm font-semibold rounded-lg transition-all duration-300 ${
                      isActive("/login")
                        ? "text-secondary-400"
                        : "text-white/80 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Login
                  </a>
                  <a
                    href="/register"
                    className="relative px-4 xl:px-6 py-2 xl:py-2.5 font-bold text-xs xl:text-sm text-white rounded-full overflow-hidden group transition-all duration-300 hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, #fe5723 0%, #ff7a40 100%)",
                      boxShadow: "0 0 20px rgba(254,87,35,0.4)",
                    }}
                  >
                    <span className="relative z-10 flex items-center gap-1.5">
                      Register
                      <svg
                        className="w-3 h-3 xl:w-4 xl:h-4 transition-transform duration-300 group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </span>
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </a>
                </div>
              )}
            </div>

            {/* Mobile/Tablet Menu Button */}
            <button
              className="lg:hidden p-2 sm:p-2.5 transition-all duration-300 rounded-lg relative group text-white hover:bg-white/10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                <span
                  className={`absolute top-0 left-0 w-full h-0.5 bg-current transition-all duration-300 ${
                    isMenuOpen ? "rotate-45 top-2 sm:top-2.5" : ""
                  }`}
                />
                <span
                  className={`absolute top-2 sm:top-2.5 left-0 w-full h-0.5 bg-current transition-all duration-300 ${
                    isMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute bottom-0 left-0 w-full h-0.5 bg-current transition-all duration-300 ${
                    isMenuOpen ? "-rotate-45 bottom-2 sm:bottom-2.5" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Premium Mobile/Tablet Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 bg-primary-950/70 backdrop-blur-md z-40 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
            style={{
              animation: "fadeIn 0.3s ease-out",
            }}
          />

          {/* Menu Panel */}
          <div
            className="fixed top-20 sm:top-22 md:top-24 left-3 right-3 sm:left-6 sm:right-6 md:left-auto md:right-10 md:w-96 bg-neutral-950/95 backdrop-blur-2xl z-50 lg:hidden rounded-2xl shadow-2xl border border-white/12 overflow-hidden max-h-[calc(100vh-6rem)] overflow-y-auto"
            style={{
              animation: "slideDown 0.4s ease-out",
            }}
          >
            <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-2">
              {navItems.map((item, index) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`block py-3 sm:py-4 px-4 sm:px-5 text-sm sm:text-base font-medium rounded-xl transition-all duration-300 ${
                    isActive(item.href)
                      ? "font-bold text-secondary-400 bg-secondary-500/10 border-l-2 border-secondary-500"
                      : "text-white/80 hover:text-white hover:bg-white/5"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                  style={{
                    animation: `fadeInUp 0.3s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>{item.label}</span>
                  </div>
                </a>
              ))}

              {/* Cart Link in Mobile */}
              {shopPageEnabled && (
              <a
                href="/cart"
                className={`flex items-center justify-between py-3 sm:py-4 px-4 sm:px-5 text-sm sm:text-base font-medium rounded-xl transition-all duration-300 ${
                  isActive("/cart")
                    ? "font-bold text-secondary-400 bg-secondary-500/10 border-l-2 border-secondary-500"
                    : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  animation: `fadeInUp 0.3s ease-out ${
                    navItems.length * 0.1
                  }s both`,
                }}
              >
                <span className="flex items-center gap-1.5">
                  <IoCart className="w-5 h-5 text-secondary-400" />
                  <span>Shopping Cart</span>
                </span>
                {cartItemCount > 0 && (
                  <span className="w-6 h-6 bg-secondary-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-secondary-500/50">
                    {cartItemCount}
                  </span>
                )}
              </a>
              )}

              {/* Mobile/Tablet Auth */}
              <div className="pt-4 sm:pt-6 mt-3 sm:mt-4 border-t border-white/10 space-y-2">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 sm:px-5 py-2 sm:py-3 text-white text-xs sm:text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold truncate flex-1 text-white/90">
                          {user?.username || user?.email}
                        </p>
                        <div onClick={() => setIsMenuOpen(false)}>
                          <NotificationBell />
                        </div>
                      </div>
                      {user?.role === "admin" && (
                        <a
                          href="/admin"
                          className="block mt-2 px-4 sm:px-5 py-2 rounded-lg bg-secondary-500/15 text-secondary-400 hover:bg-secondary-500/25 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Dashboard
                        </a>
                      )}
                      {user?.role === "team_leader" && (
                        <a
                          href="/team-leader"
                          className="block mt-2 px-4 sm:px-5 py-2 rounded-lg bg-secondary-500/15 text-secondary-400 hover:bg-secondary-500/25 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Dashboard
                        </a>
                      )}
                      {user?.role === "player" && (
                        <a
                          href="/player"
                          className="block mt-2 px-4 sm:px-5 py-2 rounded-lg bg-secondary-500/15 text-secondary-400 hover:bg-secondary-500/25 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Dashboard
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                        navigate("/");
                      }}
                      aria-label="Logout"
                      className="block w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/10 text-white text-sm sm:text-base font-semibold rounded-xl text-center transition-all duration-300 active:scale-95 hover:bg-white/15"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href="/login"
                      className={`block w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border border-white/10 text-sm sm:text-base font-semibold rounded-xl text-center transition-all duration-300 active:scale-95 hover:bg-white/10 ${
                        isActive("/login")
                          ? "text-secondary-400 border-secondary-500/40"
                          : "text-white"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </a>
                    <a
                      href="/register"
                      className="block w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white text-sm sm:text-base font-bold rounded-xl text-center transition-all duration-300 active:scale-95 shadow-lg shadow-secondary-500/30"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Register Now
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0;
            transform: translateY(10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;
