import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { nonprofitAPI, mediaAPI } from "../../services/api";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaUsers,
  FaCalendar,
  FaMapMarkerAlt,
} from "react-icons/fa";
import Pagination from "./Pagination";
import { absoluteMediaSrc, getOptimizedImageSrc } from "../../utils/mediaUtils";

const emptyForm = {
  title: "",
  description: "",
  type: "image",
  mediaUrl: "",
  thumbnailUrl: "",
  date: "",
  venue: "",
  maxParticipants: "",
  status: "published",
  isFeatured: false,
};

const NonProfitActivitiesManagement = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [selectedActivityTitle, setSelectedActivityTitle] = useState("");
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await nonprofitAPI.getAll({ limit: 100 });
      setActivities(data.activities || []);
    } catch (err) {
      console.error("Error loading activities:", err);
      setError(err.message || "Failed to load non-profit activities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
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
      // Normalize form values first
      let formValues = { ...form };

      // If image and no mediaUrl but we have a thumbnail (uploaded file),
      // treat thumbnail as main media URL so admin doesn't have to type it.
      if (
        formValues.type === "image" &&
        !formValues.mediaUrl &&
        formValues.thumbnailUrl
      ) {
        formValues.mediaUrl = formValues.thumbnailUrl;
      }

      const payload = {
        ...formValues,
        maxParticipants: formValues.maxParticipants
          ? Number(formValues.maxParticipants)
          : undefined,
        sponsor: null,
        images: [],
        videos: [],
      };

      if (editing) {
        await nonprofitAPI.update(editing._id, payload);
        setSuccess("Activity updated successfully");
      } else {
        await nonprofitAPI.create(payload);
        setSuccess("Activity created successfully");
      }

      resetForm();
      await loadActivities();
    } catch (err) {
      console.error("Error saving activity:", err);
      setError(err.message || "Failed to save activity.");
    } finally {
      setSaving(false);
      if (success) {
        setTimeout(() => setSuccess(null), 3000);
      }
    }
  };

  const handleEdit = (activity) => {
    setEditing(activity);
    setForm({
      title: activity.title || "",
      description: activity.description || "",
      type: activity.type || "image",
      mediaUrl: activity.mediaUrl || "",
      thumbnailUrl: activity.thumbnailUrl || "",
      date: activity.date ? activity.date.slice(0, 16) : "",
      venue: activity.venue || "",
      maxParticipants: activity.maxParticipants || "",
      status: activity.status || "published",
      isFeatured: !!activity.isFeatured,
    });
  };

  const handleDelete = async (activity) => {
    if (!window.confirm("Delete this activity? This cannot be undone.")) return;
    try {
      setError(null);
      await nonprofitAPI.remove(activity._id);
      setSuccess("Activity deleted successfully");
      await loadActivities();
    } catch (err) {
      console.error("Error deleting activity:", err);
      setError(err.message || "Failed to delete activity.");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError(null);
      const result = await mediaAPI.uploadImage(file);
      setForm((prev) => ({
        ...prev,
        mediaUrl: prev.type === "image" && !prev.mediaUrl ? result.url : prev.mediaUrl,
        thumbnailUrl: result.url,
      }));
      setSuccess("Image uploaded successfully");
    } catch (err) {
      console.error("Error uploading image:", err);
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleViewParticipants = async (activity) => {
    try {
      setParticipantsModalOpen(true);
      setSelectedActivityTitle(activity.title || "Activity");
      setParticipantsLoading(true);
      setSelectedParticipants([]);
      setError(null);

      const data = await nonprofitAPI.getById(activity._id);
      const participants = Array.isArray(data?.activity?.participants)
        ? data.activity.participants
        : [];
      setSelectedParticipants(participants);
    } catch (err) {
      console.error("Error loading participants:", err);
      setError(err.message || "Failed to load participants.");
      setSelectedParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  };

  // Paginate activities
  const totalItems = activities.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedActivities = activities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary-900">
            Non Profit Activities
          </h1>
          <p className="text-sm text-primary-600 mt-1">
            Create and manage community / non-profit activities that users can join.
          </p>
        </div>
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

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        className="bg-white border border-primary-200 rounded-xl p-6 shadow-sm space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-primary-900">
            {editing ? "Edit Activity" : "Create New Activity"}
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
              Title <span className="text-red-500">*</span>
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
              Venue <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              className="w-full rounded-xl border-2 border-primary-200 bg-white px-4 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary-950 mb-1">
              Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-xl border-2 border-primary-200 bg-white px-4 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary-950 mb-1">
              Max Participants (optional)
            </label>
            <input
              type="number"
              min="1"
              value={form.maxParticipants}
              onChange={(e) =>
                setForm({ ...form, maxParticipants: e.target.value })
              }
              className="w-full rounded-xl border-2 border-primary-200 bg-white px-4 py-2 text-sm"
            />
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
            placeholder="Describe what this non-profit activity is about..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-primary-950 mb-1">
              Media Type
            </label>
            <div className="flex gap-3">
              {["image", "video"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, type })}
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 ${
                    form.type === type
                      ? "border-tertiary-500 bg-tertiary-50 text-primary-950"
                      : "border-primary-200 text-primary-600 hover:border-primary-400"
                  }`}
                >
                  {type === "image" ? "Image" : "Video"}
                </button>
              ))}
            </div>

            {form.type === "image" && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  id="nonprofit-image-upload"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage || saving}
                />
                <label
                  htmlFor="nonprofit-image-upload"
                  className="cursor-pointer border-2 border-dashed border-secondary-300 rounded-lg p-4 text-center hover:border-secondary-400 transition-colors flex flex-col items-center gap-2"
                >
                  <span className="text-sm font-medium text-primary-800">
                    Upload Image
                  </span>
                  <span className="text-xs text-primary-500">
                    PNG, JPG, GIF up to 5MB
                  </span>
                  {uploadingImage && (
                    <span className="text-xs text-primary-600">Uploading...</span>
                  )}
                </label>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-primary-950 mb-1">
                Main Media URL{" "}
                {(form.type === "video" ||
                  (form.type === "image" &&
                    !form.mediaUrl &&
                    !form.thumbnailUrl)) && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <input
                type={form.type === "video" ? "url" : "text"}
                value={form.mediaUrl}
                onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                className="w-full rounded-xl border-2 border-primary-200 bg-white px-4 py-2 text-sm"
                placeholder={
                  form.type === "image"
                    ? "Optional if you uploaded main image above"
                    : "https://youtube.com/watch?v=..."
                }
                required={
                  form.type === "video" ||
                  (form.type === "image" && !form.mediaUrl && !form.thumbnailUrl)
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary-950 mb-1">
                Thumbnail URL (optional)
              </label>
              <input
                type={form.type === "video" ? "url" : "text"}
                value={form.thumbnailUrl}
                onChange={(e) =>
                  setForm({ ...form, thumbnailUrl: e.target.value })
                }
                className="w-full rounded-xl border-2 border-primary-200 bg-white px-4 py-2 text-sm"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-primary-900 mb-2">
              Activity Preview
            </p>
            <div className="flex items-center gap-3 text-sm text-primary-700">
              <FaCalendar className="text-tertiary-500" />
              <span>
                {form.date
                  ? new Date(form.date).toLocaleString()
                  : "Pick date & time"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-primary-700">
              <FaMapMarkerAlt className="text-tertiary-500" />
              <span>{form.venue || "Venue"}</span>
            </div>
            {(form.mediaUrl || form.thumbnailUrl) && form.type === "image" && (
              <div className="mt-3">
                <img
                  src={getOptimizedImageSrc(
                    absoluteMediaSrc(form.mediaUrl || form.thumbnailUrl) ||
                      form.mediaUrl ||
                      form.thumbnailUrl,
                    { width: 960, quality: 72 },
                  )}
                  alt={form.title || "Activity"}
                  className="w-full h-40 object-cover rounded-lg border border-primary-200"
                  loading="lazy"
                  decoding="async"
                  style={{
                    transform: "translateZ(0)",
                    backfaceVisibility: "hidden",
                  }}
                />
              </div>
            )}
            {form.type === "video" && form.mediaUrl && (
              <p className="text-xs text-primary-600 mt-2 break-all">
                Video: {form.mediaUrl}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-900 text-white text-sm font-semibold hover:bg-primary-800 disabled:opacity-60"
          >
            <FaPlus className="w-4 h-4" />
            {editing ? "Save Changes" : "Create Activity"}
          </button>
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
      </motion.form>

      {/* List */}
      <div className="bg-white border border-primary-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary-900">
            Existing Activities
          </h2>
          <span className="text-xs text-primary-500">
            {activities.length} activities
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-primary-600">Loading...</p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-primary-600">
            No non-profit activities created yet.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedActivities.map((activity) => (
              <div
                key={activity._id}
                className="flex items-center justify-between gap-4 border border-primary-100 rounded-lg px-4 py-3 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center text-xl">
                    {activity.type === "image" ? "🖼️" : "🎥"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-primary-900">
                      {activity.title}
                    </p>
                    <p className="text-xs text-primary-600 line-clamp-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-primary-500">
                      <span className="inline-flex items-center gap-1">
                        <FaCalendar />
                        {activity.date
                          ? new Date(activity.date).toLocaleString()
                          : "TBD"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FaMapMarkerAlt />
                        {activity.venue}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FaUsers />
                        {activity.participants?.length || 0} joined
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleViewParticipants(activity)}
                    className="px-2.5 py-1.5 rounded-lg border border-primary-200 text-primary-700 text-xs hover:bg-primary-100"
                  >
                    View list
                  </button>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      activity.status === "published"
                        ? "bg-green-100 text-green-800"
                        : activity.status === "draft"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {activity.status}
                  </span>
                  {activity.isFeatured && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800">
                      Featured
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleEdit(activity)}
                    className="p-2 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-100"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(activity)}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              ))}
            </div>
            
            {/* Pagination */}
            {activities.length > 0 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItems}
                  onItemsPerPageChange={(newItemsPerPage) => {
                    setItemsPerPage(newItemsPerPage);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {participantsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setParticipantsModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-xl border border-primary-200 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-primary-100">
              <div>
                <h3 className="text-lg font-semibold text-primary-900">
                  Joined Participants
                </h3>
                <p className="text-xs text-primary-600">{selectedActivityTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setParticipantsModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-primary-200 text-primary-700 text-sm hover:bg-primary-100"
              >
                Close
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {participantsLoading ? (
                <p className="text-sm text-primary-600">Loading participants...</p>
              ) : selectedParticipants.length === 0 ? (
                <p className="text-sm text-primary-600">
                  No participants have joined this activity yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedParticipants.map((participant, index) => {
                    const user = participant?.user || {};
                    const name =
                      user?.firstName || user?.lastName
                        ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                        : user?.username || "Participant";
                    return (
                      <div
                        key={participant?._id || user?._id || index}
                        className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-primary-900">{name}</p>
                        <p className="text-xs text-primary-600">
                          {user?.phone || "No phone"}
                        </p>
                        <p className="text-[11px] text-primary-500 mt-1">
                          Joined:{" "}
                          {participant?.joinedAt
                            ? new Date(participant.joinedAt).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NonProfitActivitiesManagement;


