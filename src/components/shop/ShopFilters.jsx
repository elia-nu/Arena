import { useEffect } from "react";
import { IoClose, IoFilter } from "react-icons/io5";

const categories = [
  { value: "all", label: "All" },
  { value: "apparel", label: "Apparel" },
  { value: "accessories", label: "Accessories" },
  { value: "equipment", label: "Equipment" },
];

const priceRanges = [
  { value: "all", label: "All Prices" },
  { value: "0-50", label: "$0 - $50" },
  { value: "50-100", label: "$50 - $100" },
  { value: "100+", label: "$100+" },
];

const ShopFilters = ({
  filters,
  onFilterChange,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleFilterChange = (key, value) => {
    onFilterChange?.({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange?.({
      ...filters,
      category: "all",
      priceRange: "all",
      inStock: "all",
    });
  };

  const hasActiveFilters =
    filters.category !== "all" ||
    filters.priceRange !== "all" ||
    filters.inStock !== "all";

  const content = (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-secondary-200">
        <h3 className="text-lg font-semibold text-secondary-600">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-secondary-600 hover:text-secondary-700 transition-colors px-3 py-1 border border-secondary-200 hover:border-secondary-400 bg-secondary-50 hover:bg-secondary-100"
          >
            Clear
          </button>
        )}
      </div>

      <div>
        <h4 className="text-sm font-medium text-primary-700 mb-3 uppercase tracking-wide">
          Category
        </h4>
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleFilterChange("category", cat.value)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                filters.category === cat.value
                  ? "text-primary-950 font-medium border-l-2 border-secondary-500 bg-secondary-50"
                  : "text-primary-500 hover:text-primary-950 hover:bg-secondary-50/50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-primary-700 mb-3 uppercase tracking-wide">
          Price
        </h4>
        <div className="space-y-1">
          {priceRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => handleFilterChange("priceRange", range.value)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                filters.priceRange === range.value
                  ? "text-primary-950 font-medium border-l-2 border-secondary-500 bg-secondary-50"
                  : "text-primary-500 hover:text-primary-950 hover:bg-secondary-50/50"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-primary-700 mb-3 uppercase tracking-wide">
          Availability
        </h4>
        <div className="space-y-1">
          <button
            onClick={() => handleFilterChange("inStock", "all")}
            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
              filters.inStock === "all"
                ? "text-primary-950 font-medium border-l-2 border-secondary-500 bg-secondary-50"
                : "text-primary-500 hover:text-primary-950 hover:bg-secondary-50/50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange("inStock", "true")}
            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
              filters.inStock === "true"
                ? "text-primary-950 font-medium border-l-2 border-secondary-500 bg-secondary-50"
                : "text-primary-500 hover:text-primary-950 hover:bg-secondary-50/50"
            }`}
          >
            In Stock
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block w-full lg:w-64 h-fit lg:sticky lg:top-24">
        {content}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-primary-950/40 z-40 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-full max-w-sm bg-secondary-50 border-r border-secondary-200 p-6 overflow-y-auto lg:hidden shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-primary-950">
                <IoFilter className="text-lg" />
                <span className="font-medium">Filters</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-primary-400 hover:text-primary-950 transition-colors"
                aria-label="Close filters"
              >
                <IoClose className="text-xl" />
              </button>
            </div>
            {content}
            <button
              onClick={onClose}
              className="mt-8 w-full py-3 bg-primary-950 text-secondary-500 text-sm font-medium hover:bg-primary-900 transition-colors"
            >
              Show results
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default ShopFilters;
