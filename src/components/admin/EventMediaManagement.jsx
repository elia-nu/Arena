import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  IoImages,
  IoVideocam,
  IoLink,
  IoCloudUpload,
  IoTrash,
  IoEye,
  IoEyeOff,
  IoStar,
  IoStarOutline,
  IoPlayCircle,
} from "react-icons/io5";
import { tournamentAPI, mediaAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";
import {
  detectVideoPlatform,
  parseYouTubeUrl,
  getYouTubeThumbnail,
  isValidMediaUrl,
  absoluteMediaSrc,
  getOptimizedImageSrc,
  isDirectVideoFileUrl,
} from "../../utils/mediaUtils";

const gridThumb = (raw) =>
  getOptimizedImageSrc(raw, { width: 720, quality: 70 });

/** Thumbnail for manage grid (avoid <video src> on list — loads file and can trigger download). */
function ManageEventMediaPreview({ m }) {
  if (m.type === "image") {
    const raw = m.thumbnail || m.url;
    const src = raw ? absoluteMediaSrc(raw) || raw : "";
    return src ? (
      <img
        src={gridThumb(src)}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
        style={{
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }}
      />
    ) : (
      <div className="w-full h-full bg-primary-200" />
    );
  }

  const direct =
    m.platform === "direct" || isDirectVideoFileUrl(m.url || "");
  if (direct && m.url) {
    const th = m.thumbnail;
    if (
      th &&
      typeof th === "string" &&
      !isDirectVideoFileUrl(th) &&
      (th.startsWith("http") || th.startsWith("/"))
    ) {
      const src = absoluteMediaSrc(th) || th;
      return (
        <img
          src={gridThumb(src)}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          style={{
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
          }}
        />
      );
    }
    return (
      <div className="w-full h-full bg-gradient-to-br from-primary-800 to-primary-950 flex items-center justify-center">
        <IoPlayCircle className="w-12 h-12 text-white/90" aria-hidden />
      </div>
    );
  }

  const platform = m.platform || detectVideoPlatform(m.url || "");

  if (platform === "youtube" && m.url) {
    const vid = parseYouTubeUrl(m.url);
    const th =
      m.thumbnail &&
      typeof m.thumbnail === "string" &&
      !isDirectVideoFileUrl(m.thumbnail) &&
      (m.thumbnail.startsWith("http") || m.thumbnail.startsWith("/"))
        ? m.thumbnail
        : vid
          ? getYouTubeThumbnail(vid)
          : "";
    if (th) {
      const src = absoluteMediaSrc(th) || th;
      return (
        <img
          src={gridThumb(src)}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          style={{
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
          }}
        />
      );
    }
  }

  if (platform === "tiktok") {
    const th = m.thumbnail;
    if (
      th &&
      typeof th === "string" &&
      (th.startsWith("http") || th.startsWith("/")) &&
      !isDirectVideoFileUrl(th)
    ) {
      const src = absoluteMediaSrc(th) || th;
      return (
        <img
          src={gridThumb(src)}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          style={{
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
          }}
        />
      );
    }
  }

  if (m.url) {
    const vid = parseYouTubeUrl(m.url);
    if (vid) {
      const src = getYouTubeThumbnail(vid);
      return (
        <img
          src={gridThumb(src)}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          style={{
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
          }}
        />
      );
    }
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-800 to-primary-950">
      <IoPlayCircle className="w-14 h-14 text-white/85" aria-hidden />
    </div>
  );
}

const MAX_VIDEO_BYTES = 120 * 1024 * 1024;

/** True when the tournament has an end date on a calendar day strictly before today (local time). */
const isEndedBeforeToday = (tournament) => {
  if (!tournament?.endDate) return false;
  const end = new Date(tournament.endDate);
  if (Number.isNaN(end.getTime())) return false;
  const endDay = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate()
  );
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return endDay < today;
};

const EventMediaManagement = () => {
  const { showSuccess, showError } = useNotification();
  const [tournaments, setTournaments] = useState([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [eventMedia, setEventMedia] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoMode, setVideoMode] = useState("url"); // url | file
  const [videoUrl, setVideoUrl] = useState("");
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const endedTournaments = tournaments.filter((t) => isEndedBeforeToday(t));

  const selectedTournament = endedTournaments.find(
    (t) => t._id === selectedId
  );

  useEffect(() => {
    const ended = tournaments.filter((t) => isEndedBeforeToday(t));
    if (ended.length === 0) {
      setSelectedId("");
      return;
    }
    setSelectedId((prev) =>
      prev && ended.some((t) => t._id === prev) ? prev : ended[0]._id
    );
  }, [tournaments]);

  const loadTournaments = async () => {
    try {
      setLoadingTournaments(true);
      const data = await tournamentAPI.getAll();
      setTournaments(data.tournaments || []);
    } catch (e) {
      showError(e.message || "Failed to load tournaments");
    } finally {
      setLoadingTournaments(false);
    }
  };

  const loadEventMedia = async (eventId) => {
    if (!eventId) {
      setEventMedia([]);
      return;
    }
    try {
      setLoadingMedia(true);
      const res = await mediaAPI.getAll({
        event: eventId,
        limit: 200,
        page: 1,
      });
      setEventMedia(res.media || []);
    } catch (e) {
      showError(e.message || "Failed to load media for this event");
      setEventMedia([]);
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    loadEventMedia(selectedId);
  }, [selectedId]);

  const handleMultiImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !selectedId) return;

    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) {
      showError("Choose one or more image files");
      e.target.value = "";
      return;
    }

    try {
      setUploadingImages(true);
      let ok = 0;
      for (const file of images) {
        if (file.size > 12 * 1024 * 1024) {
          showError(`Skipped (too large): ${file.name}`);
          continue;
        }
        const { url } = await mediaAPI.uploadImage(file);
        await mediaAPI.create({
          type: "image",
          platform: null,
          url,
          thumbnail: url,
          category: "events",
          event: selectedId,
          visibility: "public",
          description: selectedTournament?.name
            ? `From ${selectedTournament.name}`
            : "",
        });
        ok += 1;
      }
      if (ok) showSuccess(`${ok} image(s) added`);
      await loadEventMedia(selectedId);
    } catch (err) {
      showError(err.message || "Image upload failed");
    } finally {
      setUploadingImages(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleVideoUrlSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) {
      showError("Select an ended event first");
      return;
    }
    const url = videoUrl.trim();
    if (!url) {
      showError("Enter a video URL");
      return;
    }
    const platform = detectVideoPlatform(url);
    if (!platform) {
      showError("Use a YouTube or TikTok URL, or switch to file upload");
      return;
    }
    if (!isValidMediaUrl(url, "video")) {
      showError("Invalid video URL");
      return;
    }

    try {
      setUploadingVideo(true);
      let thumbnail = "";
      if (platform === "youtube") {
        const id = parseYouTubeUrl(url);
        if (id) thumbnail = getYouTubeThumbnail(id);
      }
      await mediaAPI.create({
        type: "video",
        platform,
        url,
        thumbnail,
        category: "events",
        event: selectedId,
        visibility: "public",
        description: selectedTournament?.name
          ? `From ${selectedTournament.name}`
          : "",
      });
      setVideoUrl("");
      showSuccess("Video added");
      await loadEventMedia(selectedId);
    } catch (err) {
      showError(err.message || "Failed to add video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleVideoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    if (!file.type.startsWith("video/")) {
      showError("Please choose a video file");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      showError("Video is too large (max 120MB)");
      e.target.value = "";
      return;
    }

    try {
      setUploadingVideo(true);
      const { url } = await mediaAPI.uploadImage(file);
      await mediaAPI.create({
        type: "video",
        platform: "direct",
        url,
        thumbnail: url,
        category: "events",
        event: selectedId,
        visibility: "public",
        description: selectedTournament?.name
          ? `From ${selectedTournament.name}`
          : "",
      });
      showSuccess("Video uploaded");
      await loadEventMedia(selectedId);
    } catch (err) {
      showError(err.message || "Video upload failed");
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this item from the gallery?")) return;
    try {
      await mediaAPI.delete(id);
      showSuccess("Removed");
      await loadEventMedia(selectedId);
    } catch (e) {
      showError(e.message || "Delete failed");
    }
  };

  const handleToggleVisibility = async (id) => {
    try {
      await mediaAPI.toggleVisibility(id);
      await loadEventMedia(selectedId);
    } catch (e) {
      showError(e.message || "Update failed");
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      await mediaAPI.toggleFeatured(id);
      await loadEventMedia(selectedId);
    } catch (e) {
      showError(e.message || "Update failed");
    }
  };

  const privateCount = eventMedia.filter(
    (m) => m.visibility !== "public"
  ).length;

  const handlePublishAllToEventPage = async () => {
    const privateItems = eventMedia.filter((m) => m.visibility !== "public");
    if (!privateItems.length) return;
    try {
      for (const m of privateItems) {
        await mediaAPI.toggleVisibility(m._id);
      }
      showSuccess(
        `${privateItems.length} item(s) set to public — they will show on the event page.`
      );
      await loadEventMedia(selectedId);
    } catch (e) {
      showError(e.message || "Could not update visibility");
    }
  };

  if (loadingTournaments) {
    return (
      <div className="bg-white border-2 border-primary-200 rounded-3xl p-8">
        <p className="text-primary-600">Loading events…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-secondary-600">
          Event photos &amp; videos
        </h2>
        <p className="text-primary-600 mt-1 text-sm max-w-2xl">
          Attach gallery media to tournaments whose <strong>end date is before today</strong>. Images
          support multi-file upload. Videos can be added via YouTube/TikTok URL or
          by uploading a file.
        </p>
      </div>

      <div className="bg-white border-2 border-primary-200 rounded-2xl p-6 space-y-4">
        <label className="block text-sm font-medium text-primary-700">
          Past event (ended before today)
        </label>
        {endedTournaments.length === 0 ? (
          <p className="text-primary-600 text-sm">
            No tournaments yet with an end date before today. Set an end date on
            finished tournaments under Tournaments, then return here.
          </p>
        ) : (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full max-w-xl px-4 py-3 border border-primary-300 rounded-xl bg-white focus:border-tertiary-500 outline-none"
          >
            {endedTournaments.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
                {t.endDate
                  ? ` — ended ${new Date(t.endDate).toLocaleDateString()}`
                  : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedId && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-primary-200 rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-2 text-secondary-600 font-semibold">
                <IoImages className="text-xl" />
                Images
              </div>
              <p className="text-sm text-primary-600">
                Select multiple images at once. Each file is uploaded and linked
                to this event for the public gallery.
              </p>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                disabled={uploadingImages}
                onChange={handleMultiImageUpload}
                className="block w-full text-sm text-primary-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-secondary-500 file:text-white file:font-medium"
              />
              {uploadingImages && (
                <p className="text-sm text-tertiary-600">Uploading…</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white border-2 border-primary-200 rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-2 text-secondary-600 font-semibold">
                <IoVideocam className="text-xl" />
                Videos
              </div>
              <div className="flex gap-2 border-b border-primary-200 pb-2">
                <button
                  type="button"
                  onClick={() => setVideoMode("url")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${
                    videoMode === "url"
                      ? "bg-secondary-500 text-white"
                      : "text-primary-600 hover:bg-primary-50"
                  }`}
                >
                  <IoLink /> URL
                </button>
                <button
                  type="button"
                  onClick={() => setVideoMode("file")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${
                    videoMode === "file"
                      ? "bg-secondary-500 text-white"
                      : "text-primary-600 hover:bg-primary-50"
                  }`}
                >
                  <IoCloudUpload /> Upload file
                </button>
              </div>

              {videoMode === "url" ? (
                <form onSubmit={handleVideoUrlSubmit} className="space-y-3">
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=… or TikTok link"
                    className="w-full px-4 py-2 border border-primary-300 rounded-xl focus:border-tertiary-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={uploadingVideo}
                    className="px-5 py-2.5 bg-secondary-500 text-white font-semibold rounded-xl hover:bg-secondary-600 disabled:opacity-50"
                  >
                    {uploadingVideo ? "Adding…" : "Add video"}
                  </button>
                </form>
              ) : (
                <div>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    disabled={uploadingVideo}
                    onChange={handleVideoFile}
                    className="block w-full text-sm text-primary-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-secondary-500 file:text-white file:font-medium"
                  />
                  <p className="text-xs text-primary-500 mt-2">
                    Max ~120MB. Plays as uploaded file (direct) in the gallery.
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          <div className="bg-white border-2 border-primary-200 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <h3 className="text-lg font-bold text-secondary-600">
                Manage uploads for this event
              </h3>
              {privateCount > 0 && (
                <button
                  type="button"
                  onClick={handlePublishAllToEventPage}
                  className="shrink-0 px-4 py-2 rounded-xl bg-secondary-500 text-white text-sm font-semibold hover:bg-secondary-600"
                >
                  Publish all to event page ({privateCount})
                </button>
              )}
            </div>
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
              Only <strong>public</strong> items appear on the public event page.
              The <IoEyeOff className="inline w-4 h-4 align-text-bottom" /> icon
              means hidden — click the eye control on each card (or use the
              button above) to make them public.
            </p>
            {loadingMedia ? (
              <p className="text-primary-600 text-sm">Loading…</p>
            ) : eventMedia.length === 0 ? (
              <p className="text-primary-600 text-sm">
                No media linked to this event yet.
              </p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {eventMedia.map((m) => (
                  <li
                    key={m._id}
                    className={`border rounded-xl overflow-hidden flex flex-col bg-primary-50/30 ${
                      m.visibility !== "public"
                        ? "border-amber-400 ring-1 ring-amber-300"
                        : "border-primary-200"
                    }`}
                  >
                    <div className="aspect-video bg-primary-900/10 relative overflow-hidden">
                      <ManageEventMediaPreview m={m} />
                      <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded bg-black/60 text-white capitalize">
                        {m.type}
                      </span>
                      {m.visibility !== "public" && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-amber-500 text-white">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col gap-2">
                      <p className="text-xs text-primary-600 truncate" title={m.url}>
                        {m.url}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-auto">
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(m._id)}
                          className="p-2 rounded-lg border border-primary-200 hover:bg-white text-primary-700"
                          title={
                            m.visibility === "public"
                              ? "Make private"
                              : "Make public"
                          }
                        >
                          {m.visibility === "public" ? (
                            <IoEye />
                          ) : (
                            <IoEyeOff />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(m._id)}
                          className="p-2 rounded-lg border border-primary-200 hover:bg-white text-primary-700"
                          title="Toggle featured"
                        >
                          {m.featured ? <IoStar /> : <IoStarOutline />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(m._id)}
                          className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 ml-auto"
                          title="Delete"
                        >
                          <IoTrash />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EventMediaManagement;
