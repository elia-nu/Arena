# TikTok Live Feed Integration

This project includes a live TikTok feed integration that displays real-time videos from your TikTok account.

## Features

- Real-time video feed from TikTok account
- Auto-refresh capability (configurable interval)
- Manual refresh button
- Video engagement metrics (views, likes, comments)
- Responsive grid layout
- Click tracking via analytics context
- Fallback to mock data in development mode

## Setup Instructions

### 1. TikTok Developer Account Setup

1. Go to [TikTok Developers](https://developers.tiktok.com/)
2. Sign in or create a developer account
3. Create a new app in the TikTok Developer Portal
4. Configure your app settings:
   - Set up redirect URLs
   - Configure scopes/permissions needed
   - Note down your Client Key and Client Secret

### 2. Environment Configuration

The TikTok credentials have already been added to your `.env` file:

```env
VITE_TIKTOK_CLIENT_KEY=sbawdhuzhI8wzn68mp
VITE_TIKTOK_CLIENT_SECRET=ItI4vu27zIXwBIrGbNqPTEEBqHHZshdH
```

**Note:** These credentials are from your sandbox environment (@ziza19690).

### 3. Production Deployment

When deploying to production:

1. Add the environment variables to your hosting platform (Vercel, Netlify, etc.)
2. Ensure the TikTok app is approved and moved from Sandbox to Production mode
3. Update the username in [Social.jsx](src/pages/Social.jsx) if needed

## File Structure

```
src/
├── services/
│   └── tiktokService.js          # TikTok API service with authentication
├── hooks/
│   └── useTikTokFeed.js          # Custom hook for fetching TikTok videos
├── components/
│   └── social/
│       └── TikTokLiveFeed.jsx    # TikTok feed display component
└── pages/
    └── Social.jsx                # Social page with TikTok integration
```

## Component Usage

### Basic Usage

```jsx
import TikTokLiveFeed from '../components/social/TikTokLiveFeed';

function MyPage() {
  return (
    <TikTokLiveFeed
      username="@ziza19690"
      maxVideos={6}
      autoRefresh={true}
      refreshInterval={300000} // 5 minutes
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| username | string | '@ziza19690' | TikTok username to fetch videos from |
| maxVideos | number | 6 | Maximum number of videos to display |
| autoRefresh | boolean | true | Enable automatic refresh |
| refreshInterval | number | 300000 | Refresh interval in milliseconds (5 min) |

## API Service

The `tiktokService` handles:

- OAuth authentication using Client Credentials flow
- Token management and auto-renewal
- Video fetching and querying
- User information retrieval
- Video search capabilities

### Available Methods

```javascript
import tiktokService from './services/tiktokService';

// Get access token
const token = await tiktokService.getClientAccessToken();

// Fetch user videos
const videos = await tiktokService.getUserVideos('@username', 10);

// Get video info by ID
const videoInfo = await tiktokService.getVideoInfo(['video_id_1', 'video_id_2']);

// Search videos
const searchResults = await tiktokService.searchVideos('soccer', 20);

// Get user info
const userInfo = await tiktokService.getUserInfo();
```

## Analytics Tracking

The integration automatically tracks:

- Video clicks
- Manual refresh actions
- View counts
- Engagement metrics

All events are sent to the `SocialAnalyticsContext` for centralized tracking.

## Development Mode

In development mode, if the API fails to fetch data, the component will automatically fall back to mock data to help with UI development and testing.

## API Limitations

- **Client Credentials Flow**: Only provides access to public content
- **User Authorization Flow**: Required for private content and user-specific data
- **Rate Limits**: Check TikTok API documentation for current rate limits
- **Sandbox Mode**: Limited functionality until app is approved for production

## Troubleshooting

### Videos Not Loading

1. Check that environment variables are set correctly
2. Verify your TikTok app is active in the developer portal
3. Check browser console for API errors
4. Ensure your app has the correct scopes/permissions

### Authentication Errors

1. Verify Client Key and Client Secret are correct
2. Check if your access token has expired
3. Ensure your app is not rate-limited

### Embed Issues

1. TikTok embeds require proper CORS configuration
2. Some videos may have embedding disabled by the creator
3. Check that the video IDs are valid and public

## Security Notes

- Never commit `.env` file to version control
- Use `.env.example` as a template
- Rotate credentials regularly
- Monitor API usage in TikTok Developer Portal

## Resources

- [TikTok for Developers](https://developers.tiktok.com/)
- [TikTok API Documentation](https://developers.tiktok.com/doc/)
- [Login Kit Documentation](https://developers.tiktok.com/doc/login-kit-web/)
- [Display API Documentation](https://developers.tiktok.com/doc/display-api-get-started/)

## Support

For issues or questions:
1. Check TikTok API documentation
2. Review error messages in browser console
3. Contact TikTok Developer Support
