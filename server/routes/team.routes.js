import express from "express";
import crypto from "crypto";
import Team from "../models/Team.js";
import User from "../models/User.js";
import TeamMessage from "../models/TeamMessage.js";
import TeamAnnouncement from "../models/TeamAnnouncement.js";
import TeamJoinRequest from "../models/TeamJoinRequest.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { sendEmail } from "../services/email.service.js";
import { sendSms, isSmsConfigured } from "../services/sms.service.js";
import { normalizePhoneNumber } from "../utils/phoneUtils.js";
import {
  createNotification,
  createBulkNotifications,
} from "../services/notification.service.js";

const router = express.Router();

// Helper to build frontend URL for links
const getFrontendBaseUrl = () => {
  return (
    process.env.SMS_FRONTEND_URL ||
    "https://www.leskickit.com" ||
    "http://localhost:5173"
  );
};

const defaultPhoneRegion = process.env.DEFAULT_PHONE_REGION || "US";

// @route   GET /api/teams/my-team
// @desc    Get current user's team (for team leader)
// @access  Private/Team Leader
router.get("/my-team", authenticate, async (req, res) => {
  try {
    // First, try to find team by user's team reference
    const user = await User.findById(req.user._id).populate("team");

    let team;
    if (user.team) {
      // User has a team reference, fetch it
      team = await Team.findById(user.team._id || user.team)
        .populate(
          "leader",
          "username email phone firstName lastName role isActive",
        )
        .populate(
          "members",
          "username email phone firstName lastName role isActive",
        );
    } else {
      // Fallback: Find team where user is the leader
      team = await Team.findOne({ leader: req.user._id })
        .populate(
          "leader",
          "username email phone firstName lastName role isActive",
        )
        .populate(
          "members",
          "username email phone firstName lastName role isActive",
        );
    }

    if (!team) {
      return res.status(404).json({
        message:
          "Team not found. You are not a team leader or team doesn't exist.",
      });
    }

    // Verify user is the leader or a member
    const isLeader = team.leader._id.toString() === req.user._id.toString();
    const isMember = team.members.some(
      (member) => member._id.toString() === req.user._id.toString(),
    );

    if (!isLeader && !isMember) {
      return res.status(403).json({
        message: "Access denied. You are not part of this team.",
      });
    }

    // Ensure members is always an array and filter out nulls
    const members = Array.isArray(team.members)
      ? team.members.filter((m) => m !== null && m !== undefined)
      : [];

    console.log("Team found:", {
      id: team._id,
      name: team.name,
      leaderId: team.leader?._id || team.leader,
      membersCount: members.length,
      members: members.map((m) => ({
        id: m._id || m,
        username: m.username || "N/A",
        email: m.email || "N/A",
      })),
    });

    res.json({
      team: {
        id: team._id,
        _id: team._id,
        name: team.name,
        leader: team.leader,
        members: members,
        isActive: team.isActive,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({
      message: "Server error fetching team",
      error: error.message,
    });
  }
});

// @route   POST /api/teams/:id/announcements
// @desc    Create a team announcement (Team Leader only)
// @access  Private/Team Leader
router.post("/:id/announcements", authenticate, async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !title.trim() || !message || !message.trim()) {
      return res
        .status(400)
        .json({ message: "Title and message are required" });
    }

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Verify user is the team leader
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Access denied. Only team leader can create announcements.",
      });
    }

    const announcement = await TeamAnnouncement.create({
      team: team._id,
      title: title.trim(),
      message: message.trim(),
      createdBy: req.user._id,
    });

    // Notify all team members (including leader) about new announcement, except creator
    const senderId = req.user._id.toString();
    const recipientIds = [
      team.leader.toString(),
      ...team.members.map((m) => m.toString()),
    ].filter((id, index, arr) => id !== senderId && arr.indexOf(id) === index);

    if (recipientIds.length > 0) {
      await createBulkNotifications(
        recipientIds,
        "team_announcement",
        "New team announcement",
        title.trim(),
        {
          entityType: "Team",
          entityId: team._id,
        },
        {
          priority: "medium",
        },
      );
    }

    res.status(201).json({
      message: "Announcement created successfully",
      announcement: {
        _id: announcement._id,
        title: announcement.title,
        message: announcement.message,
        createdAt: announcement.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating team announcement:", error);
    res.status(500).json({
      message: "Server error creating announcement",
      error: error.message,
    });
  }
});

// @route   POST /api/teams/:id/members
// @desc    Add member to team (Team Leader only)
// @access  Private/Team Leader
router.post("/:id/members", authenticate, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Verify user is the team leader
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Access denied. Only team leader can add members.",
      });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is already a member
    if (team.members.includes(userId)) {
      return res.status(400).json({ message: "User is already a team member" });
    }

    // Add user to team
    team.members.push(userId);
    await team.save();

    // Update user's team reference
    user.team = team._id;
    await user.save();

    const populatedTeam = await Team.findById(team._id)
      .populate("leader", "username email phone firstName lastName isActive")
      .populate(
        "members",
        "username email phone firstName lastName role isActive",
      );

    res.json({
      message: "Member added successfully",
      team: populatedTeam,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error adding member",
      error: error.message,
    });
  }
});

// @route   POST /api/teams/:id/invite-member
// @desc    Invite a new member by phone (SMS via Twilio); optional email also gets the link
// @access  Private/Team Leader
router.post("/:id/invite-member", authenticate, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Verify user is the team leader
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Access denied. Only team leader can invite members.",
      });
    }

    const { email, phone, username, firstName, lastName } = req.body;

    if (!phone || !username) {
      return res.status(400).json({
        message: "Phone number and username are required",
      });
    }

    const normalizedPhone = normalizePhoneNumber(phone, defaultPhoneRegion);
    if (!normalizedPhone) {
      return res.status(400).json({
        message:
          "Invalid phone number. Use a valid number with country code (e.g. +1…).",
      });
    }

    const emailLower =
      email && String(email).trim() ? String(email).trim().toLowerCase() : null;

    const trimmedUsername = String(username).trim();
    const orConditions = [
      { username: trimmedUsername },
      { phone: normalizedPhone },
    ];
    if (emailLower) {
      orConditions.push({ email: emailLower });
    }

    const existingUser = await User.findOne({ $or: orConditions });

    if (existingUser) {
      return res.status(400).json({
        message: "A user with this phone, email, or username already exists",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const inviteExpiryHours = 48;
    const resetExpires = new Date(
      Date.now() + inviteExpiryHours * 60 * 60 * 1000,
    );

    const userPayload = {
      username: trimmedUsername,
      phone: normalizedPhone,
      firstName,
      lastName,
      role: "player",
      isActive: false,
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires,
      team: team._id,
    };
    if (emailLower) {
      userPayload.email = emailLower;
    }

    const user = new User(userPayload);

    await user.save();

    team.members.push(user._id);
    await team.save();

    const frontendBaseUrl = getFrontendBaseUrl();
    const setPasswordUrlBase = `${frontendBaseUrl}/set-password?token=${resetToken}`;
    const setPasswordUrl = emailLower
      ? `${setPasswordUrlBase}&email=${encodeURIComponent(emailLower)}`
      : setPasswordUrlBase;

    const smsBody = `You're invited to join "${team.name}" on The Arena. Set your password: ${setPasswordUrlBase}`;

    let smsSent = false;
    let smsSkipped = false;
    let smsError = null;
    try {
      const smsOutcome = await sendSms(normalizedPhone, smsBody);
      smsSkipped = Boolean(smsOutcome.skipped);
      smsSent = !smsSkipped && Boolean(smsOutcome.sid);
    } catch (err) {
      console.error("Error sending team member invitation SMS:", err);
      smsError = err.message || "SMS send failed";
    }

    if (emailLower) {
      try {
        await sendEmail(emailLower, "teamMemberInvitation", {
          userName: firstName || username,
          teamName: team.name,
          setPasswordUrl,
          expiresInHours: inviteExpiryHours,
        });
      } catch (emailError) {
        console.error(
          "Error sending team member invitation email:",
          emailError,
        );
      }
    }

    const populatedTeam = await Team.findById(team._id)
      .populate("leader", "username email phone firstName lastName isActive")
      .populate(
        "members",
        "username email phone firstName lastName role isActive",
      );

    res.json({
      message: "Member invited successfully",
      team: populatedTeam,
      smsSent,
      smsSkipped: smsSkipped || Boolean(smsError),
      ...(smsError && { smsError }),
      ...(!isSmsConfigured() && {
        smsWarning:
          "Twilio is not configured; no SMS was sent. Set TWILIO_* environment variables.",
      }),
    });
  } catch (error) {
    console.error("Server error inviting member:", error);
    res.status(500).json({
      message: "Server error inviting member",
      error: error.message,
    });
  }
});

// @route   DELETE /api/teams/:id/members/:memberId
// @desc    Remove member from team (Team Leader only)
// @access  Private/Team Leader
router.delete("/:id/members/:memberId", authenticate, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Verify user is the team leader
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Access denied. Only team leader can remove members.",
      });
    }

    const { memberId } = req.params;

    // Cannot remove the leader
    if (memberId === team.leader.toString()) {
      return res.status(400).json({
        message: "Cannot remove team leader from the team",
      });
    }

    // Remove member from team
    team.members = team.members.filter(
      (member) => member.toString() !== memberId,
    );
    await team.save();

    // Remove team reference from user
    const user = await User.findById(memberId);
    if (user) {
      user.team = undefined;
      await user.save();
    }

    const populatedTeam = await Team.findById(team._id)
      .populate("leader", "username email phone firstName lastName isActive")
      .populate(
        "members",
        "username email phone firstName lastName role isActive",
      );

    res.json({
      message: "Member removed successfully",
      team: populatedTeam,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error removing member",
      error: error.message,
    });
  }
});

// @route   POST /api/teams/:id/message
// @desc    Send a team message (persists message and creates notifications for all team members except sender)
// @access  Private (team members and leader)
router.post("/:id/message", authenticate, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const team = await Team.findById(req.params.id).populate("members leader");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const senderId = req.user._id.toString();

    // Verify user is the leader or a member
    const isLeader = team.leader._id.toString() === senderId;
    const isMember = team.members.some(
      (member) => member._id.toString() === senderId,
    );

    if (!isLeader && !isMember) {
      return res.status(403).json({
        message: "Access denied. Only team members can send messages.",
      });
    }

    const sender =
      team.members.find((m) => m._id.toString() === senderId) || team.leader;

    const senderName =
      sender.firstName && sender.lastName
        ? `${sender.firstName} ${sender.lastName}`
        : sender.username || "Team Member";

    // Recipients: all members and leader except sender
    const recipientIds = [
      team.leader._id.toString(),
      ...team.members.map((m) => m._id.toString()),
    ].filter((id, index, arr) => id !== senderId && arr.indexOf(id) === index);

    if (recipientIds.length === 0) {
      return res.json({
        message:
          "No recipients for this message (you are the only team member).",
      });
    }

    // Persist the chat message
    const savedMessage = await TeamMessage.create({
      team: team._id,
      sender: sender._id,
      text: message.trim(),
    });

    await createBulkNotifications(
      recipientIds,
      "team_message",
      "New team message",
      `${senderName}: ${message}`,
      {
        entityType: "Team",
        entityId: team._id,
      },
      {
        priority: "low",
      },
    );

    res.json({
      message: "Team message sent successfully",
      data: {
        _id: savedMessage._id,
        team: savedMessage.team,
        sender: {
          _id: sender._id,
          username: sender.username,
          firstName: sender.firstName,
          lastName: sender.lastName,
        },
        text: savedMessage.text,
        createdAt: savedMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("Error sending team message:", error);
    res.status(500).json({
      message: "Server error sending team message",
      error: error.message,
    });
  }
});

// @route   GET /api/teams/:id/messages
// @desc    Get recent team messages
// @access  Private (team members and leader)
router.get("/:id/messages", authenticate, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const userId = req.user._id.toString();
    const isLeader = team.leader.toString() === userId;
    const isMember = team.members.some(
      (member) => member.toString() === userId,
    );

    if (!isLeader && !isMember) {
      return res.status(403).json({
        message: "Access denied. Only team members can view messages.",
      });
    }

    const messages = await TeamMessage.find({ team: team._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("sender", "username firstName lastName");

    res.json({
      messages: messages
        .slice()
        .reverse()
        .map((m) => ({
          _id: m._id,
          text: m.text,
          createdAt: m.createdAt,
          sender: {
            _id: m.sender?._id,
            username: m.sender?.username,
            firstName: m.sender?.firstName,
            lastName: m.sender?.lastName,
          },
        })),
    });
  } catch (error) {
    console.error("Error fetching team messages:", error);
    res.status(500).json({
      message: "Server error fetching messages",
      error: error.message,
    });
  }
});

// @route   GET /api/teams/:id/announcements
// @desc    Get team announcements
// @access  Private (team members and leader)
router.get("/:id/announcements", authenticate, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const userId = req.user._id.toString();
    const isLeader = team.leader.toString() === userId;
    const isMember = team.members.some(
      (member) => member.toString() === userId,
    );

    if (!isLeader && !isMember) {
      return res.status(403).json({
        message: "Access denied. Only team members can view announcements.",
      });
    }

    const announcements = await TeamAnnouncement.find({ team: team._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("createdBy", "username firstName lastName");

    res.json({
      announcements: announcements.map((a) => ({
        _id: a._id,
        title: a.title,
        message: a.message,
        createdAt: a.createdAt,
        createdBy: a.createdBy
          ? {
              _id: a.createdBy._id,
              username: a.createdBy.username,
              firstName: a.createdBy.firstName,
              lastName: a.createdBy.lastName,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching team announcements:", error);
    res.status(500).json({
      message: "Server error fetching announcements",
      error: error.message,
    });
  }
});

// @route   GET /api/teams
// @desc    Get all teams (for players to browse and join)
// @access  Private
router.get("/", authenticate, async (req, res) => {
  try {
    const teams = await Team.find({ isActive: true })
      .populate("leader", "username email phone firstName lastName")
      .populate("members", "username email phone firstName lastName")
      .select("name leader members isActive createdAt")
      .sort({ createdAt: -1 });

    // Get current user's existing join requests
    const userId = req.user._id;
    const userRequests = await TeamJoinRequest.find({
      player: userId,
      status: "pending",
    }).select("team status");

    const requestMap = {};
    userRequests.forEach((req) => {
      requestMap[req.team.toString()] = req.status;
    });

    // Format response
    const formattedTeams = teams.map((team) => {
      const isLeader = team.leader._id.toString() === userId.toString();
      const isMember = team.members.some(
        (m) => m._id.toString() === userId.toString(),
      );
      const hasPendingRequest = requestMap[team._id.toString()] === "pending";

      return {
        _id: team._id,
        id: team._id,
        name: team.name,
        leader: {
          _id: team.leader._id,
          username: team.leader.username,
          firstName: team.leader.firstName,
          lastName: team.leader.lastName,
          email: team.leader.email,
        },
        memberCount: team.members.length,
        members: team.members.map((m) => ({
          _id: m._id,
          username: m.username,
          firstName: m.firstName,
          lastName: m.lastName,
        })),
        isActive: team.isActive,
        createdAt: team.createdAt,
        canJoin: !isLeader && !isMember && !hasPendingRequest,
        hasPendingRequest,
        isMember,
        isLeader,
      };
    });

    res.json({
      teams: formattedTeams,
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({
      message: "Server error fetching teams",
      error: error.message,
    });
  }
});

// @route   POST /api/teams/:id/join-request
// @desc    Request to join a team (Player only)
// @access  Private/Player
router.post("/:id/join-request", authenticate, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate("leader");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (!team.isActive) {
      return res.status(400).json({ message: "Team is not active" });
    }

    const userId = req.user._id.toString();

    // Check if user is already the leader
    if (team.leader._id.toString() === userId) {
      return res.status(400).json({
        message: "You are already the leader of this team",
      });
    }

    // Check if user is already a member
    if (team.members.some((m) => m.toString() === userId)) {
      return res.status(400).json({
        message: "You are already a member of this team",
      });
    }

    // Check for existing pending request
    const existingRequest = await TeamJoinRequest.findOne({
      team: team._id,
      player: userId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "You already have a pending request for this team",
      });
    }

    const { message } = req.body;

    // Create join request
    const joinRequest = await TeamJoinRequest.create({
      team: team._id,
      player: userId,
      message: message?.trim() || "",
      status: "pending",
    });

    // Notify team leader
    const player = await User.findById(userId);
    const playerName =
      player.firstName && player.lastName
        ? `${player.firstName} ${player.lastName}`
        : player.username;

    await createNotification(
      team.leader._id,
      "team_join_request",
      "New Team Join Request",
      `${playerName} wants to join your team "${team.name}"`,
      {
        entityType: "Team",
        entityId: team._id,
      },
      {
        priority: "high",
        sendEmail: true,
        emailData: {
          playerName,
          teamName: team.name,
          message: message || "No message provided",
        },
      },
    );

    res.status(201).json({
      message: "Join request sent successfully",
      request: {
        _id: joinRequest._id,
        team: joinRequest.team,
        player: joinRequest.player,
        status: joinRequest.status,
        message: joinRequest.message,
        createdAt: joinRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating join request:", error);
    res.status(500).json({
      message: "Server error creating join request",
      error: error.message,
    });
  }
});

// @route   GET /api/teams/join-requests
// @desc    Get pending join requests for teams where user is leader
// @access  Private/Team Leader
router.get("/join-requests", authenticate, async (req, res) => {
  try {
    // Find all teams where user is the leader
    const teams = await Team.find({ leader: req.user._id });

    if (teams.length === 0) {
      return res.json({ requests: [] });
    }

    const teamIds = teams.map((t) => t._id);

    // Get all pending requests for these teams
    const requests = await TeamJoinRequest.find({
      team: { $in: teamIds },
      status: "pending",
    })
      .populate("team", "name")
      .populate("player", "username email phone firstName lastName")
      .sort({ createdAt: -1 });

    res.json({
      requests: requests.map((req) => ({
        _id: req._id,
        id: req._id,
        team: {
          _id: req.team._id,
          name: req.team.name,
        },
        player: {
          _id: req.player._id,
          username: req.player.username,
          email: req.player.email,
          firstName: req.player.firstName,
          lastName: req.player.lastName,
        },
        message: req.message,
        status: req.status,
        createdAt: req.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching join requests:", error);
    res.status(500).json({
      message: "Server error fetching join requests",
      error: error.message,
    });
  }
});

// @route   POST /api/teams/join-requests/:id/accept
// @desc    Accept a join request (Team Leader only)
// @access  Private/Team Leader
router.post("/join-requests/:id/accept", authenticate, async (req, res) => {
  try {
    const joinRequest = await TeamJoinRequest.findById(req.params.id)
      .populate("team")
      .populate("player");

    if (!joinRequest) {
      return res.status(404).json({ message: "Join request not found" });
    }

    const team = await Team.findById(joinRequest.team._id);

    // Verify user is the team leader
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Access denied. Only team leader can accept requests.",
      });
    }

    if (joinRequest.status !== "pending") {
      return res.status(400).json({
        message: "This request has already been processed",
      });
    }

    const playerId = joinRequest.player._id;

    // Check if player is already a member
    if (team.members.includes(playerId)) {
      // Mark request as accepted anyway
      joinRequest.status = "accepted";
      joinRequest.respondedAt = new Date();
      joinRequest.respondedBy = req.user._id;
      await joinRequest.save();

      return res.status(400).json({
        message: "Player is already a member of the team",
      });
    }

    // Add player to team
    team.members.push(playerId);
    await team.save();

    // Update user's team reference
    const player = await User.findById(playerId);
    if (player) {
      player.team = team._id;
      await player.save();
    }

    // Update request status
    joinRequest.status = "accepted";
    joinRequest.respondedAt = new Date();
    joinRequest.respondedBy = req.user._id;
    await joinRequest.save();

    // Notify player
    const leader = await User.findById(req.user._id);
    const leaderName =
      leader.firstName && leader.lastName
        ? `${leader.firstName} ${leader.lastName}`
        : leader.username;

    await createNotification(
      playerId,
      "team_invitation",
      "Team Join Request Accepted",
      `Your request to join "${team.name}" has been accepted by ${leaderName}`,
      {
        entityType: "Team",
        entityId: team._id,
      },
      {
        priority: "high",
        sendEmail: true,
        emailData: {
          teamName: team.name,
          leaderName,
        },
      },
    );

    const populatedTeam = await Team.findById(team._id)
      .populate("leader", "username email phone firstName lastName isActive")
      .populate(
        "members",
        "username email phone firstName lastName role isActive",
      );

    res.json({
      message: "Join request accepted successfully",
      team: populatedTeam,
    });
  } catch (error) {
    console.error("Error accepting join request:", error);
    res.status(500).json({
      message: "Server error accepting join request",
      error: error.message,
    });
  }
});

// @route   POST /api/teams/join-requests/:id/reject
// @desc    Reject a join request (Team Leader only)
// @access  Private/Team Leader
router.post("/join-requests/:id/reject", authenticate, async (req, res) => {
  try {
    const joinRequest = await TeamJoinRequest.findById(req.params.id)
      .populate("team")
      .populate("player");

    if (!joinRequest) {
      return res.status(404).json({ message: "Join request not found" });
    }

    const team = await Team.findById(joinRequest.team._id);

    // Verify user is the team leader
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Access denied. Only team leader can reject requests.",
      });
    }

    if (joinRequest.status !== "pending") {
      return res.status(400).json({
        message: "This request has already been processed",
      });
    }

    // Update request status
    joinRequest.status = "rejected";
    joinRequest.respondedAt = new Date();
    joinRequest.respondedBy = req.user._id;
    await joinRequest.save();

    // Notify player
    const leader = await User.findById(req.user._id);
    const leaderName =
      leader.firstName && leader.lastName
        ? `${leader.firstName} ${leader.lastName}`
        : leader.username;

    await createNotification(
      joinRequest.player._id,
      "team_invitation",
      "Team Join Request Rejected",
      `Your request to join "${team.name}" has been rejected by ${leaderName}`,
      {
        entityType: "Team",
        entityId: team._id,
      },
      {
        priority: "medium",
        sendEmail: true,
        emailData: {
          teamName: team.name,
          leaderName,
        },
      },
    );

    res.json({
      message: "Join request rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting join request:", error);
    res.status(500).json({
      message: "Server error rejecting join request",
      error: error.message,
    });
  }
});

export default router;
