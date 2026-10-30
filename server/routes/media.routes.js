import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Media from "../models/Media.js";
import MediaTheme from "../models/MediaTheme.js";
import MediaCategory from "../models/MediaCategory.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import { mediaUploadDir } from "../utils/uploadPaths.js";

const router = express.Router();

const DEFAULT_THEMES = [
  "Competition",
  "Performance",
  "Training",
  "Lifestyle",
  "Community",
];
const DEFAULT_CATEGORIES = [
  "events",
  "highlights",
  "behind-the-scenes",
  "portraits",
  "other",
];

const slugifyCategoryValue = (value) => {
  if (value === undefined || value === null) return "";
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(mediaUploadDir, { recursive: true });
    cb(null, mediaUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB max for images and video clips
  },
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    if (isImage || isVideo) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are supported"), false);
    }
  },
});

// Public gallery (and its stats) omit items tied only to an event page (tournament id in `event`).
const galleryPublicMatch = () => ({
  visibility: "public",
  $nor: [{ event: { $regex: /^[a-f0-9]{24}$/, $options: "i" } }],
});

// @route   GET /api/media
// @desc    Get all media items (public or filtered)
// @access  Public
router.get("/", async (req, res) => {
  try {
    const {
      category,
      theme,
      visibility,
      type,
      platform,
      tags,
      featured,
      limit,
      page,
      event,
      scope,
    } = req.query;

    // Build query
    const query = {};

    // Non-admins only see public media (unless they pass visibility while admin)
    if (req.user?.role !== "admin") {
      query.visibility = "public";
    } else if (visibility) {
      query.visibility = visibility;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (theme && theme !== "all") {
      query.theme = theme;
    }

    if (type) {
      query.type = type;
    }

    if (platform) {
      query.platform = platform;
    }

    if (featured) {
      query.featured = featured === "true";
    }

    if (tags) {
      query.tags = { $in: tags.split(",") };
    }

    if (event) {
      query.event = event;
    }

    // Allow explicit source scoping for admin pages:
    // - scope=event   => items linked to a tournament id
    // - scope=general => items created in Media Management (non-tournament event labels)
    if (scope === "event") {
      query.event = { $regex: /^[a-f0-9]{24}$/, $options: "i" };
    } else if (scope === "general") {
      query.event = { $not: /^[a-f0-9]{24}$/i };
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const media = await Media.find(query)
      .sort({ featured: -1, sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("uploadedBy", "name email")
      .lean();

    // Get total count for pagination
    const total = await Media.countDocuments(query);

    res.json({
      media,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    res
      .status(500)
      .json({ message: "Error fetching media", error: error.message });
  }
});

// @route   GET /api/media/stats
// @desc    Get media statistics
// @access  Public
router.get("/stats", async (req, res) => {
  try {
    const base = galleryPublicMatch();
    const totalMedia = await Media.countDocuments(base);
    const totalImages = await Media.countDocuments({ ...base, type: "image" });
    const totalVideos = await Media.countDocuments({ ...base, type: "video" });
    const totalYouTube = await Media.countDocuments({
      ...base,
      platform: "youtube",
    });
    const totalTikTok = await Media.countDocuments({
      ...base,
      platform: "tiktok",
    });

    const categoryCounts = await Media.aggregate([
      { $match: base },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const themeCounts = await Media.aggregate([
      { $match: { ...base, theme: { $ne: "" } } },
      { $group: { _id: "$theme", count: { $sum: 1 } } },
    ]);

    res.json({
      total: totalMedia,
      images: totalImages,
      videos: totalVideos,
      youtube: totalYouTube,
      tiktok: totalTikTok,
      byCategory: categoryCounts,
      byTheme: themeCounts,
    });
  } catch (error) {
    console.error("Error fetching media stats:", error);
    res
      .status(500)
      .json({ message: "Error fetching stats", error: error.message });
  }
});

// =========================
// Media Themes CRUD
// =========================
router.get("/themes", async (req, res) => {
  try {
    const count = await MediaTheme.countDocuments();
    if (count === 0) {
      await MediaTheme.insertMany(DEFAULT_THEMES.map((value) => ({ value })));
    }

    const themes = await MediaTheme.find()
      .sort({ sortOrder: 1, value: 1 })
      .lean();

    res.json({ themes });
  } catch (error) {
    console.error("Error fetching media themes:", error);
    res.status(500).json({
      message: "Error fetching media themes",
      error: error.message,
    });
  }
});

router.post("/themes", protect, adminOnly, async (req, res) => {
  try {
    const { value, sortOrder } = req.body;
    const themeValue = (value || "").toString().trim();
    const themeSortOrder =
      sortOrder === undefined || sortOrder === null ? 0 : Number(sortOrder);

    if (!themeValue) {
      return res.status(400).json({ message: "Theme value is required" });
    }

    const theme = await MediaTheme.create({
      value: themeValue,
      sortOrder: Number.isFinite(themeSortOrder) ? themeSortOrder : 0,
    });

    res.status(201).json({ theme });
  } catch (error) {
    console.error("Error creating media theme:", error);
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Theme already exists" });
    }
    res.status(500).json({
      message: "Error creating media theme",
      error: error.message,
    });
  }
});

router.put("/themes/:id", protect, adminOnly, async (req, res) => {
  try {
    const { value, sortOrder } = req.body;
    const theme = await MediaTheme.findById(req.params.id);

    if (!theme) return res.status(404).json({ message: "Theme not found" });

    const oldValue = theme.value;
    const newValue = (value || "").toString().trim();
    const newSortOrder =
      sortOrder === undefined || sortOrder === null
        ? theme.sortOrder
        : Number(sortOrder);

    if (!newValue) {
      return res.status(400).json({ message: "Theme value is required" });
    }

    theme.value = newValue;
    theme.sortOrder = Number.isFinite(newSortOrder) ? newSortOrder : 0;

    await theme.save();

    // Keep existing Media items in sync when renaming a theme.
    if (oldValue !== newValue) {
      await Media.updateMany(
        { theme: oldValue },
        { $set: { theme: newValue } },
      );
    }

    res.json({ theme });
  } catch (error) {
    console.error("Error updating media theme:", error);
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Theme already exists" });
    }
    res.status(500).json({
      message: "Error updating media theme",
      error: error.message,
    });
  }
});

router.delete("/themes/:id", protect, adminOnly, async (req, res) => {
  try {
    const theme = await MediaTheme.findById(req.params.id);
    if (!theme) return res.status(404).json({ message: "Theme not found" });

    const deletedValue = theme.value;

    // Clear the theme from existing media items.
    await Media.updateMany({ theme: deletedValue }, { $set: { theme: "" } });

    await theme.deleteOne();

    res.json({ message: "Theme deleted successfully" });
  } catch (error) {
    console.error("Error deleting media theme:", error);
    res.status(500).json({
      message: "Error deleting media theme",
      error: error.message,
    });
  }
});

// =========================
// Media Categories CRUD
// =========================
router.get("/categories", async (req, res) => {
  try {
    const count = await MediaCategory.countDocuments();
    if (count === 0) {
      await MediaCategory.insertMany(
        DEFAULT_CATEGORIES.map((value) => ({ value })),
      );
    }

    const categories = await MediaCategory.find()
      .sort({ sortOrder: 1, value: 1 })
      .lean();

    res.json({ categories });
  } catch (error) {
    console.error("Error fetching media categories:", error);
    res.status(500).json({
      message: "Error fetching media categories",
      error: error.message,
    });
  }
});

router.post("/categories", protect, adminOnly, async (req, res) => {
  try {
    const { value, sortOrder } = req.body;
    const categoryValue = slugifyCategoryValue(value);
    const categorySortOrder =
      sortOrder === undefined || sortOrder === null ? 0 : Number(sortOrder);

    if (!categoryValue) {
      return res.status(400).json({ message: "Category value is required" });
    }

    const category = await MediaCategory.create({
      value: categoryValue,
      sortOrder: Number.isFinite(categorySortOrder) ? categorySortOrder : 0,
    });

    res.status(201).json({ category });
  } catch (error) {
    console.error("Error creating media category:", error);
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Category already exists" });
    }
    res.status(500).json({
      message: "Error creating media category",
      error: error.message,
    });
  }
});

router.put("/categories/:id", protect, adminOnly, async (req, res) => {
  try {
    const { value, sortOrder } = req.body;
    const category = await MediaCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const oldValue = category.value;
    const newValue = slugifyCategoryValue(value);
    const newSortOrder =
      sortOrder === undefined || sortOrder === null
        ? category.sortOrder
        : Number(sortOrder);

    if (!newValue) {
      return res.status(400).json({ message: "Category value is required" });
    }

    category.value = newValue;
    category.sortOrder = Number.isFinite(newSortOrder) ? newSortOrder : 0;

    await category.save();

    // Keep existing Media items in sync when renaming a category.
    if (oldValue !== newValue) {
      await Media.updateMany(
        { category: oldValue },
        { $set: { category: newValue } },
      );
    }

    res.json({ category });
  } catch (error) {
    console.error("Error updating media category:", error);
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Category already exists" });
    }
    res.status(500).json({
      message: "Error updating media category",
      error: error.message,
    });
  }
});

router.delete("/categories/:id", protect, adminOnly, async (req, res) => {
  try {
    const category = await MediaCategory.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const deletedValue = category.value;

    if (deletedValue === "other") {
      return res
        .status(400)
        .json({ message: 'Cannot delete the default category "other"' });
    }

    // Reassign existing media items to the default category.
    await Media.updateMany(
      { category: deletedValue },
      { $set: { category: "other" } },
    );

    await category.deleteOne();

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting media category:", error);
    res.status(500).json({
      message: "Error deleting media category",
      error: error.message,
    });
  }
});

// @route   GET /api/media/:id
// @desc    Get single media item by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const media = await Media.findById(req.params.id).populate(
      "uploadedBy",
      "name email",
    );

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    // Increment view count
    media.views += 1;
    await media.save();

    res.json(media);
  } catch (error) {
    console.error("Error fetching media:", error);
    res
      .status(500)
      .json({ message: "Error fetching media", error: error.message });
  }
});

// @route   POST /api/media/upload
// @desc    Upload a media file (image or video) and return its URL
// @access  Admin only
router.post(
  "/upload",
  protect,
  adminOnly,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "File is too large. Maximum size is 200MB." });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message || "File upload failed" });
      }
      next();
    });
  },
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const url = `/uploads/media/${req.file.filename}`;
      const isVideo = req.file.mimetype.startsWith("video/");

      res.status(201).json({
        url,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        mediaType: isVideo ? "video" : "image",
      });
    } catch (error) {
      console.error("Error uploading media file:", error);
      res
        .status(500)
        .json({ message: "Error uploading media file", error: error.message });
    }
  },
);

// @route   POST /api/media
// @desc    Create new media item
// @access  Admin only
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const {
      type,
      platform,
      url,
      thumbnail,
      category,
      event,
      location,
      theme,
      tags,
      visibility,
      duration,
      description,
      featured,
      sortOrder,
    } = req.body;

    // Validate required fields
    if (!type || !url || !event) {
      return res.status(400).json({
        message: "Missing required fields: type, url, and event are required",
      });
    }

    // Auto-resolve video platform if not provided
    let resolvedPlatform = platform || null;
    if (type === "video") {
      if (!resolvedPlatform) {
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
          resolvedPlatform = "youtube";
        } else if (lowerUrl.includes("tiktok.com")) {
          resolvedPlatform = "tiktok";
        } else if (
          lowerUrl.startsWith("/uploads/") ||
          /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(lowerUrl)
        ) {
          resolvedPlatform = "direct";
        }
      }
    }

    // Auto-resolve thumbnail
    let resolvedThumbnail = thumbnail ? String(thumbnail).trim() : "";
    if (type === "video" && resolvedPlatform === "youtube" && !resolvedThumbnail) {
      const match = url.match(
        /(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
      );
      if (match && match[1]) {
        resolvedThumbnail = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
      }
    } else if (type === "image" && !resolvedThumbnail) {
      resolvedThumbnail = url;
    }

    // Create new media
    const media = new Media({
      type,
      platform: resolvedPlatform,
      url,
      thumbnail: resolvedThumbnail || null,
      category: category || "events",
      event,
      location: location || "",
      theme: theme || "",
      tags: Array.isArray(tags) ? tags : [],
      visibility: visibility || "public",
      duration: duration || "",
      description: description || "",
      featured: featured || false,
      sortOrder: sortOrder || 0,
      uploadedBy: req.user._id,
    });

    await media.save();

    const populatedMedia = await Media.findById(media._id).populate(
      "uploadedBy",
      "name email",
    );

    res.status(201).json(populatedMedia);
  } catch (error) {
    console.error("Error creating media:", error);
    res
      .status(500)
      .json({ message: "Error creating media", error: error.message });
  }
});

// @route   PUT /api/media/:id
// @desc    Update media item
// @access  Admin only
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const {
      type,
      platform,
      url,
      thumbnail,
      category,
      event,
      location,
      theme,
      tags,
      visibility,
      duration,
      description,
      featured,
      sortOrder,
    } = req.body;

    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    // Update fields
    if (type) media.type = type;
    if (url) media.url = url;

    // Platform detection / update
    if (platform !== undefined) {
      media.platform = platform;
    } else if (media.type === "video") {
      const lowerUrl = media.url.toLowerCase();
      if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
        media.platform = "youtube";
      } else if (lowerUrl.includes("tiktok.com")) {
        media.platform = "tiktok";
      } else if (
        lowerUrl.startsWith("/uploads/") ||
        /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(lowerUrl)
      ) {
        media.platform = "direct";
      }
    }

    // Thumbnail update
    if (thumbnail !== undefined && thumbnail !== "") {
      media.thumbnail = thumbnail;
    } else if (media.type === "video" && media.platform === "youtube" && !media.thumbnail) {
      const match = media.url.match(
        /(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
      );
      if (match && match[1]) {
        media.thumbnail = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
      }
    } else if (media.type === "image" && !media.thumbnail) {
      media.thumbnail = media.url;
    }

    if (category) media.category = category;
    if (event) media.event = event;
    if (location !== undefined) media.location = location;
    if (theme !== undefined) media.theme = theme;
    if (tags) media.tags = Array.isArray(tags) ? tags : [];
    if (visibility) media.visibility = visibility;
    if (duration !== undefined) media.duration = duration;
    if (description !== undefined) media.description = description;
    if (featured !== undefined) media.featured = featured;
    if (sortOrder !== undefined) media.sortOrder = sortOrder;

    await media.save();

    const populatedMedia = await Media.findById(media._id).populate(
      "uploadedBy",
      "name email",
    );

    res.json(populatedMedia);
  } catch (error) {
    console.error("Error updating media:", error);
    res
      .status(500)
      .json({ message: "Error updating media", error: error.message });
  }
});

// @route   DELETE /api/media/:id
// @desc    Delete media item
// @access  Admin only
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    await media.deleteOne();

    res.json({ message: "Media deleted successfully" });
  } catch (error) {
    console.error("Error deleting media:", error);
    res
      .status(500)
      .json({ message: "Error deleting media", error: error.message });
  }
});

// @route   PUT /api/media/:id/visibility
// @desc    Toggle media visibility
// @access  Admin only
router.put("/:id/visibility", protect, adminOnly, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    media.visibility = media.visibility === "public" ? "private" : "public";
    await media.save();

    res.json(media);
  } catch (error) {
    console.error("Error toggling visibility:", error);
    res
      .status(500)
      .json({ message: "Error toggling visibility", error: error.message });
  }
});

// @route   PUT /api/media/:id/feature
// @desc    Toggle media featured status
// @access  Admin only
router.put("/:id/feature", protect, adminOnly, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    media.featured = !media.featured;
    await media.save();

    res.json(media);
  } catch (error) {
    console.error("Error toggling featured status:", error);
    res
      .status(500)
      .json({
        message: "Error toggling featured status",
        error: error.message,
      });
  }
});

// @route   PUT /api/media/:id/like
// @desc    Increment media like count
// @access  Public
router.put("/:id/like", async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    media.likes += 1;
    await media.save();

    res.json({ likes: media.likes });
  } catch (error) {
    console.error("Error liking media:", error);
    res
      .status(500)
      .json({ message: "Error liking media", error: error.message });
  }
});

// @route   POST /api/media/bulk-delete
// @desc    Delete multiple media items
// @access  Admin only
router.post("/bulk-delete", protect, adminOnly, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No media IDs provided" });
    }

    const result = await Media.deleteMany({ _id: { $in: ids } });

    res.json({
      message: `${result.deletedCount} media items deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error bulk deleting media:", error);
    res
      .status(500)
      .json({ message: "Error bulk deleting media", error: error.message });
  }
});

export default router;
