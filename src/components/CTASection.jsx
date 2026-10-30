import { motion } from "framer-motion";

const CTASection = () => {
  return (
    <section className="py-24 px-4 bg-gradient-to-br from-secondary-50 via-secondary-100 to-secondary-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        className="absolute top-0 left-1/4 w-96 h-96 bg-secondary-500 rounded-full blur-3xl opacity-5"
        animate={{
          scale: [1, 1.2],
          x: [0, 50],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-400 rounded-full blur-3xl opacity-5"
        animate={{
          scale: [1, 1.2],
          x: [0, -50],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(250, 204, 21, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(250, 204, 21, 0.1) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-block mb-6"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <span className="px-4 py-2 bg-secondary-500/10 border border-secondary-500/30 rounded-full text-secondary-700 text-sm font-semibold">
              GET STARTED
            </span>
          </motion.div>
          <h2 className="text-5xl md:text-7xl font-black text-secondary-600 mb-6 leading-tight">
            Ready to Transform Your{" "}
            <span className="bg-gradient-to-r from-secondary-600 via-secondary-500 to-secondary-600 bg-clip-text text-transparent">
              PDF Workflow?
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-primary-700 mb-10 max-w-3xl mx-auto leading-relaxed">
            Join thousands of users who are already revolutionizing their
            document processing
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              className="px-10 py-5 bg-gradient-to-r from-accent-500 to-accent-400 text-primary-950 font-bold rounded-full text-lg shadow-xl shadow-accent-500/30 relative overflow-hidden group border-2 border-accent-600"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  "0 0 20px rgba(234, 179, 8, 0.3)",
                  "0 0 40px rgba(234, 179, 8, 0.5)",
                ],
              }}
              transition={{
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                },
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started Free
                <motion.span
                  animate={{ x: [0, 5] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                >
                  →
                </motion.span>
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-accent-300 to-accent-500"
                initial={{ x: "-100%" }}
                whileHover={{ x: "0%" }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>

            <motion.button
              className="px-10 py-5 bg-transparent border-2 border-primary-800 text-primary-950 font-bold rounded-full text-lg hover:bg-accent-100 transition-all"
              whileHover={{
                scale: 1.05,
                y: -2,
                borderColor: "rgba(234, 179, 8, 0.8)",
                backgroundColor: "rgba(234, 179, 8, 0.05)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
