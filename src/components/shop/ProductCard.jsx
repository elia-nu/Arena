import { useState } from "react";
import { Link } from "react-router-dom";
import { IoCart, IoCheckmark } from "react-icons/io5";
import { absoluteMediaSrc } from "../../utils/mediaUtils";
import { useCart } from "../../context/CartContext";
import { useNotification } from "../NotificationProvider";

const ProductCard = ({ product, onAddToCart, viewMode = "grid" }) => {
  const [justAdded, setJustAdded] = useState(false);
  const { showSuccess } = useNotification();
  const { getItemQuantity } = useCart();

  const productId = product._id || product.id;
  const cartQty = getItemQuantity(productId);

  const handleAddToCart = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!product.inStock) return;
    onAddToCart(product);
    setJustAdded(true);
    showSuccess(`${product.name} added to cart`);
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
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden p-4 sm:p-5 flex flex-col sm:flex-row gap-5 hover:border-secondary-500/50 hover:shadow-md transition-all duration-150">
        <Link
          to={`/shop/product/${productId}`}
          className="relative flex-shrink-0 w-full sm:w-48 h-48 rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center group"
        >
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
          />

          {hasDiscount && (
            <span className="absolute top-2.5 right-2.5 text-[11px] font-bold bg-secondary-500 text-white px-2 py-0.5 rounded shadow-xs uppercase">
              -{discountPercentage}%
            </span>
          )}

          {cartQty > 0 && (
            <span className="absolute top-2.5 left-2.5 text-[10px] font-bold bg-neutral-900/90 text-white px-2 py-0.5 rounded shadow-xs">
              {cartQty} in cart
            </span>
          )}

          {!product.inStock && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
              <span className="px-2.5 py-1 rounded bg-neutral-100 text-neutral-600 text-xs font-semibold uppercase">
                Out of stock
              </span>
            </div>
          )}
        </Link>

        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold text-secondary-600 uppercase tracking-wider">
                {product.category || "Apparel"}
              </span>
              <span
                className={`text-xs font-medium flex items-center gap-1.5 ${
                  product.inStock ? "text-emerald-600" : "text-neutral-400"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    product.inStock ? "bg-emerald-500" : "bg-neutral-300"
                  }`}
                />
                {product.inStock ? "In stock" : "Out of stock"}
              </span>
            </div>

            <Link
              to={`/shop/product/${productId}`}
              className="text-base sm:text-lg font-bold text-neutral-900 hover:text-secondary-500 transition-colors block leading-snug mb-1.5"
            >
              {product.name}
            </Link>

            {product.description && (
              <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-3">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-100">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-secondary-500 tabular-nums">
                ${finalPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-neutral-400 line-through tabular-nums">
                  ${originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`h-9 px-5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors duration-150 ${
                product.inStock
                  ? justAdded
                    ? "bg-emerald-600 text-white"
                    : "bg-secondary-500 hover:bg-secondary-600 text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
              }`}
            >
              {!product.inStock ? (
                "Out of stock"
              ) : justAdded ? (
                <>
                  <IoCheckmark className="w-3.5 h-3.5" /> Added
                </>
              ) : (
                <>
                  <IoCart className="w-3.5 h-3.5" /> Add to cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── GRID VIEW ───
  return (
    <div className="h-full bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col justify-between hover:border-secondary-500/50 hover:shadow-md transition-all duration-150 group">
      <div>
        {/* Product Image */}
        <Link
          to={`/shop/product/${productId}`}
          className="relative aspect-square w-full overflow-hidden bg-neutral-100 block"
        >
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
          />

          {hasDiscount && (
            <span className="absolute top-2.5 right-2.5 z-10 bg-secondary-500 text-white font-bold text-[11px] px-2 py-0.5 rounded shadow-xs uppercase">
              -{discountPercentage}%
            </span>
          )}

          {promotionActive && !hasDiscount && (
            <span className="absolute top-2.5 right-2.5 z-10 bg-secondary-500 text-white font-bold text-[11px] px-2 py-0.5 rounded shadow-xs uppercase">
              Special
            </span>
          )}

          {cartQty > 0 && product.inStock && (
            <span className="absolute top-2.5 left-2.5 z-10 text-[10px] font-bold bg-neutral-900/90 text-white px-2 py-0.5 rounded shadow-xs uppercase">
              {cartQty} in cart
            </span>
          )}

          {!product.inStock && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center z-10">
              <span className="px-2.5 py-1 rounded bg-neutral-100 text-neutral-600 text-xs font-semibold uppercase">
                Out of stock
              </span>
            </div>
          )}
        </Link>

        {/* Card Body Information */}
        <div className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-secondary-600 font-bold uppercase tracking-wider text-[11px]">
              {product.category || "Apparel"}
            </span>
            <span
              className={`flex items-center gap-1.5 font-medium ${
                product.inStock ? "text-emerald-600" : "text-neutral-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  product.inStock ? "bg-emerald-500" : "bg-neutral-300"
                }`}
              />
              {product.inStock ? "In stock" : "Out of stock"}
            </span>
          </div>

          <Link to={`/shop/product/${productId}`} className="block">
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 leading-snug group-hover:text-secondary-500 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>

          <p className="text-xs text-neutral-400 line-clamp-1">
            {product.description || "Official tournament merchandise"}
          </p>

          <div className="flex items-baseline gap-2 pt-1.5">
            <span className="text-xl font-black text-secondary-500 tabular-nums">
              ${finalPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-neutral-400 line-through tabular-nums">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Button Row */}
      <div className="px-4 pb-4 pt-1">
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className={`w-full h-10 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors duration-150 ${
            product.inStock
              ? justAdded
                ? "bg-emerald-600 text-white"
                : "bg-secondary-500 hover:bg-secondary-600 text-white shadow-xs"
              : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
          }`}
        >
          {!product.inStock ? (
            "Out of stock"
          ) : justAdded ? (
            <>
              <IoCheckmark className="w-3.5 h-3.5" /> Added to cart
            </>
          ) : (
            <>
              <IoCart className="w-3.5 h-3.5" /> Add to cart
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
