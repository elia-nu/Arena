import { createContext, useContext, useMemo, useState, useCallback } from "react";

const SocialAnalyticsContext = createContext(null);

export const useSocialAnalytics = () => {
  const ctx = useContext(SocialAnalyticsContext);
  if (!ctx) {
    throw new Error("useSocialAnalytics must be used within a SocialAnalyticsProvider");
  }
  return ctx;
};

export const SocialAnalyticsProvider = ({ children }) => {
  const [events, setEvents] = useState([]);

  const trackEvent = useCallback((event) => {
    const enriched = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };

    setEvents((prev) => [...prev, enriched]);

    // Hook for backend / analytics service
    // Example:
    // fetch("/api/analytics/social", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(enriched),
    // }).catch((err) => {
    //   console.error("Failed to send social analytics event", err);
    // });

    if (process.env.NODE_ENV !== "production") {
      // Helpful for debugging locally
      console.log("[SocialAnalytics]", enriched);
    }
  }, []);

  const shareCounts = useMemo(() => {
    return events.reduce(
      (acc, ev) => {
        if (ev.type === "share" && ev.platform) {
          acc[ev.platform] = (acc[ev.platform] || 0) + 1;
        }
        return acc;
      },
      /** @type {Record<string, number>} */ ({})
    );
  }, [events]);

  const value = useMemo(
    () => ({
      events,
      shareCounts,
      trackEvent,
    }),
    [events, shareCounts, trackEvent]
  );

  return (
    <SocialAnalyticsContext.Provider value={value}>
      {children}
    </SocialAnalyticsContext.Provider>
  );
};


