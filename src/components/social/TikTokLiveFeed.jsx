import { useTikTokFeed } from '../../hooks/useTikTokFeed';
import { useSocialAnalytics } from '../../context/SocialAnalyticsContext';
import EmptyState from '../EmptyState';

/**
 * TikTok Live Feed Component
 * Displays real-time TikTok videos from the configured account
 */
const TikTokLiveFeed = ({
  username = '@ziza19690',
  maxVideos = 6,
  autoRefresh = true,
  refreshInterval = 300000, // 5 minutes
}) => {
  const { videos, loading, error, lastUpdated, refresh } = useTikTokFeed({
    username,
    maxCount: maxVideos,
    refreshInterval: autoRefresh ? refreshInterval : 0,
  });

  const { trackEvent } = useSocialAnalytics();

  const handleVideoClick = (video) => {
    trackEvent({
      type: 'click',
      platform: 'tiktok',
      action: 'video_view',
      videoId: video.id,
      videoTitle: video.title,
    });
  };

  const handleRefresh = () => {
    refresh();
    trackEvent({
      type: 'action',
      platform: 'tiktok',
      action: 'manual_refresh',
    });
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500 mb-4"></div>
          <p className="text-sm text-primary-600">Loading TikTok feed...</p>
        </div>
      </div>
    );
  }

  if (error && videos.length === 0) {
    return (
      <EmptyState
        variant="error"
        compact
        title="Unable to load TikTok feed"
        description={error}
        actionLabel="Try again"
        onAction={handleRefresh}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-primary-950">
            Latest from TikTok
          </h3>
          {lastUpdated && (
            <p className="text-xs text-primary-500 mt-1">
              Last updated: {formatTimeAgo(lastUpdated.getTime())}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <div
            key={video.id}
            className="group rounded-2xl bg-white border border-primary-100 overflow-hidden hover:shadow-lg hover:border-secondary-300 transition-all duration-300"
          >
            {/* Video Embed or Thumbnail */}
            <div className="relative aspect-[9/16] bg-primary-900/5">
              {video.embed_link && !video.is_placeholder ? (
                <iframe
                  src={video.embed_link}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="encrypted-media; picture-in-picture; web-share"
                  scrolling="no"
                  title={video.title || video.video_description}
                />
              ) : video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title || video.video_description}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-900/10 to-secondary-500/10">
                  <svg
                    className="w-16 h-16 text-primary-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                  </svg>
                </div>
              )}

              {/* Play overlay */}
              <a
                href={video.share_url || `https://www.tiktok.com/@${username}/video/${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleVideoClick(video)}
                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-8 h-8 text-primary-900 ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </a>
            </div>

            {/* Video Info */}
            <div className="p-4">
              <p className="text-sm font-medium text-primary-950 line-clamp-2 mb-3">
                {video.title || video.video_description || 'TikTok Video'}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-primary-600">
                <div className="flex items-center gap-3">
                  {video.view_count !== undefined && (
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>{formatNumber(video.view_count)}</span>
                    </div>
                  )}
                  {video.like_count !== undefined && (
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span>{formatNumber(video.like_count)}</span>
                    </div>
                  )}
                </div>
                {video.create_time && (
                  <span className="text-primary-500">
                    {formatTimeAgo(video.create_time)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {videos.length === 0 && !loading && (
        <EmptyState
          variant="social"
          compact
          title="No videos available"
          description="New TikTok clips will show up here when they go live."
          actionLabel="Refresh"
          onAction={handleRefresh}
        />
      )}
    </div>
  );
};

export default TikTokLiveFeed;
