import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IoImage,
  IoColorPalette,
  IoText,
  IoCheckmark,
  IoSparkles,
  IoRefreshOutline,
  IoEyeOutline,
} from "react-icons/io5";
import { adminAPI, mediaAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";
import { useTheme } from "../../context/ThemeContext";
import { absoluteMediaSrc } from "../../utils/mediaUtils";

const BrandingSettings = ({ onSave }) => {
  const { showSuccess, showError } = useNotification();
  const {
    activeColor,
    activePresetId,
    presets,
    applyColor,
    resetToDefault,
  } = useTheme();

  const [branding, setBranding] = useState({
    siteName: "The Arena",
    logo: "",
    primaryColor: "#000000",
    secondaryColor: activeColor || "#fe5723",
    tertiaryColor: "#fb6f00",
    colorPreset: activePresetId || "orange",
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
      if (data?.branding) {
        setBranding((prev) => ({
          ...prev,
          ...data.branding,
          secondaryColor: data.branding.secondaryColor || activeColor || "#fe5723",
          colorPreset: data.branding.colorPreset || activePresetId || "orange",
        }));
        if (data.branding.logo) {
          setLogoPreview(
            absoluteMediaSrc(data.branding.logo) || data.branding.logo
          );
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

  const handleSelectPreset = (preset) => {
    setBranding((prev) => ({
      ...prev,
      secondaryColor: preset.primaryHex,
      colorPreset: preset.id,
    }));
    applyColor(preset.primaryHex, preset.id);
  };

  const handleColorChange = (hex) => {
    setBranding((prev) => ({
      ...prev,
      secondaryColor: hex,
      colorPreset: "custom",
    }));
    if (/^#[0-9A-Fa-f]{6}$/.test(hex) || /^#[0-9A-Fa-f]{3}$/.test(hex)) {
      applyColor(hex, "custom");
    }
  };

  const handleResetColors = () => {
    resetToDefault();
    setBranding((prev) => ({
      ...prev,
      secondaryColor: "#fe5723",
      colorPreset: "orange",
    }));
    showSuccess("Reverted to Arena Flame Orange");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.saveBranding(branding);
      applyColor(branding.secondaryColor, branding.colorPreset);
      await onSave?.(branding);
      showSuccess("Branding settings and theme colors saved successfully");
    } catch (error) {
      showError(error.message || "Failed to save branding settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="bg-white dark:bg-primary-900 border-2 border-primary-200 dark:border-primary-800 rounded-3xl p-6 sm:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-primary-100 dark:border-primary-800">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-950 dark:text-white flex items-center gap-3">
            <IoColorPalette className="text-secondary-500" />
            Branding & Color Theme
          </h2>
          <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
            Customize the site appearance, brand colors, logo, and identity in real time.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetColors}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-primary-200 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-800 text-primary-700 dark:text-primary-300 transition-colors cursor-pointer"
        >
          <IoRefreshOutline className="w-4 h-4" />
          <span>Reset Default Color</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Color Theme Selector Section */}
        <div className="p-5 sm:p-6 rounded-2xl bg-primary-50/70 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-primary-900 dark:text-white flex items-center gap-2">
              <IoSparkles className="text-secondary-500 w-5 h-5" />
              Theme Accent Palette
            </h3>
            <span className="text-xs font-medium text-primary-500">
              Live updates applied immediately
            </span>
          </div>

          {/* Preset Buttons Grid */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-primary-500 dark:text-primary-400 mb-3">
              Curated Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {presets.map((preset) => {
                const isSelected =
                  branding.colorPreset === preset.id ||
                  branding.secondaryColor.toLowerCase() ===
                    preset.primaryHex.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-secondary-500 bg-white dark:bg-primary-900 shadow-md ring-2 ring-secondary-500/20"
                        : "border-primary-200 dark:border-primary-800 bg-white/70 dark:bg-primary-900/40 hover:border-primary-400 dark:hover:border-primary-700"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex-shrink-0 shadow-xs flex items-center justify-center text-white"
                      style={{ backgroundColor: preset.primaryHex }}
                    >
                      {isSelected && <IoCheckmark className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-primary-900 dark:text-white truncate">
                        {preset.name}
                      </p>
                      <p className="text-[10px] text-primary-500 truncate">
                        {preset.primaryHex}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-primary-200 dark:border-primary-800">
            <div>
              <label className="block text-xs font-bold text-primary-800 dark:text-primary-200 mb-2">
                Brand Accent (Secondary Color)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={
                    branding.secondaryColor.startsWith("#")
                      ? branding.secondaryColor
                      : `#${branding.secondaryColor}`
                  }
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-12 h-10 rounded-xl border border-primary-300 dark:border-primary-700 cursor-pointer overflow-hidden bg-white p-0.5"
                />
                <input
                  type="text"
                  value={branding.secondaryColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="#fe5723"
                  className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-950 text-primary-900 dark:text-white outline-none focus:border-secondary-500"
                />
              </div>
              <p className="text-[11px] text-primary-500 mt-1">
                Controls all buttons, highlights, badges, and active states.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-primary-800 dark:text-primary-200 mb-2">
                Subtle Accent (Tertiary Color)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={
                    branding.tertiaryColor?.startsWith("#")
                      ? branding.tertiaryColor
                      : "#fb6f00"
                  }
                  onChange={(e) =>
                    setBranding({ ...branding, tertiaryColor: e.target.value })
                  }
                  className="w-12 h-10 rounded-xl border border-primary-300 dark:border-primary-700 cursor-pointer overflow-hidden bg-white p-0.5"
                />
                <input
                  type="text"
                  value={branding.tertiaryColor || "#fb6f00"}
                  onChange={(e) =>
                    setBranding({ ...branding, tertiaryColor: e.target.value })
                  }
                  placeholder="#fb6f00"
                  className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-950 text-primary-900 dark:text-white outline-none focus:border-secondary-500"
                />
              </div>
              <p className="text-[11px] text-primary-500 mt-1">
                Used for secondary accents and subtle gradient stops.
              </p>
            </div>
          </div>

          {/* Interactive Live Component Preview */}
          <div className="pt-4 border-t border-primary-200 dark:border-primary-800">
            <div className="flex items-center gap-2 mb-3">
              <IoEyeOutline className="text-secondary-500" />
              <label className="text-xs font-bold uppercase tracking-wider text-primary-500 dark:text-primary-400">
                Live Interactive UI Preview
              </label>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 flex flex-wrap items-center gap-3 sm:gap-4 shadow-xs">
              <button
                type="button"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-secondary-500 text-white hover:bg-secondary-600 transition-colors shadow-xs"
              >
                Primary Button
              </button>

              <button
                type="button"
                className="px-4 py-2 text-xs font-bold rounded-xl border-2 border-secondary-500 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-950/30 transition-colors"
              >
                Outline Button
              </button>

              <span className="px-3 py-1 text-xs font-bold rounded-full bg-secondary-100 text-secondary-800 dark:bg-secondary-950/60 dark:text-secondary-300">
                Active Status Tag
              </span>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-b-2 border-secondary-500 text-secondary-600 dark:text-secondary-400 font-bold text-xs">
                <span>Selected Tab</span>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs font-bold text-secondary-600 dark:text-secondary-400">
                  Highlight Text
                </span>
                <div className="w-3 h-3 rounded-full bg-secondary-500 animate-ping" />
              </div>
            </div>
          </div>
        </div>

        {/* General Site Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Site Name */}
          <div>
            <label className="block text-sm font-semibold text-primary-800 dark:text-primary-200 mb-2">
              <IoText className="inline mr-2 text-secondary-500" />
              Site Name
            </label>
            <input
              type="text"
              value={branding.siteName}
              onChange={(e) =>
                setBranding({ ...branding, siteName: e.target.value })
              }
              placeholder="The Arena"
              className="w-full px-4 py-3 border-2 border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-950 text-primary-900 dark:text-white rounded-xl focus:border-secondary-500 outline-none"
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-sm font-semibold text-primary-800 dark:text-primary-200 mb-2">
              Tagline / Slogan
            </label>
            <input
              type="text"
              value={branding.tagline}
              onChange={(e) =>
                setBranding({ ...branding, tagline: e.target.value })
              }
              placeholder="Unleash Your Inner Champion"
              className="w-full px-4 py-3 border-2 border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-950 text-primary-900 dark:text-white rounded-xl focus:border-secondary-500 outline-none"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-semibold text-primary-800 dark:text-primary-200 mb-2">
              <IoImage className="inline mr-2 text-secondary-500" />
              Brand Logo
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                disabled={uploadingLogo || saving}
                className="flex-1 px-4 py-2.5 border-2 border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-950 text-primary-900 dark:text-white rounded-xl focus:border-secondary-500 outline-none text-xs"
              />
              {logoPreview && (
                <div className="w-14 h-14 border-2 border-primary-200 dark:border-primary-700 rounded-xl overflow-hidden bg-white p-1 flex-shrink-0">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Favicon URL */}
          <div>
            <label className="block text-sm font-semibold text-primary-800 dark:text-primary-200 mb-2">
              Favicon URL
            </label>
            <input
              type="text"
              value={branding.favicon}
              onChange={(e) =>
                setBranding({ ...branding, favicon: e.target.value })
              }
              placeholder="https://example.com/favicon.ico"
              className="w-full px-4 py-3 border-2 border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-950 text-primary-900 dark:text-white rounded-xl focus:border-secondary-500 outline-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-primary-200 dark:border-primary-800 flex items-center justify-end gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-secondary-500 text-white font-bold rounded-xl hover:bg-secondary-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Saving Branding Settings..." : "Save Branding & Theme Colors"}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default BrandingSettings;
