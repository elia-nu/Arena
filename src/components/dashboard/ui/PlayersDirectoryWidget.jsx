import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { adminAPI } from "../../../services/api";
import { IoPersonAddOutline, IoPersonOutline, IoArrowForwardOutline } from "react-icons/io5";

const PlayersDirectoryWidget = ({ onNavigateToAssign }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnassigned = async () => {
      try {
        setLoading(true);
        const data = await adminAPI.getPlayersWithoutTeam();
        setPlayers(data.players || []);
      } catch (err) {
        console.error("Failed to load unassigned players widget:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUnassigned();
  }, []);

  return (
    <div className="bg-white dark:bg-primary-900/40 border border-primary-200/80 dark:border-primary-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
              <IoPersonAddOutline className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-950 dark:text-primary-100">
                Unassigned Players
              </h3>
              <p className="text-xs text-primary-500">
                {players.length} players needing a team
              </p>
            </div>
          </div>
          {onNavigateToAssign && (
            <button
              onClick={onNavigateToAssign}
              className="text-xs font-semibold text-secondary-500 hover:text-secondary-600 flex items-center gap-1 transition-colors"
            >
              Assign <IoArrowForwardOutline className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Players List */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {loading ? (
            <div className="space-y-2 animate-pulse py-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-10 bg-primary-100 dark:bg-primary-800/40 rounded-xl" />
              ))}
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ All players are assigned to teams!
              </p>
            </div>
          ) : (
            players.slice(0, 6).map((player) => {
              const name =
                player.firstName && player.lastName
                  ? `${player.firstName} ${player.lastName}`
                  : player.username || "Unknown Player";

              return (
                <motion.div
                  key={player._id || player.id}
                  whileHover={{ x: 2 }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-primary-50/60 dark:bg-primary-900/30 border border-primary-100/80 dark:border-primary-800/40 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <div className="w-7 h-7 rounded-full bg-primary-200 dark:bg-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300 font-semibold text-[10px] flex-shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-primary-900 dark:text-primary-100 truncate">
                          {name}
                        </p>
                        {player.memberCode && (
                          <span className="font-mono text-[9px] text-secondary-600 bg-secondary-50 dark:bg-secondary-900/40 px-1 py-0.2 rounded font-bold">
                            {player.memberCode}
                          </span>
                        )}
                        {player.isMinor && (
                          <span className="text-[9px] text-amber-700 bg-amber-100 dark:bg-amber-900/40 px-1 py-0.2 rounded font-semibold">
                            Youth
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-primary-500 truncate">
                        @{player.username || "player"} {player.phone ? `· ${player.phone}` : ""}
                      </p>
                    </div>
                  </div>
                  {onNavigateToAssign && (
                    <button
                      onClick={onNavigateToAssign}
                      className="px-2 py-1 text-[11px] font-semibold text-secondary-600 bg-secondary-50 dark:bg-secondary-950/40 hover:bg-secondary-100 rounded-lg transition-colors flex-shrink-0"
                    >
                      + Add
                    </button>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayersDirectoryWidget;
