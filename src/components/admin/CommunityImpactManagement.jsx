import { useEffect, useState } from "react";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaCalendar,
  FaMapMarkerAlt,
  FaImage,
  FaVideo,
  FaBuilding,
  FaTimes,
} from "react-icons/fa";
import { communityImpactAPI, mediaAPI } from "../../services/api";
import { absoluteMediaSrc, getOptimizedImageSrc } from "../../utils/mediaUtils";

const emptyForm = {
  title: "",
  description: "",
  sponsor: { name: "", logo: "", website: "" },
  images: [],
  videos: [],
  date: "",
  place: "",
  status: "published",
  isFeatured: false,
};

const CommunityImpactManagement = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState("");

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await communityImpactAPI.getAll({
        limit: 100,
        status: "",
      });
      setEntries(data.entries || []);
    } catch (err) {
      setError(err.message || "Failed to load community impact entries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ...form,
        sponsor:
          form.sponsor?.name || form.sponsor?.logo || form.sponsor?.website
            ? form.sponsor
            : undefined,
        images: Array.isArray(form.images) ? form.images.filter(Boolean) : [],
        videos: Array.isArray(form.videos)
          ? form.videos
              .filter((video) => video?.url)
              .map((video) => ({
                url: video.url,
                sourceType: video.sourceType === "upload" ? "upload" : "url",
              }))
          : [],
      };

      if (editing) {
        await communityImpactAPI.update(editing._id, payload);
        setSuccess("Community impact entry updated successfully");
      } else {
        await communityImpactAPI.create(payload);
        setSuccess("Community impact entry created successfully");
      }

      resetForm();
      await loadEntries();
    } catch (err) {
      setError(err.message || "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry) => {
    setEditing(entry);
    setForm({
      title: entry.title || "",
      description: entry.description || "",
      sponsor: {
        name: entry.sponsor?.name || "",
        logo: entry.sponsor?.logo || "",
        website: entry.sponsor?.website || "",
      },
      images: Array.isArray(entry.images) ? [...entry.images] : [],
      videos: Array.isArray(entry.videos)
        ? entry.videos.map((video) => ({
            url: video.url || "",
            sourceType: video.sourceType === "upload" ? "upload" : "url",
          }))
        : [],
      date: entry.date ? entry.date.slice(0, 16) : "",
      place: entry.place || "",
      status: entry.status || "published",
      isFeatured: Boolean(entry.isFeatured),
    });
  };

  const handleDelete = async (entry) => {
    if (!window.confirm("Delete this community impact entry?")) return;

    try {
      setError(null);
      await communityImpactAPI.remove(entry._id);
      setSuccess("Community impact entry deleted successfully");
      await loadEntries();
    } catch (err) {
      setError(err.message || "Failed to delete entry.");
    }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      setUploading(true);
      setUploadLabel("images");
      setError(null);
      const uploads = [];
      for (let i = 0; i < files.length; i += 1) {
        const result = await mediaAPI.uploadImage(files[i]);
        uploads.push(result.url);
      }
      setForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...uploads],
      }));
      setSuccess(`${uploads.length} image(s) uploaded`);
    } catch (err) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
      setUploadLabel("");
      e.target.value = "";
    }
  };

  const removeImage = (index) => {
    setForm((prev) => {
      const images = [...(prev.images || [])];
      images.splice(index, 1);
      return { ...prev, images };
    });
  };

  const addVideoInput = () => {
    setForm((prev) => ({
      ...prev,
      videos: [...(prev.videos || []), { url: "", sourceType: "url" }],
    }));
  };

  const updateVideo = (index, updates) => {
    setForm((prev) => {
      const videos = [...(prev.videos || [])];
      videos[index] = { ...videos[index], ...updates };
      return { ...prev, videos };
    });
  };

  const removeVideo = (index) => {
    setForm((prev) => {
      const videos = [...(prev.videos || [])];
      videos.splice(index, 1);
      return { ...prev, videos };
    });
  };

  const handleVideoUpload = async (index, file) => {
    if (!file) return;
    try {
      setUploading(true);
      setUploadLabel(`video-${index}`);
      setError(null);
      const result = await mediaAPI.uploadVideo(file);
      updateVideo(index, { url: result.url, sourceType: "upload" });
      setSuccess("Video uploaded successfully");
    } catch (err) {
      setError(err.message || "Failed to upload video.");
    } finally {
      setUploading(false);
      setUploadLabel("");
    }
  };

  const handleSponsorLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadLabel("sponsor-logo");
      setError(null);
      const result = await mediaAPI.uploadImage(file);
      setForm((prev) => ({
        ...prev,
        sponsor: {
          ...prev.sponsor,
          logo: result.url,
        },
      }));
    } catch (err) {
      setError(err.message || "Failed to upload sponsor logo.");
    } finally {
      setUploading(false);
      setUploadLabel("");
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">
          Community Impact
        </h1>
        <p className="text-sm text-primary-600 mt-1">
          Separate community impact content with sponsor details, media, date,
          and place.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-primary-200 rounded-xl p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-900">
            {editing ? "Edit Entry" : "Create New Entry"}
          </h2>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-primary-600 hover:text-primary-900 underline"
            >
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-primary-950 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border-2 border-primary-200 bg-white px-4 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary-950 mb-1">
              Place *
            </label>
            <input
              type="text"
              value={form.place}
              onChange={(e) => setForm({ ...form, place: e.target.value })}
              className="w-full rounded-xl border-2 border-primary-200 bg-white px-4 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary-950 mb-1">
              Date *
            </label>
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-xl border-2 border-primary-200 bg-white px-4 py-2 text-sm"
              required
            />
          </div>

          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-xs text-primary-700">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) =>
                  setForm({ ...form, isFeatured: e.target.checked })
                }
              />
              Featured
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="text-xs rounded-lg border-2 border-primary-200 bg-white px-2 py-1 text-primary-700"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-primary-950 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-xl border-2 border-primary-200 bg-white px-4 py-2 text-sm"
          />
        </div>

        <div className="border-t border-primary-200 pt-4">
          <h3 className="text-sm font-semibold text-primary-900 mb-3 flex items-center gap-2">
            <FaBuilding className="text-tertiary-500" />
            Sponsor
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              value={form.sponsor?.name || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  sponsor: { ...form.sponsor, name: e.target.value },
                })
              }
              className="rounded-lg border-2 border-primary-200 bg-white px-3 py-2 text-sm"
              placeholder="Sponsor Name"
            />
            <input
              type="url"
              value={form.sponsor?.website || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  sponsor: { ...form.sponsor, website: e.target.value },
                })
              }
              className="rounded-lg border-2 border-primary-200 bg-white px-3 py-2 text-sm"
              placeholder="Sponsor Website"
            />
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                id="community-impact-sponsor-logo"
                className="hidden"
                onChange={handleSponsorLogoUpload}
                disabled={uploading || saving}
              />
              <label
                htmlFor="community-impact-sponsor-logo"
                className="cursor-pointer flex-1 rounded-lg border-2 border-dashed border-primary-300 px-3 py-2 text-xs text-center text-primary-700 hover:border-primary-400"
              >
                {uploading && uploadLabel === "sponsor-logo"
                  ? "Uploading Sponsor Logo..."
                  : "Sponsor Logo Upload"}
              </label>
              {form.sponsor?.logo && (
                <img
                  src={getOptimizedImageSrc(
                    absoluteMediaSrc(form.sponsor.logo) || form.sponsor.logo,
                    {
                    width: 128,
                    quality: 70,
                    },
                  )}
                  alt="Sponsor logo"
                  className="h-10 w-10 rounded object-cover border border-primary-200"
                  loading="lazy"
                  decoding="async"
                  style={{
                    transform: "translateZ(0)",
                    backfaceVisibility: "hidden",
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-primary-200 pt-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-primary-900 mb-2 flex items-center gap-2">
              <FaImage className="text-tertiary-500" />
              Images (multiple)
            </h3>
            <input
              type="file"
              accept="image/*"
              multiple
              id="community-impact-images"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading || saving}
            />
            <label
              htmlFor="community-impact-images"
              className="cursor-pointer inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-primary-300 px-4 py-2 text-sm text-primary-700 hover:border-primary-400"
            >
              <FaImage className="w-4 h-4" />
              {uploading && uploadLabel === "images"
                ? "Uploading Images..."
                : "Upload Images"}
            </label>
            {form.images?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.images.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 rounded-lg overflow-hidden border border-primary-200"
                  >
                    <img
                      src={getOptimizedImageSrc(absoluteMediaSrc(url) || url, {
                        width: 120,
                        quality: 68,
                      })}
                      alt={`Image ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      style={{
                        transform: "translateZ(0)",
                        backfaceVisibility: "hidden",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center"
                    >
                      <FaTimes className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-primary-900 mb-2 flex items-center gap-2">
              <FaVideo className="text-tertiary-500" />
              Videos (URL or direct upload)
            </h3>
            <div className="space-y-2">
              {(form.videos || []).map((video, idx) => (
                <div key={idx} className="border border-primary-200 rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-[130px,1fr,auto] gap-2">
                    <select
                      value={video.sourceType || "url"}
                      onChange={(e) =>
                        updateVideo(idx, { sourceType: e.target.value })
                      }
                      className="rounded-lg border border-primary-200 px-2 py-2 text-xs"
                    >
                      <option value="url">URL</option>
                      <option value="upload">Direct Upload</option>
                    </select>
                    <input
                      type="text"
                      value={video.url || ""}
                      onChange={(e) => updateVideo(idx, { url: e.target.value })}
                      className="rounded-lg border border-primary-200 px-3 py-2 text-sm"
                      placeholder={
                        video.sourceType === "upload"
                          ? "Upload a file to fill this URL"
                          : "Video URL"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeVideo(idx)}
                      className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                  {video.sourceType === "upload" && (
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="video/*"
                        id={`community-impact-video-upload-${idx}`}
                        className="hidden"
                        onChange={(e) =>
                          handleVideoUpload(idx, e.target.files?.[0])
                        }
                        disabled={uploading || saving}
                      />
                      <label
                        htmlFor={`community-impact-video-upload-${idx}`}
                        className="cursor-pointer inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-primary-300 px-3 py-1.5 text-xs text-primary-700 hover:border-primary-400"
                      >
                        {uploading && uploadLabel === `video-${idx}`
                          ? "Uploading Video..."
                          : "Upload Video File"}
                      </label>
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addVideoInput}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-primary-300 text-primary-600 hover:border-primary-400 text-sm font-medium"
              >
                <FaVideo className="w-4 h-4" />
                Add Video
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || uploading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-900 text-white text-sm font-semibold hover:bg-primary-800 disabled:opacity-60"
        >
          <FaPlus className="w-4 h-4" />
          {editing ? "Save Changes" : "Create Entry"}
        </button>
      </form>

      <div className="bg-white border border-primary-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">
          Existing Community Impact Entries
        </h2>
        {loading ? (
          <p className="text-sm text-primary-600">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-primary-600">No entries created yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry._id}
                className="flex items-center justify-between gap-4 border border-primary-100 rounded-lg px-4 py-3 hover:bg-primary-50 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-primary-900">
                    {entry.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-primary-500">
                    <span className="inline-flex items-center gap-1">
                      <FaCalendar />
                      {entry.date
                        ? new Date(entry.date).toLocaleString()
                        : "No date"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FaMapMarkerAlt />
                      {entry.place}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(entry)}
                    className="p-2 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-100"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry)}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityImpactManagement;
