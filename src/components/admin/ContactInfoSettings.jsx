import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IoMail,
  IoCall,
  IoLocation,
  IoGlobe,
  IoLogoFacebook,
  IoLogoTwitter,
  IoLogoInstagram,
} from "react-icons/io5";
import { FaTiktok, FaYoutube } from "react-icons/fa";
import { adminAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";

const ContactInfoSettings = ({ onSave }) => {
  const { showSuccess, showError } = useNotification();
  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    website: "",
    socialPageEnabled: true,
    shopPageEnabled: true,
    socialMedia: {
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
      tiktok: "",
      youtube: "",
    },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const data = await adminAPI.getContactInfo();
      if (data.contactInfo) {
        setContactInfo((prev) => ({
          ...prev,
          ...data.contactInfo,
          socialPageEnabled:
            typeof data.contactInfo.socialPageEnabled === "boolean"
              ? data.contactInfo.socialPageEnabled
              : true,
          shopPageEnabled:
            typeof data.contactInfo.shopPageEnabled === "boolean"
              ? data.contactInfo.shopPageEnabled
              : true,
          socialMedia: {
            ...prev.socialMedia,
            ...(data.contactInfo.socialMedia || {}),
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching contact info:", error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.saveContactInfo(contactInfo);
      await onSave?.(contactInfo);
      showSuccess("Contact information saved successfully");
    } catch (error) {
      showError(error.message || "Failed to save contact information");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="bg-white border-2 border-primary-200 rounded-3xl p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-3xl font-bold text-secondary-600 mb-6">
        Contact Information
      </h2>
      <p className="text-primary-700 mb-6">
        Manage your organization's contact details and social media links.
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-primary-800 mb-2">
            <IoMail className="inline mr-2" />
            Email Address
          </label>
          <input
            type="email"
            value={contactInfo.email}
            onChange={(e) =>
              setContactInfo({ ...contactInfo, email: e.target.value })
            }
            placeholder="contact@example.com"
            className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-primary-800 mb-2">
            <IoCall className="inline mr-2" />
            Phone Number
          </label>
          <input
            type="tel"
            value={contactInfo.phone}
            onChange={(e) =>
              setContactInfo({ ...contactInfo, phone: e.target.value })
            }
            placeholder="+1 (555) 123-4567"
            className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-semibold text-primary-800 mb-2">
            <IoLocation className="inline mr-2" />
            Street Address
          </label>
          <input
            type="text"
            value={contactInfo.address}
            onChange={(e) =>
              setContactInfo({ ...contactInfo, address: e.target.value })
            }
            placeholder="123 Main Street"
            className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
          />
        </div>

        {/* City, State, Zip */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-primary-800 mb-2">
              City
            </label>
            <input
              type="text"
              value={contactInfo.city}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, city: e.target.value })
              }
              placeholder="City"
              className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary-800 mb-2">
              State/Province
            </label>
            <input
              type="text"
              value={contactInfo.state}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, state: e.target.value })
              }
              placeholder="State"
              className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary-800 mb-2">
              ZIP/Postal Code
            </label>
            <input
              type="text"
              value={contactInfo.zipCode}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, zipCode: e.target.value })
              }
              placeholder="12345"
              className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
            />
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-semibold text-primary-800 mb-2">
            Country
          </label>
          <input
            type="text"
            value={contactInfo.country}
            onChange={(e) =>
              setContactInfo({ ...contactInfo, country: e.target.value })
            }
            placeholder="United States"
            className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-semibold text-primary-800 mb-2">
            <IoGlobe className="inline mr-2" />
            Website
          </label>
          <input
            type="url"
            value={contactInfo.website}
            onChange={(e) =>
              setContactInfo({ ...contactInfo, website: e.target.value })
            }
            placeholder="https://example.com"
            className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
          />
        </div>

        {/* Social Page Toggle */}
        <div className="flex items-center justify-between gap-4 border-2 border-primary-100 rounded-2xl px-4 py-3 bg-primary-50/40">
          <div>
            <p className="text-sm font-semibold text-primary-900">
              Social page in menu & footer
            </p>
            <p className="text-xs text-primary-600">
              Turn this off to hide the Social page link in the site navigation
              and footer, and disable the public Social hub page.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={!!contactInfo.socialPageEnabled}
              onChange={(e) =>
                setContactInfo({
                  ...contactInfo,
                  socialPageEnabled: e.target.checked,
                })
              }
            />
            <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-tertiary-500 rounded-full peer peer-checked:bg-secondary-500 transition-colors">
              <div className="absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow transform transition-transform peer-checked:translate-x-5" />
            </div>
          </label>
        </div>

        {/* Shop Page Toggle */}
        <div className="flex items-center justify-between gap-4 border-2 border-primary-100 rounded-2xl px-4 py-3 bg-primary-50/40">
          <div>
            <p className="text-sm font-semibold text-primary-900">
              Shop page in menu & footer
            </p>
            <p className="text-xs text-primary-600">
              Turn this off to hide the Shop link, cart icon, homepage shop
              section, and disable public shop, product, and cart pages.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={!!contactInfo.shopPageEnabled}
              onChange={(e) =>
                setContactInfo({
                  ...contactInfo,
                  shopPageEnabled: e.target.checked,
                })
              }
            />
            <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-tertiary-500 rounded-full peer peer-checked:bg-secondary-500 transition-colors">
              <div className="absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow transform transition-transform peer-checked:translate-x-5" />
            </div>
          </label>
        </div>

        {/* Social Media */}
        <div>
          <label className="block text-sm font-semibold text-primary-800 mb-4">
            Social Media Links
          </label>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <IoLogoFacebook className="text-2xl text-blue-600" />
              <input
                type="url"
                value={contactInfo.socialMedia.facebook}
                onChange={(e) =>
                  setContactInfo({
                    ...contactInfo,
                    socialMedia: {
                      ...contactInfo.socialMedia,
                      facebook: e.target.value,
                    },
                  })
                }
                placeholder="https://facebook.com/yourpage"
                className="flex-1 px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <IoLogoTwitter className="text-2xl text-blue-400" />
              <input
                type="url"
                value={contactInfo.socialMedia.twitter}
                onChange={(e) =>
                  setContactInfo({
                    ...contactInfo,
                    socialMedia: {
                      ...contactInfo.socialMedia,
                      twitter: e.target.value,
                    },
                  })
                }
                placeholder="https://twitter.com/yourhandle"
                className="flex-1 px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <IoLogoInstagram className="text-2xl text-pink-600" />
              <input
                type="url"
                value={contactInfo.socialMedia.instagram}
                onChange={(e) =>
                  setContactInfo({
                    ...contactInfo,
                    socialMedia: {
                      ...contactInfo.socialMedia,
                      instagram: e.target.value,
                    },
                  })
                }
                placeholder="https://instagram.com/yourhandle"
                className="flex-1 px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <FaTiktok className="text-2xl text-primary-900" />
              <input
                type="url"
                value={contactInfo.socialMedia.tiktok}
                onChange={(e) =>
                  setContactInfo({
                    ...contactInfo,
                    socialMedia: {
                      ...contactInfo.socialMedia,
                      tiktok: e.target.value,
                    },
                  })
                }
                placeholder="https://www.tiktok.com/@yourhandle"
                className="flex-1 px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <FaYoutube className="text-2xl text-red-600" />
              <input
                type="url"
                value={contactInfo.socialMedia.youtube}
                onChange={(e) =>
                  setContactInfo({
                    ...contactInfo,
                    socialMedia: {
                      ...contactInfo.socialMedia,
                      youtube: e.target.value,
                    },
                  })
                }
                placeholder="https://www.youtube.com/@yourchannel"
                className="flex-1 px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-secondary-500 text-white font-semibold rounded-lg hover:bg-secondary-600 transition-colors disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Contact Information"}
        </button>
      </form>
    </motion.div>
  );
};

export default ContactInfoSettings;
