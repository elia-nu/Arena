import Stripe from "stripe";
import Settings from "../models/Settings.js";

// Get Stripe instance with secret key from settings
const getStripe = async () => {
  try {
    const settings = await Settings.findOne({ type: "payment" });

    if (!settings || !settings.data?.stripe?.secretKey) {
      throw new Error(
        "Stripe secret key not configured. Please configure payment settings in admin dashboard."
      );
    }

    const stripe = new Stripe(settings.data.stripe.secretKey);

    return stripe;
  } catch (error) {
    console.error("Error initializing Stripe:", error);
    throw error;
  }
};

// Create a checkout session for registration
export const createRegistrationCheckoutSession = async (data) => {
  try {
    const stripe = await getStripe();
    const {
      amount,
      currency = "usd",
      email,
      userId,
      registrationType,
      metadata = {},
    } = data;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Registration Fee - ${
                registrationType === "team" ? "Team" : "Individual"
              }`,
              description: `Registration fee for ${registrationType} account`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      ...(email ? { customer_email: email } : {}),
      success_url: `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/register?session_id={CHECKOUT_SESSION_ID}&payment=success`,
      cancel_url: `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/register?canceled=true`,
      metadata: {
        userId: userId?.toString(),
        registrationType,
        ...metadata,
      },
    });

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
      success: true,
    };
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Verify payment session
export const verifyPaymentSession = async (sessionId) => {
  try {
    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return {
      success: session.payment_status === "paid",
      session,
      paymentStatus: session.payment_status,
    };
  } catch (error) {
    console.error("Error verifying payment session:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Create a checkout session for products
export const createProductCheckoutSession = async (data) => {
  try {
    const stripe = await getStripe();
    const {
      items,
      currency = "usd",
      email,
      userId,
      shippingAddress,
      metadata = {},
    } = data;

    if (!items || items.length === 0) {
      throw new Error("Items are required");
    }

    const lineItems = items.map((item) => {
      const safeName =
        (typeof item.name === "string" && item.name.trim().length > 0
          ? item.name.trim()
          : "Product");

      const safeDescription =
        typeof item.description === "string" && item.description.trim().length > 0
          ? item.description.trim()
          : undefined;

      // NOTE: We deliberately do NOT send images to Stripe to avoid
      // "Invalid URL: URL must be 2048 characters or less" errors from long CDNs.
      return {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: safeName,
            ...(safeDescription && { description: safeDescription }),
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: email,
      success_url: `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/cart?canceled=true`,
      metadata: {
        userId: userId?.toString(),
        type: "product",
        ...metadata,
      },
      shipping_address_collection: shippingAddress
        ? undefined
        : {
            allowed_countries: ["US", "CA"],
          },
    });

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
      success: true,
    };
  } catch (error) {
    console.error("Error creating product checkout session:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Create a checkout session for tournament entry fee
export const createTournamentCheckoutSession = async (data) => {
  try {
    console.log("=== Creating Stripe checkout session ===");
    console.log("Data received:", {
      amount: data.amount,
      currency: data.currency,
      email: data.email,
      tournamentId: data.tournamentId,
      teamId: data.teamId
    });

    const stripe = await getStripe();
    
    if (!stripe) {
      throw new Error("Stripe not initialized. Please configure Stripe keys in admin settings.");
    }

    const {
      amount,
      currency = "usd",
      email,
      userId,
      tournamentId,
      teamId,
      registrationId,
      metadata = {},
    } = data;

    if (!amount || amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    if (!email) {
      throw new Error("Email is required for checkout");
    }

    if (!tournamentId || !teamId) {
      throw new Error("Tournament ID and Team ID are required");
    }

    console.log("Creating Stripe session with:", {
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      email,
      frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173"
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Tournament Entry Fee`,
              description: `Entry fee for tournament registration`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: email,
      success_url: `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/team-leader?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/team-leader?payment=canceled`,
      metadata: {
        userId: userId?.toString(),
        tournamentId: tournamentId?.toString(),
        teamId: teamId?.toString(),
        registrationId: registrationId?.toString(),
        type: "tournament_entry",
        ...metadata,
      },
    });

    console.log("Stripe session created successfully:", {
      sessionId: session.id,
      hasUrl: !!session.url
    });

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
      success: true,
    };
  } catch (error) {
    console.error("=== ERROR creating tournament checkout session ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Provide more helpful error messages
    let errorMessage = error.message;
    if (error.message.includes("secret key") || error.message.includes("not configured")) {
      errorMessage = "Stripe is not configured. Please configure Stripe API keys in admin payment settings.";
    } else if (error.message.includes("Invalid API Key")) {
      errorMessage = "Invalid Stripe API key. Please check your Stripe secret key in admin settings.";
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Create a payment intent for tournament registration (for modal payment)
export const createTournamentPaymentIntent = async (data) => {
  try {
    const stripe = await getStripe();
    
    const {
      amount,
      currency = "usd",
      email,
      userId,
      tournamentId,
      teamId,
      registrationId,
      metadata = {},
    } = data;

    if (!amount || amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    if (!email) {
      throw new Error("Email is required for payment");
    }

    if (!tournamentId) {
      throw new Error("Tournament ID is required");
    }

    // For individual registration, userId is required; for team registration, teamId is required
    if (!teamId && !userId) {
      throw new Error("Either Team ID (for team registration) or User ID (for individual registration) is required");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      payment_method_types: ["card"],
      metadata: {
        userId: userId?.toString(),
        tournamentId: tournamentId?.toString(),
        teamId: teamId?.toString(),
        registrationId: registrationId?.toString(),
        email: email,
        type: "tournament_entry",
        ...metadata,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      success: true,
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Confirm payment intent after card payment
export const confirmTournamentPaymentIntent = async (paymentIntentId) => {
  try {
    const stripe = await getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      success: paymentIntent.status === "succeeded",
      paymentIntent,
      status: paymentIntent.status,
    };
  } catch (error) {
    console.error("Error confirming payment intent:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Create a payment intent for shop orders (for modal payment)
export const createShopPaymentIntent = async (data) => {
  try {
    const stripe = await getStripe();
    
    const {
      amount,
      currency = "usd",
      email,
      userId,
      items,
      metadata = {},
    } = data;

    if (!amount || amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    if (!email) {
      throw new Error("Email is required for payment");
    }

    if (!items || items.length === 0) {
      throw new Error("Items are required");
    }

    // Create description from items
    const description = items.length === 1 
      ? items[0].name 
      : `${items.length} items`;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      payment_method_types: ["card"],
      description: description,
      metadata: {
        userId: userId?.toString(),
        email: email,
        type: "shop_order",
        itemCount: items.length.toString(),
        ...metadata,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      success: true,
    };
  } catch (error) {
    console.error("Error creating shop payment intent:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Handle Stripe webhook
export const handleStripeWebhook = async (
  payload,
  signature,
  webhookSecret
) => {
  try {
    const settings = await Settings.findOne({ type: "payment" });

    if (!settings || !settings.data?.stripe?.webhookSecret) {
      throw new Error("Stripe webhook secret not configured");
    }

    const stripe = new Stripe(settings.data.stripe.secretKey);
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      settings.data.stripe.webhookSecret || webhookSecret
    );

    return event;
  } catch (error) {
    console.error("Error handling Stripe webhook:", error);
    throw error;
  }
};
