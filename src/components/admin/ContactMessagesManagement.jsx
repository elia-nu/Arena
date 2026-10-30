import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoMail,
  IoMailOpen,
  IoCheckmarkCircle,
  IoArchive,
  IoTrash,
  IoEye,
  IoClose,
  IoSearch,
  IoFilter,
} from "react-icons/io5";
import { contactAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";
import Pagination from "./Pagination";

const ContactMessagesManagement = () => {
  const { showSuccess, showError } = useNotification();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    read: 0,
    replied: 0,
    archived: 0,
    recent: 0,
  });
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchMessages();
    fetchStats();
  }, [filter, currentPage, search, itemsPerPage]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      if (filter !== "all") {
        params.status = filter;
      }

      if (search) {
        params.search = search;
      }

      const data = await contactAPI.getAll(params);
      setMessages(data.messages || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      showError("Failed to load contact messages");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await contactAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error("Error fetching contact message stats:", error);
    }
  };

  const handleViewMessage = async (message) => {
    setSelectedMessage(message);
    setAdminNotes(message.adminNotes || "");
    setShowModal(true);

    // Mark as read if it's new
    if (message.status === "new") {
      await handleUpdateStatus(message._id, "read");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const message = messages.find((m) => m._id === id);
      await contactAPI.updateStatus(id, status, message?.adminNotes || "");
      showSuccess(`Message marked as ${status}`);
      fetchMessages();
      fetchStats();

      // Update selected message if it's the one being updated
      if (selectedMessage && selectedMessage._id === id) {
        const updated = await contactAPI.getById(id);
        setSelectedMessage(updated);
      }
    } catch (error) {
      console.error("Error updating message status:", error);
      showError("Failed to update message status");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedMessage) return;

    try {
      await contactAPI.updateStatus(
        selectedMessage._id,
        selectedMessage.status,
        adminNotes
      );
      showSuccess("Admin notes saved");
      fetchMessages();
      const updated = await contactAPI.getById(selectedMessage._id);
      setSelectedMessage(updated);
    } catch (error) {
      console.error("Error saving admin notes:", error);
      showError("Failed to save admin notes");
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this contact message?")
    ) {
      return;
    }

    try {
      await contactAPI.delete(id);
      showSuccess("Contact message deleted successfully");
      fetchMessages();
      fetchStats();
      if (selectedMessage && selectedMessage._id === id) {
        setShowModal(false);
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error("Error deleting contact message:", error);
      showError("Failed to delete contact message");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "new":
        return <IoMail className="text-blue-500" />;
      case "read":
        return <IoMailOpen className="text-gray-500" />;
      case "replied":
        return <IoCheckmarkCircle className="text-green-500" />;
      case "archived":
        return <IoArchive className="text-gray-400" />;
      default:
        return <IoMail className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "read":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "replied":
        return "bg-green-100 text-green-800 border-green-200";
      case "archived":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Contact Messages
            </h1>
            <p className="text-sm text-gray-600">
              Manage and respond to contact form submissions
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            <div className="text-sm text-blue-700">New</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">{stats.read}</div>
            <div className="text-sm text-gray-700">Read</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {stats.replied}
            </div>
            <div className="text-sm text-green-700">Replied</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">
              {stats.archived}
            </div>
            <div className="text-sm text-gray-700">Archived</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">
              {stats.total}
            </div>
            <div className="text-sm text-purple-700">Total</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, subject, or message..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {["all", "new", "read", "replied", "archived"].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setCurrentPage(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Messages List */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
          <IoMail className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No contact messages found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {messages.map((message) => (
                    <tr
                      key={message._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(message.status)}
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(
                              message.status
                            )}`}
                          >
                            {message.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {message.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {message.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {message.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatDate(message.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewMessage(message)}
                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View message"
                          >
                            <IoEye className="text-xl" />
                          </button>
                          {message.status !== "archived" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(message._id, "archived")
                              }
                              className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                              title="Archive"
                            >
                              <IoArchive className="text-xl" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(message._id)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <IoTrash className="text-xl" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 0 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1); // Reset to first page when changing items per page
              }}
            />
          )}
        </>
      )}

      {/* Message Detail Modal */}
      <AnimatePresence>
        {showModal && selectedMessage && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Contact Message</h2>
                  <p className="text-blue-100 text-sm">
                    {formatDate(selectedMessage.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200 p-2 hover:bg-blue-800 rounded-lg transition-colors"
                >
                  <IoClose className="text-2xl" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                  {/* Status Badge */}
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded border ${getStatusColor(
                        selectedMessage.status
                      )}`}
                    >
                      {selectedMessage.status}
                    </span>
                    {selectedMessage.status === "new" && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(selectedMessage._id, "read")
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Mark as Read
                      </button>
                    )}
                    {selectedMessage.status !== "replied" && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(selectedMessage._id, "replied")
                        }
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Mark as Replied
                      </button>
                    )}
                  </div>

                  {/* Message Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {selectedMessage.name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <a
                          href={`mailto:${selectedMessage.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {selectedMessage.email}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {selectedMessage.subject}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap min-h-[150px]">
                      {selectedMessage.message}
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add internal notes about this message..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    />
                    <button
                      onClick={handleSaveNotes}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 p-6 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {selectedMessage.readAt &&
                    `Read: ${formatDate(selectedMessage.readAt)}`}
                  {selectedMessage.repliedAt &&
                    ` • Replied: ${formatDate(selectedMessage.repliedAt)}`}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(selectedMessage._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContactMessagesManagement;

