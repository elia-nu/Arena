import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { adminAPI } from "../services/api";

const ThemeContext = createContext(null);

export const COLOR_PRESETS = [
  {
    id: "orange",
    name: "Arena Flame",
    primaryHex: "#fe5723",
    description: "Original Arena energy and intensity",
    palette: {
      50: "#fff7ed",
      100: "#ffedd5",
      200: "#ffd0ad",
      300: "#ffaf7b",
      400: "#ff8b42",
      500: "#fe5723",
      600: "#e84919",
      700: "#c43a13",
      800: "#982b10",
      900: "#691c0c",
      950: "#390a04",
    },
  },
  {
    id: "red",
    name: "Crimson Fury",
    primaryHex: "#ef4444",
    description: "Bold, aggressive competition vibe",
    palette: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
      950: "#450a0a",
    },
  },
  {
    id: "blue",
    name: "Electric Blue",
    primaryHex: "#0066ff",
    description: "Futuristic, sharp tournament tech",
    palette: {
      50: "#e6f0ff",
      100: "#cce0ff",
      200: "#99c2ff",
      300: "#66a3ff",
      400: "#3385ff",
      500: "#0066ff",
      600: "#0052cc",
      700: "#004099",
      800: "#002e66",
      900: "#001c33",
      950: "#000a1a",
    },
  },
  {
    id: "green",
    name: "Emerald Strike",
    primaryHex: "#10b981",
    description: "Vibrant gaming victory emerald",
    palette: {
      50: "#ecfdf5",
      100: "#d1fae5",
      200: "#a7f3d0",
      300: "#6ee7b7",
      400: "#34d399",
      500: "#10b981",
      600: "#059669",
      700: "#047857",
      800: "#065f46",
      900: "#064e3b",
      950: "#022c22",
    },
  },
  {
    id: "purple",
    name: "Royal Violet",
    primaryHex: "#8b5cf6",
    description: "Mystic, elite championship tier",
    palette: {
      50: "#f5f3ff",
      100: "#ede9fe",
      200: "#ddd6fe",
      300: "#c4b5fd",
      400: "#a78bfa",
      500: "#8b5cf6",
      600: "#7c3aed",
      700: "#6d28d9",
      800: "#5b21b6",
      900: "#4c1d95",
      950: "#2e1065",
    },
  },
  {
    id: "amber",
    name: "Cyber Gold",
    primaryHex: "#f59e0b",
    description: "Prestigious trophy gold shine",
    palette: {
      50: "#fffbeb",
      100: "#fef3c7",
      200: "#fde68a",
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
      800: "#92400e",
      900: "#78350f",
      950: "#451a03",
    },
  },
  {
    id: "rose",
    name: "Neon Rose",
    primaryHex: "#f43f5e",
    description: "High-voltage neon pink punch",
    palette: {
      50: "#fff1f2",
      100: "#ffe4e6",
      200: "#fecdd3",
      300: "#fda4af",
      400: "#fb7185",
      500: "#f43f5e",
      600: "#e11d48",
      700: "#be123c",
      800: "#9f1239",
      900: "#881337",
      950: "#4c0519",
    },
  },
  {
    id: "cyan",
    name: "Cyan Aqua",
    primaryHex: "#06b6d4",
    description: "Fresh oceanic cyberpunk glow",
    palette: {
      50: "#ecfeff",
      100: "#cffafe",
      200: "#a5f3fc",
      300: "#67e8f9",
      400: "#22d3ee",
      500: "#06b6d4",
      600: "#0891b2",
      700: "#0e7490",
      800: "#155e75",
      900: "#164e63",
      950: "#083344",
    },
  },
];

// Helper to convert hex to RGB
function hexToRgb(hex) {
  let c = hex.replace("#", "").trim();
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 254, g: 87, b: 35 }; // fallback to #fe5723
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Helper to convert RGB to hex
function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

// Linear color interpolation
function mixRgb(color1, color2, weight) {
  const w1 = weight;
  const w2 = 1 - weight;
  return rgbToHex(
    color1.r * w1 + color2.r * w2,
    color1.g * w1 + color2.g * w2,
    color1.b * w1 + color2.b * w2
  );
}

// Generate complete Tailwind shade ramp (50-950) from any arbitrary hex color
export function generateColorRamp(baseHex) {
  const base = hexToRgb(baseHex);
  const white = { r: 255, g: 255, b: 255 };
  const darkTint = { r: 15, g: 10, b: 20 };

  return {
    50: mixRgb(white, base, 0.94),
    100: mixRgb(white, base, 0.85),
    200: mixRgb(white, base, 0.68),
    300: mixRgb(white, base, 0.48),
    400: mixRgb(white, base, 0.24),
    500: baseHex,
    600: mixRgb(base, darkTint, 0.88),
    700: mixRgb(base, darkTint, 0.74),
    800: mixRgb(base, darkTint, 0.58),
    900: mixRgb(base, darkTint, 0.42),
    950: mixRgb(base, darkTint, 0.22),
  };
}

// Apply palette CSS custom properties to document root
function applyPaletteToDOM(palette) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  Object.entries(palette).forEach(([shade, hex]) => {
    root.style.setProperty(`--color-secondary-${shade}`, hex);
  });
  root.style.setProperty("--color-secondary", palette[500]);

  // Update theme-color meta tag if present
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = palette[500];
}

export const ThemeProvider = ({ children }) => {
  const defaultPreset = COLOR_PRESETS[0];
  const [activeColor, setActiveColor] = useState(defaultPreset.primaryHex);
  const [activePresetId, setActivePresetId] = useState(defaultPreset.id);
  const [activePalette, setActivePalette] = useState(defaultPreset.palette);

  // Apply a color or preset
  const applyColor = useCallback((hex, presetId = "custom") => {
    const cleanHex = hex.startsWith("#") ? hex : `#${hex}`;
    let palette;

    const matchedPreset = COLOR_PRESETS.find(
      (p) => p.id === presetId || p.primaryHex.toLowerCase() === cleanHex.toLowerCase()
    );

    if (matchedPreset) {
      palette = matchedPreset.palette;
      setActivePresetId(matchedPreset.id);
      setActiveColor(matchedPreset.primaryHex);
    } else {
      palette = generateColorRamp(cleanHex);
      setActivePresetId("custom");
      setActiveColor(cleanHex);
    }

    setActivePalette(palette);
    applyPaletteToDOM(palette);

    // Save to localStorage
    try {
      localStorage.setItem("arena_theme_color", cleanHex);
      localStorage.setItem("arena_theme_preset", matchedPreset ? matchedPreset.id : "custom");
    } catch (e) {
      console.warn("Could not save theme to localStorage", e);
    }
  }, []);

  // Reset to default Arena Flame Orange
  const resetToDefault = useCallback(() => {
    applyColor(defaultPreset.primaryHex, defaultPreset.id);
  }, [applyColor, defaultPreset]);

  // Save as site-wide default via backend API (Admin only)
  const saveAsSiteDefault = useCallback(
    async (optionalSiteName, optionalLogo) => {
      try {
        const payload = {
          secondaryColor: activeColor,
          colorPreset: activePresetId,
          palette: activePalette,
        };
        if (optionalSiteName) payload.siteName = optionalSiteName;
        if (optionalLogo) payload.logo = optionalLogo;

        await adminAPI.saveBranding(payload);
        return { success: true };
      } catch (error) {
        console.error("Failed to save branding to server:", error);
        return { success: false, error: error.message || "Failed to save to server" };
      }
    },
    [activeColor, activePresetId, activePalette]
  );

  // Initialize from localStorage or server branding
  useEffect(() => {
    const initTheme = async () => {
      let storedColor = null;
      let storedPreset = null;

      try {
        storedColor = localStorage.getItem("arena_theme_color");
        storedPreset = localStorage.getItem("arena_theme_preset");
      } catch (e) {
        // ignore storage errors
      }

      if (storedColor) {
        applyColor(storedColor, storedPreset || "custom");
        return;
      }

      // If no local preference, check server branding
      try {
        const res = await fetch("/api/branding");
        if (res.ok) {
          const data = await res.json();
          if (data?.branding?.secondaryColor) {
            applyColor(
              data.branding.secondaryColor,
              data.branding.colorPreset || "custom"
            );
            return;
          }
        }
      } catch {
        // server might be unavailable or offline; keep default
      }

      // Default fallback
      applyColor(defaultPreset.primaryHex, defaultPreset.id);
    };

    initTheme();
  }, [applyColor, defaultPreset]);

  return (
    <ThemeContext.Provider
      value={{
        activeColor,
        activePresetId,
        activePalette,
        presets: COLOR_PRESETS,
        applyColor,
        resetToDefault,
        saveAsSiteDefault,
        generateColorRamp,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
