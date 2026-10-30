import { useEffect, useState } from "react";
import { announcementAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";

const ManagementAnnouncements = () => {
  const { showError, showSuccess } = useNotification();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const response = await announcementAPI.getManagementAnnouncements();
        setAnnouncements(response.announcements || []);
      } catch (error) {
        showError(error.message || "Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, [showError]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !message.trim()) {
      showError("Title and message are required");
      return;
    }

    try {
      setSubmitting(true);
      const response = await announcementAPI.createManagementAnnouncement({
        title: title.trim(),
        message: message.trim(),
      });

      setAnnouncements((prev) => [response.announcement, ...prev].slice(0, 10));
      setTitle("");
      setMessage("");
      showSuccess("Announcement sent to all dashboards");
    } catch (error) {
      showError(error.message || "Failed to send announcement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Send Management Announcement
        </h2>
        <p className="text-sm text-gray-600 mb-5">
          This will appear on team leader and player dashboards as a message from
          Let&apos;s Kick It management.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tournament schedule update"
              maxLength={120}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your announcement..."
              rows={5}
              maxLength={2000}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Sending..." : "Send announcement"}
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Announcements
        </h3>

        {loading ? (
          <p className="text-sm text-gray-600">Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-gray-600">
            No announcements have been sent yet.
          </p>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <article
                key={announcement._id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <h4 className="text-sm font-semibold text-gray-900">
                  {announcement.title}
                </h4>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                  {announcement.message}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {new Date(announcement.createdAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagementAnnouncements;
