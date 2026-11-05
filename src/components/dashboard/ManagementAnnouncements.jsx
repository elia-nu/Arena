import { motion } from "framer-motion";

const ManagementAnnouncements = ({ announcements = [] }) => {
  return (
    <motion.div
      className="bg-white border border-primary-200 rounded-lg p-6 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary-900">
          The Arena Management
        </h2>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary-100 text-primary-700">
          Announcements
        </span>
      </div>

      {announcements.length === 0 ? (
        <p className="text-sm text-primary-600">
          No management announcements right now.
        </p>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <article
              key={announcement._id}
              className="rounded-lg border border-primary-200 bg-primary-50 p-4"
            >
              <h3 className="text-sm font-semibold text-primary-900">
                {announcement.title}
              </h3>
              <p className="mt-1 text-sm text-primary-700 whitespace-pre-wrap">
                {announcement.message}
              </p>
              <p className="mt-2 text-xs text-primary-500">
                {new Date(announcement.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ManagementAnnouncements;
