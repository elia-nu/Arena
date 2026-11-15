import { motion } from "framer-motion";
import {
  IoPeopleOutline,
  IoFlagOutline,
  IoRocketOutline,
  IoHeartOutline,
} from "react-icons/io5";
import DriftWall from "../components/reactbits/DriftWall";

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

  const communityMoments = [
    {
      image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop",
      title: "Street Soccer Matches",
      href: "/events",
    },
    {
      image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=400&fit=crop",
      title: "Youth Clinics",
      href: "/events",
    },
    {
      image: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600&h=400&fit=crop",
      title: "Championship Finals",
      href: "/events",
    },
    {
      image: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=600&h=400&fit=crop",
      title: "Under The Lights",
      href: "/gallery",
    },
    {
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop",
      title: "Training & Conditioning",
      href: "/events",
    },
    {
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop",
      title: "Team Camaraderie",
      href: "/community-impact",
    },
    {
      image: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&h=400&fit=crop",
      title: "Matchday Energy",
      href: "/events",
    },
    {
      image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&h=400&fit=crop",
      title: "Urban Turf Battles",
      href: "/gallery",
    },
    {
      image: "https://images.unsplash.com/photo-1517840933442-d2d1a05edb84?w=600&h=400&fit=crop",
      title: "Community Outreach",
      href: "/community-impact",
    },
    {
      image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&h=400&fit=crop",
      title: "Skill Showcases",
      href: "/events",
    },
    {
      image: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600&h=400&fit=crop",
      title: "Golden Hour Kickoff",
      href: "/events",
    },
    {
      image: "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&h=400&fit=crop",
      title: "Fair Play & Respect",
      href: "/about-us",
    },
    {
      image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=600&h=400&fit=crop",
      title: "Seattle Summer Cup",
      href: "/events",
    },
    {
      image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&h=400&fit=crop",
      title: "Grassroots Spirit",
      href: "/community-impact",
    },
    {
      image: "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600&h=400&fit=crop",
      title: "Celebration & Glory",
      href: "/gallery",
    },
  ];

  return (
    <div className="min-h-screen bg-white pt-24 overflow-x-hidden">
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
                  Founded in Seattle, The Arena was born out of neighborhood pickup
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
          className="mb-8"
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
      </div>

      {/* Community Section - Full Screen Width DriftWall */}
      <section className="w-full relative my-12 md:my-20 bg-[#060010] py-16 md:py-24 overflow-hidden border-y border-primary-900/40">
        <div className="max-w-6xl mx-auto px-6 text-center mb-10 md:mb-14">
          <motion.h2
            className="text-3xl md:text-5xl font-light text-white mb-6 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Our <span className="text-secondary-500">Community in Motion</span>
          </motion.h2>
          <motion.p
            className="text-base md:text-lg text-primary-300 leading-relaxed font-light max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Join thousands of players, teams, and sports enthusiasts who trust
            The Arena for their tournament needs. Together, we're building a
            vibrant community that celebrates competition, camaraderie, and
            the love of street soccer.
          </motion.p>
        </div>

        <div className="w-full h-[580px] md:h-[680px] relative overflow-hidden">
          <DriftWall
            items={communityMoments}
            columns={7}
            tileWidth={210}
            tileHeight={138}
            gap={20}
            tilt={16}
            turn={-14}
            perspective={1200}
            depth={120}
            speed={42}
            direction="up"
            variance={0.45}
            parallax={0.6}
            lift={64}
            fade={0.6}
            dim={0.55}
            overlayColor="#060010"
          />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
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
