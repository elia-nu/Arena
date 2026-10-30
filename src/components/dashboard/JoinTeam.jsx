import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { teamAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";
import { useAuth } from "../../context/AuthContext";

const JoinTeam = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingTeam, setRequestingTeam] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const data = await teamAPI.getAllTeams();
      setTeams(data.teams || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
      showError(error.message || "Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestJoin = async () => {
    if (!selectedTeam) return;

    try {
      setRequestingTeam(selectedTeam._id);
      await teamAPI.requestToJoin(selectedTeam._id, message);
      showSuccess("Join request sent successfully! The team leader will be notified.");
      setShowMessageModal(false);
      setMessage("");
      setSelectedTeam(null);
      // Refresh teams to update status
      await fetchTeams();
    } catch (error) {
      console.error("Error requesting to join:", error);
      showError(error.message || "Failed to send join request");
    } finally {
      setRequestingTeam(null);
    }
  };

  const openRequestModal = (team) => {
    setSelectedTeam(team);
    setMessage("");
    setShowMessageModal(true);
  };

  const availableTeams = teams.filter((team) => team.canJoin);
  const myTeams = teams.filter((team) => team.isMember || team.isLeader);
  const pendingRequests = teams.filter((team) => team.hasPendingRequest);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-primary-600">Loading teams...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* My Teams Section */}
      {myTeams.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-primary-900 mb-4">
            My Teams
          </h3>
          <div className="space-y-3">
            {myTeams.map((team) => (
              <motion.div
                key={team._id}
                className="bg-green-50 border-2 border-green-200 rounded-lg p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-primary-900">
                      {team.name}
                    </p>
                    <p className="text-sm text-primary-600 mt-1">
                      {team.isLeader ? "Team Leader" : "Member"} •{" "}
                      {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                    {team.isLeader ? "Leader" : "Member"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-primary-900 mb-4">
            Pending Requests
          </h3>
          <div className="space-y-3">
            {pendingRequests.map((team) => (
              <motion.div
                key={team._id}
                className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-primary-900">
                      {team.name}
                    </p>
                    <p className="text-sm text-primary-600 mt-1">
                      Waiting for team leader's response
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                    Pending
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Available Teams Section */}
      <div>
        <h3 className="text-lg font-semibold text-primary-900 mb-4">
          Available Teams
        </h3>
        {availableTeams.length === 0 ? (
          <div className="text-center py-12 bg-primary-50 rounded-lg border border-primary-200">
            <p className="text-primary-600">
              {teams.length === 0
                ? "No teams available at the moment."
                : "You have already joined or requested to join all available teams."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableTeams.map((team) => (
              <motion.div
                key={team._id}
                className="bg-white border border-primary-200 rounded-lg p-5 hover:bg-primary-50 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-primary-900 mb-2">
                      {team.name}
                    </h4>
                    <div className="space-y-1 text-sm text-primary-600">
                      <p>
                        <span className="font-medium">Leader:</span>{" "}
                        {team.leader.firstName && team.leader.lastName
                          ? `${team.leader.firstName} ${team.leader.lastName}`
                          : team.leader.username}
                      </p>
                      <p>
                        <span className="font-medium">Members:</span>{" "}
                        {team.memberCount}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openRequestModal(team)}
                  className="w-full px-4 py-2 bg-primary-900 text-white font-semibold rounded-lg hover:bg-primary-800 transition-colors"
                >
                  Request to Join
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Message Modal */}
      {showMessageModal && selectedTeam && (
        <div className="fixed inset-0 bg-primary-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white rounded-2xl p-6 max-w-md w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="text-xl font-semibold text-primary-900 mb-4">
              Request to Join {selectedTeam.name}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell the team leader why you want to join..."
                className="w-full rounded-lg border-2 border-primary-200 bg-white px-4 py-2 min-h-[100px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-primary-500 mt-1">
                {message.length}/500 characters
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setSelectedTeam(null);
                  setMessage("");
                }}
                className="flex-1 px-4 py-2 border-2 border-primary-300 text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
                disabled={requestingTeam !== null}
              >
                  Cancel
              </button>
              <button
                onClick={handleRequestJoin}
                disabled={requestingTeam !== null}
                className="flex-1 px-4 py-2 bg-primary-900 text-white font-semibold rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestingTeam === selectedTeam._id
                  ? "Sending..."
                  : "Send Request"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default JoinTeam;

