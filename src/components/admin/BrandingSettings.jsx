import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IoImage, IoColorPalette, IoText } from "react-icons/io5";
import { adminAPI, mediaAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";
import { absoluteMediaSrc } from "../../utils/mediaUtils";

const BrandingSettings = ({ onSave }) => {
  const { showSuccess, showError } = useNotification();
  const [branding, setBranding] = useState({
    siteName: "",
    logo: "",
    primaryColor: "#1a1a2e",
    secondaryColor: "#16213e",
    tertiaryColor: "#0f3460",
    favicon: "",
    tagline: "",
  });
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const data = await adminAPI.getBranding();
      if (data.branding) {
        setBranding(data.branding);
        if (data.branding.logo) {
          setLogoPreview(absoluteMediaSrc(data.branding.logo) || data.branding.logo);
        }
      }
    } catch (error) {
      console.error("Error fetching branding:", error);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please upload a valid image file");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("Image is too large. Maximum size is 5MB");
      e.target.value = "";
      return;
    }

    try {
      setUploadingLogo(true);
      const result = await mediaAPI.uploadImage(file);
      if (!result?.url) {
        throw new Error("Upload succeeded but no URL was returned.");
      }
      setLogoPreview(absoluteMediaSrc(result.url) || result.url);
      setBranding((prev) => ({ ...prev, logo: result.url }));
      showSuccess("Logo uploaded to server");
    } catch (error) {
      console.error("Error uploading logo:", error);
      showError(error.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.saveBranding(branding);
      await onSave?.(branding);
      showSuccess("Branding settings saved successfully");
    } catch (error) {
      showError(error.message || "Failed to save branding settings");
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
        Branding Settings
      </h2>
      <p className="text-primary-700 mb-6">
        Customize your site's appearance, logo, colors, and branding.
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Site Name */}
        <div>
          <label className="block text-sm font-semibold text-primary-800 mb-2">
            <IoText className="inline mr-2" />
            Site Name
          </label>
          <input
            type="text"
            value={branding.siteName}
            onChange={(e) =>
              setBranding({ ...branding, siteName: e.target.value })
            }
            placeholder="Your Site Name"
            className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
          />
        </div>

        {/* Tagline */}
        <div>
          <label className="block text-sm font-semibold text-primary-800 mb-2">
            Tagline
          </label>
          <input
            type="text"
            value={branding.tagline}
            onChange={(e) =>
              setBranding({ ...branding, tagline: e.target.value })
            }
            placeholder="Your site tagline or slogan"
            className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
          />
        </div>

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-semibold text-primary-800 mb-2">
            <IoImage className="inline mr-2" />
            Logo
          </label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              disabled={uploadingLogo || saving}
              className="flex-1 px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
            />
            {logoPreview && (
              <div className="w-24 h-24 border-2 border-primary-200 rounded-lg overflow-hidden">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Favicon */}
        <div>
          <label className="block text-sm font-semibold text-primary-800 mb-2">
            Favicon URL
          </label>
          <input
            type="text"
            value={branding.favicon}
            onChange={(e) =>
              setBranding({ ...branding, favicon: e.target.value })
            }
            placeholder="https://example.com/favicon.ico"
            className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
          />
        </div>

        {/* Color Scheme */}
        <div>
          <label className="block text-sm font-semibold text-primary-800 mb-2">
            <IoColorPalette className="inline mr-2" />
            Color Scheme
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-primary-600 mb-2">
                Primary Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) =>
                    setBranding({ ...branding, primaryColor: e.target.value })
                  }
                  className="w-16 h-12 border-2 border-primary-200 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) =>
                    setBranding({ ...branding, primaryColor: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-primary-600 mb-2">
                Secondary Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.secondaryColor}
                  onChange={(e) =>
                    setBranding({
                      ...branding,
                      secondaryColor: e.target.value,
                    })
                  }
                  className="w-16 h-12 border-2 border-primary-200 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={branding.secondaryColor}
                  onChange={(e) =>
                    setBranding({
                      ...branding,
                      secondaryColor: e.target.value,
                    })
                  }
                  className="flex-1 px-3 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-primary-600 mb-2">
                Tertiary Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.tertiaryColor}
                  onChange={(e) =>
                    setBranding({
                      ...branding,
                      tertiaryColor: e.target.value,
                    })
                  }
                  className="w-16 h-12 border-2 border-primary-200 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={branding.tertiaryColor}
                  onChange={(e) =>
                    setBranding({
                      ...branding,
                      tertiaryColor: e.target.value,
                    })
                  }
                  className="flex-1 px-3 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-secondary-500 text-white font-semibold rounded-lg hover:bg-secondary-600 transition-colors disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Branding Settings"}
        </button>
      </form>
    </motion.div>
  );
};

export default BrandingSettings;
