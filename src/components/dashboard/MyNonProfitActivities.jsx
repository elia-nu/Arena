import { motion } from "framer-motion";
import { absoluteMediaSrc } from "../../utils/mediaUtils";

const MyNonProfitActivities = ({ activities = [] }) => {
  if (!activities.length) {
    return (
      <div className="text-center py-8">
        <p className="text-primary-600 text-sm">
          You have not joined any non-profit activities yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((a, index) => (
        <motion.div
          key={a._id || a.id || index}
          className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <div className="flex items-start gap-3">
            {a.mediaUrl && (
              <div className="w-16 h-16 rounded-md overflow-hidden bg-primary-100 flex-shrink-0">
                <img
                  src={absoluteMediaSrc(a.mediaUrl) || a.mediaUrl}
                  alt={a.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-primary-900">
                {a.title}
              </h3>
              <p className="text-xs text-primary-600 mt-1 line-clamp-2">
                {a.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-primary-600">
                {a.date && (
                  <span>
                    {new Date(a.date).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                {a.venue && <span>• {a.venue}</span>}
              </div>
            </div>
          </div>
          <div className="text-xs text-primary-500 mt-1 md:mt-0">
            Joined:{" "}
            {a.joinedAt
              ? new Date(a.joinedAt).toLocaleDateString()
              : "Recently"}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default MyNonProfitActivities;
