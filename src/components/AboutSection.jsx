import { motion } from "framer-motion";

const AboutSection = () => {
  const steps = [
    {
      number: "01",
      title: "Upload Your PDF",
      description:
        "Drag and drop or select your PDF file. We support all standard PDF formats.",
    },
    {
      number: "02",
      title: "Process & Transform",
      description:
        "Our AI engine analyzes and processes your document with advanced algorithms.",
    },
    {
      number: "03",
      title: "Download & Share",
      description:
        "Get your transformed PDF instantly. Share, download, or continue editing.",
    },
  ];

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-secondary-100 via-secondary-50 to-secondary-100 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(250, 204, 21, 0.5) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
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
              PROCESS
            </span>
          </motion.div>
          <h2 className="text-5xl md:text-7xl font-black text-secondary-600 mb-6 leading-tight">
            How It{" "}
            <span className="bg-gradient-to-r from-secondary-700 via-secondary-600 to-secondary-700 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-primary-700 max-w-3xl mx-auto leading-relaxed">
            Simple, fast, and powerful PDF processing in three easy steps
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <motion.div
                className="relative p-10 bg-secondary-50 backdrop-blur-xl rounded-3xl border-2 border-primary-200 hover:border-tertiary-500 h-full shadow-lg hover:shadow-xl group"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-tertiary-500/5 to-tertiary-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                <motion.div
                  className="text-8xl font-black text-tertiary-500/20 mb-6 relative z-10"
                  animate={{
                    scale: [1, 1.1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                >
                  {step.number}
                </motion.div>

                <h3 className="text-2xl font-bold text-secondary-600 mb-4 relative z-10">
                  {step.title}
                </h3>
                <p className="text-primary-700 leading-relaxed relative z-10">
                  {step.description}
                </p>

                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-tertiary-500 via-tertiary-400 to-tertiary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b-3xl"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.4 }}
                />

                {index < steps.length - 1 && (
                  <motion.div
                    className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-yellow-500 to-yellow-400"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.5 + index * 0.2 }}
                  >
                    <motion.div
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-8 border-l-yellow-500 border-t-4 border-t-transparent border-b-4 border-b-transparent"
                      animate={{
                        x: [0, 5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                      }}
                    />
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
