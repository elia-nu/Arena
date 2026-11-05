import { useEffect, useState } from "react";
import { contactAPI } from "../services/api";
import EmptyState from "../components/EmptyState";

const Social = () => {
  const [socialPageEnabled, setSocialPageEnabled] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load public settings to know if the Social page is enabled
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await contactAPI.getInfo();
        const enabled = data?.contactInfo?.socialPageEnabled;
        if (typeof enabled === "boolean") {
          setSocialPageEnabled(enabled);
        } else {
          setSocialPageEnabled(true);
        }
      } catch (error) {
        console.error("Error loading site settings:", error);
        setSocialPageEnabled(true);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Replace these URLs/handles with your real social profiles
  const links = {
    youtube: "https://www.youtube.com/@your-channel",
    twitter: "https://twitter.com/NASA",
  };

  // Load Curator.io social wall script for Twitter/X feed
  useEffect(() => {
    if (!settingsLoaded || !socialPageEnabled) return;

    // Curator.io social wall (for Twitter/X feed aggregation)
    if (
      !document.querySelector(
        "script[src='https://cdn.curator.io/published/6e35b816-93cf-4278-b823-9c3fa96c5e7f.js']",
      )
    ) {
      const curatorScript = document.createElement("script");
      curatorScript.async = true;
      curatorScript.charset = "UTF-8";
      curatorScript.src =
        "https://cdn.curator.io/published/6e35b816-93cf-4278-b823-9c3fa96c5e7f.js";
      const firstScript = document.getElementsByTagName("script")[0];
      firstScript.parentNode.insertBefore(curatorScript, firstScript);
    }
  }, [settingsLoaded, socialPageEnabled]);

  if (settingsLoaded && !socialPageEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-primary-50/30 to-white pt-24 sm:pt-28 pb-16">
        <EmptyState
          variant="social"
          title="Social hub is offline"
          description="Our Social page is currently disabled by the site administrator. Please check back later."
          actionLabel="Back to home"
          actionTo="/"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-primary-50/30 to-white pt-24 sm:pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <header className="text-center mb-16 sm:mb-20">
          <div className="inline-block mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100/50 border border-primary-200/50">
              <span className="w-2 h-2 rounded-full bg-secondary-500 animate-pulse"></span>
              <p className="text-xs uppercase tracking-[0.35em] text-primary-600 font-semibold">
                Social Hub
              </p>
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-primary-950 mb-5 leading-tight">
            Stay connected with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-500 to-secondary-600">
              The Arena
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-primary-600 leading-relaxed">
            Follow us across your favorite platforms for match highlights, live
            updates, behind-the-scenes content and community stories.
          </p>
        </header>

        {/* Main embeds / cards - Juicer and Curator feeds only */}
        <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10 mb-16">
          {/* YouTube / Juicer social wall */}
          <section className="group rounded-3xl bg-white border-2 border-primary-100 shadow-xl shadow-primary-900/5 hover:shadow-2xl hover:shadow-primary-900/10 transition-all duration-300 overflow-hidden hover:border-primary-200">
            <div className="px-6 sm:px-8 pt-7 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-br from-primary-50 via-primary-50/80 to-transparent border-b border-primary-100/50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary-500"></div>
                  <p className="text-xs uppercase tracking-[0.3em] text-primary-500 font-bold">
                    Juicer Feed
                  </p>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-primary-950 leading-tight">
                  Match highlights &amp; recaps
                </h2>
                <p className="text-sm text-primary-600 mt-1.5">
                  Latest videos and content
                </p>
              </div>
              <a
                href={links.youtube}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary-600 hover:text-secondary-700 underline underline-offset-4 transition-all duration-200 hover:gap-2 group/link"
              >
                Visit channel
                <svg
                  className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            </div>
            <div className="bg-gradient-to-b from-primary-900/5 to-primary-50/30 min-h-[600px] sm:min-h-[700px] lg:min-h-[800px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary-50/20 pointer-events-none"></div>
              {/* Juicer.io social wall iframe for YouTube-related content */}
              <iframe
                src="https://www.juicer.io/api/feeds/curuer/iframe"
                title="The Arena YouTube Social Wall"
                frameBorder="0"
                width="100%"
                height="100%"
                style={{
                  display: "block",
                  margin: "0 auto",
                  width: "100%",
                  minHeight: "600px",
                  border: "none",
                }}
                className="w-full relative z-10"
                loading="lazy"
              />
            </div>
          </section>

          {/* Twitter / X - Curator feed */}
          <section className="group rounded-3xl bg-white border-2 border-primary-100 shadow-xl shadow-primary-900/5 hover:shadow-2xl hover:shadow-primary-900/10 transition-all duration-300 overflow-hidden hover:border-primary-200">
            <div className="px-6 sm:px-8 pt-7 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-br from-primary-50 via-primary-50/80 to-transparent border-b border-primary-100/50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary-500"></div>
                  <p className="text-xs uppercase tracking-[0.3em] text-primary-500 font-bold">
                    Curator Feed
                  </p>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-primary-950 leading-tight">
                  Real-time updates
                </h2>
                <p className="text-sm text-primary-600 mt-1.5">
                  Live social media feed
                </p>
              </div>
              <a
                href={links.twitter}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary-600 hover:text-secondary-700 underline underline-offset-4 transition-all duration-200 hover:gap-2 group/link"
              >
                Open feed
                <svg
                  className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            </div>
            <div className="px-6 sm:px-8 pb-8 min-h-[600px] sm:min-h-[700px] lg:min-h-[800px] relative">
              <div className="rounded-2xl border-2 border-primary-100 bg-gradient-to-br from-primary-50 via-white to-primary-50/50 p-5 sm:p-7 text-sm text-primary-800 overflow-hidden h-full shadow-inner relative">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary-50/30 pointer-events-none rounded-2xl"></div>
                {/* Curator.io Twitter/X social wall */}
                <div
                  id="curator-feed-default-feed-layout"
                  className="curator-feed-default-feed-layout relative z-10"
                >
                  <a
                    href="https://curator.io"
                    target="_blank"
                    rel="noreferrer"
                    className="crt-logo crt-tag"
                  >
                    Powered by Curator.io
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Social;
