import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useNotification } from "../NotificationProvider";
import { useAuth } from "../../context/AuthContext";
import { teamAPI, tournamentAPI, paymentAPI } from "../../services/api";
import { FaCheckCircle, FaSpinner } from "react-icons/fa";
import { absoluteMediaSrc } from "../../utils/mediaUtils";

// Zelle Payment Form Component for Tournament Registration
const TournamentZellePaymentForm = ({
  onPaymentSuccess,
  amount,
  tournamentId,
  teamId,
  userId,
  registrationId,
  email,
}) => {
  const { showError } = useNotification();
  const [processing, setProcessing] = useState(false);
  const [zelleInfo, setZelleInfo] = useState(null);
  const [loadingZelleInfo, setLoadingZelleInfo] = useState(true);
  const [formData, setFormData] = useState({
    sendersName: "",
    email: email || "",
    amount: amount.toFixed(2),
    transactionReference: "",
  });

  useEffect(() => {
    const fetchZelleInfo = async () => {
      try {
        const info = await paymentAPI.getZelleInfo();
        setZelleInfo(info);
      } catch (error) {
        console.error("Failed to load Zelle info:", error);
        setZelleInfo({
          qrCodeImage: "/zelle.jpg",
          email: "",
          phone: "",
          name: "",
        });
      } finally {
        setLoadingZelleInfo(false);
      }
    };
    fetchZelleInfo();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.sendersName.trim()) {
      showError("Please enter your name (sender's name)");
      return;
    }

    if (!formData.email.trim()) {
      showError("Please enter your email address");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email.trim())) {
      showError("Please enter a valid email address");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showError("Please enter a valid amount");
      return;
    }

    const enteredAmount = parseFloat(formData.amount);
    const eventTotal = parseFloat(amount.toFixed(2));
    if (Math.abs(enteredAmount - eventTotal) > 0.01) {
      showError(`Amount must match entry fee of $${eventTotal.toFixed(2)}`);
      return;
    }

    setProcessing(true);
    try {
      await onPaymentSuccess(null, {
        paymentMethod: "zelle",
        zellePayment: {
          sendersName: formData.sendersName.trim(),
          email: formData.email.trim(),
          amount: parseFloat(formData.amount),
          transactionReference:
            formData.transactionReference.trim() || undefined,
        },
      });
    } catch (error) {
      showError(
        error.message || "Failed to submit Zelle payment. Please try again."
      );
      setProcessing(false);
    }
  };

  const rawZelleQr = zelleInfo?.qrCodeImage || "/zelle.jpg";
  const qrCodeImageUrl =
    rawZelleQr.startsWith("/uploads/") ? absoluteMediaSrc(rawZelleQr) : rawZelleQr;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white border-2 border-blue-200 rounded-xl p-6 mb-4 text-center">
        <p className="text-sm text-blue-900 font-semibold mb-3">
          {zelleInfo?.name
            ? `Scan this code in your bank's app to pay ${zelleInfo.name}`
            : "Scan this QR code in your bank's app to pay via Zelle"}
          {(zelleInfo?.phone || zelleInfo?.email) && (
            <span className="block text-xs text-blue-700 mt-1">
              {zelleInfo.phone
                ? `at ${zelleInfo.phone}`
                : zelleInfo.email
                ? `at ${zelleInfo.email}`
                : ""}
            </span>
          )}
        </p>
        <div className="flex justify-center mb-3">
          {loadingZelleInfo ? (
            <div className="w-[300px] h-[300px] flex items-center justify-center bg-gray-100 rounded-lg border-2 border-blue-100">
              <p className="text-primary-600">Loading QR code...</p>
            </div>
          ) : (
            <img
              src={qrCodeImageUrl}
              alt="Zelle QR Code"
              className="max-w-full h-auto rounded-lg border-2 border-blue-100"
              style={{ maxWidth: "300px", maxHeight: "300px" }}
            />
          )}
        </div>
        <div className="flex justify-center items-center gap-2">
          <img
            src="https://www.zellepay.com/sites/default/files/zelle-logo.svg"
            alt="Zelle"
            className="h-6"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <span className="text-xs text-blue-600 font-semibold">Zelle</span>
        </div>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
        <p className="text-sm text-blue-900 font-semibold mb-2">
          Zelle Payment Instructions:
        </p>
        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
          <li>Scan the QR code above in your bank's Zelle app</li>
          <li>
            Send ${amount.toFixed(2)} to {zelleInfo?.name || "the recipient"}
          </li>
          <li>Complete the payment details below</li>
          <li>
            Your registration will be confirmed after manual verification
            (usually within 24 hours)
          </li>
        </ol>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-primary-700 font-semibold mb-2 text-sm">
            Sender's Name *
          </label>
          <input
            type="text"
            value={formData.sendersName}
            onChange={(e) =>
              setFormData({ ...formData, sendersName: e.target.value })
            }
            placeholder="Enter your full name"
            className="w-full px-4 py-3 border border-secondary-200 rounded-lg focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none bg-white text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-primary-700 font-semibold mb-2 text-sm">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="your.email@example.com"
            className="w-full px-4 py-3 border border-secondary-200 rounded-lg focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none bg-white text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-primary-700 font-semibold mb-2 text-sm">
            Amount *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-600 font-semibold">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder={amount.toFixed(2)}
              className="w-full pl-8 pr-4 py-3 border border-secondary-200 rounded-lg focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none bg-white text-sm"
              required
            />
          </div>
          <p className="text-xs text-primary-500 mt-1">
            Entry fee:{" "}
            <span className="font-semibold">${amount.toFixed(2)}</span>
          </p>
        </div>

        <div>
          <label className="block text-primary-700 font-semibold mb-2 text-sm">
            Transaction Reference (Optional)
          </label>
          <input
            type="text"
            value={formData.transactionReference}
            onChange={(e) =>
              setFormData({ ...formData, transactionReference: e.target.value })
            }
            placeholder="Enter transaction reference if available"
            className="w-full px-4 py-3 border border-secondary-200 rounded-lg focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none bg-white text-sm"
          />
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={processing}
        className="w-full px-6 py-3 bg-accent-500 text-primary-950 font-medium rounded-lg hover:bg-accent-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: processing ? 1 : 1.02 }}
        whileTap={{ scale: processing ? 1 : 0.98 }}
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <FaSpinner className="animate-spin" />
            Submitting...
          </span>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </motion.button>
    </form>
  );
};

const formatCashAppTag = (tag) => {
  if (!tag || typeof tag !== "string") return "";
  const t = tag.trim();
  if (!t) return "";
  return t.startsWith("$") ? t : `$${t}`;
};

const TournamentCashAppPaymentForm = ({ onPaymentSuccess, amount, email }) => {
  const { showError } = useNotification();
  const [processing, setProcessing] = useState(false);
  const [cashAppInfo, setCashAppInfo] = useState(null);
  const [loadingCashAppInfo, setLoadingCashAppInfo] = useState(true);
  const [formData, setFormData] = useState({
    sendersName: "",
    email: email || "",
    amount: amount.toFixed(2),
    transactionReference: "",
  });

  useEffect(() => {
    const fetchCashAppInfo = async () => {
      try {
        const info = await paymentAPI.getCashAppInfo();
        setCashAppInfo(info);
      } catch (error) {
        console.error("Failed to load Cash App info:", error);
        setCashAppInfo({ qrCodeImage: "", cashTag: "", name: "" });
      } finally {
        setLoadingCashAppInfo(false);
      }
    };
    fetchCashAppInfo();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.sendersName.trim()) {
      showError("Please enter your name (sender's name)");
      return;
    }

    if (!formData.email.trim()) {
      showError("Please enter your email address");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email.trim())) {
      showError("Please enter a valid email address");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showError("Please enter a valid amount");
      return;
    }

    const enteredAmount = parseFloat(formData.amount);
    const eventTotal = parseFloat(amount.toFixed(2));
    if (Math.abs(enteredAmount - eventTotal) > 0.01) {
      showError(`Amount must match entry fee of $${eventTotal.toFixed(2)}`);
      return;
    }

    setProcessing(true);
    try {
      await onPaymentSuccess(null, {
        paymentMethod: "cash_app",
        zellePayment: {
          sendersName: formData.sendersName.trim(),
          email: formData.email.trim(),
          amount: parseFloat(formData.amount),
          transactionReference:
            formData.transactionReference.trim() || undefined,
        },
      });
    } catch (error) {
      showError(
        error.message || "Failed to submit Cash App payment. Please try again."
      );
      setProcessing(false);
    }
  };

  const rawCashAppQr = cashAppInfo?.qrCodeImage?.trim() || "";
  const qrCodeImageUrl = rawCashAppQr
    ? absoluteMediaSrc(rawCashAppQr) || rawCashAppQr
    : "";
  const cashTagDisplay = formatCashAppTag(cashAppInfo?.cashTag);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white border-2 border-green-200 rounded-xl p-6 mb-4 text-center">
        <p className="text-sm text-green-900 font-semibold mb-3">
          {cashAppInfo?.name && cashTagDisplay
            ? `Scan to pay ${cashAppInfo.name} (${cashTagDisplay})`
            : cashTagDisplay
            ? `Scan or pay ${cashTagDisplay} in Cash App`
            : "Scan this QR code in Cash App to complete payment"}
          {cashTagDisplay && !cashAppInfo?.name && (
            <span className="block text-xs text-green-800 mt-1 font-semibold">
              {cashTagDisplay}
            </span>
          )}
        </p>
        <div className="flex justify-center mb-3">
          {loadingCashAppInfo ? (
            <div className="w-[300px] h-[300px] flex items-center justify-center bg-gray-100 rounded-lg border-2 border-green-100">
              <p className="text-primary-600">Loading QR code...</p>
            </div>
          ) : qrCodeImageUrl ? (
            <div className="relative">
              <img
                src={qrCodeImageUrl}
                alt="Cash App QR Code"
                className="max-w-full h-auto rounded-lg border-2 border-green-100"
                style={{ maxWidth: "300px", maxHeight: "300px" }}
                onError={(e) => {
                  e.target.style.display = "none";
                  const err = e.target.nextElementSibling;
                  if (err) err.style.display = "block";
                }}
              />
              <p
                className="text-xs text-red-600 mt-2"
                style={{ display: "none" }}
              >
                Could not load QR image. Confirm the URL in Admin → Payment
                Settings, or pay using the $Cashtag above.
              </p>
            </div>
          ) : (
            <div className="w-[300px] min-h-[140px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-green-200 px-4 py-6">
              <p className="text-sm text-gray-600">
                {cashTagDisplay
                  ? `No QR image uploaded. Send ${cashTagDisplay} in Cash App using the tag below.`
                  : "Upload a Cash App QR image in Admin → Payment Settings to show it here."}
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-center items-center gap-2">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Square_Cash_app_logo.svg/120px-Square_Cash_app_logo.svg.png"
            alt="Cash App"
            className="h-8"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <span className="text-xs text-green-700 font-semibold">Cash App</span>
        </div>
      </div>

      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
        <p className="text-sm text-green-900 font-semibold mb-2">
          Cash App Payment Instructions:
        </p>
        <ol className="text-xs text-green-800 space-y-1 list-decimal list-inside">
          <li>
            {qrCodeImageUrl
              ? "Scan the QR code above in Cash App, or open Cash App and pay the $Cashtag"
              : "Open Cash App and send payment"}
            {cashTagDisplay ? ` (${cashTagDisplay})` : ""}
          </li>
          <li>
            Send ${amount.toFixed(2)} to{" "}
            {cashAppInfo?.name || cashTagDisplay || "the recipient"}
          </li>
          <li>Complete the payment details below</li>
          <li>
            Your registration will be confirmed after manual verification
            (usually within 24 hours)
          </li>
        </ol>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-primary-700 font-semibold mb-2 text-sm">
            Sender's Name *
          </label>
          <input
            type="text"
            value={formData.sendersName}
            onChange={(e) =>
              setFormData({ ...formData, sendersName: e.target.value })
            }
            placeholder="Enter your full name"
            className="w-full px-4 py-3 border border-secondary-200 rounded-lg focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none bg-white text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-primary-700 font-semibold mb-2 text-sm">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="your.email@example.com"
            className="w-full px-4 py-3 border border-secondary-200 rounded-lg focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none bg-white text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-primary-700 font-semibold mb-2 text-sm">
            Amount *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-600 font-semibold">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder={amount.toFixed(2)}
              className="w-full pl-8 pr-4 py-3 border border-secondary-200 rounded-lg focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none bg-white text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-primary-700 font-semibold mb-2 text-sm">
            Transaction Reference (Optional)
          </label>
          <input
            type="text"
            value={formData.transactionReference}
            onChange={(e) =>
              setFormData({ ...formData, transactionReference: e.target.value })
            }
            placeholder="Enter transaction reference if available"
            className="w-full px-4 py-3 border border-secondary-200 rounded-lg focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none bg-white text-sm"
          />
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={processing}
        className="w-full px-6 py-3 bg-accent-500 text-primary-950 font-medium rounded-lg hover:bg-accent-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: processing ? 1 : 1.02 }}
        whileTap={{ scale: processing ? 1 : 0.98 }}
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <FaSpinner className="animate-spin" />
            Submitting...
          </span>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </motion.button>
    </form>
  );
};

// Stripe Card Input Component
const CardInput = ({
  onPaymentSuccess,
  amount,
  tournamentId,
  teamId,
  userId,
  registrationId,
  email,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { showError } = useNotification();
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!stripe || !elements) {
      showError("Stripe is not loaded. Please refresh the page.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      showError("Card element not found.");
      return;
    }

    setProcessing(true);

    try {
      // Create payment intent
      const intentPayload = {
        amount,
        tournamentId,
        email,
      };
      if (teamId) intentPayload.teamId = teamId;
      if (userId) intentPayload.userId = userId;
      if (registrationId) intentPayload.registrationId = registrationId;

      const intentData = await paymentAPI.createTournamentPaymentIntent(intentPayload);

      if (!intentData.clientSecret) {
        throw new Error(intentData.error || "Failed to create payment intent");
      }

      // Confirm payment with card
      const { error: confirmError, paymentIntent } =
        await stripe.confirmCardPayment(intentData.clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

      if (confirmError) {
        throw new Error(confirmError.message || "Payment failed");
      }

      if (paymentIntent.status === "succeeded") {
        onPaymentSuccess(paymentIntent.id);
      } else {
        throw new Error("Payment was not successful");
      }
    } catch (error) {
      showError(
        error.message || "Payment processing failed. Please try again."
      );
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#1a1a1a",
        fontFamily: "system-ui, sans-serif",
        "::placeholder": {
          color: "#9ca3af",
        },
      },
      invalid: {
        color: "#ef4444",
        iconColor: "#ef4444",
      },
    },
    hidePostalCode: true,
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-primary-700 font-medium mb-2 text-sm">
          Card Information *
        </label>
        <div className="px-4 py-3 border border-secondary-200 rounded-lg focus-within:border-accent-500 focus-within:ring-1 focus-within:ring-accent-500 transition-colors bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>
      <motion.button
        type="button"
        onClick={handlePayment}
        disabled={!stripe || processing}
        className="w-full px-6 py-3 bg-accent-500 text-primary-950 font-medium rounded-lg hover:bg-accent-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: processing ? 1 : 1.01 }}
        whileTap={{ scale: processing ? 1 : 0.99 }}
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              className="w-4 h-4 border-2 border-primary-950 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            Processing Payment...
          </span>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </motion.button>
    </div>
  );
};

const TournamentApplePayInput = ({
  onPaymentSuccess,
  amount,
  tournamentId,
  teamId,
  userId,
  registrationId,
  email,
}) => {
  const stripe = useStripe();
  const { showError } = useNotification();
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: "US",
      currency: "usd",
      total: {
        label: "Let's Kick It",
        amount: Math.round(amount * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((result) => {
      if (result?.applePay) {
        setPaymentRequest(pr);
      } else {
        setPaymentRequest(null);
      }
    });

    pr.on("paymentmethod", async (ev) => {
      setProcessing(true);
      try {
        const intentPayload = {
          amount,
          tournamentId,
          email,
        };
        if (teamId) intentPayload.teamId = teamId;
        if (userId) intentPayload.userId = userId;
        if (registrationId) intentPayload.registrationId = registrationId;

        const intentData = await paymentAPI.createTournamentPaymentIntent(
          intentPayload
        );

        if (!intentData.clientSecret) {
          throw new Error(intentData.error || "Failed to create payment intent");
        }

        const { error, paymentIntent } = await stripe.confirmCardPayment(
          intentData.clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (error) {
          ev.complete("fail");
          throw new Error(error.message || "Apple Pay failed");
        }

        ev.complete("success");

        let finalIntent = paymentIntent;
        if (paymentIntent.status === "requires_action") {
          const { error: actionError, paymentIntent: actedIntent } =
            await stripe.confirmCardPayment(intentData.clientSecret);
          if (actionError) {
            throw new Error(actionError.message || "Apple Pay authentication failed");
          }
          finalIntent = actedIntent;
        }

        if (finalIntent.status === "succeeded") {
          onPaymentSuccess(finalIntent.id);
        } else {
          throw new Error("Apple Pay payment was not successful");
        }
      } catch (error) {
        showError(error.message || "Apple Pay processing failed.");
        setProcessing(false);
      }
    });
  }, [
    stripe,
    amount,
    tournamentId,
    teamId,
    userId,
    registrationId,
    email,
    onPaymentSuccess,
    showError,
  ]);

  if (!paymentRequest) {
    return (
      <div className="text-sm text-primary-600 bg-primary-100 border border-primary-200 rounded-xl p-4">
        Apple Pay is not available on this device/browser. Please use Credit/Debit Card or another payment option.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PaymentRequestButtonElement
        options={{ paymentRequest }}
        className={processing ? "opacity-60 pointer-events-none" : ""}
      />
      {processing && (
        <p className="text-xs text-primary-600 text-center">Processing Apple Pay...</p>
      )}
    </div>
  );
};

const RegistrationModal = ({ event, onClose }) => {
  const { showSuccess, showError } = useNotification();
  const { user, isTeamLeader } = useAuth();
  const [stripePromise, setStripePromise] = useState(null);
  const [myTeam, setMyTeam] = useState(null);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [selectedTeamOption, setSelectedTeamOption] = useState("new");
  const [formData, setFormData] = useState({
    name: "",
    email: user?.email || "",
    phone: "",
    registrationType: isTeamLeader ? "team" : "individual",
    teamName: "",
    teamId: "",
    teamMembers: [{ name: "", email: "", phone: "" }],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);
  const [teamIdForPayment, setTeamIdForPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("stripe");

  const validateAndPrepareRegistration = () => {
    // Validate tournament type restrictions
    if (event.tournamentType === "team" && !isTeamLeader) {
      throw new Error(
        "Only team leaders can register for team tournaments. please contact a team leader or admin to get registered"
      );
    }

    if (
      event.tournamentType === "individual" &&
      formData.registrationType === "team"
    ) {
      throw new Error(
        "This is an individual tournament. Only individual registration is allowed."
      );
    }

    if (
      event.tournamentType === "team" &&
      formData.registrationType === "individual"
    ) {
      throw new Error(
        "This is a team tournament. Only team registration is allowed."
      );
    }

    let teamId = null;

    if (formData.registrationType === "team") {
      if (!isTeamLeader) {
        throw new Error(
          "Only team leaders can register teams for tournaments. please contact a team leader or admin to get registered"
        );
      }

      let teamMemberCount = 0;

      if (selectedTeamOption === "myTeam" && myTeam) {
        teamMemberCount = myTeam.members?.length || 0;
        teamId = myTeam._id;
      } else {
        if (formData.teamMembers.length < 2) {
          throw new Error("Team must have at least 2 members");
        }
        teamMemberCount = formData.teamMembers.length;
      }

      const minTeamMembers = event.minTeamMembers || 2;
      const maxTeamMembers = event.maxTeamMembers || 10;

      if (
        teamMemberCount < minTeamMembers ||
        teamMemberCount > maxTeamMembers
      ) {
        throw new Error(
          `Team must have between ${minTeamMembers} and ${maxTeamMembers} members. Your team has ${teamMemberCount} member(s).`
        );
      }

      if (selectedTeamOption !== "myTeam" || !teamId) {
        throw new Error(
          "New team registration not yet implemented. Please use 'My Team' option."
        );
      }
    }

    return {
      tournamentId: event.id || event._id,
      registrationType: formData.registrationType,
      teamId,
      userId: user?._id,
    };
  };

  const registerForTournament = async () => {
    const registrationContext = validateAndPrepareRegistration();
    const { tournamentId, registrationType, teamId } = registrationContext;

    const payload =
      registrationType === "team"
        ? { registrationType: "team", teamId }
        : { registrationType: "individual" };

    const result = await tournamentAPI.register(tournamentId, payload);

    return {
      registrationId: result.registrationId,
      teamId,
      userId: result.userId || user?._id,
    };
  };

  // Load Stripe publishable key
  useEffect(() => {
    const loadStripeKey = async () => {
      try {
        const data = await paymentAPI.getStripePublishableKey();
        if (data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey));
        }
      } catch (error) {
        console.error("Failed to load Stripe key:", error);
        showError("Payment system is not configured. Please contact support.");
      }
    };
    loadStripeKey();
  }, []);

  // Set registration type based on tournament type
  useEffect(() => {
    if (event.tournamentType) {
      setFormData((prev) => ({
        ...prev,
        registrationType: event.tournamentType,
      }));
    }
  }, [event.tournamentType]);

  // Fetch user's team if they're a team leader
  useEffect(() => {
    const fetchMyTeam = async () => {
      if (isTeamLeader && formData.registrationType === "team") {
        try {
          setLoadingTeam(true);
          const data = await teamAPI.getMyTeam();
          if (data.team) {
            setMyTeam(data.team);
            setSelectedTeamOption("myTeam");
          }
        } catch (error) {
          console.error("Failed to fetch team:", error);
        } finally {
          setLoadingTeam(false);
        }
      }
    };
    fetchMyTeam();
  }, [isTeamLeader, formData.registrationType]);

  const handleRegistration = async () => {
    setIsSubmitting(true);

    try {
      const registrationContext = validateAndPrepareRegistration();
      setTeamIdForPayment(registrationContext.teamId);

      // If there's an entry fee, show payment form
      if (event.price > 0) {
        setShowPayment(true);
        setIsSubmitting(false);
      } else {
        // No payment needed, complete registration immediately
        await registerForTournament();
        showSuccess(
          "Registration successful! Check your email for confirmation."
        );
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      showError(error.message || "Registration failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId, manualPaymentData = null) => {
    try {
      // Register only after payment is completed/submitted
      const registrationResult = await registerForTournament();

      const paymentData = {
        tournamentId: event.id || event._id,
        registrationId: registrationResult.registrationId,
        paymentStatus: manualPaymentData ? "pending" : "paid",
        paymentMethod: manualPaymentData
          ? manualPaymentData.paymentMethod
          : paymentMethod === "apple_pay"
          ? "apple_pay"
          : "stripe",
      };

      // Add teamId for team registrations, userId for individual registrations
      if (formData.registrationType === "team" && registrationResult.teamId) {
        paymentData.teamId = registrationResult.teamId;
      } else if (formData.registrationType === "individual") {
        paymentData.userId = registrationResult.userId || user?._id;
      }

      setRegistrationId(registrationResult.registrationId);
      setTeamIdForPayment(registrationResult.teamId || null);

      if (manualPaymentData) {
        // Handle manual payment - update with provided details
        paymentData.zellePayment = manualPaymentData.zellePayment;
        await paymentAPI.updateTournamentPayment(paymentData);
        if (manualPaymentData.paymentMethod === "cash_app") {
          showSuccess(
            "Cash App payment submitted! Your registration will be confirmed after verification (usually within 24 hours). Check your email for confirmation."
          );
        } else {
          showSuccess(
            "Zelle payment submitted! Your registration will be confirmed after verification (usually within 24 hours). Check your email for confirmation."
          );
        }
      } else {
        // Handle Stripe payment
        paymentData.paymentIntentId = paymentIntentId;
        await paymentAPI.updateTournamentPayment(paymentData);
        showSuccess(
          "Payment successful! Registration complete. Check your email for confirmation."
        );
      }
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error updating payment status:", error);
      showError(
        error.message ||
          "We could not complete your registration after payment. Please contact support with your payment details."
      );
    }
  };

  const addTeamMember = () => {
    setFormData({
      ...formData,
      teamMembers: [
        ...formData.teamMembers,
        { name: "", email: "", phone: "" },
      ],
    });
  };

  const removeTeamMember = (index) => {
    setFormData({
      ...formData,
      teamMembers: formData.teamMembers.filter((_, i) => i !== index),
    });
  };

  const updateTeamMember = (index, field, value) => {
    const updated = [...formData.teamMembers];
    updated[index][field] = value;
    setFormData({ ...formData, teamMembers: updated });
  };

  const isTeamRegistration = formData.registrationType === "team";
  const teamMemberCountForPayment =
    isTeamRegistration && selectedTeamOption === "myTeam" && myTeam
      ? myTeam.members?.length || 0
      : 1;
  const payableAmount =
    isTeamRegistration && event.price > 0
      ? event.price * teamMemberCountForPayment
      : event.price;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-lg p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-secondary-200">
            <motion.h2
              className="text-2xl font-semibold text-primary-950"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {showPayment ? "Complete Payment" : `Register for ${event.title}`}
            </motion.h2>
            <motion.button
              onClick={onClose}
              className="text-gray-400 hover:text-secondary-600 text-2xl w-8 h-8 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ×
            </motion.button>
          </div>

          {/* Event Info */}
          <motion.div
            className="mb-8 p-4 bg-secondary-50 rounded-lg border border-secondary-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 text-xs uppercase tracking-wide">
                  Date
                </span>
                <p className="font-medium text-gray-900 mt-1">
                  {new Date(event.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-xs uppercase tracking-wide">
                  Location
                </span>
                <p className="font-medium text-gray-900 mt-1">
                  {event.location}
                </p>
              </div>
              {event.price > 0 && (
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide">
                    Entry Fee
                  </span>
                  <p className="font-semibold text-accent-600 text-lg mt-1">
                    ${payableAmount.toFixed(2)}
                  </p>
                  {isTeamRegistration && teamMemberCountForPayment > 0 && (
                    <p className="text-xs text-primary-500 mt-1">
                      ${event.price.toFixed(2)} x {teamMemberCountForPayment} team
                      member{teamMemberCountForPayment === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
              )}
              <div>
                <span className="text-gray-500 text-xs uppercase tracking-wide">
                  Spots Left
                </span>
                <p className="font-medium text-gray-900 mt-1">
                  {event.maxParticipants - event.participants}
                </p>
              </div>
            </div>
          </motion.div>

          {showPayment ? (
            // Payment Form
            <div className="space-y-6">
              {/* Payment Method Selection */}
              <div>
                <label className="block text-primary-700 font-medium mb-3 text-sm">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "stripe", label: "💳 Credit/Debit Card" },
                    { key: "apple_pay", label: "Apple Pay" },
                    { key: "zelle", label: "💰 Zelle" },
                    { key: "cash_app", label: "$ Cash App" },
                  ].map((method) => (
                    <motion.button
                      key={method.key}
                      type="button"
                      onClick={() => setPaymentMethod(method.key)}
                      className={`px-4 py-3 rounded-lg border font-medium transition-all text-sm ${
                        paymentMethod === method.key
                          ? "border-accent-500 bg-accent-500 text-primary-950"
                          : "border-secondary-200 text-primary-600 hover:border-secondary-300 bg-white"
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {method.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Payment Forms */}
              {paymentMethod === "stripe" && stripePromise ? (
                <Elements stripe={stripePromise}>
                  <CardInput
                    onPaymentSuccess={handlePaymentSuccess}
                    amount={payableAmount}
                    tournamentId={event.id || event._id}
                    teamId={teamIdForPayment}
                    userId={
                      formData.registrationType === "individual"
                        ? user?._id
                        : null
                    }
                    registrationId={registrationId}
                    email={formData.email || user?.email}
                  />
                </Elements>
              ) : paymentMethod === "apple_pay" && stripePromise ? (
                <Elements stripe={stripePromise}>
                  <TournamentApplePayInput
                    onPaymentSuccess={handlePaymentSuccess}
                    amount={payableAmount}
                    tournamentId={event.id || event._id}
                    teamId={teamIdForPayment}
                    userId={
                      formData.registrationType === "individual" ? user?._id : null
                    }
                    registrationId={registrationId}
                    email={formData.email || user?.email}
                  />
                </Elements>
              ) : paymentMethod === "cash_app" ? (
                <TournamentCashAppPaymentForm
                  onPaymentSuccess={handlePaymentSuccess}
                  amount={payableAmount}
                  email={formData.email || user?.email}
                />
              ) : paymentMethod === "zelle" ? (
                <TournamentZellePaymentForm
                  onPaymentSuccess={handlePaymentSuccess}
                  amount={payableAmount}
                  tournamentId={event.id || event._id}
                  teamId={teamIdForPayment}
                  userId={
                    formData.registrationType === "individual"
                      ? user?._id
                      : null
                  }
                  registrationId={registrationId}
                  email={formData.email || user?.email}
                />
              ) : null}
            </div>
          ) : (
            // Registration Form
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRegistration();
              }}
              className="space-y-6"
            >
                  {/* Registration Type */}
              {event.tournamentType ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label className="block text-primary-700 font-medium mb-3 text-sm">
                        Registration Type
                      </label>
                      <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                        <p className="font-medium text-primary-950 capitalize">
                          {event.tournamentType === "team" ? "Team" : "Individual"}{" "}
                          Tournament
                        </p>
                    {event.tournamentType === "team" && !isTeamLeader && (
                      <p className="text-xs text-red-600 mt-2">
                        ⚠️ Only team leaders can register for team tournaments.
                        please contact a team leader or admin to get registered
                      </p>
                    )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label className="block text-primary-700 font-medium mb-3 text-sm">
                        Registration Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {["individual", "team"].map((type) => (
                          <motion.button
                            key={type}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, registrationType: type })
                            }
                        disabled={type === "team" && !isTeamLeader}
                            className={`px-4 py-3 rounded-lg border font-medium transition-all capitalize text-sm ${
                              formData.registrationType === type
                                ? "border-accent-500 bg-accent-500 text-primary-950"
                                : "border-secondary-200 text-primary-600 hover:border-secondary-300 bg-white"
                            } ${
                          type === "team" && !isTeamLeader
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                        whileHover={
                          type === "team" && !isTeamLeader
                            ? {}
                            : { scale: 1.01 }
                        }
                        whileTap={
                          type === "team" && !isTeamLeader
                            ? {}
                            : { scale: 0.99 }
                        }
                            title={
                          type === "team" && !isTeamLeader
                            ? "Only team leaders can register teams. Select 'Individual' to register as a player."
                                : ""
                            }
                          >
                            {type}
                        {type === "team" && !isTeamLeader && (
                              <span className="block text-xs mt-1 text-red-500">
                            Team Leader Only
                              </span>
                            )}
                          </motion.button>
                        ))}
                      </div>
                  {formData.registrationType === "team" && !isTeamLeader && (
                        <p className="mt-2 text-xs text-primary-600">
                      ⚠️ Only team leaders can register teams. Select
                      "Individual" to register as a player.
                        </p>
                      )}
                    </motion.div>
                  )}

              {/* Individual Registration Form */}
              {formData.registrationType === "individual" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-4"
                >
                    <div>
                      <label className="block text-primary-700 font-medium mb-2 text-sm">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={
                          formData.name ||
                          (user?.firstName && user?.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user?.username || "")
                        }
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-primary-700 font-medium mb-2 text-sm">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email || user?.email || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-primary-700 font-medium mb-2 text-sm">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors bg-white"
                        required
                      />
                    </div>
                  </motion.div>
                )}

              {/* Team Selection (if team registration) */}
              {formData.registrationType === "team" &&
                event.tournamentType !== "individual" &&
                isTeamLeader && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {isTeamLeader && myTeam && (
                    <div>
                      <label className="block text-gray-700 font-medium mb-3 text-sm">
                        Select Team
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          type="button"
                          onClick={() => setSelectedTeamOption("myTeam")}
                          className={`px-4 py-3 rounded-lg border font-medium transition-all text-sm ${
                            selectedTeamOption === "myTeam"
                              ? "border-accent-500 bg-accent-500 text-primary-950"
                              : "border-secondary-200 text-primary-600 hover:border-secondary-300 bg-white"
                          }`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          My Team ({myTeam.name})
                          <div className="text-xs mt-1 opacity-75">
                            {myTeam.members?.length || 0} members
                          </div>
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => setSelectedTeamOption("new")}
                          className={`px-4 py-3 rounded-lg border font-medium transition-all text-sm ${
                            selectedTeamOption === "new"
                              ? "border-accent-500 bg-accent-500 text-primary-950"
                              : "border-secondary-200 text-primary-600 hover:border-secondary-300 bg-white"
                          }`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          New Team
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {selectedTeamOption === "new" && (
                    <div>
                      <label className="block text-primary-700 font-medium mb-2 text-sm">
                        Team Name *
                      </label>
                      <input
                        type="text"
                        value={formData.teamName}
                        onChange={(e) =>
                            setFormData({
                              ...formData,
                              teamName: e.target.value,
                            })
                        }
                        className="w-full px-4 py-3 border border-secondary-200 rounded-lg focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none transition-colors bg-white"
                        required={selectedTeamOption === "new"}
                      />
                    </div>
                  )}

                  {selectedTeamOption === "myTeam" && myTeam && (
                    <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                      <p className="text-sm text-primary-700 mb-2">
                          <span className="font-medium">Team:</span>{" "}
                          {myTeam.name}
                      </p>
                      <p className="text-sm text-primary-700">
                        <span className="font-medium">Members:</span>{" "}
                        {myTeam.members?.length || 0} (including you)
                      </p>
                      {(event.minTeamMembers || event.maxTeamMembers) && (
                        <p className="text-xs text-primary-600 mt-2">
                          Required: {event.minTeamMembers || 2} -{" "}
                          {event.maxTeamMembers || 10} members
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {selectedTeamOption === "new" &&
              formData.registrationType === "team" &&
              isTeamLeader ? (
                /* Team Registration - New Team */
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-primary-700 font-medium text-sm">
                      Team Members *
                    </label>
                    {isTeamLeader &&
                      (event.tournamentType === "team" ||
                        event.type === "match" ||
                        (event.type === "tournament" &&
                          event.tournamentType !== "individual")) && (
                      <motion.button
                        type="button"
                        onClick={addTeamMember}
                        className="px-4 py-2 bg-accent-500 text-primary-950 font-medium rounded-lg text-sm hover:bg-accent-400 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        + Add Member
                      </motion.button>
                    )}
                  </div>

                  {formData.teamMembers.map((member, index) => (
                    <motion.div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg space-y-3 bg-white"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-primary-700 text-sm">
                          Member {index + 1}
                        </span>
                        {formData.teamMembers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTeamMember(index)}
                            className="text-accent-600 hover:text-accent-700 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Name *"
                        value={member.name}
                        onChange={(e) =>
                          updateTeamMember(index, "name", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none bg-white text-sm"
                        required
                      />
                      <input
                        type="email"
                        placeholder="Email *"
                        value={member.email}
                        onChange={(e) =>
                          updateTeamMember(index, "email", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none bg-white text-sm"
                        required
                      />
                      <input
                        type="tel"
                        placeholder="Phone *"
                        value={member.phone}
                        onChange={(e) =>
                          updateTeamMember(index, "phone", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none bg-white text-sm"
                        required
                      />
                    </motion.div>
                  ))}
                </div>
              ) : null}

              {formData.registrationType === "team" && !isTeamLeader && (
                <div className="p-4 rounded-xl bg-secondary-50 border border-secondary-200 text-center space-y-2">
                  <p className="text-sm font-semibold text-primary-900">
                    Team Leader Account Required
                  </p>
                  <p className="text-xs text-primary-600">
                    Team registrations must be submitted by a registered Team Leader. If you are forming a new team, please sign up as a Team Leader.
                  </p>
                  <a
                    href="/register"
                    className="inline-block mt-2 px-4 py-2 bg-secondary-500 text-primary-950 font-bold rounded-lg text-xs hover:bg-secondary-600 transition-colors"
                  >
                    Register as Team Leader
                  </a>
                </div>
              )}

              {/* Submit Buttons */}
                <motion.div
                  className="flex gap-3 pt-6 border-t border-secondary-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <motion.button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border border-secondary-200 text-primary-700 font-medium rounded-lg hover:bg-secondary-50 transition-colors"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                  disabled={
                    isSubmitting ||
                    (event.tournamentType === "team" && !isTeamLeader)
                  }
                    className="flex-1 px-6 py-3 bg-accent-500 text-primary-950 font-medium rounded-lg hover:bg-accent-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{
                    scale:
                      isSubmitting ||
                      (event.tournamentType === "team" && !isTeamLeader)
                        ? 1
                        : 1.01,
                  }}
                  whileTap={{
                    scale:
                      isSubmitting ||
                      (event.tournamentType === "team" && !isTeamLeader)
                        ? 1
                        : 0.99,
                  }}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span
                          className="w-4 h-4 border-2 border-primary-950 border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        Processing...
                      </span>
                    ) : payableAmount > 0 ? (
                      "Register & Pay"
                    ) : (
                      "Register"
                    )}
                  </motion.button>
                </motion.div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RegistrationModal;
