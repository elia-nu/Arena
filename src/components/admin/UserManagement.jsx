import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoSearch,
  IoClose,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoCreate,
  IoTrash,
  IoPerson,
  IoPeople,
  IoShieldCheckmark,
  IoShirt,
  IoRefresh,
  IoBan,
  IoCheckmark,
  IoTrophy,
  IoCalendar,
  IoCall,
  IoMail,
  IoShield,
  IoTime,
  IoArrowBack,
  IoGrid,
  IoList,
  IoCopy,
  IoCheckmarkDone,
} from "react-icons/io5";
import { userAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";
import { useAuth } from "../../context/AuthContext";
import Pagination from "./Pagination";

const COUNTRY_CODE_OPTIONS = [
  "+1",
  "+44",
  "+91",
  "+251",
  "+234",
  "+254",
  "+27",
  "+20",
];

const splitPhoneNumber = (phone = "") => {
  const trimmedPhone = phone.trim();
  const matchedCode = COUNTRY_CODE_OPTIONS.find((code) =>
    trimmedPhone.startsWith(code),
  );

  if (!matchedCode) {
    return { countryCode: "+1", localNumber: trimmedPhone };
  }

  return {
    countryCode: matchedCode,
    localNumber: trimmedPhone.slice(matchedCode.length).trim(),
  };
};

const combinePhoneNumber = (countryCode, localNumber) =>
  `${countryCode}${localNumber ? ` ${localNumber}` : ""}`.trim();

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

const UserManagement = () => {
  const { showError, showSuccess } = useNotification();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "table"
  const [selectedUserForDetail, setSelectedUserForDetail] = useState(null);
  const [detailTab, setDetailTab] = useState("overview"); // "overview", "team", "events", "controls"
  const [copiedCode, setCopiedCode] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showSuspendModal, setShowSuspendModal] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userAPI.getAllUsers();
      const userList = data.users || [];
      setUsers(userList);

      // Keep detail view in sync if a user is currently selected
      if (selectedUserForDetail) {
        const updated = userList.find(
          (u) => (u._id || u.id) === (selectedUserForDetail._id || selectedUserForDetail.id)
        );
        if (updated) setSelectedUserForDetail(updated);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (userId, updates) => {
    try {
      await userAPI.updateUser(userId, updates);
      showSuccess("User updated successfully");
      setEditingUser(null);
      await fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      showError(error.message || "Failed to update user");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await userAPI.deleteUser(userId);
      showSuccess("User deleted successfully");
      setShowDeleteConfirm(null);
      if (selectedUserForDetail && (selectedUserForDetail._id === userId || selectedUserForDetail.id === userId)) {
        setSelectedUserForDetail(null);
      }
      await fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      showError(error.message || "Failed to delete user");
    }
  };

  const handleToggleStatus = async (user) => {
    await handleEditUser(user._id || user.id, {
      isActive: !user.isActive,
    });
  };

  const handleRoleChange = async (user, newRole) => {
    await handleEditUser(user._id || user.id, {
      role: newRole,
    });
  };

  const handleSuspendUser = async (userId, reason) => {
    try {
      await userAPI.suspendUser(userId, reason);
      showSuccess("User suspended successfully");
      setShowSuspendModal(null);
      setSuspensionReason("");
      await fetchUsers();
    } catch (error) {
      console.error("Error suspending user:", error);
      showError(error.message || "Failed to suspend user");
    }
  };

  const handleUnsuspendUser = async (userId) => {
    try {
      await userAPI.unsuspendUser(userId);
      showSuccess("User unsuspended successfully");
      await fetchUsers();
    } catch (error) {
      console.error("Error unsuspending user:", error);
      showError(error.message || "Failed to unsuspend user");
    }
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const userPhone =
      user.phoneNumber || user.phone || user.mobile || user.telephone || "";
    const teamName = user.team?.name || "";

    const matchesSearch =
      searchTerm === "" ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.memberCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName || ""} ${user.lastName || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.isActive && !user.isSuspended) ||
      (statusFilter === "inactive" && !user.isActive) ||
      (statusFilter === "suspended" && user.isSuspended);

    const matchesTeam =
      teamFilter === "all" ||
      (teamFilter === "with_team" && !!user.team) ||
      (teamFilter === "no_team" && !user.team);

    return matchesSearch && matchesRole && matchesStatus && matchesTeam;
  });

  // Paginate filtered users
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Statistics
  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive && !u.isSuspended).length,
    inactive: users.filter((u) => !u.isActive).length,
    suspended: users.filter((u) => u.isSuspended).length,
    admins: users.filter((u) => u.role === "admin").length,
    teamLeaders: users.filter((u) => u.role === "team_leader").length,
    players: users.filter((u) => u.role === "player").length,
    withTeam: users.filter((u) => !!u.team).length,
    minors: users.filter(
      (u) =>
        u.isMinor ||
        (calculateAge(u.dob) !== null && calculateAge(u.dob) < 18),
    ).length,
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <IoShieldCheckmark className="text-red-500" />;
      case "team_leader":
        return <IoShirt className="text-blue-500" />;
      case "player":
        return <IoPerson className="text-green-500" />;
      default:
        return <IoPerson className="text-primary-500" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "team_leader":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "player":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-primary-100 text-primary-800 border-primary-200";
    }
  };

  // ==========================================
  // VIEW: DEDICATED USER DETAIL PAGE
  // ==========================================
  if (selectedUserForDetail) {
    const u = selectedUserForDetail;
    const userPhone = u.phoneNumber || u.phone || u.mobile || u.telephone;
    const age = calculateAge(u.dob);
    const isYouth = u.isMinor || (age !== null && age < 18);
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-6"
      >
        {/* Navigation & Actions Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-primary-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <button
            type="button"
            onClick={() => setSelectedUserForDetail(null)}
            className="inline-flex items-center gap-2 text-xs font-bold text-primary-700 hover:text-secondary-600 transition-colors cursor-pointer self-start"
          >
            <IoArrowBack className="text-base" /> Back to User Directory
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setEditingUser(u)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-blue-200"
            >
              <IoCreate /> Edit Profile
            </button>

            {currentUser?._id !== (u._id || u.id) && (
              <>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(u)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    u.isActive
                      ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-green-50 hover:bg-green-100 text-green-800 border border-green-200"
                  }`}
                >
                  {u.isActive ? <IoCloseCircle /> : <IoCheckmarkCircle />}
                  {u.isActive ? "Deactivate User" : "Activate User"}
                </button>

                {u.isSuspended ? (
                  <button
                    type="button"
                    onClick={() => handleUnsuspendUser(u._id || u.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-emerald-200"
                  >
                    <IoCheckmark /> Unsuspend
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSuspendModal(u)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-orange-200"
                  >
                    <IoBan /> Suspend User
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(u)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-red-200"
                >
                  <IoTrash /> Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Hero User Banner */}
        <div className="bg-white border border-primary-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-secondary-500 to-amber-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md flex-shrink-0">
                {(u.firstName?.[0] || u.username?.[0] || "U").toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-primary-950">
                    {fullName}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${getRoleBadgeColor(
                      u.role,
                    )}`}
                  >
                    {u.role === "team_leader" ? "Team Leader" : u.role === "admin" ? "Admin" : "Player"}
                  </span>
                  {u.isSuspended ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
                      <IoBan className="text-xs" /> Suspended
                    </span>
                  ) : u.isActive ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
                      <IoCheckmarkCircle className="text-xs" /> Active Account
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                      Inactive
                    </span>
                  )}
                  {isYouth && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Youth / Minor
                    </span>
                  )}
                </div>
                <p className="text-sm font-mono text-primary-500">
                  @{u.username}
                </p>
                <div className="flex items-center gap-4 text-xs text-primary-500 pt-1 flex-wrap">
                  <span>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                  <span>Last Updated: {new Date(u.updatedAt || u.createdAt).toLocaleDateString()}</span>
                  <span className="font-mono text-primary-400">ID: {u._id || u.id}</span>
                </div>
              </div>
            </div>

            {/* Quick Stat Pill */}
            {u.memberCode && (
              <div className="bg-secondary-50 border-2 border-secondary-200 rounded-2xl p-4 text-center self-stretch md:self-auto min-w-[200px]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-600 mb-1">
                  Official Member Code
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-xl font-extrabold text-secondary-800 tracking-wider">
                    {u.memberCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(u.memberCode)}
                    className="p-1 hover:bg-secondary-200 rounded text-secondary-700 transition-colors cursor-pointer"
                    title="Copy member code"
                  >
                    {copiedCode ? <IoCheckmarkDone className="text-green-600" /> : <IoCopy />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex gap-2 border-b border-primary-200 mt-8">
            {[
              { id: "overview", label: "Overview & Personal Profile" },
              { id: "team", label: "Team Membership" },
              { id: "events", label: `Tournament Registrations (${u.registeredEvents?.length || 0})` },
              { id: "controls", label: "Account Controls & Logs" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id)}
                className={`px-4 py-3 font-bold text-xs sm:text-sm border-b-2 -mb-px transition-colors cursor-pointer ${
                  detailTab === tab.id
                    ? "border-secondary-500 text-secondary-600"
                    : "border-transparent text-primary-500 hover:text-primary-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Overview & Personal Profile */}
        {detailTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Card */}
            <div className="bg-white border border-primary-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-primary-950 text-base flex items-center gap-2">
                <IoMail className="text-secondary-500" /> Contact Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-primary-500">Email Address</p>
                  <a
                    href={`mailto:${u.email}`}
                    className="font-semibold text-secondary-600 hover:underline text-base"
                  >
                    {u.email || "No email on record"}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-primary-500">Phone Number</p>
                  <p className="font-semibold text-primary-900 text-base">
                    {userPhone || "No phone number on record"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-primary-500">Username</p>
                  <p className="font-mono text-primary-800">@{u.username}</p>
                </div>
              </div>
            </div>

            {/* Safeguarding & Age Card */}
            <div className="bg-white border border-primary-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-primary-950 text-base flex items-center gap-2">
                <IoShield className="text-amber-500" /> Age & Safeguarding Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-primary-500">Date of Birth</p>
                    <p className="font-semibold text-primary-900">
                      {u.dob ? new Date(u.dob).toLocaleDateString() : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-500">Calculated Age</p>
                    <p className="font-semibold text-primary-900">
                      {age !== null ? `${age} years old` : "Unknown"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-primary-500">Youth / Minor Safeguarding Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-lg text-xs font-bold mt-1 ${
                      isYouth ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {isYouth ? "Youth / Minor (Under 18 Years Old)" : "Adult Participant (18+)"}
                  </span>
                </div>

                <div className="pt-2 border-t border-primary-100 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-500">
                    Guardian & Parental Consent
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-primary-500">Guardian Name</p>
                      <p className="font-semibold text-primary-800">
                        {u.guardianName || "None listed"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-500">Guardian Phone</p>
                      <p className="font-semibold text-primary-800">
                        {u.guardianPhone || "None listed"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-primary-500">Parental Consent Signed</p>
                    <p className="font-semibold text-primary-800">
                      {u.parentalConsent ? "✓ Confirmed and Recorded" : "✗ Not recorded"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Team Membership */}
        {detailTab === "team" && (
          <div className="bg-white border border-primary-200 rounded-2xl p-6 shadow-xs space-y-6">
            <h3 className="font-bold text-primary-950 text-base flex items-center gap-2">
              <IoShirt className="text-indigo-600" /> Current Team Affiliation
            </h3>

            {u.team ? (
              <div className="p-5 rounded-2xl border-2 border-indigo-100 bg-indigo-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-xs flex-shrink-0">
                    {u.team.name?.slice(0, 2).toUpperCase() || "TM"}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-indigo-950">
                      {u.team.name}
                    </h4>
                    <p className="text-xs text-indigo-700 mt-0.5">
                      Role in Team: <strong className="uppercase">{u.role === "team_leader" ? "Team Captain / Leader" : "Team Member"}</strong>
                    </p>
                    <p className="text-[11px] font-mono text-primary-400 mt-1">
                      Team ID: {u.team._id || u.team}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-primary-200 rounded-2xl">
                <IoShirt className="text-4xl text-primary-300 mx-auto mb-2" />
                <h4 className="font-bold text-primary-900 text-base">No Team Assigned</h4>
                <p className="text-xs text-primary-500 max-w-sm mx-auto mt-1">
                  This user is currently a free agent. You can assign them to a team from the Team Management tab.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Tournament Registrations */}
        {detailTab === "events" && (
          <div className="bg-white border border-primary-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-primary-950 text-base flex items-center gap-2">
              <IoTrophy className="text-amber-500" /> Tournament Participation & Registrations
            </h3>

            {Array.isArray(u.registeredEvents) && u.registeredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {u.registeredEvents.map((ev, i) => (
                  <div
                    key={ev._id || i}
                    className="p-4 rounded-2xl border border-primary-200 bg-primary-50/40 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
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
                      <span className="font-semibold capitalize">
                        Entry: {ev.type === "team" ? "Team Roster" : "Solo Entrant"}
                      </span>
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
              <p className="text-sm text-primary-500 py-8 text-center italic">
                No tournament registrations found for this user yet.
              </p>
            )}
          </div>
        )}

        {/* Tab 4: Account Controls & Security */}
        {detailTab === "controls" && (
          <div className="bg-white border border-primary-200 rounded-2xl p-6 shadow-xs space-y-6">
            <h3 className="font-bold text-primary-950 text-base flex items-center gap-2">
              <IoShieldCheckmark className="text-emerald-500" /> Account Security & Role Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl border border-primary-200 space-y-3">
                <h4 className="font-bold text-primary-900 text-sm">Change System Role</h4>
                <p className="text-xs text-primary-500">
                  Switching roles alters permissions immediately.
                </p>
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u, e.target.value)}
                  className="w-full px-3 py-2 border border-primary-300 rounded-xl text-sm bg-white font-semibold"
                >
                  <option value="player">Player</option>
                  <option value="team_leader">Team Leader</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="p-4 rounded-xl border border-primary-200 space-y-3">
                <h4 className="font-bold text-primary-900 text-sm">Account State</h4>
                <p className="text-xs text-primary-500">
                  Enable or disable this user account.
                </p>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(u)}
                  className={`w-full px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    u.isActive
                      ? "bg-green-100 hover:bg-green-200 text-green-800"
                      : "bg-red-100 hover:bg-red-200 text-red-800"
                  }`}
                >
                  Current: {u.isActive ? "Active (Click to Deactivate)" : "Inactive (Click to Activate)"}
                </button>
              </div>
            </div>

            {u.isSuspended && (
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-1 text-xs">
                <h4 className="font-bold text-orange-900 text-sm">Suspension Record</h4>
                <p className="text-orange-800">
                  <strong>Reason:</strong> {u.suspensionReason || "No reason logged"}
                </p>
                {u.suspendedAt && (
                  <p className="text-orange-600">
                    Suspended on: {new Date(u.suspendedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Edit User Modal */}
        <AnimatePresence>
          {editingUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
              onClick={() => setEditingUser(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-primary-950">
                    Edit User Profile
                  </h2>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="p-2 text-primary-600 hover:bg-primary-100 rounded-xl"
                  >
                    <IoClose />
                  </button>
                </div>
                <EditUserForm
                  user={editingUser}
                  onSave={(updates) =>
                    handleEditUser(editingUser._id || editingUser.id, updates)
                  }
                  onCancel={() => setEditingUser(null)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suspend User Modal */}
        <AnimatePresence>
          {showSuspendModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
              onClick={() => {
                setShowSuspendModal(null);
                setSuspensionReason("");
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-primary-950 flex items-center gap-2">
                    <IoBan className="text-orange-600" /> Suspend User
                  </h2>
                  <button
                    onClick={() => {
                      setShowSuspendModal(null);
                      setSuspensionReason("");
                    }}
                    className="p-2 text-primary-600 hover:bg-primary-100 rounded-xl"
                  >
                    <IoClose />
                  </button>
                </div>
                <p className="text-primary-700 text-xs mb-4">
                  Provide a mandatory suspension reason for{" "}
                  <strong className="text-primary-950">{showSuspendModal.username}</strong>.
                </p>
                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Enter reason for account suspension..."
                  rows={4}
                  className="w-full px-4 py-2 border border-primary-300 rounded-xl text-xs focus:border-orange-500 focus:outline-none resize-none mb-4"
                  required
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSuspendModal(null);
                      setSuspensionReason("");
                    }}
                    className="flex-1 px-4 py-2 border border-primary-300 rounded-xl text-primary-700 font-semibold text-xs hover:bg-primary-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      handleSuspendUser(
                        showSuspendModal._id || showSuspendModal.id,
                        suspensionReason,
                      )
                    }
                    disabled={!suspensionReason.trim()}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white font-semibold text-xs rounded-xl hover:bg-orange-700 disabled:opacity-50"
                  >
                    Confirm Suspension
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirm Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteConfirm(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-red-600 mb-2">Delete User Account?</h3>
                <p className="text-xs text-primary-600 mb-4">
                  Are you sure you want to permanently remove user{" "}
                  <strong>{showDeleteConfirm.username}</strong>? This action cannot be reversed.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-2 border border-primary-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteUser(showDeleteConfirm._id || showDeleteConfirm.id)}
                    className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700"
                  >
                    Delete User
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ==========================================
  // VIEW: REDESIGNED MASTER USER DIRECTORY
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-950">
            User Management Directory
          </h1>
          <p className="text-xs sm:text-sm text-primary-500 mt-0.5">
            Manage player rosters, leaders, safeguarding data, and account privileges.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white border border-primary-200 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "cards" ? "bg-secondary-500 text-white" : "text-primary-500 hover:text-primary-800"
              }`}
              title="Card View"
            >
              <IoGrid />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "table" ? "bg-secondary-500 text-white" : "text-primary-500 hover:text-primary-800"
              }`}
              title="Table View"
            >
              <IoList />
            </button>
          </div>

          <button
            onClick={fetchUsers}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-primary-200 text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors text-xs shadow-2xs cursor-pointer"
          >
            <IoRefresh /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Total Users", val: stats.total, bg: "bg-white", border: "border-primary-200", text: "text-primary-950" },
          { label: "Active", val: stats.active, bg: "bg-green-50/60", border: "border-green-200", text: "text-green-900" },
          { label: "Inactive", val: stats.inactive, bg: "bg-red-50/60", border: "border-red-200", text: "text-red-900" },
          { label: "Suspended", val: stats.suspended, bg: "bg-orange-50/60", border: "border-orange-200", text: "text-orange-900" },
          { label: "Team Leaders", val: stats.teamLeaders, bg: "bg-blue-50/60", border: "border-blue-200", text: "text-blue-900" },
          { label: "Players", val: stats.players, bg: "bg-emerald-50/60", border: "border-emerald-200", text: "text-emerald-900" },
          { label: "In Teams", val: stats.withTeam, bg: "bg-indigo-50/60", border: "border-indigo-200", text: "text-indigo-900" },
          { label: "Youth / Minors", val: stats.minors, bg: "bg-amber-50/60", border: "border-amber-200", text: "text-amber-900" },
        ].map((s, i) => (
          <div
            key={i}
            className={`${s.bg} border ${s.border} rounded-2xl p-3 text-center shadow-2xs`}
          >
            <p className="text-[11px] text-primary-500 font-medium mb-0.5">{s.label}</p>
            <p className={`text-xl font-extrabold ${s.text}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-primary-200 rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <IoSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-primary-400 text-sm" />
            <input
              type="text"
              placeholder="Search user, code, phone, team..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-primary-200 rounded-xl text-xs bg-primary-50/40 focus:bg-white focus:border-secondary-500 focus:outline-none transition-colors"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 border border-primary-200 rounded-xl text-xs bg-primary-50/40 focus:bg-white focus:border-secondary-500 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="player">Player Only</option>
            <option value="team_leader">Team Leader Only</option>
            <option value="admin">Admin Only</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 border border-primary-200 rounded-xl text-xs bg-primary-50/40 focus:bg-white focus:border-secondary-500 focus:outline-none"
          >
            <option value="all">All Account Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
          <select
            value={teamFilter}
            onChange={(e) => {
              setTeamFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 border border-primary-200 rounded-xl text-xs bg-primary-50/40 focus:bg-white focus:border-secondary-500 focus:outline-none"
          >
            <option value="all">All Team Status</option>
            <option value="with_team">Assigned to a Team</option>
            <option value="no_team">Free Agent (No Team)</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white border border-primary-200 rounded-3xl p-12 text-center text-primary-500">
          <div className="w-8 h-8 border-3 border-secondary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border border-primary-200 rounded-3xl p-12 text-center text-primary-500">
          <IoPerson className="text-4xl mx-auto mb-2 opacity-30" />
          <p className="font-semibold text-sm">No users found matching your filters.</p>
        </div>
      ) : viewMode === "cards" ? (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedUsers.map((user) => {
            const age = calculateAge(user.dob);
            const isYouth = user.isMinor || (age !== null && age < 18);
            const userPhone = user.phoneNumber || user.phone || user.mobile || user.telephone;
            const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username;

            return (
              <motion.div
                key={user._id || user.id}
                whileHover={{ y: -2 }}
                className="bg-white border border-primary-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-secondary-400 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-800 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                        {(user.firstName?.[0] || user.username?.[0] || "U").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-primary-950 text-sm truncate">
                            {fullName}
                          </h3>
                          {isYouth && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800">
                              Youth
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-primary-500 font-mono">@{user.username}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getRoleBadgeColor(
                        user.role,
                      )}`}
                    >
                      {user.role === "team_leader" ? "Leader" : user.role === "admin" ? "Admin" : "Player"}
                    </span>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-primary-100 space-y-1.5 text-xs text-primary-600">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-primary-400">Team Status:</span>
                      {user.team ? (
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px]">
                          🛡️ {user.team.name}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Free Agent</span>
                      )}
                    </div>

                    {user.memberCode && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-primary-400">Member Code:</span>
                        <span className="font-mono font-bold text-secondary-600 bg-secondary-50 px-1.5 py-0.2 rounded text-[11px]">
                          {user.memberCode}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-primary-400">Email:</span>
                      <span className="truncate max-w-[170px]">{user.email || "—"}</span>
                    </div>

                    {userPhone && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-primary-400">Phone:</span>
                        <span>{userPhone}</span>
                      </div>
                    )}

                    {Array.isArray(user.registeredEvents) && user.registeredEvents.length > 0 && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-primary-400">Tournaments:</span>
                        <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded text-[10px]">
                          {user.registeredEvents.length} Enrolled
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-primary-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {user.isSuspended ? (
                      <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                        Suspended
                      </span>
                    ) : user.isActive ? (
                      <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserForDetail(user);
                      setDetailTab("overview");
                    }}
                    className="px-3 py-1.5 bg-primary-950 hover:bg-secondary-600 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    View Detail Page →
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-primary-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-primary-50/80 border-b border-primary-200 text-primary-700 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Member Code</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {paginatedUsers.map((user) => {
                  const userPhone = user.phoneNumber || user.phone || user.mobile || user.telephone;
                  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username;

                  return (
                    <tr
                      key={user._id || user.id}
                      className="hover:bg-primary-50/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedUserForDetail(user);
                        setDetailTab("overview");
                      }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {(user.firstName?.[0] || user.username?.[0] || "U").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-primary-950">{fullName}</p>
                            <p className="text-[11px] font-mono text-primary-500">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-secondary-600">
                        {user.memberCode || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${getRoleBadgeColor(user.role)}`}>
                          {(user.role || "player").replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.team ? (
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                            {user.team.name}
                          </span>
                        ) : (
                          <span className="text-slate-400">Free Agent</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-primary-600">
                        <p>{user.email || "—"}</p>
                        {userPhone && <p className="text-primary-500">{userPhone}</p>}
                      </td>
                      <td className="py-3 px-4">
                        {user.isSuspended ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                            Suspended
                          </span>
                        ) : user.isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForDetail(user);
                            setDetailTab("overview");
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-secondary-600 bg-secondary-50 hover:bg-secondary-100 rounded-lg transition-colors"
                        >
                          Details →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            itemsPerPage={itemsPerPage}
            totalItems={filteredUsers.length}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Modals for Directory View */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-primary-950">Edit User Profile</h2>
                <button onClick={() => setEditingUser(null)} className="p-2 text-primary-600 hover:bg-primary-100 rounded-xl">
                  <IoClose />
                </button>
              </div>
              <EditUserForm
                user={editingUser}
                onSave={(updates) => handleEditUser(editingUser._id || editingUser.id, updates)}
                onCancel={() => setEditingUser(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuspendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowSuspendModal(null);
              setSuspensionReason("");
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-primary-950 flex items-center gap-2">
                  <IoBan className="text-orange-600" /> Suspend User
                </h2>
                <button
                  onClick={() => {
                    setShowSuspendModal(null);
                    setSuspensionReason("");
                  }}
                  className="p-2 text-primary-600 hover:bg-primary-100 rounded-xl"
                >
                  <IoClose />
                </button>
              </div>
              <p className="text-primary-700 text-xs mb-4">
                Provide a reason for suspending <strong className="text-primary-950">{showSuspendModal.username}</strong>.
              </p>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Enter reason for suspension..."
                rows={4}
                className="w-full px-4 py-2 border border-primary-300 rounded-xl text-xs focus:border-orange-500 focus:outline-none resize-none mb-4"
                required
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSuspendModal(null);
                    setSuspensionReason("");
                  }}
                  className="flex-1 py-2 border border-primary-300 rounded-xl text-primary-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSuspendUser(showSuspendModal._id || showSuspendModal.id, suspensionReason)}
                  disabled={!suspensionReason.trim()}
                  className="flex-1 py-2 bg-orange-600 text-white rounded-xl text-xs font-semibold hover:bg-orange-700 disabled:opacity-50"
                >
                  Confirm Suspension
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-red-600 mb-2">Delete User Account?</h3>
              <p className="text-xs text-primary-600 mb-4">
                Are you sure you want to permanently delete <strong>{showDeleteConfirm.username}</strong>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2 border border-primary-300 rounded-xl text-xs font-semibold">
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(showDeleteConfirm._id || showDeleteConfirm.id)}
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700"
                >
                  Delete User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EditUserForm = ({ user, onSave, onCancel }) => {
  const initialPhone = splitPhoneNumber(user.phone || user.phoneNumber || "");
  const [formData, setFormData] = useState({
    username: user.username || "",
    email: user.email || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    countryCode: initialPhone.countryCode,
    localNumber: initialPhone.localNumber,
    phone: combinePhoneNumber(initialPhone.countryCode, initialPhone.localNumber),
    role: user.role || "player",
    isActive: user.isActive !== undefined ? user.isActive : true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div>
        <label className="block text-xs font-medium text-primary-700 mb-1">Username</label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className="w-full px-3.5 py-2 border border-primary-200 rounded-xl focus:border-secondary-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-primary-700 mb-1">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3.5 py-2 border border-primary-200 rounded-xl focus:border-secondary-500 focus:outline-none"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-primary-700 mb-1">First Name</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-3.5 py-2 border border-primary-200 rounded-xl focus:border-secondary-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary-700 mb-1">Last Name</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-3.5 py-2 border border-primary-200 rounded-xl focus:border-secondary-500 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-primary-700 mb-1">Phone</label>
        <div className="flex gap-2">
          <select
            value={formData.countryCode}
            onChange={(e) =>
              setFormData({
                ...formData,
                countryCode: e.target.value,
                phone: combinePhoneNumber(e.target.value, formData.localNumber),
              })
            }
            className="w-20 px-2 py-2 border border-primary-200 rounded-xl bg-white focus:outline-none text-xs"
          >
            {COUNTRY_CODE_OPTIONS.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <input
            type="tel"
            value={formData.localNumber}
            onChange={(e) =>
              setFormData({
                ...formData,
                localNumber: e.target.value,
                phone: combinePhoneNumber(formData.countryCode, e.target.value),
              })
            }
            className="flex-1 px-3 py-2 border border-primary-200 rounded-xl focus:border-secondary-500 focus:outline-none text-xs"
            placeholder="912345678"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-primary-700 mb-1">Role</label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="w-full px-3.5 py-2 border border-primary-200 rounded-xl focus:border-secondary-500 focus:outline-none bg-white text-xs"
        >
          <option value="player">Player</option>
          <option value="team_leader">Team Leader</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 text-secondary-600 rounded border-primary-300"
          />
          <span className="text-xs font-medium text-primary-700">Account Active</span>
        </label>
      </div>
      <div className="flex gap-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 border border-primary-200 rounded-xl text-primary-700 font-semibold text-xs hover:bg-primary-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-2 bg-secondary-500 text-white font-semibold rounded-xl text-xs hover:bg-secondary-600"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default UserManagement;
