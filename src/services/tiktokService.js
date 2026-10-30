/**
 * TikTok API Service (Frontend)
 * Communicates with backend API to fetch TikTok data securely
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class TikTokService {
  constructor() {
    this.apiBase = `${API_BASE}/api/tiktok`;
  }

  /**
   * Fetch user videos from backend
   */
  async getUserVideos(username, maxCount = 20) {
    try {
      const response = await fetch(
        `${this.apiBase}/videos?maxCount=${maxCount}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch videos');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching TikTok videos:', error);
      throw error;
    }
  }

  /**
   * Get video information by video ID
   */
  async getVideoInfo(videoIds) {
    try {
      const videoIdArray = Array.isArray(videoIds) ? videoIds : [videoIds];
      const videoId = videoIdArray[0]; // For now, handle single video

      const response = await fetch(`${this.apiBase}/video/${videoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch video info: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch video info');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching TikTok video info:', error);
      throw error;
    }
  }

  /**
   * Search for videos
   */
  async searchVideos(query, maxCount = 20, daysAgo = 30) {
    try {
      const response = await fetch(`${this.apiBase}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          maxCount,
          daysAgo,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Search failed');
      }

      return result.data;
    } catch (error) {
      console.error('Error searching TikTok videos:', error);
      throw error;
    }
  }

  /**
   * Get user info
   */
  async getUserInfo() {
    try {
      const response = await fetch(`${this.apiBase}/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch user info');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching TikTok user info:', error);
      throw error;
    }
  }

  /**
   * Check TikTok API health/configuration
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.apiBase}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error checking TikTok API health:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const tiktokService = new TikTokService();
export default tiktokService;
