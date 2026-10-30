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

  const AddButton = ({ className = "" }) => (
    <motion.button
      onClick={handleAddToCart}
      disabled={!product.inStock}
      className={`text-sm font-medium uppercase tracking-wider transition-all relative overflow-hidden ${
        product.inStock
          ? justAdded
            ? "bg-secondary-500 text-primary-950"
            : "bg-primary-950 text-accent-500"
          : "bg-primary-100 text-primary-400 cursor-not-allowed"
      } ${className}`}
      whileHover={product.inStock && !justAdded ? { scale: 1.02 } : {}}
      whileTap={product.inStock ? { scale: 0.98 } : {}}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {!product.inStock ? (
          "Out of Stock"
        ) : justAdded ? (
          <>
            <IoCheckmark className="text-lg" />
            Added
          </>
        ) : (
          <>
            <IoCart className="text-base" />
            {cartQty > 0 ? "Add Another" : "Add to Cart"}
          </>
        )}
      </span>
      {product.inStock && !justAdded && (
        <motion.div
          className="absolute inset-0 bg-accent-500 text-primary-950"
          initial={{ x: "-100%" }}
          whileHover={{ x: "0%" }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );

  if (viewMode === "list") {
    return (
      <motion.div
        className="bg-secondary-50 border border-secondary-200 overflow-hidden group relative flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6 transition-all duration-300 hover:border-secondary-400 hover:shadow-[0_14px_34px_rgba(15,23,42,0.12),0_0_0_1px_rgba(234,179,8,0.3)]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          to={`/shop/product/${product._id}`}
          className="relative flex-shrink-0 w-full sm:w-48 h-56 sm:h-48 overflow-hidden border border-primary-200 hover:border-secondary-500 transition-colors"
        >
          <motion.img
            src={
              absoluteMediaSrc(product.images?.[0]) ||
              "/placeholder-product.jpg"
            }
            alt={product.name}
            className="w-full h-full object-contain"
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          {cartQty > 0 && (
            <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider bg-primary-950 text-secondary-500 px-2 py-1 font-medium">
              {cartQty} in cart
            </span>
          )}
        </Link>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <Link
              to={`/shop/product/${product._id}`}
              className="text-xl sm:text-2xl font-light text-primary-950 mb-2 hover:text-secondary-600 transition-colors block"
            >
              {product.name}
            </Link>
            {product.description && (
              <p className="text-sm text-primary-600 line-clamp-2 font-light leading-relaxed mb-4">
                {product.description}
              </p>
            )}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {product.tags?.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs text-primary-500 border border-primary-300 px-2 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-light text-primary-950">
                ${finalPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-primary-400 line-through font-light">
                  ${originalPrice.toFixed(2)}
                </span>
              )}
              {promotionActive && (
                <span className="text-xs text-secondary-700 bg-secondary-200 px-2 py-1 uppercase tracking-wider">
                  {product.promotion.discountType === "percentage"
                    ? `${product.promotion.discountValue}% OFF`
                    : `$${product.promotion.discountValue} OFF`}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <AddButton className="w-full sm:w-auto px-6 sm:px-8 py-3" />
              {cartQty > 0 && (
                <button
                  onClick={() => navigate("/cart")}
                  className="w-full sm:w-auto px-4 py-3 text-sm border border-secondary-300 text-primary-700 hover:border-secondary-500 hover:text-primary-950 transition-colors"
                >
                  View Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-secondary-50 border border-secondary-200 overflow-hidden group relative transition-all duration-300 hover:border-secondary-400 hover:shadow-[0_14px_34px_rgba(15,23,42,0.12),0_0_0_1px_rgba(234,179,8,0.3)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute inset-0 border border-secondary-500/0 pointer-events-none z-10"
        animate={{
          borderColor: isHovered
            ? "rgba(234, 179, 8, 0.6)"
            : "rgba(234, 179, 8, 0)",
        }}
        transition={{ duration: 0.4 }}
      />

      <Link
        to={`/shop/product/${product._id}`}
        className="relative aspect-square overflow-hidden bg-primary-50 block"
      >
        <motion.img
          src={
            absoluteMediaSrc(product.images?.[0]) || "/placeholder-product.jpg"
          }
          alt={product.name}
          className="w-full h-full object-contain"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />

        {!product.inStock && (
          <div className="absolute inset-0 bg-secondary-50/95 flex items-center justify-center backdrop-blur-sm">
            <span className="text-sm text-primary-500 uppercase tracking-wider font-medium">
              Out of Stock
            </span>
          </div>
        )}

        {cartQty > 0 && product.inStock && (
          <span className="absolute top-4 left-4 z-20 text-[10px] uppercase tracking-wider bg-primary-950 text-secondary-500 px-2.5 py-1.5 font-medium">
            {cartQty} in cart
          </span>
        )}

        {hasDiscount && (
          <motion.div
            className="absolute top-4 right-4 z-20"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-xs text-primary-950 bg-secondary-500 px-3 py-1.5 font-medium uppercase tracking-wider shadow-lg">
              -{discountPercentage}%
            </span>
          </motion.div>
        )}

        {promotionActive && !hasDiscount && (
          <motion.div
            className="absolute top-4 right-4 z-20"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-xs text-primary-950 bg-secondary-500 px-3 py-1.5 font-medium uppercase tracking-wider shadow-lg">
              {product.promotion.discountType === "percentage"
                ? `${product.promotion.discountValue}% OFF`
                : `$${product.promotion.discountValue} OFF`}
            </span>
          </motion.div>
        )}
      </Link>

      <div className="p-6 sm:p-8 space-y-4">
        <div>
          <Link to={`/shop/product/${product._id}`} className="block">
            <motion.h3
              className="text-xl font-light text-primary-950 mb-2 leading-tight"
              animate={{ color: isHovered ? "#eab308" : "#000000" }}
              transition={{ duration: 0.3 }}
            >
              {product.name}
            </motion.h3>
          </Link>
          {product.description && (
            <p className="text-sm text-primary-600 line-clamp-2 font-light leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-baseline gap-3 pt-4 border-t border-secondary-200">
          <span className="text-3xl font-light text-primary-950">
            ${finalPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-primary-400 line-through font-light">
              ${originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <AddButton className="w-full py-3" />
          {cartQty > 0 && (
            <button
              onClick={() => navigate("/cart")}
              className="w-full py-2 text-xs uppercase tracking-wider text-primary-600 hover:text-primary-950 transition-colors"
            >
              View cart →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
