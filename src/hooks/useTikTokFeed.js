import { useState, useEffect, useCallback } from 'react';
import tiktokService from '../services/tiktokService';

/**
 * Custom hook for fetching and managing TikTok feed data
 * @param {Object} options - Configuration options
 * @param {string} options.username - TikTok username to fetch videos from
 * @param {number} options.maxCount - Maximum number of videos to fetch
 * @param {number} options.refreshInterval - Auto-refresh interval in milliseconds (0 to disable)
 * @returns {Object} Feed data and control functions
 */
export const useTikTokFeed = ({
  username = '@ziza19690',
  maxCount = 10,
  refreshInterval = 0
} = {}) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Fetch videos from backend API
   */
  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await tiktokService.getUserVideos(username, maxCount);

      // The backend returns { videos: [...], has_more, cursor }
      if (response && response.videos && Array.isArray(response.videos)) {
        setVideos(response.videos);
        setLastUpdated(new Date());
      } else {
        console.warn('TikTok API response format unexpected:', response);
        // Fallback to mock data
        setVideos(getMockVideos());
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching TikTok feed:', err);
      setError(err.message || 'Failed to load TikTok feed');
      // Always use mock data as fallback
      setVideos(getMockVideos());
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, [username, maxCount]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(() => {
    fetchVideos();
  }, [fetchVideos]);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  /**
   * Auto-refresh interval
   */
  useEffect(() => {
    if (refreshInterval > 0) {
      const intervalId = setInterval(() => {
        fetchVideos();
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, fetchVideos]);

  return {
    videos,
    loading,
    error,
    lastUpdated,
    refresh,
  };
};

/**
 * Mock data for development/testing
 */
function getMockVideos() {
  return [
    {
      id: '7340896964509691182',
      title: 'Amazing soccer skills compilation! ⚽',
      description: 'Check out these incredible moves from our latest training session #soccer #skills #letskickit',
      cover_image_url: 'https://via.placeholder.com/300x400/000000/FFFFFF?text=Video+1',
      video_description: 'Amazing soccer skills compilation! ⚽',
      duration: 45,
      create_time: Date.now() - 3600000,
      share_count: 1234,
      view_count: 45678,
      like_count: 3456,
      comment_count: 234,
      embed_link: 'https://www.tiktok.com/embed/v2/7340896964509691182',
    },
    {
      id: '7340896964509691183',
      title: 'Match highlights from last weekend',
      description: 'Epic moments from our championship game! #soccer #highlights #victory',
      cover_image_url: 'https://via.placeholder.com/300x400/000000/FFFFFF?text=Video+2',
      video_description: 'Match highlights from last weekend',
      duration: 60,
      create_time: Date.now() - 7200000,
      share_count: 2345,
      view_count: 67890,
      like_count: 5678,
      comment_count: 456,
      embed_link: 'https://www.tiktok.com/embed/v2/7340896964509691183',
    },
    {
      id: '7340896964509691184',
      title: 'Behind the scenes training',
      description: 'See how our team prepares for the big games! #training #behindthescenes #teamwork',
      cover_image_url: 'https://via.placeholder.com/300x400/000000/FFFFFF?text=Video+3',
      video_description: 'Behind the scenes training',
      duration: 30,
      create_time: Date.now() - 10800000,
      share_count: 890,
      view_count: 23456,
      like_count: 1890,
      comment_count: 123,
      embed_link: 'https://www.tiktok.com/embed/v2/7340896964509691184',
    },
    {
      id: '7340896964509691185',
      title: 'Fan reactions compilation',
      description: 'Your support means everything! Thank you fans! ❤️ #fans #support #community',
      cover_image_url: 'https://via.placeholder.com/300x400/000000/FFFFFF?text=Video+4',
      video_description: 'Fan reactions compilation',
      duration: 55,
      create_time: Date.now() - 14400000,
      share_count: 1567,
      view_count: 34567,
      like_count: 2890,
      comment_count: 345,
      embed_link: 'https://www.tiktok.com/embed/v2/7340896964509691185',
    },
  ];
}

export default useTikTokFeed;
