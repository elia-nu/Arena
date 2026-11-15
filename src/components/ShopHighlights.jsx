import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { shopAPI, contactAPI } from "../services/api";
import EmptyState from "./EmptyState";
import { absoluteMediaSrc } from "../utils/mediaUtils";
import { IoChevronForward } from "react-icons/io5";

const ShopHighlights = () => {
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
              ? "New Drop"
              : null,
            link: `/shop/product/${p._id}`,
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

  if (settingsLoaded && !shopPageEnabled) {
    return null;
  }

  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-neutral-50/70 text-neutral-900 border-t border-neutral-200">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-secondary-500/30 bg-secondary-500/10 text-xs font-semibold text-secondary-600 mb-3 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-secondary-500" />
            <span>Official Merchandise</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-950 mb-3 uppercase">
            Tournament <span className="text-secondary-500">Gear</span> & Apparel
          </h2>

          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
            Matchwear, accessories, and training kits built for the cage and everyday street play.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {loading && (
            <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-neutral-200 bg-white animate-pulse h-96">
                  <div className="h-60 bg-neutral-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-neutral-100 rounded w-2/3" />
                    <div className="h-4 bg-neutral-100 rounded w-full" />
                    <div className="h-4 bg-neutral-100 rounded w-1/3" />
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
            products.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col justify-between hover:border-secondary-500/50 hover:shadow-md transition-all duration-150"
              >
                <div>
                  {/* Product Image */}
                  <Link
                    to={product.link || "#"}
                    className="relative aspect-square w-full bg-neutral-100 overflow-hidden flex items-center justify-center block"
                  >
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
                    />

                    {product.badge && (
                      <span className="absolute top-3 right-3 text-[11px] font-bold bg-secondary-500 text-white px-2.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
                        {product.badge}
                      </span>
                    )}
                  </Link>

                  {/* Body Content */}
                  <div className="p-5 space-y-1">
                    <span className="text-[10px] font-bold text-secondary-600 uppercase tracking-widest">
                      Arena Official
                    </span>

                    <Link to={product.link || "#"} className="block">
                      <h3 className="text-base font-bold text-neutral-900 leading-snug group-hover:text-secondary-500 transition-colors line-clamp-1">
                        {product.title}
                      </h3>
                    </Link>

                    {product.description && (
                      <p className="text-xs text-neutral-500 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="pt-2">
                      <span className="text-xl font-black text-secondary-500 tabular-nums">
                        ${product.price}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  <Link
                    to={product.link || "#"}
                    className="h-10 w-full rounded-lg bg-secondary-500 hover:bg-secondary-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>View Product</span>
                    <IoChevronForward className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
        </div>

        {/* Value Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 p-5 rounded-xl border border-secondary-500/20 bg-white">
          <div className="text-center sm:text-left">
            <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5 justify-center sm:justify-start">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
              Regional Delivery
            </h4>
            <p className="text-[11px] text-neutral-500 mt-0.5">Prompt dispatch across Addis Ababa & Hawassa</p>
          </div>
          <div className="text-center sm:text-left sm:border-l sm:border-neutral-100 sm:pl-4">
            <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5 justify-center sm:justify-start">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
              Official Kits
            </h4>
            <p className="text-[11px] text-neutral-500 mt-0.5">Authentic matchwear for tournament teams</p>
          </div>
          <div className="text-center sm:text-left sm:border-l sm:border-neutral-100 sm:pl-4">
            <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5 justify-center sm:justify-start">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
              Verified Equipment
            </h4>
            <p className="text-[11px] text-neutral-500 mt-0.5">Tested on asphalt & caged mini-stadiums</p>
          </div>
        </div>

        {/* View All CTA */}
        <div className="text-center">
          <Link
            to="/shop"
            className="h-11 px-7 rounded-lg font-bold text-xs text-white bg-secondary-500 hover:bg-secondary-600 uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-xs"
          >
            <span>Explore the store</span>
            <IoChevronForward className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ShopHighlights;
