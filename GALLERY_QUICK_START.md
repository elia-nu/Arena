# Gallery & Media Center - Quick Start Guide

## 🚀 What's New

A complete media management system with admin controls for managing photos and videos from YouTube and TikTok!

---

## 📁 Files Created/Modified

### Backend
- ✨ **NEW**: `server/models/Media.js` - Media database model
- ✨ **NEW**: `server/routes/media.routes.js` - API endpoints
- 🔄 **UPDATED**: `server/index.js` - Added media routes

### Frontend
- 🔄 **UPDATED**: `src/services/api.js` - Added mediaAPI functions
- 🔄 **UPDATED**: `src/components/admin/MediaManagement.jsx` - Full backend integration
- 🔄 **UPDATED**: `src/pages/Gallery.jsx` - Dynamic data loading
- 🔄 **UPDATED**: `src/components/gallery/LightboxViewer.jsx` - Enhanced features

### Documentation
- ✨ **NEW**: `GALLERY_ADMIN_GUIDE.md` - Comprehensive admin guide
- ✨ **NEW**: `GALLERY_QUICK_START.md` - This file

---

## ⚡ Quick Start

### 1. Start Your Server
```bash
cd server
npm start
```

### 2. Access Admin Dashboard
1. Navigate to: `http://localhost:5173/admin-dashboard`
2. Click the **"Media"** tab
3. Click **"Upload Media"** button

### 3. Upload Your First Image
```
Type: Image
URL: https://images.unsplash.com/photo-1514525253161-7a46d19cd819
Event Name: My First Gallery Item
Category: events
Visibility: public
```

### 4. Upload Your First YouTube Video
```
Type: Video
Platform: YouTube
URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
Event Name: Amazing Video
Category: highlights
Visibility: public
```

### 5. View Public Gallery
Navigate to: `http://localhost:5173/gallery`

---

## 🎯 Key Features

### Admin Dashboard
- ✅ Upload images and videos
- ✅ Edit media metadata
- ✅ Toggle visibility (public/private)
- ✅ Feature important content
- ✅ Filter by category and visibility
- ✅ Delete unwanted media
- ✅ Tag organization
- ✅ Theme categorization

### Public Gallery
- ✅ Beautiful masonry grid layout
- ✅ Category & theme filters
- ✅ Lightbox viewer with video embeds
- ✅ Social sharing (Facebook, Twitter, Link)
- ✅ Like functionality
- ✅ View counter
- ✅ Download images
- ✅ Real-time statistics

### Video Platform Support
- ✅ YouTube embedding
- ✅ TikTok embedding
- ✅ Auto-detect platform from URL
- ✅ Auto-generate YouTube thumbnails
- ✅ Platform badges on videos

---

## 📊 API Endpoints

### Public (No Auth Required)
```
GET    /api/media                  - Get all public media
GET    /api/media/stats            - Get statistics
GET    /api/media/:id              - Get single media
PUT    /api/media/:id/like         - Like media
```

### Admin Only (Requires Auth + Admin Role)
```
POST   /api/media                  - Create media
PUT    /api/media/:id              - Update media
DELETE /api/media/:id              - Delete media
PUT    /api/media/:id/visibility   - Toggle visibility
PUT    /api/media/:id/feature      - Toggle featured
POST   /api/media/bulk-delete      - Delete multiple
```

---

## 🔐 Authentication

All admin endpoints require:
1. Valid JWT token in Authorization header
2. User role = "admin"

Example:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 🏷️ Categories & Themes

### Categories
- `events` - Event photos/videos
- `highlights` - Best moments
- `behind-the-scenes` - BTS content
- `portraits` - Individual shots
- `other` - Miscellaneous

### Themes
- `Competition` - Competitive events
- `Performance` - Performances
- `Training` - Training sessions
- `Lifestyle` - Lifestyle content
- `Community` - Community events

---

## 🎨 Supported Media

### Images
- Direct URLs (.jpg, .jpeg, .png, .gif, .webp)
- Unsplash URLs
- Any publicly accessible image URL

### Videos
- YouTube (all formats)
- TikTok videos

---

## 💡 Pro Tips

### For Best Results:
1. **Use High-Quality Images**: Better user experience
2. **Add Descriptive Tags**: Easier to find content
3. **Write Event Names Clearly**: Makes browsing easier
4. **Use Featured Status**: Highlight important content
5. **Organize by Category**: Keep content organized
6. **Add Locations**: Provides context
7. **Include Descriptions**: Tell the story

### Video URLs:
- YouTube: `https://www.youtube.com/watch?v=VIDEO_ID`
- TikTok: `https://www.tiktok.com/@user/video/VIDEO_ID`
- System auto-detects platform
- YouTube thumbnails auto-generated

---

## 🐛 Common Issues

### "Media not showing in gallery"
→ Check visibility is set to "public"

### "Video won't embed"
→ Ensure video is from YouTube or TikTok
→ Check video allows embedding

### "Upload button doesn't work"
→ Verify you're logged in as admin
→ Check all required fields are filled

### "Can't delete media"
→ Ensure you have admin privileges
→ Check network connection

---

## 📱 Mobile Support

- Fully responsive design
- Touch-friendly interface
- Optimized grid layout
- Swipe gestures in lightbox

---

## 🔄 Workflow Example

### Publishing Event Photos:

1. **After Event**: Collect photos
2. **Admin Dashboard**: Upload to media library
   - Set visibility to "private" while organizing
   - Add tags, categories, themes
   - Write descriptions
3. **Review**: Check gallery with filters
4. **Publish**: Toggle visibility to "public"
5. **Feature**: Mark best content as featured
6. **Share**: Copy links to share on social media

---

## 📈 Analytics

View media statistics:
- Total media count
- Images vs videos
- Platform breakdown (YouTube/TikTok)
- Category distribution
- Theme distribution

---

## 🚀 What's Next?

After uploading media:
1. Share gallery link with community
2. Encourage likes and engagement
3. Monitor view counts
4. Feature popular content
5. Keep adding fresh content regularly

---

## 📞 Need Help?

1. Read the full guide: `GALLERY_ADMIN_GUIDE.md`
2. Check browser console for errors
3. Verify MongoDB connection
4. Test API endpoints directly
5. Check authentication tokens

---

## ✨ Features at a Glance

| Feature | Status | Description |
|---------|--------|-------------|
| Image Upload | ✅ | Direct URL upload |
| Video Embedding | ✅ | YouTube & TikTok |
| Lightbox Viewer | ✅ | Full-screen media view |
| Social Sharing | ✅ | FB, Twitter, Link |
| Like System | ✅ | Track engagement |
| View Counter | ✅ | Track popularity |
| Categories | ✅ | Organize by type |
| Themes | ✅ | Organize by theme |
| Tags | ✅ | Custom tagging |
| Featured Content | ✅ | Highlight important media |
| Visibility Control | ✅ | Public/Private toggle |
| Admin CRUD | ✅ | Full control |
| Filtering | ✅ | Category & theme filters |
| Statistics | ✅ | Real-time stats |
| Mobile Support | ✅ | Fully responsive |

---

**Ready to start? Upload your first media now!** 🎉

Navigate to: `/admin-dashboard` → Media tab → Upload Media

