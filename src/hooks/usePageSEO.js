import { useEffect } from "react";

const BASE_URL = "https://arenaia.com";
const DEFAULT_TITLE = "The Arena | Ethiopian Community Soccer Tournaments";
const DEFAULT_DESC =
  "The Arena brings competitive street soccer tournaments, youth development, and community impact events across Ethiopia (Addis Ababa & Hawassa).";
const DEFAULT_IMAGE = `${BASE_URL}/logo.jpg`;

/**
 * usePageSEO - Sets dynamic document title, meta description, Open Graph,
 * Twitter card, and canonical links for search engines and social sharing.
 *
 * Supports both:
 *   usePageSEO("My Page Title", "Optional description")
 * and
 *   usePageSEO({ title: "My Page Title", description: "...", path: "/events", image: "..." })
 */
export const usePageSEO = (optionsOrTitle, maybeDesc) => {
  let title = "";
  let description = DEFAULT_DESC;
  let path = "";
  let image = DEFAULT_IMAGE;

  if (typeof optionsOrTitle === "string") {
    title = optionsOrTitle;
    if (typeof maybeDesc === "string" && maybeDesc.trim()) {
      description = maybeDesc;
    }
  } else if (optionsOrTitle && typeof optionsOrTitle === "object") {
    title = optionsOrTitle.title || "";
    description = optionsOrTitle.description || DEFAULT_DESC;
    path = optionsOrTitle.path || "";
    image = optionsOrTitle.image || DEFAULT_IMAGE;
  }

  useEffect(() => {
    const fullTitle = title ? `${title} | The Arena` : DEFAULT_TITLE;
    document.title = fullTitle;

    const setMeta = (selector, attr, value) => {
      if (!value) return;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        const match = selector.match(/meta\[([a-zA-Z:-]+)=['"]?([^'"]+)['"]?\]/);
        if (match) {
          el.setAttribute(match[1], match[2]);
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta("meta[name='description']", "content", description);
    setMeta("meta[property='og:title']", "content", fullTitle);
    setMeta("meta[property='og:description']", "content", description);
    setMeta("meta[property='og:image']", "content", image);
    setMeta("meta[property='twitter:title']", "content", fullTitle);
    setMeta("meta[property='twitter:description']", "content", description);
    setMeta("meta[property='twitter:image']", "content", image);

    const fullUrl = path
      ? `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
      : typeof window !== "undefined"
      ? window.location.href
      : BASE_URL;

    setMeta("meta[property='og:url']", "content", fullUrl);
    setMeta("meta[property='twitter:url']", "content", fullUrl);

    let canonical = document.querySelector("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", fullUrl);
  }, [title, description, path, image]);
};

export default usePageSEO;
