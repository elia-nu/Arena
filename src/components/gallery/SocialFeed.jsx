import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { contactAPI } from "../../services/api";

const isValidUrl = (value) => {
  if (!value) return false;
  const v = String(value).trim();
  return v !== "" && v !== "#";
};

const extractHandleFromUrl = (platform, url) => {
  if (!url) return "";
  const u = String(url).trim();

  try {
    const parsed = new URL(u);
    const pathname = parsed.pathname || "";

    if (platform === "Instagram") {
      const match = pathname.match(/^\/@?([^/]+)/);
      if (match?.[1]) return `@${match[1]}`;
    }

    if (platform === "TikTok") {
      const match = u.match(/tiktok\.com\/@([^/?#]+)/i);
      if (match?.[1]) return `@${match[1]}`;
    }

    if (platform === "YouTube") {
      // Supports: /@handle or /c/name or /user/name or /channel/<id>
      const atHandle = u.match(/youtube\.com\/@([^/?#]+)/i);
      if (atHandle?.[1]) return atHandle[1];

      const cHandle = u.match(/youtube\.com\/(?:c|user)\/([^/?#]+)/i);
      if (cHandle?.[1]) return cHandle[1];
    }
  } catch {
    // If URL parsing fails, fall back to raw string parsing.
    if (platform === "Instagram")
      return `@${u.split("/").pop().replace(/^@/, "")}`;
  }

  return "";
};

const SocialFeed = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSocial = async () => {
      try {
        setLoading(true);
        const data = await contactAPI.getInfo();
        const socialMedia = data?.contactInfo?.socialMedia || {};

        const instagramUrl = socialMedia.instagram;
        const tiktokUrl = socialMedia.tiktok;
        const youtubeUrl = socialMedia.youtube; // optional (may exist depending on your stored settings)

        const next = [];

        if (isValidUrl(instagramUrl)) {
          next.push({
            platform: "Instagram",
            handle:
              extractHandleFromUrl("Instagram", instagramUrl) || "The Arena",
            status: "Latest photos & stories",
            url: instagramUrl,
            gradient: "from-[#FEDA75] via-[#FA7E1E] to-[#D62976]",
          });
        }

        if (isValidUrl(tiktokUrl)) {
          next.push({
            platform: "TikTok",
            handle: extractHandleFromUrl("TikTok", tiktokUrl) || "The Arena",
            status: "Short-form highlights",
            url: tiktokUrl,
            gradient: "from-[#010101] via-[#69C9D0] to-[#EE1D52]",
          });
        }

        if (isValidUrl(youtubeUrl)) {
          next.push({
            platform: "YouTube",
            handle: extractHandleFromUrl("YouTube", youtubeUrl) || "The Arena",
            status: "Match highlights & recaps",
            url: youtubeUrl,
            gradient: "from-[#FF0000] via-[#FF4D4D] to-[#FF8080]",
          });
        }

        setStreams(next);
      } catch (e) {
        // If backend is unreachable, hide the social cards (we don't fall back to env).
        console.error("Error fetching social feed config:", e);
        setStreams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSocial();
  }, []);

  const hasStreams = useMemo(() => streams.length > 0, [streams]);

  if (loading) {
    return (
      <motion.div
        className="mb-12 rounded-3xl border border-secondary-50/10 bg-gradient-to-br from-secondary-50/10 via-secondary-50/5 to-transparent p-8 text-secondary-50 backdrop-blur-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <p className="text-xs uppercase tracking-[0.5em] text-secondary-50/60 mb-2">
          Social Feed
        </p>
        <h3 className="text-2xl font-black text-secondary-500">Loading...</h3>
      </motion.div>
    );
  }

  if (!hasStreams) return null;

  return (
    <motion.div
      className="mb-12 rounded-3xl border border-secondary-50/10 bg-gradient-to-br from-secondary-50/10 via-secondary-50/5 to-transparent p-8 text-secondary-50 backdrop-blur-3xl"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-secondary-50/60 mb-2">
            Social Feed
          </p>
          <h3 className="text-3xl font-black text-secondary-500">
            Always streaming culture.
          </h3>
        </div>
        <Link
          to="/social"
          className="self-start rounded-full border border-secondary-50/30 px-6 py-2 text-xs uppercase tracking-[0.3em] text-secondary-50/80 transition hover:border-accent-300 hover:text-accent-200 hover:bg-secondary-50/10 inline-block"
        >
          View social
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {streams.map((stream) => (
          <a
            key={stream.platform}
            href={stream.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative overflow-hidden rounded-2xl border border-secondary-50/10 bg-secondary-50/5 p-6 block transition hover:border-secondary-50/20 hover:bg-secondary-50/10 focus:outline-none focus:ring-2 focus:ring-secondary-400/50 focus:ring-offset-2 focus:ring-offset-transparent"
          >
            <div
              className={`absolute inset-0 opacity-30 blur-3xl bg-gradient-to-r ${stream.gradient}`}
              aria-hidden
            />
            <div className="relative">
              <p className="text-sm uppercase tracking-[0.3em] text-secondary-50/60 mb-2">
                {stream.platform}
              </p>
              <p className="text-xl font-semibold">{stream.handle}</p>
              <p className="text-sm text-secondary-50/70 mt-1">
                {stream.status}
              </p>
              <span className="sr-only">
                Open {stream.platform} in a new tab
              </span>
            </div>
          </a>
        ))}
      </div>
    </motion.div>
  );
};

export default SocialFeed;
