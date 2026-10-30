import express from "express";
import mongoose from "mongoose";
import Tournament from "../models/Tournament.js";
import Match from "../models/Match.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { createNotification } from "../services/notification.service.js";

const router = express.Router();

// @route   GET /api/tournaments
// @desc    Get all tournaments (with filters)
// @access  Public
router.get("/", async (req, res) => {
  try {
    const {
      status,
      isPromoted,
      upcoming,
      search,
      tournamentType,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (isPromoted === "true") {
      query.isPromoted = true;
    }

    if (upcoming === "true") {
      query.startDate = { $gte: new Date() };
    }

    if (tournamentType) {
      // Filter by tournament type - support both exact match and "both" type
      if (tournamentType === "team" || tournamentType === "individual") {
        query.$or = [
          { tournamentType: tournamentType },
          { tournamentType: "both" }
        ];
      } else if (tournamentType === "both") {
        query.tournamentType = "both";
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let tournaments = await Tournament.find(query)
      .populate("createdBy", "username email firstName lastName")
      .populate("registeredTeams.team", "name")
      .populate("registeredPlayers.player", "username firstName lastName")
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Calculate display status based on dates
    const now = new Date().getTime();
    tournaments = tournaments.map((tournament) => {
      const startDate = tournament.startDate
        ? new Date(tournament.startDate).getTime()
        : null;
      const endDate = tournament.endDate
        ? new Date(tournament.endDate).getTime()
        : null;
      const registrationDeadline = tournament.registrationDeadline
        ? new Date(tournament.registrationDeadline).getTime()
        : null;

      let displayStatus = "upcoming";
      let registrationOpen = false;

      // If end date has passed, tournament is completed
      if (endDate && now >= endDate) {
        displayStatus = "completed";
        registrationOpen = false;
      }
      // If event has started (but not ended), it's live
      else if (startDate && now >= startDate) {
        displayStatus = "live";
        registrationOpen = false;
      }
      // If registration deadline has passed, it's upcoming but registration closed
      else if (registrationDeadline && now >= registrationDeadline) {
        displayStatus = "upcoming";
        registrationOpen = false;
      }
      // If registration deadline hasn't passed, it's open and upcoming
      else if (registrationDeadline && now < registrationDeadline) {
        displayStatus = "upcoming";
        const totalRegistrations =
          (tournament.registeredTeams?.length || 0) +
          (tournament.registeredPlayers?.length || 0);
        const isFull = totalRegistrations >= (tournament.maxTeams || 0);
        registrationOpen =
          tournament.status === "open" &&
          !isFull &&
          tournament.status !== "completed" &&
          tournament.status !== "cancelled";
      }
      // Default to upcoming
      else {
        displayStatus = "upcoming";
        const totalRegistrations =
          (tournament.registeredTeams?.length || 0) +
          (tournament.registeredPlayers?.length || 0);
        const isFull = totalRegistrations >= (tournament.maxTeams || 0);
        registrationOpen =
          tournament.status === "open" &&
          !isFull &&
          tournament.status !== "completed" &&
          tournament.status !== "cancelled";
      }

      // Add computed fields
      tournament.displayStatus = displayStatus;
      tournament.registrationOpen = registrationOpen;

      return tournament;
    });

    // Filter by displayStatus if provided
    let filteredTournaments = tournaments;
    if (req.query.displayStatus && req.query.displayStatus !== "all") {
      if (req.query.displayStatus === "open") {
        // "open" filter means registration is open (regardless of displayStatus)
        filteredTournaments = tournaments.filter(
          (t) => t.registrationOpen === true
        );
      } else {
        filteredTournaments = tournaments.filter(
          (t) => t.displayStatus === req.query.displayStatus
        );
      }
    }

    // Get total count for pagination (before filtering by displayStatus)
    const total = filteredTournaments.length;

    res.json({
      tournaments: filteredTournaments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredTournaments.length,
        pages: Math.ceil(filteredTournaments.length / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching tournaments",
      error: error.message,
    });
  }
});

// @route   GET /api/tournaments/:id
// @desc    Get single tournament by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    let tournament = await Tournament.findById(req.params.id)
      .populate("createdBy", "username email firstName lastName")
      .populate({
        path: "registeredTeams.team",
        select: "name leader members isActive createdAt",
        populate: [
          {
            path: "leader",
            select:
              "username firstName lastName email phone memberCode isMinor dob guardianName guardianPhone role isActive isSuspended",
          },
          {
            path: "members",
            select:
              "username firstName lastName email phone memberCode isMinor dob guardianName guardianPhone role isActive isSuspended createdAt",
          },
        ],
      })
      .populate({
        path: "registeredPlayers.player",
        select:
          "username firstName lastName email phone memberCode isMinor dob guardianName guardianPhone role isActive isSuspended createdAt team",
        populate: {
          path: "team",
          select: "name leader",
        },
      })
      .lean();

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    // Calculate display status based on dates (same logic as list endpoint)
    const now = new Date().getTime();
    const startDate = tournament.startDate
      ? new Date(tournament.startDate).getTime()
      : null;
    const endDate = tournament.endDate
      ? new Date(tournament.endDate).getTime()
      : null;
    const registrationDeadline = tournament.registrationDeadline
      ? new Date(tournament.registrationDeadline).getTime()
      : null;

    let displayStatus = "upcoming";
    let registrationOpen = false;

    // If end date has passed, tournament is completed
    if (endDate && now >= endDate) {
      displayStatus = "completed";
      registrationOpen = false;
    }
    // If event has started (but not ended), it's live
    else if (startDate && now >= startDate) {
      displayStatus = "live";
      registrationOpen = false;
    }
    // If registration deadline has passed, it's upcoming but registration closed
    else if (registrationDeadline && now >= registrationDeadline) {
      displayStatus = "upcoming";
      registrationOpen = false;
    }
    // If registration deadline hasn't passed, it's open and upcoming
    else if (registrationDeadline && now < registrationDeadline) {
      displayStatus = "upcoming";
      const totalRegistrations =
        (tournament.registeredTeams?.length || 0) +
        (tournament.registeredPlayers?.length || 0);
      const isFull = totalRegistrations >= (tournament.maxTeams || 0);
      registrationOpen =
        tournament.status === "open" &&
        !isFull &&
        tournament.status !== "completed" &&
        tournament.status !== "cancelled";
    }
    // Default to upcoming
    else {
      displayStatus = "upcoming";
      const totalRegistrations =
        (tournament.registeredTeams?.length || 0) +
        (tournament.registeredPlayers?.length || 0);
      const isFull = totalRegistrations >= (tournament.maxTeams || 0);
      registrationOpen =
        tournament.status === "open" &&
        !isFull &&
        tournament.status !== "completed" &&
        tournament.status !== "cancelled";
    }

    // Add computed fields
    tournament.displayStatus = displayStatus;
    tournament.registrationOpen = registrationOpen;

    res.json({ tournament });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching tournament",
      error: error.message,
    });
  }
});

// @route   POST /api/tournaments
// @desc    Create new tournament
// @access  Private/Admin
router.post("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      registrationDeadline,
      location,
      venue,
      format,
      tournamentType,
      maxTeams,
      minTeams,
      minTeamMembers,
      maxTeamMembers,
      entryFee,
      prizePool,
      rules,
      image,
      status,
      isPromoted,
    } = req.body;

    // Validation
    if (!name || !startDate || !endDate || !registrationDeadline || !maxTeams) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        message: "End date must be after start date",
      });
    }

    if (new Date(registrationDeadline) >= new Date(startDate)) {
      return res.status(400).json({
        message: "Registration deadline must be before start date",
      });
    }

    const tournament = new Tournament({
      name,
      description,
      startDate,
      endDate,
      registrationDeadline,
      location,
      venue,
      format,
      tournamentType: tournamentType || "both",
      maxTeams,
      minTeams: minTeams || 2,
      minTeamMembers: minTeamMembers || 2,
      maxTeamMembers: maxTeamMembers || 10,
      entryFee: entryFee || 0,
      prizePool: prizePool || 0,
      rules,
      image,
      createdBy: req.user._id,
      status: status || "draft",
      isPromoted: !!isPromoted,
    });

    await tournament.save();

    res.status(201).json({
      message: "Tournament created successfully",
      tournament,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({
      message: "Server error creating tournament",
      error: error.message,
    });
  }
});

// @route   PUT /api/tournaments/:id
// @desc    Update tournament
// @access  Private/Admin
router.put("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    const allowedUpdates = [
      "name",
      "description",
      "startDate",
      "endDate",
      "registrationDeadline",
      "location",
      "venue",
      "format",
      "tournamentType",
      "maxTeams",
      "minTeams",
      "minTeamMembers",
      "maxTeamMembers",
      "entryFee",
      "prizePool",
      "status",
      "rules",
      "image",
      "isPromoted",
    ];

    allowedUpdates.forEach((update) => {
      if (req.body[update] !== undefined) {
        tournament[update] = req.body[update];
      }
    });

    await tournament.save();

    res.json({
      message: "Tournament updated successfully",
      tournament,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({
      message: "Server error updating tournament",
      error: error.message,
    });
  }
});

// @route   DELETE /api/tournaments/:id
// @desc    Delete tournament
// @access  Private/Admin
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    // Delete associated matches
    await Match.deleteMany({ tournament: tournament._id });

    await tournament.deleteOne();

    res.json({ message: "Tournament deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Server error deleting tournament",
      error: error.message,
    });
  }
});

// @route   POST /api/tournaments/:id/promote
// @desc    Promote tournament
// @access  Private/Admin
router.post(
  "/:id/promote",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const tournament = await Tournament.findById(req.params.id);

      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }

      tournament.isPromoted = !tournament.isPromoted;
      if (tournament.isPromoted) {
        tournament.promotedAt = new Date();
      }

      await tournament.save();

      res.json({
        message: tournament.isPromoted
          ? "Tournament promoted successfully"
          : "Tournament unpromoted successfully",
        tournament,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error promoting tournament",
        error: error.message,
      });
    }
  }
);

// @route   POST /api/tournaments/:id/register
// @desc    Register team/player for tournament
// @access  Private (any logged-in user can register)
router.post("/:id/register", authenticate, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (tournament.status !== "open") {
      return res.status(400).json({
        message: "Tournament registration is not open",
      });
    }

    // Compare dates at end of day to allow registration on the deadline day
    const now = new Date();
    const deadlineEndOfDay = new Date(tournament.registrationDeadline);
    deadlineEndOfDay.setHours(23, 59, 59, 999);

    if (now > deadlineEndOfDay) {
      return res.status(400).json({
        message: "Registration deadline has passed",
      });
    }

    if (tournament.isFull()) {
      return res.status(400).json({
        message: "Tournament is full",
      });
    }

    const { registrationType, teamId } = req.body; // registrationType: "team" or "individual"

    // Validate registration type based on tournament type
    if (
      tournament.tournamentType === "individual" &&
      registrationType !== "individual"
    ) {
      return res.status(400).json({
        message:
          "This is an individual tournament. Only individual registration is allowed.",
      });
    }

    if (tournament.tournamentType === "team" && registrationType !== "team") {
      return res.status(400).json({
        message:
          "This is a team tournament. Only team registration is allowed.",
      });
    }

    // If tournament is "team" type, only team leaders can register
    if (
      tournament.tournamentType === "team" &&
      req.user.role !== "team_leader"
    ) {
      return res.status(403).json({
        message:
          "Only team leaders can register for team tournaments.please contact a team leader or admin to get registered",
      });
    }

    let registrationId = null;
    let paymentUrl = null;
    let userIdForPayment = null;

    if (registrationType === "individual") {
      // Individual registration - any logged-in user can register
      // Check if player is already registered
      const alreadyRegistered = tournament.registeredPlayers.some(
        (reg) => reg.player.toString() === req.user._id.toString()
      );

      if (alreadyRegistered) {
        return res.status(400).json({
          message: "You are already registered for this tournament",
        });
      }

      // Add player to registeredPlayers
      tournament.registeredPlayers.push({
        player: req.user._id,
        paymentStatus: tournament.entryFee > 0 ? "pending" : "paid",
      });

      await tournament.save();

      // Get the registration ID after saving
      const registration = tournament.registeredPlayers.find(
        (reg) => reg.player.toString() === req.user._id.toString()
      );
      registrationId = registration?._id || registration?.id;
      userIdForPayment = req.user._id.toString();

      console.log("Individual registration ID found:", {
        registrationId: registrationId?.toString(),
        registrationType,
        userId: userIdForPayment,
        hasRegistrationId: !!registrationId,
      });

      // Payment for individual registration is handled via payment modal (payment intent)
      // No need to create checkout session here

      // Send notification for individual registration
      try {
        const userId = req.user._id;
        const registrationMessage = `You have been successfully registered for ${tournament.name}`;

        await createNotification(
          userId,
          "tournament_registration",
          "Tournament Registration Confirmed",
          registrationMessage,
          { entityType: "Tournament", entityId: tournament._id },
          {
            sendEmail: tournament.entryFee === 0, // Only send email if no payment required
            sendSMS: false,
            emailData: {
              tournamentName: tournament.name,
              startDate: tournament.startDate,
              location: tournament.location,
              entryFee: tournament.entryFee,
              registrationType: "individual",
              paymentUrl: null,
              requiresPayment: false,
              paymentStatus: "paid",
            },
          }
        );
      } catch (notifError) {
        console.error("Error sending notification:", notifError);
      }

      res.json({
        message: "Registration successful",
        tournament,
        registrationId: registrationId?.toString() || null,
        userId: userIdForPayment,
      });
    } else if (registrationType === "team") {
      // Team registration - only team leaders can register teams
      if (req.user.role !== "team_leader") {
        return res.status(403).json({
          message: "Only team leaders can register teams for tournaments.",
        });
      }

      // Verify teamId is provided
      if (!teamId) {
        return res.status(400).json({
          message: "Team ID is required for team registration",
        });
      }

      // Verify the team exists and user is the leader
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({
          message: "Team not found",
        });
      }

      // Verify user is the leader of this team
      if (team.leader.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "You can only register teams where you are the team leader",
        });
      }

      // Check if team is already registered
      const alreadyRegistered = tournament.registeredTeams.some(
        (reg) => reg.team.toString() === teamId
      );

      if (alreadyRegistered) {
        return res.status(400).json({
          message: "Team is already registered for this tournament",
        });
      }

      tournament.registeredTeams.push({
        team: teamId,
        paymentStatus: tournament.entryFee > 0 ? "pending" : "paid",
      });

      await tournament.save();

      // Get the registration ID after saving
      const registration = tournament.registeredTeams.find(
        (reg) => reg.team.toString() === teamId
      );
      registrationId = registration?._id || registration?.id;

      console.log("Team registration ID found:", {
        registrationId: registrationId?.toString(),
        registrationType,
        teamId: teamId,
        hasRegistrationId: !!registrationId,
      });

      const teamMemberCount = team.members?.length || 0;
      const totalTeamEntryFee =
        tournament.entryFee > 0 ? tournament.entryFee * teamMemberCount : 0;

      // Create payment checkout URL if entry fee is required
      if (tournament.entryFee > 0) {
        try {
          const { createTournamentCheckoutSession } = await import(
            "../services/stripe.service.js"
          );

          const paymentResult = await createTournamentCheckoutSession({
            amount: totalTeamEntryFee,
            currency: "usd",
            email: req.user.email,
            userId: req.user._id.toString(),
            tournamentId: tournament._id.toString(),
            teamId: teamId,
            registrationId: registrationId
              ? registrationId.toString()
              : undefined,
          });

          if (paymentResult.success && paymentResult.checkoutUrl) {
            paymentUrl = paymentResult.checkoutUrl;
          } else {
            console.warn(
              "Payment checkout session creation failed:",
              paymentResult.error
            );
          }
        } catch (paymentError) {
          console.error(
            "Error creating payment checkout session:",
            paymentError
          );
        }
      }

      // Send notification for team registration
      try {
        const userId = req.user._id;
        const registrationMessage = `Your team has been successfully registered for ${tournament.name}`;

        await createNotification(
          userId,
          "tournament_registration",
          "Tournament Registration Confirmed",
          registrationMessage,
          { entityType: "Tournament", entityId: tournament._id },
          {
            sendEmail: tournament.entryFee === 0,
            sendSMS: false,
            emailData: {
              tournamentName: tournament.name,
              startDate: tournament.startDate,
              location: tournament.location,
              entryFee: totalTeamEntryFee,
              registrationType: "team",
              teamName: team.name,
              paymentUrl: null,
              requiresPayment: false,
              paymentStatus: "paid",
            },
          }
        );
      } catch (notifError) {
        console.error("Error sending notification:", notifError);
      }

      res.json({
        message: "Registration successful",
        tournament,
        registrationId: registrationId?.toString() || null,
        teamId: teamId?.toString() || null,
      });
    } else {
      return res.status(400).json({
        message: "Invalid registration type. Must be 'team' or 'individual'.",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Server error registering for tournament",
      error: error.message,
    });
  }
});

// @route   GET /api/tournaments/my-tournaments
// @desc    Get tournaments where current user's team is registered
// @access  Private/Team Leader
router.get("/my-tournaments", authenticate, async (req, res) => {
  try {
    console.log(
      "=== Fetching my tournaments for user:",
      req.user._id.toString(),
      "==="
    );

    // Get user's team - try multiple methods
    const user = await User.findById(req.user._id).populate("team");

    if (!user) {
      console.log("User not found");
      return res
        .status(404)
        .json({ message: "User not found", tournaments: [], count: 0 });
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
      console.log("No team found for user:", {
        userId: req.user._id.toString(),
        userRole: user.role,
        hasTeamRef: !!user.team,
      });
      return res.json({ tournaments: [], count: 0 });
    }

    // Ensure teamId is an ObjectId
    const teamObjectId =
      teamId instanceof mongoose.Types.ObjectId
        ? teamId
        : new mongoose.Types.ObjectId(teamId.toString());

    console.log("Searching tournaments for team:", {
      teamId: teamObjectId.toString(),
      teamName: team.name,
      userId: req.user._id.toString(),
    });

    // Find tournaments where this team is registered
    // Match tournaments where registeredTeams array contains an object with team matching our teamId
    const tournaments = await Tournament.find({
      "registeredTeams.team": teamObjectId,
    })
      .populate("createdBy", "username email firstName lastName")
      .populate("registeredTeams.team", "name")
      .sort({ startDate: 1 })
      .lean(); // Use lean() to get plain objects

    console.log("Raw tournaments found:", tournaments.length);
    if (tournaments.length > 0) {
      console.log(
        "First tournament registeredTeams:",
        JSON.stringify(tournaments[0].registeredTeams, null, 2)
      );
    }

    // Map tournaments to include payment status for this team
    const tournamentsWithPaymentStatus = tournaments.map((tournament) => {
      // Find the registration for this specific team
      const registration = tournament.registeredTeams.find((reg) => {
        // Handle both populated (object with _id) and non-populated (just ObjectId) team references
        let regTeamId;
        if (reg.team && typeof reg.team === "object" && reg.team._id) {
          // Populated team object
          regTeamId = reg.team._id.toString();
        } else if (reg.team) {
          // ObjectId or string
          regTeamId = reg.team.toString();
        } else {
          return false;
        }

        return regTeamId === teamObjectId.toString();
      });

      const tournamentObj = { ...tournament };
      tournamentObj.paymentStatus = registration?.paymentStatus || "pending";
      tournamentObj.registrationId = registration?._id;
      tournamentObj.entryFee = tournament.entryFee || 0;

      return tournamentObj;
    });

    console.log(
      "Returning tournaments with payment status:",
      tournamentsWithPaymentStatus.length
    );
    if (tournamentsWithPaymentStatus.length > 0) {
      console.log(
        "Tournament names:",
        tournamentsWithPaymentStatus.map((t) => t.name)
      );
    }

    res.json({
      tournaments: tournamentsWithPaymentStatus,
      count: tournamentsWithPaymentStatus.length,
    });
  } catch (error) {
    console.error("=== ERROR fetching my tournaments ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Server error fetching my tournaments",
      error: error.message,
    });
  }
});

// Admin: Get pending manual tournament payments
router.get(
  "/admin/pending-zelle-payments",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;

      const tournaments = await Tournament.find({
        $or: [
          {
            "registeredTeams.paymentMethod": { $in: ["zelle", "cash_app"] },
            "registeredTeams.paymentStatus": "pending",
          },
          {
            "registeredPlayers.paymentMethod": { $in: ["zelle", "cash_app"] },
            "registeredPlayers.paymentStatus": "pending",
          },
        ],
      })
        .populate("registeredTeams.team", "name leader")
        .populate(
          "registeredPlayers.player",
          "username email firstName lastName"
        )
        .populate("registeredTeams.zellePayment.verifiedBy", "username email")
        .populate("registeredPlayers.zellePayment.verifiedBy", "username email")
        .lean();

      const pendingPayments = [];

      tournaments.forEach((tournament) => {
        // Check team registrations
        tournament.registeredTeams.forEach((reg) => {
          if (
            ["zelle", "cash_app"].includes(reg.paymentMethod) &&
            reg.paymentStatus === "pending"
          ) {
            pendingPayments.push({
              tournamentId: tournament._id,
              tournamentName: tournament.name,
              tournamentDate: tournament.startDate,
              registrationId: reg._id,
              registrationType: "team",
              teamId: reg.team?._id || reg.team,
              teamName: reg.team?.name,
              paymentStatus: reg.paymentStatus,
              paymentMethod: reg.paymentMethod,
              zellePayment: reg.zellePayment,
              registeredAt: reg.registeredAt,
            });
          }
        });

        // Check player registrations
        tournament.registeredPlayers.forEach((reg) => {
          if (
            ["zelle", "cash_app"].includes(reg.paymentMethod) &&
            reg.paymentStatus === "pending"
          ) {
            pendingPayments.push({
              tournamentId: tournament._id,
              tournamentName: tournament.name,
              tournamentDate: tournament.startDate,
              registrationId: reg._id,
              registrationType: "individual",
              playerId: reg.player?._id || reg.player,
              playerName:
                reg.player?.firstName && reg.player?.lastName
                  ? `${reg.player.firstName} ${reg.player.lastName}`
                  : reg.player?.username,
              playerEmail: reg.player?.email,
              paymentStatus: reg.paymentStatus,
              paymentMethod: reg.paymentMethod,
              zellePayment: reg.zellePayment,
              registeredAt: reg.registeredAt,
            });
          }
        });
      });

      // Sort by registration date (newest first)
      pendingPayments.sort(
        (a, b) => new Date(b.registeredAt) - new Date(a.registeredAt)
      );

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedPayments = pendingPayments.slice(
        skip,
        skip + parseInt(limit)
      );

      res.json({
        payments: paginatedPayments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: pendingPayments.length,
          pages: Math.ceil(pendingPayments.length / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching pending manual tournament payments:", error);
      res.status(500).json({
        message: "Server error fetching pending manual tournament payments",
        error: error.message,
      });
    }
  }
);

// Admin: Get all manual tournament payments (with optional status filter)
router.get(
  "/admin/zelle-payments",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, paymentStatus } = req.query;

      // Build query based on paymentStatus filter
      let query = {
        $or: [
          { "registeredTeams.paymentMethod": { $in: ["zelle", "cash_app"] } },
          {
            "registeredPlayers.paymentMethod": { $in: ["zelle", "cash_app"] },
          },
        ],
      };

      // Add status filter if provided
      if (paymentStatus && paymentStatus !== "all") {
        query = {
          $or: [
            {
              "registeredTeams.paymentMethod": { $in: ["zelle", "cash_app"] },
              "registeredTeams.paymentStatus": paymentStatus,
            },
            {
              "registeredPlayers.paymentMethod": { $in: ["zelle", "cash_app"] },
              "registeredPlayers.paymentStatus": paymentStatus,
            },
          ],
        };
      }

      const tournaments = await Tournament.find(query)
        .populate("registeredTeams.team", "name leader")
        .populate(
          "registeredPlayers.player",
          "username email firstName lastName"
        )
        .populate("registeredTeams.zellePayment.verifiedBy", "username email")
        .populate("registeredPlayers.zellePayment.verifiedBy", "username email")
        .lean();

      const allPayments = [];

      tournaments.forEach((tournament) => {
        // Check team registrations
        tournament.registeredTeams.forEach((reg) => {
          if (["zelle", "cash_app"].includes(reg.paymentMethod)) {
            // Filter by status if specified
            if (!paymentStatus || paymentStatus === "all" || reg.paymentStatus === paymentStatus) {
              allPayments.push({
                tournamentId: tournament._id,
                tournamentName: tournament.name,
                tournamentDate: tournament.startDate,
                registrationId: reg._id,
                registrationType: "team",
                teamId: reg.team?._id || reg.team,
                teamName: reg.team?.name,
                paymentStatus: reg.paymentStatus,
                paymentMethod: reg.paymentMethod,
                zellePayment: reg.zellePayment,
                registeredAt: reg.registeredAt,
              });
            }
          }
        });

        // Check player registrations
        tournament.registeredPlayers.forEach((reg) => {
          if (["zelle", "cash_app"].includes(reg.paymentMethod)) {
            // Filter by status if specified
            if (!paymentStatus || paymentStatus === "all" || reg.paymentStatus === paymentStatus) {
              allPayments.push({
                tournamentId: tournament._id,
                tournamentName: tournament.name,
                tournamentDate: tournament.startDate,
                registrationId: reg._id,
                registrationType: "individual",
                playerId: reg.player?._id || reg.player,
                playerName:
                  reg.player?.firstName && reg.player?.lastName
                    ? `${reg.player.firstName} ${reg.player.lastName}`
                    : reg.player?.username,
                playerEmail: reg.player?.email,
                paymentStatus: reg.paymentStatus,
                paymentMethod: reg.paymentMethod,
                zellePayment: reg.zellePayment,
                registeredAt: reg.registeredAt,
              });
            }
          }
        });
      });

      // Sort by registration date (newest first)
      allPayments.sort(
        (a, b) => new Date(b.registeredAt) - new Date(a.registeredAt)
      );

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedPayments = allPayments.slice(
        skip,
        skip + parseInt(limit)
      );

      res.json({
        payments: paginatedPayments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: allPayments.length,
          pages: Math.ceil(allPayments.length / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching manual tournament payments:", error);
      res.status(500).json({
        message: "Server error fetching manual tournament payments",
        error: error.message,
      });
    }
  }
);

// Admin: Verify manual tournament payment
router.post(
  "/admin/:tournamentId/verify-zelle/:registrationId",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { tournamentId, registrationId } = req.params;
      const { verificationNotes, registrationType = "team" } = req.body;

      const tournament = await Tournament.findById(tournamentId);

      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }

      let registration = null;
      if (registrationType === "team") {
        registration = tournament.registeredTeams.id(registrationId);
      } else {
        registration = tournament.registeredPlayers.id(registrationId);
      }

      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      if (!["zelle", "cash_app"].includes(registration.paymentMethod)) {
        return res
          .status(400)
          .json({ message: "This registration is not a manual payment" });
      }

      if (registration.paymentStatus === "paid") {
        return res
          .status(400)
          .json({ message: "This payment has already been verified" });
      }

      // Verify the payment
      registration.paymentStatus = "paid";
      if (!registration.zellePayment) {
        registration.zellePayment = {};
      }
      registration.zellePayment.verifiedBy = req.user._id;
      registration.zellePayment.verifiedAt = new Date();
      if (verificationNotes) {
        registration.zellePayment.verificationNotes = verificationNotes;
      }

      await tournament.save();

      // Send confirmation email
      try {
        const { createNotification } = await import(
          "../services/notification.service.js"
        );
        let userIdToNotify = null;
        let teamName = null;

        if (registrationType === "team") {
          const team = await Team.findById(registration.team).populate(
            "leader"
          );
          userIdToNotify = team?.leader?._id;
          teamName = team?.name || null;
        } else {
          userIdToNotify = registration.player;
        }

        if (userIdToNotify) {
          await createNotification(
            userIdToNotify,
            "tournament_registration",
            "Registration & Payment Confirmed",
            `Your ${registrationType} registration and ${registration.paymentMethod === "cash_app" ? "Cash App" : "Zelle"} payment for ${tournament.name} has been confirmed`,
            { entityType: "Tournament", entityId: tournament._id },
            {
              sendEmail: true,
              emailData: {
                tournamentName: tournament.name,
                startDate: tournament.startDate,
                location: tournament.location,
                entryFee: tournament.entryFee,
                registrationType: registrationType,
                teamName,
                paymentStatus: "paid",
              },
            }
          );
        }
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }

      res.json({
        message: "Payment verified successfully",
        tournament,
      });
    } catch (error) {
      console.error("Error verifying Zelle tournament payment:", error);
      res.status(500).json({
        message: "Server error verifying payment",
        error: error.message,
      });
    }
  }
);

export default router;
