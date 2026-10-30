import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
} from "react-icons/io5";
import EmptyState from "../components/EmptyState";

const ProductSkeleton = ({ viewMode }) => {
  if (viewMode === "list") {
    return (
      <div className="bg-secondary-50 border border-secondary-200 p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 animate-pulse">
        <div className="w-full sm:w-48 h-56 sm:h-48 bg-primary-100" />
        <div className="flex-1 space-y-4 py-2">
          <div className="h-6 bg-primary-100 w-2/3" />
          <div className="h-4 bg-primary-100 w-full" />
          <div className="h-4 bg-primary-100 w-4/5" />
          <div className="h-8 bg-primary-100 w-1/3 mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary-50 border border-secondary-200 overflow-hidden animate-pulse">
      <div className="aspect-square bg-primary-100" />
      <div className="p-6 sm:p-8 space-y-4">
        <div className="h-5 bg-primary-100 w-3/4" />
        <div className="h-4 bg-primary-100 w-full" />
        <div className="h-4 bg-primary-100 w-2/3" />
        <div className="h-8 bg-primary-100 w-1/3 pt-4" />
        <div className="h-11 bg-primary-100 w-full" />
      </div>
    </div>
  );
};

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

  return (
    <div className="min-h-screen bg-primary-50 pt-24 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, ${
              getComputedStyle(document.documentElement).getPropertyValue(
                "--color-primary-950"
              ) || "#000000"
            } 1px, transparent 0)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <motion.div
        className="absolute top-0 left-0 w-[600px] h-[600px] bg-tertiary-500 rounded-full blur-[200px] opacity-5"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="max-w-7xl mx-auto px-4 py-10 md:py-16 relative z-10">
        <motion.div
          className="mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-block mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 px-6 py-2 border border-secondary-200 bg-secondary-50">
              <div className="w-2 h-2 bg-secondary-500 rounded-full" />
              <span className="text-primary-950 text-xs font-light tracking-[0.3em] uppercase">
                Shop
              </span>
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-8xl font-bold text-primary-950 mb-6 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <span className="text-secondary-500">Merchandise</span>
          </motion.h1>

          <motion.p
            className="text-base md:text-lg text-primary-600 max-w-2xl font-light leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Official tournament gear and premium merchandise. Quality for
            champions.
          </motion.p>
        </motion.div>

        <motion.div
          className="flex flex-col md:flex-row gap-4 mb-8 md:mb-12 pb-8 border-b border-primary-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <form onSubmit={handleSearch} className="flex-1 relative">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 text-sm" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border-b border-primary-300 focus:border-secondary-500 outline-none text-sm bg-transparent transition-colors placeholder-primary-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary-400 hover:text-primary-950 transition-colors"
                aria-label="Clear search"
              >
                <IoClose className="text-lg" />
              </button>
            )}
          </form>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="lg:hidden flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-secondary-300 bg-secondary-50 hover:bg-secondary-100 text-sm text-primary-700 transition-all"
            >
              <IoFilter className="text-lg" />
              Filters
              {hasActiveFilters && (
                <span className="w-5 h-5 rounded-full bg-secondary-500 text-primary-950 text-xs flex items-center justify-center font-medium">
                  {activeFilterChips.length}
                </span>
              )}
            </button>

            <motion.button
              onClick={() => navigate("/cart")}
              className="relative flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-3 border border-secondary-300 hover:border-secondary-500 bg-secondary-50 hover:bg-secondary-100 text-sm text-primary-700 hover:text-primary-950 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <IoCart className="text-lg" />
              <span>Cart</span>
              <AnimatePresence>
                {cartItemCount > 0 && (
                  <motion.span
                    key={cartItemCount}
                    className="absolute -top-1 -right-1 bg-secondary-500 text-primary-950 text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          className="flex flex-col lg:flex-row gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <ShopFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            isOpen={filtersOpen}
            onClose={() => setFiltersOpen(false)}
          />

          <div className="flex-1">
            <motion.div
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    resetToFirstPage();
                  }}
                  className="text-sm text-primary-700 border-b border-primary-300 focus:border-secondary-500 outline-none bg-transparent py-2 transition-colors cursor-pointer"
                >
                  <option value="createdAt">Newest</option>
                  <option value="price">Price</option>
                  <option value="name">Name</option>
                </select>
                <button
                  onClick={() => {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    resetToFirstPage();
                  }}
                  className="text-sm text-primary-400 hover:text-primary-950 transition-colors px-2 py-1"
                  aria-label={
                    sortOrder === "asc" ? "Sort descending" : "Sort ascending"
                  }
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>

              <div className="flex items-center gap-1 border border-secondary-200 bg-secondary-50 p-1 self-end sm:self-auto">
                <motion.button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${
                    viewMode === "grid"
                      ? "text-primary-950 bg-secondary-200"
                      : "text-primary-400 hover:text-secondary-600"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Grid view"
                >
                  <IoGrid className="text-lg" />
                </motion.button>
                <motion.button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors ${
                    viewMode === "list"
                      ? "text-primary-950 bg-secondary-200"
                      : "text-primary-400 hover:text-secondary-600"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="List view"
                >
                  <IoList className="text-lg" />
                </motion.button>
              </div>
            </motion.div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.key}
                    onClick={() =>
                      chip.key === "search"
                        ? clearSearch()
                        : clearSingleFilter(chip.key)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wider border border-secondary-300 bg-secondary-50 text-primary-700 hover:border-secondary-500 hover:text-primary-950 transition-colors"
                  >
                    {chip.label}
                    <IoClose className="text-sm" />
                  </button>
                ))}
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-primary-500 hover:text-primary-950 underline underline-offset-2 transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}

            <p className="text-xs text-primary-500 mb-8 uppercase tracking-wider">
              {loading
                ? "Loading..."
                : `${pagination.total} ${
                    pagination.total === 1 ? "product" : "products"
                  } found`}
            </p>

            {loading ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    : "space-y-8"
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
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                      : "space-y-8"
                  }
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  {products.map((product, index) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.4 }}
                    >
                      <ProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                        viewMode={viewMode}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                {pagination.pages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-12">
                    <button
                      onClick={() => {
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-secondary-300 bg-secondary-50 hover:bg-secondary-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-secondary-500 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-primary-600 px-4">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => {
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      disabled={pagination.page >= pagination.pages}
                      className="px-4 py-2 border border-secondary-300 bg-secondary-50 hover:bg-secondary-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-secondary-500 transition-colors"
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
                description="Try adjusting your search or filters, or check back soon for new drops."
                actionLabel={hasActiveFilters ? "Clear filters" : "Back to home"}
                actionTo={hasActiveFilters ? undefined : "/"}
                onAction={hasActiveFilters ? clearAllFilters : undefined}
              />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Shop;
