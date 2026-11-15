import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import ProductCard from "../components/shop/ProductCard";
import ShopFilters from "../components/shop/ShopFilters";
import { useCart } from "../context/CartContext";
import { shopAPI, contactAPI } from "../services/api";
import { useNotification } from "../components/NotificationProvider";
import {
  IoCart,
  IoSearch,
  IoGrid,
  IoList,
  IoFilter,
  IoClose,
  IoArrowDown,
  IoArrowForward,
  IoShieldCheckmarkOutline,
  IoFlashOutline,
  IoRefreshOutline,
  IoCarOutline,
  IoSparklesOutline,
} from "react-icons/io5";
import EmptyState from "../components/EmptyState";

const ProductSkeleton = ({ viewMode }) => {
  if (viewMode === "list") {
    return (
      <div className="bg-white border border-primary-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row gap-5 sm:gap-6 animate-pulse shadow-xs">
        <div className="w-full sm:w-48 h-56 sm:h-48 bg-primary-100 rounded-2xl" />
        <div className="flex-1 space-y-4 py-2">
          <div className="h-6 bg-primary-100 rounded-md w-2/3" />
          <div className="h-4 bg-primary-100 rounded-md w-full" />
          <div className="h-4 bg-primary-100 rounded-md w-4/5" />
          <div className="h-8 bg-primary-100 rounded-md w-1/3 mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-primary-200 rounded-3xl overflow-hidden animate-pulse shadow-xs">
      <div className="aspect-square bg-primary-100" />
      <div className="p-6 space-y-4">
        <div className="h-5 bg-primary-100 rounded-md w-3/4" />
        <div className="h-4 bg-primary-100 rounded-md w-full" />
        <div className="h-4 bg-primary-100 rounded-md w-2/3" />
        <div className="h-8 bg-primary-100 rounded-md w-1/3 pt-2" />
        <div className="h-11 bg-primary-100 rounded-xl w-full" />
      </div>
    </div>
  );
};

const trustPerks = [
  {
    icon: IoCarOutline,
    title: "Regional Delivery",
    desc: "Speedy dispatch in Addis Ababa & Hawassa",
  },
  {
    icon: IoFlashOutline,
    title: "Official Matchwear",
    desc: "Authentic Arena Gunners tournament kits",
  },
  {
    icon: IoShieldCheckmarkOutline,
    title: "Secure Checkout",
    desc: "Protected payment & card encryption",
  },
  {
    icon: IoRefreshOutline,
    title: "Hassle-Free Exchange",
    desc: "Easy size swaps for all apparel orders",
  },
];

const categoryPills = [
  { value: "all", label: "All Drops" },
  { value: "apparel", label: "Apparel & Kits" },
  { value: "accessories", label: "Accessories" },
  { value: "equipment", label: "Match Equipment" },
];

const Shop = () => {
  const { addToCart, getCartItemCount } = useCart();
  const navigate = useNavigate();
  const { showError } = useNotification();
  const [shopPageEnabled, setShopPageEnabled] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    priceRange: "all",
    inStock: "all",
    status: "active",
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const searchInputRef = useRef(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPagination((prev) =>
        prev.page === 1 ? prev : { ...prev, page: 1 }
      );
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status,
        sortBy,
        sortOrder,
      };

      if (filters.category !== "all") {
        params.category = filters.category;
      }

      if (filters.inStock === "true") {
        params.inStock = "true";
      }

      if (filters.priceRange !== "all") {
        const [min, max] =
          filters.priceRange === "100+"
            ? [100, null]
            : filters.priceRange.split("-").map(Number);
        if (min !== null) params.minPrice = min;
        if (max !== null) params.maxPrice = max;
      }

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const response = await shopAPI.getProducts(params);
      setProducts(response.products || []);
      setPagination((prev) => response.pagination || prev);
    } catch (error) {
      console.error("Error fetching products:", error);
      showError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await contactAPI.getInfo();
        const enabled = data?.contactInfo?.shopPageEnabled;
        setShopPageEnabled(typeof enabled === "boolean" ? enabled : true);
      } catch (error) {
        console.error("Error loading site settings:", error);
        setShopPageEnabled(true);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    if (!settingsLoaded || !shopPageEnabled) return;
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters,
    sortBy,
    sortOrder,
    pagination.page,
    debouncedSearch,
    settingsLoaded,
    shopPageEnabled,
  ]);

  const handleAddToCart = (product) => {
    if (!product.inStock) {
      showError("This product is out of stock");
      return;
    }
    addToCart({
      ...product,
      price: product.finalPrice || product.price,
    });
  };

  const resetToFirstPage = () => {
    setPagination((prev) =>
      prev.page === 1 ? prev : { ...prev, page: 1 }
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setDebouncedSearch(searchQuery.trim());
    resetToFirstPage();
  };

  const clearSearch = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    resetToFirstPage();
    searchInputRef.current?.focus();
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    resetToFirstPage();
  };

  const clearSingleFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: "all" }));
    resetToFirstPage();
  };

  const clearAllFilters = () => {
    setFilters((prev) => ({
      ...prev,
      category: "all",
      priceRange: "all",
      inStock: "all",
    }));
    setSearchQuery("");
    setDebouncedSearch("");
    resetToFirstPage();
  };

  const cartItemCount = getCartItemCount();

  const activeFilterChips = [
    filters.category !== "all" && {
      key: "category",
      label: filters.category,
    },
    filters.priceRange !== "all" && {
      key: "priceRange",
      label:
        filters.priceRange === "100+"
          ? "$100+"
          : `$${filters.priceRange.replace("-", " – $")}`,
    },
    filters.inStock === "true" && {
      key: "inStock",
      label: "In stock",
    },
    debouncedSearch && {
      key: "search",
      label: `"${debouncedSearch}"`,
    },
  ].filter(Boolean);

  const hasActiveFilters = activeFilterChips.length > 0;

  if (settingsLoaded && !shopPageEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-primary-50/30 to-white pt-24 sm:pt-28 pb-16">
        <EmptyState
          variant="shop"
          title="Shop is offline"
          description="Our shop is currently disabled by the site administrator. Please check back later."
          actionLabel="Back to home"
          actionTo="/"
        />
      </div>
    );
  }

  const shopHeroImage =
    "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=1600&h=800&fit=crop&q=80";

  return (
    <div className="min-h-screen bg-white overflow-x-hidden selection:bg-secondary-500 selection:text-white">
      {/* ─── FULL-BLEED HERO BANNER (MATCHING ABOUT & EVENTS AESTHETIC) ─── */}
      <section className="relative w-full min-h-[580px] sm:min-h-[660px] md:min-h-[740px] flex items-center pt-32 sm:pt-40 pb-20 md:pb-28 overflow-hidden bg-neutral-950">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={shopHeroImage}
            alt="The Arena Official Merchandise and Street Soccer Gear"
            className="w-full h-full object-cover object-center scale-102"
          />
          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/65 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25" />
        </div>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 w-full relative z-10">
          <div className="max-w-2xl text-left">
            {/* Top movement pill */}
            <motion.div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white/90 text-xs font-semibold tracking-wide uppercase mb-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="w-2 h-2 rounded-full bg-secondary-500 animate-pulse" />
              <span>Official Merchandise • The Arena Gunners Store</span>
            </motion.div>

            {/* Massive Bold Heading */}
            <motion.h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[0.98] mb-6 uppercase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              ARENA <span className="text-secondary-500">MERCH</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-base sm:text-lg md:text-xl text-white/90 font-light max-w-xl leading-relaxed mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Engineered for street ballers, champions, and everyday supporters. Official jerseys, accessories, and tournament kits crafted with Ethiopian football passion.
            </motion.p>

            {/* Dual CTA Buttons */}
            <motion.div
              className="flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <a
                href="#shop-catalog"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-secondary-500 hover:bg-secondary-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-lg hover:shadow-secondary-500/30 transition-all duration-200 hover:-translate-y-0.5"
              >
                EXPLORE GEAR <IoArrowDown className="text-sm" />
              </a>

              <button
                onClick={() => navigate("/cart")}
                className="relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-black/40 hover:bg-black/60 text-white font-bold text-xs uppercase tracking-widest rounded-lg border border-white/20 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5"
              >
                <IoCart className="text-base" />
                <span>VIEW CART</span>
                {cartItemCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-secondary-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </motion.div>
          </div>
        </div>

        {/* Bottom Right Tagline Watermark */}
        <motion.div
          className="absolute bottom-8 right-8 sm:bottom-12 sm:right-12 text-right select-none pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="text-[10px] tracking-[0.25em] text-secondary-500 font-bold uppercase mb-0.5">
            THE ARENA
          </div>
          <div className="text-base sm:text-lg font-black text-white tracking-wider uppercase">
            LET'S RUMBLE.
          </div>
        </motion.div>
      </section>

      {/* ─── TRUST & VALUE PERKS STRIP ─── */}
      <section className="border-b border-primary-200 bg-primary-50/70 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {trustPerks.map((perk, i) => {
              const Icon = perk.icon;
              return (
                <div key={i} className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-primary-200 text-secondary-500 flex items-center justify-center text-xl flex-shrink-0 shadow-xs">
                    <Icon />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-primary-950 leading-tight">
                      {perk.title}
                    </h4>
                    <p className="text-[11px] text-primary-500 leading-tight mt-0.5 hidden sm:block">
                      {perk.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CATALOG & PRODUCTS SECTION ─── */}
      <section id="shop-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 scroll-mt-20">
        {/* Top Controls: Search, Quick Category Pills & Views */}
        <div className="space-y-6 mb-10 pb-8 border-b border-primary-200">
          {/* Quick Category Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {categoryPills.map((pill) => {
                const isActive = filters.category === pill.value;
                return (
                  <button
                    key={pill.value}
                    onClick={() => handleFilterChange({ category: pill.value })}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                      isActive
                        ? "bg-secondary-500 text-white shadow-md shadow-secondary-500/25"
                        : "bg-primary-100 hover:bg-primary-200/70 text-primary-700 hover:text-primary-950 border border-primary-200"
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Total items badge */}
            <span className="text-xs text-primary-500 uppercase tracking-widest font-semibold">
              {loading
                ? "Loading products..."
                : `${pagination.total} ${
                    pagination.total === 1 ? "Item Available" : "Items Available"
                  }`}
            </span>
          </div>

          {/* Search Input & Sort & Views */}
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex-1 w-full relative">
              <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 text-lg" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search jerseys, hoodies, balls, shin guards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-2xl border border-primary-200 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/20 outline-none text-sm bg-primary-50/50 focus:bg-white transition-all placeholder-primary-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-primary-400 hover:text-primary-950 transition-colors"
                  aria-label="Clear search"
                >
                  <IoClose className="text-lg" />
                </button>
              )}
            </form>

            {/* Sort & Mobile Filter Buttons */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              {/* Mobile Filter Toggle */}
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-primary-200 bg-white hover:bg-primary-50 text-xs font-bold uppercase tracking-wider text-primary-800 transition-colors shadow-xs"
              >
                <IoFilter className="text-base text-secondary-500" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-5 h-5 rounded-full bg-secondary-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFilterChips.length}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-primary-100/70 p-1 rounded-2xl border border-primary-200">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    resetToFirstPage();
                  }}
                  className="text-xs font-bold text-primary-800 outline-none bg-transparent py-1.5 px-3 cursor-pointer uppercase tracking-wider"
                >
                  <option value="createdAt">Newest First</option>
                  <option value="price">Price</option>
                  <option value="name">Product Name</option>
                </select>
                <button
                  onClick={() => {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    resetToFirstPage();
                  }}
                  className="w-7 h-7 rounded-xl bg-white text-xs font-bold text-primary-800 hover:text-secondary-600 transition-colors flex items-center justify-center shadow-xs"
                  aria-label={
                    sortOrder === "asc" ? "Sort descending" : "Sort ascending"
                  }
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>

              {/* Grid / List View Toggle */}
              <div className="flex items-center gap-1 bg-primary-100/70 p-1 rounded-2xl border border-primary-200">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all ${
                    viewMode === "grid"
                      ? "bg-white text-secondary-600 shadow-xs"
                      : "text-primary-400 hover:text-primary-800"
                  }`}
                  aria-label="Grid view"
                >
                  <IoGrid />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all ${
                    viewMode === "list"
                      ? "bg-white text-secondary-600 shadow-xs"
                      : "text-primary-400 hover:text-primary-800"
                  }`}
                  aria-label="List view"
                >
                  <IoList />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs text-primary-400 font-medium mr-1">Active filters:</span>
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() =>
                    chip.key === "search"
                      ? clearSearch()
                      : clearSingleFilter(chip.key)
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary-50 text-secondary-700 border border-secondary-200 hover:border-secondary-400 transition-colors"
                >
                  {chip.label}
                  <IoClose className="text-sm" />
                </button>
              ))}
              <button
                onClick={clearAllFilters}
                className="text-xs font-bold text-secondary-600 hover:text-secondary-700 underline underline-offset-2 ml-2 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Main Content Layout (Sidebar Filters + Products Grid) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar Filters */}
          <ShopFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            isOpen={filtersOpen}
            onClose={() => setFiltersOpen(false)}
          />

          {/* Products View */}
          <div className="flex-1 w-full">
            {loading ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
                    : "space-y-6"
                }
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductSkeleton key={i} viewMode={viewMode} />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <motion.div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
                      : "space-y-6"
                  }
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  {products.map((product, index) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: Math.min(index * 0.04, 0.3),
                        duration: 0.4,
                      }}
                    >
                      <ProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                        viewMode={viewMode}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination Controls */}
                {pagination.pages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-14 pt-8 border-t border-primary-200">
                    <button
                      onClick={() => {
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }));
                        window.scrollTo({ top: 400, behavior: "smooth" });
                      }}
                      disabled={pagination.page === 1}
                      className="px-5 py-2.5 rounded-full border border-primary-200 bg-white hover:bg-primary-50 text-xs font-bold uppercase tracking-wider text-primary-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-semibold text-primary-600 px-4">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => {
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }));
                        window.scrollTo({ top: 400, behavior: "smooth" });
                      }}
                      disabled={pagination.page >= pagination.pages}
                      className="px-5 py-2.5 rounded-full border border-primary-200 bg-white hover:bg-primary-50 text-xs font-bold uppercase tracking-wider text-primary-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                variant="shop"
                title="No products found"
                description="Try adjusting your search query or filters, or check back soon for our next official gear drop."
                actionLabel={hasActiveFilters ? "Clear all filters" : "Browse all items"}
                onAction={clearAllFilters}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Shop;
