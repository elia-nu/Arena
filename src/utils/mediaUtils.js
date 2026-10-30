/**
 * Utility functions for handling media URLs, especially YouTube and TikTok
 */

/**
 * Parse YouTube URL and extract video ID
 * Supports various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export const parseYouTubeUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // Try URL parser for parameters and paths
  try {
    const urlObj = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = urlObj.hostname.toLowerCase();

    if (host.includes("youtube.com")) {
      // Check query param v=
      if (urlObj.searchParams.has("v")) {
        const v = urlObj.searchParams.get("v");
        if (v && /^[a-zA-Z0-9_-]{6,}$/.test(v)) return v;
      }
      // Check pathname: /embed/ID, /shorts/ID, /live/ID, /v/ID
      const parts = urlObj.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live", "v"].includes(parts[0]) && parts[1]) {
        return parts[1].split("?")[0].split("&")[0];
      }
    }

    if (host === "youtu.be" || host.endsWith(".youtu.be")) {
      const id = urlObj.pathname.replace(/^\//, "").split("/")[0];
      if (id) return id.split("?")[0].split("&")[0];
    }
  } catch {
    // Fall back to regex
  }

  const patterns = [
    // watch?v=<id> or watch?feature=share&v=<id>
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/|live\/))([a-zA-Z0-9_-]{6,})/,
    // youtu.be/<id>
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

/**
 * Parse TikTok URL and extract video ID
 * Supports TikTok URL formats:
 * - https://www.tiktok.com/@user/video/VIDEO_ID
 * - https://vm.tiktok.com/SHORT_CODE
 */
export const parseTikTokUrl = (url) => {
  const videoIdMatch = url.match(/\/video\/(\d+)/);
  if (videoIdMatch && videoIdMatch[1]) {
    return videoIdMatch[1];
  }
  return null;
};

/**
 * Get YouTube embed URL from any YouTube URL
 */
export const getYouTubeEmbedUrl = (url) => {
  const videoId = parseYouTubeUrl(url);
  if (!videoId) return url;

  // Preserve timestamp params when possible (e.g. ?t=90 or ?t=1m30s).
  try {
    const parsed = new URL(url);
    const t = parsed.searchParams.get("t") || parsed.searchParams.get("start");
    if (t) {
      const ts = String(t).trim();
      const numericSeconds = Number(ts);
      if (Number.isFinite(numericSeconds)) {
        return `https://www.youtube.com/embed/${videoId}?start=${Math.floor(
          numericSeconds,
        )}`;
      }

      // Support formats like "1h2m3s" / "10m30s"
      const tokenRegex = /(\d+)\s*(h|m|s)/gi;
      let match;
      let totalSeconds = 0;
      while ((match = tokenRegex.exec(ts))) {
        const value = Number(match[1]);
        const unit = match[2].toLowerCase();
        if (!Number.isFinite(value)) continue;
        if (unit === "h") totalSeconds += value * 3600;
        if (unit === "m") totalSeconds += value * 60;
        if (unit === "s") totalSeconds += value;
      }

      if (totalSeconds > 0) {
        return `https://www.youtube.com/embed/${videoId}?start=${totalSeconds}`;
      }
    }
  } catch {
    // Ignore parse errors; fall back to plain embed.
  }

  return `https://www.youtube.com/embed/${videoId}`;
};

/**
 * Get TikTok embed URL from TikTok URL
 */
export const getTikTokEmbedUrl = (url) => {
  const videoId = parseTikTokUrl(url);
  if (!videoId) return url;
  return `https://www.tiktok.com/embed/v2/${videoId}`;
};

/**
 * Get embed URL based on platform
 */
export const getVideoEmbedUrl = (url, platform) => {
  if (platform === "youtube") {
    return getYouTubeEmbedUrl(url);
  } else if (platform === "tiktok") {
    return getTikTokEmbedUrl(url);
  }
  return url;
};

/**
 * Detect platform from URL
 */
export const detectVideoPlatform = (url) => {
  if (!url || typeof url !== "string") return null;
  const lower = url.toLowerCase().trim();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return "youtube";
  } else if (lower.includes("tiktok.com")) {
    return "tiktok";
  } else if (
    lower.startsWith("/uploads/") ||
    /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(lower)
  ) {
    return "direct";
  }
  return null;
};

/**
 * Get YouTube thumbnail from video ID
 * Available qualities: default, mqdefault, hqdefault (safest), sddefault, maxresdefault
 */
export const getYouTubeThumbnail = (videoId, quality = "hqdefault") => {
  if (!videoId) return "";
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

/**
 * Get reliable fallback thumbnail for YouTube
 */
export const getYouTubeFallbackThumbnail = (videoId) => {
  if (!videoId) return "";
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

/**
 * Validate media URL
 */
export const isValidMediaUrl = (url, type) => {
  if (!url || typeof url !== "string") {
    // Empty is permissible for images if an upload file is chosen
    return type === "image";
  }

  const trimmed = url.trim();
  if (!trimmed && type === "image") return true;

  // Allow relative URLs for locally uploaded media
  if (trimmed.startsWith("/uploads/")) return true;
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return true;

  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (type === "image") {
      return (
        /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i.test(parsed.pathname) ||
        parsed.hostname.includes("unsplash.com") ||
        parsed.hostname.includes("cloudinary.com") ||
        parsed.hostname.includes("imgur.com") ||
        parsed.hostname.includes("googleusercontent.com") ||
        parsed.pathname.length > 1
      );
    } else if (type === "video") {
      return (
        parsed.hostname.includes("youtube.com") ||
        parsed.hostname.includes("youtu.be") ||
        parsed.hostname.includes("tiktok.com") ||
        /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(parsed.pathname)
      );
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Turn stored paths like /uploads/media/... into a full URL for <img src>.
 * Uses VITE_API_URL origin (strip trailing /api).
 */
export const absoluteMediaSrc = (path) => {
  if (!path || typeof path !== "string") return path;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  if (path.startsWith("/")) {
    const apiBase =
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
      "https://api.leskickit.com/api";
    const origin = String(apiBase).replace(/\/api\/?$/, "");
    return `${origin}${path}`;
  }
  return path;
};

/**
 * Smaller payloads for list/thumbnail UI (reduces decode cost and scroll jank).
 * Only adjusts Unsplash URLs (w/q/auto). Does not rewrite paths — pass
 * `absoluteMediaSrc(url)` yourself when the page needs API-origin URLs.
 */
export const getOptimizedImageSrc = (rawUrl, { width, quality = 70 } = {}) => {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl;
  if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) {
    return rawUrl;
  }

  if (rawUrl.includes("images.unsplash.com")) {
    const separator = rawUrl.includes("?") ? "&" : "?";
    const widthParam = width ? `w=${width}&` : "";
    return `${rawUrl}${separator}${widthParam}q=${quality}&auto=format&fit=crop`;
  }

  return rawUrl;
};

/** True if URL points to a file that cannot be used as an <img> src (e.g. uploaded MP4). */
export const isDirectVideoFileUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const base = url.split("?")[0].split("#")[0];
  return /\.(mp4|webm|mov|m4v|ogg)$/i.test(base);
};

/**
 * Event Media admin stores tournament Mongo id in `event`. Those items belong on the event page only.
 */
export const isTournamentScopedMedia = (item) => {
  const ev = item?.event;
  if (ev == null || typeof ev !== "string") return false;
  return /^[a-f0-9]{24}$/i.test(ev.trim());
};

/**
 * Format tags for display
 */
export const formatTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags.map((tag) => tag.toLowerCase().trim());
  }
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.toLowerCase().trim())
      .filter(Boolean);
  }
  return [];
};

/**
 * Generate share URLs for different platforms
 */
export const getShareUrl = (platform, url, text) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
  };

  return shareUrls[platform] || null;
};
