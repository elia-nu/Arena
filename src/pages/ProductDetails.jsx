import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { shopAPI, contactAPI } from "../services/api";
import { useCart } from "../context/CartContext";
import { useNotification } from "../components/NotificationProvider";
import ProductCard from "../components/shop/ProductCard";
import {
  IoArrowBack,
  IoCart,
  IoCheckmark,
  IoShieldCheckmarkOutline,
  IoCarOutline,
  IoRefreshOutline,
  IoSparklesOutline,
  IoFlameOutline,
  IoLayersOutline,
} from "react-icons/io5";
import { absoluteMediaSrc } from "../utils/mediaUtils";
import EmptyState from "../components/EmptyState";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, getItemQuantity } = useCart();
  const { showSuccess, showError } = useNotification();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shopPageEnabled, setShopPageEnabled] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

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
    setSelectedImageIndex(0);
    setQuantity(1);
    fetchProduct();
  }, [id, settingsLoaded, shopPageEnabled]);

  useEffect(() => {
    if (settingsLoaded && !shopPageEnabled) {
      setLoading(false);
    }
  }, [settingsLoaded, shopPageEnabled]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await shopAPI.getProduct(id);
      setProduct(response);
      setSelectedImageIndex(0);
      setQuantity(1);

      // Fetch related products from the same category or general catalog
      try {
        const relatedRes = await shopAPI.getProducts({
          limit: 8,
          status: "active",
        });
        const items = relatedRes.products || relatedRes.data || relatedRes || [];
        const filtered = Array.isArray(items)
          ? items.filter(
              (item) => (item._id || item.id) !== (response._id || response.id)
            ).slice(0, 4)
          : [];
        setRelatedProducts(filtered);
      } catch (err) {
        console.error("Error fetching related products:", err);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      showError("Failed to load product. Please try again.");
      navigate("/shop");
    } finally {
      setLoading(false);
    }
  };

  const stockLimit = Number(product?.stock);
  const maxQuantity =
    Number.isFinite(stockLimit) && stockLimit > 0
      ? Math.min(99, Math.floor(stockLimit))
      : 99;

  const handleAddToCart = () => {
    if (!product || !product.inStock || Number(product.stock) <= 0) {
      showError("This product is out of stock");
      return;
    }
    const cappedQty = Math.min(quantity, maxQuantity);
    addToCart(
      {
        ...product,
        price: product.finalPrice || product.price,
      },
      cappedQty
    );
    setJustAdded(true);
    showSuccess(
      `${cappedQty} ${cappedQty === 1 ? "item" : "items"} added to cart!`
    );
    window.setTimeout(() => setJustAdded(false), 2000);
  };

  if (settingsLoaded && !shopPageEnabled) {
    return (
      <div className="min-h-screen bg-black pt-32 pb-20">
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

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 pt-32 flex flex-col items-center justify-center text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-12 h-12 border-4 border-secondary-500/20 border-t-secondary-500 rounded-full" />
        </motion.div>
        <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold mt-4">
          Loading merchandise details...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-neutral-950 pt-32 pb-20 text-white">
        <EmptyState
          variant="shop"
          title="Product not found"
          description="This item may have been removed or is no longer available."
          actionLabel="Browse shop"
          actionTo="/shop"
        />
      </div>
    );
  }

  const finalPrice = Number(product.finalPrice || product.price || 0);
  const originalPrice = Number(product.originalPrice || product.price || 0);
  const hasDiscount = originalPrice > finalPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
    : 0;

  const promotionActive =
    product.promotion?.active &&
    (!product.promotion.startDate ||
      new Date() >= new Date(product.promotion.startDate)) &&
    (!product.promotion.endDate ||
      new Date() <= new Date(product.promotion.endDate));

  const images = (product.images || []).map(
    (img) => absoluteMediaSrc(img) || img
  );
  const mainImage = images[selectedImageIndex] || "/placeholder-product.jpg";
  const cartQty = getItemQuantity(product._id || product.id);

  return (
    <div className="min-h-screen bg-neutral-50 selection:bg-secondary-500 selection:text-white">
      {/* ─── FULL-BLEED TOP STADIUM HEADER (ELIMINATES MURKY NAVBAR GAP) ─── */}
      <section className="relative w-full bg-black overflow-hidden pt-24 sm:pt-28 pb-8 sm:pb-10 border-b border-neutral-800">
        {/* Background stadium image with dark vignette */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/ebc-stadium-hero.webp"
            alt="The Arena Stadium Atmosphere"
            className="w-full h-full object-cover object-center opacity-30 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/85 to-black/75" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
          {/* Subtle Orange Glow */}
          <div
            className="absolute top-0 right-1/4 w-[500px] h-[300px] rounded-full blur-[140px] pointer-events-none opacity-20"
            style={{
              background:
                "radial-gradient(circle, #fe5723 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 flex-wrap">
              <Link
                to="/"
                className="hover:text-white transition-colors uppercase tracking-wider"
              >
                Home
              </Link>
              <span className="text-neutral-600">/</span>
              <Link
                to="/shop"
                className="hover:text-white transition-colors uppercase tracking-wider"
              >
                Shop
              </Link>
              {product.category && (
                <>
                  <span className="text-neutral-600">/</span>
                  <span className="uppercase tracking-wider text-secondary-400 font-bold">
                    {product.category}
                  </span>
                </>
              )}
              <span className="text-neutral-600">/</span>
              <span className="text-white font-bold capitalize truncate max-w-[220px] sm:max-w-none">
                {product.name}
              </span>
            </div>

            {/* Back to Shop Pill Button */}
            <button
              onClick={() => navigate("/shop")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all shadow-md group self-start sm:self-auto hover:border-secondary-500/50"
            >
              <IoArrowBack className="text-sm group-hover:-translate-x-1 transition-transform" />
              <span>Back to Shop</span>
            </button>
          </div>
        </div>

        {/* Tagline Watermark */}
        <div className="hidden lg:block absolute bottom-4 right-8 text-right pointer-events-none select-none z-10">
          <span className="text-[9px] tracking-[0.25em] text-secondary-500 font-bold uppercase">
            THE ARENA • OFFICIAL STORE
          </span>
        </div>
      </section>

      {/* ─── MAIN PRODUCT DETAILS CONTENT ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* ─── LEFT COLUMN: STUDIO PRODUCT IMAGE SHOWCASE ─── */}
          <motion.div
            className="lg:col-span-6 space-y-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Primary Image Showcase Container */}
            <div className="relative aspect-square w-full rounded-[28px] overflow-hidden bg-neutral-950 border border-neutral-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.12)] flex items-center justify-center p-6 sm:p-10 group">
              {/* Radial Studio Spotlight Backdrop */}
              <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  background:
                    "radial-gradient(circle at center, #2e3340 0%, #0d0f14 75%)",
                }}
              />

              {/* Product Image */}
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImageIndex}
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-105"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                />
              </AnimatePresence>

              {/* Discount Badge (Pill in top-right corner matching card aesthetic) */}
              {hasDiscount && (
                <div className="absolute top-4 right-4 z-20">
                  <span className="bg-secondary-500 text-white font-black text-xs sm:text-sm px-3.5 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                    -{discountPercentage}% OFF
                  </span>
                </div>
              )}

              {/* Special Promotion Badge */}
              {promotionActive && !hasDiscount && (
                <div className="absolute top-4 right-4 z-20">
                  <span className="bg-secondary-500 text-white font-black text-xs sm:text-sm px-3.5 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                    Special Promotion
                  </span>
                </div>
              )}

              {/* In Cart Indicator */}
              {cartQty > 0 && product.inStock && (
                <div className="absolute top-4 left-4 z-20">
                  <span className="text-xs font-bold uppercase tracking-wider bg-black/85 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-md border border-white/10 flex items-center gap-1.5">
                    <IoCheckmark className="text-secondary-400 text-sm" />
                    {cartQty} in cart
                  </span>
                </div>
              )}

              {/* Out of Stock Overlay */}
              {!product.inStock && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-30">
                  <span className="px-5 py-2.5 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 text-sm font-black uppercase tracking-wider shadow-xl">
                    Currently Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Navigation Row */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 p-1.5 bg-neutral-950 transition-all ${
                      selectedImageIndex === index
                        ? "border-secondary-500 ring-2 ring-secondary-500/30 shadow-md scale-105"
                        : "border-neutral-200/80 hover:border-secondary-300 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* ─── RIGHT COLUMN: PRODUCT DETAILS & PURCHASE CARD ─── */}
          <motion.div
            className="lg:col-span-6 space-y-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* Top Badges Row */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-50 border border-secondary-200 text-secondary-600 text-xs font-bold uppercase tracking-wider">
                <IoFlameOutline className="text-sm" /> Official Arena Merch
              </span>

              {product.category && (
                <span className="px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-bold uppercase tracking-wider">
                  {product.category}
                </span>
              )}

              {product.inStock ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  In Stock &amp; Ready to Ship
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full uppercase tracking-wider">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-950 tracking-tight leading-tight capitalize">
              {product.name}
            </h1>

            {/* Price Box */}
            <div className="p-6 rounded-3xl bg-white border border-neutral-200/80 shadow-xs flex items-baseline gap-4 flex-wrap">
              <span className="text-4xl sm:text-5xl font-black text-neutral-950">
                ${finalPrice.toFixed(2)}
              </span>

              {hasDiscount && (
                <>
                  <span className="text-xl text-neutral-400 line-through font-normal">
                    ${originalPrice.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
                    You Save ${(originalPrice - finalPrice).toFixed(2)} (-{discountPercentage}%)
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-base text-neutral-600 leading-relaxed font-normal">
                {product.description}
              </p>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mr-1">
                  Tags:
                </span>
                {product.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-medium text-neutral-700 bg-neutral-100 border border-neutral-200 px-3 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Quantity Selector & Purchase Actions */}
            {product.inStock && (
              <div className="space-y-4 pt-4 border-t border-neutral-200">
                <div className="flex items-center gap-4">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Quantity:
                  </label>
                  <div className="inline-flex items-center rounded-xl border border-neutral-300 bg-white p-1 shadow-xs">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-neutral-100 font-bold transition-colors"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-12 text-center text-sm font-black text-neutral-950">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(Math.min(maxQuantity, quantity + 1))
                      }
                      disabled={quantity >= maxQuantity}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-neutral-100 font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-neutral-400 font-medium">
                    Max: {maxQuantity} per order
                  </span>
                </div>

                {/* Primary Add to Cart Action */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <motion.button
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    className={`flex-1 py-4 px-8 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg ${
                      justAdded
                        ? "bg-emerald-600 text-white shadow-emerald-600/30"
                        : "bg-secondary-500 hover:bg-secondary-600 text-white shadow-secondary-500/30 hover:scale-[1.01]"
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    {justAdded ? (
                      <>
                        <IoCheckmark className="text-lg" />
                        ADDED TO CART!
                      </>
                    ) : (
                      <>
                        <IoCart className="text-lg" />
                        ADD TO CART • ${(finalPrice * quantity).toFixed(2)}
                      </>
                    )}
                  </motion.button>

                  <button
                    onClick={() => navigate("/cart")}
                    className="py-4 px-6 rounded-2xl border border-neutral-300 hover:border-secondary-500 bg-white hover:bg-neutral-50 text-xs font-bold uppercase tracking-wider text-neutral-900 transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>View Cart</span>
                    {cartQty > 0 && (
                      <span className="w-5 h-5 rounded-full bg-secondary-500 text-white text-[10px] flex items-center justify-center font-bold">
                        {cartQty}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Value & Delivery Perks Box */}
            <div className="p-5 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-3.5">
              <div className="flex items-center gap-3 text-xs text-neutral-800 font-semibold">
                <IoCarOutline className="text-lg text-secondary-500 flex-shrink-0" />
                <span>Priority regional shipping across Addis Ababa &amp; Hawassa</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-800 font-semibold">
                <IoShieldCheckmarkOutline className="text-lg text-secondary-500 flex-shrink-0" />
                <span>100% Authentic official tournament merchandise</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-800 font-semibold">
                <IoRefreshOutline className="text-lg text-secondary-500 flex-shrink-0" />
                <span>Hassle-free size exchange on unworn tournament gear</span>
              </div>
            </div>

            {/* Product Specifications */}
            {(product.sku || product.weight || product.dimensions) && (
              <div className="p-5 rounded-3xl bg-neutral-100/70 border border-neutral-200/80 space-y-2 text-xs">
                <div className="font-bold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1.5">
                  <IoLayersOutline className="text-sm text-secondary-500" />
                  Product Specifications
                </div>
                {product.sku && (
                  <div className="flex justify-between text-neutral-600">
                    <span>SKU Code:</span>
                    <span className="font-mono font-bold text-neutral-900">{product.sku}</span>
                  </div>
                )}
                {product.weight && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Item Weight:</span>
                    <span className="font-bold text-neutral-900">{product.weight}</span>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Dimensions:</span>
                    <span className="font-bold text-neutral-900">{product.dimensions}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* ─── RELATED MERCHANDISE SECTION ─── */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-neutral-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold text-secondary-600 uppercase tracking-widest block mb-1">
                  Complete Your Look
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
                  MORE FROM THE ARENA
                </h2>
              </div>
              <Link
                to="/shop"
                className="text-xs font-bold uppercase tracking-wider text-secondary-600 hover:text-secondary-700 transition-colors"
              >
                View All Merchandise →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard
                  key={relProduct._id || relProduct.id}
                  product={relProduct}
                  onAddToCart={(p) => addToCart(p, 1)}
                  viewMode="grid"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;