import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IoLocationOutline,
  IoCallOutline,
  IoMailOutline,
  IoTimeOutline,
  IoLogoFacebook,
  IoLogoTwitter,
  IoLogoLinkedin,
  IoLogoInstagram,
} from "react-icons/io5";
import { FaTiktok, FaYoutube } from "react-icons/fa";
import { contactAPI } from "../../services/api";

const ContactInfo = () => {
  const [contactInfo, setContactInfo] = useState({
    address: "Seattle, WA",
    phone: "",
    email: "",
    city: "Seattle",
    state: "WA",
    zipCode: "",
    country: "USA",
    hours: {
      weekdays: "Monday - Friday: 9:00 AM - 6:00 PM (Inquiries)",
      saturday: "Saturday: Match & Tournament Operations",
      sunday: "Sunday: Match & Tournament Operations",
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

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const data = await contactAPI.getInfo();
        if (data.contactInfo) {
          // Build full address from components
          const addressParts = [
            data.contactInfo.address,
            data.contactInfo.city,
            data.contactInfo.state,
            data.contactInfo.zipCode,
            data.contactInfo.country,
          ].filter(Boolean);
          
          const fullAddress = addressParts.length > 0 
            ? addressParts.join(", ") 
            : data.contactInfo.address || "";
          const displayAddress = (!fullAddress || fullAddress === "United States America")
            ? "Seattle, WA"
            : fullAddress;
          
          setContactInfo({
            address: displayAddress,
            phone: data.contactInfo.phone || "",
            email: data.contactInfo.email || "",
            city: data.contactInfo.city || "Seattle",
            state: data.contactInfo.state || "WA",
            zipCode: data.contactInfo.zipCode || "",
            country: data.contactInfo.country || "USA",
            hours: {
              weekdays: "Monday - Friday: 9:00 AM - 6:00 PM (Inquiries)",
              saturday: "Saturday: Match & Tournament Operations",
              sunday: "Sunday: Match & Tournament Operations",
            },
            socialMedia: {
              facebook: data.contactInfo.socialMedia?.facebook || "#",
              twitter: data.contactInfo.socialMedia?.twitter || "#",
              linkedin: data.contactInfo.socialMedia?.linkedin || "#",
              instagram: data.contactInfo.socialMedia?.instagram || "#",
              tiktok: data.contactInfo.socialMedia?.tiktok || "#",
              youtube: data.contactInfo.socialMedia?.youtube || "#",
            },
          });
        }
      } catch (error) {
        console.error("Error fetching contact info:", error);
      }
    };

    fetchContactInfo();
  }, []);

  const contactItems = [
    {
      icon: IoLocationOutline,
      label: "Address",
      value: contactInfo.address || "Address not set",
      link: contactInfo.address 
        ? `https://maps.google.com/?q=${encodeURIComponent(contactInfo.address)}`
        : "#",
      color: "from-secondary-500 to-secondary-400",
    },
    {
      icon: IoCallOutline,
      label: "Phone",
      value: contactInfo.phone || "Phone not set",
      link: contactInfo.phone ? `tel:${contactInfo.phone.replace(/\s/g, "")}` : "#",
      color: "from-secondary-600 to-secondary-500",
    },
    {
      icon: IoMailOutline,
      label: "Email",
      value: contactInfo.email || "Email not set",
      link: contactInfo.email ? `mailto:${contactInfo.email}` : "#",
      color: "from-secondary-700 to-secondary-600",
    },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Contact Information Cards */}
      <div className="space-y-4">
        {contactItems.map((item, index) => {
          const Icon = item.icon;
          const Component = item.link !== "#" ? motion.a : motion.div;
          const componentProps = item.link !== "#" 
            ? {
                href: item.link,
                target: item.link.startsWith("http") ? "_blank" : undefined,
                rel: item.link.startsWith("http") ? "noopener noreferrer" : undefined,
              }
            : {};
          
          return (
            <Component
              key={index}
              className="block bg-white border-2 border-primary-200 rounded-2xl p-6 hover:border-secondary-400 hover:shadow-lg transition-all group"
              whileHover={item.link !== "#" ? { scale: 1.02 } : {}}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              {...componentProps}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="text-2xl text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary-600 mb-1 uppercase tracking-wide">
                    {item.label}
                  </p>
                  <p className="text-primary-950 font-medium break-words group-hover:text-secondary-600 transition-colors">
                    {item.value}
                  </p>
                </div>
              </div>
            </Component>
          );
        })}
      </div>

      {/* Business Hours */}
      <motion.div
        className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-400 flex items-center justify-center">
            <IoTimeOutline className="text-2xl text-primary-50" />
          </div>
          <h3 className="text-2xl font-black text-secondary-600">
            Program &amp; Support Hours
          </h3>
        </div>
        <div className="space-y-3 text-primary-700">
          <div className="flex items-center justify-between py-2 border-b border-primary-200 last:border-0">
            <span className="font-medium">Weekdays</span>
            <span className="text-primary-600">
              {contactInfo.hours.weekdays}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-primary-200 last:border-0">
            <span className="font-medium">Saturday</span>
            <span className="text-primary-600">
              {contactInfo.hours.saturday}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Sunday</span>
            <span className="text-secondary-600">
              {contactInfo.hours.sunday}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Social Media */}
      <motion.div
        className="bg-white border-2 border-primary-200 rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        {(() => {
          const socialLinks = [
            {
              icon: IoLogoFacebook,
              href: contactInfo.socialMedia.facebook,
              label: "Facebook",
              bgColor: "bg-secondary-500",
              hoverColor: "hover:bg-secondary-600",
            },
            {
              icon: IoLogoTwitter,
              href: contactInfo.socialMedia.twitter,
              label: "Twitter",
              bgColor: "bg-secondary-600",
              hoverColor: "hover:bg-secondary-700",
            },
            {
              icon: IoLogoLinkedin,
              href: contactInfo.socialMedia.linkedin,
              label: "LinkedIn",
              bgColor: "bg-secondary-700",
              hoverColor: "hover:bg-secondary-800",
            },
            {
              icon: IoLogoInstagram,
              href: contactInfo.socialMedia.instagram,
              label: "Instagram",
              bgColor: "bg-secondary-500",
              hoverColor: "hover:bg-secondary-600",
            },
            {
              icon: FaTiktok,
              href: contactInfo.socialMedia.tiktok,
              label: "TikTok",
              bgColor: "bg-primary-950",
              hoverColor: "hover:bg-primary-800",
            },
            {
              icon: FaYoutube,
              href: contactInfo.socialMedia.youtube,
              label: "YouTube",
              bgColor: "bg-red-600",
              hoverColor: "hover:bg-red-700",
            },
          ].filter((social) => social.href && social.href !== "#");

          if (socialLinks.length === 0) return null;

          return (
            <>
              <h3 className="text-xl font-black text-secondary-600 mb-4">
                Follow Us
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-12 h-12 rounded-xl ${social.bgColor} ${social.hoverColor} flex items-center justify-center text-white transition-all shadow-md hover:shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={social.label}
                    >
                      <Icon className="text-xl" />
                    </motion.a>
                  );
                })}
              </div>
            </>
          );
        })()}
      </motion.div>
    </motion.div>
  );
};

export default ContactInfo;
