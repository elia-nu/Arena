import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoColorPaletteOutline,
  IoCheckmark,
  IoRefreshOutline,
  IoCloudUploadOutline,
  IoSparklesOutline,
  IoChevronForward,
} from "react-icons/io5";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../NotificationProvider";
import { useNavigate } from "react-router-dom";

const ThemeColorPicker = ({ variant = "dropdown" }) => {
  const {
    activeColor,
    activePresetId,
    presets,
    applyColor,
    resetToDefault,
    saveAsSiteDefault,
  } = useTheme();
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [customHex, setCustomHex] = useState(activeColor);
  const [savingDefault, setSavingDefault] = useState(false);
  const dropdownRef = useRef(null);

  // Sync customHex with activeColor
  useEffect(() => {
    setCustomHex(activeColor);
  }, [activeColor]);

  // Click outside listener for dropdown
  useEffect(() => {
    if (variant !== "dropdown") return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [variant]);

  const handleSelectPreset = (preset) => {
    applyColor(preset.primaryHex, preset.id);
  };

  const handleCustomColorChange = (hex) => {
    setCustomHex(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex) || /^#[0-9A-Fa-f]{3}$/.test(hex)) {
      applyColor(hex, "custom");
    }
  };

  const handleSaveDefault = async () => {
    setSavingDefault(true);
    try {
      const res = await saveAsSiteDefault();
      if (res.success) {
        showSuccess("Theme color saved as site-wide default!");
      } else {
        showError(res.error || "Failed to save default color");
      }
    } catch {
      showError("Failed to save default color to server");
    } finally {
      setSavingDefault(false);
    }
  };

  const pickerContent = (
    <div className="p-4 sm:p-5 w-80 sm:w-96 bg-white dark:bg-primary-900 rounded-2xl shadow-2xl border border-primary-200 dark:border-primary-800 text-left">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-primary-100 dark:border-primary-800">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full shadow-inner flex items-center justify-center text-white"
            style={{ backgroundColor: activeColor }}
          >
            <IoSparklesOutline className="w-3 h-3" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-primary-950 dark:text-primary-50">
              Theme Accent Color
            </h4>
            <p className="text-[11px] text-primary-500">
              Changes buttons, badges, and accents instantly
            </p>
          </div>
        </div>
        <button
          onClick={resetToDefault}
          className="text-primary-400 hover:text-primary-700 dark:hover:text-primary-200 p-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
          title="Reset to Arena Default"
        >
          <IoRefreshOutline className="w-4 h-4" />
        </button>
      </div>

      {/* Preset Swatches */}
      <div className="mb-4">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-primary-400 dark:text-primary-400 mb-2">
          Preset Palettes
        </label>
        <div className="grid grid-cols-4 gap-2">
          {presets.map((preset) => {
            const isSelected =
              activePresetId === preset.id ||
              activeColor.toLowerCase() === preset.primaryHex.toLowerCase();
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`relative flex flex-col items-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? "border-secondary-500 bg-secondary-50/50 dark:bg-secondary-950/30 shadow-xs"
                    : "border-primary-200/80 dark:border-primary-800 hover:border-primary-300 dark:hover:border-primary-700 bg-primary-50/50 dark:bg-primary-800/40"
                }`}
                title={preset.description}
              >
                <div
                  className="w-6 h-6 rounded-full shadow-xs mb-1 flex items-center justify-center text-white text-xs font-bold transition-transform hover:scale-110"
                  style={{ backgroundColor: preset.primaryHex }}
                >
                  {isSelected && <IoCheckmark className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[10px] font-semibold text-primary-800 dark:text-primary-200 truncate w-full">
                  {preset.name.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Input */}
      <div className="mb-4 pt-3 border-t border-primary-100 dark:border-primary-800">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-primary-400 dark:text-primary-400 mb-2">
          Custom Color Hex
        </label>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="color"
              value={customHex.startsWith("#") ? customHex : `#${customHex}`}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              className="w-10 h-10 rounded-xl border border-primary-200 dark:border-primary-700 cursor-pointer overflow-hidden p-0.5 bg-white dark:bg-primary-800"
            />
          </div>
          <input
            type="text"
            value={customHex}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            placeholder="#fe5723"
            maxLength={7}
            className="flex-1 px-3 py-2 text-xs font-mono font-semibold rounded-xl border border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-950 text-primary-900 dark:text-primary-100 outline-none focus:border-secondary-500"
          />
          <button
            onClick={() => handleCustomColorChange(customHex)}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-secondary-500 text-white hover:bg-secondary-600 transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Live Sample Strip */}
      <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-800/50 mb-3 flex items-center justify-between">
        <span className="text-xs text-primary-600 dark:text-primary-300 font-medium">
          Live Accent Sample:
        </span>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-secondary-500 text-white">
            Active
          </span>
          <button className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-secondary-500 text-white hover:bg-secondary-600 transition-colors shadow-2xs">
            Button
          </button>
        </div>
      </div>

      {/* Admin Action: Save as Site Default */}
      {isAdmin && (
        <div className="pt-2 border-t border-primary-100 dark:border-primary-800 space-y-2">
          <button
            onClick={handleSaveDefault}
            disabled={savingDefault}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl bg-secondary-500 text-white hover:bg-secondary-600 transition-colors disabled:opacity-60 cursor-pointer shadow-xs"
          >
            <IoCloudUploadOutline className="w-4 h-4" />
            <span>
              {savingDefault ? "Saving Default..." : "Save as Site Default"}
            </span>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              navigate("/admin");
            }}
            className="w-full flex items-center justify-between py-1.5 px-2 text-[11px] font-semibold text-primary-500 hover:text-secondary-600 dark:hover:text-secondary-400 transition-colors text-left cursor-pointer"
          >
            <span>Full Branding & Appearance Settings</span>
            <IoChevronForward className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  if (variant === "inline") {
    return pickerContent;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-primary-200/80 dark:border-primary-800 bg-white/80 dark:bg-primary-900/40 hover:bg-primary-50 dark:hover:bg-primary-800 text-primary-800 dark:text-primary-100 transition-all shadow-2xs cursor-pointer group"
        title="Change dashboard & site colors"
      >
        <span
          className="w-3.5 h-3.5 rounded-full shadow-inner ring-1 ring-white/50"
          style={{ backgroundColor: activeColor }}
        />
        <IoColorPaletteOutline className="w-4 h-4 text-secondary-500 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">Color</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 z-50"
          >
            {pickerContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeColorPicker;
