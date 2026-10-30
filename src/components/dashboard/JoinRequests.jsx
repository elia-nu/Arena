import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IoCheckmark, IoClose, IoPerson } from "react-icons/io5";
import { teamAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";

const JoinRequests = ({ onRequestProcessed }) => {
  const { showError, showSuccess } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await teamAPI.getJoinRequests();
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Error fetching join requests:", error);
      showError(error.message || "Failed to load join requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      setProcessingId(requestId);
      await teamAPI.acceptJoinRequest(requestId);
      showSuccess("Join request accepted! The player has been added to your team.");
      await fetchRequests();
      if (onRequestProcessed) {
        onRequestProcessed();
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      showError(error.message || "Failed to accept join request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setProcessingId(requestId);
      await teamAPI.rejectJoinRequest(requestId);
      showSuccess("Join request rejected.");
      await fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      showError(error.message || "Failed to reject join request");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-primary-600">Loading join requests...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 bg-primary-50 rounded-lg border border-primary-200">
        <p className="text-primary-600">No pending join requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <motion.div
          key={request._id}
          className="bg-white border-2 border-primary-200 rounded-lg p-5 hover:border-primary-300 transition-colors"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <IoPerson className="text-primary-600 text-xl" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-primary-900 mb-1">
                {request.player.firstName && request.player.lastName
                  ? `${request.player.firstName} ${request.player.lastName}`
                  : request.player.username}
              </h4>
              <p className="text-sm text-primary-600 mb-2">
                {request.player.email}
              </p>
              <p className="text-sm font-medium text-primary-700 mb-2">
                Wants to join: <span className="font-semibold">{request.team.name}</span>
              </p>
              {request.message && (
                <div className="bg-primary-50 rounded-lg p-3 mt-2">
                  <p className="text-sm text-primary-700">{request.message}</p>
                </div>
              )}
              <p className="text-xs text-primary-500 mt-2">
                Requested {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleAccept(request._id)}
              disabled={processingId === request._id}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoCheckmark />
              {processingId === request._id ? "Processing..." : "Accept"}
            </button>
            <button
              onClick={() => handleReject(request._id)}
              disabled={processingId === request._id}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoClose />
              {processingId === request._id ? "Processing..." : "Reject"}
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default JoinRequests;

