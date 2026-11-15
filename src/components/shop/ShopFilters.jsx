import { useEffect } from "react";
import { IoClose, IoFilter } from "react-icons/io5";

const categories = [
  { value: "all", label: "All categories" },
  { value: "apparel", label: "Apparel" },
  { value: "accessories", label: "Accessories" },
  { value: "equipment", label: "Equipment" },
];

const priceRanges = [
  { value: "all", label: "All prices" },
  { value: "0-50", label: "$0 – $50" },
  { value: "50-100", label: "$50 – $100" },
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
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div>
        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2.5">
          Category
        </h4>
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleFilterChange("category", cat.value)}
              className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
                filters.category === cat.value
                  ? "text-neutral-950 font-semibold bg-neutral-100"
                  : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2.5">
          Price range
        </h4>
        <div className="space-y-1">
          {priceRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => handleFilterChange("priceRange", range.value)}
              className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
                filters.priceRange === range.value
                  ? "text-neutral-950 font-semibold bg-neutral-100"
                  : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2.5">
          Availability
        </h4>
        <div className="space-y-1">
          <button
            onClick={() => handleFilterChange("inStock", "all")}
            className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
              filters.inStock === "all"
                ? "text-neutral-950 font-semibold bg-neutral-100"
                : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50"
            }`}
          >
            All items
          </button>
          <button
            onClick={() => handleFilterChange("inStock", "true")}
            className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
              filters.inStock === "true"
                ? "text-neutral-950 font-semibold bg-neutral-100"
                : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50"
            }`}
          >
            In stock only
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block w-full lg:w-56 h-fit lg:sticky lg:top-24">
        {content}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-white border-r border-neutral-200 p-5 overflow-y-auto lg:hidden shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-neutral-900">
                <IoFilter className="text-base" />
                <span className="font-semibold text-sm">Filters</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded text-neutral-500 hover:text-neutral-900 transition-colors"
                aria-label="Close filters"
              >
                <IoClose className="text-lg" />
              </button>
            </div>
            {content}
            <button
              onClick={onClose}
              className="mt-6 w-full h-10 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
            >
              View results
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default ShopFilters;
