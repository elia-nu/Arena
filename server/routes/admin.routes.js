/* eslint-env node */
import express from "express";
import User from "../models/User.js";
import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import Match from "../models/Match.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";
import Contact from "../models/Contact.js";
import Settings from "../models/Settings.js";
import mongoose from "mongoose";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// @route   POST /api/admin/create-admin
// @desc    Create first admin user (only if no admins exist)
// @access  Public (only works if no admin exists)
router.post("/create-admin", async (req, res) => {
  try {
    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(403).json({
        message:
          "Admin user already exists. Please login or contact existing admin.",
      });
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Please provide username, email, and password",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email or username already exists",
      });
    }

    // Create admin user
    const admin = new User({
      username,
      email,
      password,
      firstName: firstName || "Admin",
      lastName: lastName || "User",
      role: "admin",
      isActive: true,
    });

    await admin.save();

    res.status(201).json({
      message: "Admin user created successfully",
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({
      message: "Server error creating admin",
      error: error.message,
    });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get("/stats", authenticate, authorize("admin"), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const totalTeamLeaders = await User.countDocuments({ role: "team_leader" });
    const totalPlayers = await User.countDocuments({ role: "player" });
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalTeams = await Team.countDocuments();
    const totalEvents = await Tournament.countDocuments();

    // Calculate revenue from orders and tournament fees
    const paidOrders = await Order.find({ paymentStatus: "paid" }).lean();
    const orderRevenue = paidOrders.reduce(
      (sum, order) => sum + (order.total || 0),
      0,
    );

    // Tournament revenue
    const tournaments = await Tournament.find({}).lean();
    let tournamentRevenue = 0;
    tournaments.forEach((tournament) => {
      const paidTeams = (tournament.registeredTeams || []).filter(
        (reg) => reg.paymentStatus === "paid",
      ).length;
      const paidPlayers = (tournament.registeredPlayers || []).filter(
        (reg) => reg.paymentStatus === "paid",
      ).length;
      tournamentRevenue +=
        (paidTeams + paidPlayers) * (tournament.entryFee || 0);
    });

    const totalRevenue = orderRevenue + tournamentRevenue;

    res.json({
      totalUsers,
      totalAdmins,
      totalTeamLeaders,
      totalPlayers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      totalTeams,
      totalEvents,
      totalRevenue,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching stats",
      error: error.message,
    });
  }
});

// @route   GET /api/admin/monitoring/realtime
// @desc    Get real-time monitoring metrics
// @access  Private/Admin
router.get(
  "/monitoring/realtime",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const currentTime = new Date(now);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const last7Days = new Date(today);
      last7Days.setDate(last7Days.getDate() - 7);
      const last30Days = new Date(today);
      last30Days.setDate(last30Days.getDate() - 30);

      // Traffic Metrics (User activity)
      const activeUsersToday = await User.countDocuments({
        updatedAt: { $gte: today },
        isActive: true,
      });
      const newUsersToday = await User.countDocuments({
        createdAt: { $gte: today },
      });
      const newUsersYesterday = await User.countDocuments({
        createdAt: { $gte: yesterday, $lt: today },
      });
      const newUsersLast7Days = await User.countDocuments({
        createdAt: { $gte: last7Days },
      });
      const newUsersLast30Days = await User.countDocuments({
        createdAt: { $gte: last30Days },
      });

      // Sales Metrics
      const ordersToday = await Order.countDocuments({
        createdAt: { $gte: today },
      });
      const ordersYesterday = await Order.countDocuments({
        createdAt: { $gte: yesterday, $lt: today },
      });
      const paidOrdersToday = await Order.find({
        paymentStatus: "paid",
        createdAt: { $gte: today },
      }).lean();
      const salesToday = paidOrdersToday.reduce(
        (sum, order) => sum + (order.total || 0),
        0,
      );
      const paidOrdersYesterday = await Order.find({
        paymentStatus: "paid",
        createdAt: { $gte: yesterday, $lt: today },
      }).lean();
      const salesYesterday = paidOrdersYesterday.reduce(
        (sum, order) => sum + (order.total || 0),
        0,
      );
      const paidOrdersLast7Days = await Order.find({
        paymentStatus: "paid",
        createdAt: { $gte: last7Days },
      }).lean();
      const salesLast7Days = paidOrdersLast7Days.reduce(
        (sum, order) => sum + (order.total || 0),
        0,
      );
      const paidOrdersLast30Days = await Order.find({
        paymentStatus: "paid",
        createdAt: { $gte: last30Days },
      }).lean();
      const salesLast30Days = paidOrdersLast30Days.reduce(
        (sum, order) => sum + (order.total || 0),
        0,
      );

      // Tournament revenue
      const tournamentsToday = await Tournament.find({
        createdAt: { $gte: today },
      }).lean();
      const tournamentsLast7Days = await Tournament.find({
        createdAt: { $gte: last7Days },
      }).lean();
      const tournamentsLast30Days = await Tournament.find({
        createdAt: { $gte: last30Days },
      }).lean();

      const calculateTournamentRevenue = (tournaments) => {
        let revenue = 0;
        tournaments.forEach((tournament) => {
          const paidTeams = (tournament.registeredTeams || []).filter(
            (reg) => reg.paymentStatus === "paid",
          ).length;
          const paidPlayers = (tournament.registeredPlayers || []).filter(
            (reg) => reg.paymentStatus === "paid",
          ).length;
          revenue += (paidTeams + paidPlayers) * (tournament.entryFee || 0);
        });
        return revenue;
      };

      const tournamentRevenueToday =
        calculateTournamentRevenue(tournamentsToday);
      const tournamentRevenueLast7Days =
        calculateTournamentRevenue(tournamentsLast7Days);
      const tournamentRevenueLast30Days = calculateTournamentRevenue(
        tournamentsLast30Days,
      );

      // Registration Metrics
      const registrationsToday = await Tournament.aggregate([
        {
          $match: {
            createdAt: { $gte: today },
          },
        },
        {
          $project: {
            teamRegs: { $size: { $ifNull: ["$registeredTeams", []] } },
            playerRegs: { $size: { $ifNull: ["$registeredPlayers", []] } },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $add: ["$teamRegs", "$playerRegs"] } },
          },
        },
      ]);
      const registrationsLast7Days = await Tournament.aggregate([
        {
          $match: {
            createdAt: { $gte: last7Days },
          },
        },
        {
          $project: {
            teamRegs: { $size: { $ifNull: ["$registeredTeams", []] } },
            playerRegs: { $size: { $ifNull: ["$registeredPlayers", []] } },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $add: ["$teamRegs", "$playerRegs"] } },
          },
        },
      ]);
      const registrationsLast30Days = await Tournament.aggregate([
        {
          $match: {
            createdAt: { $gte: last30Days },
          },
        },
        {
          $project: {
            teamRegs: { $size: { $ifNull: ["$registeredTeams", []] } },
            playerRegs: { $size: { $ifNull: ["$registeredPlayers", []] } },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $add: ["$teamRegs", "$playerRegs"] } },
          },
        },
      ]);

      // Engagement Metrics
      const totalOrders = await Order.countDocuments();
      const pendingOrders = await Order.countDocuments({ status: "pending" });
      const activeTournaments = await Tournament.countDocuments({
        status: { $in: ["open", "scheduled"] },
      });
      const totalTeams = await Team.countDocuments();
      const activeTeams = await Team.countDocuments({ isActive: true });

      // Recent activity (last hour)
      const lastHour = new Date(currentTime.getTime() - 60 * 60 * 1000);
      const recentOrders = await Order.countDocuments({
        createdAt: { $gte: lastHour },
      });
      const recentRegistrations = await Tournament.aggregate([
        {
          $match: {
            $or: [
              { "registeredTeams.registeredAt": { $gte: lastHour } },
              { "registeredPlayers.registeredAt": { $gte: lastHour } },
            ],
          },
        },
        {
          $project: {
            teamRegs: {
              $size: {
                $filter: {
                  input: { $ifNull: ["$registeredTeams", []] },
                  as: "reg",
                  cond: { $gte: ["$$reg.registeredAt", lastHour] },
                },
              },
            },
            playerRegs: {
              $size: {
                $filter: {
                  input: { $ifNull: ["$registeredPlayers", []] },
                  as: "reg",
                  cond: { $gte: ["$$reg.registeredAt", lastHour] },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $add: ["$teamRegs", "$playerRegs"] } },
          },
        },
      ]);

      res.json({
        timestamp: new Date().toISOString(),
        traffic: {
          activeUsersToday,
          newUsersToday,
          newUsersYesterday,
          newUsersLast7Days,
          newUsersLast30Days,
          userGrowthRate:
            newUsersYesterday > 0
              ? ((newUsersToday - newUsersYesterday) / newUsersYesterday) * 100
              : newUsersToday > 0
                ? 100
                : 0,
        },
        sales: {
          ordersToday,
          ordersYesterday,
          salesToday,
          salesYesterday,
          salesLast7Days,
          salesLast30Days,
          salesGrowthRate:
            salesYesterday > 0
              ? ((salesToday - salesYesterday) / salesYesterday) * 100
              : salesToday > 0
                ? 100
                : 0,
          tournamentRevenueToday,
          tournamentRevenueLast7Days,
          tournamentRevenueLast30Days,
          totalRevenue: salesToday + tournamentRevenueToday,
        },
        registrations: {
          today: registrationsToday[0]?.total || 0,
          last7Days: registrationsLast7Days[0]?.total || 0,
          last30Days: registrationsLast30Days[0]?.total || 0,
          recentHour: recentRegistrations[0]?.total || 0,
        },
        engagement: {
          totalOrders,
          pendingOrders,
          activeTournaments,
          totalTeams,
          activeTeams,
          recentOrders,
          recentRegistrations: recentRegistrations[0]?.total || 0,
          conversionRate:
            totalOrders > 0 && newUsersLast30Days > 0
              ? (totalOrders / newUsersLast30Days) * 100
              : 0,
        },
      });
    } catch (error) {
      console.error("Error fetching real-time monitoring:", error);
      res.status(500).json({
        message: "Server error fetching real-time monitoring",
        error: error.message,
      });
    }
  },
);

// @route   GET /api/admin/analytics
// @desc    Get analytics data
// @access  Private/Admin
router.get("/analytics", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // User growth data
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: daysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Event registrations
    const tournaments = await Tournament.find({
      createdAt: { $gte: daysAgo },
    }).populate("registeredTeams registeredPlayers");

    const eventRegistrations = tournaments.map((t) => ({
      date: t.createdAt.toISOString().split("T")[0],
      name: t.name,
      registrations: t.registeredTeams.length + t.registeredPlayers.length,
    }));

    // Revenue (placeholder - integrate with payment system)
    const revenue = userGrowth.map((ug) => ({
      date: ug.date,
      amount: Math.floor(Math.random() * 1000) + 500, // Placeholder
    }));

    // Top events
    const topEvents = await Tournament.aggregate([
      {
        $project: {
          name: 1,
          registrations: {
            $add: [
              { $size: { $ifNull: ["$registeredTeams", []] } },
              { $size: { $ifNull: ["$registeredPlayers", []] } },
            ],
          },
        },
      },
      { $sort: { registrations: -1 } },
      { $limit: 5 },
    ]);

    // User activity (placeholder)
    const userActivity = [
      {
        action: "User Registrations",
        count: userGrowth.length,
        date: new Date().toISOString().split("T")[0],
      },
      {
        action: "Event Views",
        count: 150,
        date: new Date().toISOString().split("T")[0],
      },
      {
        action: "Page Views",
        count: 1200,
        date: new Date().toISOString().split("T")[0],
      },
    ];

    res.json({
      userGrowth,
      eventRegistrations,
      revenue,
      topEvents,
      userActivity,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching analytics",
      error: error.message,
    });
  }
});

// @route   GET /api/admin/reports
// @desc    Get available reports
// @access  Private/Admin
router.get("/reports", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { type, days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Placeholder reports list
    const reports = [
      {
        name: "User Report",
        type: "users",
        createdAt: new Date(),
      },
      {
        name: "Event Report",
        type: "events",
        createdAt: new Date(),
      },
    ];

    const filteredReports =
      type && type !== "all" ? reports.filter((r) => r.type === type) : reports;

    res.json({ reports: filteredReports });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching reports",
      error: error.message,
    });
  }
});

// @route   GET /api/admin/reports/:type
// @desc    Generate report by type
// @access  Private/Admin
router.get(
  "/reports/:type",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { type } = req.params;
      const { days = 30 } = req.query;
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));

      let reportData = {};

      switch (type) {
        case "users": {
          const users = await User.find({ createdAt: { $gte: daysAgo } })
            .select("-password")
            .limit(1000);
          reportData = {
            type: "users",
            period: `${days} days`,
            totalUsers: users.length,
            users: users,
            summary: {
              admins: users.filter((u) => u.role === "admin").length,
              teamLeaders: users.filter((u) => u.role === "team_leader").length,
              players: users.filter((u) => u.role === "player").length,
            },
          };
          break;
        }

        case "events": {
          const tournaments = await Tournament.find({
            createdAt: { $gte: daysAgo },
          })
            .populate("registeredTeams registeredPlayers")
            .limit(100);
          reportData = {
            type: "events",
            period: `${days} days`,
            totalEvents: tournaments.length,
            events: tournaments,
            summary: {
              totalRegistrations: tournaments.reduce(
                (sum, t) =>
                  sum + t.registeredTeams.length + t.registeredPlayers.length,
                0,
              ),
            },
          };
          break;
        }

        case "revenue": {
          // Get paid orders from shop
          const paidOrders = await Order.find({
            paymentStatus: "paid",
            createdAt: { $gte: daysAgo },
          })
            .populate("user", "username email firstName lastName")
            .sort({ createdAt: -1 })
            .limit(1000);

          // Get tournament entry fees (paid registrations)
          const tournamentsWithPayments = await Tournament.find({
            createdAt: { $gte: daysAgo },
          })
            .select("name entryFee registeredTeams registeredPlayers")
            .lean();

          const tournamentTransactions = [];
          let tournamentRevenue = 0;

          tournamentsWithPayments.forEach((tournament) => {
            // Count paid team registrations
            const paidTeams = (tournament.registeredTeams || []).filter(
              (reg) => reg.paymentStatus === "paid",
            );
            const paidPlayers = (tournament.registeredPlayers || []).filter(
              (reg) => reg.paymentStatus === "paid",
            );

            const paidCount = paidTeams.length + paidPlayers.length;
            if (paidCount > 0 && tournament.entryFee > 0) {
              const revenue = paidCount * tournament.entryFee;
              tournamentRevenue += revenue;

              // Add transaction for each paid registration
              paidTeams.forEach((reg) => {
                tournamentTransactions.push({
                  date: reg.paidAt || reg.registeredAt || new Date(),
                  amount: tournament.entryFee,
                  description: `Tournament Entry Fee - ${tournament.name} (Team)`,
                  type: "tournament_entry",
                  tournamentId: tournament._id,
                });
              });

              paidPlayers.forEach((reg) => {
                tournamentTransactions.push({
                  date: reg.paidAt || reg.registeredAt || new Date(),
                  amount: tournament.entryFee,
                  description: `Tournament Entry Fee - ${tournament.name} (Individual)`,
                  type: "tournament_entry",
                  tournamentId: tournament._id,
                });
              });
            }
          });

          // Combine order transactions
          const orderTransactions = paidOrders.map((order) => ({
            date: order.createdAt,
            amount: order.total,
            description: `Order #${order.orderNumber} - ${order.items.length} item(s)`,
            type: "order",
            orderId: order._id,
            userId: order.user?._id,
            userName: order.user?.username || order.user?.email,
          }));

          // Combine all transactions and sort by date
          const allTransactions = [
            ...orderTransactions,
            ...tournamentTransactions,
          ].sort((a, b) => new Date(b.date) - new Date(a.date));

          // Calculate totals
          const orderRevenue = paidOrders.reduce(
            (sum, order) => sum + (order.total || 0),
            0,
          );
          const totalRevenue = orderRevenue + tournamentRevenue;

          // Group by date for summary
          const revenueByDate = {};
          allTransactions.forEach((trans) => {
            const dateKey = new Date(trans.date).toISOString().split("T")[0];
            if (!revenueByDate[dateKey]) {
              revenueByDate[dateKey] = { date: dateKey, amount: 0, count: 0 };
            }
            revenueByDate[dateKey].amount += trans.amount;
            revenueByDate[dateKey].count += 1;
          });

          reportData = {
            type: "revenue",
            period: `${days} days`,
            totalRevenue: totalRevenue,
            transactions: allTransactions.slice(0, 500), // Limit to 500 for response size
            summary: {
              orderRevenue: orderRevenue,
              tournamentRevenue: tournamentRevenue,
              totalOrders: paidOrders.length,
              totalTournamentPayments: tournamentTransactions.length,
              revenueByDate: Object.values(revenueByDate),
            },
          };
          break;
        }

        case "activity": {
          // Get notifications (user activity)
          const notifications = await Notification.find({
            createdAt: { $gte: daysAgo },
          })
            .populate("user", "username email firstName lastName")
            .sort({ createdAt: -1 })
            .limit(1000);

          // Get user registrations
          const newUsers = await User.find({
            createdAt: { $gte: daysAgo },
          })
            .select("username email role createdAt")
            .sort({ createdAt: -1 })
            .limit(500);

          // Get tournament registrations
          const tournamentsForActivity = await Tournament.find({
            createdAt: { $gte: daysAgo },
          })
            .select("name registeredTeams registeredPlayers createdAt")
            .lean();

          // Get match activities
          const matches = await Match.find({
            createdAt: { $gte: daysAgo },
          })
            .select("tournament scheduledDate status createdAt")
            .populate("tournament", "name")
            .sort({ createdAt: -1 })
            .limit(500);

          // Aggregate activities by date and type
          const activityMap = {};
          const activities = [];

          // Process notifications
          notifications.forEach((notif) => {
            const dateKey = new Date(notif.createdAt)
              .toISOString()
              .split("T")[0];
            const key = `${dateKey}_${notif.type}`;
            if (!activityMap[key]) {
              activityMap[key] = {
                date: dateKey,
                action: notif.type.replace(/_/g, " "),
                count: 0,
              };
              activities.push(activityMap[key]);
            }
            activityMap[key].count += 1;
          });

          // Process user registrations
          newUsers.forEach((user) => {
            const dateKey = new Date(user.createdAt)
              .toISOString()
              .split("T")[0];
            const key = `${dateKey}_user_registration`;
            if (!activityMap[key]) {
              activityMap[key] = {
                date: dateKey,
                action: "user registration",
                count: 0,
              };
              activities.push(activityMap[key]);
            }
            activityMap[key].count += 1;
          });

          // Process tournament registrations
          tournamentsForActivity.forEach((tournament) => {
            const teamRegs = (tournament.registeredTeams || []).length;
            const playerRegs = (tournament.registeredPlayers || []).length;
            if (teamRegs > 0 || playerRegs > 0) {
              const dateKey = new Date(tournament.createdAt)
                .toISOString()
                .split("T")[0];
              const key = `${dateKey}_tournament_registration`;
              if (!activityMap[key]) {
                activityMap[key] = {
                  date: dateKey,
                  action: "tournament registration",
                  count: 0,
                };
                activities.push(activityMap[key]);
              }
              activityMap[key].count += teamRegs + playerRegs;
            }
          });

          // Process match activities
          matches.forEach((match) => {
            const dateKey = new Date(match.createdAt)
              .toISOString()
              .split("T")[0];
            const key = `${dateKey}_match_${match.status}`;
            if (!activityMap[key]) {
              activityMap[key] = {
                date: dateKey,
                action: `match ${match.status}`,
                count: 0,
              };
              activities.push(activityMap[key]);
            }
            activityMap[key].count += 1;
          });

          // Sort activities by date (newest first)
          activities.sort((a, b) => new Date(b.date) - new Date(a.date));

          // Calculate summary
          const totalNotifications = notifications.length;
          const totalUserRegistrations = newUsers.length;
          const totalTournamentRegistrations = tournamentsForActivity.reduce(
            (sum, t) =>
              sum +
              (t.registeredTeams?.length || 0) +
              (t.registeredPlayers?.length || 0),
            0,
          );
          const totalMatches = matches.length;

          reportData = {
            type: "activity",
            period: `${days} days`,
            activities: activities,
            summary: {
              totalNotifications: totalNotifications,
              totalUserRegistrations: totalUserRegistrations,
              totalTournamentRegistrations: totalTournamentRegistrations,
              totalMatches: totalMatches,
              activityByType: Object.values(activityMap).reduce((acc, act) => {
                if (!acc[act.action]) {
                  acc[act.action] = 0;
                }
                acc[act.action] += act.count;
                return acc;
              }, {}),
            },
          };
          break;
        }

        default:
          return res.status(400).json({ message: "Invalid report type" });
      }

      res.json(reportData);
    } catch (error) {
      res.status(500).json({
        message: "Server error generating report",
        error: error.message,
      });
    }
  },
);

// @route   GET /api/admin/settings/branding
// @desc    Get branding settings
// @access  Private/Admin
router.get(
  "/settings/branding",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      // In a real app, store this in a Settings model or config file
      const branding = {
        siteName: process.env.SITE_NAME || "The Arena",
        logo: "",
        primaryColor: "#1a1a2e",
        secondaryColor: "#16213e",
        tertiaryColor: "#0f3460",
        favicon: "",
        tagline: "",
      };

      res.json({ branding });
    } catch (error) {
      res.status(500).json({
        message: "Server error fetching branding",
        error: error.message,
      });
    }
  },
);

// @route   POST /api/admin/settings/branding
// @desc    Save branding settings
// @access  Private/Admin
router.post(
  "/settings/branding",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      // In a real app, save to Settings model or config file
      // For now, just return success
      res.json({
        message: "Branding settings saved successfully",
        branding: req.body,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error saving branding",
        error: error.message,
      });
    }
  },
);

// @route   GET /api/admin/settings/contact
// @desc    Get contact information
// @access  Private/Admin
router.get(
  "/settings/contact",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      let settings = await Settings.findOne({ type: "contact" });

      if (!settings) {
        // Return default structure if no settings exist
        const defaultContactInfo = {
          email: process.env.CONTACT_EMAIL || "",
          phone: process.env.CONTACT_PHONE || "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
          website: "",
          socialPageEnabled: true,
          shopPageEnabled: true,
          socialMedia: {
            facebook: "",
            twitter: "",
            instagram: "",
            linkedin: "",
            tiktok: "",
            youtube: "",
          },
        };
        return res.json({ contactInfo: defaultContactInfo });
      }

      res.json({ contactInfo: settings.data });
    } catch (error) {
      res.status(500).json({
        message: "Server error fetching contact info",
        error: error.message,
      });
    }
  },
);

// @route   POST /api/admin/settings/contact
// @desc    Save contact information
// @access  Private/Admin
router.post(
  "/settings/contact",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const contactInfo = req.body;

      let settings = await Settings.findOne({ type: "contact" });

      if (settings) {
        settings.data = contactInfo;
        settings.updatedBy = req.user._id;
        await settings.save();
      } else {
        settings = new Settings({
          type: "contact",
          data: contactInfo,
          updatedBy: req.user._id,
        });
        await settings.save();
      }

      res.json({
        message: "Contact information saved successfully",
        contactInfo: settings.data,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error saving contact info",
        error: error.message,
      });
    }
  },
);

// @route   GET /api/admin/teams
// @desc    Get all teams (for admin) with detailed roster and registered events
// @access  Private/Admin
router.get("/teams", authenticate, authorize("admin"), async (req, res) => {
  try {
    const playerFields =
      "username firstName lastName email phone memberCode isMinor dob guardianName guardianPhone role isActive isSuspended createdAt";

    const teams = await Team.find({ isActive: true })
      .populate("leader", playerFields)
      .populate("members", playerFields)
      .sort({ name: 1 })
      .lean();

    // Query registered events for each team
    const teamIds = teams.map((t) => t._id);
    const tournaments = await Tournament.find({
      "registeredTeams.team": { $in: teamIds },
    })
      .select("name startDate endDate status format entryFee registeredTeams")
      .lean();

    const teamTournamentsMap = {};
    tournaments.forEach((tourn) => {
      (tourn.registeredTeams || []).forEach((reg) => {
        if (reg.team) {
          const tId = reg.team.toString();
          if (!teamTournamentsMap[tId]) {
            teamTournamentsMap[tId] = [];
          }
          teamTournamentsMap[tId].push({
            _id: tourn._id,
            name: tourn.name,
            startDate: tourn.startDate,
            endDate: tourn.endDate,
            status: tourn.status,
            format: tourn.format,
            entryFee: tourn.entryFee,
            paymentStatus: reg.paymentStatus,
            paymentMethod: reg.paymentMethod,
            registeredAt: reg.registeredAt,
          });
        }
      });
    });

    teams.forEach((team) => {
      team.registeredEvents = teamTournamentsMap[team._id.toString()] || [];
    });

    res.json({ teams, count: teams.length });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching teams",
      error: error.message,
    });
  }
});

// @route   GET /api/admin/players
// @desc    Get all players (individual users with role "player")
// @access  Private/Admin
router.get("/players", authenticate, authorize("admin"), async (req, res) => {
  try {
    const players = await User.find({ role: "player", isActive: true })
      .select("-password")
      .sort({ username: 1 });

    res.json({ players, count: players.length });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching players",
      error: error.message,
    });
  }
});

// @route   GET /api/admin/players/without-team
// @desc    Get players without teams
// @access  Private/Admin
router.get(
  "/players/without-team",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const Team = (await import("../models/Team.js")).default;

      // Get all teams to find which players are already on teams
      const teams = await Team.find({}).select("members leader").lean();
      const playersInTeams = new Set();

      teams.forEach((team) => {
        if (team.leader) {
          playersInTeams.add(team.leader.toString());
        }
        (team.members || []).forEach((member) => {
          playersInTeams.add(member.toString());
        });
      });

      // Get all players and filter out those already in teams
      const allPlayers = await User.find({ role: "player", isActive: true })
        .select("-password")
        .sort({ username: 1 })
        .lean();

      const playersWithoutTeam = allPlayers.filter(
        (player) => !playersInTeams.has(player._id.toString()),
      );

      res.json({
        players: playersWithoutTeam,
        count: playersWithoutTeam.length,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error fetching players without teams",
        error: error.message,
      });
    }
  },
);

// @route   POST /api/admin/teams
// @desc    Create team with assigned players and leader
// @access  Private/Admin
router.post("/teams", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { name, playerIds, leaderId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Team name is required" });
    }

    if (!leaderId) {
      return res.status(400).json({ message: "Team leader is required" });
    }

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one player is required" });
    }

    // Verify leader is in the player list
    if (!playerIds.includes(leaderId)) {
      playerIds.push(leaderId);
    }

    const Team = (await import("../models/Team.js")).default;
    const { sendEmail } = await import("../services/email.service.js");
    const { createBulkNotifications } =
      await import("../services/notification.service.js");

    // Check if team name already exists
    const existingTeam = await Team.findOne({ name: name.trim() });
    if (existingTeam) {
      return res.status(400).json({ message: "Team name already exists" });
    }

    // Verify all players exist and are active
    const players = await User.find({
      _id: { $in: playerIds },
      role: "player",
      isActive: true,
    });

    if (players.length !== playerIds.length) {
      return res
        .status(400)
        .json({ message: "One or more players not found or inactive" });
    }

    // Verify leader exists and is a player
    const leader = await User.findById(leaderId);
    if (!leader || leader.role !== "player") {
      return res.status(400).json({ message: "Invalid team leader" });
    }

    // Check if any player is already on a team
    const teams = await Team.find({}).select("members leader").lean();
    const playersInTeams = new Set();
    teams.forEach((team) => {
      if (team.leader) {
        playersInTeams.add(team.leader.toString());
      }
      (team.members || []).forEach((member) => {
        playersInTeams.add(member.toString());
      });
    });

    const alreadyInTeam = playerIds.filter((id) =>
      playersInTeams.has(id.toString()),
    );
    if (alreadyInTeam.length > 0) {
      return res.status(400).json({
        message: `Some players are already on teams: ${alreadyInTeam.join(", ")}`,
      });
    }

    // Update leader role to team_leader
    leader.role = "team_leader";
    await leader.save();

    // Create team
    const team = new Team({
      name: name.trim(),
      leader: leaderId,
      members: playerIds,
      isActive: true,
    });

    await team.save();

    // Update all players to reference this team
    await User.updateMany(
      { _id: { $in: playerIds } },
      { $set: { team: team._id } },
    );

    // Send emails to all team members
    const populatedTeam = await Team.findById(team._id)
      .populate("leader", "username email firstName lastName")
      .populate("members", "username email firstName lastName")
      .lean();

    const emailPromises = [];
    const notificationPromises = [];

    for (const member of populatedTeam.members || []) {
      if (member.email) {
        const isLeader = member._id.toString() === leaderId.toString();

        // Send email
        emailPromises.push(
          sendEmail(member.email, "teamAssignment", {
            userName: member.firstName || member.username,
            teamName: team.name,
            leaderName:
              populatedTeam.leader?.firstName ||
              populatedTeam.leader?.username ||
              "Team Leader",
            leaderEmail: populatedTeam.leader?.email,
            isLeader: isLeader,
          }).catch((err) =>
            console.error(`Failed to send email to ${member.email}:`, err),
          ),
        );

        // Create notification
        notificationPromises.push(
          createBulkNotifications(
            [member._id],
            "team_announcement",
            "Team Assignment",
            `You have been assigned to team: ${team.name}`,
            { entityType: "Team", entityId: team._id },
            { sendEmail: false, sendSMS: false },
          ).catch((err) =>
            console.error(
              `Failed to create notification for ${member._id}:`,
              err,
            ),
          ),
        );
      }
    }

    // Wait for all emails and notifications
    await Promise.all([...emailPromises, ...notificationPromises]);

    const populatedTeamResponse = await Team.findById(team._id)
      .populate("leader", "username email firstName lastName")
      .populate("members", "username email firstName lastName");

    res.status(201).json({
      message: "Team created successfully",
      team: populatedTeamResponse,
    });
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({
      message: "Server error creating team",
      error: error.message,
    });
  }
});

// @route   GET /api/admin/teams/:id
// @desc    Get single team with leader and members (for admin)
// @access  Private/Admin
router.get("/teams/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const playerFields =
      "username firstName lastName email phone memberCode isMinor dob guardianName guardianPhone role isActive isSuspended createdAt";

    const team = await Team.findById(req.params.id)
      .populate("leader", playerFields)
      .populate("members", playerFields)
      .lean();

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const tournaments = await Tournament.find({
      "registeredTeams.team": team._id,
    })
      .select("name startDate endDate status format entryFee registeredTeams")
      .lean();

    team.registeredEvents = [];
    tournaments.forEach((tourn) => {
      (tourn.registeredTeams || []).forEach((reg) => {
        if (reg.team && reg.team.toString() === team._id.toString()) {
          team.registeredEvents.push({
            _id: tourn._id,
            name: tourn.name,
            startDate: tourn.startDate,
            endDate: tourn.endDate,
            status: tourn.status,
            format: tourn.format,
            entryFee: tourn.entryFee,
            paymentStatus: reg.paymentStatus,
            paymentMethod: reg.paymentMethod,
            registeredAt: reg.registeredAt,
          });
        }
      });
    });

    res.json({ team });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching team",
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/teams/:id/members
// @desc    Assign users to existing team
// @access  Private/Admin
router.put(
  "/teams/:id/members",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { playerIds } = req.body;
      const teamId = req.params.id;

      if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one player is required" });
      }

      const Team = (await import("../models/Team.js")).default;
      const { sendEmail } = await import("../services/email.service.js");
      const { createBulkNotifications } =
        await import("../services/notification.service.js");

      // Find the team
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Verify all players exist and are active
      const players = await User.find({
        _id: { $in: playerIds },
        role: "player",
        isActive: true,
      });

      if (players.length !== playerIds.length) {
        return res
          .status(400)
          .json({ message: "One or more players not found or inactive" });
      }

      // Check if any player is already on a team
      const teams = await Team.find({}).select("members leader").lean();
      const playersInTeams = new Set();
      teams.forEach((t) => {
        if (t.leader) {
          playersInTeams.add(t.leader.toString());
        }
        (t.members || []).forEach((member) => {
          playersInTeams.add(member.toString());
        });
      });

      const alreadyInTeam = playerIds.filter((id) => {
        const idStr = id.toString();
        // Allow if they're already in this team
        if (
          team.members.some((m) => m.toString() === idStr) ||
          team.leader.toString() === idStr
        ) {
          return false;
        }
        return playersInTeams.has(idStr);
      });

      if (alreadyInTeam.length > 0) {
        return res.status(400).json({
          message: `Some players are already on other teams`,
        });
      }

      // Add new members to team (avoid duplicates)
      const existingMemberIds = new Set([
        team.leader.toString(),
        ...team.members.map((m) => m.toString()),
      ]);

      const newMemberIds = playerIds.filter(
        (id) => !existingMemberIds.has(id.toString()),
      );

      if (newMemberIds.length === 0) {
        return res
          .status(400)
          .json({
            message: "All selected players are already members of this team",
          });
      }

      team.members.push(...newMemberIds);
      await team.save();

      // Update all new players to reference this team
      await User.updateMany(
        { _id: { $in: newMemberIds } },
        { $set: { team: team._id } },
      );

      // Send emails and notifications to new team members
      const populatedTeam = await Team.findById(team._id)
        .populate("leader", "username email firstName lastName")
        .populate("members", "username email firstName lastName")
        .lean();

      const newMembers = populatedTeam.members.filter((member) =>
        newMemberIds.includes(member._id.toString()),
      );

      const emailPromises = [];
      const notificationPromises = [];

      for (const member of newMembers) {
        if (member.email) {
          // Send email
          emailPromises.push(
            sendEmail(member.email, "teamAssignment", {
              userName: member.firstName || member.username,
              teamName: team.name,
              leaderName:
                populatedTeam.leader?.firstName ||
                populatedTeam.leader?.username ||
                "Team Leader",
              leaderEmail: populatedTeam.leader?.email,
              isLeader: false,
            }).catch((err) =>
              console.error(`Failed to send email to ${member.email}:`, err),
            ),
          );

          // Create notification
          notificationPromises.push(
            createBulkNotifications(
              [member._id],
              "team_announcement",
              "Team Assignment",
              `You have been assigned to team: ${team.name}`,
              { entityType: "Team", entityId: team._id },
              { sendEmail: false, sendSMS: false },
            ).catch((err) =>
              console.error(
                `Failed to create notification for ${member._id}:`,
                err,
              ),
            ),
          );
        }
      }

      // Wait for all emails and notifications
      await Promise.all([...emailPromises, ...notificationPromises]);

      const populatedTeamResponse = await Team.findById(team._id)
        .populate("leader", "username email firstName lastName")
        .populate("members", "username email firstName lastName");

      res.json({
        message: `Successfully assigned ${newMemberIds.length} player(s) to team`,
        team: populatedTeamResponse,
      });
    } catch (error) {
      console.error("Error assigning players to team:", error);
      res.status(500).json({
        message: "Server error assigning players to team",
        error: error.message,
      });
    }
  },
);

// @route   GET /api/admin/analytics/events
// @desc    Get event analytics data
// @access  Private/Admin
router.get(
  "/analytics/events",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const daysAgo = new Date();
      if (days !== "all") {
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      } else {
        daysAgo.setTime(0); // All time
      }

      // Get all tournaments
      const query = days === "all" ? {} : { createdAt: { $gte: daysAgo } };
      const tournaments = await Tournament.find(query)
        .populate("registeredTeams.team", "name")
        .populate("registeredPlayers.player", "username firstName lastName")
        .lean();

      // Calculate metrics
      let totalRegistrations = 0;
      let totalRevenue = 0;
      const revenueByEvent = [];
      const topPerformingEvents = [];
      const statusBreakdown = {};
      const registrationTrends = {};

      tournaments.forEach((tournament) => {
        const teamRegs = tournament.registeredTeams || [];
        const playerRegs = tournament.registeredPlayers || [];
        const totalRegs = teamRegs.length + playerRegs.length;
        totalRegistrations += totalRegs;

        // Count paid registrations for revenue
        const paidTeams = teamRegs.filter(
          (reg) => reg.paymentStatus === "paid",
        ).length;
        const paidPlayers = playerRegs.filter(
          (reg) => reg.paymentStatus === "paid",
        ).length;
        const paidCount = paidTeams + paidPlayers;
        const revenue = paidCount * (tournament.entryFee || 0);
        totalRevenue += revenue;

        // Status breakdown
        statusBreakdown[tournament.status] =
          (statusBreakdown[tournament.status] || 0) + 1;

        // Registration trends by date
        [...teamRegs, ...playerRegs].forEach((reg) => {
          const dateKey = new Date(
            reg.registeredAt || reg.createdAt || tournament.createdAt,
          )
            .toISOString()
            .split("T")[0];
          registrationTrends[dateKey] = (registrationTrends[dateKey] || 0) + 1;
        });

        // Top performing events
        topPerformingEvents.push({
          _id: tournament._id,
          name: tournament.name,
          status: tournament.status,
          totalRegistrations: totalRegs,
          teamRegistrations: teamRegs.length,
          playerRegistrations: playerRegs.length,
          revenue: revenue,
        });

        // Revenue by event
        if (revenue > 0) {
          revenueByEvent.push({
            name: tournament.name,
            revenue: revenue,
          });
        }
      });

      // Sort top performing events
      topPerformingEvents.sort(
        (a, b) => b.totalRegistrations - a.totalRegistrations,
      );

      // Convert registration trends to array and fill in missing dates
      let registrationTrendsArray = Object.entries(registrationTrends)
        .map(([date, count]) => ({ date, count: count || 0 }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Fill in missing dates in the range for better visualization
      if (registrationTrendsArray.length > 0 && days !== "all") {
        const startDate = new Date(daysAgo);
        const endDate = new Date();
        const filledTrends = [];
        const dateMap = new Map(
          registrationTrendsArray.map((t) => [t.date, t.count]),
        );

        // Generate all dates in range
        for (
          let d = new Date(startDate);
          d <= endDate;
          d.setDate(d.getDate() + 1)
        ) {
          const dateKey = d.toISOString().split("T")[0];
          filledTrends.push({
            date: dateKey,
            count: dateMap.get(dateKey) || 0,
          });
        }

        // If we have too many days, sample them (show last 30 days max for chart)
        if (filledTrends.length > 30) {
          const step = Math.ceil(filledTrends.length / 30);
          registrationTrendsArray = filledTrends.filter(
            (_, index) =>
              index % step === 0 || index === filledTrends.length - 1,
          );
        } else {
          registrationTrendsArray = filledTrends;
        }
      }

      const averageRegistrations =
        tournaments.length > 0 ? totalRegistrations / tournaments.length : 0;

      const completedCount = statusBreakdown.completed || 0;
      const completionRate =
        tournaments.length > 0
          ? (completedCount / tournaments.length) * 100
          : 0;

      res.json({
        tournaments: tournaments.slice(0, 100), // Limit for response size
        totalRegistrations,
        totalRevenue,
        averageRegistrations,
        completionRate,
        topPerformingEvents: topPerformingEvents.slice(0, 10),
        registrationTrends: registrationTrendsArray,
        revenueByEvent,
        statusBreakdown,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error fetching event analytics",
        error: error.message,
      });
    }
  },
);

// @route   GET /api/admin/analytics/participants
// @desc    Get participant tracking data
// @access  Private/Admin
router.get(
  "/analytics/participants",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { filterType = "all" } = req.query;

      // Get all teams with their members populated
      const allTeams = await Team.find({})
        .populate("leader", "username email firstName lastName role")
        .populate(
          "members",
          "username email firstName lastName role isActive team",
        )
        .lean();

      // Get all tournaments with registrations
      const tournaments = await Tournament.find({})
        .select("registeredTeams registeredPlayers")
        .populate("registeredTeams.team", "name leader members")
        .populate(
          "registeredPlayers.player",
          "username firstName lastName email role team",
        )
        .lean();

      // Track teams
      const teamMap = new Map();
      const playerMap = new Map();

      // First, add all team members to the player map
      allTeams.forEach((team) => {
        // Add team to team map
        const teamId = team._id.toString();
        teamMap.set(teamId, {
          _id: teamId,
          name: team.name,
          leader: team.leader,
          memberCount: (team.members || []).length,
          tournamentCount: 0,
          wins: 0,
          isActive: team.isActive !== false,
        });

        // Add leader to player map
        if (team.leader) {
          const leaderId =
            team.leader._id?.toString() || team.leader.toString();
          if (leaderId && team.leader.username) {
            if (!playerMap.has(leaderId)) {
              playerMap.set(leaderId, {
                _id: leaderId,
                username: team.leader.username,
                firstName: team.leader.firstName,
                lastName: team.leader.lastName,
                email: team.leader.email,
                role: team.leader.role || "team_leader",
                teamName: team.name,
                teamId: teamId,
                tournamentCount: 0,
                wins: 0,
                isActive: team.leader.isActive !== false,
              });
            } else {
              // Update team info if not set
              if (!playerMap.get(leaderId).teamName) {
                playerMap.get(leaderId).teamName = team.name;
                playerMap.get(leaderId).teamId = teamId;
              }
            }
          }
        }

        // Add all team members to player map
        (team.members || []).forEach((member) => {
          if (!member) return;

          // Handle both populated objects and ObjectIds
          const memberId = member._id?.toString() || member.toString();
          if (!memberId) return;

          // Only process if member is populated (has username)
          if (member.username) {
            if (!playerMap.has(memberId)) {
              playerMap.set(memberId, {
                _id: memberId,
                username: member.username,
                firstName: member.firstName,
                lastName: member.lastName,
                email: member.email,
                role: member.role || "player",
                teamName: team.name,
                teamId: teamId,
                tournamentCount: 0,
                wins: 0,
                isActive: member.isActive !== false,
              });
            } else {
              // Update team info if not set
              if (!playerMap.get(memberId).teamName) {
                playerMap.get(memberId).teamName = team.name;
                playerMap.get(memberId).teamId = teamId;
              }
            }
          }
        });
      });

      // Process tournament registrations
      tournaments.forEach((tournament) => {
        // Process team registrations - increment tournament count for team and all its members
        (tournament.registeredTeams || []).forEach((reg) => {
          if (reg.team && reg.team._id) {
            const teamId = reg.team._id.toString();
            if (teamMap.has(teamId)) {
              teamMap.get(teamId).tournamentCount += 1;
            }

            // Also increment tournament count for all team members
            const team = allTeams.find((t) => t._id.toString() === teamId);
            if (team) {
              const allTeamMembers = [
                team.leader,
                ...(team.members || []).filter(
                  (m) => m && m._id.toString() !== team.leader?._id?.toString(),
                ),
              ];
              allTeamMembers.forEach((member) => {
                if (member && member._id) {
                  const playerId = member._id.toString();
                  if (playerMap.has(playerId)) {
                    playerMap.get(playerId).tournamentCount += 1;
                  }
                }
              });
            }
          }
        });

        // Process individual player registrations
        (tournament.registeredPlayers || []).forEach((reg) => {
          if (reg.player && reg.player._id) {
            const playerId = reg.player._id.toString();
            if (!playerMap.has(playerId)) {
              // Add player if not already in map (from team membership)
              playerMap.set(playerId, {
                _id: playerId,
                username: reg.player.username,
                firstName: reg.player.firstName,
                lastName: reg.player.lastName,
                email: reg.player.email,
                role: reg.player.role || "player",
                teamName: reg.player.team?.name || null,
                teamId: reg.player.team?._id?.toString() || null,
                tournamentCount: 0,
                wins: 0,
                isActive: true,
              });
            }
            playerMap.get(playerId).tournamentCount += 1;
          }
        });
      });

      // Get match results for wins calculation
      const matches = await Match.find({
        status: "completed",
        result: { $exists: true },
      })
        .select("team1 team2 result")
        .populate("team1.team", "_id")
        .populate("team2.team", "_id")
        .lean();

      matches.forEach((match) => {
        if (match.result && match.result.winner) {
          const winnerId = match.result.winner.toString();
          if (teamMap.has(winnerId)) {
            teamMap.get(winnerId).wins += 1;
          }
        }
      });

      // Convert maps to arrays
      const teams = Array.from(teamMap.values());
      const players = Array.from(playerMap.values());

      // Calculate top participants
      const topParticipants = [
        ...teams.map((t) => ({ ...t, type: "team" })),
        ...players.map((p) => ({ ...p, type: "player", name: p.username })),
      ]
        .sort((a, b) => b.tournamentCount - a.tournamentCount)
        .slice(0, 20);

      // Calculate stats
      const activeParticipants =
        teams.filter((t) => t.isActive).length +
        players.filter((p) => p.isActive).length;

      const totalTournaments = teams.reduce(
        (sum, t) => sum + t.tournamentCount,
        0,
      );
      const averageTournaments =
        teams.length + players.length > 0
          ? totalTournaments / (teams.length + players.length)
          : 0;

      res.json({
        teams: filterType === "all" || filterType === "teams" ? teams : [],
        players:
          filterType === "all" || filterType === "players" ? players : [],
        topParticipants,
        participationStats: {
          totalTeams: teams.length,
          totalPlayers: players.length,
          activeParticipants,
          averageTournaments,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error fetching participant tracking",
        error: error.message,
      });
    }
  },
);

// @route   GET /api/admin/payments/stripe
// @desc    Get all Stripe payments (tournament and shop orders)
// @access  Private/Admin
router.get(
  "/payments/stripe",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { startDate, endDate, type, page = 1, limit = 50 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build date filter
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      const allPayments = [];

      // Normalize type filter - "all" or undefined means fetch both types
      const paymentType = type === "all" || !type ? null : type;

      // Fetch Tournament Payments (from registeredTeams and registeredPlayers)
      if (!paymentType || paymentType === "tournament") {
        // Fetch all tournaments and filter for paid registrations
        // This is more reliable than using $or with nested fields
        const tournaments = await Tournament.find({})
          .populate("registeredTeams.team", "name")
          .populate(
            "registeredPlayers.player",
            "username email firstName lastName",
          )
          .select("name entryFee registeredTeams registeredPlayers createdAt")
          .lean();

        tournaments.forEach((tournament) => {
          // Process team registrations
          (tournament.registeredTeams || []).forEach((reg) => {
            const isStripePayment =
              reg?.paymentMethod === "stripe" ||
              reg?.paymentMethod === "apple_pay" ||
              (!reg?.paymentMethod && !!reg?.paymentIntentId);
            if (reg && reg.paymentStatus === "paid" && isStripePayment) {
              const regDate = reg.registeredAt || tournament.createdAt;

              // Apply date filter if provided
              if (startDate || endDate) {
                const regDateObj = new Date(regDate);
                if (startDate && regDateObj < new Date(startDate)) return;
                if (endDate && regDateObj > new Date(endDate)) return;
              }

              // Only include if entry fee > 0 (free tournaments don't count as payments)
              if (tournament.entryFee > 0) {
                allPayments.push({
                  _id: `${tournament._id}-team-${reg._id || Date.now()}`,
                  type: "tournament",
                  tournamentId: tournament._id,
                  tournamentName: tournament.name,
                  payerType: "team",
                  payerName: reg.team?.name || "Unknown Team",
                  payerId: reg.team?._id || reg.team,
                  amount: tournament.entryFee || 0,
                  paymentStatus: "paid",
                  paymentMethod: reg.paymentMethod || "stripe",
                  date: regDate,
                  createdAt: regDate,
                });
              }
            }
          });

          // Process player registrations
          (tournament.registeredPlayers || []).forEach((reg) => {
            const isStripePayment =
              reg?.paymentMethod === "stripe" ||
              reg?.paymentMethod === "apple_pay" ||
              (!reg?.paymentMethod && !!reg?.paymentIntentId);
            if (reg && reg.paymentStatus === "paid" && isStripePayment) {
              const regDate = reg.registeredAt || tournament.createdAt;

              // Apply date filter if provided
              if (startDate || endDate) {
                const regDateObj = new Date(regDate);
                if (startDate && regDateObj < new Date(startDate)) return;
                if (endDate && regDateObj > new Date(endDate)) return;
              }

              // Only include if entry fee > 0 (free tournaments don't count as payments)
              if (tournament.entryFee > 0) {
                const player = reg.player;
                allPayments.push({
                  _id: `${tournament._id}-player-${reg._id || Date.now()}`,
                  type: "tournament",
                  tournamentId: tournament._id,
                  tournamentName: tournament.name,
                  payerType: "player",
                  payerName:
                    player?.firstName && player?.lastName
                      ? `${player.firstName} ${player.lastName}`
                      : player?.username || "Unknown Player",
                  payerId: player?._id || reg.player,
                  payerEmail: player?.email,
                  amount: tournament.entryFee || 0,
                  paymentStatus: "paid",
                  paymentMethod: reg.paymentMethod || "stripe",
                  date: regDate,
                  createdAt: regDate,
                });
              }
            }
          });
        });

        console.log(
          `Found ${allPayments.filter((p) => p.type === "tournament").length} tournament payments`,
        );
      }

      // Fetch Shop Orders (Stripe payments)
      if (!paymentType || paymentType === "order") {
        const orderFilter = {
          paymentMethod: "stripe",
          paymentStatus: "paid",
          ...dateFilter,
        };

        // Don't apply pagination here - we'll paginate after combining with tournament payments
        const orders = await Order.find(orderFilter)
          .populate("user", "username email firstName lastName")
          .populate("items.product", "name images")
          .sort({ createdAt: -1 })
          .lean();

        orders.forEach((order) => {
          const user = order.user;
          allPayments.push({
            _id: order._id,
            type: "order",
            orderNumber: order.orderNumber,
            orderId: order._id,
            payerName:
              user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.username || "Unknown User",
            payerId: user?._id || order.user,
            payerEmail: user?.email,
            amount: order.total || 0,
            subtotal: order.subtotal || 0,
            tax: order.tax || 0,
            shipping: order.shipping?.cost || 0,
            discount: order.discount || 0,
            items: order.items || [],
            itemCount: order.items?.length || 0,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            paymentIntentId: order.paymentIntentId,
            status: order.status,
            date: order.createdAt,
            createdAt: order.createdAt,
          });
        });

        console.log(
          `Found ${allPayments.filter((p) => p.type === "order").length} order payments`,
        );
      }

      console.log(`Total payments found: ${allPayments.length}`);

      // Sort by date (most recent first)
      allPayments.sort(
        (a, b) =>
          new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt),
      );

      // Calculate totals
      const totalRevenue = allPayments.reduce(
        (sum, p) => sum + (p.amount || 0),
        0,
      );
      const tournamentRevenue = allPayments
        .filter((p) => p.type === "tournament")
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const orderRevenue = allPayments
        .filter((p) => p.type === "order")
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      // Paginate
      const paginatedPayments = allPayments.slice(skip, skip + parseInt(limit));

      res.json({
        payments: paginatedPayments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: allPayments.length,
          pages: Math.ceil(allPayments.length / parseInt(limit)),
        },
        summary: {
          totalRevenue,
          tournamentRevenue,
          orderRevenue,
          totalCount: allPayments.length,
          tournamentCount: allPayments.filter((p) => p.type === "tournament")
            .length,
          orderCount: allPayments.filter((p) => p.type === "order").length,
        },
      });
    } catch (error) {
      console.error("Error fetching Stripe payments:", error);
      res.status(500).json({
        message: "Server error fetching Stripe payments",
        error: error.message,
      });
    }
  },
);

// @route   GET /api/admin/analytics/products-orders
// @desc    Get product and order analytics data
// @access  Private/Admin
router.get(
  "/analytics/products-orders",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const daysAgo = new Date();
      if (days !== "all") {
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      } else {
        daysAgo.setTime(0); // All time
      }

      // Product Analytics
      const allProducts = await Product.find().lean();

      // Product statistics
      const totalProducts = allProducts.length;
      const activeProducts = allProducts.filter(
        (p) => p.status === "active",
      ).length;
      const inactiveProducts = allProducts.filter(
        (p) => p.status === "inactive",
      ).length;
      const lowStockProducts = allProducts.filter(
        (p) => p.stock < 10 && p.stock > 0,
      ).length;
      const outOfStockProducts = allProducts.filter(
        (p) => p.stock === 0,
      ).length;

      // Category breakdown
      const categoryBreakdown = {
        apparel: allProducts.filter((p) => p.category === "apparel").length,
        accessories: allProducts.filter((p) => p.category === "accessories")
          .length,
        equipment: allProducts.filter((p) => p.category === "equipment").length,
      };

      // Top selling products (from orders)
      const orders = await Order.find({
        paymentStatus: "paid",
        createdAt: { $gte: daysAgo },
      })
        .populate("items.product", "name category")
        .lean();

      // Calculate product sales
      const productSales = {};
      orders.forEach((order) => {
        order.items.forEach((item) => {
          const productId =
            item.product?._id?.toString() || item.product?.toString();
          if (!productSales[productId]) {
            productSales[productId] = {
              productId,
              productName: item.name || item.product?.name || "Unknown",
              category: item.product?.category || "unknown",
              quantitySold: 0,
              revenue: 0,
            };
          }
          productSales[productId].quantitySold += item.quantity;
          productSales[productId].revenue += item.price * item.quantity;
        });
      });

      const topSellingProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Order Analytics
      const allOrders = await Order.find({
        createdAt: { $gte: daysAgo },
      })
        .populate("user", "username email firstName lastName")
        .populate("items.product", "name category")
        .sort({ createdAt: -1 })
        .lean();

      // Order statistics
      const totalOrders = allOrders.length;
      const paidOrders = allOrders.filter(
        (o) => o.paymentStatus === "paid",
      ).length;
      const pendingOrders = allOrders.filter(
        (o) => o.paymentStatus === "pending",
      ).length;
      const cancelledOrders = allOrders.filter(
        (o) => o.status === "cancelled",
      ).length;

      // Order status breakdown
      const orderStatusBreakdown = {
        pending: allOrders.filter((o) => o.status === "pending").length,
        processing: allOrders.filter((o) => o.status === "processing").length,
        confirmed: allOrders.filter((o) => o.status === "confirmed").length,
        shipped: allOrders.filter((o) => o.status === "shipped").length,
        delivered: allOrders.filter((o) => o.status === "delivered").length,
        cancelled: allOrders.filter((o) => o.status === "cancelled").length,
        refunded: allOrders.filter((o) => o.status === "refunded").length,
      };

      // Revenue calculations
      const totalRevenue = allOrders
        .filter((o) => o.paymentStatus === "paid")
        .reduce((sum, o) => sum + (o.total || 0), 0);
      const averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;

      // Sales trends (daily)
      const salesTrends = {};
      allOrders
        .filter((o) => o.paymentStatus === "paid")
        .forEach((order) => {
          const dateKey = new Date(order.createdAt).toISOString().split("T")[0];
          if (!salesTrends[dateKey]) {
            salesTrends[dateKey] = {
              date: dateKey,
              orders: 0,
              revenue: 0,
            };
          }
          salesTrends[dateKey].orders += 1;
          salesTrends[dateKey].revenue += order.total || 0;
        });

      // Fill in missing dates with zero
      const allDates = [];
      let currentDate = new Date(daysAgo);
      while (currentDate <= new Date()) {
        allDates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const filledSalesTrends = allDates.map((date) => ({
        date,
        orders: salesTrends[date]?.orders || 0,
        revenue: salesTrends[date]?.revenue || 0,
      }));

      // Payment method breakdown
      const paymentMethodBreakdown = {
        stripe: allOrders.filter((o) => o.paymentMethod === "stripe").length,
        apple_pay: allOrders.filter((o) => o.paymentMethod === "apple_pay")
          .length,
        paypal: allOrders.filter((o) => o.paymentMethod === "paypal").length,
        zelle: allOrders.filter((o) => o.paymentMethod === "zelle").length,
        cash_app: allOrders.filter((o) => o.paymentMethod === "cash_app")
          .length,
        other: allOrders.filter(
          (o) =>
            !o.paymentMethod ||
            (o.paymentMethod !== "stripe" &&
              o.paymentMethod !== "apple_pay" &&
              o.paymentMethod !== "paypal" &&
              o.paymentMethod !== "zelle" &&
              o.paymentMethod !== "cash_app"),
        ).length,
      };

      res.json({
        products: {
          total: totalProducts,
          active: activeProducts,
          inactive: inactiveProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
          categoryBreakdown,
          topSelling: topSellingProducts,
        },
        orders: {
          total: totalOrders,
          paid: paidOrders,
          pending: pendingOrders,
          cancelled: cancelledOrders,
          statusBreakdown: orderStatusBreakdown,
          paymentMethodBreakdown,
          totalRevenue,
          averageOrderValue,
          salesTrends: filledSalesTrends,
        },
      });
    } catch (error) {
      console.error("Error fetching product and order analytics:", error);
      res.status(500).json({
        message: "Server error fetching product and order analytics",
        error: error.message,
      });
    }
  },
);

// @route   GET /api/admin/contact-messages
// @desc    Get all contact messages with filtering and pagination
// @access  Private/Admin
router.get(
  "/contact-messages",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const {
        status,
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
        search,
      } = req.query;

      // Build query
      const query = {};
      if (status) {
        query.status = status;
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { subject: { $regex: search, $options: "i" } },
          { message: { $regex: search, $options: "i" } },
        ];
      }

      // Calculate pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Get total count
      const total = await Contact.countDocuments(query);

      // Get messages
      const messages = await Contact.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean();

      res.json({
        messages,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      res.status(500).json({
        message: "Server error fetching contact messages",
        error: error.message,
      });
    }
  },
);

// @route   GET /api/admin/contact-messages/:id
// @desc    Get a single contact message by ID
// @access  Private/Admin
router.get(
  "/contact-messages/:id([0-9a-fA-F]{24})",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }

      const message = await Contact.findById(id);

      if (!message) {
        return res.status(404).json({ message: "Contact message not found" });
      }

      res.json(message);
    } catch (error) {
      console.error("Error fetching contact message:", error);
      res.status(500).json({
        message: "Server error fetching contact message",
        error: error.message,
      });
    }
  },
);

// @route   PUT /api/admin/contact-messages/:id/status
// @desc    Update contact message status
// @access  Private/Admin
router.put(
  "/contact-messages/:id([0-9a-fA-F]{24})/status",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }

      const validStatuses = ["new", "read", "replied", "archived"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updateData = { status };
      const now = new Date();

      // Set timestamp based on status
      if (status === "read" && !updateData.readAt) {
        updateData.readAt = now;
      } else if (status === "replied" && !updateData.repliedAt) {
        updateData.repliedAt = now;
      } else if (status === "archived" && !updateData.archivedAt) {
        updateData.archivedAt = now;
      }

      // Add admin notes if provided
      if (adminNotes !== undefined) {
        updateData.adminNotes = adminNotes;
      }

      const message = await Contact.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!message) {
        return res.status(404).json({ message: "Contact message not found" });
      }

      res.json({
        message: "Contact message status updated successfully",
        contact: message,
      });
    } catch (error) {
      console.error("Error updating contact message status:", error);
      res.status(500).json({
        message: "Server error updating contact message status",
        error: error.message,
      });
    }
  },
);

// @route   DELETE /api/admin/contact-messages/:id
// @desc    Delete a contact message
// @access  Private/Admin
router.delete(
  "/contact-messages/:id([0-9a-fA-F]{24})",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }

      const message = await Contact.findByIdAndDelete(id);

      if (!message) {
        return res.status(404).json({ message: "Contact message not found" });
      }

      res.json({ message: "Contact message deleted successfully" });
    } catch (error) {
      console.error("Error deleting contact message:", error);
      res.status(500).json({
        message: "Server error deleting contact message",
        error: error.message,
      });
    }
  },
);

// @route   GET /api/admin/contact-messages/stats
// @desc    Get contact messages statistics
// @access  Private/Admin
router.get(
  "/contact-messages/stats",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const total = await Contact.countDocuments();
      const newCount = await Contact.countDocuments({ status: "new" });
      const readCount = await Contact.countDocuments({ status: "read" });
      const repliedCount = await Contact.countDocuments({ status: "replied" });
      const archivedCount = await Contact.countDocuments({
        status: "archived",
      });

      // Get messages from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentCount = await Contact.countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
      });

      res.json({
        total,
        new: newCount,
        read: readCount,
        replied: repliedCount,
        archived: archivedCount,
        recent: recentCount,
      });
    } catch (error) {
      console.error("Error fetching contact messages stats:", error);
      res.status(500).json({
        message: "Server error fetching contact messages stats",
        error: error.message,
      });
    }
  },
);

export default router;
