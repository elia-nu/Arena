import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";

const BounceCards = ({ items = [] }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {items.map((item, index) => (
        <motion.div
          key={item.id || index}
          className="relative h-[400px] rounded-2xl overflow-hidden cursor-pointer group"
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          {/* Background Image */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"
            animate={{
              scale: hoveredIndex === index ? 1.1 : 1,
            }}
            transition={{ duration: 0.4 }}
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover opacity-60"
              />
            )}
          </motion.div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 p-6 flex flex-col justify-end">
            <motion.div
              animate={{
                y: hoveredIndex === index ? -10 : 0,
              }}
              transition={{ duration: 0.4 }}
            >
              {item.badge && (
                <motion.span
                  className="inline-block px-3 py-1 bg-tertiary-500 text-primary-950 text-sm font-bold rounded-full mb-3"
                  animate={{
                    scale: hoveredIndex === index ? 1.1 : 1,
                  }}
                >
                  {item.badge}
                </motion.span>
              )}

              <motion.h3
                className="text-2xl md:text-3xl font-black text-secondary-50 mb-2"
                animate={{
                  scale: hoveredIndex === index ? 1.05 : 1,
                }}
              >
                {item.title}
              </motion.h3>

              <p className="text-secondary-200 mb-4 line-clamp-2">
                {item.description}
              </p>

              {/* Progress Bar for Events */}
              {item.participants !== undefined && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-secondary-300 mb-2">
                    <span>Registered</span>
                    <span className="font-bold text-tertiary-400">
                      {item.participants}/{item.maxParticipants}
                    </span>
                  </div>
                  <div className="w-full bg-primary-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-tertiary-500 to-tertiary-400 h-2 rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{
                        width: `${
                          (item.participants / item.maxParticipants) * 100
                        }%`,
                      }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              <motion.div
                animate={{
                  y: hoveredIndex === index ? -5 : 0,
                }}
              >
                {item.link ? (
                  <Link
                    to={item.link}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 text-primary-950 font-bold rounded-full hover:bg-accent-400 transition-colors"
                  >
                    {item.buttonText || "View Details"}
                    <motion.span
                      animate={{
                        x: hoveredIndex === index ? 5 : 0,
                      }}
                    >
                      →
                    </motion.span>
                  </Link>
                ) : (
                  <button
                    onClick={item.onClick}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 text-primary-950 font-bold rounded-full hover:bg-accent-400 transition-colors"
                  >
                    {item.buttonText || "Learn More"}
                    <motion.span
                      animate={{
                        x: hoveredIndex === index ? 5 : 0,
                      }}
                    >
                      →
                    </motion.span>
                  </button>
                )}
              </motion.div>
            </motion.div>
          </div>

          {/* Hover Glow Effect */}
          <motion.div
            className="absolute inset-0 border-2 border-tertiary-500/0 rounded-2xl pointer-events-none"
            animate={{
              borderColor:
                hoveredIndex === index
                  ? "rgba(234, 179, 8, 0.5)"
                  : "rgba(234, 179, 8, 0)",
              boxShadow:
                hoveredIndex === index
                  ? "0 0 40px rgba(234, 179, 8, 0.3)"
                  : "0 0 0px rgba(234, 179, 8, 0)",
            }}
            transition={{ duration: 0.4 }}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default BounceCards;
