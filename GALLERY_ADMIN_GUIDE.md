# Gallery & Media Center - Admin Guide

## Overview

The Gallery & Media Center is a comprehensive media management system that allows administrators to upload, organize, and manage photos and videos. The system supports YouTube and TikTok embeds, provides a beautiful lightbox viewer with sharing capabilities, and gives admins full control over media visibility and organization.

---

## Features Implemented

### ✅ Frontend Features

#### Public Gallery Page (`/gallery`)

- **Dynamic Media Grid**: Responsive masonry-style grid layout
- **Advanced Filtering**: Filter by category, theme, and visibility
- **Lightbox Viewer**: Full-screen media viewer with:
  - Image viewing with download capability
  - YouTube/TikTok video embedding
  - Social sharing (Facebook, Twitter, Copy Link)
  - Like functionality
  - View counter
  - Tag display
- **Real-time Statistics**: Shows total media, video counts, categories
- **Loading & Error States**: Proper handling of loading and error states

#### Admin Dashboard - Media Management (`/admin-dashboard`)

- **Upload Modal**: Easy-to-use media upload form
- **Media Grid Management**: Visual grid of all media with controls
- **Edit Capability**: Full editing of media metadata
- **Visibility Toggle**: Quick public/private switching
- **Featured Toggle**: Mark media as featured
- **Category Filtering**: Filter by category and visibility
- **Bulk Operations**: Delete multiple items (via API)
- **Auto-detection**: Automatic platform detection for video URLs
- **YouTube Thumbnail**: Auto-generates thumbnails from YouTube videos

### ✅ Backend Features

#### Media Model (`server/models/Media.js`)

- **Comprehensive Schema**: Stores all media metadata
- **Indexes**: Optimized queries for fast filtering
- **Virtual Fields**: Automatic timestamp formatting
- **Support for**:
  - Images and videos
  - Multiple platforms (YouTube, TikTok)
  - Categories and themes
  - Tags and descriptions
  - Visibility control
  - Featured status
  - View and like counters

#### API Endpoints (`server/routes/media.routes.js`)

**Public Endpoints:**

- `GET /api/media` - Get all media (with filtering)
- `GET /api/media/stats` - Get media statistics
- `GET /api/media/:id` - Get single media item
- `PUT /api/media/:id/like` - Like media item

**Admin-Only Endpoints:**

- `POST /api/media` - Create new media
- `PUT /api/media/:id` - Update media
- `DELETE /api/media/:id` - Delete media
- `PUT /api/media/:id/visibility` - Toggle visibility
- `PUT /api/media/:id/feature` - Toggle featured status
- `POST /api/media/bulk-delete` - Delete multiple items

---

## How to Use - Admin Dashboard

### 1. Accessing Media Management

1. Navigate to `/admin-dashboard`
2. Click on the **"Media"** tab
3. You'll see the Media Management interface

### 2. Uploading Media

#### For Images:

1. Click **"Upload Media"** button
2. Select **"Image"** as Media Type
3. Enter the image URL (supports Unsplash, direct image URLs)
4. Fill in required fields:
   - **Event Name**: Title of the media
   - **Category**: Select from events, highlights, behind-the-scenes, portraits, other
5. Optional fields:
   - **Theme**: Competition, Performance, Training, Lifestyle, Community
   - **Location**: Where the photo was taken
   - **Tags**: Comma-separated tags for organization
   - **Description**: Brief description
   - **Visibility**: Public (visible to all) or Private (admin only)
   - **Featured**: Check to mark as featured content
6. Click **"Upload Media"**

#### For Videos (YouTube):

1. Click **"Upload Media"** button
2. Select **"Video"** as Media Type
3. Select **"YouTube"** as Platform
4. Enter YouTube URL (e.g., `https://www.youtube.com/watch?v=VIDEO_ID`)
   - System auto-detects YouTube URLs
   - Auto-generates thumbnail
5. Fill in required fields (same as images)
6. Optional: Add **Duration** (e.g., "03:41")
7. Click **"Upload Media"**

#### For Videos (TikTok):

1. Click **"Upload Media"** button
2. Select **"Video"** as Media Type
3. Select **"TikTok"** as Platform
4. Enter TikTok video URL
5. Fill in required fields
6. Click **"Upload Media"**

### 3. Managing Media

#### Edit Media:

1. Click the **"Edit"** button on any media card
2. Update any fields you want to change
3. Click **"Update Media"**

#### Toggle Visibility:

- Click **"Hide"** to make public media private
- Click **"Show"** to make private media public
- Changes are instant

#### Toggle Featured Status:

- Click the **star icon** (⭐/☆) to feature/unfeature media
- Featured media appears first in the gallery

#### Delete Media:

- Click the **trash icon** (🗑️)
- Confirm the deletion
- Media is permanently removed

### 4. Filtering Media

Use the filter dropdowns to:

- **Filter by Category**: View specific categories only
- **Filter by Visibility**: See only public, private, or all media
- Filters update the grid in real-time

---

## How to Use - Public Gallery

### Viewing Media

1. Navigate to `/gallery`
2. Browse the dynamic grid layout
3. Click any media item to open the lightbox viewer

### Filtering Content

- Use **Category Filter**: Filter by events, highlights, etc.
- Use **Theme Filter**: Filter by Competition, Performance, etc.
- Filters can be combined for precise searching

### Lightbox Features

- **Images**: View in full quality, download with one click
- **Videos**: Embedded player with platform branding
- **Like**: Click heart icon to like (tracked in database)
- **Share**: Share to Facebook, Twitter, or copy link
- **Info**: View all metadata, tags, location, stats

---

## API Usage Examples

### Fetch All Public Media

```javascript
const response = await fetch("/api/media?visibility=public");
const data = await response.json();
console.log(data.media);
```

### Fetch Media by Category

```javascript
const response = await fetch("/api/media?category=events&visibility=public");
const data = await response.json();
```

### Create New Media (Admin Only)

```javascript
const response = await fetch("/api/media", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    type: "image",
    url: "https://example.com/image.jpg",
    event: "Epic Event Name",
    category: "events",
    tags: ["awesome", "epic"],
    visibility: "public",
    featured: true,
  }),
});
```

### Toggle Visibility (Admin Only)

```javascript
const response = await fetch(`/api/media/${mediaId}/visibility`, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## Database Schema

### Media Collection

```javascript
{
  _id: ObjectId,
  type: 'image' | 'video',
  platform: 'youtube' | 'tiktok' | null,
  url: String,
  thumbnail: String,
  category: 'events' | 'highlights' | 'behind-the-scenes' | 'portraits' | 'other',
  event: String,
  location: String,
  theme: 'Competition' | 'Performance' | 'Training' | 'Lifestyle' | 'Community',
  tags: [String],
  visibility: 'public' | 'private',
  duration: String,
  description: String,
  uploadedBy: ObjectId (ref: User),
  views: Number,
  likes: Number,
  featured: Boolean,
  sortOrder: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Media Utils Functions

Located in `src/utils/mediaUtils.js`:

- `parseYouTubeUrl(url)` - Extract video ID from YouTube URL
- `parseTikTokUrl(url)` - Extract video ID from TikTok URL
- `getYouTubeEmbedUrl(url)` - Convert to embed URL
- `getTikTokEmbedUrl(url)` - Convert to embed URL
- `detectVideoPlatform(url)` - Auto-detect YouTube/TikTok
- `getYouTubeThumbnail(videoId)` - Get thumbnail URL
- `isValidMediaUrl(url, type)` - Validate media URLs
- `formatTags(tags)` - Format tag strings/arrays
- `getShareUrl(platform, url, text)` - Generate share URLs

---

## Supported Media Formats

### Images

- Direct URLs (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`)
- Unsplash URLs
- Any publicly accessible image URL

### Videos

- **YouTube**: All standard YouTube URL formats
  - `youtube.com/watch?v=VIDEO_ID`
  - `youtu.be/VIDEO_ID`
  - `youtube.com/embed/VIDEO_ID`
- **TikTok**: Standard TikTok video URLs
  - `tiktok.com/@user/video/VIDEO_ID`

---

## Best Practices

### For Admins

1. **Organize with Categories & Themes**: Use consistent categorization
2. **Use Descriptive Event Names**: Makes searching easier
3. **Add Relevant Tags**: Helps with filtering and discovery
4. **Write Descriptions**: Provides context for viewers
5. **Feature Important Content**: Use featured status for highlights
6. **Manage Visibility**: Keep draft content private until ready
7. **Regular Cleanup**: Delete outdated or irrelevant media

### For Content

1. **High-Quality Images**: Use high-resolution images for best presentation
2. **Proper Video URLs**: Always use original platform URLs
3. **Consistent Naming**: Use consistent event naming conventions
4. **Location Data**: Add location when relevant
5. **Accurate Duration**: For videos, include duration for user convenience

---

## Troubleshooting

### Media Not Appearing

- Check visibility is set to "public"
- Verify the URL is valid and accessible
- Check browser console for errors

### Video Not Embedding

- Ensure URL is from YouTube or TikTok
- Verify the video is publicly accessible
- Check if the video allows embedding

### Upload Fails

- Verify you're logged in as admin
- Check URL is valid for media type
- Ensure all required fields are filled

### Thumbnails Not Showing

- YouTube thumbnails are auto-generated
- For TikTok, thumbnails may need manual URL
- Check image URLs are publicly accessible

---

## Security Notes

- All admin endpoints require authentication and admin role
- Media uploads validate URLs (no file upload to prevent security issues)
- Public endpoints only show public visibility media
- Admin filtering shows all media regardless of visibility

---

## Performance Optimizations

- Database indexes on category, visibility, theme, tags
- Pagination support for large media collections
- Lazy loading of media grid
- Optimized queries with lean() for faster responses
- Cached statistics endpoint

---

## Future Enhancements

Potential improvements for future versions:

- Direct file upload support
- Image CDN integration
- Video transcoding
- Advanced search with Elasticsearch
- Media collections/albums
- Collaborative tagging
- AI-powered auto-tagging
- Media analytics dashboard
- Scheduled publishing
- Watermarking support

---

## Support

For issues or questions:

1. Check this documentation
2. Review console logs for errors
3. Verify API endpoints are responding
4. Check MongoDB connection
5. Ensure proper authentication tokens

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Maintained By**: les kick't Development Team
