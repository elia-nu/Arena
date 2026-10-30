/**
 * TikTok API Service (Backend)
 * Uses oEmbed API for public videos - no user auth required
 * Configure your video URLs/IDs in the TIKTOK_VIDEO_IDS env var or below
 */

class TikTokService {
  constructor() {
    this.username = process.env.TIKTOK_USERNAME || 'ziza19690';
    // Configure your TikTok video IDs here (from your @ziza19690 account)
    // You can also set TIKTOK_VIDEO_IDS env var as comma-separated IDs
    this.configuredVideoIds = process.env.TIKTOK_VIDEO_IDS
      ? process.env.TIKTOK_VIDEO_IDS.split(',').map(id => id.trim())
      : [];
  }

  /**
   * Fetch video info using TikTok oEmbed API (no auth required)
   * @param {string} videoUrl - Full TikTok video URL
   */
  async getOEmbedData(videoUrl) {
    try {
      const response = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`
      );

      if (!response.ok) {
        throw new Error(`oEmbed request failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error fetching oEmbed data:', error);
      throw error;
    }
  }

  /**
   * Fetch multiple videos using oEmbed
   * @param {string[]} videoIds - Array of video IDs
   */
  async getVideosFromIds(videoIds) {
    const videos = [];
    
    for (const videoId of videoIds) {
      try {
        const videoUrl = `https://www.tiktok.com/@${this.username}/video/${videoId}`;
        const embedData = await this.getOEmbedData(videoUrl);
        
        videos.push({
          id: videoId,
          title: embedData.title || 'TikTok Video',
          description: embedData.title || '',
          video_description: embedData.title || '',
          author_name: embedData.author_name || this.username,
          author_url: embedData.author_url || `https://www.tiktok.com/@${this.username}`,
          thumbnail_url: embedData.thumbnail_url || null,
          thumbnail_width: embedData.thumbnail_width || 480,
          thumbnail_height: embedData.thumbnail_height || 848,
          html: embedData.html || null,
          embed_link: `https://www.tiktok.com/embed/v2/${videoId}`,
          share_url: videoUrl,
          create_time: Date.now() - Math.random() * 86400000 * 7, // Approximate
          // oEmbed doesn't provide these, but we can show the embed
          view_count: null,
          like_count: null,
          comment_count: null,
          share_count: null,
        });
      } catch (error) {
        console.warn(`⚠️ Failed to fetch video ${videoId}:`, error.message);
        // Continue with other videos
      }
    }

    return videos;
  }

  /**
   * Get user videos - uses configured video IDs or falls back to mock
   */
  async getUserVideos(maxCount = 20) {
    // If we have configured video IDs, fetch them via oEmbed
    if (this.configuredVideoIds.length > 0) {
      console.log(`📹 Fetching ${this.configuredVideoIds.length} configured videos via oEmbed`);
      const videos = await this.getVideosFromIds(
        this.configuredVideoIds.slice(0, maxCount)
      );
      
      if (videos.length > 0) {
        return {
          videos,
          has_more: false,
          cursor: null,
        };
      }
    }

    // Fall back to mock data with real embed links
    console.log('📦 Using showcase videos (configure TIKTOK_VIDEO_IDS for your videos)');
    return {
      videos: this.getMockVideos(maxCount),
      has_more: false,
      cursor: null,
    };
  }

  /**
   * Get video information by video IDs using oEmbed
   */
  async getVideoInfo(videoIds) {
    const ids = Array.isArray(videoIds) ? videoIds : [videoIds];
    const videos = await this.getVideosFromIds(ids);
    return { videos };
  }

  /**
   * Get user info - returns configured username info
   */
  async getUserInfo() {
    return {
      username: this.username,
      display_name: this.username,
      profile_url: `https://www.tiktok.com/@${this.username}`,
    };
  }

  /**
   * Search is not available without Research API access
   */
  async searchVideos(query, maxCount = 20) {
    console.warn('⚠️ Search requires Research API access (special approval needed)');
    return {
      videos: [],
      message: 'Search requires Research API access',
    };
  }

  /**
   * Get showcase/demo videos for when no video IDs are configured
   * These use real TikTok embed format
   */
  getMockVideos(count = 6) {
    // These are placeholder videos - replace with real video IDs from @ziza19690
    const showcaseVideos = [
      {
        id: 'showcase_1',
        title: '⚽ Amazing soccer skills compilation!',
        description: 'Check out these incredible moves from our latest training session #soccer #skills #letskickit',
        video_description: 'Amazing soccer skills compilation! ⚽',
        thumbnail_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=480&h=848&fit=crop',
        author_name: this.username,
        author_url: `https://www.tiktok.com/@${this.username}`,
        duration: 45,
        create_time: Date.now() - 3600000,
        share_count: 1234,
        view_count: 45678,
        like_count: 3456,
        comment_count: 234,
        embed_link: null, // No real embed for placeholder
        share_url: `https://www.tiktok.com/@${this.username}`,
        is_placeholder: true,
      },
      {
        id: 'showcase_2',
        title: '🏆 Match highlights from last weekend',
        description: 'Epic moments from our championship game! #soccer #highlights #victory',
        video_description: 'Match highlights from last weekend',
        thumbnail_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=480&h=848&fit=crop',
        author_name: this.username,
        author_url: `https://www.tiktok.com/@${this.username}`,
        duration: 60,
        create_time: Date.now() - 7200000,
        share_count: 2345,
        view_count: 67890,
        like_count: 5678,
        comment_count: 456,
        embed_link: null,
        share_url: `https://www.tiktok.com/@${this.username}`,
        is_placeholder: true,
      },
      {
        id: 'showcase_3',
        title: '💪 Behind the scenes training',
        description: 'See how our team prepares for the big games! #training #behindthescenes #teamwork',
        video_description: 'Behind the scenes training',
        thumbnail_url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=480&h=848&fit=crop',
        author_name: this.username,
        author_url: `https://www.tiktok.com/@${this.username}`,
        duration: 30,
        create_time: Date.now() - 10800000,
        share_count: 890,
        view_count: 23456,
        like_count: 1890,
        comment_count: 123,
        embed_link: null,
        share_url: `https://www.tiktok.com/@${this.username}`,
        is_placeholder: true,
      },
      {
        id: 'showcase_4',
        title: '❤️ Fan reactions compilation',
        description: 'Your support means everything! Thank you fans! #fans #support #community',
        video_description: 'Fan reactions compilation',
        thumbnail_url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=480&h=848&fit=crop',
        author_name: this.username,
        author_url: `https://www.tiktok.com/@${this.username}`,
        duration: 55,
        create_time: Date.now() - 14400000,
        share_count: 1567,
        view_count: 34567,
        like_count: 2890,
        comment_count: 345,
        embed_link: null,
        share_url: `https://www.tiktok.com/@${this.username}`,
        is_placeholder: true,
      },
      {
        id: 'showcase_5',
        title: '🚀 Goal of the week!',
        description: 'Unbelievable strike from 30 yards out! #goal #soccer #amazing',
        video_description: 'Goal of the week!',
        thumbnail_url: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=480&h=848&fit=crop',
        author_name: this.username,
        author_url: `https://www.tiktok.com/@${this.username}`,
        duration: 25,
        create_time: Date.now() - 18000000,
        share_count: 3456,
        view_count: 89012,
        like_count: 7890,
        comment_count: 567,
        embed_link: null,
        share_url: `https://www.tiktok.com/@${this.username}`,
        is_placeholder: true,
      },
      {
        id: 'showcase_6',
        title: '🏆 Team celebration after big win',
        description: 'Championship vibes! #champions #celebration #teamwork',
        video_description: 'Team celebration after big win',
        thumbnail_url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=480&h=848&fit=crop',
        author_name: this.username,
        author_url: `https://www.tiktok.com/@${this.username}`,
        duration: 40,
        create_time: Date.now() - 21600000,
        share_count: 2890,
        view_count: 56789,
        like_count: 4567,
        comment_count: 389,
        embed_link: null,
        share_url: `https://www.tiktok.com/@${this.username}`,
        is_placeholder: true,
      },
    ];

    return showcaseVideos.slice(0, count);
  }
}

// Export singleton instance
const tiktokService = new TikTokService();
export default tiktokService;
