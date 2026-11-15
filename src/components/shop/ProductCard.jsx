import { useState } from "react";
import { motion } from "framer-motion";
import { useNotification } from "../NotificationProvider";
import { Link, useNavigate } from "react-router-dom";
import { IoCart, IoCheckmark } from "react-icons/io5";
import { absoluteMediaSrc } from "../../utils/mediaUtils";
import { useCart } from "../../context/CartContext";

const ProductCard = ({ product, onAddToCart, viewMode = "grid" }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { showSuccess } = useNotification();
  const { getItemQuantity } = useCart();
  const navigate = useNavigate();

  const productId = product._id || product.id;
  const cartQty = getItemQuantity(productId);

  const handleAddToCart = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!product.inStock) return;
    onAddToCart(product);
    setJustAdded(true);
    showSuccess(`${product.name} added to cart!`);
    window.setTimeout(() => setJustAdded(false), 1600);
  };

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
    (!product.promotion.endDate ||
      new Date() <= new Date(product.promotion.endDate));

  const imageSrc =
    absoluteMediaSrc(product.images?.[0]) || "/placeholder-product.jpg";

  // ─── LIST VIEW ───
  if (viewMode === "list") {
    return (
      <motion.div
        className="bg-white rounded-3xl border border-neutral-200/90 overflow-hidden group p-4 sm:p-5 flex flex-col sm:flex-row gap-5 shadow-xs hover:shadow-xl hover:border-secondary-500 transition-all duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2 }}
      >
        <Link
          to={`/shop/product/${productId}`}
          className="relative flex-shrink-0 w-full sm:w-52 h-52 rounded-2xl overflow-hidden bg-neutral-100 flex items-center justify-center group-hover:opacity-95 transition-opacity"
        >
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />

          {hasDiscount && (
            <span className="absolute top-3 right-3 text-[11px] font-black uppercase tracking-wider bg-secondary-500 text-white px-2.5 py-1 rounded-full shadow-md z-10">
              -{discountPercentage}%
            </span>
          )}

          {cartQty > 0 && (
            <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-black/85 text-white px-2.5 py-1 rounded-full shadow-sm z-10">
              {cartQty} in cart
            </span>
          )}

          {!product.inStock && (
            <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex items-center justify-center z-10">
              <span className="px-3 py-1 rounded-full bg-neutral-200 text-neutral-600 text-xs font-bold uppercase tracking-wider">
                Out of Stock
              </span>
            </div>
          )}
        </Link>

        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] uppercase font-bold tracking-wider text-secondary-600">
                {product.category || "Apparel"}
              </span>
              <span
                className={`text-[11px] uppercase font-bold tracking-wider flex items-center gap-1 ${
                  product.inStock ? "text-emerald-500" : "text-neutral-400"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    product.inStock ? "bg-emerald-500" : "bg-neutral-400"
                  }`}
                />
                {product.inStock ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            <Link
              to={`/shop/product/${productId}`}
              className="text-xl font-bold text-neutral-900 group-hover:text-secondary-600 transition-colors block leading-tight mb-2"
            >
              {product.name}
            </Link>

            {product.description && (
              <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-4">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-neutral-100">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-neutral-950">
                ${finalPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-neutral-400 line-through font-normal">
                  ${originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                product.inStock
                  ? justAdded
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "bg-secondary-500 hover:bg-secondary-600 text-white shadow-md shadow-secondary-500/25 hover:shadow-secondary-500/40"
                  : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
              }`}
            >
              {!product.inStock ? (
                "Out of Stock"
              ) : justAdded ? (
                <>
                  <IoCheckmark className="text-base" /> Added
                </>
              ) : (
                <>
                  <IoCart className="text-base" /> ADD TO CART
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── GRID VIEW (MATCHING USER SCREENSHOT PRECISELY) ───
  return (
    <motion.div
      className={`h-full bg-white rounded-[26px] overflow-hidden flex flex-col justify-between transition-all duration-300 relative group ${
        isHovered
          ? "border-2 border-secondary-500 shadow-[0_16px_36px_rgba(254,87,35,0.16)] -translate-y-1.5"
          : "border border-neutral-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      transition={{ duration: 0.2 }}
    >
      <div>
        {/* Top Product Image Container */}
        <Link
          to={`/shop/product/${productId}`}
          className="relative aspect-square w-full overflow-hidden bg-neutral-100 block group"
        >
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />

          {/* Discount Badge (Pill in top-right matching screenshot) */}
          {hasDiscount && (
            <span className="absolute top-3.5 right-3.5 z-10 bg-secondary-500 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider">
              -{discountPercentage}%
            </span>
          )}

          {/* Promotion Badge if no discount */}
          {promotionActive && !hasDiscount && (
            <span className="absolute top-3.5 right-3.5 z-10 bg-secondary-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider">
              Special
            </span>
          )}

          {/* Cart Quantity Indicator in top-left */}
          {cartQty > 0 && product.inStock && (
            <span className="absolute top-3.5 left-3.5 z-10 text-[10px] font-bold uppercase tracking-wider bg-black/85 text-white px-2.5 py-1 rounded-full shadow-sm">
              {cartQty} in cart
            </span>
          )}

          {/* Out of Stock Overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex items-center justify-center z-10">
              <span className="px-3.5 py-1.5 rounded-full bg-neutral-200 text-neutral-600 text-xs font-bold uppercase tracking-wider">
                Out of Stock
              </span>
            </div>
          )}
        </Link>

        {/* Card Body Information */}
        <div className="p-5 space-y-2">
          {/* Category & In-Stock Row (Exact matching to screenshot) */}
          <div className="flex items-center justify-between text-[11px] uppercase font-bold tracking-wider">
            <span className="text-secondary-600">
              {product.category || "Apparel"}
            </span>
            <span
              className={`flex items-center gap-1 ${
                product.inStock ? "text-emerald-500" : "text-neutral-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  product.inStock ? "bg-emerald-500" : "bg-neutral-400"
                }`}
              />
              {product.inStock ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          {/* Product Title */}
          <Link to={`/shop/product/${productId}`} className="block">
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug group-hover:text-secondary-600 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Subtitle / Description */}
          <p className="text-xs text-neutral-400 line-clamp-1 font-normal">
            {product.description || "Official tournament merchandise"}
          </p>

          {/* Price Section */}
          <div className="flex items-baseline gap-2 pt-2">
            <span className="text-2xl font-black text-neutral-950">
              ${finalPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-neutral-400 line-through font-medium">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Button Row (Exact matching to screenshot) */}
      <div className="px-5 pb-5 pt-0">
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 ${
            product.inStock
              ? justAdded
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "bg-secondary-500 hover:bg-secondary-600 text-white shadow-md shadow-secondary-500/25 hover:shadow-secondary-500/40 hover:-translate-y-0.5 active:translate-y-0"
              : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
          }`}
        >
          {!product.inStock ? (
            "Out of Stock"
          ) : justAdded ? (
            <>
              <IoCheckmark className="text-base" /> ADDED TO CART
            </>
          ) : (
            <>
              <IoCart className="text-base" /> ADD TO CART
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
