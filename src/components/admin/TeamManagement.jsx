import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";
import Pagination from "./Pagination";
import {
  IoPeople,
  IoAdd,
  IoRemove,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoPersonAdd,
  IoShield,
  IoSearch,
  IoRefresh,
  IoTrophy,
  IoCalendar,
  IoCall,
  IoMail,
  IoShieldCheckmark,
  IoShirt,
  IoArrowBack,
  IoCopy,
  IoCheckmarkDone,
  IoChevronForward,
  IoPerson,
  IoClose,
} from "react-icons/io5";

const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const formatPlayerName = (player) => {
  if (!player) return "Unknown";
  if (player.firstName && player.lastName) {
    return `${player.firstName} ${player.lastName}`;
  }
  return player.username || "Unknown";
};

const getPlayerId = (player) => player?._id || player?.id;

const getInitials = (player) => {
  if (!player) return "?";
  if (player.firstName && player.lastName) {
    return `${player.firstName[0]}${player.lastName[0]}`.toUpperCase();
  }
  return (player.username || "?").slice(0, 2).toUpperCase();
};

const TeamManagement = () => {
  const { showSuccess, showError } = useNotification();
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState("teams"); // "teams" or "assign"
  const [selectedTeamForDetail, setSelectedTeamForDetail] = useState(null);
  const [teamDetailTab, setTeamDetailTab] = useState("roster"); // "roster", "leader", "events", "add"
  const [copiedId, setCopiedId] = useState(false);

  // Quick Add inside Detail Page
  const [detailSelectedPlayers, setDetailSelectedPlayers] = useState([]);
  const [detailAssigning, setDetailAssigning] = useState(false);
  const [detailPlayerSearch, setDetailPlayerSearch] = useState("");

  // Assign / Build view state
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [assignMode, setAssignMode] = useState("create"); // "create" or "existing"
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [teamSearchTerm, setTeamSearchTerm] = useState("");
  const [rosterSearchTerm, setRosterSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [teamsCurrentPage, setTeamsCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [teamsPerPage, setTeamsPerPage] = useState(9);

  const fetchData = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const [playersData, teamsData] = await Promise.all([
        adminAPI.getPlayersWithoutTeam(),
        adminAPI.getAllTeams(),
      ]);

      const allPlayers = playersData.players || [];
      const allTeams = teamsData.teams || [];
      setPlayers(allPlayers);
      setTeams(allTeams);

      // Keep detail page updated if a team is currently viewed
      if (selectedTeamForDetail) {
        const updated = allTeams.find(
          (t) => (t._id || t.id) === (selectedTeamForDetail._id || selectedTeamForDetail.id)
        );
        if (updated) setSelectedTeamForDetail(updated);
      }
    } catch (error) {
      console.error("Error fetching team management data:", error);
      showError(error.message || "Failed to load team data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const togglePlayerSelection = (playerId) => {
    setSelectedPlayers((prev) => {
      if (prev.includes(playerId)) {
        if (leaderId === playerId) setLeaderId("");
        return prev.filter((id) => id !== playerId);
      }
      return [...prev, playerId];
    });
  };

  const clearSelection = () => {
    setSelectedPlayers([]);
    setLeaderId("");
    setTeamName("");
    setSelectedTeamId("");
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      showError("Please enter a team name");
      return;
    }
    if (selectedPlayers.length === 0) {
      showError("Please select at least one player");
      return;
    }
    if (!leaderId) {
      showError("Please choose a team leader");
      return;
    }

    setCreating(true);
    try {
      await adminAPI.createTeam({
        name: teamName.trim(),
        playerIds: selectedPlayers,
        leaderId,
      });

      showSuccess("Team created successfully! Roster updated.");
      clearSelection();
      setActiveView("teams");
      fetchData(true);
    } catch (error) {
      console.error("Error creating team:", error);
      showError(error.message || "Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const handleAssignToTeam = async () => {
    if (!selectedTeamId) {
      showError("Please select a team");
      return;
    }
    if (selectedPlayers.length === 0) {
      showError("Please select at least one player");
      return;
    }

    setAssigning(true);
    try {
      await adminAPI.assignPlayersToTeam(selectedTeamId, selectedPlayers);
      showSuccess(
        `Assigned ${selectedPlayers.length} player(s) to the team.`
      );
      clearSelection();
      setActiveView("teams");
      fetchData(true);
    } catch (error) {
      console.error("Error assigning players to team:", error);
      showError(error.message || "Failed to assign players to team");
    } finally {
      setAssigning(false);
    }
  };

  // Add players to team from within the team detail page
  const handleDetailAddPlayers = async () => {
    if (!selectedTeamForDetail) return;
    if (detailSelectedPlayers.length === 0) {
      showError("Please select at least one player to add");
      return;
    }

    const tId = selectedTeamForDetail._id || selectedTeamForDetail.id;
    setDetailAssigning(true);
    try {
      await adminAPI.assignPlayersToTeam(tId, detailSelectedPlayers);
      showSuccess(`Added ${detailSelectedPlayers.length} player(s) to ${selectedTeamForDetail.name}`);
      setDetailSelectedPlayers([]);
      setTeamDetailTab("roster");
      await fetchData(true);
    } catch (err) {
      showError(err.message || "Failed to add players");
    } finally {
      setDetailAssigning(false);
    }
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const filteredPlayers = useMemo(
    () =>
      players.filter((player) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (player.username || "").toLowerCase().includes(searchLower) ||
          (player.firstName || "").toLowerCase().includes(searchLower) ||
          (player.lastName || "").toLowerCase().includes(searchLower) ||
          (player.email || "").toLowerCase().includes(searchLower) ||
          (player.phone || "").toLowerCase().includes(searchLower) ||
          (player.memberCode || "").toLowerCase().includes(searchLower)
        );
      }),
    [players, searchTerm]
  );

  const filteredTeams = useMemo(
    () =>
      teams.filter((team) => {
        const searchLower = teamSearchTerm.toLowerCase();
        if (!searchLower) return true;

        const leaderMatch =
          (team.name || "").toLowerCase().includes(searchLower) ||
          formatPlayerName(team.leader).toLowerCase().includes(searchLower) ||
          (team.leader?.email || "").toLowerCase().includes(searchLower) ||
          (team.leader?.phone || "").toLowerCase().includes(searchLower) ||
          (team.leader?.memberCode || "").toLowerCase().includes(searchLower);

        const memberMatch = (team.members || []).some(
          (member) =>
            formatPlayerName(member).toLowerCase().includes(searchLower) ||
            (member.email || "").toLowerCase().includes(searchLower) ||
            (member.username || "").toLowerCase().includes(searchLower) ||
            (member.phone || "").toLowerCase().includes(searchLower) ||
            (member.memberCode || "").toLowerCase().includes(searchLower),
        );

        const eventMatch = (team.registeredEvents || []).some((ev) =>
          (ev.name || "").toLowerCase().includes(searchLower),
        );

        return leaderMatch || memberMatch || eventMatch;
      }),
    [teams, teamSearchTerm]
  );

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const paginatedPlayers = filteredPlayers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const teamsTotalPages = Math.ceil(filteredTeams.length / teamsPerPage);
  const paginatedTeams = filteredTeams.slice(
    (teamsCurrentPage - 1) * teamsPerPage,
    teamsCurrentPage * teamsPerPage
  );

  const allPageSelected =
    paginatedPlayers.length > 0 &&
    paginatedPlayers.every((p) => selectedPlayers.includes(getPlayerId(p)));

  const toggleSelectAllOnPage = () => {
    const pageIds = paginatedPlayers.map(getPlayerId);
    if (allPageSelected) {
      setSelectedPlayers((prev) => prev.filter((id) => !pageIds.includes(id)));
      if (pageIds.includes(leaderId)) setLeaderId("");
    } else {
      setSelectedPlayers((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  const selectedPlayerDetails = selectedPlayers
    .map((id) => players.find((p) => getPlayerId(p) === id))
    .filter(Boolean);

  // Total stats computation
  const totalAssignedPlayers = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);
  const totalMinorsInTeams = teams.reduce((acc, t) => {
    const minorsInThisTeam = (t.members || []).filter(
      (m) => m.isMinor || (calculateAge(m.dob) !== null && calculateAge(m.dob) < 18)
    ).length;
    return acc + minorsInThisTeam;
  }, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-2xl bg-white border border-primary-200 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-white border border-primary-200 animate-pulse" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-white border border-primary-200 animate-pulse" />
      </div>
    );
  }

  // ==========================================
  // VIEW: DEDICATED TEAM DETAIL PAGE
  // ==========================================
  if (selectedTeamForDetail) {
    const t = selectedTeamForDetail;
    const teamLeaderId = t.leader?._id || t.leader?.id || t.leader;
    const roster = (t.members || []).slice().sort((a, b) => {
      const aId = getPlayerId(a) || a;
      const bId = getPlayerId(b) || b;
      if (aId?.toString() === teamLeaderId?.toString()) return -1;
      if (bId?.toString() === teamLeaderId?.toString()) return 1;
      return formatPlayerName(a).localeCompare(formatPlayerName(b));
    });

    const filteredRoster = roster.filter((m) => {
      if (!rosterSearchTerm) return true;
      const term = rosterSearchTerm.toLowerCase();
      const name = formatPlayerName(m).toLowerCase();
      return (
        name.includes(term) ||
        (m.username || "").toLowerCase().includes(term) ||
        (m.email || "").toLowerCase().includes(term) ||
        (m.phone || "").toLowerCase().includes(term) ||
        (m.memberCode || "").toLowerCase().includes(term)
      );
    });

    const minorCount = roster.filter(
      (m) => m.isMinor || (calculateAge(m.dob) !== null && calculateAge(m.dob) < 18)
    ).length;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-6"
      >
        {/* Navigation & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-primary-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setSelectedTeamForDetail(null);
              setRosterSearchTerm("");
              setDetailSelectedPlayers([]);
            }}
            className="inline-flex items-center gap-2 text-xs font-bold text-primary-700 hover:text-secondary-600 transition-colors cursor-pointer self-start"
          >
            <IoArrowBack className="text-base" /> Back to Team Directory
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setTeamDetailTab("add")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <IoPersonAdd /> Add Players to Team
            </button>
            <button
              type="button"
              onClick={() => fetchData(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-primary-200 text-primary-700 hover:bg-primary-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <IoRefresh className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {/* Hero Team Header */}
        <div className="bg-white border border-primary-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md flex-shrink-0">
                {t.name?.slice(0, 2).toUpperCase() || "TM"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-primary-950">
                    {t.name}
                  </h1>
                  {t.isActive !== false ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
                      <IoCheckmarkCircle className="text-xs" /> Active Team
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                      Inactive
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    {roster.length} Registered Members
                  </span>
                </div>
                <p className="text-xs text-primary-500 flex items-center gap-3">
                  <span>Created: {new Date(t.createdAt).toLocaleDateString()}</span>
                  <span className="font-mono text-primary-400">Team ID: {t._id || t.id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(t._id || t.id)}
                    className="text-secondary-600 hover:text-secondary-800 p-0.5 cursor-pointer"
                    title="Copy Team ID"
                  >
                    {copiedId ? <IoCheckmarkDone /> : <IoCopy />}
                  </button>
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 self-stretch md:self-auto min-w-[300px]">
              <div className="bg-primary-50 border border-primary-200 rounded-2xl p-3 text-center">
                <p className="text-[10px] uppercase font-bold text-primary-500">Roster</p>
                <p className="text-lg font-extrabold text-primary-900">{roster.length}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
                <p className="text-[10px] uppercase font-bold text-amber-700">Youth</p>
                <p className="text-lg font-extrabold text-amber-900">{minorCount}</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 text-center">
                <p className="text-[10px] uppercase font-bold text-indigo-700">Events</p>
                <p className="text-lg font-extrabold text-indigo-900">{t.registeredEvents?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex gap-2 border-b border-primary-200 mt-8">
            {[
              { id: "roster", label: `Player Roster (${roster.length})` },
              { id: "leader", label: "Team Captain / Leader" },
              { id: "events", label: `Tournaments & Events (${t.registeredEvents?.length || 0})` },
              { id: "add", label: "+ Add Players" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTeamDetailTab(tab.id)}
                className={`px-4 py-3 font-bold text-xs sm:text-sm border-b-2 -mb-px transition-colors cursor-pointer ${
                  teamDetailTab === tab.id
                    ? "border-secondary-500 text-secondary-600"
                    : "border-transparent text-primary-500 hover:text-primary-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Full Player Roster */}
        {teamDetailTab === "roster" && (
          <div className="bg-white border border-primary-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-primary-100">
              <div>
                <h3 className="font-bold text-primary-950 text-base">
                  Official Team Roster ({filteredRoster.length} Players)
                </h3>
                <p className="text-xs text-primary-500">
                  Full list of active players, captains, contact details, and youth safeguarding info.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search player, code, phone..."
                  value={rosterSearchTerm}
                  onChange={(e) => setRosterSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-primary-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-secondary-500"
                />
              </div>
            </div>

            {filteredRoster.length === 0 ? (
              <div className="text-center py-12 text-primary-500">
                <IoPerson className="text-4xl mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">No players match the search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredRoster.map((member) => {
                  const mId = getPlayerId(member) || member;
                  const isLeader = mId?.toString() === teamLeaderId?.toString();
                  const age = calculateAge(member.dob);
                  const isYouth = member.isMinor || (age !== null && age < 18);

                  return (
                    <div
                      key={mId}
                      className="p-4 rounded-2xl border border-primary-200/90 bg-primary-50/30 flex flex-col justify-between space-y-2.5 shadow-2xs hover:border-secondary-400 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-primary-200 text-primary-800 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                            {getInitials(member)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-primary-950 text-sm truncate">
                                {formatPlayerName(member)}
                              </h4>
                              {isLeader && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold uppercase rounded border border-blue-200">
                                  ★ Team Captain
                                </span>
                              )}
                              {isYouth && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                                  Youth ({age !== null ? `${age}y` : "Minor"})
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-primary-500 font-mono">
                              @{member.username || "player"}
                            </p>
                          </div>
                        </div>

                        {member.memberCode && (
                          <span className="font-mono text-[10px] font-bold text-secondary-600 bg-secondary-50 border border-secondary-200 px-2 py-0.5 rounded-lg flex-shrink-0">
                            {member.memberCode}
                          </span>
                        )}
                      </div>

                      {/* Detailed Player Breakdown */}
                      <div className="pt-2 border-t border-primary-100/80 space-y-1 text-xs text-primary-600">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-primary-400">Email:</span>
                          <a
                            href={`mailto:${member.email}`}
                            className="text-secondary-600 hover:underline truncate max-w-[200px]"
                          >
                            {member.email || "No email"}
                          </a>
                        </div>
                        {member.phone && (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-primary-400">Phone:</span>
                            <span className="font-medium text-primary-800">{member.phone}</span>
                          </div>
                        )}
                        {isYouth && member.guardianName && (
                          <div className="bg-amber-50 border border-amber-200/80 p-2 rounded-xl text-[11px] text-amber-900 mt-1">
                            <p className="font-semibold">Safeguarding Contact:</p>
                            <p>Guardian: {member.guardianName} ({member.guardianPhone || "No tel"})</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Team Captain / Leader Spotlight */}
        {teamDetailTab === "leader" && (
          <div className="bg-white border border-primary-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-primary-950 text-base flex items-center gap-2">
              <IoShieldCheckmark className="text-blue-600" /> Team Captain & Primary Contact
            </h3>

            {t.leader && typeof t.leader === "object" ? (
              <div className="p-6 rounded-2xl border-2 border-blue-100 bg-blue-50/30 max-w-xl space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    {getInitials(t.leader)}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-blue-950">
                      {formatPlayerName(t.leader)}
                    </h4>
                    <p className="font-mono text-xs text-blue-700">@{t.leader.username}</p>
                    {t.leader.memberCode && (
                      <span className="inline-block mt-1 font-mono text-xs font-bold text-secondary-600 bg-white px-2 py-0.5 rounded border border-secondary-200">
                        Code: {t.leader.memberCode}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-blue-200 space-y-2 text-xs text-blue-900">
                  <p>
                    <strong>Email Address:</strong>{" "}
                    <a href={`mailto:${t.leader.email}`} className="text-secondary-600 underline">
                      {t.leader.email || "None"}
                    </a>
                  </p>
                  <p>
                    <strong>Phone Number:</strong> {t.leader.phone || "None listed"}
                  </p>
                  {t.leader.isMinor && (
                    <p className="text-amber-800">
                      <strong>Minor Captain:</strong> Guardian {t.leader.guardianName || "N/A"} ({t.leader.guardianPhone || "No phone"})
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-primary-500 italic py-6">
                No dedicated leader profile populated for this team.
              </p>
            )}
          </div>
        )}

        {/* Tab 3: Registered Tournaments */}
        {teamDetailTab === "events" && (
          <div className="bg-white border border-primary-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-primary-950 text-base flex items-center gap-2">
              <IoTrophy className="text-amber-500" /> Tournaments & Event Enrolments
            </h3>

            {Array.isArray(t.registeredEvents) && t.registeredEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {t.registeredEvents.map((ev, i) => (
                  <div
                    key={ev._id || i}
                    className="p-4 rounded-2xl border border-primary-200 bg-primary-50/40 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-600">
                          {ev.format || "Knockout"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            ev.paymentStatus === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ev.paymentStatus || "pending"}
                        </span>
                      </div>
                      <h4 className="font-bold text-primary-950 text-sm">{ev.name}</h4>
                      <p className="text-xs text-primary-500 flex items-center gap-1 mt-1">
                        <IoCalendar className="text-xs" />
                        {ev.startDate ? new Date(ev.startDate).toLocaleDateString() : "TBD"}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-primary-200 flex items-center justify-between text-[11px] text-primary-600">
                      <span>Status: {ev.status || "Open"}</span>
                      {ev.paymentMethod && (
                        <span className="uppercase font-mono text-primary-500">
                          {ev.paymentMethod}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-primary-500 italic py-8 text-center">
                This team has not registered for any tournaments yet.
              </p>
            )}
          </div>
        )}

        {/* Tab 4: Add Players to this Team */}
        {teamDetailTab === "add" && (
          <div className="bg-white border border-primary-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-primary-100">
              <div>
                <h3 className="font-bold text-primary-950 text-base">
                  Add Unassigned Players to {t.name}
                </h3>
                <p className="text-xs text-primary-500">
                  Select free agent players from the directory to enrol them directly into this team.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400 text-xs" />
                <input
                  type="text"
                  placeholder="Filter available players..."
                  value={detailPlayerSearch}
                  onChange={(e) => setDetailPlayerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-primary-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-secondary-500"
                />
              </div>
            </div>

            {players.length === 0 ? (
              <p className="text-xs text-emerald-700 py-6 text-center font-medium bg-emerald-50 rounded-xl">
                ✓ Every registered player is already assigned to a team!
              </p>
            ) : (
              (() => {
                const searchLower = detailPlayerSearch.toLowerCase();
                const available = players.filter((p) => {
                  if (!searchLower) return true;
                  return (
                    formatPlayerName(p).toLowerCase().includes(searchLower) ||
                    (p.username || "").toLowerCase().includes(searchLower) ||
                    (p.email || "").toLowerCase().includes(searchLower) ||
                    (p.memberCode || "").toLowerCase().includes(searchLower)
                  );
                });

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
                      {available.map((p) => {
                        const pId = getPlayerId(p);
                        const isSelected = detailSelectedPlayers.includes(pId);

                        return (
                          <div
                            key={pId}
                            onClick={() =>
                              setDetailSelectedPlayers((prev) =>
                                prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
                              )
                            }
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center gap-2.5 ${
                              isSelected
                                ? "border-secondary-500 bg-secondary-50/50 shadow-2xs"
                                : "border-primary-200 hover:bg-primary-50/40"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="w-4 h-4 rounded text-secondary-600 pointer-events-none"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-primary-950 truncate">
                                {formatPlayerName(p)}
                              </p>
                              <p className="text-[11px] text-primary-500 truncate">
                                @{p.username} {p.memberCode ? `· ${p.memberCode}` : ""}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-primary-100">
                      <span className="text-xs font-semibold text-primary-600">
                        {detailSelectedPlayers.length} player(s) selected
                      </span>
                      <button
                        type="button"
                        onClick={handleDetailAddPlayers}
                        disabled={detailSelectedPlayers.length === 0 || detailAssigning}
                        className="px-5 py-2 bg-secondary-500 hover:bg-secondary-600 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {detailAssigning ? "Adding to Team..." : `Confirm & Add to ${t.name}`}
                      </button>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}
      </motion.div>
    );
  }

  // ==========================================
  // VIEW: REDESIGNED MASTER TEAM DIRECTORY
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-950">
            Team Management & Roster Center
          </h1>
          <p className="text-xs sm:text-sm text-primary-500 mt-0.5">
            Organize team structures, inspect player rosters, assign unassigned free agents.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Switcher */}
          <div className="flex items-center bg-white border border-primary-200 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveView("teams")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === "teams"
                  ? "bg-secondary-500 text-white shadow-2xs"
                  : "text-primary-600 hover:text-primary-950"
              }`}
            >
              All Teams ({teams.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveView("assign")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === "assign"
                  ? "bg-secondary-500 text-white shadow-2xs"
                  : "text-primary-600 hover:text-primary-950"
              }`}
            >
              Assign & Build ({players.length} Free)
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-primary-200 text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors text-xs shadow-2xs cursor-pointer"
          >
            <IoRefresh className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Teams", val: teams.length, bg: "bg-white", border: "border-primary-200", text: "text-primary-950" },
          { label: "Active Teams", val: teams.filter((t) => t.isActive !== false).length, bg: "bg-green-50/60", border: "border-green-200", text: "text-green-900" },
          { label: "Assigned Players", val: totalAssignedPlayers, bg: "bg-indigo-50/60", border: "border-indigo-200", text: "text-indigo-900" },
          { label: "Youth in Teams", val: totalMinorsInTeams, bg: "bg-amber-50/60", border: "border-amber-200", text: "text-amber-900" },
          { label: "Free Agents", val: players.length, bg: "bg-purple-50/60", border: "border-purple-200", text: "text-purple-900" },
          { label: "Avg Roster Size", val: teams.length > 0 ? (totalAssignedPlayers / teams.length).toFixed(1) : 0, bg: "bg-blue-50/60", border: "border-blue-200", text: "text-blue-900" },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} border ${s.border} rounded-2xl p-3 text-center shadow-2xs`}>
            <p className="text-[11px] text-primary-500 font-medium mb-0.5">{s.label}</p>
            <p className={`text-xl font-extrabold ${s.text}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* ACTIVE VIEW: TEAMS DIRECTORY */}
      {activeView === "teams" && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white border border-primary-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <IoSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400 text-sm" />
              <input
                type="text"
                placeholder="Search team name, leader, member code, phone, tournament..."
                value={teamSearchTerm}
                onChange={(e) => {
                  setTeamSearchTerm(e.target.value);
                  setTeamsCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 border border-primary-200 rounded-xl text-xs bg-primary-50/40 focus:bg-white focus:border-secondary-500 focus:outline-none"
              />
            </div>
            {players.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveView("assign")}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-secondary-50 text-secondary-700 hover:bg-secondary-100 border border-secondary-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <IoPersonAdd /> Build New Team ({players.length} Free Agents)
              </button>
            )}
          </div>

          {filteredTeams.length === 0 ? (
            <div className="bg-white border border-primary-200 rounded-3xl p-12 text-center text-primary-500 shadow-xs">
              <IoShirt className="text-4xl mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-sm">
                {teamSearchTerm ? "No teams match your search term." : "No teams created yet."}
              </p>
              {!teamSearchTerm && players.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveView("assign")}
                  className="mt-3 px-4 py-2 bg-secondary-500 text-white rounded-xl text-xs font-semibold"
                >
                  Create First Team
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedTeams.map((team) => {
                const teamId = team._id || team.id;
                const members = team.members || [];
                const leader = team.leader;
                const minorCount = members.filter(
                  (m) => m.isMinor || (calculateAge(m.dob) !== null && calculateAge(m.dob) < 18)
                ).length;

                return (
                  <motion.div
                    key={teamId}
                    whileHover={{ y: -2 }}
                    className="bg-white border border-primary-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-secondary-400 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-extrabold text-base flex items-center justify-center flex-shrink-0 shadow-xs">
                            {team.name?.slice(0, 2).toUpperCase() || "TM"}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-primary-950 text-base truncate">
                              {team.name}
                            </h3>
                            <p className="text-xs text-primary-500 truncate">
                              Captain: <strong className="text-primary-800">{formatPlayerName(leader)}</strong>
                            </p>
                          </div>
                        </div>

                        {team.isActive !== false ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-primary-100 space-y-2 text-xs text-primary-600">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-primary-400">Total Players:</span>
                          <span className="font-bold text-primary-900 bg-primary-100 px-2 py-0.5 rounded-md text-[11px]">
                            {members.length} {members.length === 1 ? "Player" : "Players"}
                          </span>
                        </div>

                        {minorCount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-primary-400">Youth / Minors:</span>
                            <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md text-[11px]">
                              {minorCount} Youth
                            </span>
                          </div>
                        )}

                        {leader?.memberCode && (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-primary-400">Leader Code:</span>
                            <span className="font-mono font-bold text-secondary-600 bg-secondary-50 px-1.5 py-0.2 rounded text-[11px]">
                              {leader.memberCode}
                            </span>
                          </div>
                        )}

                        {/* Registered events badges */}
                        {Array.isArray(team.registeredEvents) && team.registeredEvents.length > 0 && (
                          <div className="pt-1 border-t border-primary-100/60">
                            <p className="text-[10px] uppercase font-bold text-primary-400 mb-1">
                              Enrolled Tournaments ({team.registeredEvents.length}):
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {team.registeredEvents.map((ev, i) => (
                                <span
                                  key={ev._id || i}
                                  className="text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 px-1.5 py-0.2 rounded"
                                >
                                  {ev.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTeamForDetail(team);
                        setTeamDetailTab("roster");
                      }}
                      className="w-full py-2 bg-primary-950 hover:bg-secondary-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      View Team Details <IoChevronForward />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Teams Pagination */}
          {filteredTeams.length > 0 && (
            <div className="mt-6">
              <Pagination
                currentPage={teamsCurrentPage}
                totalPages={teamsTotalPages}
                onPageChange={(page) => {
                  setTeamsCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                itemsPerPage={teamsPerPage}
                totalItems={filteredTeams.length}
                onItemsPerPageChange={(value) => {
                  setTeamsPerPage(value);
                  setTeamsCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ACTIVE VIEW: ASSIGN & BUILD TEAMS */}
      {activeView === "assign" && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left Column: Unassigned Players List */}
          <div className="xl:col-span-3 bg-white border border-primary-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-primary-100">
              <div>
                <h3 className="font-bold text-primary-950 text-base">
                  Unassigned Free Agents ({filteredPlayers.length})
                </h3>
                <p className="text-xs text-primary-500">
                  Select players to form a new team or add to an existing team.
                </p>
              </div>

              {selectedPlayers.length > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                >
                  Clear Selection ({selectedPlayers.length})
                </button>
              )}
            </div>

            {/* Search and Select All */}
            <div className="space-y-2">
              <div className="relative">
                <IoSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search player, code, phone, email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-primary-200 rounded-xl text-xs bg-primary-50/40 focus:bg-white focus:border-secondary-500 focus:outline-none"
                />
              </div>

              {paginatedPlayers.length > 0 && (
                <label className="flex items-center gap-2 text-xs text-primary-700 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAllOnPage}
                    className="w-4 h-4 rounded border-primary-300 text-secondary-600 focus:ring-secondary-500"
                  />
                  Select all on this page ({paginatedPlayers.length})
                </label>
              )}
            </div>

            {filteredPlayers.length === 0 ? (
              <div className="text-center py-16 text-primary-500">
                <IoCheckmarkCircle className="text-4xl text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-sm">
                  {searchTerm ? "No players match your search." : "All players are currently assigned to teams!"}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {paginatedPlayers.map((player) => {
                  const pId = getPlayerId(player);
                  const isSelected = selectedPlayers.includes(pId);
                  const isLead = leaderId === pId;
                  const age = calculateAge(player.dob);
                  const isYouth = player.isMinor || (age !== null && age < 18);

                  return (
                    <div
                      key={pId}
                      onClick={() => togglePlayerSelection(pId)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                        isSelected
                          ? "border-secondary-500 bg-secondary-50/40 ring-1 ring-secondary-200"
                          : "border-primary-200 hover:border-primary-300 hover:bg-primary-50/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="w-4 h-4 rounded text-secondary-600 pointer-events-none flex-shrink-0"
                      />

                      <div className="w-9 h-9 rounded-xl bg-primary-200 text-primary-800 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {getInitials(player)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-primary-950 text-xs truncate">
                            {formatPlayerName(player)}
                          </p>
                          {isLead && (
                            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-bold uppercase rounded">
                              Selected Leader
                            </span>
                          )}
                          {player.memberCode && (
                            <span className="font-mono text-[9px] font-bold text-secondary-600 bg-secondary-50 px-1 py-0.2 rounded border border-secondary-200">
                              {player.memberCode}
                            </span>
                          )}
                          {isYouth && (
                            <span className="text-[9px] font-semibold text-amber-800 bg-amber-100 px-1 py-0.2 rounded">
                              Youth
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-primary-500 truncate mt-0.5">
                          {player.email} {player.phone ? `· ${player.phone}` : ""} · @{player.username}
                        </p>
                      </div>

                      {isSelected && !isLead && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLeaderId(pId);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex-shrink-0"
                        >
                          Make Leader
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Players Pagination */}
            {filteredPlayers.length > 0 && (
              <div className="pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredPlayers.length}
                  onItemsPerPageChange={(val) => {
                    setItemsPerPage(val);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}
          </div>

          {/* Right Column: Team Builder Drawer */}
          <div className="xl:col-span-2 bg-white border border-primary-200 rounded-3xl p-6 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-primary-950 text-base">
                  Team Builder & Assignment
                </h3>
                <p className="text-xs text-primary-500">
                  {selectedPlayers.length === 0
                    ? "Select players from the directory to start building."
                    : `${selectedPlayers.length} player(s) selected.`}
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="grid grid-cols-2 gap-2 bg-primary-100/70 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAssignMode("create")}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    assignMode === "create" ? "bg-white text-primary-950 shadow-xs" : "text-primary-600"
                  }`}
                >
                  Create New Team
                </button>
                <button
                  type="button"
                  onClick={() => setAssignMode("existing")}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    assignMode === "existing" ? "bg-white text-primary-950 shadow-xs" : "text-primary-600"
                  }`}
                >
                  Add to Existing Team
                </button>
              </div>

              {/* Selected Chips Preview */}
              {selectedPlayerDetails.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary-500 mb-1.5">
                    Selected Roster ({selectedPlayerDetails.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {selectedPlayerDetails.map((p) => {
                      const pId = getPlayerId(p);
                      return (
                        <span
                          key={pId}
                          className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-primary-100 text-primary-900 rounded-lg text-xs"
                        >
                          {formatPlayerName(p)}
                          {leaderId === pId && <strong className="text-blue-700">★</strong>}
                          <button
                            type="button"
                            onClick={() => togglePlayerSelection(pId)}
                            className="p-0.5 hover:bg-primary-200 rounded"
                          >
                            <IoClose className="text-xs" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mode: Create New Team */}
              {assignMode === "create" ? (
                <div className="space-y-3 pt-2 border-t border-primary-100">
                  <div>
                    <label className="block text-xs font-bold text-primary-700 mb-1">
                      New Team Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Red Dragons, Thunderbolts..."
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-primary-200 rounded-xl text-xs focus:border-secondary-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-primary-700 mb-1">
                      Team Captain / Leader *
                    </label>
                    <select
                      value={leaderId}
                      onChange={(e) => setLeaderId(e.target.value)}
                      className="w-full px-3.5 py-2 border border-primary-200 rounded-xl text-xs bg-white focus:border-secondary-500 focus:outline-none"
                    >
                      <option value="">Select a leader from selected roster...</option>
                      {selectedPlayerDetails.map((p) => (
                        <option key={getPlayerId(p)} value={getPlayerId(p)}>
                          {formatPlayerName(p)} (@{p.username})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                /* Mode: Add to Existing Team */
                <div className="space-y-3 pt-2 border-t border-primary-100">
                  <div>
                    <label className="block text-xs font-bold text-primary-700 mb-1">
                      Target Team *
                    </label>
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="w-full px-3.5 py-2 border border-primary-200 rounded-xl text-xs bg-white focus:border-secondary-500 focus:outline-none"
                    >
                      <option value="">Choose team to add players to...</option>
                      {teams.map((t) => (
                        <option key={t._id || t.id} value={t._id || t.id}>
                          {t.name} ({t.members?.length || 0} members)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-primary-100">
              {assignMode === "create" ? (
                <button
                  type="button"
                  onClick={handleCreateTeam}
                  disabled={creating || selectedPlayers.length === 0 || !teamName.trim() || !leaderId}
                  className="w-full py-2.5 bg-secondary-500 hover:bg-secondary-600 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {creating ? "Creating Team..." : "Create Team with Roster"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAssignToTeam}
                  disabled={assigning || selectedPlayers.length === 0 || !selectedTeamId}
                  className="w-full py-2.5 bg-secondary-500 hover:bg-secondary-600 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {assigning ? "Assigning Players..." : "Assign Players to Selected Team"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
