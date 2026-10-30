import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IoLocationOutline,
  IoCallOutline,
  IoMailOutline,
  IoArrowForward,
} from "react-icons/io5";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import logo2 from "../../public/logo.png";
import { contactAPI } from "../services/api";

const MARQUEE_WORDS = [
  "Street Soccer",
  "Seattle",
  "Community",
  "Tournaments",
  "Youth Development",
  "Impact",
  "Fair Play",
  "Kick It",
];

const Footer = () => {
  const [contactInfo, setContactInfo] = useState({
    address: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    socialPageEnabled: true,
    shopPageEnabled: true,
    socialMedia: {
      facebook: "#",
      twitter: "#",
      instagram: "#",
      linkedin: "#",
      tiktok: "#",
      youtube: "#",
    },
  });

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const data = await contactAPI.getInfo();
        if (data.contactInfo) {
          const addressParts = [
            data.contactInfo.address,
            data.contactInfo.city,
            data.contactInfo.state,
            data.contactInfo.zipCode,
            data.contactInfo.country,
          ].filter(Boolean);

          setContactInfo((prev) => ({
            ...prev,
            address:
              addressParts.length > 0
                ? addressParts.join(", ")
                : data.contactInfo.address || "",
            phone: data.contactInfo.phone || "",
            email: data.contactInfo.email || "",
            city: data.contactInfo.city || "",
            state: data.contactInfo.state || "",
            zipCode: data.contactInfo.zipCode || "",
            country: data.contactInfo.country || "",
            socialPageEnabled:
              typeof data.contactInfo.socialPageEnabled === "boolean"
                ? data.contactInfo.socialPageEnabled
                : true,
            shopPageEnabled:
              typeof data.contactInfo.shopPageEnabled === "boolean"
                ? data.contactInfo.shopPageEnabled
                : true,
            socialMedia: {
              facebook: data.contactInfo.socialMedia?.facebook || "#",
              twitter: data.contactInfo.socialMedia?.twitter || "#",
              instagram: data.contactInfo.socialMedia?.instagram || "#",
              linkedin: data.contactInfo.socialMedia?.linkedin || "#",
              tiktok: data.contactInfo.socialMedia?.tiktok || "#",
              youtube: data.contactInfo.socialMedia?.youtube || "#",
            },
          }));
        }
      } catch (error) {
        console.error("Error fetching contact info:", error);
      }
    };

    fetchContactInfo();
  }, []);

  const exploreLinks = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about-us" },
    { label: "Events", href: "/events" },
    { label: "Community Impact", href: "/community-impact" },
  ];

  const moreLinks = [
    ...(contactInfo.shopPageEnabled ? [{ label: "Shop", href: "/shop" }] : []),
    { label: "Gallery", href: "/gallery" },
    ...(contactInfo.socialPageEnabled
      ? [{ label: "Social", href: "/social" }]
      : []),
    { label: "Contact", href: "/contact" },
  ];

  const socialLinks = [
    {
      key: "facebook",
      href: contactInfo.socialMedia.facebook,
      icon: FaFacebookF,
      label: "Facebook",
    },
    {
      key: "twitter",
      href: contactInfo.socialMedia.twitter,
      icon: FaTwitter,
      label: "Twitter",
    },
    {
      key: "instagram",
      href: contactInfo.socialMedia.instagram,
      icon: FaInstagram,
      label: "Instagram",
    },
    {
      key: "tiktok",
      href: contactInfo.socialMedia.tiktok,
      icon: FaTiktok,
      label: "TikTok",
    },
    {
      key: "youtube",
      href: contactInfo.socialMedia.youtube,
      icon: FaYoutube,
      label: "YouTube",
    },
    {
      key: "linkedin",
      href: contactInfo.socialMedia.linkedin,
      icon: FaLinkedinIn,
      label: "LinkedIn",
    },
  ].filter((s) => s.href && s.href !== "#");

  const marqueeItems = [...MARQUEE_WORDS, ...MARQUEE_WORDS];

  return (
    <footer className="relative overflow-hidden bg-primary-950 text-primary-50">
      {/* Pitch atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(90deg, transparent 0%, transparent 48%, #fff 48%, #fff 52%, transparent 52%),
            linear-gradient(0deg, transparent 0%, transparent 48%, #fff 48%, #fff 52%, transparent 52%),
            radial-gradient(ellipse 80% 50% at 50% 100%, #fe5723 0%, transparent 55%)
          `,
          backgroundSize: "120px 120px, 120px 120px, 100% 100%",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-secondary-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-secondary-600/10 blur-3xl"
        aria-hidden
      />

      {/* Marquee ribbon */}
      <div className="relative border-b border-white/10 bg-secondary-500 overflow-hidden">
        <div className="flex w-max animate-marquee whitespace-nowrap py-3">
          {marqueeItems.map((word, i) => (
            <span
              key={`${word}-${i}`}
              className="inline-flex items-center gap-4 px-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary-950"
            >
              {word}
              <span className="h-1.5 w-1.5 rounded-full bg-primary-950/40" />
            </span>
          ))}
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-14 md:pt-20 pb-10">
        {/* Brand close */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-14 md:mb-20"
        >
          <p className="text-secondary-400 text-xs sm:text-sm font-medium uppercase tracking-[0.35em] mb-4">
            The final whistle is never the end
          </p>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight max-w-3xl">
              Ready to{" "}
              <span className="text-secondary-500 italic font-semibold">
                Kick It
              </span>
              ?
            </h2>
            <Link
              to="/events"
              className="group inline-flex items-center gap-3 self-start lg:self-auto bg-secondary-500 text-primary-950 font-semibold px-7 py-3.5 rounded-xl transition-all duration-300 hover:bg-secondary-400 hover:scale-[1.02] hover:shadow-[0_12px_40px_-12px_rgba(254,87,35,0.55)]"
            >
              Find a tournament
              <IoArrowForward className="text-lg transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>

        {/* Divider pitch line */}
        <div className="relative mb-12 md:mb-16 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent">
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rotate-45 border border-secondary-500 bg-primary-950" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 lg:gap-12">
          {/* Brand + contact */}
          <div className="md:col-span-5 space-y-6">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <img
                src={logo2}
                alt="Les Kick't"
                className="w-16 h-auto transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                style={{
                  filter:
                    "drop-shadow(0 0 14px #fe572366) brightness(1.08) saturate(1.1)",
                }}
              />
              <div>
                <span className="block text-xl font-bold tracking-tight">
                  Les Kick&apos;t
                </span>
                <span className="block text-xs text-primary-400 tracking-wide">
                  Seattle community soccer
                </span>
              </div>
            </Link>

            <p className="text-primary-400 text-sm leading-relaxed max-w-sm">
              Competitive street soccer, youth development, and community impact
              across Greater Seattle — built on the pitch, for the people.
            </p>

            <ul className="space-y-3 text-sm">
              {contactInfo.address && (
                <li className="flex items-start gap-3 text-primary-300">
                  <IoLocationOutline className="text-secondary-500 text-lg mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{contactInfo.address}</span>
                </li>
              )}
              {contactInfo.phone && (
                <li>
                  <a
                    href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-3 text-primary-300 hover:text-secondary-400 transition-colors"
                  >
                    <IoCallOutline className="text-secondary-500 text-lg shrink-0" />
                    {contactInfo.phone}
                  </a>
                </li>
              )}
              {contactInfo.email && (
                <li>
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="flex items-center gap-3 text-primary-300 hover:text-secondary-400 transition-colors"
                  >
                    <IoMailOutline className="text-secondary-500 text-lg shrink-0" />
                    {contactInfo.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Explore */}
          <div className="md:col-span-2">
            <h3 className="text-secondary-500 text-xs font-semibold uppercase tracking-[0.2em] mb-5">
              Explore
            </h3>
            <ul className="space-y-3">
              {exploreLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="group relative inline-block text-sm text-primary-200 hover:text-white transition-colors"
                  >
                    {item.label}
                    <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-secondary-500 transition-all duration-300 group-hover:w-full" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More */}
          <div className="md:col-span-2">
            <h3 className="text-secondary-500 text-xs font-semibold uppercase tracking-[0.2em] mb-5">
              More
            </h3>
            <ul className="space-y-3">
              {moreLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="group relative inline-block text-sm text-primary-200 hover:text-white transition-colors"
                  >
                    {item.label}
                    <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-secondary-500 transition-all duration-300 group-hover:w-full" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div className="md:col-span-3">
            <h3 className="text-secondary-500 text-xs font-semibold uppercase tracking-[0.2em] mb-5">
              Stay in the game
            </h3>
            <p className="text-sm text-primary-400 mb-5 leading-relaxed">
              Questions, partnerships, or just want to lace up — we&apos;re one
              message away.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-sm font-semibold text-secondary-400 hover:text-secondary-300 transition-colors mb-6"
            >
              Contact us
              <IoArrowForward className="transition-transform group-hover:translate-x-1" />
            </Link>

            {socialLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-2.5">
                {socialLinks.map(({ key, href, icon: Icon, label }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-primary-300 transition-all duration-300 hover:border-secondary-500 hover:bg-secondary-500 hover:text-primary-950 hover:-translate-y-0.5"
                  >
                    <Icon className="text-sm" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 md:mt-16 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-primary-500">
          <p>
            © {new Date().getFullYear()} Les Kick&apos;t. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/terms"
              className="hover:text-secondary-400 transition-colors"
            >
              Terms &amp; Conditions
            </Link>
            <Link
              to="/privacy"
              className="hover:text-secondary-400 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
