import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { shopAPI, contactAPI } from "../services/api";
import { useCart } from "../context/CartContext";
import { useNotification } from "../components/NotificationProvider";
import { IoArrowBack, IoCart, IoCheckmarkCircle, IoClose } from "react-icons/io5";
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

  const stockLimit = Number(product?.stock);
  const maxQuantity =
    Number.isFinite(stockLimit) && stockLimit > 0
      ? Math.min(99, Math.floor(stockLimit))
      : 99;

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await shopAPI.getProduct(id);
      setProduct(response);
      setSelectedImageIndex(0);
      setQuantity(1);
    } catch (error) {
      console.error("Error fetching product:", error);
      showError("Failed to load product. Please try again.");
      navigate("/shop");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product.inStock || Number(product.stock) <= 0) {
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
    showSuccess(
      `${cappedQty} ${cappedQty === 1 ? "item" : "items"} added to cart!`
    );
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 pt-24 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-12 h-12 border-4 border-secondary-200 border-t-secondary-500 rounded-full" />
        </motion.div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-primary-50 pt-24 pb-16">
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

  const finalPrice = product.finalPrice || product.price;
  const originalPrice = product.originalPrice || product.price;
  const hasDiscount = originalPrice > finalPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
    : 0;

  const promotionActive =
    product.promotion?.active &&
    (!product.promotion.startDate ||
      new Date() >= new Date(product.promotion.startDate)) &&
    (!product.promotion.endDate || new Date() <= new Date(product.promotion.endDate));

  const images = (product.images || []).map(
    (img) => absoluteMediaSrc(img) || img,
  );
  const mainImage = images[selectedImageIndex] || "/placeholder-product.jpg";

  return (
    <div className="min-h-screen bg-primary-50 pt-24 relative overflow-hidden">
      {/* Background Elements */}
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

      <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
        {/* Back Button */}
        <motion.button
          onClick={() => navigate("/shop")}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-950 mb-8 transition-colors group"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <IoArrowBack className="text-lg group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm uppercase tracking-wider">Back to Shop</span>
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden bg-primary-50 border border-secondary-200">
              <motion.img
                key={selectedImageIndex}
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-contain"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              />
              
              {/* Discount Badge */}
              {hasDiscount && (
                <motion.div
                  className="absolute top-4 right-4 z-20"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-sm text-primary-950 bg-secondary-500 px-4 py-2 font-medium uppercase tracking-wider shadow-lg">
                    -{discountPercentage}%
                  </span>
                </motion.div>
              )}

              {/* Promotion Badge */}
              {promotionActive && !hasDiscount && (
                <motion.div
                  className="absolute top-4 right-4 z-20"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-sm text-primary-950 bg-secondary-500 px-4 py-2 font-medium uppercase tracking-wider shadow-lg">
                    {product.promotion.discountType === "percentage"
                      ? `${product.promotion.discountValue}% OFF`
                      : `$${product.promotion.discountValue} OFF`}
                  </span>
                </motion.div>
              )}

              {/* Stock Overlay */}
              {!product.inStock && (
                <div className="absolute inset-0 bg-secondary-50/95 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-lg text-primary-500 uppercase tracking-wider font-medium">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? "border-secondary-500 bg-secondary-50"
                        : "border-primary-200 hover:border-secondary-300"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Category Badge */}
            {product.category && (
              <div className="inline-flex items-center gap-2 px-4 py-2 border border-secondary-200 bg-secondary-50">
                <span className="text-xs text-primary-600 uppercase tracking-wider">
                  {product.category}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-light text-primary-950 leading-tight">
              {product.name}
            </h1>

            {/* Description */}
            {product.description && (
              <p className="text-lg text-primary-600 font-light leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs text-primary-600 border border-secondary-200 bg-secondary-50 px-3 py-1.5 uppercase tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-4 pt-6 border-t border-secondary-200">
              <span className="text-5xl font-light text-primary-950">
                ${finalPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-primary-400 line-through font-light">
                    ${originalPrice.toFixed(2)}
                  </span>
                  <span className="text-sm text-secondary-700 bg-secondary-200 px-3 py-1 uppercase tracking-wider">
                    Save ${(originalPrice - finalPrice).toFixed(2)}
                  </span>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.inStock ? (
                <>
                  <IoCheckmarkCircle className="text-secondary-500 text-xl" />
                  <span className="text-sm text-primary-600 uppercase tracking-wider">
                    In Stock
                  </span>
                </>
              ) : (
                <>
                  <IoClose className="text-primary-400 text-xl" />
                  <span className="text-sm text-primary-500 uppercase tracking-wider">
                    Out of Stock
                  </span>
                </>
              )}
            </div>

            {/* Quantity Selector */}
            {product.inStock && (
              <div className="flex items-center gap-4">
                <label className="text-sm text-primary-700 uppercase tracking-wider">
                  Quantity:
                </label>
                <div className="flex items-center border border-secondary-200 bg-secondary-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-primary-700 hover:bg-secondary-100 transition-colors"
                  >
                    −
                  </button>
                  <span className="px-6 py-2 text-primary-950 font-medium min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(maxQuantity, quantity + 1))
                    }
                    disabled={quantity >= maxQuantity}
                    className="px-4 py-2 text-primary-700 hover:bg-secondary-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <div className="space-y-3">
              <motion.button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className={`w-full py-4 text-sm font-medium uppercase tracking-wider transition-all relative overflow-hidden group ${
                  product.inStock
                    ? "bg-primary-950 text-secondary-500 hover:bg-primary-900"
                    : "bg-primary-100 text-primary-400 cursor-not-allowed"
                }`}
                whileHover={product.inStock ? { scale: 1.02 } : {}}
                whileTap={product.inStock ? { scale: 0.98 } : {}}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <IoCart className="text-lg" />
                  {product.inStock ? "Add to Cart" : "Out of Stock"}
                </span>
                {product.inStock && (
                  <motion.div
                    className="absolute inset-0 bg-secondary-500 text-primary-950 flex items-center justify-center gap-2"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "0%" }}
                    transition={{ duration: 0.3 }}
                  >
                    <IoCart className="text-lg" />
                    Add to Cart
                  </motion.div>
                )}
              </motion.button>
              {getItemQuantity(product._id) > 0 && (
                <button
                  onClick={() => navigate("/cart")}
                  className="w-full py-3 text-sm border border-secondary-300 text-primary-700 hover:border-secondary-500 hover:text-primary-950 transition-colors"
                >
                  View cart ({getItemQuantity(product._id)} in cart)
                </button>
              )}
            </div>

            {/* Additional Info */}
            <div className="pt-8 border-t border-secondary-200 space-y-4">
              <div className="text-sm text-primary-600 space-y-2">
                {product.sku && (
                  <div>
                    <span className="font-medium text-primary-700">SKU:</span>{" "}
                    {product.sku}
                  </div>
                )}
                {product.weight && (
                  <div>
                    <span className="font-medium text-primary-700">Weight:</span>{" "}
                    {product.weight}
                  </div>
                )}
                {product.dimensions && (
                  <div>
                    <span className="font-medium text-primary-700">
                      Dimensions:
                    </span>{" "}
                    {product.dimensions}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

