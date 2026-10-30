import { motion } from "framer-motion";

const FeaturesSection = () => {
  const features = [
    {
      icon: "🚀",
      title: "Lightning Fast",
      description: "Process your PDFs in seconds with our optimized engine",
      color: "from-tertiary-500 to-tertiary-400",
    },
    {
      icon: "🔒",
      title: "Secure & Private",
      description:
        "Your documents are encrypted and never stored on our servers",
      color: "from-tertiary-400 to-tertiary-300",
    },
    {
      icon: "✨",
      title: "AI-Powered",
      description: "Advanced AI technology for intelligent document processing",
      color: "from-tertiary-500 to-tertiary-400",
    },
    {
      icon: "📱",
      title: "Cross-Platform",
      description: "Works seamlessly on desktop, tablet, and mobile devices",
      color: "from-tertiary-400 to-tertiary-300",
    },
    {
      icon: "🎨",
      title: "Customizable",
      description:
        "Tailor the experience to match your workflow and preferences",
      color: "from-tertiary-500 to-tertiary-400",
    },
    {
      icon: "⚡",
      title: "Batch Processing",
      description: "Handle multiple files simultaneously with ease",
      color: "from-tertiary-400 to-tertiary-300",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
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

  return (
    <section className="py-24 px-4 min-h-screen bg-gradient-to-b from-secondary-50 via-secondary-100 to-secondary-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 bg-tertiary-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2],
            opacity: [0.2, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-96 h-96 bg-tertiary-400/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2],
            opacity: [0.3, 0.5],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-block mb-4"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <span className="px-4 py-2 bg-tertiary-500/10 border border-tertiary-500/30 rounded-full text-tertiary-700 text-sm font-semibold">
              FEATURES
            </span>
          </motion.div>
          <h2 className="text-5xl md:text-7xl font-black text-secondary-600 mb-6 leading-tight">
            Powerful{" "}
            <span className="bg-gradient-to-r from-secondary-700 via-secondary-600 to-secondary-700 bg-clip-text text-transparent">
              Features
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-primary-700 max-w-3xl mx-auto leading-relaxed">
            Everything you need to transform your PDF workflow with cutting-edge
            technology
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative"
            >
              <motion.div
                className="relative p-8 bg-secondary-50 backdrop-blur-xl rounded-3xl border-2 border-primary-200 hover:border-tertiary-500 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.03, y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-950/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <motion.div
                  className="text-6xl mb-4 relative"
                  animate={{
                    rotate: [0, 10],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                >
                  <div className="absolute inset-0 blur-xl opacity-50 bg-gradient-to-br from-accent-400 to-accent-500" />
                  <span className="relative z-10">{feature.icon}</span>
                </motion.div>

                <h3 className="text-2xl font-bold text-secondary-600 mb-3 relative z-10">
                  {feature.title}
                </h3>
                <p className="text-primary-700 leading-relaxed relative z-10">
                  {feature.description}
                </p>

                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-tertiary-500 via-tertiary-400 to-tertiary-500"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-tertiary-500/10 to-tertiary-400/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  animate={{
                    scale: [1, 1.2],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
