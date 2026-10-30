import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const DiagonalCarousel = ({ items = [] }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Function to get random items
  const getRandomItems = () => {
    if (items.length <= 5) return items;

    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  };

  useEffect(() => {
    // Set initial random items
    setSelectedItems(getRandomItems());

    // Randomize every 5 seconds
    const interval = setInterval(() => {
      setSelectedItems(getRandomItems());
    }, 5000);

    return () => clearInterval(interval);
  }, [items]);

  const visibleItems =
    selectedItems.length > 0
      ? selectedItems
      : items.length <= 5
      ? items
      : items.slice(0, 5);

  return (
    <div className="relative w-full h-[800px] md:h-[900px] lg:h-[1000px] overflow-visible">
      {visibleItems.slice(0, 5).map((item, index) => {
        // Position 5 cards: 2 on top, 1 in middle, 2 on bottom - spread out to avoid overlap
        let position;
        if (index < 2) {
          // Top row - two cards spread far apart
          position = {
            top: "0%",
            left: index === 0 ? "0%" : "70%",
            zIndex: index === 0 ? 3 : 2,
          };
        } else if (index === 2) {
          // Middle card - centered, positioned higher
          position = {
            top: "24%",
            left: "30%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
          };
        } else {
          // Bottom row - two cards spread far apart
          position = {
            bottom: "20%",
            left: index === 3 ? "5%" : "75%",
            zIndex: index === 3 ? 2 : 1,
          };
        }

        const isUp = index < 2;

        return (
          <motion.div
            key={`${item.id || index}-${selectedItems.length}`}
            className="absolute w-[220px] md:w-[280px] h-[270px] rounded-3xl overflow-hidden cursor-pointer group"
            style={position}
            initial={{
              opacity: 0,
              scale: 0.85,
              y: isUp ? -60 : 60,
              rotate:
                index === 0
                  ? -4
                  : index === 1
                  ? 4
                  : index === 2
                  ? -2
                  : index === 3
                  ? 2
                  : -1,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              rotate:
                index === 0
                  ? -3
                  : index === 1
                  ? 3
                  : index === 2
                  ? -1
                  : index === 3
                  ? 1
                  : 0,
              boxShadow:
                hoveredIndex === index
                  ? "0 25px 50px -12px rgba(234, 179, 8, 0.5)"
                  : "0 10px 30px -5px rgba(0, 0, 0, 0.5)",
            }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{
              duration: 0.7,
              delay: index * 0.15,
              type: "spring",
              stiffness: 120,
              damping: 15,
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            whileHover={{
              scale: 1.08,
              rotate: 0,
              zIndex: 20,
              y: isUp ? -10 : -10,
            }}
          >
            {/* Background Image */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"
              animate={{
                scale: hoveredIndex === index ? 1.15 : 1,
                filter:
                  hoveredIndex === index
                    ? "brightness(1.1)"
                    : "brightness(0.9)",
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  style={{ opacity: hoveredIndex === index ? 0.85 : 0.7 }}
                />
              )}
            </motion.div>

            {/* Animated Gradient Overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20"
              animate={{
                opacity: hoveredIndex === index ? 0.9 : 1,
              }}
              transition={{ duration: 0.3 }}
            />

            {/* Shine Effect on Hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              initial={{ x: "-100%" }}
              animate={{
                x: hoveredIndex === index ? "100%" : "-100%",
              }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />

            {/* Badge */}
            {item.badge && (
              <motion.div
                className="absolute top-4 right-4 px-4 py-1.5 bg-gradient-to-r from-tertiary-500 to-tertiary-400 text-primary-950 text-xs font-bold rounded-full z-10 shadow-lg"
                initial={{ scale: 0, rotate: -180 }}
                animate={{
                  scale: 1,
                  rotate: 0,
                  boxShadow:
                    hoveredIndex === index
                      ? "0 4px 15px rgba(250, 204, 21, 0.6)"
                      : "0 2px 8px rgba(0, 0, 0, 0.3)",
                }}
                transition={{
                  delay: 0.4 + index * 0.15,
                  type: "spring",
                  stiffness: 200,
                }}
                whileHover={{ scale: 1.1 }}
              >
                {item.badge}
              </motion.div>
            )}

            {/* Content */}
            <div className="absolute inset-0 p-6 md:p-7 flex flex-col justify-end">
              <motion.div
                animate={{
                  y: hoveredIndex === index ? -8 : 0,
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <motion.h3
                  className="text-2xl md:text-3xl lg:text-xl font-black text-secondary-50 mb-3 leading-tight"
                  animate={{
                    y: hoveredIndex === index ? -3 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {item.title}
                </motion.h3>

                {item.description && (
                  <motion.p
                    className="text-secondary-200 text-sm md:text-base mb-4 line-clamp-2 leading-relaxed"
                    animate={{
                      opacity: hoveredIndex === index ? 1 : 0.85,
                      y: hoveredIndex === index ? -2 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {item.description}
                  </motion.p>
                )}

                {/* Info Icons */}
                <div className="flex flex-col gap-2 mb-5">
                  {item.date && (
                    <motion.div
                      className="flex items-center gap-2 text-tertiary-400 text-sm font-semibold"
                      animate={{
                        opacity: hoveredIndex === index ? 1 : 0.8,
                        x: hoveredIndex === index ? 3 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="text-base">📅</span>
                      <span>{item.date}</span>
                    </motion.div>
                  )}

                  {item.location && (
                    <motion.div
                      className="flex items-center gap-2 text-secondary-200 text-sm"
                      animate={{
                        opacity: hoveredIndex === index ? 1 : 0.75,
                        x: hoveredIndex === index ? 3 : 0,
                      }}
                      transition={{ duration: 0.3, delay: 0.05 }}
                    >
                      <span className="text-base">📍</span>
                      <span>{item.location}</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Button */}
              <motion.div
                animate={{
                  y: hoveredIndex === index ? -8 : 0,
                  scale: hoveredIndex === index ? 1.02 : 1,
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Link
                  to={item.link || "#"}
                  className="relative inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-tertiary-500 to-tertiary-400 text-primary-950 font-thin uppercase overflow-hidden group/btn"
                >
                  <motion.span className="absolute inset-0 bg-gradient-to-r from-tertiary-400 to-tertiary-300 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  <span className="relative z-10">
                    {item.buttonText || "Learn More"}
                  </span>
                  <motion.span
                    className="relative z-10 text-md"
                    animate={{
                      x: hoveredIndex === index ? 6 : 0,
                      rotate: hoveredIndex === index ? 0 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    →
                  </motion.span>
                  <motion.div
                    className="absolute inset-0 shadow-lg shadow-tertiary-500/50"
                    animate={{
                      opacity: hoveredIndex === index ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
              </motion.div>
            </div>

            {/* Hover Glow Effect */}
            <motion.div
              className="absolute inset-0 border-2 border-tertiary-500/0 rounded-3xl pointer-events-none"
              animate={{
                borderColor:
                  hoveredIndex === index
                    ? "rgba(250, 204, 21, 0.7)"
                    : "rgba(250, 204, 21, 0)",
                boxShadow:
                  hoveredIndex === index
                    ? "0 0 60px rgba(250, 204, 21, 0.5), inset 0 0 30px rgba(250, 204, 21, 0.1)"
                    : "0 0 0px rgba(250, 204, 21, 0)",
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />

            {/* Corner Accent */}
            <motion.div
              className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-tertiary-500/20 to-transparent rounded-br-full pointer-events-none"
              animate={{
                opacity: hoveredIndex === index ? 0.6 : 0.3,
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        );
      })}

      {/* Randomize Button */}
      {items.length > 5 && (
        <motion.button
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-primary-950/30 backdrop-blur-sm px-6 py-2 rounded-full text-tertiary-400 text-sm font-semibold hover:bg-primary-950/50 transition-all"
          onClick={() => setSelectedItems(getRandomItems())}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          🔀 Randomize
        </motion.button>
      )}
    </div>
  );
};

export default DiagonalCarousel;
