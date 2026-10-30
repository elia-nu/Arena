import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoAdd,
  IoPencil,
  IoTrash,
  IoStar,
  IoStarOutline,
  IoCalendar,
  IoLocation,
  IoPeople,
  IoCash,
  IoImage,
  IoCloudUpload,
  IoLink,
  IoCloseCircle,
  IoSearch,
  IoEye,
  IoArrowBack,
  IoDownload,
  IoShirt,
  IoCall,
  IoMail,
  IoShieldCheckmark,
  IoChevronDown,
  IoChevronUp,
  IoCheckmarkCircle,
  IoTime,
  IoPerson,
  IoCheckmark,
} from "react-icons/io5";
import { tournamentAPI, adminAPI, mediaAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";
import { absoluteMediaSrc } from "../../utils/mediaUtils";
import Pagination from "./Pagination";

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

const TournamentManagement = ({ onOpenEventMedia }) => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    location: "",
    venue: "",
    format: "knockout",
    tournamentType: "team",
    maxTeams: 8,
    minTeams: 2,
    minTeamMembers: 2,
    maxTeamMembers: 10,
    entryFee: 0,
    prizePool: 0,
    rules: "",
    image: "",
    status: "draft",
    isPromoted: false,
  });
  const [imageInputMode, setImageInputMode] = useState("upload"); // "upload" or "url"
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const { showSuccess, showError } = useNotification();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [viewRegistrationsTournament, setViewRegistrationsTournament] = useState(null);
  const [viewMembersTeam, setViewMembersTeam] = useState(null);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  const [regModalTab, setRegModalTab] = useState("teams");
  const [regSearchTerm, setRegSearchTerm] = useState("");
  const [expandedRegTeamIds, setExpandedRegTeamIds] = useState([]);

  const exportRegistrationsCSV = (tournament) => {
    if (!tournament) return;
    const rows = [
      [
        "Type",
        "Team Name",
        "Player Name",
        "Username",
        "Role",
        "Member Code",
        "Email",
        "Phone",
        "DOB",
        "Age",
        "Minor Status",
        "Guardian Name",
        "Guardian Phone",
        "Registered Date",
        "Payment Status",
        "Payment Method",
      ],
    ];

    (tournament.registeredTeams || []).forEach((reg) => {
      const team = reg.team || {};
      const teamName = team.name || "Unknown Team";
      const regDate = reg.registeredAt
        ? new Date(reg.registeredAt).toLocaleDateString()
        : "";
      const payStatus = reg.paymentStatus || "pending";
      const payMethod = reg.paymentMethod || "";

      if (team.leader) {
        const l = team.leader;
        const age = calculateAge(l.dob);
        rows.push([
          "Team Leader",
          teamName,
          [l.firstName, l.lastName].filter(Boolean).join(" ") || l.username || "",
          l.username || "",
          "Team Captain",
          l.memberCode || "",
          l.email || "",
          l.phone || "",
          l.dob ? new Date(l.dob).toLocaleDateString() : "",
          age !== null ? age : "",
          l.isMinor || (age !== null && age < 18) ? "Minor" : "Adult",
          l.guardianName || "",
          l.guardianPhone || "",
          regDate,
          payStatus,
          payMethod,
        ]);
      }

      (team.members || []).forEach((m) => {
        if (m._id?.toString() === team.leader?._id?.toString()) return;
        const age = calculateAge(m.dob);
        rows.push([
          "Team Member",
          teamName,
          [m.firstName, m.lastName].filter(Boolean).join(" ") || m.username || "",
          m.username || "",
          "Player",
          m.memberCode || "",
          m.email || "",
          m.phone || "",
          m.dob ? new Date(m.dob).toLocaleDateString() : "",
          age !== null ? age : "",
          m.isMinor || (age !== null && age < 18) ? "Minor" : "Adult",
          m.guardianName || "",
          m.guardianPhone || "",
          regDate,
          payStatus,
          payMethod,
        ]);
      });
    });

    (tournament.registeredPlayers || []).forEach((reg) => {
      const p = reg.player || {};
      const regDate = reg.registeredAt
        ? new Date(reg.registeredAt).toLocaleDateString()
        : "";
      const age = calculateAge(p.dob);
      rows.push([
        "Individual Player",
        p.team?.name || "Free Agent",
        [p.firstName, p.lastName].filter(Boolean).join(" ") || p.username || "",
        p.username || "",
        "Individual Entry",
        p.memberCode || "",
        p.email || "",
        p.phone || "",
        p.dob ? new Date(p.dob).toLocaleDateString() : "",
        age !== null ? age : "",
        p.isMinor || (age !== null && age < 18) ? "Minor" : "Adult",
        p.guardianName || "",
        p.guardianPhone || "",
        regDate,
        reg.paymentStatus || "pending",
        reg.paymentMethod || "",
      ]);
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows
        .map((r) =>
          r.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${(tournament.name || "tournament").replace(/[^a-zA-Z0-9]/g, "_")}_registrations.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleRegTeamExpand = (teamId) => {
    setExpandedRegTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId],
    );
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const data = await tournamentAPI.getAll();
      setTournaments(data.tournaments || []);
    } catch (error) {
      showError(error.message || "Failed to fetch tournaments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTournament) {
        await tournamentAPI.update(editingTournament._id, formData);
        showSuccess("Tournament updated successfully");
      } else {
        await tournamentAPI.create(formData);
        showSuccess("Tournament created successfully");
      }
      setShowForm(false);
      setEditingTournament(null);
      resetForm();
      fetchTournaments();
    } catch (error) {
      showError(error.message || "Failed to save tournament");
    }
  };

  const handleEdit = (tournament) => {
    setEditingTournament(tournament);
    setFormData({
      name: tournament.name || "",
      description: tournament.description || "",
      startDate: tournament.startDate
        ? new Date(tournament.startDate).toISOString().split("T")[0]
        : "",
      endDate: tournament.endDate
        ? new Date(tournament.endDate).toISOString().split("T")[0]
        : "",
      registrationDeadline: tournament.registrationDeadline
        ? new Date(tournament.registrationDeadline).toISOString().split("T")[0]
        : "",
      location: tournament.location || "",
      venue: tournament.venue || "",
      format: tournament.format || "knockout",
      tournamentType: tournament.tournamentType || "team",
      maxTeams: tournament.maxTeams || 8,
      minTeams: tournament.minTeams || 2,
      minTeamMembers: tournament.minTeamMembers || 2,
      maxTeamMembers: tournament.maxTeamMembers || 10,
      entryFee: tournament.entryFee || 0,
      prizePool: tournament.prizePool || 0,
      rules: tournament.rules || "",
      image: tournament.image || "",
      status: tournament.status || "draft",
      isPromoted: !!tournament.isPromoted,
    });
    setImagePreview(
      tournament.image ? absoluteMediaSrc(tournament.image) || tournament.image : null,
    );
    setImageInputMode(
      tournament.image &&
        !tournament.image.startsWith("data:") &&
        !tournament.image.startsWith("/uploads/")
        ? "url"
        : "upload",
    );
    setImageUrlInput("");
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tournament?")) {
      return;
    }
    try {
      await tournamentAPI.delete(id);
      showSuccess("Tournament deleted successfully");
      fetchTournaments();
    } catch (error) {
      showError(error.message || "Failed to delete tournament");
    }
  };

  const handleViewRegistrations = async (tournament) => {
    setViewMembersTeam(null);
    setRegSearchTerm("");
    setRegModalTab("teams");
    setExpandedRegTeamIds([]);
    try {
      setLoadingRegistrations(true);
      const { tournament: full } = await tournamentAPI.getById(tournament._id);
      setViewRegistrationsTournament(full);
    } catch (error) {
      showError(error.message || "Failed to load registrations");
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleViewTeamMembers = async (teamId) => {
    try {
      setLoadingTeamMembers(true);
      const { team } = await adminAPI.getTeamById(teamId);
      setViewMembersTeam(team);
    } catch (error) {
      showError(error.message || "Failed to load team members");
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  const handlePromote = async (tournament) => {
    try {
      await tournamentAPI.promote(tournament._id);
      showSuccess(
        tournament.isPromoted ? "Tournament unpromoted" : "Tournament promoted"
      );
      fetchTournaments();
    } catch (error) {
      showError(error.message || "Failed to promote tournament");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      registrationDeadline: "",
      location: "",
      venue: "",
      format: "knockout",
      tournamentType: "team",
      maxTeams: 8,
      minTeams: 2,
      minTeamMembers: 2,
      maxTeamMembers: 10,
      entryFee: 0,
      prizePool: 0,
      rules: "",
      image: "",
      status: "draft",
      isPromoted: false,
    });
    setImagePreview(null);
    setImageInputMode("upload");
    setImageUrlInput("");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please upload a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("Image is too large. Maximum size is 5MB");
      return;
    }

    try {
      setUploadingImage(true);
      const result = await mediaAPI.uploadImage(file);
      if (!result?.url) {
        throw new Error("Upload succeeded but no URL was returned.");
      }
      setImagePreview(absoluteMediaSrc(result.url) || result.url);
      setFormData((prev) => ({ ...prev, image: result.url }));
      showSuccess("Image uploaded to server");
    } catch (error) {
      console.error("Error uploading image:", error);
      showError(error.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleImageUrlApply = () => {
    const url = imageUrlInput.trim();
    if (!url) return;

    if (
      !url.startsWith("http://") &&
      !url.startsWith("https://") &&
      !url.startsWith("data:")
    ) {
      showError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setFormData({ ...formData, image: url });
    setImagePreview(url);
    setImageUrlInput("");
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      open: "bg-green-100 text-green-800",
      registration_closed: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-purple-100 text-purple-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || colors.draft;
  };

  // Filter tournaments
  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch =
      searchQuery === "" ||
      tournament.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournament.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournament.venue?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || tournament.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Paginate filtered tournaments
  const totalPages = Math.ceil(filteredTournaments.length / itemsPerPage);
  const paginatedTournaments = filteredTournaments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="bg-white border-2 border-primary-200 rounded-3xl p-8">
        <p className="text-primary-600">Loading tournaments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-3xl font-bold text-secondary-600">
          Tournament Management
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {typeof onOpenEventMedia === "function" && (
            <motion.button
              type="button"
              onClick={onOpenEventMedia}
              className="flex items-center gap-2 px-5 py-3 border-2 border-secondary-500 text-secondary-600 font-semibold rounded-xl hover:bg-secondary-50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <IoImage /> Event media
            </motion.button>
          )}
          <motion.button
            onClick={() => {
              resetForm();
              setEditingTournament(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-secondary-500 text-white font-semibold rounded-xl hover:bg-secondary-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <IoAdd /> Create Tournament
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400" />
            <input
              type="text"
              placeholder="Search tournaments by name, location, venue..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-primary-300 focus:border-tertiary-500 outline-none bg-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="registration_closed">Registration Closed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border-2 border-primary-200 rounded-2xl p-6"
          >
            <h3 className="text-2xl font-bold text-secondary-600 mb-4">
              {editingTournament ? "Edit Tournament" : "Create New Tournament"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Tournament Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Format *
                  </label>
                  <select
                    value={formData.format}
                    onChange={(e) =>
                      setFormData({ ...formData, format: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  >
                    <option value="knockout">Knockout</option>
                    <option value="round-robin">Round Robin</option>
                    <option value="group-stage">Group Stage</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    id="isPromoted"
                    type="checkbox"
                    checked={formData.isPromoted}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isPromoted: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-tertiary-500 border-primary-300 rounded focus:ring-tertiary-500"
                  />
                  <label
                    htmlFor="isPromoted"
                    className="text-sm font-medium text-primary-700 flex items-center gap-1"
                  >
                    <IoStar
                      className={
                        formData.isPromoted
                          ? "text-yellow-500"
                          : "text-primary-300"
                      }
                    />
                    Featured
                    <span className="text-xs font-normal text-primary-400">
                      (Show in featured sections)
                    </span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Registration Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.registrationDeadline}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registrationDeadline: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="open">Open</option>
                    <option value="registration_closed">
                      Registration Closed
                    </option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) =>
                      setFormData({ ...formData, venue: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Max Teams *
                  </label>
                  <input
                    type="number"
                    required
                    min="2"
                    value={formData.maxTeams}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxTeams: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Min Teams
                  </label>
                  <input
                    type="number"
                    min="2"
                    value={formData.minTeams}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minTeams: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Min Team Members
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minTeamMembers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minTeamMembers: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Max Team Members
                  </label>
                  <input
                    type="number"
                    min="2"
                    value={formData.maxTeamMembers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxTeamMembers: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Entry Fee ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.entryFee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        entryFee: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Prize Pool ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.prizePool}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prizePool: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="4"
                  className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Rules
                </label>
                <textarea
                  value={formData.rules}
                  onChange={(e) =>
                    setFormData({ ...formData, rules: e.target.value })
                  }
                  rows="3"
                  className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                />
              </div>
              {/* Image section (upload or URL) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-primary-700">
                    Tournament Image
                  </label>
                  <div className="flex items-center gap-2 border border-secondary-200 bg-secondary-50 p-1 rounded">
                    <button
                      type="button"
                      onClick={() => setImageInputMode("upload")}
                      className={`px-3 py-1 text-xs transition-colors flex items-center gap-1 ${
                        imageInputMode === "upload"
                          ? "bg-secondary-200 text-primary-950"
                          : "text-primary-600 hover:text-primary-950"
                      }`}
                    >
                      <IoCloudUpload className="text-sm" />
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode("url")}
                      className={`px-3 py-1 text-xs transition-colors flex items-center gap-1 ${
                        imageInputMode === "url"
                          ? "bg-secondary-200 text-primary-950"
                          : "text-primary-600 hover:text-primary-950"
                      }`}
                    >
                      <IoLink className="text-sm" />
                      URL
                    </button>
                  </div>
                </div>

                {imageInputMode === "upload" ? (
                  <div className="space-y-2">
                    <div className="border-2 border-dashed border-secondary-300 rounded-lg p-4 text-center hover:border-secondary-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="tournament-image-upload"
                        disabled={uploadingImage}
                      />
                      <label
                        htmlFor="tournament-image-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <IoImage className="text-3xl text-secondary-500" />
                        <span className="text-sm text-primary-700">
                          {uploadingImage
                            ? "Uploading to server..."
                            : "Click to upload image or drag and drop"}
                        </span>
                        <span className="text-xs text-primary-500">
                          PNG, JPG, GIF up to 5MB
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="https://example.com/tournament-image.jpg"
                        className="flex-1 px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleImageUrlApply();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleImageUrlApply}
                        className="px-4 py-2 bg-secondary-500 text-white text-sm font-medium rounded-lg hover:bg-secondary-600 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    <p className="text-xs text-primary-500">
                      Enter an image URL and press Enter or click Apply
                    </p>
                  </div>
                )}

                {imagePreview && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={imagePreview}
                      alt="Tournament preview"
                      className="w-20 h-20 object-cover border border-primary-200 rounded-lg"
                      onError={(e) => {
                        e.target.src = "/placeholder-tournament.jpg";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData({ ...formData, image: "" });
                      }}
                      className="p-2 text-red-600 hover:text-red-800 transition-colors"
                      title="Remove image"
                    >
                      <IoCloseCircle className="text-xl" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-secondary-500 text-white font-semibold rounded-xl hover:bg-secondary-600 transition-colors"
                >
                  {editingTournament
                    ? "Update Tournament"
                    : "Create Tournament"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTournament(null);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-secondary-500 text-white font-semibold rounded-xl hover:bg-secondary-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedTournaments.map((tournament) => (
          <motion.div
            key={tournament._id}
            className="bg-primary-50 border-2 border-primary-200 rounded-2xl p-6 hover:border-tertiary-500 transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-secondary-600 mb-2">
                  {tournament.name}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    tournament.status
                  )}`}
                >
                  {tournament.status.replace("_", " ")}
                </span>
              </div>
              <button
                onClick={() => handlePromote(tournament)}
                className={`p-2 rounded-lg transition-colors ${
                  tournament.isPromoted
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-primary-100 text-primary-600"
                }`}
                title={tournament.isPromoted ? "Unpromote" : "Promote"}
              >
                {tournament.isPromoted ? <IoStar /> : <IoStarOutline />}
              </button>
            </div>

            {tournament.description && (
              <p className="text-primary-600 text-sm mb-4 line-clamp-2">
                {tournament.description}
              </p>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-primary-700">
                <IoCalendar className="text-tertiary-500" />
                <span>
                  {new Date(tournament.startDate).toLocaleDateString()} -{" "}
                  {new Date(tournament.endDate).toLocaleDateString()}
                </span>
              </div>
              {tournament.location && (
                <div className="flex items-center gap-2 text-sm text-primary-700">
                  <IoLocation className="text-tertiary-500" />
                  <span>{tournament.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-primary-700">
                <IoPeople className="text-tertiary-500" />
                <span>
                  {tournament.registeredTeams?.length +
                    tournament.registeredPlayers?.length || 0}{" "}
                  / {tournament.maxTeams} registered
                </span>
              </div>
              {tournament.tournamentType && (
                <div className="flex items-center gap-2 text-sm text-primary-700">
                  <span className="font-medium">Type:</span>
                  <span className="capitalize">
                    {tournament.tournamentType}
                  </span>
                </div>
              )}
              {(tournament.entryFee > 0 || tournament.prizePool > 0) && (
                <div className="flex items-center gap-2 text-sm text-primary-700">
                  <IoCash className="text-tertiary-500" />
                  <span>
                    Entry: ${tournament.entryFee} | Prize: $
                    {tournament.prizePool}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleViewRegistrations(tournament)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                title="View registered teams & players"
              >
                <IoEye />
              </button>
              <button
                onClick={() => handleEdit(tournament)}
                className="flex-1 px-4 py-2 bg-blue-100 text-blue-600 font-semibold rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
              >
                <IoPencil /> Edit
              </button>
              <button
                onClick={() => handleDelete(tournament._id)}
                className="px-4 py-2 bg-red-100 text-red-600 font-semibold rounded-lg hover:bg-red-200 transition-colors"
              >
                <IoTrash />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTournaments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-primary-600">
            {searchQuery || statusFilter !== "all"
              ? "No tournaments found matching your filters."
              : "No tournaments found. Create your first tournament!"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {filteredTournaments.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            itemsPerPage={itemsPerPage}
            totalItems={filteredTournaments.length}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Comprehensive View Registrations Modal */}
      <AnimatePresence>
        {(viewRegistrationsTournament || loadingRegistrations) && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!loadingRegistrations && !loadingTeamMembers) {
                setViewRegistrationsTournament(null);
                setViewMembersTeam(null);
              }
            }}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-primary-200"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {loadingRegistrations ? (
                <div className="p-12 text-center text-primary-600">
                  <div className="w-10 h-10 border-4 border-secondary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="font-semibold text-sm">Loading complete registration and roster details...</p>
                </div>
              ) : viewRegistrationsTournament ? (
                (() => {
                  const t = viewRegistrationsTournament;
                  const regTeams = t.registeredTeams || [];
                  const regPlayers = t.registeredPlayers || [];

                  // Compute master roster across all teams and individuals
                  const masterPlayers = [];
                  regTeams.forEach((reg) => {
                    const teamName = reg.team?.name || "Team";
                    const teamId = reg.team?._id || reg.team;
                    const leader = reg.team?.leader;
                    if (leader && typeof leader === "object") {
                      masterPlayers.push({
                        ...leader,
                        teamName,
                        teamId,
                        isLeader: true,
                        paymentStatus: reg.paymentStatus,
                        paymentMethod: reg.paymentMethod,
                        registeredAt: reg.registeredAt,
                        entryType: "team",
                      });
                    }
                    (reg.team?.members || []).forEach((m) => {
                      if (typeof m === "object" && m._id?.toString() !== leader?._id?.toString()) {
                        masterPlayers.push({
                          ...m,
                          teamName,
                          teamId,
                          isLeader: false,
                          paymentStatus: reg.paymentStatus,
                          paymentMethod: reg.paymentMethod,
                          registeredAt: reg.registeredAt,
                          entryType: "team",
                        });
                      }
                    });
                  });

                  regPlayers.forEach((reg) => {
                    if (reg.player && typeof reg.player === "object") {
                      masterPlayers.push({
                        ...reg.player,
                        teamName: reg.player.team?.name || "Individual Entry",
                        teamId: reg.player.team?._id || null,
                        isLeader: false,
                        paymentStatus: reg.paymentStatus,
                        paymentMethod: reg.paymentMethod,
                        registeredAt: reg.registeredAt,
                        entryType: "individual",
                      });
                    }
                  });

                  // Filter teams
                  const searchLower = regSearchTerm.toLowerCase();
                  const filteredRegTeams = regTeams.filter((reg) => {
                    if (!searchLower) return true;
                    const team = reg.team || {};
                    const leaderName = `${team.leader?.firstName || ""} ${team.leader?.lastName || ""}`.trim();
                    const matchTeam = (team.name || "").toLowerCase().includes(searchLower);
                    const matchLeader =
                      leaderName.toLowerCase().includes(searchLower) ||
                      (team.leader?.username || "").toLowerCase().includes(searchLower) ||
                      (team.leader?.phone || "").toLowerCase().includes(searchLower) ||
                      (team.leader?.memberCode || "").toLowerCase().includes(searchLower);
                    const matchMember = (team.members || []).some((m) => {
                      const mName = `${m.firstName || ""} ${m.lastName || ""}`.trim();
                      return (
                        mName.toLowerCase().includes(searchLower) ||
                        (m.username || "").toLowerCase().includes(searchLower) ||
                        (m.phone || "").toLowerCase().includes(searchLower) ||
                        (m.memberCode || "").toLowerCase().includes(searchLower)
                      );
                    });
                    return matchTeam || matchLeader || matchMember;
                  });

                  // Filter individual players
                  const filteredRegPlayers = regPlayers.filter((reg) => {
                    if (!searchLower) return true;
                    const p = reg.player || {};
                    const pName = `${p.firstName || ""} ${p.lastName || ""}`.trim();
                    return (
                      pName.toLowerCase().includes(searchLower) ||
                      (p.username || "").toLowerCase().includes(searchLower) ||
                      (p.email || "").toLowerCase().includes(searchLower) ||
                      (p.phone || "").toLowerCase().includes(searchLower) ||
                      (p.memberCode || "").toLowerCase().includes(searchLower)
                    );
                  });

                  // Filter master roster
                  const filteredMaster = masterPlayers.filter((p) => {
                    if (!searchLower) return true;
                    const pName = `${p.firstName || ""} ${p.lastName || ""}`.trim();
                    return (
                      pName.toLowerCase().includes(searchLower) ||
                      (p.username || "").toLowerCase().includes(searchLower) ||
                      (p.email || "").toLowerCase().includes(searchLower) ||
                      (p.phone || "").toLowerCase().includes(searchLower) ||
                      (p.memberCode || "").toLowerCase().includes(searchLower) ||
                      (p.teamName || "").toLowerCase().includes(searchLower)
                    );
                  });

                  return (
                    <>
                      {/* Modal Top Header */}
                      <div className="p-5 border-b border-primary-200 bg-primary-50/70">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="px-2 py-0.5 rounded-md bg-secondary-100 text-secondary-800 text-[11px] font-bold uppercase tracking-wide">
                                Event Registrations Hub
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(t.status)}`}>
                                {t.status?.replace("_", " ")}
                              </span>
                              <span className="text-xs text-primary-500 capitalize">
                                Format: {t.format || "Knockout"} · Type: {t.tournamentType}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-primary-950 truncate">
                              {t.name}
                            </h3>
                            <div className="flex items-center gap-4 text-xs text-primary-600 mt-1 flex-wrap">
                              <span className="flex items-center gap-1 font-medium">
                                <IoCalendar className="text-secondary-500" />
                                {new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}
                              </span>
                              {t.location && (
                                <span className="flex items-center gap-1">
                                  <IoLocation className="text-secondary-500" /> {t.location}
                                </span>
                              )}
                              <span className="flex items-center gap-1 font-semibold text-primary-800">
                                <IoPeople className="text-secondary-500" /> {regTeams.length + regPlayers.length} / {t.maxTeams} Registered
                              </span>
                              {t.entryFee > 0 && (
                                <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Entry Fee: ${t.entryFee}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => exportRegistrationsCSV(t)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                              title="Export complete registration list to CSV"
                            >
                              <IoDownload className="text-sm" /> Export CSV
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setViewRegistrationsTournament(null);
                                setViewMembersTeam(null);
                              }}
                              className="p-1.5 text-primary-500 hover:text-primary-800 hover:bg-primary-200 rounded-xl transition-colors cursor-pointer"
                              aria-label="Close"
                            >
                              <IoCloseCircle className="w-6 h-6" />
                            </button>
                          </div>
                        </div>

                        {/* Search & Tabs Toolbar */}
                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-primary-200/70">
                          {/* Tabs */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setRegModalTab("teams")}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                regModalTab === "teams"
                                  ? "bg-secondary-500 text-white shadow-xs"
                                  : "bg-white text-primary-700 border border-primary-200 hover:bg-primary-100"
                              }`}
                            >
                              Registered Teams ({regTeams.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setRegModalTab("players")}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                regModalTab === "players"
                                  ? "bg-secondary-500 text-white shadow-xs"
                                  : "bg-white text-primary-700 border border-primary-200 hover:bg-primary-100"
                              }`}
                            >
                              Individual Players ({regPlayers.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setRegModalTab("all_players")}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                regModalTab === "all_players"
                                  ? "bg-secondary-500 text-white shadow-xs"
                                  : "bg-white text-primary-700 border border-primary-200 hover:bg-primary-100"
                              }`}
                            >
                              Master Player Roster ({masterPlayers.length})
                            </button>
                          </div>

                          {/* Quick Filter Input */}
                          <div className="relative w-full sm:w-64">
                            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400 text-xs" />
                            <input
                              type="text"
                              value={regSearchTerm}
                              onChange={(e) => setRegSearchTerm(e.target.value)}
                              placeholder="Search player, code, team, phone..."
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-primary-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-secondary-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Modal Body Content */}
                      <div className="p-5 overflow-y-auto flex-1 space-y-4">
                        {/* 1. Teams Tab */}
                        {regModalTab === "teams" && (
                          <div className="space-y-3">
                            {filteredRegTeams.length === 0 ? (
                              <div className="text-center py-12 text-primary-500">
                                <IoShirt className="text-4xl mx-auto mb-2 opacity-40" />
                                <p className="font-semibold text-sm">
                                  {regSearchTerm ? "No registered teams match your search." : "No teams registered yet for this tournament."}
                                </p>
                              </div>
                            ) : (
                              filteredRegTeams.map((reg, idx) => {
                                const team = reg.team || {};
                                const teamId = team._id || reg._id || idx;
                                const isExpanded = expandedRegTeamIds.includes(teamId);
                                const members = team.members || [];
                                const leader = team.leader;
                                const payStatus = reg.paymentStatus || "pending";

                                return (
                                  <div
                                    key={teamId}
                                    className="border border-primary-200 rounded-2xl bg-white overflow-hidden shadow-2xs"
                                  >
                                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-primary-50/40">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                                          {team.name?.slice(0, 2).toUpperCase() || "TM"}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-bold text-primary-950 text-base truncate">
                                              {team.name || "Unknown Team"}
                                            </h4>
                                            <span
                                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                payStatus === "paid"
                                                  ? "bg-green-100 text-green-800"
                                                  : payStatus === "refunded"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-amber-100 text-amber-800"
                                              }`}
                                            >
                                              Payment: {payStatus}
                                            </span>
                                            {reg.paymentMethod && (
                                              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-primary-100 text-primary-700">
                                                {reg.paymentMethod}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-primary-500 flex items-center gap-2 mt-0.5">
                                            <span>
                                              Leader: <strong className="text-primary-800">{[leader?.firstName, leader?.lastName].filter(Boolean).join(" ") || leader?.username || "N/A"}</strong>
                                            </span>
                                            {leader?.memberCode && (
                                              <span className="font-mono text-secondary-600">
                                                ({leader.memberCode})
                                              </span>
                                            )}
                                            {reg.registeredAt && (
                                              <span>· Registered {new Date(reg.registeredAt).toLocaleDateString()}</span>
                                            )}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 self-end sm:self-center">
                                        <button
                                          type="button"
                                          onClick={() => toggleRegTeamExpand(teamId)}
                                          className="px-3 py-1.5 rounded-xl border border-primary-200 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition-colors flex items-center gap-1 cursor-pointer"
                                        >
                                          <IoPeople />
                                          {isExpanded ? "Hide Roster" : `View Roster (${members.length})`}
                                          {isExpanded ? <IoChevronUp /> : <IoChevronDown />}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Zelle info if present */}
                                    {reg.zellePayment && (
                                      <div className="px-4 py-2 bg-purple-50/70 border-t border-purple-100 text-xs text-purple-900 flex flex-wrap items-center gap-x-4 gap-y-1">
                                        <span className="font-bold">Manual/Zelle:</span>
                                        <span>Sender: {reg.zellePayment.sendersName || "N/A"}</span>
                                        <span>Ref: {reg.zellePayment.transactionReference || "None"}</span>
                                        <span>Amount: ${reg.zellePayment.amount || t.entryFee}</span>
                                      </div>
                                    )}

                                    {/* Expanded Roster Accordion */}
                                    <AnimatePresence>
                                      {isExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="p-4 border-t border-primary-200 bg-white space-y-2.5"
                                        >
                                          <p className="text-xs font-bold uppercase tracking-wide text-primary-600">
                                            Team Roster & Player Contact Details ({members.length} Members)
                                          </p>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                            {members.map((member) => {
                                              const mId = member._id || member.id || member;
                                              const isCap = mId?.toString() === leader?._id?.toString();
                                              const age = calculateAge(member.dob);
                                              const isYouth = member.isMinor || (age !== null && age < 18);

                                              return (
                                                <div
                                                  key={mId}
                                                  className="p-3 rounded-xl border border-primary-200/80 bg-primary-50/30 text-xs space-y-1"
                                                >
                                                  <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                      <span className="font-bold text-primary-950 truncate">
                                                        {[member.firstName, member.lastName].filter(Boolean).join(" ") || member.username || "Player"}
                                                      </span>
                                                      {isCap && (
                                                        <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-bold uppercase rounded">
                                                          Captain
                                                        </span>
                                                      )}
                                                      {isYouth && (
                                                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                                                          Youth ({age !== null ? `${age}y` : "Minor"})
                                                        </span>
                                                      )}
                                                    </div>
                                                    {member.memberCode && (
                                                      <span className="font-mono text-[10px] font-bold text-secondary-600 bg-secondary-50 px-1.5 py-0.5 rounded border border-secondary-200 flex-shrink-0">
                                                        {member.memberCode}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <div className="text-primary-600 space-y-0.5 text-[11px]">
                                                    <p className="font-mono text-primary-500">@{member.username || "user"}</p>
                                                    {member.email && (
                                                      <p className="truncate">
                                                        Email: <a href={`mailto:${member.email}`} className="text-secondary-600 hover:underline">{member.email}</a>
                                                      </p>
                                                    )}
                                                    {member.phone && <p>Tel: {member.phone}</p>}
                                                    {isYouth && member.guardianName && (
                                                      <p className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                                                        Guardian: {member.guardianName} ({member.guardianPhone || "No tel"})
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}

                        {/* 2. Individual Players Tab */}
                        {regModalTab === "players" && (
                          <div className="space-y-3">
                            {filteredRegPlayers.length === 0 ? (
                              <div className="text-center py-12 text-primary-500">
                                <IoPerson className="text-4xl mx-auto mb-2 opacity-40" />
                                <p className="font-semibold text-sm">
                                  {regSearchTerm ? "No registered individual players match your search." : "No individual players registered yet for this tournament."}
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredRegPlayers.map((reg, idx) => {
                                  const p = reg.player || {};
                                  const pId = p._id || p.id || idx;
                                  const age = calculateAge(p.dob);
                                  const isYouth = p.isMinor || (age !== null && age < 18);
                                  const payStatus = reg.paymentStatus || "pending";

                                  return (
                                    <div
                                      key={pId}
                                      className="p-4 rounded-2xl border border-primary-200 bg-white shadow-2xs space-y-2 text-xs"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-bold text-primary-950 text-sm">
                                              {[p.firstName, p.lastName].filter(Boolean).join(" ") || p.username || "Player"}
                                            </h4>
                                            {isYouth && (
                                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                                                Youth ({age !== null ? `${age}y` : "Minor"})
                                              </span>
                                            )}
                                          </div>
                                          <p className="font-mono text-primary-500 text-[11px]">@{p.username || "player"}</p>
                                        </div>

                                        <div className="text-right flex flex-col items-end gap-1">
                                          <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                              payStatus === "paid"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-amber-100 text-amber-800"
                                            }`}
                                          >
                                            {payStatus}
                                          </span>
                                          {p.memberCode && (
                                            <span className="font-mono text-[10px] font-bold text-secondary-600 bg-secondary-50 px-1.5 py-0.5 rounded border border-secondary-200">
                                              {p.memberCode}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="pt-2 border-t border-primary-100 space-y-1 text-primary-600 text-[11px]">
                                        <p>
                                          Email: <a href={`mailto:${p.email}`} className="text-secondary-600 hover:underline">{p.email || "None"}</a>
                                        </p>
                                        <p>Phone: {p.phone || "No phone listed"}</p>
                                        {p.team && (
                                          <p className="text-indigo-700 font-semibold flex items-center gap-1">
                                            <IoShirt /> Team: {p.team.name || "Assigned"}
                                          </p>
                                        )}
                                        {reg.registeredAt && (
                                          <p className="text-primary-400">
                                            Registered: {new Date(reg.registeredAt).toLocaleDateString()}
                                          </p>
                                        )}
                                        {isYouth && p.guardianName && (
                                          <p className="text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200/60 mt-1">
                                            Guardian: {p.guardianName} ({p.guardianPhone || "No tel"})
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. Master Player Roster Tab */}
                        {regModalTab === "all_players" && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs text-primary-600 pb-2 border-b border-primary-200">
                              <p className="font-semibold">
                                Complete list of all participants ({filteredMaster.length} Players)
                              </p>
                              <span className="text-primary-400">
                                Aggregated across all team rosters and solo entrants
                              </span>
                            </div>

                            {filteredMaster.length === 0 ? (
                              <p className="text-center py-10 text-primary-500 text-sm">
                                No participants match the filter.
                              </p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-primary-200 bg-primary-50/50 text-primary-700 font-semibold">
                                      <th className="py-2.5 px-3">Player</th>
                                      <th className="py-2.5 px-3">Team Affiliation</th>
                                      <th className="py-2.5 px-3">Member Code</th>
                                      <th className="py-2.5 px-3">Contact</th>
                                      <th className="py-2.5 px-3">Age / Status</th>
                                      <th className="py-2.5 px-3">Payment</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-primary-100">
                                    {filteredMaster.map((m, i) => {
                                      const age = calculateAge(m.dob);
                                      const isYouth = m.isMinor || (age !== null && age < 18);

                                      return (
                                        <tr key={m._id || i} className="hover:bg-primary-50/40">
                                          <td className="py-2.5 px-3">
                                            <p className="font-bold text-primary-950">
                                              {[m.firstName, m.lastName].filter(Boolean).join(" ") || m.username || "Player"}
                                            </p>
                                            <p className="text-[11px] font-mono text-primary-500">@{m.username || "player"}</p>
                                          </td>
                                          <td className="py-2.5 px-3">
                                            <span className="font-semibold text-indigo-700">
                                              {m.teamName}
                                            </span>
                                            {m.isLeader && (
                                              <span className="ml-1.5 px-1 py-0.2 bg-blue-100 text-blue-700 text-[9px] font-bold uppercase rounded">
                                                Captain
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-2.5 px-3 font-mono font-bold text-secondary-600">
                                            {m.memberCode || "—"}
                                          </td>
                                          <td className="py-2.5 px-3 text-[11px] text-primary-600">
                                            <p>{m.email || "No email"}</p>
                                            {m.phone && <p>{m.phone}</p>}
                                          </td>
                                          <td className="py-2.5 px-3">
                                            {isYouth ? (
                                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                                Youth ({age !== null ? `${age}y` : "Minor"})
                                              </span>
                                            ) : (
                                              <span className="text-primary-600 text-[11px]">
                                                {age !== null ? `${age}y (Adult)` : "Adult"}
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-2.5 px-3">
                                            <span
                                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                m.paymentStatus === "paid"
                                                  ? "bg-green-100 text-green-800"
                                                  : "bg-amber-100 text-amber-800"
                                              }`}
                                            >
                                              {m.paymentStatus || "pending"}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TournamentManagement;
