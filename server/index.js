import "./config/env.js";
import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import connectDB from "./config/database.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import tournamentRoutes from "./routes/tournament.routes.js";
import matchRoutes from "./routes/match.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import teamRoutes from "./routes/team.routes.js";
import testEmailRoutes from "./routes/test-email.routes.js";
import mediaRoutes from "./routes/media.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import shopRoutes from "./routes/shop.routes.js";
import nonprofitRoutes from "./routes/nonprofit.routes.js";
import testimonialRoutes from "./routes/testimonial.routes.js";
import communityImpactRoutes from "./routes/community-impact.routes.js";
import announcementRoutes from "./routes/announcement.routes.js";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";
import User from "./models/User.js";
import Team from "./models/Team.js";
import TeamMessage from "./models/TeamMessage.js";
import tiktokRoutes from "./routes/tiktok.routes.js";
import { uploadsDir } from "./utils/uploadPaths.js";

const app = express();
const PORT = process.env.PORT || 5000;

const ensureUserEmailIndexHealth = async () => {
  try {
    const indexes = await User.collection.indexes();
    const emailIndex = indexes.find((idx) => idx.key && idx.key.email === 1);
    if (!emailIndex) return;

    const isSafe = emailIndex.sparse || emailIndex.partialFilterExpression;
    if (isSafe) return;

    const indexName = emailIndex.name || "email_1";
    console.warn(
      `⚠️ Repairing legacy non-sparse email index (${indexName}) on users collection`,
    );

    await User.collection.dropIndex(indexName);
    await User.collection.createIndex(
      { email: 1 },
      {
        unique: true,
        sparse: true,
        name: "email_1",
        background: true,
      },
    );

    console.log("✅ Rebuilt users.email index as unique+sparse");
  } catch (error) {
    console.error("⚠️ Could not verify/repair users.email index:", error.message);
  }
};

// Create HTTP server and Socket.IO server
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
// Static file serving for uploaded media (same folder multer writes to)
app.use(
  "/uploads",
  express.static(uploadsDir, {
    setHeaders(res, filePath) {
      const ext = path.extname(filePath).toLowerCase();
      const videoTypes = {
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mov": "video/quicktime",
        ".m4v": "video/x-m4v",
        ".ogg": "video/ogg",
      };
      const mime = videoTypes[ext];
      if (mime) {
        res.setHeader("Content-Type", mime);
        res.setHeader("Content-Disposition", "inline");
      }
    },
  }),
);

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.method === "POST" ? req.body : undefined,
  });
  next();
});

// Connect to MongoDB
connectDB();
mongoose.connection.once("open", async () => {
  await ensureUserEmailIndexHealth();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/test-email", testEmailRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/nonprofit", nonprofitRoutes);
app.use("/api/community-impact", communityImpactRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/tiktok", tiktokRoutes);
app.use("/api/announcements", announcementRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Socket.IO auth middleware (simple JWT-based)
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(error);
  }
});

io.on("connection", (socket) => {
  console.log("🔌 New websocket connection:", socket.user?.username);

  // Join team room
  socket.on("team:join", async () => {
    try {
      const user = socket.user;
      if (!user) return;

      // Ensure we have the latest user with team populated
      const freshUser = await User.findById(user._id).populate("team");
      const teamId = freshUser.team?._id || freshUser.team;
      if (!teamId) return;

      const room = `team:${teamId.toString()}`;
      socket.join(room);
      console.log(`User ${freshUser.username} joined room ${room}`);
    } catch (error) {
      console.error("Error handling team:join:", error);
    }
  });

  // Broadcast new messages to team room
  socket.on("team:message", async ({ teamId, text }) => {
    try {
      if (!text || !text.trim() || !teamId) return;

      const user = socket.user;
      if (!user) return;

      const team = await Team.findById(teamId);
      if (!team) return;

      const senderId = user._id.toString();
      const isLeader = team.leader.toString() === senderId;
      const isMember = team.members.some(
        (member) => member.toString() === senderId,
      );

      if (!isLeader && !isMember) {
        return;
      }

      // Persist message
      const saved = await TeamMessage.create({
        team: team._id,
        sender: user._id,
        text: text.trim(),
      });

      const payload = {
        _id: saved._id,
        text: saved.text,
        createdAt: saved.createdAt,
        sender: {
          _id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };

      const room = `team:${team._id.toString()}`;
      io.to(room).emit("team:message", payload);
    } catch (error) {
      console.error("Error handling team:message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 Websocket disconnected:", socket.user?.username);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
