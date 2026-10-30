import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { IoSend, IoChatbubbles, IoNotifications } from "react-icons/io5";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../NotificationProvider";
import { teamAPI } from "../../services/api";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:5000";

const TeamCommunication = ({
  teamId,
  initialMessages = [],
  onSendMessage,
  announcements = [],
  canPostAnnouncements = false,
  onAnnouncementCreated,
}) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("messages");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const hasMessageId = (list, id) =>
    Boolean(id) && list.some((message) => message.id && message.id === id);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!teamId || !localStorage.getItem("token")) return;

    const socket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem("token") },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    socket.on("connect", () => {
      socket.emit("team:join");
    });

    socket.on("team:message", (payload) => {
      setMessages((prev) => {
        const nextMessage = {
          id: payload._id,
          text: payload.text,
          timestamp: payload.createdAt,
          sender:
            payload.sender?._id === user?.id ? "me" : payload.sender?.username,
          senderName:
            payload.sender?.firstName && payload.sender?.lastName
              ? `${payload.sender.firstName} ${payload.sender.lastName}`
              : payload.sender?.username || "Teammate",
        };

        if (hasMessageId(prev, nextMessage.id)) {
          return prev;
        }

        return [...prev, nextMessage];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [teamId, user?.id]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text) return;

    if (!teamId) {
      showError?.("Team not found for messaging");
      return;
    }

    try {
      await onSendMessage?.(text);
      setNewMessage("");

      // Refresh from source-of-truth after each send to avoid stale/duplicate UI state.
      const response = await teamAPI.getTeamMessages(teamId);
      const refreshedMessages = (response.messages || []).map((m) => {
        const senderId = m.sender?._id?.toString?.() ?? m.sender?._id;
        const currentUserId = user?.id?.toString?.() ?? user?.id;
        return {
          id: m._id,
          text: m.text,
          timestamp: m.createdAt,
          sender:
            senderId && currentUserId && senderId === currentUserId
              ? "me"
              : m.sender?.username || "Teammate",
          senderName:
            m.sender?.firstName && m.sender?.lastName
              ? `${m.sender.firstName} ${m.sender.lastName}`
              : m.sender?.username || "Teammate",
        };
      });
      setMessages(refreshedMessages);
    } catch (error) {
      showError?.(error.message || "Failed to send message");
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    const title = announcementTitle.trim();
    const message = announcementMessage.trim();

    if (!title || !message) {
      showError?.("Title and message are required");
      return;
    }

    if (!teamId) {
      showError?.("Team not found for announcements");
      return;
    }

    try {
      setIsPostingAnnouncement(true);
      const result = await teamAPI.createTeamAnnouncement(teamId, {
        title,
        message,
      });

      if (result.announcement) {
        onAnnouncementCreated?.(result.announcement);
        setAnnouncementTitle("");
        setAnnouncementMessage("");
        showSuccess?.("Announcement posted");
      }
    } catch (error) {
      showError?.(error.message || "Failed to post announcement");
    } finally {
      setIsPostingAnnouncement(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-primary-200">
        <button
          onClick={() => setActiveTab("messages")}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === "messages"
              ? "text-tertiary-600 border-b-2 border-tertiary-600 -mb-0.5"
              : "text-primary-600 hover:text-primary-950"
          }`}
        >
          <IoChatbubbles className="inline mr-2" />
          Messages
        </button>
        <button
          onClick={() => setActiveTab("announcements")}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === "announcements"
              ? "text-tertiary-600 border-b-2 border-tertiary-600 -mb-0.5"
              : "text-primary-600 hover:text-primary-950"
          }`}
        >
          <IoNotifications className="inline mr-2" />
          Announcements
        </button>
      </div>

      {/* Messages Tab */}
      {activeTab === "messages" && (
        <div className="space-y-4">
          {/* Messages List */}
          <div className="bg-white border-2 border-primary-200 rounded-xl p-4 h-64 overflow-y-auto space-y-3">
            {messages.length > 0 ? (
              <>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id || index}
                    className={`p-3 rounded-lg ${
                      message.sender === "me"
                        ? "bg-tertiary-100 ml-auto max-w-[80%]"
                        : "bg-white mr-auto max-w-[80%]"
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-primary-950 text-sm">
                        {message.senderName || message.sender}
                      </span>
                      <span className="text-xs text-primary-600">
                        {message.timestamp
                          ? new Date(message.timestamp).toLocaleTimeString()
                          : ""}
                      </span>
                    </div>
                    <p className="text-primary-700">{message.text}</p>
                  </motion.div>
                ))}
                <div ref={bottomRef} />
              </>
            ) : (
              <div className="text-center text-primary-600 py-8">
                No messages yet. Start the conversation!
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
            />
            <button
              onClick={handleSend}
              className="px-6 py-2 bg-secondary-500 text-white font-semibold rounded-lg hover:bg-secondary-600 transition-colors flex items-center gap-2"
            >
              <IoSend />
              Send
            </button>
          </div>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === "announcements" && (
        <div className="space-y-6">
          <div className="space-y-4">
            {announcements.length > 0 ? (
              announcements.map((announcement, index) => (
                <motion.div
                  key={announcement._id || announcement.id || index}
                  className="bg-white border-2 border-yellow-200 rounded-xl p-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <h4 className="font-semibold text-secondary-600 mb-1">
                    {announcement.title}
                  </h4>
                  <p className="text-primary-700 text-sm mb-2">
                    {announcement.message}
                  </p>
                  <p className="text-xs text-primary-600">
                    {announcement.createdAt
                      ? new Date(announcement.createdAt).toLocaleString()
                      : ""}
                  </p>
                </motion.div>
              ))
            ) : (
              <div className="text-center text-primary-600 py-8">
                No announcements yet.
              </div>
            )}
          </div>

          {canPostAnnouncements && (
            <form
              onSubmit={handlePostAnnouncement}
              className="border-t border-primary-200 pt-4 mt-2 space-y-3"
            >
              <h3 className="text-sm font-semibold text-primary-900">
                Post Announcement
              </h3>
              <input
                type="text"
                placeholder="Announcement title"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none text-sm"
              />
              <textarea
                rows={3}
                placeholder="Announcement message"
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none text-sm resize-none"
              />
              <button
                type="submit"
                disabled={isPostingAnnouncement}
                className="px-4 py-2 bg-secondary-500 text-white text-sm font-semibold rounded-lg hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPostingAnnouncement ? "Posting..." : "Post Announcement"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamCommunication;
