import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { adminAPI } from "../../../services/api";
import { IoShirtOutline, IoPeopleOutline, IoSearchOutline, IoArrowForwardOutline } from "react-icons/io5";

const TeamsDirectoryWidget = ({ onNavigateToTeams }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const data = await adminAPI.getAllTeams();
        setTeams(data.teams || []);
      } catch (err) {
        console.error("Failed to load teams widget:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const filteredTeams = teams.filter((t) =>
    (t.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.leader?.firstName || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.leader?.username || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-primary-900/40 border border-primary-200/80 dark:border-primary-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl border border-blue-200/60 dark:border-blue-800/40">
              <IoShirtOutline className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-950 dark:text-primary-100">
                Teams Directory
              </h3>
              <p className="text-xs text-primary-500">
                {teams.length} registered teams
              </p>
            </div>
          </div>
          {onNavigateToTeams && (
            <button
              onClick={onNavigateToTeams}
              className="text-xs font-semibold text-secondary-500 hover:text-secondary-600 flex items-center gap-1 transition-colors"
            >
              Manage <IoArrowForwardOutline className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary-400" />
          <input
            type="text"
            placeholder="Search teams or leaders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-primary-50/70 dark:bg-primary-900/50 border border-primary-200 dark:border-primary-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-secondary-500 text-primary-900 dark:text-primary-100 placeholder:text-primary-400"
          />
        </div>

        {/* List */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {loading ? (
            <div className="space-y-2 animate-pulse py-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-10 bg-primary-100 dark:bg-primary-800/40 rounded-xl" />
              ))}
            </div>
          ) : filteredTeams.length === 0 ? (
            <p className="text-xs text-primary-500 text-center py-6">
              {search ? "No matching teams found" : "No teams created yet"}
            </p>
          ) : (
            filteredTeams.slice(0, 6).map((team) => {
              const memberCount = team.members?.length || 0;
              const leaderName =
                team.leader?.firstName && team.leader?.lastName
                  ? `${team.leader.firstName} ${team.leader.lastName}`
                  : team.leader?.username || "No Leader";

              return (
                <motion.div
                  key={team._id || team.id}
                  whileHover={{ x: 2 }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-primary-50/60 dark:bg-primary-900/30 border border-primary-100/80 dark:border-primary-800/40 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-primary-900 dark:text-primary-100 truncate">
                      {team.name}
                    </p>
                    <p className="text-[11px] text-primary-500 truncate flex items-center gap-1.5">
                      <span>Leader: {leaderName}</span>
                      {team.leader?.memberCode && (
                        <span className="font-mono text-secondary-600 font-semibold">
                          ({team.leader.memberCode})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {team.registeredEvents?.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {team.registeredEvents.length} {team.registeredEvents.length === 1 ? "Event" : "Events"}
                      </span>
                    )}
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-200/60 dark:bg-primary-800 text-primary-700 dark:text-primary-300">
                      <IoPeopleOutline className="w-3 h-3" />
                      {memberCount}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        team.isActive !== false ? "bg-emerald-500" : "bg-primary-300"
                      }`}
                      title={team.isActive !== false ? "Active" : "Inactive"}
                    />
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamsDirectoryWidget;
