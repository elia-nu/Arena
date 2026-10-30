import express from 'express';
import tiktokService from '../services/tiktok.service.js';

const router = express.Router();

/**
 * GET /api/tiktok/videos
 * Fetch videos from TikTok (via oEmbed or configured video IDs)
 * Query params:
 *   - maxCount: number of videos to fetch (default: 10)
 */
router.get('/videos', async (req, res) => {
  try {
    const { maxCount = 10 } = req.query;
    const count = parseInt(maxCount, 10);

    const data = await tiktokService.getUserVideos(count);

    return res.json({
      success: true,
      data: data,
      source: data.videos.some(v => v.is_placeholder) ? 'showcase' : 'tiktok_oembed',
    });
  } catch (error) {
    console.error('❌ Error in /api/tiktok/videos:', error);
    
    // Always return mock data on error
    return res.json({
      success: true,
      data: {
        videos: tiktokService.getMockVideos(parseInt(req.query.maxCount, 10) || 10),
        has_more: false,
        cursor: null,
      },
      source: 'showcase_fallback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/tiktok/video/:videoId
 * Get information about a specific video via oEmbed
 */
router.get('/video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'Video ID is required',
      });
    }

    const data = await tiktokService.getVideoInfo([videoId]);

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('❌ Error in /api/tiktok/video/:videoId:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /api/tiktok/search
 * Search for TikTok videos (requires Research API - not available in sandbox)
 */
router.post('/search', async (req, res) => {
  try {
    const { query, maxCount = 20 } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const data = await tiktokService.searchVideos(query, maxCount);

    res.json({
      success: true,
      data: data,
      message: 'Search requires Research API access (special approval needed)',
    });
  } catch (error) {
    console.error('❌ Error in /api/tiktok/search:', error);
    res.status(500).json({
      success: false,
      message: 'Search requires Research API access',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/tiktok/user
 * Get TikTok user information
 */
router.get('/user', async (req, res) => {
  try {
    const data = await tiktokService.getUserInfo();

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('❌ Error in /api/tiktok/user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/tiktok/health
 * Check TikTok integration status
 */
router.get('/health', async (req, res) => {
  try {
    const hasVideoIds = !!(
      process.env.TIKTOK_VIDEO_IDS && process.env.TIKTOK_VIDEO_IDS.length > 0
    );
    const username = process.env.TIKTOK_USERNAME || 'ziza19690';

    return res.json({
      success: true,
      configured: true,
      username: username,
      hasVideoIds: hasVideoIds,
      videoCount: hasVideoIds 
        ? process.env.TIKTOK_VIDEO_IDS.split(',').length 
        : 0,
      message: hasVideoIds
        ? `Configured with ${process.env.TIKTOK_VIDEO_IDS.split(',').length} video IDs`
        : 'Using showcase videos - add TIKTOK_VIDEO_IDS to .env for your real videos',
      howToUse: 'Add TIKTOK_VIDEO_IDS=id1,id2,id3 to your .env file with video IDs from your TikTok account',
    });
  } catch (error) {
    console.error('❌ Error in /api/tiktok/health:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/tiktok/oembed
 * Fetch oEmbed data for a TikTok video URL
 * Query params:
 *   - url: Full TikTok video URL
 */
router.get('/oembed', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Video URL is required',
      });
    }

    const data = await tiktokService.getOEmbedData(url);

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('❌ Error in /api/tiktok/oembed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch oEmbed data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
