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
      "bg-gradient-to-r from-secondary-500 to-secondary-600 text-white shadow-md shadow-secondary-500/25",
    New: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25",
    Featured: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25",
  };

  if (settingsLoaded && !shopPageEnabled) {
    return null;
  }

  return (
    <section className="py-28 px-4 bg-white text-neutral-900 relative overflow-hidden border-t-4 border-secondary-500">
      {/* ── Background Decoration Layer ── */}
      {/* Dot Grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 1.5px 1.5px, #fe5723 1.5px, transparent 0)`,
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      {/* Large orange blob — top left */}
      <div
        className="absolute -top-40 -left-40 w-[650px] h-[650px] rounded-full blur-[160px] opacity-25 pointer-events-none"
        style={{ background: "radial-gradient(circle, #fe5723 0%, #ff9a56 60%, transparent 100%)" }}
      />
      {/* Medium orange blob — bottom right */}
      <div
        className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-[140px] opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #fe5723 0%, #ff7a40 60%, transparent 100%)" }}
      />

      {/* Decorative diagonal stripe band — top right */}
      <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none overflow-hidden">
        <svg width="288" height="288" viewBox="0 0 288 288" fill="none" xmlns="http://www.w3.org/2000/svg">
          {[0,1,2,3,4,5,6,7].map(i => (
            <line key={i} x1={i*44} y1="0" x2={288} y2={288 - i*44} stroke="#fe5723" strokeWidth="1.5" strokeOpacity="0.12" />
          ))}
        </svg>
      </div>

      {/* Decorative diagonal stripe band — bottom left */}
      <div className="absolute bottom-0 left-0 w-56 h-56 pointer-events-none overflow-hidden">
        <svg width="224" height="224" viewBox="0 0 224 224" fill="none" xmlns="http://www.w3.org/2000/svg">
          {[0,1,2,3,4,5].map(i => (
            <line key={i} x1="0" y1={i*48} x2={224-i*48} y2="224" stroke="#fe5723" strokeWidth="1.5" strokeOpacity="0.10" />
          ))}
        </svg>
      </div>

      {/* Orange edge accent bar — left side */}
      <div className="absolute left-0 top-1/4 bottom-1/4 w-1.5 bg-gradient-to-b from-transparent via-secondary-500 to-transparent opacity-60 rounded-r-full pointer-events-none" />

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
            <div className="flex items-center gap-3 px-5 py-2.5 border border-secondary-400/40 bg-gradient-to-r from-secondary-50 to-orange-50 backdrop-blur-sm rounded-full shadow-sm shadow-secondary-500/10">
              <motion.div
                className="w-2.5 h-2.5 bg-secondary-500 rounded-full shadow-[0_0_10px_#fe5723]"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
              <span className="text-secondary-600 text-xs font-black tracking-[0.35em] uppercase">
                ⚽ Official Merch Drop
              </span>
            </div>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black mb-5 tracking-tight text-neutral-950 leading-none">
            Tournament{" "}
            <span
              className="relative inline-block text-secondary-500"
              style={{ WebkitTextStroke: "0px" }}
            >
              Gear
              {/* Underline squiggle */}
              <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" preserveAspectRatio="none">
                <path d="M0,4 Q25,0 50,4 Q75,8 100,4 Q125,0 150,4 Q175,8 200,4" stroke="#fe5723" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              </svg>
            </span>
            {" "}& Apparel
          </h2>
          <p className="text-base sm:text-lg text-neutral-500 max-w-xl mx-auto font-normal leading-relaxed">
            Tournament-grade kits, streetwear, and premium equipment built for the cage and the streets.
          </p>

          {/* Orange accent divider */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-secondary-400" />
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-secondary-500" />
              <div className="w-2 h-2 rounded-full bg-secondary-400/60" />
              <div className="w-2 h-2 rounded-full bg-secondary-300/40" />
            </div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-secondary-400" />
          </div>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {loading && (
            <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[0,1,2].map(i => (
                <div key={i} className="rounded-3xl overflow-hidden border border-secondary-100 animate-pulse">
                  <div className="h-72 bg-gradient-to-b from-secondary-50/60 to-orange-50/40" />
                  <div className="p-7 space-y-4 bg-white">
                    <div className="h-5 bg-secondary-100/60 rounded-lg w-3/4" />
                    <div className="h-4 bg-neutral-100 rounded-lg w-full" />
                    <div className="h-4 bg-neutral-50 rounded-lg w-2/3" />
                    <div className="h-12 bg-secondary-50 rounded-xl mt-6" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="col-span-1 md:col-span-3">
              <EmptyState
                variant="error"
                theme="light"
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
                theme="light"
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
                className="group relative bg-white text-neutral-950 overflow-hidden rounded-3xl flex flex-col justify-between border border-neutral-200/80 hover:border-secondary-400/60 transition-all duration-500 hover:-translate-y-3"
                style={{
                  boxShadow: hoveredIndex === index
                    ? "0 25px 60px -10px rgba(254,87,35,0.18), 0 10px 30px -5px rgba(0,0,0,0.08)"
                    : "0 4px 24px -4px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
                  transition: "box-shadow 0.4s ease, transform 0.4s ease, border-color 0.4s ease",
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: index * 0.12, ease: [0.21, 0.47, 0.32, 0.98] }}
              >
                {/* Orange top-edge accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl z-30 transition-all duration-500"
                  style={{
                    background: hoveredIndex === index
                      ? "linear-gradient(90deg, #fe5723 0%, #ff9a56 50%, #fe5723 100%)"
                      : "linear-gradient(90deg, transparent 0%, rgba(254,87,35,0.3) 50%, transparent 100%)",
                  }}
                />

                {/* Diagonal shine effect */}
                <motion.div
                  className="absolute inset-0 pointer-events-none z-20"
                  style={{
                    background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%)",
                    backgroundSize: "200% 100%",
                    backgroundPosition: hoveredIndex === index ? "right" : "left",
                    transition: "background-position 0.6s ease",
                  }}
                />

                {/* Image Container */}
                <div className="relative h-72 sm:h-80 overflow-hidden flex items-center justify-center border-b border-neutral-100">
                  {/* Orange-tinted bg with subtle pattern */}
                  <div
                    className="absolute inset-0 transition-all duration-500"
                    style={{
                      background: hoveredIndex === index
                        ? "linear-gradient(145deg, #fff7f4 0%, #fff1ec 60%, #ffe8de 100%)"
                        : "linear-gradient(145deg, #fafafa 0%, #f5f5f5 100%)",
                    }}
                  />
                  {/* Subtle radial glow behind product */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: "radial-gradient(ellipse at center, rgba(254,87,35,0.12) 0%, transparent 65%)" }}
                  />

                  {/* Decorative corner triangles */}
                  <div className="absolute top-0 left-0 w-0 h-0 border-l-[32px] border-t-[32px] border-l-secondary-500/20 border-t-secondary-500/20 border-r-transparent border-b-transparent" />
                  <div className="absolute bottom-0 right-0 w-0 h-0 border-r-[32px] border-b-[32px] border-r-secondary-500/15 border-b-secondary-500/15 border-l-transparent border-t-transparent" />

                  <motion.img
                    src={product.image}
                    alt={product.title}
                    className="relative z-10 w-full h-full object-contain drop-shadow-lg"
                    animate={{
                      scale: hoveredIndex === index ? 1.1 : 1,
                      y: hoveredIndex === index ? -6 : 0,
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />

                  {/* Badge */}
                  {product.badge && (
                    <motion.div
                      className="absolute top-5 right-5 z-20"
                      initial={{ opacity: 0, scale: 0, rotate: -20 }}
                      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 300 }}
                    >
                      <div
                        className={`px-4 py-1.5 ${
                          badgeColors[product.badge] || "bg-neutral-900 text-white"
                        } text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg`}
                      >
                        {product.badge}
                      </div>
                    </motion.div>
                  )}

                  {/* Product index label (decorative) */}
                  <div className="absolute bottom-4 left-4 z-10 w-7 h-7 rounded-full bg-secondary-500/90 text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-secondary-500/40">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-7 relative flex flex-col flex-grow justify-between">
                  {/* Orange left accent line */}
                  <div
                    className="absolute left-0 top-6 bottom-6 w-0.5 rounded-full transition-all duration-300"
                    style={{
                      background: hoveredIndex === index
                        ? "linear-gradient(to bottom, #fe5723, #ff9a56)"
                        : "transparent",
                    }}
                  />

                  <div>
                    {/* Category tag */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-secondary-500 bg-secondary-50 border border-secondary-200/60 px-2.5 py-1 rounded-full">
                        Arena × Gear
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-neutral-950 mb-2 leading-tight group-hover:text-secondary-600 transition-colors duration-300">
                      {product.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-500 mb-5 font-normal leading-relaxed line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <div>
                    {/* Price Section */}
                    <div className="mb-5 pt-5 border-t-2 border-dashed border-secondary-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Price</div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl sm:text-4xl font-black text-neutral-950 leading-none">
                            ${product.price}
                          </span>
                          <span className="text-xs font-bold text-neutral-400 uppercase">USD</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80 uppercase tracking-wider">
                          ✓ In Stock
                        </span>
                        <span className="text-[10px] font-bold text-secondary-500 uppercase tracking-wider">
                          Free Shipping
                        </span>
                      </div>
                    </div>

                    {/* CTA Button — full orange on hover */}
                    <Link
                      to={product.link || "#"}
                      className="group/btn relative inline-flex items-center justify-center gap-2.5 w-full px-6 py-4 text-xs font-black uppercase tracking-widest rounded-2xl overflow-hidden transition-all duration-300"
                      style={{
                        background: hoveredIndex === index
                          ? "linear-gradient(135deg, #fe5723 0%, #ff7a40 100%)"
                          : "#0a0a0a",
                        color: "white",
                        boxShadow: hoveredIndex === index
                          ? "0 8px 24px rgba(254,87,35,0.35), 0 2px 8px rgba(254,87,35,0.2)"
                          : "0 2px 8px rgba(0,0,0,0.12)",
                      }}
                    >
                      <span className="relative z-10 flex items-center gap-2.5">
                        <span>Shop Now</span>
                        <motion.span
                          animate={{ x: hoveredIndex === index ? 4 : 0 }}
                          transition={{ duration: 0.25 }}
                          className="text-sm"
                        >
                          →
                        </motion.span>
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Hover border glow */}
                <motion.div
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  animate={{
                    boxShadow: hoveredIndex === index
                      ? "inset 0 0 0 1.5px rgba(254,87,35,0.5)"
                      : "inset 0 0 0 0px rgba(254,87,35,0)",
                  }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
        </div>

        {/* Stats ribbon */}
        <motion.div
          className="grid grid-cols-3 gap-4 mb-14 py-8 px-8 rounded-3xl border border-secondary-100 bg-gradient-to-r from-secondary-50/80 via-orange-50/60 to-secondary-50/80"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          {[
            { label: "Products", value: "50+", icon: "🏷️" },
            { label: "Countries Shipped", value: "12", icon: "🌍" },
            { label: "Happy Athletes", value: "2K+", icon: "⚽" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className="text-2xl sm:text-3xl font-black text-secondary-500 leading-none">{stat.value}</div>
              <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* View All Link */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Link
            to="/shop"
            className="group relative inline-flex items-center gap-3 px-10 py-5 font-black text-sm uppercase tracking-widest rounded-full overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #fe5723 0%, #ff7a40 100%)",
              color: "white",
              boxShadow: "0 8px 30px rgba(254,87,35,0.35), 0 2px 8px rgba(254,87,35,0.2)",
            }}
          >
            <span>View All Products</span>
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="text-base"
            >
              →
            </motion.span>
            {/* inner glow on hover */}
            <span className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ShopHighlights;
