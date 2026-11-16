import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoLocationOutline,
  IoCallOutline,
  IoMailOutline,
  IoTimeOutline,
  IoLogoFacebook,
  IoLogoTwitter,
  IoLogoLinkedin,
  IoLogoInstagram,
  IoCopyOutline,
  IoCheckmark,
  IoOpenOutline,
  IoChevronDown,
  IoHelpCircleOutline,
  IoCompassOutline,
} from "react-icons/io5";
import { FaTiktok, FaYoutube } from "react-icons/fa";
import { contactAPI } from "../../services/api";
import SpotlightCard from "../reactbits/SpotlightCard";
import TiltedCard from "../reactbits/TiltedCard";

const FAQ_ITEMS = [
  {
    q: "How quickly will our team receive a response?",
    a: "Our operations desk in Addis Ababa and Hawassa reviews submissions continuously and responds within 24 business hours. During weekend tournaments, live matchday communications take top priority.",
  },
  {
    q: "Can I register as a free agent without a full squad?",
    a: "Yes. Select 'Tournaments & Matches' or check our Events page. Free agents are paired with squads seeking extra players during pre-match check-in.",
  },
  {
    q: "Where do street soccer matches and tournaments take place?",
    a: "Our matches are held across curated turf grounds, community centers, and pop-up asphalt pitches throughout Addis Ababa and Hawassa, Ethiopia. Venue directions are published with each fixture schedule.",
  },
  {
    q: "How can brands or community non-profits partner with Arena?",
    a: "We collaborate with civic partners, local businesses, and youth organizations to build pop-up arenas and fund free youth soccer clinics. Message us under 'Sponsorship & Brands'.",
  },
];

const ContactInfo = () => {
  const [contactInfo, setContactInfo] = useState({
    address: "Addis Ababa & Hawassa, Ethiopia",
    phone: "",
    email: "",
    city: "Addis Ababa",
    state: "Addis Ababa",
    zipCode: "",
    country: "Ethiopia",
    hours: {
      weekdays: "Monday - Friday: 9:00 AM - 6:00 PM EAT",
      saturday: "Saturday: Match & Tournament Operations",
      sunday: "Sunday: Championship Rounds & Youth Clinics",
    },
    socialMedia: {
      facebook: "",
      twitter: "",
      linkedin: "",
      instagram: "",
      tiktok: "",
      youtube: "",
    },
  });

  const [copiedItem, setCopiedItem] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [ethiopiaTime, setEthiopiaTime] = useState("");

  // Live Ethiopia clock (East Africa Time - EAT)
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-US", {
          timeZone: "Africa/Addis_Ababa",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });
        setEthiopiaTime(timeStr);
      } catch (err) {
        setEthiopiaTime("");
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const data = await contactAPI.getInfo();
        if (data.contactInfo) {
          const rawAddress = data.contactInfo.address || "";
          const city = data.contactInfo.city && data.contactInfo.city !== "Seattle" ? data.contactInfo.city : "Addis Ababa";
          const state = data.contactInfo.state && data.contactInfo.state !== "WA" ? data.contactInfo.state : "Addis Ababa";

          let displayAddress = "";
          if (
            rawAddress &&
            rawAddress !== "United States" &&
            rawAddress !== "United States America" &&
            rawAddress !== "Seattle, WA"
          ) {
            displayAddress = rawAddress;
          } else {
            displayAddress = `${city} & Hawassa, Ethiopia`;
          }

          setContactInfo({
            address: displayAddress,
            phone: data.contactInfo.phone || "",
            email: data.contactInfo.email || "",
            city: city,
            state: state,
            zipCode: data.contactInfo.zipCode || "",
            country: data.contactInfo.country && data.contactInfo.country !== "USA" && data.contactInfo.country !== "United States" ? data.contactInfo.country : "Ethiopia",
            hours: {
              weekdays: "Monday - Friday: 9:00 AM - 6:00 PM EAT",
              saturday: "Saturday: Match & Tournament Operations",
              sunday: "Sunday: Championship Rounds & Youth Clinics",
            },
            socialMedia: {
              facebook: data.contactInfo.socialMedia?.facebook || "",
              twitter: data.contactInfo.socialMedia?.twitter || "",
              linkedin: data.contactInfo.socialMedia?.linkedin || "",
              instagram: data.contactInfo.socialMedia?.instagram || "",
              tiktok: data.contactInfo.socialMedia?.tiktok || "",
              youtube: data.contactInfo.socialMedia?.youtube || "",
            },
          });
        }
      } catch (error) {
        console.error("Error fetching contact info:", error);
      }
    };

    fetchContactInfo();
  }, []);

  const copyToClipboard = (text, type, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!text) return;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedItem(type);
      setTimeout(() => setCopiedItem(null), 2500);
    }
  };

  const channelCards = [
    {
      id: "email",
      icon: IoMailOutline,
      tag: "OFFICIAL DESK",
      title: "Direct Email",
      value: contactInfo.email || "hello@arenaia.com",
      actionLabel: "Write Email",
      actionHref: `mailto:${contactInfo.email || "hello@arenaia.com"}`,
      copyText: contactInfo.email || "hello@arenaia.com",
    },
    {
      id: "phone",
      icon: IoCallOutline,
      tag: "OPERATIONS HOTLINE",
      title: "Direct Phone",
      value: contactInfo.phone || "+251 91 123 4567",
      actionLabel: "Call Desk",
      actionHref: contactInfo.phone
        ? `tel:${contactInfo.phone.replace(/\s/g, "")}`
        : "tel:+251911234567",
      copyText: contactInfo.phone || "+251 91 123 4567",
    },
    {
      id: "address",
      icon: IoLocationOutline,
      tag: "MATCH HEADQUARTERS",
      title: "Addis Ababa & Hawassa Hub",
      value: contactInfo.address || "Addis Ababa & Hawassa, Ethiopia",
      actionLabel: "Directions",
      actionHref: `https://maps.google.com/?q=${encodeURIComponent(
        contactInfo.address || "Addis Ababa, Ethiopia"
      )}`,
      copyText: contactInfo.address || "Addis Ababa & Hawassa, Ethiopia",
      external: true,
    },
  ];

  const socialLinks = [
    {
      id: "instagram",
      label: "Instagram",
      icon: IoLogoInstagram,
      href: contactInfo.socialMedia.instagram,
      tag: "@arena_ethiopia",
      color: "hover:border-[#E1306C] hover:text-[#E1306C]",
    },
    {
      id: "tiktok",
      label: "TikTok",
      icon: FaTiktok,
      href: contactInfo.socialMedia.tiktok,
      tag: "@arenasoccer",
      color: "hover:border-neutral-900 hover:text-neutral-900",
    },
    {
      id: "youtube",
      label: "YouTube",
      icon: FaYoutube,
      href: contactInfo.socialMedia.youtube,
      tag: "Arena Street Soccer",
      color: "hover:border-red-600 hover:text-red-600",
    },
    {
      id: "twitter",
      label: "Twitter / X",
      icon: IoLogoTwitter,
      href: contactInfo.socialMedia.twitter,
      tag: "@arenasports",
      color: "hover:border-secondary-500 hover:text-secondary-500",
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      icon: IoLogoLinkedin,
      href: contactInfo.socialMedia.linkedin,
      tag: "Arena Community",
      color: "hover:border-[#0077b5] hover:text-[#0077b5]",
    },
    {
      id: "facebook",
      label: "Facebook",
      icon: IoLogoFacebook,
      href: contactInfo.socialMedia.facebook,
      tag: "Arena Sports",
      color: "hover:border-[#1877f2] hover:text-[#1877f2]",
    },
  ].filter((s) => s.href && s.href !== "#");

  const displaySocials =
    socialLinks.length > 0
      ? socialLinks
      : [
          {
            id: "instagram",
            label: "Instagram",
            icon: IoLogoInstagram,
            href: "https://instagram.com",
            tag: "@arena_ethiopia",
            color: "hover:border-[#E1306C] hover:text-[#E1306C]",
          },
          {
            id: "tiktok",
            label: "TikTok",
            icon: FaTiktok,
            href: "https://tiktok.com",
            tag: "@arenasoccer",
            color: "hover:border-neutral-900 hover:text-neutral-900",
          },
          {
            id: "youtube",
            label: "YouTube",
            icon: FaYoutube,
            href: "https://youtube.com",
            tag: "Arena Soccer",
            color: "hover:border-red-600 hover:text-red-600",
          },
        ];

  return (
    <div className="space-y-6">
      {/* Direct Channel Cards */}
      <div className="space-y-4">
        {channelCards.map((channel) => {
          const Icon = channel.icon;
          const isCopied = copiedItem === channel.id;

          return (
            <SpotlightCard
              key={channel.id}
              className="bg-white border border-neutral-200/90 rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_40px_rgba(254,87,35,0.08)] hover:border-secondary-500/50 transition-all duration-300"
              spotlightColor="rgba(254, 87, 35, 0.08)"
            >
              {/* Top row: Icon + Tag & Action Buttons */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-neutral-950 flex items-center justify-center flex-shrink-0 text-secondary-400 shadow-sm">
                    <Icon className="text-xl" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-secondary-600 font-bold block">
                      {channel.tag}
                    </span>
                    <span className="text-neutral-500 text-xs font-medium">
                      {channel.title}
                    </span>
                  </div>
                </div>

                {/* Action Buttons (Pill style) */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => copyToClipboard(channel.copyText, channel.id, e)}
                    className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-all duration-200 cursor-pointer flex items-center gap-1.5 text-xs font-mono font-medium border border-neutral-200"
                    title="Copy to clipboard"
                  >
                    {isCopied ? (
                      <>
                        <IoCheckmark className="text-secondary-600 text-sm font-bold" />
                        <span className="text-secondary-600 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <IoCopyOutline className="text-xs text-neutral-600" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <a
                    href={channel.actionHref}
                    target={channel.external ? "_blank" : undefined}
                    rel={channel.external ? "noopener noreferrer" : undefined}
                    className="px-3.5 py-1.5 rounded-full bg-neutral-950 hover:bg-secondary-500 text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 shadow-sm"
                  >
                    <span>{channel.actionLabel}</span>
                    <IoOpenOutline className="text-xs" />
                  </a>
                </div>
              </div>

              {/* Bottom row: Full Width Contact Value */}
              <div className="pt-2.5 border-t border-neutral-150">
                <p className="text-neutral-950 font-bold text-base sm:text-lg break-words select-all font-mono">
                  {channel.value}
                </p>
              </div>
            </SpotlightCard>
          );
        })}
      </div>

      {/* Program Schedule & Ethiopia Real-Time Clock */}
      <SpotlightCard
        className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_40px_rgba(254,87,35,0.08)] hover:border-secondary-500/50 transition-all duration-300"
        spotlightColor="rgba(254, 87, 35, 0.08)"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-150 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-950 flex items-center justify-center text-secondary-400">
              <IoTimeOutline className="text-xl" />
            </div>
            <div>
              <h3 className="text-neutral-950 font-bold text-base">
                Operational &amp; Support Hours
              </h3>
              <p className="text-neutral-500 text-xs font-mono">
                East Africa Time (Addis Ababa, EAT - UTC+3)
              </p>
            </div>
          </div>

          {/* Live Ethiopia Clock */}
          {ethiopiaTime && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-50 border border-secondary-200 text-secondary-700 text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary-500" />
              </span>
              <span className="tabular-nums font-bold">Addis Ababa: {ethiopiaTime}</span>
            </div>
          )}
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
            <span className="text-neutral-500 font-mono">Weekdays (Desk)</span>
            <span className="text-neutral-950 font-semibold">
              {contactInfo.hours.weekdays}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
            <span className="text-neutral-500 font-mono">Saturday (Matches)</span>
            <span className="text-secondary-600 font-bold">
              Tournament Kickoffs &amp; Field Desk
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-neutral-500 font-mono">Sunday (Finals)</span>
            <span className="text-secondary-600 font-bold">
              Championship Rounds &amp; Clinics
            </span>
          </div>
        </div>
      </SpotlightCard>

      {/* Community Channels */}
      <SpotlightCard
        className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_40px_rgba(254,87,35,0.08)] hover:border-secondary-500/50 transition-all duration-300"
        spotlightColor="rgba(254, 87, 35, 0.08)"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IoCompassOutline className="text-secondary-500 text-lg" />
            <h3 className="text-neutral-950 font-bold text-base tracking-tight">
              Community Channels
            </h3>
          </div>
          <span className="text-xs font-mono text-neutral-400 font-medium">
            @ArenaCommunity
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {displaySocials.map((social) => {
            const Icon = social.icon;
            return (
              <TiltedCard
                key={social.id}
                maxAngle={10}
                scale={1.02}
                className="block"
              >
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block p-3.5 rounded-2xl bg-neutral-50/70 hover:bg-white border border-neutral-200/90 hover:border-neutral-900 transition-all duration-300 text-neutral-700 group cursor-pointer shadow-sm ${social.color}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="text-xl group-hover:scale-110 transition-transform" />
                    <IoOpenOutline className="text-xs opacity-40 group-hover:opacity-100" />
                  </div>
                  <p className="text-xs font-bold text-neutral-950 group-hover:text-secondary-500 transition-colors">
                    {social.label}
                  </p>
                  <p className="text-[11px] font-mono text-neutral-500 truncate">
                    {social.tag}
                  </p>
                </a>
              </TiltedCard>
            );
          })}
        </div>
      </SpotlightCard>

      {/* Interactive FAQ Accordion */}
      <SpotlightCard
        className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_40px_rgba(254,87,35,0.08)] hover:border-secondary-500/50 transition-all duration-300"
        spotlightColor="rgba(254, 87, 35, 0.08)"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <IoHelpCircleOutline className="text-xl text-secondary-500" />
          <h3 className="text-neutral-950 font-bold text-base">
            Frequently Asked Inquiries
          </h3>
        </div>

        <div className="space-y-2.5">
          {FAQ_ITEMS.map((faq, index) => {
            const isExpanded = expandedFaq === index;

            return (
              <div
                key={index}
                className="rounded-2xl border border-neutral-200 bg-neutral-50/60 overflow-hidden transition-colors duration-200"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedFaq(isExpanded ? null : index)
                  }
                  className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 text-neutral-900 font-semibold text-xs sm:text-sm hover:text-secondary-600 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <IoChevronDown
                    className={`text-base text-secondary-500 flex-shrink-0 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <div className="px-4 pb-3.5 text-xs text-neutral-600 leading-relaxed border-t border-neutral-200/80 pt-2 font-normal">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </SpotlightCard>
    </div>
  );
};

export default ContactInfo;
