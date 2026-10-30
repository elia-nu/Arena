import { motion } from "framer-motion";
import {
  IoPeopleOutline,
  IoFlagOutline,
  IoRocketOutline,
  IoHeartOutline,
} from "react-icons/io5";

const AboutUs = () => {
  const values = [
    {
      icon: IoPeopleOutline,
      title: "Community First",
      description:
        "We believe in building a strong, inclusive community where everyone can participate and thrive.",
    },
    {
      icon: IoFlagOutline,
      title: "Excellence",
      description:
        "We strive for excellence in every tournament, event, and interaction with our community.",
    },
    {
      icon: IoRocketOutline,
      title: "Innovation",
      description:
        "We continuously innovate to provide the best tournament experience and platform for our users.",
    },
    {
      icon: IoHeartOutline,
      title: "Passion",
      description:
        "Our passion for sports and community drives everything we do, creating memorable experiences.",
    },
  ];

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-32">
        {/* Hero Section - Minimalist */}
        <motion.div
          className="text-center mb-24 md:mb-32"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1
            className="text-5xl md:text-7xl font-black text-black-60 mb-6 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            About <span className="text-secondary-500">Us</span>
          </motion.h1>
          <motion.div
            className="w-24 h-px bg-secondary-400 mx-auto mb-8"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          />
          <motion.p
            className="text-lg md:text-xl text-primary-600 max-w-2xl mx-auto leading-relaxed font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Rooted in Seattle street soccer culture, uniting players, families,
            and civic partners through authentic competition and youth empowerment.
          </motion.p>
        </motion.div>

        {/* Mission Section - Clean and Simple */}
        <motion.div
          className="mb-24 md:mb-32"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-3xl md:text-4xl font-light text-primary-950 mb-6 tracking-tight">
                Our <span className="text-secondary-600">Story &amp; Mission</span>
              </h2>
              <div className="space-y-4 text-primary-600 leading-relaxed font-light">
                <p className="text-base md:text-lg">
                  Founded in Seattle, Les Kick&apos;t was born out of neighborhood pickup
                  games and public park courts. We organize tournaments, youth clinics,
                  and community events that celebrate the fast-paced energy of street soccer.
                </p>
                <p className="text-base md:text-lg">
                  We believe in the power of soccer to unite neighborhoods, foster healthy
                  competition, and open positive pathways for youth and adult athletes alike.
                </p>
                <p className="text-base md:text-lg">
                  Through partnerships with Seattle Parks &amp; Recreation, Downtown Seattle
                  Association, Rave&apos;s Foundation, King County, and local grassroots
                  allies, we create accessible sporting experiences across Greater Seattle.
                </p>
              </div>
            </motion.div>
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop"
                  alt="Team collaboration"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Values Grid - Minimalist Cards */}
        <motion.div
          className="mb-24 md:mb-32"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl md:text-4xl font-light text-primary-950 mb-16 text-center tracking-tight">
            Our <span className="text-secondary-600">Values</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  className="group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-secondary-500 group-hover:text-secondary-600 transition-colors duration-300">
                      <Icon className="text-3xl" />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-xl md:text-2xl font-light text-primary-950 mb-3 tracking-tight">
                        {value.title}
                      </h3>
                      <p className="text-primary-600 leading-relaxed font-light">
                        {value.description}
                      </p>
                    </div>
                  </div>
                  {index < values.length - 1 && (
                    <div className="mt-8 md:hidden h-px bg-primary-200" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Community Section - Elegant and Simple */}
        <motion.div
          className="mb-24 md:mb-32"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-light text-primary-950 mb-8 tracking-tight">
              Our <span className="text-secondary-600">Community</span>
            </h2>
            <p className="text-base md:text-lg text-primary-600 leading-relaxed font-light mb-12">
              Join thousands of players, teams, and sports enthusiasts who trust
              Les Kick't for their tournament needs. Together, we're building a
              vibrant community that celebrates competition, camaraderie, and
              the love of sports.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=400&fit=crop",
              ].map((img, index) => (
                <motion.div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                >
                  <img
                    src={img}
                    alt={`Community member ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Call to Action - Minimalist */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <div className="max-w-2xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-light text-primary-950 mb-6 tracking-tight">
              Ready to <span className="text-secondary-600">Join Us?</span>
            </h3>
            <p className="text-base md:text-lg text-primary-600 mb-10 leading-relaxed font-light">
              Be part of our growing community. Register for tournaments,
              connect with teammates, and experience the thrill of competition.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                href="/events"
                className="px-8 py-3 bg-secondary-500 text-primary-950 font-semibold rounded-full hover:bg-secondary-600 transition-all duration-300 text-sm tracking-wide shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                View Events
              </motion.a>
              <motion.a
                href="/contact"
                className="px-8 py-3 bg-transparent border-2 border-secondary-500 text-secondary-600 font-semibold rounded-full hover:bg-secondary-50 transition-all duration-300 text-sm tracking-wide"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Contact Us
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutUs;
