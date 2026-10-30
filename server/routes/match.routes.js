import express from "express";
import mongoose from "mongoose";
import Match from "../models/Match.js";
import Tournament from "../models/Tournament.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { createBulkNotifications } from "../services/notification.service.js";

const router = express.Router();

// @route   GET /api/matches
// @desc    Get all matches (with filters)
// @access  Public
router.get("/", async (req, res) => {
  try {
    const {
      tournament,
      status,
      upcoming,
      isPromoted,
      date,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (tournament) {
      query.tournament = tournament;
    }

    if (status) {
      query.status = status;
    }

    if (upcoming === "true") {
      query.scheduledDate = { $gte: new Date() };
      query.status = "scheduled";
    }

    if (isPromoted === "true") {
      query.isPromoted = true;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const matches = await Match.find(query)
      .populate("tournament", "name startDate endDate")
      .populate("team1.team", "name")
      .populate("team1.player", "username firstName lastName")
      .populate("team2.team", "name")
      .populate("team2.player", "username firstName lastName")
      .populate("referee", "username firstName lastName")
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Match.countDocuments(query);

    res.json({
      matches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching matches",
      error: error.message,
    });
  }
});

// @route   GET /api/matches/:id
// @desc    Get single match by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate("tournament", "name startDate endDate format")
      .populate("team1.team", "name leader members")
      .populate("team1.player", "username firstName lastName email")
      .populate("team2.team", "name leader members")
      .populate("team2.player", "username firstName lastName email")
      .populate("referee", "username firstName lastName email");

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    res.json({ match });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching match",
      error: error.message,
    });
  }
});

// @route   POST /api/matches
// @desc    Create new match
// @access  Private/Admin
router.post("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const {
      tournament,
      matchNumber,
      round,
      scheduledDate,
      scheduledTime,
      location,
      venue,
      team1,
      team2,
      referee,
      notes,
      image,
    } = req.body;

    // Validation
    if (
      !scheduledDate ||
      (!team1 && !team1?.team && !team1?.player) ||
      (!team2 && !team2?.team && !team2?.player)
    ) {
      return res.status(400).json({
        message: "Please provide scheduled date and both teams/players",
      });
    }

    // Verify tournament exists if provided
    if (tournament) {
      const tournamentExists = await Tournament.findById(tournament);
      if (!tournamentExists) {
        return res.status(404).json({ message: "Tournament not found" });
      }
    }

    const match = new Match({
      tournament,
      matchNumber,
      round,
      scheduledDate,
      scheduledTime,
      location,
      venue,
      team1: {
        team: team1?.team,
        player: team1?.player,
        score: 0,
      },
      team2: {
        team: team2?.team,
        player: team2?.player,
        score: 0,
      },
      // Only set referee if a valid value is provided to avoid ObjectId cast
      referee: referee || undefined,
      image,
      notes,
      status: "scheduled",
    });

    await match.save();

    const populatedMatch = await Match.findById(match._id)
      .populate("tournament", "name")
      .populate("team1.team", "name leader members")
      .populate("team1.player", "username firstName")
      .populate("team2.team", "name leader members")
      .populate("team2.player", "username firstName");

    // Send notifications to participants
    try {
      const userIds = [];
      const matchTitle = `${
        populatedMatch.team1?.team?.name ||
        populatedMatch.team1?.player?.username ||
        "Team 1"
      } vs ${
        populatedMatch.team2?.team?.name ||
        populatedMatch.team2?.player?.username ||
        "Team 2"
      }`;

      // Get team members or individual players
      if (populatedMatch.team1?.team?.members) {
        userIds.push(
          ...populatedMatch.team1.team.members.map((m) => m._id || m)
        );
      } else if (populatedMatch.team1?.player?._id) {
        userIds.push(populatedMatch.team1.player._id);
      }

      if (populatedMatch.team2?.team?.members) {
        userIds.push(
          ...populatedMatch.team2.team.members.map((m) => m._id || m)
        );
      } else if (populatedMatch.team2?.player?._id) {
        userIds.push(populatedMatch.team2.player._id);
      }

      if (userIds.length > 0) {
        await createBulkNotifications(
          userIds,
          "match_scheduled",
          "New Match Scheduled",
          `Match scheduled: ${matchTitle} on ${new Date(
            match.scheduledDate
          ).toLocaleDateString()} at ${match.scheduledTime || "TBD"}`,
          { entityType: "Match", entityId: match._id },
          {
            sendEmail: true,
            sendSMS: false,
            emailData: {
              matchTitle,
              scheduledDate: match.scheduledDate,
              scheduledTime: match.scheduledTime,
              location: match.location || match.venue,
              tournamentName: populatedMatch.tournament?.name,
            },
          }
        );
      }
    } catch (notifError) {
      console.error("Error sending match scheduled notifications:", notifError);
      // Don't fail the match creation if notification fails
    }

    res.status(201).json({
      message: "Match created successfully",
      match: populatedMatch,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({
      message: "Server error creating match",
      error: error.message,
    });
  }
});

// @route   PUT /api/matches/:id
// @desc    Update match
// @access  Private/Admin
router.put("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate("team1.team", "name leader members")
      .populate("team1.player", "username firstName")
      .populate("team2.team", "name leader members")
      .populate("team2.player", "username firstName");

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    // Store original values to detect changes
    const originalValues = {
      scheduledDate: match.scheduledDate,
      scheduledTime: match.scheduledTime,
      location: match.location,
      venue: match.venue,
      status: match.status,
    };

    const allowedUpdates = [
      "matchNumber",
      "round",
      "scheduledDate",
      "scheduledTime",
      "location",
      "venue",
      "team1",
      "team2",
      "status",
      "referee",
      "notes",
      "image",
    ];

    allowedUpdates.forEach((update) => {
      if (req.body[update] !== undefined) {
        if (update === "team1" || update === "team2") {
          match[update] = {
            ...match[update].toObject(),
            ...req.body[update],
          };
        } else {
          match[update] = req.body[update];
        }
      }
    });

    await match.save();

    const populatedMatch = await Match.findById(match._id)
      .populate("tournament", "name")
      .populate("team1.team", "name leader members")
      .populate("team1.player", "username firstName")
      .populate("team2.team", "name leader members")
      .populate("team2.player", "username firstName");

    // Detect what changed
    const changes = [];
    if (
      originalValues.scheduledDate &&
      new Date(originalValues.scheduledDate).getTime() !==
        new Date(match.scheduledDate).getTime()
    ) {
      changes.push(
        `Date changed from ${new Date(
          originalValues.scheduledDate
        ).toLocaleDateString()} to ${new Date(
          match.scheduledDate
        ).toLocaleDateString()}`
      );
    }
    if (originalValues.scheduledTime !== match.scheduledTime) {
      changes.push(
        `Time changed from ${originalValues.scheduledTime || "TBD"} to ${
          match.scheduledTime || "TBD"
        }`
      );
    }
    if (originalValues.location !== match.location) {
      changes.push(
        `Location changed from ${originalValues.location || "TBD"} to ${
          match.location || "TBD"
        }`
      );
    }
    if (originalValues.venue !== match.venue) {
      changes.push(
        `Venue changed from ${originalValues.venue || "TBD"} to ${
          match.venue || "TBD"
        }`
      );
    }
    if (originalValues.status !== match.status) {
      changes.push(
        `Status changed from ${originalValues.status} to ${match.status}`
      );
    }

    // Send notifications if there are changes
    if (changes.length > 0) {
      try {
        const userIds = [];
        const matchTitle = `${
          populatedMatch.team1?.team?.name ||
          populatedMatch.team1?.player?.username ||
          "Team 1"
        } vs ${
          populatedMatch.team2?.team?.name ||
          populatedMatch.team2?.player?.username ||
          "Team 2"
        }`;

        // Get team members or individual players
        if (populatedMatch.team1?.team?.members) {
          userIds.push(
            ...populatedMatch.team1.team.members.map((m) => m._id || m)
          );
        } else if (populatedMatch.team1?.player?._id) {
          userIds.push(populatedMatch.team1.player._id);
        }

        if (populatedMatch.team2?.team?.members) {
          userIds.push(
            ...populatedMatch.team2.team.members.map((m) => m._id || m)
          );
        } else if (populatedMatch.team2?.player?._id) {
          userIds.push(populatedMatch.team2.player._id);
        }

        if (userIds.length > 0) {
          const changesMessage = changes.join(", ");
          await createBulkNotifications(
            userIds,
            "match_updated",
            "Match Details Updated",
            `Match "${matchTitle}" has been updated: ${changesMessage}`,
            { entityType: "Match", entityId: match._id },
            {
              sendEmail: true,
              sendSMS: false,
              emailData: {
                matchTitle,
                changes: changesMessage,
                scheduledDate: match.scheduledDate,
                scheduledTime: match.scheduledTime,
                location: match.location || match.venue,
                tournamentName: populatedMatch.tournament?.name,
                status: match.status,
              },
            }
          );
        }
      } catch (notifError) {
        console.error("Error sending match update notifications:", notifError);
        // Don't fail the match update if notification fails
      }
    }

    res.json({
      message: "Match updated successfully",
      match: populatedMatch,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({
      message: "Server error updating match",
      error: error.message,
    });
  }
});

// @route   POST /api/matches/:id/result
// @desc    Update match result
// @access  Private/Admin
router.post(
  "/:id/result",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const match = await Match.findById(req.params.id);

      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      const { team1Score, team2Score } = req.body;

      if (team1Score === undefined || team2Score === undefined) {
        return res.status(400).json({
          message: "Please provide both scores",
        });
      }

      match.setResult(parseInt(team1Score), parseInt(team2Score));
      await match.save();

      const populatedMatch = await Match.findById(match._id)
        .populate("tournament", "name")
        .populate("team1.team", "name leader members")
        .populate("team1.player", "username firstName")
        .populate("team2.team", "name leader members")
        .populate("team2.player", "username firstName");

      // Send notifications to participants
      try {
        const userIds = [];
        const matchTitle = `${
          populatedMatch.team1?.team?.name ||
          populatedMatch.team1?.player?.username ||
          "Team 1"
        } vs ${
          populatedMatch.team2?.team?.name ||
          populatedMatch.team2?.player?.username ||
          "Team 2"
        }`;

        // Get team members or individual players
        if (populatedMatch.team1?.team?.members) {
          userIds.push(
            ...populatedMatch.team1.team.members.map((m) => m._id || m)
          );
        } else if (populatedMatch.team1?.player?._id) {
          userIds.push(populatedMatch.team1.player._id);
        }

        if (populatedMatch.team2?.team?.members) {
          userIds.push(
            ...populatedMatch.team2.team.members.map((m) => m._id || m)
          );
        } else if (populatedMatch.team2?.player?._id) {
          userIds.push(populatedMatch.team2.player._id);
        }

        if (userIds.length > 0) {
          await createBulkNotifications(
            userIds,
            "match_result",
            "Match Result Updated",
            `Match result: ${matchTitle} - ${team1Score} : ${team2Score}`,
            { entityType: "Match", entityId: match._id },
            {
              sendEmail: true,
              sendSMS: false,
              emailData: {
                matchTitle,
                team1Score,
                team2Score,
                scheduledDate: match.scheduledDate,
                scheduledTime: match.scheduledTime,
                location: match.location,
                winner: populatedMatch.result?.winner
                  ? populatedMatch.team1Score > populatedMatch.team2Score
                    ? populatedMatch.team1?.team?.name ||
                      populatedMatch.team1?.player?.username
                    : populatedMatch.team2?.team?.name ||
                      populatedMatch.team2?.player?.username
                  : null,
              },
            }
          );
        }
      } catch (notifError) {
        console.error("Error sending match result notifications:", notifError);
        // Don't fail the result update if notification fails
      }

      res.json({
        message: "Match result updated successfully",
        match: populatedMatch,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error updating match result",
        error: error.message,
      });
    }
  }
);

// @route   POST /api/matches/:id/promote
// @desc    Promote match
// @access  Private/Admin
router.post(
  "/:id/promote",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const match = await Match.findById(req.params.id);

      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      match.isPromoted = !match.isPromoted;
      await match.save();

      res.json({
        message: match.isPromoted
          ? "Match promoted successfully"
          : "Match unpromoted successfully",
        match,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error promoting match",
        error: error.message,
      });
    }
  }
);

// @route   DELETE /api/matches/:id
// @desc    Delete match
// @access  Private/Admin
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    await match.deleteOne();

    res.json({ message: "Match deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Server error deleting match",
      error: error.message,
    });
  }
});

// @route   GET /api/matches/my-matches
// @desc    Get matches where current user's team is involved
// @access  Private/Team Leader
router.get("/my-matches", authenticate, async (req, res) => {
  try {
    console.log("=== Fetching my matches for user:", req.user._id.toString(), "===");
    
    // Get user's team
    const user = await User.findById(req.user._id).populate("team");
    
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found", matches: [], count: 0 });
    }

    let teamId = null;
    let team = null;

    // Method 1: Check if user has a team reference
    if (user.team) {
      teamId = user.team._id || user.team;
      team = await Team.findById(teamId);
      console.log("Found team via user.team reference:", teamId.toString());
    }
    
    // Method 2: Find team where user is the leader
    if (!team) {
      team = await Team.findOne({ leader: req.user._id });
      if (team) {
        teamId = team._id;
        console.log("Found team via leader lookup:", teamId.toString());
      }
    }

    if (!team || !teamId) {
      console.log("No team found for user:", req.user._id.toString());
      return res.json({ matches: [], count: 0 });
    }

    // Ensure teamId is an ObjectId
    const teamObjectId = teamId instanceof mongoose.Types.ObjectId 
      ? teamId 
      : new mongoose.Types.ObjectId(teamId.toString());

    console.log("Searching matches for team:", {
      teamId: teamObjectId.toString(),
      teamName: team.name
    });

    // Find matches where this team is involved (team1 or team2)
    const matches = await Match.find({
      $or: [
        { "team1.team": teamObjectId },
        { "team2.team": teamObjectId },
      ],
    })
      .populate("tournament", "name startDate endDate")
      .populate("team1.team", "name")
      .populate("team1.player", "username firstName lastName")
      .populate("team2.team", "name")
      .populate("team2.player", "username firstName lastName")
      .populate("referee", "username firstName lastName")
      .sort({ scheduledDate: 1 })
      .lean();

    console.log("Found matches:", matches.length);

    res.json({ matches, count: matches.length });
  } catch (error) {
    console.error("=== ERROR fetching my matches ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Server error fetching my matches",
      error: error.message,
    });
  }
});

export default router;
