import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ParticlesBackground from "./ParticlesBackground";
import DiagonalCarousel from "./DiagonalCarousel";

const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  // Animated text reveal
  const text = "CHAMPIONSHIP TOURNAMENT";
  const textArray = text.split("");

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black"
    >
      {/* Particle Background */}
      <ParticlesBackground
        particleCount={80}
        particleColor="#fbbf24"
        lineColor="rgba(251, 191, 36, 0.3)"
        particleSpeed={0.5}
        connectionDistance={150}
      />

      {/* Glowing Orbs */}
      <motion.div
        className="absolute top-20 left-20 w-96 h-96 bg-yellow-500 rounded-full blur-3xl opacity-10 z-[1]"
        animate={{
          x: mousePosition.x * 100,
          y: mousePosition.y * 100,
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-400 rounded-full blur-3xl opacity-10 z-[1]"
        animate={{
          x: -mousePosition.x * 100,
          y: -mousePosition.y * 100,
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main Content */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 flex flex-col md:flex-row items-center justify-between min-h-screen px-4 md:px-8 lg:px-16 max-w-7xl mx-auto pt-24 md:pt-32"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left Side - Text Content */}
        <motion.div
          className="flex-1 md:max-w-[50%] mb-12 md:mb-0 text-left md:text-left md:pr-8 lg:pr-12"
          variants={itemVariants}
        >
          <motion.div
            className="inline-block px-5 py-2.5 mb-6 bg-gradient-to-r from-yellow-500/20 to-yellow-400/20 border border-yellow-500/40 rounded-full backdrop-blur-md shadow-lg shadow-yellow-500/10"
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.05, borderColor: "rgba(234, 179, 8, 0.6)" }}
          >
            <span className="text-yellow-400 font-bold text-sm md:text-base flex items-center gap-2">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                🏆
              </motion.span>
              Championship Season 2025
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-6xl font-black text-white mb-8 leading-tight"
            variants={itemVariants}
          >
            <div className="flex flex-col gap-2">
              <motion.span
                className="block"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
              >
                Let
              </motion.span>
              <motion.span
                className="block bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
              >
                Rumble
              </motion.span>
              <motion.span
                className="block"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
              >
                Together
              </motion.span>
            </div>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl lg:text-LG text-gray-200 mb-4 leading-relaxed font-medium"
            variants={itemVariants}
          >
            Experience the{" "}
            <motion.span
              className="text-yellow-400 font-bold relative inline-block"
              animate={{
                opacity: [0.9, 1, 0.9],
                textShadow: [
                  "0 0 0px rgba(251, 191, 36, 0)",
                  "0 0 20px rgba(251, 191, 36, 0.5)",
                  "0 0 0px rgba(251, 191, 36, 0)",
                ],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              ultimate tournament
            </motion.span>{" "}
            where champions are made. Compete, win, and{" "}
            <span className="text-yellow-300 font-semibold">dominate</span> the
            field.
          </motion.p>

          <motion.p
            className="text-base md:text-MD text-gray-400 mb-10 max-w-xl leading-relaxed"
            variants={itemVariants}
          >
            Join{" "}
            <span className="text-yellow-400 font-semibold">
              hundreds of players
            </span>
            , register your team, and compete for glory. Shop exclusive
            merchandise and gear up for victory.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex gap-4 flex-wrap mb-12"
            variants={itemVariants}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/events"
                className="px-10 py-5 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-thin uppercase text-lg md:text-md shadow-xl shadow-yellow-500/30 relative overflow-hidden group border-2 border-yellow-600 block"
              >
                <motion.span
                  className="relative z-10 flex items-center gap-2"
                  animate={{
                    x: [0, 5, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  Register Now
                  <motion.span
                    animate={{ rotate: [0, 15, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    →
                  </motion.span>
                </motion.span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-500"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "0%" }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </motion.div>

            <motion.button
              className="px-10 py-5 bg-transparent border-2 border-white/30 text-white font-thin uppercase text-lg md:text-md hover:bg-white/10 transition-all backdrop-blur-sm"
              whileHover={{
                scale: 1.05,
                borderColor: "rgba(234, 179, 8, 0.8)",
                backgroundColor: "rgba(234, 179, 8, 0.1)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                document
                  .getElementById("events")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View Events
            </motion.button>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            className="grid grid-cols-3 gap-6 md:gap-8"
            variants={itemVariants}
          >
            {[
              { number: "500+", label: "Players" },
              { number: "50+", label: "Teams" },
              { number: "20+", label: "Events" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.1, y: -5 }}
                className="cursor-pointer"
              >
                <motion.div
                  className="text-3xl md:text-4xl font-black text-yellow-400 mb-1"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.3,
                    ease: "easeInOut",
                  }}
                >
                  {stat.number}
                </motion.div>
                <div className="text-gray-400 font-semibold text-sm md:text-base">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right Side - Diagonal Carousel */}
        <motion.div
          className="flex-1 md:max-w-[45%] hidden md:flex items-center justify-center md:pl-8 lg:pl-12"
          variants={itemVariants}
        >
          <DiagonalCarousel
            items={[
              {
                id: 1,
                title: "Championship 2025",
                description: "The ultimate tournament experience",
                image:
                  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop",
                badge: "Featured",
                link: "/events",
                buttonText: "Register Now",
                date: "March 15, 2025",
                location: "Main Arena",
              },
              {
                id: 2,
                title: "Weekly League",
                description: "Competitive matches every week",
                image:
                  "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=600&fit=crop",
                badge: "Popular",
                link: "/events",
                buttonText: "View Details",
                date: "February 20, 2025",
                location: "Training Ground",
              },
              {
                id: 3,
                title: "Youth Tournament",
                description: "Showcase your talent",
                image:
                  "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=600&fit=crop",
                badge: "New",
                link: "/events",
                buttonText: "Learn More",
                date: "April 10, 2025",
                location: "Community Center",
              },
              {
                id: 4,
                title: "Elite Championship",
                description: "Top teams compete for glory",
                image:
                  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=600&fit=crop",
                badge: "Premium",
                link: "/events",
                buttonText: "Join Now",
                date: "May 5, 2025",
                location: "Stadium Arena",
              },
              {
                id: 5,
                title: "Summer League",
                description: "Hot matches all summer long",
                image:
                  "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&h=600&fit=crop",
                badge: "Hot",
                link: "/events",
                buttonText: "Register",
                date: "June 15, 2025",
                location: "Outdoor Field",
              },
            ]}
          />
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-2">
          <motion.div
            className="w-1 h-3 bg-yellow-400 rounded-full"
            animate={{
              y: [0, 12, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection;
