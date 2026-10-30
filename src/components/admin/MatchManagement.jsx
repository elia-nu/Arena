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
  IoSave,
  IoImage,
  IoCloudUpload,
  IoLink,
  IoCloseCircle,
} from "react-icons/io5";
import { matchAPI, tournamentAPI, mediaAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";
import { absoluteMediaSrc } from "../../utils/mediaUtils";
import Pagination from "./Pagination";

const MatchManagement = () => {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [formData, setFormData] = useState({
    tournament: "",
    matchNumber: "",
    round: "",
    scheduledDate: "",
    scheduledTime: "",
    location: "",
    venue: "",
    team1: { team: "", player: "" },
    team2: { team: "", player: "" },
    referee: "",
    image: "",
    notes: "",
    status: "scheduled",
  });
  const [imageInputMode, setImageInputMode] = useState("upload"); // "upload" or "url"
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const { showSuccess, showError } = useNotification();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchMatches();
    fetchTournaments();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const data = await matchAPI.getAll({ upcoming: "false" });
      setMatches(data.matches || []);
    } catch (error) {
      showError(error.message || "Failed to fetch matches");
    } finally {
      setLoading(false);
    }
  };

  const fetchTournaments = async () => {
    try {
      const data = await tournamentAPI.getAll();
      setTournaments(data.tournaments || []);
    } catch (error) {
      console.error("Failed to fetch tournaments:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const matchData = {
        ...formData,
        team1: {
          team: formData.team1.team || undefined,
          player: formData.team1.player || undefined,
        },
        team2: {
          team: formData.team2.team || undefined,
          player: formData.team2.player || undefined,
        },
        tournament: formData.tournament || undefined,
        referee: formData.referee || undefined,
      };

      if (editingMatch) {
        await matchAPI.update(editingMatch._id, matchData);
        showSuccess("Match updated successfully");
      } else {
        await matchAPI.create(matchData);
        showSuccess("Match created successfully");
      }
      setShowForm(false);
      setEditingMatch(null);
      resetForm();
      fetchMatches();
    } catch (error) {
      showError(error.message || "Failed to save match");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (match) => {
    setEditingMatch(match);
    setFormData({
      tournament: match.tournament?._id || "",
      matchNumber: match.matchNumber || "",
      round: match.round || "",
      scheduledDate: match.scheduledDate
        ? new Date(match.scheduledDate).toISOString().split("T")[0]
        : "",
      scheduledTime: match.scheduledTime || "",
      location: match.location || "",
      venue: match.venue || "",
      team1: {
        team: match.team1?.team?._id || "",
        player: match.team1?.player?._id || "",
      },
      team2: {
        team: match.team2?.team?._id || "",
        player: match.team2?.player?._id || "",
      },
      referee: match.referee?._id || match.referee || "",
      image: match.image || "",
      notes: match.notes || "",
      status: match.status || "scheduled",
    });
    setImagePreview(
      match.image ? absoluteMediaSrc(match.image) || match.image : null,
    );
    setImageInputMode(
      match.image &&
        !match.image.startsWith("data:") &&
        !match.image.startsWith("/uploads/")
        ? "url"
        : "upload",
    );
    setImageUrlInput("");
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this match?")) {
      return;
    }
    setSubmitting(true);
    try {
      await matchAPI.delete(id);
      showSuccess("Match deleted successfully");
      fetchMatches();
    } catch (error) {
      showError(error.message || "Failed to delete match");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromote = async (match) => {
    try {
      await matchAPI.promote(match._id);
      showSuccess(match.isPromoted ? "Match unpromoted" : "Match promoted");
      fetchMatches();
    } catch (error) {
      showError(error.message || "Failed to promote match");
    }
  };

  const handleUpdateResult = async (match, team1Score, team2Score) => {
    setSubmitting(true);
    try {
      await matchAPI.updateResult(match._id, team1Score, team2Score);
      showSuccess("Match result updated successfully");
      fetchMatches();
    } catch (error) {
      showError(error.message || "Failed to update match result");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tournament: "",
      matchNumber: "",
      round: "",
      scheduledDate: "",
      scheduledTime: "",
      location: "",
      venue: "",
      team1: { team: "", player: "" },
      team2: { team: "", player: "" },
      referee: "",
      image: "",
      notes: "",
      status: "scheduled",
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
      scheduled: "bg-blue-100 text-blue-800",
      live: "bg-red-100 text-red-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800",
      postponed: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || colors.scheduled;
  };

  if (loading) {
    return (
      <div className="bg-white border-2 border-primary-200 rounded-3xl p-8">
        <p className="text-primary-600">Loading matches...</p>
      </div>
    );
  }

  // Derive selected tournament and available teams/players based on registration + payment
  const selectedTournament = tournaments.find(
    (tournament) => tournament._id === formData.tournament
  );

  const tournamentStartDateFormatted = selectedTournament?.startDate
    ? new Date(selectedTournament.startDate).toISOString().split("T")[0]
    : undefined;

  const tournamentEndDateFormatted = selectedTournament?.endDate
    ? new Date(selectedTournament.endDate).toISOString().split("T")[0]
    : undefined;

  const tournamentType = selectedTournament?.tournamentType || "team"; // "team", "individual"

  const registeredTeams = selectedTournament?.registeredTeams || [];
  const registeredPlayers = selectedTournament?.registeredPlayers || [];

  // Consider paymentStatus === "paid" as fully paid. If entryFee is 0, treat all as paid.
  const isFreeTournament = (selectedTournament?.entryFee || 0) === 0;

  const paidRegisteredTeams = registeredTeams.filter((reg) =>
    isFreeTournament ? true : reg.paymentStatus === "paid"
  );

  const paidRegisteredPlayers = registeredPlayers.filter((reg) =>
    isFreeTournament ? true : reg.paymentStatus === "paid"
  );

  // Build available options for dropdowns - ONLY show registered (and paid) teams/players
  // If no tournament is selected, show empty lists
  const availableTeams = selectedTournament
    ? paidRegisteredTeams
        .map((reg) => reg.team)
        .filter((team) => !!team)
        .map((team) => ({
          _id: team._id || team.id || team,
          name: team.name || "Team",
        }))
    : [];

  // We no longer support creating individual (player vs player) matches from the dashboard,
  // so we do not build a list of individual players for match creation.
  const availablePlayers = [];

  // Pagination for matches list
  const totalPages = Math.ceil(matches.length / itemsPerPage) || 1;
  const paginatedMatches = matches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-secondary-600">
          Match Management
        </h2>
        <motion.button
          onClick={() => {
            resetForm();
            setEditingMatch(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-secondary-500 text-white font-semibold rounded-xl hover:bg-secondary-600 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <IoAdd /> Create Match
        </motion.button>
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
              {editingMatch ? "Edit Match" : "Create New Match"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Tournament
                  </label>
                  <select
                    disabled={submitting}
                    value={formData.tournament}
                    onChange={(e) => {
                      const tournamentId = e.target.value;
                      const selected = tournaments.find(
                        (t) => t._id === tournamentId
                      );

                      // Auto-calculate next match number for this tournament
                      let nextMatchNumber = "";
                      if (tournamentId) {
                        const tournamentMatches = matches.filter(
                          (m) => m.tournament?._id === tournamentId
                        );
                        const maxMatchNumber = tournamentMatches.reduce(
                          (max, m) =>
                            m.matchNumber && Number.isFinite(m.matchNumber)
                              ? Math.max(max, m.matchNumber)
                              : max,
                          0
                        );
                        nextMatchNumber = maxMatchNumber + 1;
                      }

                      // Default scheduled date within tournament range (clamped to today)
                      let scheduledDate = formData.scheduledDate;
                      if (selected?.startDate && selected?.endDate) {
                        const start = new Date(selected.startDate);
                        const end = new Date(selected.endDate);
                        const today = new Date();
                        const clamped =
                          today < start ? start : today > end ? end : today;
                        scheduledDate = clamped.toISOString().split("T")[0];
                      }

                      setFormData({
                        ...formData,
                        tournament: tournamentId,
                        matchNumber: nextMatchNumber || "",
                        scheduledDate,
                      });
                    }}
                    className={`w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none ${
                      submitting
                        ? "opacity-50 cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  >
                    <option value="">Select Tournament (Optional)</option>
                    {tournaments.map((tournament) => (
                      <option key={tournament._id} value={tournament._id}>
                        {tournament.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Match Number
                  </label>
                  <input
                    type="number"
                    disabled={submitting}
                    value={formData.matchNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, matchNumber: e.target.value })
                    }
                    className={`w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none ${
                      submitting
                        ? "opacity-50 cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Round
                  </label>
                  <input
                    type="text"
                    disabled={submitting}
                    value={formData.round}
                    onChange={(e) =>
                      setFormData({ ...formData, round: e.target.value })
                    }
                    placeholder="e.g., Quarter Final, Semi Final"
                    className={`w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none ${
                      submitting
                        ? "opacity-50 cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    disabled={submitting}
                    value={formData.scheduledDate}
                    min={tournamentStartDateFormatted}
                    max={tournamentEndDateFormatted}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledDate: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none ${
                      submitting
                        ? "opacity-50 cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    disabled={submitting}
                    value={formData.scheduledTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledTime: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none ${
                      submitting
                        ? "opacity-50 cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Status *
                  </label>
                  <select
                    disabled={submitting}
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className={`w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none ${
                      submitting
                        ? "opacity-50 cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="postponed">Postponed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    disabled={submitting}
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className={`w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none ${
                      submitting
                        ? "opacity-50 cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Venue
                  </label>
                  <input
                    type="text"
                    disabled={submitting}
                    value={formData.venue}
                    onChange={(e) =>
                      setFormData({ ...formData, venue: e.target.value })
                    }
                    className={`w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none ${
                      submitting
                        ? "opacity-50 cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  />
                </div>
                {/* Team / Player selection for Team 1 */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    {tournamentType === "individual"
                      ? "Player 1"
                      : "Team 1 - Team (or leave empty for individual)"}
                  </label>
                  <select
                    disabled={submitting || tournamentType === "individual"}
                    value={formData.team1.team}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        team1: {
                          team: e.target.value,
                          player: e.target.value ? "" : formData.team1.player,
                        },
                      })
                    }
                    className={`w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none ${
                      submitting
                        ? "opacity-50 cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  >
                    <option value="">
                      {!selectedTournament
                        ? "Select a tournament first"
                        : tournamentType === "individual"
                        ? "Teams disabled for individual tournament"
                        : availableTeams.length === 0
                        ? "No registered teams available"
                        : "Select Team (Optional)"}
                    </option>
                    {availableTeams.map((team) => (
                      <option key={team._id} value={team._id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Individual player selection for Team 1 is no longer supported */}

                {/* Team / Player selection for Team 2 */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    {tournamentType === "individual"
                      ? "Player 2"
                      : "Team 2 - Team (or leave empty for individual)"}
                  </label>
                  <select
                    disabled={submitting || tournamentType === "individual"}
                    value={formData.team2.team}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        team2: {
                          team: e.target.value,
                          player: e.target.value ? "" : formData.team2.player,
                        },
                      })
                    }
                    className={`w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none ${
                      submitting
                        ? "opacity-50 cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  >
                    <option value="">
                      {!selectedTournament
                        ? "Select a tournament first"
                        : tournamentType === "individual"
                        ? "Teams disabled for individual tournament"
                        : availableTeams.length === 0
                        ? "No registered teams available"
                        : "Select Team (Optional)"}
                    </option>
                    {availableTeams.map((team) => (
                      <option key={team._id} value={team._id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Individual player selection for Team 2 is no longer supported */}
              </div>
              {/* Match image section (upload or URL) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-primary-700">
                    Match Image
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
                        disabled={submitting || uploadingImage}
                        onChange={handleImageUpload}
                        className="hidden"
                        id="match-image-upload"
                      />
                      <label
                        htmlFor="match-image-upload"
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
                        disabled={submitting}
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="https://example.com/match-image.jpg"
                        className={`flex-1 px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none ${
                          submitting
                            ? "opacity-50 cursor-not-allowed bg-gray-100"
                            : ""
                        }`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !submitting) {
                            e.preventDefault();
                            handleImageUrlApply();
                          }
                        }}
                      />
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleImageUrlApply}
                        className={`px-4 py-2 bg-secondary-500 text-white text-sm font-medium rounded-lg transition-colors ${
                          submitting
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-secondary-600"
                        }`}
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
                      alt="Match preview"
                      className="w-20 h-20 object-cover border border-primary-200 rounded-lg"
                      onError={(e) => {
                        e.target.src = "/placeholder-match.jpg";
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
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Notes
                </label>
                <textarea
                  disabled={submitting}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows="3"
                  className={`w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none ${
                    submitting
                      ? "opacity-50 cursor-not-allowed bg-gray-100"
                      : ""
                  }`}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-3 bg-secondary-500 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 ${
                    submitting
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-secondary-600"
                  }`}
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {editingMatch ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <IoSave />
                      {editingMatch ? "Update Match" : "Create Match"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setShowForm(false);
                    setEditingMatch(null);
                    resetForm();
                  }}
                  className={`px-6 py-3 bg-gray-500 text-white font-semibold rounded-xl transition-colors ${
                    submitting
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-600"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {paginatedMatches.map((match) => (
          <motion.div
            key={match._id}
            className="bg-primary-50 border-2 border-primary-200 rounded-2xl p-6 hover:border-tertiary-500 transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {match.tournament && (
                    <span className="text-sm text-primary-600">
                      {match.tournament.name}
                    </span>
                  )}
                  {match.round && (
                    <span className="text-sm text-primary-600">
                      • {match.round}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-primary-950">
                    {match.team1?.team?.name ||
                      match.team1?.player?.username ||
                      "TBD"}{" "}
                    vs{" "}
                    {match.team2?.team?.name ||
                      match.team2?.player?.username ||
                      "TBD"}
                  </span>
                  {match.status === "completed" && match.result && (
                    <span className="text-lg font-bold text-tertiary-600">
                      {match.result.score.team1Score} -{" "}
                      {match.result.score.team2Score}
                    </span>
                  )}
                </div>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    match.status
                  )}`}
                >
                  {match.status}
                </span>
              </div>
              <button
                onClick={() => handlePromote(match)}
                className={`p-2 rounded-lg transition-colors ${
                  match.isPromoted
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-primary-100 text-primary-600"
                }`}
                title={match.isPromoted ? "Unpromote" : "Promote"}
              >
                {match.isPromoted ? <IoStar /> : <IoStarOutline />}
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-primary-700">
                <IoCalendar className="text-tertiary-500" />
                <span>
                  {new Date(match.scheduledDate).toLocaleDateString()}
                  {match.scheduledTime && ` at ${match.scheduledTime}`}
                </span>
              </div>
              {match.location && (
                <div className="flex items-center gap-2 text-sm text-primary-700">
                  <IoLocation className="text-tertiary-500" />
                  <span>{match.location}</span>
                </div>
              )}
            </div>

            {match.status === "scheduled" && (
              <div className="mb-4 p-3 bg-white rounded-lg">
                <p className="text-sm font-semibold text-primary-700 mb-2">
                  Update Result:
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    disabled={submitting}
                    placeholder="Team 1 Score"
                    id={`team1-${match._id}`}
                    className={`flex-1 px-3 py-2 border-2 border-primary-200 rounded-lg ${
                      submitting
                        ? "opacity-50 cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  />
                  <span className="self-center">-</span>
                  <input
                    type="number"
                    min="0"
                    disabled={submitting}
                    placeholder="Team 2 Score"
                    id={`team2-${match._id}`}
                    className={`flex-1 px-3 py-2 border-2 border-primary-200 rounded-lg ${
                      submitting
                        ? "opacity-50 cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  />
                  <button
                    onClick={() => {
                      const team1Score = document.getElementById(
                        `team1-${match._id}`
                      ).value;
                      const team2Score = document.getElementById(
                        `team2-${match._id}`
                      ).value;
                      if (team1Score && team2Score) {
                        handleUpdateResult(
                          match,
                          parseInt(team1Score),
                          parseInt(team2Score)
                        );
                      }
                    }}
                    disabled={submitting}
                    className={`px-4 py-2 bg-green-500 text-white rounded-lg transition-colors flex items-center gap-2 ${
                      submitting
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-green-600"
                    }`}
                  >
                    {submitting ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <IoSave /> Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(match)}
                disabled={submitting}
                className={`flex-1 px-4 py-2 bg-blue-100 text-blue-600 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  submitting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-200"
                }`}
              >
                <IoPencil /> Edit
              </button>
              <button
                onClick={() => handleDelete(match._id)}
                disabled={submitting}
                className={`px-4 py-2 bg-red-100 text-red-600 font-semibold rounded-lg transition-colors ${
                  submitting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-red-200"
                }`}
              >
                {submitting ? (
                  <svg
                    className="animate-spin h-5 w-5 text-red-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <IoTrash />
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {matches.length === 0 && (
        <div className="text-center py-12">
          <p className="text-primary-600">
            No matches found. Create your first match!
          </p>
        </div>
      )}

      {/* Pagination */}
      {matches.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            itemsPerPage={itemsPerPage}
            totalItems={matches.length}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage);
              setCurrentPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MatchManagement;
