import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IoPeople,
  IoSearch,
  IoFilter,
  IoDownload,
  IoCalendar,
  IoTrophy,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoTime,
} from "react-icons/io5";
import { adminAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";
import Pagination from "./Pagination";

const ParticipantTracking = () => {
  const { showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, teams, players
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [participants, setParticipants] = useState({
    teams: [],
    players: [],
    topParticipants: [],
    participationStats: {},
  });

  useEffect(() => {
    fetchParticipantData();
  }, [filterType]);

  const fetchParticipantData = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getParticipantTracking({
        filterType,
      });
      setParticipants(data);
    } catch (error) {
      console.error("Error fetching participant data:", error);
      showError("Failed to load participant data");
    } finally {
      setLoading(false);
    }
  };

  const exportParticipantData = async () => {
    try {
      const data = await adminAPI.exportReport("participants", {
        filterType,
      });
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `participant_tracking_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      showError("Failed to export participant data");
    }
  };

  const filteredTeams =
    filterType === "all" || filterType === "teams"
      ? participants.teams?.filter(
          (team) =>
            !searchTerm ||
            team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            team.leader?.username
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())
        ) || []
      : [];

  const filteredPlayers =
    filterType === "all" || filterType === "players"
      ? participants.players?.filter(
          (player) =>
            !searchTerm ||
            player.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.firstName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            player.lastName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())
        ) || []
      : [];

  // Pagination for teams
  const teamsTotalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const paginatedTeams = filteredTeams.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Pagination for players
  const playersTotalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const paginatedPlayers = filteredPlayers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-secondary-600">
              Participant Tracking Dashboard
            </h2>
            <p className="text-sm text-primary-600 mt-1">
              Track teams and players across all tournaments
            </p>
          </div>
          <button
            onClick={exportParticipantData}
            className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white font-semibold rounded-lg hover:bg-primary-800 transition-colors"
          >
            <IoDownload />
            Export
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 text-xl" />
            <input
              type="text"
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <IoFilter className="text-primary-600" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
            >
              <option value="all">All Participants</option>
              <option value="teams">Teams Only</option>
              <option value="players">Players Only</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Teams</p>
                <p className="text-2xl font-bold text-blue-900">
                  {participants.participationStats?.totalTeams || 0}
                </p>
              </div>
              <IoPeople className="text-3xl text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  Total Players
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {participants.participationStats?.totalPlayers || 0}
                </p>
              </div>
              <IoPeople className="text-3xl text-green-600" />
            </div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">
                  Active Participants
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {participants.participationStats?.activeParticipants || 0}
                </p>
              </div>
              <IoCheckmarkCircle className="text-3xl text-purple-600" />
            </div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Avg. Tournaments
                </p>
                <p className="text-2xl font-bold text-amber-900">
                  {(
                    participants.participationStats?.averageTournaments || 0
                  ).toFixed(1)}
                </p>
              </div>
              <IoCalendar className="text-3xl text-amber-600" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Top Participants */}
      {participants.topParticipants?.length > 0 && (
        <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
          <h3 className="text-xl font-bold text-secondary-600 mb-4">
            Top Participants
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {participants.topParticipants.slice(0, 6).map((participant, index) => (
              <motion.div
                key={participant._id || index}
                className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4 hover:border-tertiary-500 transition-all"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-tertiary-500 text-white rounded text-xs font-bold">
                      #{index + 1}
                    </span>
                    <h4 className="font-bold text-primary-900">
                      {participant.name || participant.username}
                    </h4>
                  </div>
                  {participant.type === "team" ? (
                    <IoPeople className="text-primary-400" />
                  ) : (
                    <IoPeople className="text-primary-400" />
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-primary-600">Tournaments:</span>
                    <span className="font-semibold text-primary-900">
                      {participant.tournamentCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-600">Wins:</span>
                    <span className="font-semibold text-primary-900">
                      {participant.wins || 0}
                    </span>
                  </div>
                  {participant.revenue && (
                    <div className="flex justify-between">
                      <span className="text-primary-600">Revenue:</span>
                      <span className="font-semibold text-primary-900">
                        ${(participant.revenue || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Teams List */}
      {(filterType === "all" || filterType === "teams") && (
        <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
          <h3 className="text-xl font-bold text-secondary-600 mb-4">
            Teams ({filteredTeams.length})
          </h3>
          {loading ? (
            <div className="text-center text-primary-600 py-8">Loading...</div>
          ) : paginatedTeams.length > 0 ? (
            <>
              <div className="space-y-3">
                {paginatedTeams.map((team, index) => (
                <motion.div
                  key={team._id || index}
                  className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4 hover:border-tertiary-500 transition-all"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-primary-900">
                          {team.name}
                        </h4>
                        {team.isActive !== false ? (
                          <IoCheckmarkCircle className="text-green-500" />
                        ) : (
                          <IoCloseCircle className="text-red-500" />
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-primary-600 text-xs">Leader</p>
                          <p className="font-semibold text-primary-900">
                            {team.leader?.username || team.leader?.email || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-primary-600 text-xs">Members</p>
                          <p className="font-semibold text-primary-900">
                            {team.memberCount || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-primary-600 text-xs">Tournaments</p>
                          <p className="font-semibold text-primary-900">
                            {team.tournamentCount || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-primary-600 text-xs">Wins</p>
                          <p className="font-semibold text-primary-900">
                            {team.wins || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                ))}
              </div>
              {filteredTeams.length > 0 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={teamsTotalPages}
                    onPageChange={(page) => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredTeams.length}
                    onItemsPerPageChange={(newItemsPerPage) => {
                      setItemsPerPage(newItemsPerPage);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-primary-600 py-8">
              No teams found
            </div>
          )}
        </div>
      )}

      {/* Players List */}
      {(filterType === "all" || filterType === "players") && (
        <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
          <h3 className="text-xl font-bold text-secondary-600 mb-4">
            Players ({filteredPlayers.length})
          </h3>
          {loading ? (
            <div className="text-center text-primary-600 py-8">Loading...</div>
          ) : paginatedPlayers.length > 0 ? (
            <>
              <div className="space-y-3">
                {paginatedPlayers.map((player, index) => (
                <motion.div
                  key={player._id || index}
                  className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4 hover:border-tertiary-500 transition-all"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-primary-900">
                          {player.firstName && player.lastName
                            ? `${player.firstName} ${player.lastName}`
                            : player.username}
                        </h4>
                        {player.isActive !== false ? (
                          <IoCheckmarkCircle className="text-green-500" />
                        ) : (
                          <IoCloseCircle className="text-red-500" />
                        )}
                        <span className="px-2 py-1 bg-primary-200 text-primary-700 rounded text-xs font-medium">
                          {player.role || "player"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-primary-600 text-xs">Email</p>
                          <p className="font-semibold text-primary-900 text-xs">
                            {player.email || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-primary-600 text-xs">Team</p>
                          <p className="font-semibold text-primary-900">
                            {player.teamName || "None"}
                          </p>
                        </div>
                        <div>
                          <p className="text-primary-600 text-xs">Tournaments</p>
                          <p className="font-semibold text-primary-900">
                            {player.tournamentCount || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-primary-600 text-xs">Wins</p>
                          <p className="font-semibold text-primary-900">
                            {player.wins || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                ))}
              </div>
              {filteredPlayers.length > 0 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={playersTotalPages}
                    onPageChange={(page) => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredPlayers.length}
                    onItemsPerPageChange={(newItemsPerPage) => {
                      setItemsPerPage(newItemsPerPage);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-primary-600 py-8">
              No players found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParticipantTracking;

