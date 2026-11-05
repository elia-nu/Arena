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
import { paymentAPI, shopAPI } from "../../services/api";
import { useCart } from "../../context/CartContext";
import { absoluteMediaSrc } from "../../utils/mediaUtils";
import ShippingForm from "./ShippingForm";
import {
  IoPersonOutline,
  IoCallOutline,
  IoHomeOutline,
  IoLocationOutline,
  IoGlobeOutline,
  IoCreateOutline,
} from "react-icons/io5";

const DeliverySummary = ({ shipping, onEdit }) => {
  if (!shipping?.address?.street) return null;

  const { recipientName, phone, address } = shipping;
  const streetLine = address.apartment
    ? `${address.street}, ${address.apartment}`
    : address.street;
  const cityLine = [address.city, address.state, address.zipCode]
    .filter(Boolean)
    .join(", ");

  const InfoRow = ({ icon: Icon, label, value }) =>
    value ? (
      <div className="flex gap-3 items-start min-w-0">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-secondary-200 text-secondary-600">
          <Icon className="text-base" />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-primary-500">
            {label}
          </p>
          <p className="text-sm font-medium text-primary-950 break-words leading-snug">
            {value}
          </p>
        </div>
      </div>
    ) : null;

  return (
    <div className="pt-4 mt-4 border-t border-secondary-200">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-100 text-secondary-600">
            <IoLocationOutline className="text-lg" />
          </span>
          <div>
            <p className="font-semibold text-primary-950 leading-tight">
              Delivery address
            </p>
            <p className="text-xs text-primary-500">Ship to this location</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 text-xs font-semibold text-secondary-700 border border-secondary-300 rounded-lg hover:bg-secondary-100 hover:border-secondary-400 transition-colors"
        >
          <IoCreateOutline className="text-sm" />
          Edit
        </button>
      </div>

      <div className="rounded-xl border border-secondary-200 bg-secondary-50/60 p-4 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <InfoRow icon={IoPersonOutline} label="Recipient" value={recipientName} />
          <InfoRow icon={IoCallOutline} label="Phone" value={phone} />
        </div>
        <InfoRow icon={IoHomeOutline} label="Street" value={streetLine} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <InfoRow icon={IoLocationOutline} label="City / Region" value={cityLine} />
          <InfoRow icon={IoGlobeOutline} label="Country" value={address.country} />
        </div>
      </div>
    </div>
  );
};

// Stripe Card Input Component
const CardInput = ({ onPaymentSuccess, amount, orderData }) => {
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
      const intentData = await paymentAPI.createShopPaymentIntent({
        amount: orderData.total,
        email: orderData.email,
        items: orderData.items,
      });

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
        onPaymentSuccess(paymentIntent.id, intentData.paymentIntentId);
      } else {
        throw new Error("Payment was not successful");
      }
    } catch (error) {
      showError(
        error.message || "Payment processing failed. Please try again.",
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
        <label className="block text-primary-700 font-semibold mb-2">
          Card Information *
        </label>
        <div className="px-4 py-3 border-2 border-primary-200 rounded-xl focus-within:border-tertiary-500 transition-colors bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>
      <motion.button
        type="button"
        onClick={handlePayment}
        disabled={!stripe || processing}
        className="w-full px-6 py-4 bg-gradient-to-r from-accent-500 to-accent-400 text-primary-950 font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: processing ? 1 : 1.02 }}
        whileTap={{ scale: processing ? 1 : 0.98 }}
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              className="w-5 h-5 border-2 border-primary-950 border-t-transparent rounded-full"
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

const ApplePayInput = ({ onPaymentSuccess, amount, orderData }) => {
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
        label: "The Arena",
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
        const intentData = await paymentAPI.createShopPaymentIntent({
          amount: orderData.total,
          email: orderData.email,
          items: orderData.items,
        });

        if (!intentData.clientSecret) {
          throw new Error(
            intentData.error || "Failed to create payment intent",
          );
        }

        const { error, paymentIntent } = await stripe.confirmCardPayment(
          intentData.clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false },
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
            throw new Error(
              actionError.message || "Apple Pay authentication failed",
            );
          }
          finalIntent = actedIntent;
        }

        if (finalIntent.status === "succeeded") {
          onPaymentSuccess(finalIntent.id, intentData.paymentIntentId);
        } else {
          throw new Error("Apple Pay payment was not successful");
        }
      } catch (error) {
        showError(error.message || "Apple Pay processing failed.");
        setProcessing(false);
      }
    });
  }, [stripe, amount, orderData, onPaymentSuccess, showError]);

  if (!paymentRequest) {
    return (
      <div className="text-sm text-primary-600 bg-primary-100 border border-primary-200 rounded-xl p-4">
        Apple Pay is not available on this device/browser. Please use
        Credit/Debit Card or another payment option.
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
        <p className="text-xs text-primary-600 text-center">
          Processing Apple Pay...
        </p>
      )}
    </div>
  );
};

// Zelle Payment Form Component
const ZellePaymentForm = ({ onPaymentSuccess, amount, orderData }) => {
  const { showError } = useNotification();
  const [processing, setProcessing] = useState(false);
  const [zelleInfo, setZelleInfo] = useState(null);
  const [loadingZelleInfo, setLoadingZelleInfo] = useState(true);
  const [formData, setFormData] = useState({
    sendersName: "",
    email: "",
    amount: amount.toFixed(2),
    transactionReference: "",
  });

  // Fetch Zelle payment info
  useEffect(() => {
    const fetchZelleInfo = async () => {
      try {
        const info = await paymentAPI.getZelleInfo();
        console.log("Zelle info loaded:", info);
        setZelleInfo(info);
      } catch (error) {
        console.error("Failed to load Zelle info:", error);
        // Set default values so QR code still displays
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

    // Validate required fields
    if (!formData.sendersName.trim()) {
      showError("Please enter your name (sender's name)");
      return;
    }

    if (!formData.email.trim()) {
      showError("Please enter your email address");
      return;
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email.trim())) {
      showError("Please enter a valid email address");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showError("Please enter a valid amount");
      return;
    }

    // Validate amount matches order total
    const enteredAmount = parseFloat(formData.amount);
    const orderTotal = parseFloat(amount.toFixed(2));
    if (Math.abs(enteredAmount - orderTotal) > 0.01) {
      showError(`Amount must match order total of $${orderTotal.toFixed(2)}`);
      return;
    }

    setProcessing(true);
    try {
      // Create order with Zelle payment method (pending status)
      await onPaymentSuccess(null, null, {
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
        error.message || "Failed to submit Zelle payment. Please try again.",
      );
      setProcessing(false);
    }
  };

  // Get the QR code image URL - use configured one or default to /zelle.jpg
  const rawZelleQr = zelleInfo?.qrCodeImage || "/zelle.jpg";
  const qrCodeImageUrl = rawZelleQr.startsWith("/uploads/")
    ? absoluteMediaSrc(rawZelleQr)
    : rawZelleQr;

  console.log("QR Code Image URL:", qrCodeImageUrl);
  console.log("Zelle Info:", zelleInfo);
  console.log("Loading Zelle Info:", loadingZelleInfo);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* QR Code Display - Always show */}
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
            <div className="relative">
              <img
                src={qrCodeImageUrl}
                alt="Zelle QR Code"
                className="max-w-full h-auto rounded-lg border-2 border-blue-100"
                style={{ maxWidth: "300px", maxHeight: "300px" }}
                onLoad={() => {
                  console.log(
                    "QR code image loaded successfully:",
                    qrCodeImageUrl,
                  );
                }}
                onError={(e) => {
                  console.error(
                    "Failed to load Zelle QR code image:",
                    qrCodeImageUrl,
                  );
                  console.error("Image error details:", e);
                  e.target.style.display = "none";
                  const errorMsg = e.target.nextElementSibling;
                  if (errorMsg) {
                    errorMsg.style.display = "block";
                  }
                }}
              />
              <p
                className="text-xs text-red-600 mt-2"
                style={{ display: "none" }}
              >
                Failed to load QR code image. Please ensure zelle.jpg exists in
                the public folder or that a valid URL is configured in payment
                settings.
                <br />
                Attempted URL: {qrCodeImageUrl}
              </p>
            </div>
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
            Your order will be processed after manual verification (usually
            within 24 hours)
          </li>
        </ol>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-primary-700 font-semibold mb-2">
            Sender's Name *
          </label>
          <input
            type="text"
            value={formData.sendersName}
            onChange={(e) =>
              setFormData({ ...formData, sendersName: e.target.value })
            }
            placeholder="Enter your full name"
            className="w-full px-4 py-3 border-2 border-primary-200 rounded-xl focus:border-tertiary-500 focus:outline-none transition-colors"
            required
          />
          <p className="text-xs text-primary-500 mt-1">
            The name associated with your Zelle account
          </p>
        </div>

        <div>
          <label className="block text-primary-700 font-semibold mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="your.email@example.com"
            className="w-full px-4 py-3 border-2 border-primary-200 rounded-xl focus:border-tertiary-500 focus:outline-none transition-colors"
            required
          />
          <p className="text-xs text-primary-500 mt-1">
            Email address associated with your Zelle payment
          </p>
        </div>

        <div>
          <label className="block text-primary-700 font-semibold mb-2">
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
              className="w-full pl-8 pr-4 py-3 border-2 border-primary-200 rounded-xl focus:border-tertiary-500 focus:outline-none transition-colors"
              required
            />
          </div>
          <p className="text-xs text-primary-500 mt-1">
            Order total:{" "}
            <span className="font-semibold">${amount.toFixed(2)}</span>
          </p>
        </div>

        <div>
          <label className="block text-primary-700 font-semibold mb-2">
            Transaction Reference (Optional)
          </label>
          <input
            type="text"
            value={formData.transactionReference}
            onChange={(e) =>
              setFormData({ ...formData, transactionReference: e.target.value })
            }
            placeholder="Enter transaction reference if available"
            className="w-full px-4 py-3 border-2 border-primary-200 rounded-xl focus:border-tertiary-500 focus:outline-none transition-colors"
          />
          <p className="text-xs text-primary-500 mt-1">
            Reference number from your Zelle payment confirmation (optional)
          </p>
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={processing}
        className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-400 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: processing ? 1 : 1.02 }}
        whileTap={{ scale: processing ? 1 : 0.98 }}
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            Submitting...
          </span>
        ) : (
          `Submit Zelle Payment`
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

const CashAppPaymentForm = ({ onPaymentSuccess, amount }) => {
  const { showError } = useNotification();
  const [processing, setProcessing] = useState(false);
  const [cashAppInfo, setCashAppInfo] = useState(null);
  const [loadingCashAppInfo, setLoadingCashAppInfo] = useState(true);
  const [formData, setFormData] = useState({
    sendersName: "",
    email: "",
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
    const orderTotal = parseFloat(amount.toFixed(2));
    if (Math.abs(enteredAmount - orderTotal) > 0.01) {
      showError(`Amount must match order total of $${orderTotal.toFixed(2)}`);
      return;
    }

    setProcessing(true);
    try {
      await onPaymentSuccess(null, null, {
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
        error.message || "Failed to submit Cash App payment. Please try again.",
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
            Your order will be processed after manual verification (usually
            within 24 hours)
          </li>
        </ol>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-primary-700 font-semibold mb-2">
            Sender's Name *
          </label>
          <input
            type="text"
            value={formData.sendersName}
            onChange={(e) =>
              setFormData({ ...formData, sendersName: e.target.value })
            }
            placeholder="Enter your full name"
            className="w-full px-4 py-3 border-2 border-primary-200 rounded-xl focus:border-tertiary-500 focus:outline-none transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-primary-700 font-semibold mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="your.email@example.com"
            className="w-full px-4 py-3 border-2 border-primary-200 rounded-xl focus:border-tertiary-500 focus:outline-none transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-primary-700 font-semibold mb-2">
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
              className="w-full pl-8 pr-4 py-3 border-2 border-primary-200 rounded-xl focus:border-tertiary-500 focus:outline-none transition-colors"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-primary-700 font-semibold mb-2">
            Transaction Reference (Optional)
          </label>
          <input
            type="text"
            value={formData.transactionReference}
            onChange={(e) =>
              setFormData({ ...formData, transactionReference: e.target.value })
            }
            placeholder="Enter transaction reference if available"
            className="w-full px-4 py-3 border-2 border-primary-200 rounded-xl focus:border-tertiary-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={processing}
        className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: processing ? 1 : 1.02 }}
        whileTap={{ scale: processing ? 1 : 0.98 }}
      >
        {processing ? "Submitting..." : "Submit Cash App Payment"}
      </motion.button>
    </form>
  );
};

const CheckoutModal = ({ orderData, onClose, onSuccess }) => {
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [stripePromise, setStripePromise] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [step, setStep] = useState("shipping");
  const [checkoutOrder, setCheckoutOrder] = useState(null);

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

  const handlePaymentSuccess = async (
    paymentIntentId,
    stripePaymentIntentId,
    manualPaymentData = null,
  ) => {
    setProcessing(true);
    try {
      // Create order in our system
      const orderPayload = {
        ...checkoutOrder,
        paymentMethod: manualPaymentData
          ? manualPaymentData.paymentMethod
          : paymentMethod === "apple_pay"
            ? "apple_pay"
            : "stripe",
      };

      if (manualPaymentData) {
        // For manual payments, include details and set status to pending
        orderPayload.zellePayment = manualPaymentData.zellePayment;
        orderPayload.paymentStatus = "pending";
        orderPayload.status = "pending";
      } else {
        // For Stripe/Apple Pay payments
        orderPayload.paymentIntentId = stripePaymentIntentId;
        orderPayload.paymentStatus = "paid";
        orderPayload.status = "confirmed";
      }

      const created = await shopAPI.createOrder(orderPayload);

      if (created?.order) {
        // Clear cart
        clearCart();

        // Clear any stored checkout draft
        window.localStorage.removeItem("lastCheckoutOrder");

        if (manualPaymentData?.paymentMethod === "zelle") {
          showSuccess(
            "Zelle payment submitted! Your order will be processed after verification (usually within 24 hours). Check your email for confirmation.",
          );
        } else if (manualPaymentData?.paymentMethod === "cash_app") {
          showSuccess(
            "Cash App payment submitted! Your order will be processed after verification (usually within 24 hours). Check your email for confirmation.",
          );
        } else {
          showSuccess(
            "Order placed successfully! Check your email for confirmation.",
          );
        }

        setTimeout(() => {
          onSuccess(created.order);
          onClose();
        }, 1500);
      } else {
        throw new Error("Failed to create order");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      showError(
        error.message || "Failed to create order. Please contact support.",
      );
      setProcessing(false);
    }
  };

  if (!orderData) {
    return null;
  }

  const activeOrder = checkoutOrder || orderData;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-primary-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-3xl border-2 border-secondary-200 p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <motion.h2
              className="text-3xl font-black text-primary-950"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {step === "shipping" ? "Delivery Details" : "Complete Payment"}
            </motion.h2>
            <motion.button
              onClick={onClose}
              className="text-primary-400 hover:text-primary-600 text-2xl"
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ×
            </motion.button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`flex items-center gap-2 text-sm font-semibold ${
                step === "shipping" ? "text-tertiary-600" : "text-primary-400"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === "shipping"
                    ? "bg-tertiary-500 text-white"
                    : "bg-tertiary-500 text-white"
                }`}
              >
                {step === "payment" ? "✓" : "1"}
              </span>
              Delivery
            </div>
            <div className="flex-1 h-0.5 bg-secondary-200" />
            <div
              className={`flex items-center gap-2 text-sm font-semibold ${
                step === "payment" ? "text-tertiary-600" : "text-primary-400"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === "payment"
                    ? "bg-tertiary-500 text-white"
                    : "bg-primary-200 text-primary-500"
                }`}
              >
                2
              </span>
              Payment
            </div>
          </div>

          {step === "shipping" ? (
            <ShippingForm
              user={user}
              orderData={orderData}
              initialShipping={checkoutOrder?.shipping}
              onContinue={(data) => {
                setCheckoutOrder(data);
                setStep("payment");
              }}
              onCancel={onClose}
            />
          ) : (
            <>
              {/* Order Summary */}
              <motion.div
                className="mb-6 p-4 bg-white rounded-xl border-2 border-secondary-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-primary-600">Items:</span>
                    <p className="font-bold text-primary-950">
                      {activeOrder.items.length}{" "}
                      {activeOrder.items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div>
                    <span className="text-primary-600">Subtotal:</span>
                    <p className="font-bold text-primary-950">
                      ${activeOrder.subtotal.toFixed(2)}
                    </p>
                  </div>
                  {activeOrder.discount > 0 && (
                    <div>
                      <span className="text-primary-600">Discount:</span>
                      <p className="font-bold text-secondary-600">
                        -${activeOrder.discount.toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-primary-600">Total:</span>
                    <p className="font-bold text-tertiary-600 text-xl">
                      ${activeOrder.total.toFixed(2)}
                    </p>
                  </div>
                </div>
                <DeliverySummary
                  shipping={activeOrder.shipping}
                  onEdit={() => setStep("shipping")}
                />
              </motion.div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <label className="block text-primary-700 font-semibold mb-3">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <motion.button
                    type="button"
                    onClick={() => setPaymentMethod("stripe")}
                    className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                      paymentMethod === "stripe"
                        ? "border-tertiary-500 bg-tertiary-50 text-tertiary-700"
                        : "border-secondary-200 bg-white text-primary-600 hover:border-secondary-400"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    💳 Credit/Debit Card
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setPaymentMethod("apple_pay")}
                    className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                      paymentMethod === "apple_pay"
                        ? "border-gray-700 bg-gray-100 text-gray-900"
                        : "border-secondary-200 bg-white text-primary-600 hover:border-secondary-400"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                     Apple Pay
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setPaymentMethod("zelle")}
                    className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                      paymentMethod === "zelle"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-secondary-200 bg-white text-primary-600 hover:border-secondary-400"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    💰 Zelle
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setPaymentMethod("cash_app")}
                    className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                      paymentMethod === "cash_app"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-secondary-200 bg-white text-primary-600 hover:border-secondary-400"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    $ Cash App
                  </motion.button>
                </div>
              </div>

              {/* Payment Form */}
              {paymentMethod === "zelle" ? (
                <ZellePaymentForm
                  onPaymentSuccess={handlePaymentSuccess}
                  amount={activeOrder.total}
                  orderData={activeOrder}
                />
              ) : paymentMethod === "cash_app" ? (
                <CashAppPaymentForm
                  onPaymentSuccess={handlePaymentSuccess}
                  amount={activeOrder.total}
                />
              ) : paymentMethod === "apple_pay" && stripePromise ? (
                <Elements stripe={stripePromise}>
                  <ApplePayInput
                    onPaymentSuccess={handlePaymentSuccess}
                    amount={activeOrder.total}
                    orderData={activeOrder}
                  />
                </Elements>
              ) : stripePromise ? (
                <Elements stripe={stripePromise}>
                  <CardInput
                    onPaymentSuccess={handlePaymentSuccess}
                    amount={activeOrder.total}
                    orderData={activeOrder}
                  />
                </Elements>
              ) : (
                <div className="text-center py-8">
                  <p className="text-primary-600">Loading payment form...</p>
                </div>
              )}

              {/* Security Notice */}
              <div className="mt-6 pt-6 border-t border-secondary-200">
                <p className="text-xs text-primary-500 text-center">
                  {paymentMethod === "zelle" ? (
                    <>
                      💰 Zelle payments require manual verification. Your order
                      will be processed within 24 hours after payment
                      confirmation.
                    </>
                  ) : paymentMethod === "cash_app" ? (
                    <>
                      $ Cash App payments require manual verification. Your
                      order will be processed within 24 hours after payment
                      confirmation.
                    </>
                  ) : paymentMethod === "apple_pay" ? (
                    <>🔒 Apple Pay is securely processed by Stripe.</>
                  ) : (
                    <>
                      🔒 Secure payment processed by Stripe. Your card
                      information is never stored on our servers.
                    </>
                  )}
                </p>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CheckoutModal;
