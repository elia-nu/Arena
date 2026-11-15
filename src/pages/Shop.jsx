import { useState, useEffect, useRef } from "react";
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
  IoArrowDown,
  IoShieldCheckmarkOutline,
  IoFlashOutline,
  IoRefreshOutline,
  IoCarOutline,
} from "react-icons/io5";
import EmptyState from "../components/EmptyState";

const ProductSkeleton = ({ viewMode }) => {
  if (viewMode === "list") {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-5">
        <div className="w-full sm:w-48 h-48 bg-neutral-100 rounded-lg animate-pulse" />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-5 bg-neutral-100 rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-neutral-100 rounded w-2/3 animate-pulse" />
          <div className="h-4 bg-neutral-100 rounded w-1/2 animate-pulse" />
          <div className="h-8 bg-neutral-100 rounded w-1/4 mt-4 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      <div className="aspect-square bg-neutral-100 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-neutral-100 rounded w-1/4 animate-pulse" />
        <div className="h-5 bg-neutral-100 rounded w-3/4 animate-pulse" />
        <div className="h-6 bg-neutral-100 rounded w-1/3 animate-pulse" />
        <div className="h-9 bg-neutral-100 rounded w-full animate-pulse" />
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
    desc: "Protected payment & order encryption",
  },
  {
    icon: IoRefreshOutline,
    title: "Hassle-Free Exchange",
    desc: "Easy size swaps for apparel orders",
  },
];

const categoryPills = [
  { value: "all", label: "All Products" },
  { value: "apparel", label: "Apparel & Kits" },
  { value: "accessories", label: "Accessories" },
  { value: "equipment", label: "Equipment" },
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
      <div className="min-h-screen bg-white pt-28 pb-16">
        <EmptyState
          variant="shop"
          title="Shop is currently offline"
          description="The shop is temporarily unavailable. Please check back later."
          actionLabel="Back to home"
          actionTo="/"
        />
      </div>
    );
  }

  const shopHeroImage =
    "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=1600&h=800&fit=crop&q=80";

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* ─── Grounded Hero Header with Brand Orange ─── */}
      <section className="relative w-full bg-[#0e0f12] text-white pt-28 sm:pt-36 pb-16 sm:pb-20 overflow-hidden border-b border-neutral-800">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src={shopHeroImage}
            alt="The Arena Official Store"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0f12] via-[#0e0f12]/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-secondary-500/30 bg-secondary-500/10 text-xs font-semibold text-secondary-400 mb-4 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-secondary-500" />
              <span>Official Store · The Arena</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-3 uppercase">
              Arena <span className="text-secondary-500">Gear</span> & Kits
            </h1>

            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed mb-6 font-normal">
              Official tournament matchwear, training apparel, and equipment engineered for Ethiopian street football.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#shop-catalog"
                className="inline-flex items-center gap-2 h-10 px-6 rounded-lg bg-secondary-500 hover:bg-secondary-600 text-white text-xs font-bold uppercase tracking-wider transition-colors duration-150 shadow-xs"
              >
                <span>Explore catalog</span>
                <IoArrowDown className="text-xs" />
              </a>

              <button
                type="button"
                onClick={() => navigate("/cart")}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-secondary-500/40 bg-secondary-500/10 hover:bg-secondary-500/20 text-secondary-300 text-xs font-semibold uppercase tracking-wider transition-colors duration-150"
              >
                <IoCart className="text-sm text-secondary-400" />
                <span>View cart</span>
                {cartItemCount > 0 && (
                  <span className="min-w-[18px] h-4.5 px-1 bg-secondary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Perks Strip ─── */}
      <section className="border-b border-neutral-200 bg-neutral-50/70 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {trustPerks.map((perk, i) => {
              const Icon = perk.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-secondary-500/30 text-secondary-500 flex items-center justify-center text-base flex-shrink-0 shadow-xs">
                    <Icon />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 leading-tight">
                      {perk.title}
                    </h4>
                    <p className="text-[11px] text-neutral-500 leading-tight mt-0.5 hidden sm:block">
                      {perk.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Catalog Section ─── */}
      <section id="shop-catalog" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 scroll-mt-20">
        {/* Category bar & Item counter */}
        <div className="space-y-4 mb-8 pb-6 border-b border-neutral-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-neutral-100 border border-neutral-200">
              {categoryPills.map((pill) => {
                const isActive = filters.category === pill.value;
                return (
                  <button
                    key={pill.value}
                    type="button"
                    onClick={() => handleFilterChange({ category: pill.value })}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors duration-150 ${
                      isActive
                        ? "bg-secondary-500 text-white shadow-xs"
                        : "text-neutral-600 hover:text-neutral-950"
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-semibold text-neutral-500 tabular-nums">
              {loading
                ? "Loading products..."
                : `${pagination.total} ${pagination.total === 1 ? "product" : "products"}`}
            </span>
          </div>

          {/* Search, Sort & View Controls */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex-1 w-full relative">
              <IoSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search jerseys, hoodies, balls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-9 rounded-lg border border-neutral-300 focus:border-secondary-500 focus:ring-0 outline-none text-xs bg-white text-neutral-900 transition-colors placeholder-neutral-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-900"
                  aria-label="Clear search"
                >
                  <IoClose className="text-sm" />
                </button>
              )}
            </form>

            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="lg:hidden h-10 inline-flex items-center gap-1.5 px-3 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-800 transition-colors"
              >
                <IoFilter className="text-xs text-secondary-500" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-4 h-4 rounded-full bg-secondary-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFilterChips.length}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="flex items-center h-10 px-2 rounded-lg border border-neutral-300 bg-white">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    resetToFirstPage();
                  }}
                  className="text-xs font-medium text-neutral-800 outline-none bg-transparent pr-1 cursor-pointer"
                >
                  <option value="createdAt">Newest first</option>
                  <option value="price">Price</option>
                  <option value="name">Name</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    resetToFirstPage();
                  }}
                  className="p-1 rounded text-neutral-600 hover:text-secondary-600 transition-colors text-xs font-semibold"
                  aria-label={
                    sortOrder === "asc" ? "Sort descending" : "Sort ascending"
                  }
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex items-center p-0.5 rounded-lg border border-neutral-300 bg-white">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-xs transition-colors ${
                    viewMode === "grid"
                      ? "bg-secondary-500 text-white shadow-xs"
                      : "text-neutral-400 hover:text-neutral-700"
                  }`}
                  aria-label="Grid view"
                >
                  <IoGrid />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-xs transition-colors ${
                    viewMode === "list"
                      ? "bg-secondary-500 text-white shadow-xs"
                      : "text-neutral-400 hover:text-neutral-700"
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
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-neutral-400">Filters:</span>
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() =>
                    chip.key === "search"
                      ? clearSearch()
                      : clearSingleFilter(chip.key)
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-secondary-50 text-secondary-700 border border-secondary-200 hover:border-secondary-400 transition-colors"
                >
                  <span>{chip.label}</span>
                  <IoClose className="text-xs" />
                </button>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-secondary-600 hover:text-secondary-700 underline underline-offset-2 ml-1 transition-colors font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <ShopFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            isOpen={filtersOpen}
            onClose={() => setFiltersOpen(false)}
          />

          <div className="flex-1 w-full">
            {loading ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                    : "space-y-4"
                }
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductSkeleton key={i} viewMode={viewMode} />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                      : "space-y-4"
                  }
                >
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12 pt-6 border-t border-neutral-200">
                    <button
                      type="button"
                      onClick={() => {
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }));
                        window.scrollTo({ top: 350, behavior: "smooth" });
                      }}
                      disabled={pagination.page === 1}
                      className="h-9 px-4 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-semibold text-neutral-500 px-3 tabular-nums">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }));
                        window.scrollTo({ top: 350, behavior: "smooth" });
                      }}
                      disabled={pagination.page >= pagination.pages}
                      className="h-9 px-4 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
