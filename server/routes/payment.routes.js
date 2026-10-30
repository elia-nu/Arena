import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import Settings from "../models/Settings.js";
import Tournament from "../models/Tournament.js";
import Team from "../models/Team.js";

const router = express.Router();

const calculateTournamentPaymentAmount = async ({ tournamentId, teamId }) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    return { error: "Tournament not found" };
  }

  if (teamId) {
    const team = await Team.findById(teamId);
    if (!team) {
      return { error: "Team not found" };
    }

    const teamMemberCount = team.members?.length || 0;
    const totalAmount = (tournament.entryFee || 0) * teamMemberCount;

    return { amount: totalAmount, teamMemberCount };
  }

  return { amount: tournament.entryFee || 0, teamMemberCount: 1 };
};

// Get registration fee (public endpoint)
router.get("/registration-fee", async (req, res) => {
  try {
    const settings = await Settings.findOne({ type: "general" });
    const registrationFee = settings?.data?.registrationFee || 0;
    res.json({ registrationFee });
  } catch (error) {
    console.error("Error fetching registration fee:", error);
    res.json({ registrationFee: 0 }); // Default to 0 if error
  }
});

// Admin: Get registration fee settings
router.get(
  "/admin/registration-fee",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const settings = await Settings.findOne({ type: "general" });
      res.json({
        registrationFee: settings?.data?.registrationFee || 0,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error fetching registration fee",
        error: error.message,
      });
    }
  }
);

// Admin: Save registration fee
router.post(
  "/admin/registration-fee",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { registrationFee } = req.body;

      if (registrationFee === undefined || registrationFee < 0) {
        return res.status(400).json({
          message: "Registration fee must be a non-negative number",
        });
      }

      // Find or create general settings
      let settings = await Settings.findOne({ type: "general" });

      if (!settings) {
        settings = new Settings({
          type: "general",
          data: { registrationFee: parseFloat(registrationFee) || 0 },
          updatedBy: req.user._id,
        });
      } else {
        settings.data = {
          ...settings.data,
          registrationFee: parseFloat(registrationFee) || 0,
        };
        settings.updatedBy = req.user._id;
      }

      await settings.save();

      res.json({
        message: "Registration fee saved successfully",
        registrationFee: settings.data.registrationFee,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error saving registration fee",
        error: error.message,
      });
    }
  }
);

// Admin: Get payment settings
router.get(
  "/admin/payment-settings",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const settings = await Settings.findOne({ type: "payment" });
      if (!settings) {
        return res.json({
          stripe: { publishableKey: "", secretKey: "", webhookSecret: "" },
          paypal: { clientId: "", clientSecret: "", webhookId: "" },
          other: { name: "", apiKey: "", webhookSecret: "" },
          zelle: { qrCodeImage: "/zelle.jpg", email: "", phone: "", name: "" },
          cashApp: { qrCodeImage: "", cashTag: "", name: "" },
          activeGateway: "stripe",
        });
      }
      res.json(settings.data);
    } catch (error) {
      res.status(500).json({
        message: "Server error fetching payment settings",
        error: error.message,
      });
    }
  }
);

// Admin: Save payment settings
router.post(
  "/admin/payment-settings",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { stripe, paypal, other, zelle, cashApp, activeGateway } = req.body;

      // Find or create settings
      let settings = await Settings.findOne({ type: "payment" });

      if (settings) {
        // Update existing settings
        settings.data = {
          stripe: {
            publishableKey: stripe?.publishableKey || "",
            secretKey: stripe?.secretKey || "",
            webhookSecret: stripe?.webhookSecret || "",
          },
          paypal: {
            clientId: paypal?.clientId || "",
            clientSecret: paypal?.clientSecret || "",
            webhookId: paypal?.webhookId || "",
          },
          other: {
            name: other?.name || "",
            apiKey: other?.apiKey || "",
            webhookSecret: other?.webhookSecret || "",
          },
          zelle: {
            qrCodeImage: zelle?.qrCodeImage || "",
            email: zelle?.email || "",
            phone: zelle?.phone || "",
            name: zelle?.name || "",
          },
          cashApp: {
            qrCodeImage: cashApp?.qrCodeImage || "",
            cashTag: cashApp?.cashTag || "",
            name: cashApp?.name || "",
          },
          activeGateway: activeGateway || "stripe",
        };
        settings.updatedBy = req.user._id;
        await settings.save();
      } else {
        // Create new settings
        settings = new Settings({
          type: "payment",
          data: {
            stripe: {
              publishableKey: stripe?.publishableKey || "",
              secretKey: stripe?.secretKey || "",
              webhookSecret: stripe?.webhookSecret || "",
            },
            paypal: {
              clientId: paypal?.clientId || "",
              clientSecret: paypal?.clientSecret || "",
              webhookId: paypal?.webhookId || "",
            },
            other: {
              name: other?.name || "",
              apiKey: other?.apiKey || "",
              webhookSecret: other?.webhookSecret || "",
            },
            zelle: {
              qrCodeImage: zelle?.qrCodeImage || "",
              email: zelle?.email || "",
              phone: zelle?.phone || "",
              name: zelle?.name || "",
            },
            cashApp: {
              qrCodeImage: cashApp?.qrCodeImage || "",
              cashTag: cashApp?.cashTag || "",
              name: cashApp?.name || "",
            },
            activeGateway: activeGateway || "stripe",
          },
          updatedBy: req.user._id,
        });
        await settings.save();
      }

      // Log for debugging (without exposing secrets)
      console.log("Payment settings saved:", {
        activeGateway,
        hasStripeKeys: !!(stripe?.publishableKey && stripe?.secretKey),
        hasPaypalKeys: !!(paypal?.clientId && paypal?.clientSecret),
        hasOtherKeys: !!(other?.name && other?.apiKey),
        hasZelleConfig: !!(zelle?.qrCodeImage || zelle?.email || zelle?.phone),
        hasCashAppConfig: !!(cashApp?.qrCodeImage || cashApp?.cashTag),
      });

      res.json({
        message: "Payment settings saved successfully",
        // Don't return sensitive data
        saved: true,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error saving payment settings",
        error: error.message,
      });
    }
  }
);

// Create a checkout session for registration
router.post("/session", async (req, res) => {
  try {
    const {
      amount,
      currency = "usd",
      email,
      userId,
      registrationType,
      metadata = {},
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    if (!email && registrationType !== "team") {
      return res.status(400).json({ message: "Email is required" });
    }

    const { createRegistrationCheckoutSession } = await import(
      "../services/stripe.service.js"
    );
    const result = await createRegistrationCheckoutSession({
      amount,
      currency,
      email,
      userId,
      registrationType,
      metadata,
    });

    if (result.success) {
      res.json({
        sessionId: result.sessionId,
        checkoutUrl: result.checkoutUrl,
        amount,
        currency,
      });
    } else {
      res.status(500).json({
        message: "Failed to create checkout session",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error creating payment session:", error);
    res.status(500).json({
      message: "Server error creating payment session",
      error: error.message,
    });
  }
});

// Verify payment session
router.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { verifyPaymentSession } = await import(
      "../services/stripe.service.js"
    );
    const result = await verifyPaymentSession(sessionId);

    // If payment is successful and it's a tournament payment, update the payment status
    if (result.success && result.paymentStatus === "paid" && result.session?.metadata?.type === "tournament_entry") {
      const { tournamentId, teamId, userId, registrationId } = result.session.metadata;
      
      if (tournamentId) {
        try {
          // Update payment status directly
          const Tournament = (await import("../models/Tournament.js")).default;
          const mongoose = (await import("mongoose")).default;
          
          const tournament = await Tournament.findById(tournamentId);
          
          if (tournament) {
            let registration = null;

            // Find by registrationId first
            if (registrationId) {
              const registrationObjectId = typeof registrationId === "string" 
                ? new mongoose.Types.ObjectId(registrationId) 
                : registrationId;

              registration = tournament.registeredTeams.find(
                (reg) => reg._id && reg._id.toString() === registrationObjectId.toString()
              ) || tournament.registeredPlayers.find(
                (reg) => reg._id && reg._id.toString() === registrationObjectId.toString()
              );
            }

            // Fallback to teamId or userId
            if (!registration) {
              if (teamId) {
                const teamObjectId = typeof teamId === "string" 
                  ? new mongoose.Types.ObjectId(teamId) 
                  : teamId;
                registration = tournament.registeredTeams.find(
                  (reg) => {
                    const regTeamId = reg.team?._id?.toString() || reg.team?.toString();
                    return regTeamId === teamObjectId.toString();
                  }
                );
              } else if (userId) {
                const userObjectId = typeof userId === "string" 
                  ? new mongoose.Types.ObjectId(userId) 
                  : userId;
                registration = tournament.registeredPlayers.find(
                  (reg) => {
                    const regPlayerId = reg.player?._id?.toString() || reg.player?.toString();
                    return regPlayerId === userObjectId.toString();
                  }
                );
              }
            }

            if (registration && registration.paymentStatus !== "paid") {
              registration.paymentStatus = "paid";
              registration.paymentSessionId = sessionId;
              registration.paidAt = new Date();
              await tournament.save();
              console.log("✅ Payment status updated via session verification:", {
                tournamentId: tournamentId.toString(),
                sessionId
              });
            }
          }
        } catch (updateError) {
          console.error("Error updating payment status during verification:", updateError);
          // Don't fail the verification if update fails
        }
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "Server error verifying payment",
      error: error.message,
    });
  }
});

// Create checkout session for products
router.post("/checkout/products", async (req, res) => {
  try {
    const {
      items,
      currency = "usd",
      email,
      userId,
      shippingAddress,
      metadata = {},
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const { createProductCheckoutSession } = await import(
      "../services/stripe.service.js"
    );
    const result = await createProductCheckoutSession({
      items,
      currency,
      email,
      userId,
      shippingAddress,
      metadata,
    });

    if (result.success) {
      res.json({
        sessionId: result.sessionId,
        checkoutUrl: result.checkoutUrl,
      });
    } else {
      res.status(500).json({
        message: "Failed to create checkout session",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error creating product checkout session:", error);
    res.status(500).json({
      message: "Server error creating checkout session",
      error: error.message,
    });
  }
});

// Get Zelle payment info (public endpoint)
router.get("/zelle/info", async (req, res) => {
  try {
    const settings = await Settings.findOne({ type: "payment" });
    
    // Default to /zelle.jpg from public folder if not configured
    const defaultZelleInfo = {
      qrCodeImage: "/zelle.jpg",
      email: "",
      phone: "",
      name: "",
    };

    if (!settings || !settings.data?.zelle) {
      return res.json(defaultZelleInfo);
    }

    res.json({
      qrCodeImage: settings.data.zelle.qrCodeImage || "/zelle.jpg",
      email: settings.data.zelle.email || "",
      phone: settings.data.zelle.phone || "",
      name: settings.data.zelle.name || "",
    });
  } catch (error) {
    console.error("Error fetching Zelle payment info:", error);
    res.status(500).json({
      message: "Server error fetching Zelle payment info",
      error: error.message,
    });
  }
});

// Get Cash App payment info (public endpoint)
router.get("/cash-app/info", async (req, res) => {
  try {
    const settings = await Settings.findOne({ type: "payment" });

    const defaultCashAppInfo = {
      qrCodeImage: "",
      cashTag: "",
      name: "",
    };

    if (!settings || !settings.data?.cashApp) {
      return res.json(defaultCashAppInfo);
    }

    res.json({
      qrCodeImage: settings.data.cashApp.qrCodeImage || "",
      cashTag: settings.data.cashApp.cashTag || "",
      name: settings.data.cashApp.name || "",
    });
  } catch (error) {
    console.error("Error fetching Cash App payment info:", error);
    res.status(500).json({
      message: "Server error fetching Cash App payment info",
      error: error.message,
    });
  }
});

// Get Stripe publishable key (for frontend initialization)
router.get("/stripe/publishable-key", authenticate, async (req, res) => {
  try {
    const settings = await Settings.findOne({ type: "payment" });
    
    if (!settings || !settings.data?.stripe?.publishableKey) {
      return res.status(404).json({
        message: "Stripe publishable key not configured",
      });
    }

    res.json({
      publishableKey: settings.data.stripe.publishableKey,
    });
  } catch (error) {
    console.error("Error fetching Stripe publishable key:", error);
    res.status(500).json({
      message: "Server error fetching publishable key",
      error: error.message,
    });
  }
});

// Create payment intent for tournament registration (modal payment)
router.post("/tournament/payment-intent", authenticate, async (req, res) => {
  try {
    const {
      currency = "usd",
      email,
      tournamentId,
      teamId,
      userId,
      registrationId,
      metadata = {},
    } = req.body;

    if (!tournamentId) {
      return res.status(400).json({
        message: "Tournament ID is required",
      });
    }

    // For individual registration, userId is required; for team registration, teamId is required
    if (!teamId && !userId) {
      return res.status(400).json({
        message: "Either Team ID (for team registration) or User ID (for individual registration) is required",
      });
    }

    if (!email && !req.user.email) {
      return res.status(400).json({
        message: "Email is required for payment",
      });
    }

    const amountResult = await calculateTournamentPaymentAmount({
      tournamentId,
      teamId,
    });
    if (amountResult.error) {
      return res.status(404).json({ message: amountResult.error });
    }
    if (!amountResult.amount || amountResult.amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const { createTournamentPaymentIntent } = await import(
      "../services/stripe.service.js"
    );
    
    const result = await createTournamentPaymentIntent({
      amount: amountResult.amount,
      currency,
      email: email || req.user.email,
      userId: userId || req.user._id,
      tournamentId,
      teamId,
      registrationId,
      metadata,
    });

    if (result.success && result.clientSecret) {
      res.json({
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
      });
    } else {
      res.status(500).json({
        message: "Failed to create payment intent",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({
      message: "Server error creating payment intent",
      error: error.message,
    });
  }
});

// Create payment intent for shop orders (modal payment)
router.post("/shop/payment-intent", authenticate, async (req, res) => {
  try {
    const {
      amount,
      currency = "usd",
      email,
      items,
      metadata = {},
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    if (!email && !req.user.email) {
      return res.status(400).json({
        message: "Email is required for payment",
      });
    }

    const { createShopPaymentIntent } = await import(
      "../services/stripe.service.js"
    );
    
    const result = await createShopPaymentIntent({
      amount,
      currency,
      email: email || req.user.email,
      userId: req.user._id,
      items,
      metadata,
    });

    if (result.success && result.clientSecret) {
      res.json({
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
      });
    } else {
      res.status(500).json({
        message: "Failed to create payment intent",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error creating shop payment intent:", error);
    res.status(500).json({
      message: "Server error creating payment intent",
      error: error.message,
    });
  }
});

// Create checkout session for tournament entry fee
router.post("/checkout/tournament", authenticate, async (req, res) => {
  try {
    console.log("=== Creating tournament checkout session ===");
    console.log("Request body:", req.body);
    console.log("User:", req.user._id.toString());

    const {
      currency = "usd",
      email,
      tournamentId,
      teamId,
      registrationId,
      metadata = {},
    } = req.body;

    if (!tournamentId || !teamId) {
      return res.status(400).json({
        message: "Tournament ID and Team ID are required",
      });
    }

    if (!email && !req.user.email) {
      return res.status(400).json({
        message: "Email is required for payment",
      });
    }

    const amountResult = await calculateTournamentPaymentAmount({
      tournamentId,
      teamId,
    });
    if (amountResult.error) {
      return res.status(404).json({ message: amountResult.error });
    }
    if (!amountResult.amount || amountResult.amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const { createTournamentCheckoutSession } = await import(
      "../services/stripe.service.js"
    );
    
    const result = await createTournamentCheckoutSession({
      amount: amountResult.amount,
      currency,
      email: email || req.user.email,
      userId: req.user._id,
      tournamentId,
      teamId,
      registrationId,
      metadata,
    });

    console.log("Stripe checkout result:", {
      success: result.success,
      hasCheckoutUrl: !!result.checkoutUrl,
      error: result.error
    });

    if (result.success && result.checkoutUrl) {
      res.json({
        sessionId: result.sessionId,
        checkoutUrl: result.checkoutUrl,
        amount: amountResult.amount,
        currency,
      });
    } else {
      console.error("Stripe checkout failed:", result.error);
      const errorMessage = result.error || "Stripe configuration error. Please check payment settings.";
      res.status(500).json({
        message: "Failed to create checkout session",
        error: errorMessage,
      });
    }
  } catch (error) {
    console.error("=== ERROR creating tournament checkout session ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Server error creating checkout session",
      error: error.message,
    });
  }
});

// Update tournament registration payment status
router.post("/tournament/update-payment", authenticate, async (req, res) => {
  try {
    console.log("=== Updating tournament payment status ===");
    console.log("Request body:", req.body);

    const { tournamentId, teamId, userId, registrationId, paymentStatus, sessionId, paymentMethod, zellePayment } = req.body;

    if (!tournamentId || !paymentStatus) {
      return res.status(400).json({
        message: "Tournament ID and Payment Status are required",
      });
    }

    if (!teamId && !userId && !registrationId) {
      return res.status(400).json({
        message: "Team ID, User ID, or Registration ID is required",
      });
    }

    const Tournament = (await import("../models/Tournament.js")).default;
    const mongoose = (await import("mongoose")).default;
    
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      console.error("Tournament not found:", tournamentId);
      return res.status(404).json({ message: "Tournament not found" });
    }

    let registration = null;
    let registrationType = null;

    // First, try to find by registrationId (most reliable)
    if (registrationId) {
      const registrationObjectId = typeof registrationId === "string" 
        ? new mongoose.Types.ObjectId(registrationId) 
        : registrationId;

      registration = tournament.registeredTeams.find(
        (reg) => reg._id && reg._id.toString() === registrationObjectId.toString()
      );
      if (registration) {
        registrationType = "team";
      } else {
        registration = tournament.registeredPlayers.find(
          (reg) => reg._id && reg._id.toString() === registrationObjectId.toString()
        );
        if (registration) {
          registrationType = "individual";
        }
      }
    }

    // Fallback: find by teamId
    if (!registration && teamId) {
      const teamObjectId = typeof teamId === "string" 
        ? new mongoose.Types.ObjectId(teamId) 
        : teamId;

      registration = tournament.registeredTeams.find(
        (reg) => {
          const regTeamId = reg.team?._id 
            ? reg.team._id.toString() 
            : (reg.team?.toString ? reg.team.toString() : String(reg.team));
          return regTeamId === teamObjectId.toString();
        }
      );
      if (registration) {
        registrationType = "team";
      }
    }

    // Fallback: find by userId for individual registrations
    if (!registration && userId) {
      const userObjectId = typeof userId === "string" 
        ? new mongoose.Types.ObjectId(userId) 
        : userId;

      registration = tournament.registeredPlayers.find(
        (reg) => {
          const regPlayerId = reg.player?._id 
            ? reg.player._id.toString() 
            : (reg.player?.toString ? reg.player.toString() : String(reg.player));
          return regPlayerId === userObjectId.toString();
        }
      );
      if (registration) {
        registrationType = "individual";
      }
    }

    if (!registration) {
      console.error("❌ Registration not found:", {
        tournamentId: tournamentId.toString(),
        teamId: teamId?.toString(),
        userId: userId?.toString(),
        registrationId: registrationId?.toString(),
        registeredTeamsCount: tournament.registeredTeams.length,
        registeredPlayersCount: tournament.registeredPlayers.length,
      });
      return res.status(404).json({
        message: "Registration not found for this tournament",
      });
    }

    console.log("Found registration, updating payment status:", {
      registrationType,
      oldStatus: registration.paymentStatus,
      newStatus: paymentStatus
    });

    registration.paymentStatus = paymentStatus;
    if (paymentMethod) {
      registration.paymentMethod = paymentMethod;
    }
    if (sessionId) {
      registration.paymentSessionId = sessionId;
      registration.paidAt = new Date();
    }
    if (zellePayment) {
      registration.zellePayment = zellePayment;
    }

    await tournament.save();

    console.log("✅ Payment status updated successfully");

    // Send confirmation email after payment is completed
    if (paymentStatus === "paid" && tournament.entryFee > 0) {
      try {
        const { createNotification } = await import("../services/notification.service.js");
        const User = (await import("../models/User.js")).default;
        
        // Get the user ID based on registration type
        let userIdToNotify = null;
        let teamName = null;
        if (registrationType === "team") {
          // For team registrations, get the team leader
          const Team = (await import("../models/Team.js")).default;
          const team = await Team.findById(teamId).populate("leader");
          userIdToNotify = team?.leader?._id || req.user._id;
          teamName = team?.name || null;
        } else {
          // For individual registrations, use the userId from request or find from registration
          userIdToNotify = userId || req.user._id;
        }

        if (userIdToNotify) {
          const registrationMessage = registrationType === "team" 
            ? `Your team's registration and payment for ${tournament.name} has been confirmed`
            : `Your registration and payment for ${tournament.name} has been confirmed`;
          
          await createNotification(
            userIdToNotify,
            "tournament_registration",
            "Registration & Payment Confirmed",
            registrationMessage,
            { entityType: "Tournament", entityId: tournament._id },
            {
              sendEmail: true,
              sendSMS: false,
              emailData: {
                tournamentName: tournament.name,
                startDate: tournament.startDate,
                location: tournament.location,
                entryFee: tournament.entryFee,
                registrationType: registrationType,
                teamName,
                paymentUrl: null,
                requiresPayment: false,
                paymentStatus: "paid", // Payment already completed
              },
            }
          );
        }
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
        // Don't fail the payment update if email fails
      }
    }

    res.json({
      message: "Payment status updated successfully",
      tournament,
    });
  } catch (error) {
    console.error("❌ Error updating payment status:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Server error updating payment status",
      error: error.message,
    });
  }
});

// Stripe webhook endpoint
router.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.headers["stripe-signature"];
      const { handleStripeWebhook } = await import(
        "../services/stripe.service.js"
      );

      console.log("=== Webhook received ===", {
        hasSignature: !!signature,
        contentType: req.headers["content-type"],
        bodyLength: req.body?.length
      });

      let event;
      try {
        event = await handleStripeWebhook(req.body, signature);
        console.log("Webhook event type:", event.type);
      } catch (webhookError) {
        console.error("❌ Webhook signature verification failed:", webhookError.message);
        // In development, you might want to allow this, but in production this should fail
        if (process.env.NODE_ENV === "development") {
          console.warn("⚠️  Development mode: Attempting to parse event without signature verification");
          try {
            event = JSON.parse(req.body.toString());
          } catch (parseError) {
            throw webhookError;
          }
        } else {
          throw webhookError;
        }
      }

      // Handle the event
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        console.log("=== Payment successful for session ===", session.id);
        console.log("Session metadata:", session.metadata);

        const { userId, registrationType, tournamentId, teamId, registrationId, type } =
          session.metadata || {};

        // Handle tournament entry fee payment
        if (type === "tournament_entry" && tournamentId) {
          try {
            const Tournament = (await import("../models/Tournament.js")).default;
            const mongoose = (await import("mongoose")).default;
            
            console.log("=== Updating tournament payment status ===", {
              tournamentId,
              teamId,
              registrationId,
              userId,
              sessionId: session.id
            });

            const tournament = await Tournament.findById(tournamentId);

            if (!tournament) {
              console.error("❌ Tournament not found:", tournamentId);
              return;
            }

            let registration = null;
            let registrationType = null;

            // First, try to find by registrationId (most reliable)
            if (registrationId) {
              const registrationObjectId = typeof registrationId === "string" 
                ? new mongoose.Types.ObjectId(registrationId) 
                : registrationId;

              // Check in registeredTeams
              registration = tournament.registeredTeams.find(
                (reg) => reg._id && reg._id.toString() === registrationObjectId.toString()
              );
              if (registration) {
                registrationType = "team";
              } else {
                // Check in registeredPlayers
                registration = tournament.registeredPlayers.find(
                  (reg) => reg._id && reg._id.toString() === registrationObjectId.toString()
                );
                if (registration) {
                  registrationType = "individual";
                }
              }
            }

            // Fallback: find by teamId or userId if registrationId not found
            if (!registration && teamId) {
              const teamObjectId = typeof teamId === "string" 
                ? new mongoose.Types.ObjectId(teamId) 
                : teamId;

              registration = tournament.registeredTeams.find(
                (reg) => {
                  const regTeamId = reg.team?._id 
                    ? reg.team._id.toString() 
                    : (reg.team?.toString ? reg.team.toString() : String(reg.team));
                  return regTeamId === teamObjectId.toString();
                }
              );
              if (registration) {
                registrationType = "team";
              }
            }

            // Fallback: find by userId for individual registrations
            if (!registration && userId) {
              const userObjectId = typeof userId === "string" 
                ? new mongoose.Types.ObjectId(userId) 
                : userId;

              registration = tournament.registeredPlayers.find(
                (reg) => {
                  const regPlayerId = reg.player?._id 
                    ? reg.player._id.toString() 
                    : (reg.player?.toString ? reg.player.toString() : String(reg.player));
                  return regPlayerId === userObjectId.toString();
                }
              );
              if (registration) {
                registrationType = "individual";
              }
            }

            if (registration) {
              registration.paymentStatus = "paid";
              registration.paymentSessionId = session.id;
              registration.paidAt = new Date();
              await tournament.save();
              console.log("✅ Tournament payment status updated successfully:", {
                tournamentId: tournamentId.toString(),
                registrationType,
                registrationId: registration._id?.toString(),
                paymentStatus: "paid",
                sessionId: session.id
              });
            } else {
              console.error("❌ Registration not found:", {
                tournamentId: tournamentId.toString(),
                teamId: teamId?.toString(),
                userId: userId?.toString(),
                registrationId: registrationId?.toString(),
                registeredTeamsCount: tournament.registeredTeams.length,
                registeredPlayersCount: tournament.registeredPlayers.length,
                registeredTeams: tournament.registeredTeams.map(r => ({
                  id: r._id?.toString(),
                  team: r.team?.toString(),
                  paymentStatus: r.paymentStatus
                })),
                registeredPlayers: tournament.registeredPlayers.map(r => ({
                  id: r._id?.toString(),
                  player: r.player?.toString(),
                  paymentStatus: r.paymentStatus
                }))
              });
            }
          } catch (error) {
            console.error("❌ Error updating tournament payment:", error);
            console.error("Error stack:", error.stack);
          }
        }

        if (userId && registrationType) {
          // Update user payment status or complete registration
          // This is handled in the registration flow
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
