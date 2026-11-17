import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUpload,
  FaImage,
  FaVideo,
  FaYoutube,
  FaTiktok,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaStar,
  FaRegStar,
  FaSpinner,
  FaLink,
  FaCheck,
  FaPlay,
  FaSearch,
  FaCloudUploadAlt,
  FaExternalLinkAlt,
  FaFilm,
  FaLayerGroup,
  FaTags,
  FaImages,
  FaPlus,
  FaExclamationTriangle,
  FaRedo,
} from "react-icons/fa";
import {
  isValidMediaUrl,
  detectVideoPlatform,
  getYouTubeThumbnail,
  parseYouTubeUrl,
  formatTags,
  absoluteMediaSrc,
} from "../../utils/mediaUtils";
import { mediaAPI } from "../../services/api";
import Pagination from "./Pagination";
import MediaMetaManager from "./MediaMetaManager";
import LightboxViewer from "../gallery/LightboxViewer";

const DEFAULT_CATEGORIES = [
  "events",
  "highlights",
  "behind-the-scenes",
  "portraits",
  "other",
];

const DEFAULT_THEMES = [
  "Competition",
  "Performance",
  "Training",
  "Lifestyle",
  "Community",
];

const MediaManagement = () => {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all" | "image" | "youtube" | "video"
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Meta docs (categories & themes)
  const [categoryDocs, setCategoryDocs] = useState([]);
  const [themeDocs, setThemeDocs] = useState([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState(null);

  // Upload modal state
  const [uploadModalMode, setUploadModalMode] = useState("single"); // "single" | "bulk"
  const [uploadType, setUploadType] = useState("image"); // "image" | "video"
  const [imageSourceMode, setImageSourceMode] = useState("file"); // "file" | "url"
  const [videoSourceMode, setVideoSourceMode] = useState("youtube"); // "youtube" | "file"
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");

  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Bulk Upload state
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkPreviews, setBulkPreviews] = useState([]);
  const [bulkForm, setBulkForm] = useState({
    titlePrefix: "",
    titleMode: "filename", // "filename" | "numbered" | "same"
    category: "events",
    theme: "",
    location: "",
    tags: "",
    visibility: "public",
    featured: false,
    description: "",
  });
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({
    current: 0,
    total: 0,
    percent: 0,
    filename: "",
  });
  const bulkFileInputRef = useRef(null);

  // Upload Form
  const [uploadForm, setUploadForm] = useState({
    url: "",
    thumbnail: "",
    category: "events",
    event: "",
    location: "",
    theme: "",
    tags: "",
    visibility: "public",
    duration: "",
    description: "",
    featured: false,
    useAutoThumbnail: true,
  });

  // Edit Form
  const [editForm, setEditForm] = useState({
    type: "image",
    platform: null,
    sourceMode: "url", // "file" | "url" | "youtube"
    url: "",
    thumbnail: "",
    category: "events",
    event: "",
    location: "",
    theme: "",
    tags: "",
    visibility: "public",
    duration: "",
    description: "",
    featured: false,
  });

  // Edit modal replacement state
  const [editSelectedFile, setEditSelectedFile] = useState(null);
  const [editFilePreviewUrl, setEditFilePreviewUrl] = useState(null);
  const [editSelectedCoverFile, setEditSelectedCoverFile] = useState(null);
  const [editCoverPreviewUrl, setEditCoverPreviewUrl] = useState(null);
  const [editImageMode, setEditImageMode] = useState("file"); // "file" (replace file) | "url" (edit URL)
  const [editImageError, setEditImageError] = useState(false);
  const [editThumbnailError, setEditThumbnailError] = useState(false);
  const editFileInputRef = useRef(null);
  const editCoverInputRef = useRef(null);

  const categoryValues = useMemo(
    () =>
      categoryDocs.length > 0
        ? categoryDocs.map((c) => c.value)
        : DEFAULT_CATEGORIES,
    [categoryDocs],
  );

  const themeValues = useMemo(
    () =>
      themeDocs.length > 0 ? themeDocs.map((t) => t.value) : DEFAULT_THEMES,
    [themeDocs],
  );

  // Fallback-safe category options for edit (preserves current category even if not in defaults)
  const editCategoryOptions = useMemo(() => {
    const list = [...categoryValues];
    if (editForm.category && !list.includes(editForm.category)) {
      list.push(editForm.category);
    }
    return list;
  }, [categoryValues, editForm.category]);

  // Fallback-safe theme options for edit
  const editThemeOptions = useMemo(() => {
    const list = [...themeValues];
    if (editForm.theme && !list.includes(editForm.theme)) {
      list.push(editForm.theme);
    }
    return list;
  }, [themeValues, editForm.theme]);

  // Fetch Meta (themes and categories)
  const fetchMeta = async () => {
    try {
      setMetaLoading(true);
      setMetaError(null);
      const [themesRes, categoriesRes] = await Promise.all([
        mediaAPI.getThemes(),
        mediaAPI.getCategories(),
      ]);
      setThemeDocs(themesRes.themes || []);
      setCategoryDocs(categoriesRes.categories || []);
    } catch (err) {
      console.error("Error fetching media meta:", err);
      setMetaError(
        err?.message || "Failed to load Themes/Categories. Using defaults.",
      );
    } finally {
      setMetaLoading(false);
    }
  };

  // Fetch Media Items
  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = {
        scope: "general", // Exclude tournament-scoped items
      };
      if (filterCategory !== "all") params.category = filterCategory;
      if (filterVisibility !== "all") params.visibility = filterVisibility;

      const response = await mediaAPI.getAll(params);
      setMediaItems(response.media || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching media:", err);
      setError("Failed to load media. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [filterCategory, filterVisibility]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, filterVisibility, filterType, searchQuery]);

  // Clean up object URLs on unmount / change
  useEffect(() => {
    return () => {
      if (filePreviewUrl && filePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(filePreviewUrl);
      }
      if (coverPreviewUrl && coverPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
      if (editFilePreviewUrl && editFilePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(editFilePreviewUrl);
      }
      if (editCoverPreviewUrl && editCoverPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(editCoverPreviewUrl);
      }
      bulkPreviews.forEach((item) => {
        if (item.previewUrl && item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [
    filePreviewUrl,
    coverPreviewUrl,
    editFilePreviewUrl,
    editCoverPreviewUrl,
    bulkPreviews,
  ]);

  // Detected YouTube video ID & thumbnail from upload URL
  const detectedYouTubeId = useMemo(() => {
    if (uploadType === "video" && videoSourceMode === "youtube") {
      return parseYouTubeUrl(uploadForm.url);
    }
    return null;
  }, [uploadType, videoSourceMode, uploadForm.url]);

  const detectedYouTubeThumbnail = useMemo(() => {
    if (detectedYouTubeId) {
      return getYouTubeThumbnail(detectedYouTubeId, "hqdefault");
    }
    return null;
  }, [detectedYouTubeId]);

  // Detected YouTube for Edit Form
  const editDetectedYouTubeId = useMemo(() => {
    if (editForm.type === "video") {
      return parseYouTubeUrl(editForm.url);
    }
    return null;
  }, [editForm.type, editForm.url]);

  const editDetectedYouTubeThumbnail = useMemo(() => {
    if (editDetectedYouTubeId) {
      return getYouTubeThumbnail(editDetectedYouTubeId, "hqdefault");
    }
    return null;
  }, [editDetectedYouTubeId]);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = mediaItems.length;
    let images = 0;
    let youtube = 0;
    let directVideos = 0;
    let featured = 0;
    let publicCount = 0;

    mediaItems.forEach((m) => {
      if (m.type === "image") images++;
      if (m.type === "video") {
        const plat = m.platform || detectVideoPlatform(m.url || "");
        if (plat === "youtube") youtube++;
        else directVideos++;
      }
      if (m.featured) featured++;
      if (m.visibility === "public") publicCount++;
    });

    return { total, images, youtube, directVideos, featured, publicCount };
  }, [mediaItems]);

  // Filtering media
  const filteredMedia = useMemo(() => {
    return mediaItems.filter((media) => {
      // Type filter
      if (filterType === "image" && media.type !== "image") return false;
      if (filterType === "youtube") {
        if (media.type !== "video") return false;
        const plat = media.platform || detectVideoPlatform(media.url || "");
        if (plat !== "youtube") return false;
      }
      if (filterType === "video") {
        if (media.type !== "video") return false;
        const plat = media.platform || detectVideoPlatform(media.url || "");
        if (plat === "youtube") return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const eventMatch = media.event?.toLowerCase().includes(q);
        const locMatch = media.location?.toLowerCase().includes(q);
        const descMatch = media.description?.toLowerCase().includes(q);
        const tagsMatch =
          Array.isArray(media.tags) &&
          media.tags.some((t) => t.toLowerCase().includes(q));
        if (!eventMatch && !locMatch && !descMatch && !tagsMatch) {
          return false;
        }
      }

      return true;
    });
  }, [mediaItems, filterType, searchQuery]);

  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage) || 1;
  const paginatedMedia = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMedia.slice(start, start + itemsPerPage);
  }, [filteredMedia, currentPage, itemsPerPage]);

  // Handle local file selection for upload modal
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadType === "image" && !file.type.startsWith("image/")) {
      setError("Please choose a valid image file (JPEG, PNG, WEBP, GIF, SVG).");
      return;
    }
    if (uploadType === "video" && !file.type.startsWith("video/")) {
      setError("Please choose a valid video file (MP4, WebM, MOV, OGG).");
      return;
    }

    if (filePreviewUrl && filePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(filePreviewUrl);
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreviewUrl(objectUrl);
    setError(null);
  };

  // Handle custom cover image file selection
  const handleCoverFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for the cover thumbnail.");
      return;
    }

    if (coverPreviewUrl && coverPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreviewUrl);
    }

    setSelectedCoverFile(file);
    const objectUrl = URL.createObjectURL(file);
    setCoverPreviewUrl(objectUrl);
  };

  // Clear file from upload form
  const removeSelectedFile = () => {
    if (filePreviewUrl && filePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeCoverFile = () => {
    if (coverPreviewUrl && coverPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreviewUrl);
    }
    setSelectedCoverFile(null);
    setCoverPreviewUrl(null);
    setUploadForm((p) => ({ ...p, thumbnail: "" }));
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  // Bulk Upload File Handlers
  const handleBulkFilesSelected = (fileList) => {
    if (!fileList || !fileList.length) return;
    const incoming = Array.from(fileList);
    const validImages = incoming.filter((f) => f.type.startsWith("image/"));

    if (validImages.length === 0) {
      setError("Please select valid image files (JPEG, PNG, WEBP, GIF, SVG).");
      return;
    }

    if (validImages.length < incoming.length) {
      setError("Some non-image files were skipped.");
    } else {
      setError(null);
    }

    const newPreviews = validImages.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(0),
      previewUrl: URL.createObjectURL(file),
    }));

    setBulkFiles((prev) => [...prev, ...validImages]);
    setBulkPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeBulkFile = (index) => {
    setBulkPreviews((prev) => {
      const target = prev[index];
      if (target?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
    setBulkFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllBulkFiles = () => {
    bulkPreviews.forEach((item) => {
      if (item.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setBulkFiles([]);
    setBulkPreviews([]);
    if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (bulkFiles.length === 0) {
      setError("Please select at least one image file to upload.");
      return;
    }

    setError(null);
    setBulkUploading(true);
    setBulkProgress({
      current: 0,
      total: bulkFiles.length,
      percent: 0,
      filename: "",
    });

    try {
      const res = await mediaAPI.bulkUploadFiles(
        bulkFiles,
        {
          titlePrefix: bulkForm.titlePrefix,
          titleMode: bulkForm.titleMode,
          category: bulkForm.category || categoryValues[0] || "events",
          theme: bulkForm.theme || "",
          location: bulkForm.location || "",
          tags: formatTags(bulkForm.tags),
          visibility: bulkForm.visibility || "public",
          featured: bulkForm.featured,
          description: bulkForm.description || "",
        },
        (progress) => {
          setBulkProgress(progress);
        }
      );

      showSuccess(`Successfully uploaded ${res.count || bulkFiles.length} images!`);
      clearAllBulkFiles();
      setShowUploadModal(false);
      fetchMedia();
    } catch (err) {
      console.error("Bulk upload failed:", err);
      setError(err?.message || "Failed to upload some or all images.");
    } finally {
      setBulkUploading(false);
      setBulkProgress({ current: 0, total: 0, percent: 0, filename: "" });
    }
  };

  // Reset form
  const resetUploadModal = () => {
    removeSelectedFile();
    removeCoverFile();
    clearAllBulkFiles();
    setUploadForm({
      url: "",
      thumbnail: "",
      category: categoryValues[0] || "events",
      event: "",
      location: "",
      theme: "",
      tags: "",
      visibility: "public",
      duration: "",
      description: "",
      featured: false,
      useAutoThumbnail: true,
    });
    setBulkForm({
      titlePrefix: "",
      titleMode: "filename",
      category: categoryValues[0] || "events",
      theme: "",
      location: "",
      tags: "",
      visibility: "public",
      featured: false,
      description: "",
    });
    setUploading(false);
    setBulkUploading(false);
    setUploadProgressText("");
    setError(null);
  };

  // Submit Upload Form
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate Event name
    if (!uploadForm.event?.trim()) {
      setError("Event / Title name is required.");
      return;
    }

    let finalMediaUrl = uploadForm.url.trim();
    let finalThumbnail = uploadForm.thumbnail.trim();
    let finalPublicId = null;
    let platform = null;

    try {
      setUploading(true);

      // 1. Handle file upload if source is "file"
      if (
        (uploadType === "image" && imageSourceMode === "file") ||
        (uploadType === "video" && videoSourceMode === "file")
      ) {
        if (!selectedFile && !finalMediaUrl) {
          setError(
            uploadType === "image"
              ? "Please select an image file to upload."
              : "Please select a video file to upload.",
          );
          setUploading(false);
          return;
        }

        if (selectedFile) {
          setUploadProgressText(`Uploading ${uploadType} file...`);
          const uploadRes = await mediaAPI.uploadFile(selectedFile);
          finalMediaUrl = uploadRes.url;
          if (uploadRes.publicId) finalPublicId = uploadRes.publicId;
        }
      }

      // 2. Validate URL if using URL mode
      if (uploadType === "image" && imageSourceMode === "url") {
        if (!finalMediaUrl) {
          setError("Please enter an image URL.");
          setUploading(false);
          return;
        }
        if (!isValidMediaUrl(finalMediaUrl, "image")) {
          setError("Please enter a valid image URL.");
          setUploading(false);
          return;
        }
      }

      if (uploadType === "video" && videoSourceMode === "youtube") {
        if (!finalMediaUrl) {
          setError("Please enter a YouTube or video URL.");
          setUploading(false);
          return;
        }
        if (!isValidMediaUrl(finalMediaUrl, "video")) {
          setError("Please enter a valid YouTube or video URL.");
          setUploading(false);
          return;
        }
      }

      // 3. Resolve platform & thumbnail
      if (uploadType === "video") {
        if (videoSourceMode === "youtube") {
          platform = detectVideoPlatform(finalMediaUrl) || "youtube";
          if (platform === "youtube") {
            const ytId = parseYouTubeUrl(finalMediaUrl);
            if (ytId && (!finalThumbnail || uploadForm.useAutoThumbnail)) {
              finalThumbnail = getYouTubeThumbnail(ytId, "hqdefault");
            }
          }
        } else {
          platform = "direct";
        }
      }

      // 4. Handle custom cover file upload if provided
      if (selectedCoverFile) {
        setUploadProgressText("Uploading custom thumbnail...");
        const coverRes = await mediaAPI.uploadImage(selectedCoverFile);
        finalThumbnail = coverRes.url;
      }

      // If image and no thumbnail provided, default thumbnail to main URL
      if (uploadType === "image" && !finalThumbnail) {
        finalThumbnail = finalMediaUrl;
      }

      setUploadProgressText("Saving media details...");

      const payload = {
        type: uploadType,
        platform,
        url: finalMediaUrl,
        publicId: finalPublicId,
        thumbnail: finalThumbnail || null,
        category: uploadForm.category || "events",
        event: uploadForm.event.trim(),
        location: uploadForm.location.trim(),
        theme: uploadForm.theme.trim(),
        tags: formatTags(uploadForm.tags),
        visibility: uploadForm.visibility,
        duration: uploadForm.duration.trim(),
        description: uploadForm.description.trim(),
        featured: Boolean(uploadForm.featured),
      };

      await mediaAPI.create(payload);
      showSuccess("Media uploaded and published successfully!");
      setShowUploadModal(false);
      resetUploadModal();
      fetchMedia();
    } catch (err) {
      console.error("Error creating media:", err);
      setError(err?.message || "Failed to create media. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgressText("");
    }
  };

  // Open Edit Modal
  const handleEditClick = (media) => {
    setCurrentMedia(media);
    const isYt =
      media.platform === "youtube" ||
      (media.url && parseYouTubeUrl(media.url) !== null);

    // Clean up previous blob preview urls if any
    if (editFilePreviewUrl && editFilePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(editFilePreviewUrl);
    }
    if (editCoverPreviewUrl && editCoverPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(editCoverPreviewUrl);
    }
    setEditSelectedFile(null);
    setEditFilePreviewUrl(null);
    setEditSelectedCoverFile(null);
    setEditCoverPreviewUrl(null);
    setEditImageError(false);
    setEditThumbnailError(false);
    setEditImageMode("file");

    setEditForm({
      type: media.type,
      platform: media.platform,
      sourceMode:
        media.type === "video" ? (isYt ? "youtube" : "file") : "url",
      url: media.url || "",
      thumbnail: media.thumbnail || "",
      category: media.category || categoryValues[0] || "events",
      event: media.event || "",
      location: media.location || "",
      theme: media.theme || "",
      tags: Array.isArray(media.tags) ? media.tags.join(", ") : "",
      visibility: media.visibility || "public",
      duration: media.duration || "",
      description: media.description || "",
      featured: Boolean(media.featured),
    });
    setShowEditModal(true);
    setError(null);
  };

  const closeEditModal = () => {
    if (uploading) return;
    if (editFilePreviewUrl && editFilePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(editFilePreviewUrl);
    }
    if (editCoverPreviewUrl && editCoverPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(editCoverPreviewUrl);
    }
    setEditSelectedFile(null);
    setEditFilePreviewUrl(null);
    setEditSelectedCoverFile(null);
    setEditCoverPreviewUrl(null);
    setEditImageError(false);
    setEditThumbnailError(false);
    setShowEditModal(false);
    setCurrentMedia(null);
    setError(null);
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (editForm.type === "image" && !file.type.startsWith("image/")) {
      setError("Please choose a valid image file (JPEG, PNG, WEBP, GIF, SVG).");
      return;
    }
    if (editForm.type === "video" && !file.type.startsWith("video/")) {
      setError("Please choose a valid video file.");
      return;
    }

    if (editFilePreviewUrl && editFilePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(editFilePreviewUrl);
    }

    setEditSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setEditFilePreviewUrl(objectUrl);
    setEditImageError(false);
    setError(null);
  };

  const removeEditFile = () => {
    if (editFilePreviewUrl && editFilePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(editFilePreviewUrl);
    }
    setEditSelectedFile(null);
    setEditFilePreviewUrl(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const handleEditCoverFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for thumbnail.");
      return;
    }

    if (editCoverPreviewUrl && editCoverPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(editCoverPreviewUrl);
    }

    setEditSelectedCoverFile(file);
    const objectUrl = URL.createObjectURL(file);
    setEditCoverPreviewUrl(objectUrl);
    setEditThumbnailError(false);
    setError(null);
  };

  const removeEditCoverFile = () => {
    if (editCoverPreviewUrl && editCoverPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(editCoverPreviewUrl);
    }
    setEditSelectedCoverFile(null);
    setEditCoverPreviewUrl(null);
    if (editCoverInputRef.current) editCoverInputRef.current.value = "";
  };

  // Submit Edit Form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!currentMedia) return;

    if (!editForm.event?.trim()) {
      setError("Event / Title name is required.");
      return;
    }

    try {
      setUploading(true);
      let finalMediaUrl = editForm.url.trim();
      let finalThumbnail = editForm.thumbnail?.trim();
      let finalPublicId = currentMedia.publicId;

      // 1. If replacement media file was chosen, upload it
      if (editSelectedFile) {
        setUploadProgressText(`Uploading replacement ${editForm.type}...`);
        const uploadRes = await mediaAPI.uploadFile(editSelectedFile);
        finalMediaUrl = uploadRes.url;
        if (uploadRes.publicId) finalPublicId = uploadRes.publicId;

        // If image and no custom cover file, sync thumbnail to the new image URL
        if (editForm.type === "image" && !editSelectedCoverFile) {
          finalThumbnail = finalMediaUrl;
        }
      }

      // 2. If replacement cover file was chosen, upload it
      if (editSelectedCoverFile) {
        setUploadProgressText("Uploading custom thumbnail...");
        const coverRes = await mediaAPI.uploadImage(editSelectedCoverFile);
        finalThumbnail = coverRes.url;
      }

      let platform = editForm.platform;

      if (editForm.type === "video") {
        if (
          finalMediaUrl.includes("youtube.com") ||
          finalMediaUrl.includes("youtu.be")
        ) {
          platform = "youtube";
        } else if (finalMediaUrl.includes("tiktok.com")) {
          platform = "tiktok";
        } else if (
          finalMediaUrl.startsWith("/uploads/") ||
          finalMediaUrl.includes("cloudinary.com")
        ) {
          platform = "direct";
        }
      }

      if (editForm.type === "video" && platform === "youtube" && !finalThumbnail) {
        const ytId = parseYouTubeUrl(finalMediaUrl);
        if (ytId) {
          finalThumbnail = getYouTubeThumbnail(ytId, "hqdefault");
        }
      } else if (editForm.type === "image" && !finalThumbnail) {
        finalThumbnail = finalMediaUrl;
      }

      setUploadProgressText("Saving updates...");

      const payload = {
        type: editForm.type,
        platform,
        url: finalMediaUrl,
        publicId: finalPublicId,
        thumbnail: finalThumbnail || null,
        category: editForm.category,
        event: editForm.event.trim(),
        location: editForm.location.trim(),
        theme: editForm.theme.trim(),
        tags: formatTags(editForm.tags),
        visibility: editForm.visibility,
        duration: editForm.duration.trim(),
        description: editForm.description.trim(),
        featured: Boolean(editForm.featured),
      };

      await mediaAPI.update(currentMedia._id, payload);
      showSuccess("Media updated successfully!");
      closeEditModal();
      fetchMedia();
    } catch (err) {
      console.error("Error updating media:", err);
      setError(err?.message || "Failed to update media. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgressText("");
    }
  };

  // Delete Media
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this media item?")) {
      return;
    }
    try {
      await mediaAPI.delete(id);
      showSuccess("Media item deleted successfully!");
      fetchMedia();
    } catch (err) {
      console.error("Error deleting media:", err);
      setError(err?.message || "Failed to delete media item.");
    }
  };

  // Toggle Visibility
  const toggleVisibility = async (id) => {
    try {
      await mediaAPI.toggleVisibility(id);
      showSuccess("Visibility updated!");
      fetchMedia();
    } catch (err) {
      console.error("Error toggling visibility:", err);
      setError(err?.message || "Failed to update visibility.");
    }
  };

  // Toggle Featured
  const toggleFeatured = async (id) => {
    try {
      await mediaAPI.toggleFeatured(id);
      showSuccess("Featured status updated!");
      fetchMedia();
    } catch (err) {
      console.error("Error toggling featured status:", err);
      setError(err?.message || "Failed to update featured status.");
    }
  };

  // Copy share URL
  const handleCopyUrl = (media) => {
    const raw = media.url;
    const full = absoluteMediaSrc(raw) || raw;
    navigator.clipboard?.writeText(full);
    setCopiedId(media._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-semibold shadow-lg flex items-center justify-between"
          >
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)}>
              <FaTimes className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="bg-red-600 text-white px-5 py-3 rounded-2xl font-semibold shadow-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-950 to-primary-900 border border-primary-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-500/20 text-secondary-300 border border-secondary-500/30 text-xs font-semibold mb-3">
              <FaFilm className="w-3.5 h-3.5 text-secondary-400" />
              <span>Media Engine</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Media Hub & Gallery
            </h2>
            <p className="text-primary-300 text-sm sm:text-base mt-1 max-w-xl">
              Upload images directly, embed YouTube or TikTok videos, and manage
              all gallery assets across your tournaments and live drops.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                resetUploadModal();
                setUploadModalMode("bulk");
                setShowUploadModal(true);
              }}
              className="inline-flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3.5 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all transform active:scale-95 cursor-pointer text-sm"
            >
              <FaLayerGroup className="w-4 h-4" />
              <span>Bulk Add Images</span>
            </button>
            <button
              onClick={() => {
                resetUploadModal();
                setUploadModalMode("single");
                setShowUploadModal(true);
              }}
              className="inline-flex items-center gap-2.5 bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-secondary-500/25 transition-all transform active:scale-95 cursor-pointer text-sm"
            >
              <FaUpload className="w-4 h-4" />
              <span>Upload Media</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-primary-800/60">
          <div className="bg-primary-900/60 backdrop-blur-sm border border-primary-800/80 rounded-2xl p-3">
            <span className="text-xs font-medium text-primary-400 block">Total Media</span>
            <span className="text-2xl font-black text-white">{stats.total}</span>
          </div>
          <div className="bg-primary-900/60 backdrop-blur-sm border border-primary-800/80 rounded-2xl p-3">
            <span className="text-xs font-medium text-primary-400 block flex items-center gap-1.5">
              <FaImage className="text-emerald-400" /> Images
            </span>
            <span className="text-2xl font-black text-emerald-300">{stats.images}</span>
          </div>
          <div className="bg-primary-900/60 backdrop-blur-sm border border-primary-800/80 rounded-2xl p-3">
            <span className="text-xs font-medium text-primary-400 block flex items-center gap-1.5">
              <FaYoutube className="text-red-400" /> YouTube
            </span>
            <span className="text-2xl font-black text-red-300">{stats.youtube}</span>
          </div>
          <div className="bg-primary-900/60 backdrop-blur-sm border border-primary-800/80 rounded-2xl p-3">
            <span className="text-xs font-medium text-primary-400 block flex items-center gap-1.5">
              <FaVideo className="text-cyan-400" /> Videos
            </span>
            <span className="text-2xl font-black text-cyan-300">{stats.directVideos}</span>
          </div>
          <div className="bg-primary-900/60 backdrop-blur-sm border border-primary-800/80 rounded-2xl p-3">
            <span className="text-xs font-medium text-primary-400 block flex items-center gap-1.5">
              <FaEye className="text-secondary-400" /> Public
            </span>
            <span className="text-2xl font-black text-secondary-300">{stats.publicCount}</span>
          </div>
          <div className="bg-primary-900/60 backdrop-blur-sm border border-primary-800/80 rounded-2xl p-3">
            <span className="text-xs font-medium text-primary-400 block flex items-center gap-1.5">
              <FaStar className="text-amber-400" /> Featured
            </span>
            <span className="text-2xl font-black text-amber-300">{stats.featured}</span>
          </div>
        </div>
      </div>

      {/* Media Metadata Manager (Themes & Categories) */}
      {metaLoading ? (
        <div className="bg-white dark:bg-primary-900/40 border border-primary-200 dark:border-primary-800 rounded-3xl p-6 text-primary-600 dark:text-primary-300">
          Loading Themes & Categories...
        </div>
      ) : metaError ? (
        <div className="bg-red-500 text-white px-5 py-3 rounded-2xl font-semibold">
          {metaError}
        </div>
      ) : (
        <MediaMetaManager
          themes={themeDocs}
          categories={categoryDocs}
          onRefresh={fetchMeta}
        />
      )}

      {/* Control / Filter Bar */}
      <div className="bg-white dark:bg-primary-900/40 border border-primary-200/80 dark:border-primary-800 rounded-3xl p-5 shadow-xs space-y-4">
        {/* Search & Type filter pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event, tag, location, description..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-primary-200 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-950/50 text-sm text-primary-950 dark:text-primary-100 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-secondary-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600 text-xs p-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "All Media" },
              { id: "image", label: "Images", icon: FaImage },
              { id: "youtube", label: "YouTube", icon: FaYoutube, color: "text-red-500" },
              { id: "video", label: "Direct Videos", icon: FaVideo },
            ].map((t) => {
              const active = filterType === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setFilterType(t.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? "bg-secondary-500 text-white shadow-xs"
                      : "bg-primary-100/80 dark:bg-primary-800/60 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-700"
                  }`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 ${active ? "text-white" : t.color || ""}`} />}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-primary-100 dark:border-primary-800/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary-500 dark:text-primary-400">
              Category:
            </span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-950 text-primary-800 dark:text-primary-200 focus:outline-none focus:ring-1 focus:ring-secondary-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categoryValues.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary-500 dark:text-primary-400">
              Visibility:
            </span>
            <select
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-950 text-primary-800 dark:text-primary-200 focus:outline-none focus:ring-1 focus:ring-secondary-500 cursor-pointer"
            >
              <option value="all">All Visibility</option>
              <option value="public">Public Only</option>
              <option value="private">Private Only</option>
            </select>
          </div>

          {(filterType !== "all" ||
            filterCategory !== "all" ||
            filterVisibility !== "all" ||
            searchQuery) && (
            <button
              onClick={() => {
                setFilterType("all");
                setFilterCategory("all");
                setFilterVisibility("all");
                setSearchQuery("");
              }}
              className="text-xs text-secondary-500 hover:text-secondary-600 font-bold ml-auto cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-primary-500">
          <FaSpinner className="animate-spin w-8 h-8 text-secondary-500 mb-3" />
          <p className="text-sm font-semibold">Loading media hub...</p>
        </div>
      )}

      {/* Media Cards Grid */}
      {!loading && (
        <>
          {paginatedMedia.length === 0 ? (
            <div className="bg-white dark:bg-primary-900/40 border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-3xl p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-400">
                <FaFilm className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-primary-950 dark:text-primary-100 mb-1">
                No media items match your criteria
              </h3>
              <p className="text-sm text-primary-500 mb-6">
                Try clearing filters or upload a new image or video.
              </p>
              <button
                onClick={() => {
                  resetUploadModal();
                  setShowUploadModal(true);
                }}
                className="inline-flex items-center gap-2 bg-secondary-500 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-secondary-600 transition cursor-pointer text-sm"
              >
                <FaUpload className="w-3.5 h-3.5" />
                <span>Upload New Media</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedMedia.map((media) => {
                const isVideo = media.type === "video";
                const isYt =
                  isVideo &&
                  (media.platform === "youtube" ||
                    Boolean(parseYouTubeUrl(media.url || "")));
                const ytId = isYt ? parseYouTubeUrl(media.url || "") : null;

                // Thumbnail resolution
                let displayThumb = media.thumbnail;
                if (!displayThumb && isYt && ytId) {
                  displayThumb = getYouTubeThumbnail(ytId, "hqdefault");
                }
                if (!displayThumb && !isVideo) {
                  displayThumb = media.url;
                }
                const imgSrc = displayThumb ? absoluteMediaSrc(displayThumb) || displayThumb : null;

                return (
                  <div
                    key={media._id}
                    className="group bg-white dark:bg-primary-900/40 border border-primary-200/90 dark:border-primary-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Thumbnail Container */}
                      <div
                        onClick={() => setPreviewMedia(media)}
                        className="relative aspect-video bg-primary-950 overflow-hidden cursor-pointer group"
                      >
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={media.event}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              if (isYt && ytId && !e.target.dataset.tried) {
                                e.target.dataset.tried = "true";
                                e.target.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                              } else {
                                e.target.src =
                                  "https://images.unsplash.com/photo-1579547621113-e4bb2a19bdd6";
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-800 to-primary-950">
                            {isVideo ? (
                              <FaPlay className="w-10 h-10 text-white/60" />
                            ) : (
                              <FaImage className="w-10 h-10 text-white/60" />
                            )}
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-primary-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="inline-flex items-center gap-2 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20">
                            <FaPlay className="w-3 h-3" /> Preview
                          </span>
                        </div>

                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                          {isYt ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-red-600 text-white shadow-sm">
                              <FaYoutube className="w-3.5 h-3.5" /> YouTube
                            </span>
                          ) : isVideo ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-cyan-600 text-white shadow-sm">
                              <FaVideo className="w-3.5 h-3.5" /> Video
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white shadow-sm">
                              <FaImage className="w-3.5 h-3.5" /> Image
                            </span>
                          )}
                        </div>

                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              media.visibility === "public"
                                ? "bg-emerald-500/90 text-white"
                                : "bg-amber-500/90 text-primary-950"
                            }`}
                          >
                            {media.visibility}
                          </span>
                          {media.featured && (
                            <span className="p-1 rounded-md bg-amber-400 text-primary-950 shadow-sm" title="Featured">
                              <FaStar className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Card Body */}
                      <div className="p-4">
                        <div className="flex items-center justify-between text-xs text-primary-500 dark:text-primary-400 mb-1">
                          <span className="font-semibold uppercase tracking-wider text-[10px] text-secondary-500">
                            {media.category?.replace(/-/g, " ")}
                          </span>
                          <span>
                            {new Date(media.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h3
                          className="font-bold text-base text-primary-950 dark:text-primary-100 line-clamp-1 mb-1"
                          title={media.event}
                        >
                          {media.event}
                        </h3>

                        {media.location && (
                          <p className="text-xs text-primary-500 dark:text-primary-400 line-clamp-1 mb-2">
                            📍 {media.location}
                          </p>
                        )}

                        {media.description && (
                          <p className="text-xs text-primary-600 dark:text-primary-300 line-clamp-2 mb-3">
                            {media.description}
                          </p>
                        )}

                        {media.tags && media.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {media.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-semibold bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-md"
                              >
                                #{tag}
                              </span>
                            ))}
                            {media.tags.length > 3 && (
                              <span className="text-[10px] text-primary-400 self-center">
                                +{media.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-3 pt-0 border-t border-primary-100 dark:border-primary-800/60 mt-2 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleFeatured(media._id)}
                          className={`p-2 rounded-xl transition cursor-pointer text-xs ${
                            media.featured
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-500 hover:bg-amber-200"
                              : "bg-primary-100 dark:bg-primary-800 text-primary-400 hover:text-amber-500"
                          }`}
                          title={media.featured ? "Remove featured" : "Mark as featured"}
                        >
                          <FaStar className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleVisibility(media._id)}
                          className={`p-2 rounded-xl transition cursor-pointer text-xs ${
                            media.visibility === "public"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 hover:bg-emerald-200"
                              : "bg-amber-100 dark:bg-amber-950/60 text-amber-600 hover:bg-amber-200"
                          }`}
                          title={media.visibility === "public" ? "Hide from public" : "Make public"}
                        >
                          {media.visibility === "public" ? (
                            <FaEye className="w-3.5 h-3.5" />
                          ) : (
                            <FaEyeSlash className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleCopyUrl(media)}
                          className="p-2 rounded-xl bg-primary-100 dark:bg-primary-800 text-primary-500 hover:text-primary-800 dark:hover:text-white transition cursor-pointer text-xs"
                          title="Copy media URL"
                        >
                          {copiedId === media._id ? (
                            <FaCheck className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <FaLink className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditClick(media)}
                          className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-500 hover:text-white transition cursor-pointer text-xs flex items-center gap-1"
                        >
                          <FaEdit className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(media._id)}
                          className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition cursor-pointer text-xs"
                          title="Delete media"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {filteredMedia.length > 0 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                itemsPerPage={itemsPerPage}
                totalItems={filteredMedia.length}
                onItemsPerPageChange={(newSize) => {
                  setItemsPerPage(newSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* REDESIGNED UPLOAD MODAL                                  */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-primary-950/85 backdrop-blur-md p-4 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!uploading) setShowUploadModal(false);
            }}
          >
            <motion.div
              className="bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-primary-100 dark:border-primary-800">
                <div>
                  <h3 className="text-2xl font-black text-primary-950 dark:text-white">
                    {uploadModalMode === "bulk" ? "Bulk Add Images" : "Upload & Add Media"}
                  </h3>
                  <p className="text-xs text-primary-500 dark:text-primary-400 mt-0.5">
                    {uploadModalMode === "bulk"
                      ? "Select and upload multiple images at once with shared metadata."
                      : "Choose image or video, then upload a file or embed YouTube."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!uploading && !bulkUploading) setShowUploadModal(false);
                  }}
                  disabled={uploading || bulkUploading}
                  className="p-2 rounded-xl text-primary-400 hover:text-primary-700 dark:hover:text-white transition disabled:opacity-40 cursor-pointer"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-primary-100 dark:bg-primary-800/80 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setUploadModalMode("single");
                    setError(null);
                  }}
                  disabled={uploading || bulkUploading}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    uploadModalMode === "single"
                      ? "bg-white dark:bg-primary-900 text-primary-950 dark:text-white shadow-xs"
                      : "text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-white"
                  }`}
                >
                  <FaUpload className="w-3.5 h-3.5" />
                  <span>Single Media</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadModalMode("bulk");
                    setError(null);
                  }}
                  disabled={uploading || bulkUploading}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    uploadModalMode === "bulk"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-white"
                  }`}
                >
                  <FaLayerGroup className="w-3.5 h-3.5" />
                  <span>Bulk Add Images</span>
                  {bulkFiles.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-white text-emerald-700 font-extrabold shadow-sm">
                      {bulkFiles.length}
                    </span>
                  )}
                </button>
              </div>

              {/* ========================================================= */}
              {/* BULK UPLOAD TAB                                           */}
              {/* ========================================================= */}
              {uploadModalMode === "bulk" ? (
                <form onSubmit={handleBulkSubmit} className="space-y-6">
                  {/* Dropzone / Image Picker */}
                  <div>
                    <input
                      ref={bulkFileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        handleBulkFilesSelected(e.target.files);
                        e.target.value = "";
                      }}
                      className="hidden"
                      id="bulk-image-input"
                    />

                    {bulkPreviews.length === 0 ? (
                      <label
                        htmlFor="bulk-image-input"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleBulkFilesSelected(e.dataTransfer.files);
                        }}
                        className="cursor-pointer border-2 border-dashed border-emerald-400/80 hover:border-emerald-500 rounded-3xl p-10 text-center flex flex-col items-center justify-center transition bg-emerald-50/40 dark:bg-emerald-950/20 group"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                          <FaLayerGroup className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="font-extrabold text-base text-primary-950 dark:text-white">
                          Select multiple images to bulk upload
                        </span>
                        <span className="text-xs text-primary-500 dark:text-primary-400 mt-1">
                          Click to browse or drag & drop multiple JPG, PNG, WEBP, or GIF files
                        </span>
                        <span className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20">
                          <FaPlus className="w-3 h-3" /> Choose Images
                        </span>
                      </label>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary-800 dark:text-primary-200">
                              Selected Images ({bulkPreviews.length})
                            </span>
                            <span className="text-[11px] text-primary-500 font-mono">
                              Total: {(bulkFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(1)} MB
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => bulkFileInputRef.current?.click()}
                              disabled={bulkUploading}
                              className="px-3 py-1.5 rounded-xl bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200 text-xs font-bold hover:bg-primary-200 dark:hover:bg-primary-700 transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                            >
                              <FaPlus className="w-3 h-3" /> Add More
                            </button>
                            <button
                              type="button"
                              onClick={clearAllBulkFiles}
                              disabled={bulkUploading}
                              className="px-3 py-1.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-200 transition cursor-pointer disabled:opacity-40"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>

                        {/* Grid preview of selected images */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-2 rounded-2xl bg-primary-50/70 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800">
                          {bulkPreviews.map((item, index) => (
                            <div
                              key={item.id}
                              className="group relative rounded-xl overflow-hidden aspect-video bg-black border border-primary-200 dark:border-primary-700 flex flex-col justify-end"
                            >
                              <img
                                src={item.previewUrl}
                                alt={item.name}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                              <button
                                type="button"
                                onClick={() => removeBulkFile(index)}
                                disabled={bulkUploading}
                                className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition cursor-pointer shadow-sm z-10 disabled:opacity-40"
                                title="Remove this image"
                              >
                                <FaTimes className="w-3 h-3" />
                              </button>
                              <div className="relative z-10 p-1.5">
                                <p className="text-[10px] text-white font-semibold truncate leading-tight">
                                  {item.name}
                                </p>
                                <span className="text-[9px] text-primary-300 font-mono">
                                  {item.size} KB
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Batch Metadata Settings */}
                  <div className="p-5 rounded-2xl bg-primary-50/70 dark:bg-primary-950/60 border border-primary-200/80 dark:border-primary-800 space-y-4">
                    <label className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300 block">
                      Batch Details (Applied to all {bulkFiles.length} images)
                    </label>

                    {/* Naming strategy */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300">
                        Title Naming Strategy:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { id: "filename", label: "Use Filenames", desc: "e.g. photo-1" },
                          { id: "numbered", label: "Title + Number", desc: "e.g. Match #1, #2" },
                          { id: "same", label: "Same Title", desc: "e.g. Summer Cup" },
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => setBulkForm({ ...bulkForm, titleMode: mode.id })}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                              bulkForm.titleMode === mode.id
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold"
                                : "border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                            }`}
                          >
                            <span className="text-xs block font-bold">{mode.label}</span>
                            <span className="text-[10px] text-primary-400 block">{mode.desc}</span>
                          </button>
                        ))}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mt-2 mb-1">
                          Base Title / Event Prefix {bulkForm.titleMode !== "filename" && "*"}
                        </label>
                        <input
                          type="text"
                          value={bulkForm.titlePrefix}
                          onChange={(e) => setBulkForm({ ...bulkForm, titlePrefix: e.target.value })}
                          placeholder={
                            bulkForm.titleMode === "filename"
                              ? "Optional prefix (e.g. Summer Cup)"
                              : "e.g. Arena Tournaments 2026"
                          }
                          required={bulkForm.titleMode !== "filename"}
                          className="w-full px-4 py-2.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-sm text-primary-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Category & Theme */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                          Category *
                        </label>
                        <select
                          value={bulkForm.category}
                          onChange={(e) => setBulkForm({ ...bulkForm, category: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs font-bold text-primary-950 dark:text-white cursor-pointer"
                        >
                          {categoryValues.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                          Theme
                        </label>
                        <select
                          value={bulkForm.theme}
                          onChange={(e) => setBulkForm({ ...bulkForm, theme: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs font-bold text-primary-950 dark:text-white cursor-pointer"
                        >
                          <option value="">No theme</option>
                          {themeValues.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Location & Tags */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                          Location (optional)
                        </label>
                        <input
                          type="text"
                          value={bulkForm.location}
                          onChange={(e) => setBulkForm({ ...bulkForm, location: e.target.value })}
                          placeholder="e.g. Dome Pitch 1"
                          className="w-full px-4 py-2 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs text-primary-950 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                          Tags (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={bulkForm.tags}
                          onChange={(e) => setBulkForm({ ...bulkForm, tags: e.target.value })}
                          placeholder="action, finals, community"
                          className="w-full px-4 py-2 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs text-primary-950 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Visibility & Featured */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-primary-700 dark:text-primary-300">
                          Visibility:
                        </label>
                        <select
                          value={bulkForm.visibility}
                          onChange={(e) => setBulkForm({ ...bulkForm, visibility: e.target.value })}
                          className="px-3 py-1.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs font-bold"
                        >
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                        </select>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={bulkForm.featured}
                          onChange={(e) => setBulkForm({ ...bulkForm, featured: e.target.checked })}
                          className="w-4 h-4 rounded border-primary-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-primary-800 dark:text-primary-200 flex items-center gap-1">
                          <FaStar className="text-amber-400" /> Featured
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Bulk Progress Bar */}
                  {bulkUploading && (
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-200">
                        <span className="flex items-center gap-2">
                          <FaSpinner className="animate-spin text-emerald-600" />
                          Uploading {bulkProgress.current} of {bulkProgress.total}...
                        </span>
                        <span>{bulkProgress.percent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-emerald-200 dark:bg-emerald-900 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                          style={{ width: `${bulkProgress.percent}%` }}
                        />
                      </div>
                      {bulkProgress.filename && (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 truncate font-mono">
                          Current: {bulkProgress.filename}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-primary-100 dark:border-primary-800">
                    <button
                      type="button"
                      onClick={() => {
                        clearAllBulkFiles();
                        setShowUploadModal(false);
                      }}
                      disabled={bulkUploading}
                      className="flex-1 py-3 rounded-2xl border border-primary-300 dark:border-primary-700 font-bold text-xs text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-800 transition disabled:opacity-40 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bulkUploading || bulkFiles.length === 0}
                      className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {bulkUploading ? (
                        <>
                          <FaSpinner className="animate-spin w-4 h-4" />
                          <span>Uploading ({bulkProgress.current}/{bulkProgress.total})...</span>
                        </>
                      ) : (
                        <>
                          <FaLayerGroup className="w-4 h-4" />
                          <span>Upload & Publish {bulkFiles.length} Images</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* ========================================================= */
                /* SINGLE UPLOAD FORM                                        */
                /* ========================================================= */
                <form onSubmit={handleUploadSubmit} className="space-y-6">
                {/* STEP 1: SELECT MEDIA TYPE (IMAGE vs VIDEO) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300 mb-2">
                    1. Select Media Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadType("image");
                        setError(null);
                      }}
                      className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3.5 cursor-pointer ${
                        uploadType === "image"
                          ? "border-secondary-500 bg-secondary-50/50 dark:bg-secondary-950/30"
                          : "border-primary-200 dark:border-primary-800 hover:border-primary-300"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-xl ${
                          uploadType === "image"
                            ? "bg-secondary-500 text-white"
                            : "bg-primary-100 dark:bg-primary-800 text-primary-500"
                        }`}
                      >
                        <FaImage className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="font-bold text-sm block text-primary-950 dark:text-white">
                          Image / Photo
                        </span>
                        <span className="text-xs text-primary-500 dark:text-primary-400">
                          Upload file or paste image URL
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUploadType("video");
                        setError(null);
                      }}
                      className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3.5 cursor-pointer ${
                        uploadType === "video"
                          ? "border-secondary-500 bg-secondary-50/50 dark:bg-secondary-950/30"
                          : "border-primary-200 dark:border-primary-800 hover:border-primary-300"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-xl ${
                          uploadType === "video"
                            ? "bg-secondary-500 text-white"
                            : "bg-primary-100 dark:bg-primary-800 text-primary-500"
                        }`}
                      >
                        <FaVideo className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="font-bold text-sm block text-primary-950 dark:text-white">
                          Video (YouTube & Upload)
                        </span>
                        <span className="text-xs text-primary-500 dark:text-primary-400">
                          YouTube link or MP4 file upload
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* STEP 2: SOURCE INPUT ACCORDING TO TYPE */}
                <div className="p-5 rounded-2xl bg-primary-50/70 dark:bg-primary-950/60 border border-primary-200/80 dark:border-primary-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                      2. Choose Input Method
                    </label>

                    {/* Sub-tabs switch */}
                    {uploadType === "image" ? (
                      <div className="inline-flex rounded-xl bg-primary-200/70 dark:bg-primary-800 p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setImageSourceMode("file");
                            setError(null);
                          }}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                            imageSourceMode === "file"
                              ? "bg-white dark:bg-primary-900 text-primary-950 dark:text-white shadow-xs"
                              : "text-primary-600 dark:text-primary-400"
                          }`}
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setImageSourceMode("url");
                            setError(null);
                          }}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                            imageSourceMode === "url"
                              ? "bg-white dark:bg-primary-900 text-primary-950 dark:text-white shadow-xs"
                              : "text-primary-600 dark:text-primary-400"
                          }`}
                        >
                          Image URL
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex rounded-xl bg-primary-200/70 dark:bg-primary-800 p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setVideoSourceMode("youtube");
                            setError(null);
                          }}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                            videoSourceMode === "youtube"
                              ? "bg-white dark:bg-primary-900 text-primary-950 dark:text-white shadow-xs"
                              : "text-primary-600 dark:text-primary-400"
                          }`}
                        >
                          <FaYoutube className="text-red-500 w-3.5 h-3.5" />
                          <span>YouTube / Link</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVideoSourceMode("file");
                            setError(null);
                          }}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                            videoSourceMode === "file"
                              ? "bg-white dark:bg-primary-900 text-primary-950 dark:text-white shadow-xs"
                              : "text-primary-600 dark:text-primary-400"
                          }`}
                        >
                          Upload Video File
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 2A: Image File Upload Dropzone */}
                  {uploadType === "image" && imageSourceMode === "file" && (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="image-file-input"
                      />
                      {filePreviewUrl ? (
                        <div className="relative rounded-2xl overflow-hidden border border-primary-300 dark:border-primary-700 aspect-video max-h-56 bg-primary-950 flex items-center justify-center">
                          <img
                            src={filePreviewUrl}
                            alt="Upload preview"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-white text-xs">
                            {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(0)} KB)
                          </div>
                          <button
                            type="button"
                            onClick={removeSelectedFile}
                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition cursor-pointer shadow-md"
                            title="Remove file"
                          >
                            <FaTimes className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="image-file-input"
                          className="cursor-pointer border-2 border-dashed border-primary-300 dark:border-primary-700 hover:border-secondary-500 dark:hover:border-secondary-400 rounded-2xl p-8 text-center flex flex-col items-center justify-center transition bg-white/50 dark:bg-primary-900/40"
                        >
                          <FaCloudUploadAlt className="w-12 h-12 text-secondary-500 mb-2" />
                          <span className="font-bold text-sm text-primary-900 dark:text-primary-100">
                            Click to upload or drag & drop an image
                          </span>
                          <span className="text-xs text-primary-500 mt-1">
                            Supports PNG, JPG, WEBP, GIF, SVG (up to 20MB)
                          </span>
                        </label>
                      )}
                    </div>
                  )}

                  {/* 2B: Image URL Input */}
                  {uploadType === "image" && imageSourceMode === "url" && (
                    <div className="space-y-3">
                      <input
                        type="url"
                        value={uploadForm.url}
                        onChange={(e) =>
                          setUploadForm({ ...uploadForm, url: e.target.value })
                        }
                        placeholder="https://images.unsplash.com/... or https://domain.com/photo.jpg"
                        className="w-full px-4 py-2.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-sm text-primary-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500"
                      />
                      {uploadForm.url && (
                        <div className="rounded-2xl overflow-hidden border border-primary-200 dark:border-primary-700 aspect-video max-h-48 bg-primary-950 flex items-center justify-center">
                          <img
                            src={uploadForm.url}
                            alt="Preview"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2C: YouTube / Video URL Input */}
                  {uploadType === "video" && videoSourceMode === "youtube" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-primary-600 dark:text-primary-300 mb-1">
                          YouTube or Video URL *
                        </label>
                        <div className="relative">
                          <input
                            type="url"
                            value={uploadForm.url}
                            onChange={(e) =>
                              setUploadForm({ ...uploadForm, url: e.target.value })
                            }
                            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                            className="w-full px-4 py-2.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-sm text-primary-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500"
                          />
                        </div>
                      </div>

                      {/* YouTube Detection Card */}
                      {detectedYouTubeId ? (
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center">
                          <div className="relative w-full sm:w-40 aspect-video rounded-xl overflow-hidden bg-black flex-shrink-0">
                            <img
                              src={detectedYouTubeThumbnail}
                              alt="YouTube Thumbnail"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <FaYoutube className="w-8 h-8 text-red-500" />
                            </div>
                          </div>
                          <div className="flex-1 text-left">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-extrabold uppercase mb-1">
                              <FaYoutube /> YouTube Video Detected
                            </div>
                            <p className="text-xs font-semibold text-primary-800 dark:text-primary-200">
                              Video ID: <span className="font-mono text-red-600 dark:text-red-400">{detectedYouTubeId}</span>
                            </p>
                            <p className="text-[11px] text-primary-500 mt-1">
                              Auto-thumbnail will be extracted and optimized.
                            </p>
                          </div>
                        </div>
                      ) : uploadForm.url && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                          <FaLink className="w-3.5 h-3.5 text-amber-500" />
                          <span>Custom video link entered. Make sure it is public and embeddable.</span>
                        </div>
                      )}

                      {/* Optional Custom Cover Override */}
                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-primary-600 dark:text-primary-300 mb-1">
                          Custom Cover Thumbnail (Optional)
                        </label>
                        <input
                          type="url"
                          value={uploadForm.thumbnail}
                          onChange={(e) =>
                            setUploadForm({ ...uploadForm, thumbnail: e.target.value })
                          }
                          placeholder="https://... (leave blank to use auto YouTube thumbnail)"
                          className="w-full px-4 py-2 rounded-xl border border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs text-primary-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2D: Direct Video File Upload */}
                  {uploadType === "video" && videoSourceMode === "file" && (
                    <div className="space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/ogg"
                        onChange={handleFileChange}
                        className="hidden"
                        id="video-file-input"
                      />
                      {filePreviewUrl ? (
                        <div className="relative rounded-2xl overflow-hidden border border-primary-300 dark:border-primary-700 bg-black aspect-video max-h-60 flex items-center justify-center">
                          <video
                            src={filePreviewUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={removeSelectedFile}
                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition cursor-pointer shadow-md z-10"
                            title="Remove video file"
                          >
                            <FaTimes className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="video-file-input"
                          className="cursor-pointer border-2 border-dashed border-primary-300 dark:border-primary-700 hover:border-secondary-500 dark:hover:border-secondary-400 rounded-2xl p-8 text-center flex flex-col items-center justify-center transition bg-white/50 dark:bg-primary-900/40"
                        >
                          <FaVideo className="w-12 h-12 text-secondary-500 mb-2" />
                          <span className="font-bold text-sm text-primary-900 dark:text-primary-100">
                            Click to upload or drag & drop a video file
                          </span>
                          <span className="text-xs text-primary-500 mt-1">
                            Supports MP4, WebM, MOV, OGG (up to 200MB)
                          </span>
                        </label>
                      )}

                      {/* Custom Cover Thumbnail Upload for Video */}
                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-primary-600 dark:text-primary-300 mb-1">
                          Poster / Cover Image for Video (Optional)
                        </label>
                        <div className="flex gap-2">
                          <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCoverFileChange}
                            className="hidden"
                            id="cover-file-input"
                          />
                          <button
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                            className="px-3 py-2 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-800 text-xs font-bold text-primary-700 dark:text-primary-200 hover:bg-primary-50 transition cursor-pointer"
                          >
                            Upload Cover Image
                          </button>
                          {coverPreviewUrl && (
                            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                              <span>Cover selected</span>
                              <button
                                type="button"
                                onClick={removeCoverFile}
                                className="text-red-500 hover:text-red-700 text-xs underline cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 3: DETAILS & METADATA */}
                <div className="space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                    3. Details & Organization
                  </label>

                  <div>
                    <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                      Event / Media Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={uploadForm.event}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, event: e.target.value })
                      }
                      placeholder="e.g. Neon Clash Finals 2026 Highlight Reel"
                      className="w-full px-4 py-2.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-sm text-primary-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                        Category *
                      </label>
                      <select
                        value={uploadForm.category}
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            category: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-sm text-primary-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500 cursor-pointer"
                      >
                        {categoryValues.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat
                              .replace(/-/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                        Theme (Optional)
                      </label>
                      <select
                        value={uploadForm.theme}
                        onChange={(e) =>
                          setUploadForm({ ...uploadForm, theme: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-sm text-primary-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500 cursor-pointer"
                      >
                        <option value="">No theme selected</option>
                        {themeValues.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={uploadForm.location}
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            location: e.target.value,
                          })
                        }
                        placeholder="e.g. Brooklyn Arena, NY"
                        className="w-full px-4 py-2 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs text-primary-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                        Duration (for videos)
                      </label>
                      <input
                        type="text"
                        value={uploadForm.duration}
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            duration: e.target.value,
                          })
                        }
                        placeholder="e.g. 3:45 or 12 min"
                        className="w-full px-4 py-2 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs text-primary-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={uploadForm.tags}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, tags: e.target.value })
                      }
                      placeholder="e.g. championship, arenaia, highlights, finals"
                      className="w-full px-4 py-2 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs text-primary-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={uploadForm.description}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Add an engaging description for visitors..."
                      className="w-full px-4 py-2 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs text-primary-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-primary-800 dark:text-primary-200">
                        Visibility:
                      </label>
                      <select
                        value={uploadForm.visibility}
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            visibility: e.target.value,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs font-bold text-primary-950 dark:text-white cursor-pointer"
                      >
                        <option value="public">Public (Visible in Gallery)</option>
                        <option value="private">Private (Admin only)</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={uploadForm.featured}
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            featured: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-primary-300 text-secondary-500 focus:ring-secondary-400 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-primary-800 dark:text-primary-200 flex items-center gap-1">
                        <FaStar className="text-amber-400" /> Feature in Highlights
                      </span>
                    </label>
                  </div>
                </div>

                {/* Progress bar or status text */}
                {uploadProgressText && (
                  <div className="p-3 bg-secondary-50 dark:bg-secondary-950/40 border border-secondary-200 dark:border-secondary-800 rounded-2xl flex items-center gap-3 text-xs text-secondary-700 dark:text-secondary-300 font-semibold animate-pulse">
                    <FaSpinner className="animate-spin w-4 h-4 text-secondary-500" />
                    <span>{uploadProgressText}</span>
                  </div>
                )}

                {/* Modal Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-primary-100 dark:border-primary-800">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploading}
                    className="flex-1 py-3 rounded-2xl border border-primary-300 dark:border-primary-700 font-bold text-sm text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-800 transition cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white font-bold text-sm shadow-lg shadow-secondary-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <FaSpinner className="animate-spin w-4 h-4" />
                        <span>Publishing Media...</span>
                      </>
                    ) : (
                      <>
                        <FaUpload className="w-4 h-4" />
                        <span>Publish to Gallery</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* REDESIGNED EDIT MODAL WITH FILE REPLACEMENT & FALLBACKS   */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showEditModal && currentMedia && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-primary-950/85 backdrop-blur-md p-4 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!uploading) closeEditModal();
            }}
          >
            <motion.div
              className="bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-primary-100 dark:border-primary-800">
                <div>
                  <h3 className="text-2xl font-black text-primary-950 dark:text-white">
                    Edit Media Item
                  </h3>
                  <p className="text-xs text-primary-500 dark:text-primary-400 mt-0.5">
                    Update details, replace media files, or adjust metadata & visibility.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={uploading}
                  className="p-2 rounded-xl text-primary-400 hover:text-primary-700 dark:hover:text-white transition disabled:opacity-40 cursor-pointer"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-5">
                {/* Media Type & Platform Info Bar */}
                <div className="p-3.5 rounded-2xl bg-primary-50 dark:bg-primary-950/60 border border-primary-200/80 dark:border-primary-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {editForm.type === "image" ? (
                      <span className="p-2 rounded-xl bg-emerald-500 text-white shadow-sm">
                        <FaImage className="w-4 h-4" />
                      </span>
                    ) : editDetectedYouTubeId ? (
                      <span className="p-2 rounded-xl bg-red-600 text-white shadow-sm">
                        <FaYoutube className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="p-2 rounded-xl bg-cyan-600 text-white shadow-sm">
                        <FaVideo className="w-4 h-4" />
                      </span>
                    )}
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-primary-800 dark:text-primary-200 block">
                        {editForm.type === "image"
                          ? "Image Item"
                          : editDetectedYouTubeId
                          ? "YouTube Video"
                          : "Direct Video File"}
                      </span>
                      <p className="text-[11px] text-primary-500 font-mono truncate max-w-xs">
                        {editSelectedFile ? `New file: ${editSelectedFile.name}` : editForm.url}
                      </p>
                    </div>
                  </div>
                  {currentMedia._id && (
                    <span className="text-[10px] text-primary-400 font-mono bg-primary-200/50 dark:bg-primary-800/50 px-2 py-0.5 rounded-md">
                      ID: {currentMedia._id.slice(-6)}
                    </span>
                  )}
                </div>

                {/* ========================================================= */}
                {/* PREVIEW CONTAINER WITH REPLACEMENT STATUS & ERROR FALLBACK */}
                {/* ========================================================= */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                    Media Preview & Replacement
                  </label>

                  <div className="relative rounded-2xl overflow-hidden aspect-video max-h-56 bg-primary-950 border border-primary-300 dark:border-primary-700 flex items-center justify-center">
                    {/* 1. New file preview if user picked one */}
                    {editFilePreviewUrl ? (
                      <>
                        {editForm.type === "video" ? (
                          <video
                            src={editFilePreviewUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <img
                            src={editFilePreviewUrl}
                            alt="New replacement preview"
                            className="w-full h-full object-contain"
                          />
                        )}
                        <div className="absolute top-2 left-2 px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-md flex items-center gap-1.5 z-10">
                          <FaCheck className="w-3 h-3" /> New Replacement File Selected
                        </div>
                        <button
                          type="button"
                          onClick={removeEditFile}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition cursor-pointer shadow-md z-10"
                          title="Cancel replacement file"
                        >
                          <FaTimes className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : editImageError ? (
                      /* 2. Error fallback when current URL failed to load */
                      <div className="p-6 text-center text-primary-300 flex flex-col items-center justify-center max-w-sm">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2.5">
                          <FaExclamationTriangle className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-amber-300">
                          Current image preview unavailable
                        </p>
                        <p className="text-[11px] text-primary-400 font-mono truncate max-w-xs mt-0.5">
                          {editForm.url || "No URL provided"}
                        </p>
                        <p className="text-xs text-primary-400 mt-2">
                          The file was deleted or URL expired. Click "Replace Image File" below to upload a fresh image.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditImageMode("file");
                            editFileInputRef.current?.click();
                          }}
                          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-secondary-500 hover:bg-secondary-600 text-white text-xs font-bold shadow cursor-pointer"
                        >
                          <FaCloudUploadAlt className="w-3.5 h-3.5" />
                          <span>Replace Image Now</span>
                        </button>
                      </div>
                    ) : editDetectedYouTubeId ? (
                      /* 3. YouTube preview */
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img
                          src={
                            editForm.thumbnail
                              ? absoluteMediaSrc(editForm.thumbnail) || editForm.thumbnail
                              : editDetectedYouTubeThumbnail
                          }
                          alt="YouTube Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <FaYoutube className="w-12 h-12 text-red-600 filter drop-shadow" />
                        </div>
                      </div>
                    ) : editForm.url ? (
                      /* 4. Normal image/video preview */
                      editForm.type === "video" ? (
                        <video
                          src={absoluteMediaSrc(editForm.url) || editForm.url}
                          controls
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img
                          src={absoluteMediaSrc(editForm.url) || editForm.url}
                          alt={editForm.event || "Preview"}
                          className="w-full h-full object-contain"
                          onError={() => setEditImageError(true)}
                        />
                      )
                    ) : (
                      /* 5. Empty placeholder */
                      <div className="text-primary-500 text-xs flex flex-col items-center">
                        <FaImage className="w-8 h-8 mb-1" />
                        <span>No media source provided</span>
                      </div>
                    )}
                  </div>

                  {/* Mode Selector for Editing Source: File vs URL */}
                  {editForm.type === "image" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex rounded-xl bg-primary-100 dark:bg-primary-800 p-1">
                          <button
                            type="button"
                            onClick={() => setEditImageMode("file")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                              editImageMode === "file"
                                ? "bg-white dark:bg-primary-900 text-primary-950 dark:text-white shadow-xs"
                                : "text-primary-600 dark:text-primary-400"
                            }`}
                          >
                            <FaCloudUploadAlt className="w-3.5 h-3.5 text-secondary-500" />
                            <span>Replace Image File</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditImageMode("url")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                              editImageMode === "url"
                                ? "bg-white dark:bg-primary-900 text-primary-950 dark:text-white shadow-xs"
                                : "text-primary-600 dark:text-primary-400"
                            }`}
                          >
                            <FaLink className="w-3.5 h-3.5" />
                            <span>Edit Image URL</span>
                          </button>
                        </div>

                        {editSelectedFile && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                            ✓ Replacement queued
                          </span>
                        )}
                      </div>

                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleEditFileChange}
                        className="hidden"
                        id="edit-image-file-input"
                      />

                      {editImageMode === "file" ? (
                        <div
                          onClick={() => editFileInputRef.current?.click()}
                          className="cursor-pointer border-2 border-dashed border-primary-300 dark:border-primary-700 hover:border-secondary-500 rounded-2xl p-5 text-center flex flex-col items-center justify-center transition bg-primary-50/50 dark:bg-primary-950/40"
                        >
                          <FaCloudUploadAlt className="w-8 h-8 text-secondary-500 mb-1.5" />
                          <span className="font-bold text-xs text-primary-900 dark:text-primary-100">
                            {editSelectedFile
                              ? `Selected: ${editSelectedFile.name} (${(editSelectedFile.size / 1024).toFixed(0)} KB)`
                              : "Click to choose a replacement image from your device"}
                          </span>
                          <span className="text-[11px] text-primary-400 mt-0.5">
                            Supports PNG, JPG, WEBP, GIF, SVG (up to 20MB)
                          </span>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="text"
                            value={editForm.url}
                            onChange={(e) => {
                              setEditForm({ ...editForm, url: e.target.value });
                              setEditImageError(false);
                            }}
                            placeholder="https://images.unsplash.com/... or /uploads/media/..."
                            className="w-full px-4 py-2.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs font-mono text-primary-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Video URL or Replacement Controls */}
                  {editForm.type === "video" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                          Video Source URL (YouTube or Direct Video File)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={editForm.url}
                            onChange={(e) =>
                              setEditForm({ ...editForm, url: e.target.value })
                            }
                            placeholder="https://www.youtube.com/watch?v=... or /uploads/media/..."
                            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs font-mono text-primary-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500"
                          />
                          {editDetectedYouTubeId && (
                            <FaYoutube className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 w-5 h-5 pointer-events-none" />
                          )}
                        </div>
                      </div>

                      {/* Video File Replacement button if direct video */}
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/ogg"
                        onChange={handleEditFileChange}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          className="px-3.5 py-2 bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200 text-xs font-bold rounded-xl hover:bg-primary-200 dark:hover:bg-primary-700 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <FaVideo className="w-3.5 h-3.5 text-secondary-500" />
                          <span>Replace Video File from Device</span>
                        </button>
                        {editSelectedFile && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold truncate">
                            ✓ {editSelectedFile.name}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cover Thumbnail Section */}
                  <div className="pt-2 border-t border-primary-100 dark:border-primary-800/80">
                    <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                      Cover Thumbnail {editForm.type === "image" ? "(Optional, defaults to image)" : "(Required for video)"}
                    </label>
                    <input
                      ref={editCoverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEditCoverFileChange}
                      className="hidden"
                    />

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editForm.thumbnail}
                        onChange={(e) => {
                          setEditForm({ ...editForm, thumbnail: e.target.value });
                          setEditThumbnailError(false);
                        }}
                        placeholder="https://... or /uploads/media/..."
                        className="flex-1 px-4 py-2 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs font-mono text-primary-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500"
                      />
                      <button
                        type="button"
                        onClick={() => editCoverInputRef.current?.click()}
                        className="px-3 py-2 bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200 font-bold text-xs rounded-xl hover:bg-primary-200 transition cursor-pointer flex items-center gap-1 whitespace-nowrap"
                        title="Upload cover image file"
                      >
                        <FaCloudUploadAlt className="w-3.5 h-3.5" />
                        <span>Upload Cover</span>
                      </button>
                      {editDetectedYouTubeThumbnail && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditForm({
                              ...editForm,
                              thumbnail: editDetectedYouTubeThumbnail,
                            })
                          }
                          className="px-3 py-2 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold text-xs rounded-xl hover:bg-red-200 transition cursor-pointer whitespace-nowrap"
                        >
                          YouTube Thumb
                        </button>
                      )}
                    </div>

                    {editCoverPreviewUrl && (
                      <div className="mt-2 relative rounded-xl overflow-hidden aspect-video max-h-32 bg-black w-44 border border-primary-300">
                        <img
                          src={editCoverPreviewUrl}
                          alt="Cover Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-bold rounded">
                          New Cover
                        </div>
                        <button
                          type="button"
                          onClick={removeEditCoverFile}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer"
                        >
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Name */}
                <div>
                  <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                    Event / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.event}
                    onChange={(e) =>
                      setEditForm({ ...editForm, event: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-sm font-semibold text-primary-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  />
                </div>

                {/* Category & Theme */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs font-bold text-primary-950 dark:text-white cursor-pointer"
                    >
                      {editCategoryOptions.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat
                            .replace(/-/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                      Theme
                    </label>
                    <select
                      value={editForm.theme}
                      onChange={(e) =>
                        setEditForm({ ...editForm, theme: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs font-bold text-primary-950 dark:text-white cursor-pointer"
                    >
                      <option value="">No theme</option>
                      {editThemeOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location & Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) =>
                        setEditForm({ ...editForm, location: e.target.value })
                      }
                      placeholder="e.g. Arena Dome"
                      className="w-full px-4 py-2 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs text-primary-950 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={editForm.duration}
                      onChange={(e) =>
                        setEditForm({ ...editForm, duration: e.target.value })
                      }
                      placeholder="e.g. 02:15"
                      className="w-full px-4 py-2 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs text-primary-950 dark:text-white"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={(e) =>
                      setEditForm({ ...editForm, tags: e.target.value })
                    }
                    placeholder="action, tournament, players"
                    className="w-full px-4 py-2 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs text-primary-950 dark:text-white"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Short description or context..."
                    className="w-full px-4 py-2 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs text-primary-950 dark:text-white"
                  />
                </div>

                {/* Visibility & Featured */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-primary-700 dark:text-primary-300">
                      Visibility:
                    </label>
                    <select
                      value={editForm.visibility}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          visibility: e.target.value,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-900 text-xs font-bold"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editForm.featured}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          featured: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-primary-300 text-secondary-500 focus:ring-secondary-400 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-primary-800 dark:text-primary-200 flex items-center gap-1">
                      <FaStar className="text-amber-400" /> Featured
                    </span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-primary-100 dark:border-primary-800">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={uploading}
                    className="flex-1 py-3 rounded-2xl border border-primary-300 dark:border-primary-700 font-bold text-xs text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-800 transition cursor-pointer disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 py-3 rounded-2xl bg-secondary-500 hover:bg-secondary-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {uploading ? (
                      <>
                        <FaSpinner className="animate-spin w-3.5 h-3.5" />
                        <span>{uploadProgressText || "Saving Changes..."}</span>
                      </>
                    ) : (
                      <>
                        <FaCheck className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* INTERACTIVE ADMIN LIGHTBOX PREVIEW                        */}
      {/* ========================================================= */}
      {previewMedia && (
        <LightboxViewer
          media={previewMedia}
          onClose={() => setPreviewMedia(null)}
        />
      )}
    </div>
  );
};

export default MediaManagement;
