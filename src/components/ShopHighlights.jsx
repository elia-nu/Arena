import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { shopAPI, contactAPI } from "../services/api";
import EmptyState from "./EmptyState";
import { absoluteMediaSrc } from "../utils/mediaUtils";

const ShopHighlights = () => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopPageEnabled, setShopPageEnabled] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const data = await contactAPI.getInfo();
        const enabled = data?.contactInfo?.shopPageEnabled;
        if (isMounted) {
          setShopPageEnabled(typeof enabled === "boolean" ? enabled : true);
        }
      } catch (err) {
        console.error("Error loading site settings:", err);
        if (isMounted) setShopPageEnabled(true);
      } finally {
        if (isMounted) setSettingsLoaded(true);
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!settingsLoaded || !shopPageEnabled) return;

    let isMounted = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get a small set of latest active products for the homepage
        const data = await shopAPI.getProducts({
          status: "active",
          sortBy: "createdAt",
          sortOrder: "desc",
          limit: 3,
        });

        if (!isMounted) return;

        const mappedProducts =
          data?.products?.map((p) => ({
            id: p._id,
            title: p.name,
            description: p.description,
            price: typeof p.finalPrice === "number" ? p.finalPrice : p.price,
            image:
              absoluteMediaSrc(p.images?.[0]) ||
              "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=600&fit=crop",
            badge: p.featured
              ? "Featured"
              : p.tags?.includes("new")
              ? "New"
              : null,
            link: `/shop/product/${p._id}`,
            buttonText: "Shop Now",
          })) || [];

        setProducts(mappedProducts);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load shop highlights:", err);
        setError(
          err?.message || "Unable to load products. Please try again later."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [settingsLoaded, shopPageEnabled]);

  const badgeColors = {
    "Best Seller":
      "bg-gradient-to-r from-secondary-500 to-secondary-600 text-primary-950",
    New: "bg-gradient-to-r from-tertiary-400 to-tertiary-500 text-primary-950",
    Featured: "bg-gradient-to-r from-accent-400 to-accent-500 text-primary-950",
  };

  if (settingsLoaded && !shopPageEnabled) {
    return null;
  }

  return (
    <section className="py-32 px-4 bg-primary-950 text-secondary-50 relative overflow-hidden">
      {/* Elegant Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, ${
              getComputedStyle(document.documentElement).getPropertyValue(
                "--color-secondary-50"
              ) || "#ffffff"
            } 1px, transparent 0)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Enhanced Background Glow Effects */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary-500 rounded-full blur-[200px] opacity-10"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-tertiary-500 rounded-full blur-[150px] opacity-5"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 50, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-block mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 px-6 py-2.5 border border-secondary-500/30 bg-secondary-500/10 backdrop-blur-sm rounded-full">
              <motion.div
                className="w-2 h-2 bg-secondary-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-secondary-400 text-xs font-medium tracking-[0.3em] uppercase">
                Shop
              </span>
            </div>
          </motion.div>

          <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-secondary-50 via-secondary-300 to-secondary-50 bg-clip-text text-transparent">
              Merchandise
            </span>
          </h2>
          <p className="text-lg md:text-xl text-secondary-200 max-w-2xl mx-auto font-light leading-relaxed">
            Official tournament gear and premium merchandise. Quality for
            champions.
          </p>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {loading && (
            <div className="col-span-1 md:col-span-3 text-center text-secondary-200">
              Loading products...
            </div>
          )}

          {!loading && error && (
            <div className="col-span-1 md:col-span-3">
              <EmptyState
                variant="error"
                theme="dark"
                title="Unable to load merchandise"
                description={error}
                actionLabel="Visit the shop"
                actionTo="/shop"
              />
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="col-span-1 md:col-span-3">
              <EmptyState
                variant="shop"
                theme="dark"
                title="Gear dropping soon"
                description="Official tournament merch and champion-ready kits are on the way. Check back for drops."
                actionLabel="Visit the shop"
                actionTo="/shop"
              />
            </div>
          )}

          {!loading &&
            !error &&
            products.map((product, index) => (
              <motion.div
                key={product.id}
                className="group relative bg-gradient-to-br from-secondary-50 to-primary-100 text-primary-950 overflow-hidden rounded-2xl shadow-2xl"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -12, scale: 1.02 }}
              >
                {/* Shine Effect on Hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full pointer-events-none z-20"
                  transition={{ duration: 0.8 }}
                />

                {/* Image Container */}
                <div className="relative h-80 overflow-hidden bg-gradient-to-br from-primary-200 to-primary-300">
                  <motion.img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-contain"
                    animate={{
                      scale: hoveredIndex === index ? 1.15 : 1,
                    }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary-50 via-secondary-50/60 to-transparent" />

                  {/* Animated Shimmer Overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{
                      x: hoveredIndex === index ? ["-100%", "200%"] : "-100%",
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: hoveredIndex === index ? Infinity : 0,
                      ease: "linear",
                    }}
                  />

                  {/* Badge */}
                  {product.badge && (
                    <motion.div
                      className="absolute top-6 right-6 z-10"
                      initial={{ opacity: 0, scale: 0, rotate: -180 }}
                      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <div
                        className={`px-5 py-2 ${
                          badgeColors[product.badge] ||
                          "bg-primary-950 text-secondary-50"
                        } text-xs font-bold uppercase tracking-wider rounded-full shadow-lg backdrop-blur-sm`}
                      >
                        {product.badge}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Content */}
                <div className="p-8 relative">
                  <motion.div
                    className="mb-5"
                    animate={{
                      y: hoveredIndex === index ? -8 : 0,
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <h3 className="text-2xl md:text-3xl font-semibold text-primary-950 mb-3 leading-tight group-hover:text-secondary-600 transition-colors duration-300">
                      {product.title}
                    </h3>
                    <p className="text-sm md:text-base text-primary-700 mb-6 font-light leading-relaxed line-clamp-2">
                      {product.description}
                    </p>
                  </motion.div>

                  {/* Price Section */}
                  <div className="mb-6 border-t-2 border-primary-200 pt-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl md:text-5xl font-bold text-primary-950">
                        ${product.price}
                      </span>
                      <span className="text-sm text-primary-600 font-light">
                        USD
                      </span>
                    </div>
                  </div>

                  {/* Button */}
                  <motion.div
                    animate={{
                      y: hoveredIndex === index ? -5 : 0,
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    <Link
                      to={product.link || "#"}
                      className="group/btn relative inline-flex items-center justify-center gap-3 w-full px-6 py-4 bg-primary-950 text-secondary-400 text-sm font-semibold uppercase tracking-wider overflow-hidden rounded-lg transition-all duration-300"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {product.buttonText || "Shop Now"}
                        <motion.span
                          className="relative z-10 text-lg"
                          animate={{
                            x: hoveredIndex === index ? 6 : 0,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          →
                        </motion.span>
                      </span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-secondary-500 to-secondary-600 text-primary-950"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "0%" }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                      />
                      <motion.span
                        className="absolute inset-0 bg-gradient-to-r from-secondary-400 to-secondary-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
                        style={{ filter: "blur(20px)" }}
                      />
                    </Link>
                  </motion.div>
                </div>

                {/* Hover Border Glow */}
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-secondary-500/0 pointer-events-none"
                  animate={{
                    borderColor:
                      hoveredIndex === index
                        ? "rgba(234, 179, 8, 0.6)"
                        : "rgba(234, 179, 8, 0)",
                    boxShadow:
                      hoveredIndex === index
                        ? "0 0 40px rgba(234, 179, 8, 0.3)"
                        : "0 0 0px rgba(234, 179, 8, 0)",
                  }}
                  transition={{ duration: 0.4 }}
                />

                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-secondary-500/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
        </motion.div>

        {/* View All Link */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <Link
            to="/shop"
            className="group relative inline-flex items-center gap-3 px-10 py-5 border-2 border-secondary-500/30 text-secondary-50 text-sm font-semibold uppercase tracking-wider rounded-full hover:border-secondary-500 hover:text-secondary-400 hover:bg-secondary-500/10 transition-all duration-300 backdrop-blur-sm"
          >
            <span>View All Products</span>
            <motion.span
              animate={{ x: [0, 6, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-lg"
            >
              →
            </motion.span>
            <motion.div className="absolute inset-0 rounded-full bg-secondary-500/10 scale-0 group-hover:scale-100 transition-transform duration-300" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ShopHighlights;
