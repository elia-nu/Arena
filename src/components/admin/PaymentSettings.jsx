import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { paymentAPI, mediaAPI } from "../../services/api";
import { useNotification } from "../NotificationProvider";

const PaymentSettings = ({ onSave }) => {
  const { showSuccess, showError } = useNotification();
  const [activeGateway, setActiveGateway] = useState("stripe");
  const [stripe, setStripe] = useState({
    publishableKey: "",
    secretKey: "",
    webhookSecret: "",
  });
  const [paypal, setPaypal] = useState({
    clientId: "",
    clientSecret: "",
    webhookId: "",
  });
  const [other, setOther] = useState({
    name: "",
    apiKey: "",
    webhookSecret: "",
  });
  const [zelle, setZelle] = useState({
    qrCodeImage: "/zelle.jpg", // Default to public folder image
    email: "",
    phone: "",
    name: "",
  });
  const [cashApp, setCashApp] = useState({
    qrCodeImage: "",
    cashTag: "",
    name: "",
  });
  const [registrationFee, setRegistrationFee] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savingFee, setSavingFee] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [qrCodePreview, setQrCodePreview] = useState(null);
  const [uploadingQr, setUploadingQr] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [paymentData, feeData] = await Promise.all([
        paymentAPI.getPaymentSettings(),
        paymentAPI.getRegistrationFeeSettings(),
      ]);

      if (paymentData) {
        setStripe(
          paymentData.stripe || {
            publishableKey: "",
            secretKey: "",
            webhookSecret: "",
          }
        );
        setPaypal(
          paymentData.paypal || {
            clientId: "",
            clientSecret: "",
            webhookId: "",
          }
        );
        setOther(
          paymentData.other || { name: "", apiKey: "", webhookSecret: "" }
        );
        const zelleData = paymentData.zelle || {
          qrCodeImage: "/zelle.jpg", // Default to public folder image
          email: "",
          phone: "",
          name: "",
        };
        setZelle(zelleData);
        setQrCodePreview(zelleData.qrCodeImage || "/zelle.jpg");
        setCashApp(
          paymentData.cashApp || {
            qrCodeImage: "",
            cashTag: "",
            name: "",
          }
        );
        setActiveGateway(paymentData.activeGateway || "stripe");
      }

      if (feeData) {
        setRegistrationFee(feeData.registrationFee || 0);
      }
    } catch (error) {
      console.error("Error fetching payment settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await paymentAPI.savePaymentSettings({
        stripe,
        paypal,
        other,
        zelle,
        cashApp,
        activeGateway,
      });
      await onSave?.({
        stripe,
        paypal,
        other,
        zelle,
        cashApp,
        activeGateway,
      });
      setMessage("Payment settings saved successfully to database.");
    } catch (error) {
      setMessage(error.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleQrCodeUpload = async (event, target = "zelle") => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please upload a valid image file.");
      event.target.value = "";
      return;
    }

    try {
      setUploadingQr(true);
      const result = await mediaAPI.uploadImage(file);
      if (!result?.url) {
        throw new Error("Upload succeeded but no URL was returned.");
      }

      if (target === "cashApp") {
        setCashApp((prev) => ({
          ...prev,
          qrCodeImage: result.url,
        }));
      } else {
        setZelle((prev) => ({
          ...prev,
          qrCodeImage: result.url,
        }));
        setQrCodePreview(result.url);
      }
      showSuccess("QR code image uploaded successfully.");
    } catch (error) {
      console.error("Error uploading Zelle QR code image:", error);
      showError(error.message || "Failed to upload QR code image.");
    } finally {
      setUploadingQr(false);
      event.target.value = "";
    }
  };

  const gatewayTabs = [
    { id: "stripe", label: "Stripe" },
    { id: "paypal", label: "PayPal" },
    { id: "zelle", label: "Zelle" },
    { id: "cashApp", label: "Cash App" },
    { id: "other", label: "Other Gateway" },
  ];

  return (
    <motion.div
      className="bg-white border-2 border-primary-200 rounded-3xl p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-3xl font-bold text-secondary-600 mb-6">
        Payment Settings
      </h2>
      <p className="text-primary-700 mb-6">
        Select a gateway and enter its credentials. Do not commit secrets to
        source control; store them in environment variables or a secret manager.
      </p>

      {/* Registration Fee Setting */}
      <div className="mb-8 p-6 bg-primary-100 rounded-xl border-2 border-primary-200">
        <h3 className="text-xl font-bold text-secondary-600 mb-4">
          Registration Fee
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-primary-800 mb-2">
              Amount (USD)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={registrationFee}
              onChange={(e) =>
                setRegistrationFee(parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
              className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
            />
            <p className="text-xs text-primary-600 mt-1">
              Set to 0 to make registration free. Users will be charged this
              amount during registration.
            </p>
          </div>
          <div className="pt-6">
            <button
              type="button"
              onClick={async () => {
                setSavingFee(true);
                try {
                  await paymentAPI.saveRegistrationFee(registrationFee);
                  showSuccess("Registration fee saved successfully");
                } catch (error) {
                  showError(error.message || "Failed to save registration fee");
                } finally {
                  setSavingFee(false);
                }
              }}
              disabled={savingFee}
              className="px-6 py-3 bg-secondary-500 text-white font-semibold rounded-lg hover:bg-secondary-600 transition-colors disabled:opacity-60"
            >
              {savingFee ? "Saving..." : "Save Fee"}
            </button>
          </div>
        </div>
      </div>

      {/* Gateway selector */}
      <div className="flex gap-3 mb-6 border-b-2 border-primary-200">
        {gatewayTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveGateway(tab.id)}
            className={`px-4 py-2 font-semibold transition-colors border-b-2 -mb-0.5 ${
              activeGateway === tab.id
                ? "text-tertiary-600 border-tertiary-600"
                : "text-primary-600 border-transparent hover:text-primary-950"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-primary-600 py-8">
          Loading settings...
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSave}>
          <AnimatePresence mode="wait">
            {activeGateway === "stripe" && (
              <motion.div
                key="stripe"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-primary-800 mb-2">
                    Stripe Publishable Key
                  </label>
                  <input
                    type="text"
                    value={stripe.publishableKey}
                    onChange={(e) =>
                      setStripe({ ...stripe, publishableKey: e.target.value })
                    }
                    placeholder="pk_test_... or pk_live_..."
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                  <p className="text-xs text-primary-600 mt-1">
                    This key is safe to expose in your frontend code
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary-800 mb-2">
                    Stripe Secret Key
                  </label>
                  <input
                    type="password"
                    value={stripe.secretKey}
                    onChange={(e) =>
                      setStripe({ ...stripe, secretKey: e.target.value })
                    }
                    placeholder="sk_test_... or sk_live_..."
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                  <p className="text-xs text-primary-600 mt-1">
                    Keep this secret! Never expose it in frontend code
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary-800 mb-2">
                    Stripe Webhook Secret
                  </label>
                  <input
                    type="password"
                    value={stripe.webhookSecret}
                    onChange={(e) =>
                      setStripe({ ...stripe, webhookSecret: e.target.value })
                    }
                    placeholder="whsec_***"
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                  <p className="text-xs text-primary-600 mt-1">
                    Used to verify webhook requests from Stripe
                  </p>
                </div>
              </motion.div>
            )}

            {activeGateway === "paypal" && (
              <motion.div
                key="paypal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-primary-800 mb-2">
                    PayPal Client ID
                  </label>
                  <input
                    type="password"
                    value={paypal.clientId}
                    onChange={(e) =>
                      setPaypal({ ...paypal, clientId: e.target.value })
                    }
                    placeholder="paypal-client-id"
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary-800 mb-2">
                    PayPal Client Secret
                  </label>
                  <input
                    type="password"
                    value={paypal.clientSecret}
                    onChange={(e) =>
                      setPaypal({ ...paypal, clientSecret: e.target.value })
                    }
                    placeholder="paypal-client-secret"
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary-800 mb-2">
                    PayPal Webhook ID
                  </label>
                  <input
                    type="text"
                    value={paypal.webhookId}
                    onChange={(e) =>
                      setPaypal({ ...paypal, webhookId: e.target.value })
                    }
                    placeholder="paypal-webhook-id"
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
              </motion.div>
            )}

            {activeGateway === "zelle" && (
              <motion.div
                key="zelle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900 font-semibold mb-2">
                    Zelle Payment Configuration
                  </p>
                  <p className="text-xs text-blue-700">
                    Configure your Zelle payment details. Upload your QR code image and provide recipient information.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary-800 mb-2">
                    QR Code Image *
                  </label>
                  
                  <div className="mb-3">
                    <p className="text-xs text-primary-600 mb-2">
                      Place your QR code image as <code className="bg-gray-100 px-1 rounded">zelle.jpg</code> in the <code className="bg-gray-100 px-1 rounded">public</code> folder.
                    </p>
                    <div className="mb-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrCodeUpload}
                        disabled={uploadingQr}
                        className="block w-full text-xs text-primary-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-primary-600 mt-1">
                        Or upload a new QR code image. It will be stored securely on the server.
                      </p>
                    </div>
                    <input
                      type="text"
                      value={zelle.qrCodeImage || "/zelle.jpg"}
                      onChange={(e) => {
                        const url = e.target.value;
                        setZelle({ ...zelle, qrCodeImage: url });
                        if (url) {
                          setQrCodePreview(url);
                        }
                      }}
                      placeholder="/zelle.jpg"
                      className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none text-sm"
                    />
                    <p className="text-xs text-primary-600 mt-1">
                      Default: <code>/zelle.jpg</code> (from public folder)
                    </p>
                  </div>

                  {/* Preview */}
                  {(qrCodePreview || zelle.qrCodeImage) && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                      <p className="text-xs text-gray-600 mb-2 font-semibold">Preview:</p>
                      <div className="flex justify-center">
                        <img
                          src={qrCodePreview || zelle.qrCodeImage}
                          alt="Zelle QR Code Preview"
                          className="max-w-xs h-auto rounded border-2 border-gray-300"
                          onLoad={() => {
                            // Image loaded successfully
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const errorMsg = e.target.nextElementSibling;
                            if (errorMsg) {
                              errorMsg.style.display = 'block';
                            }
                          }}
                        />
                        <p className="text-xs text-red-600 mt-2" style={{ display: 'none' }}>
                          Failed to load image. Please check the URL or upload a new image.
                        </p>
                      </div>
                      {zelle.qrCodeImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setZelle({ ...zelle, qrCodeImage: "" });
                            setQrCodePreview(null);
                          }}
                          className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                        >
                          Remove Image
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary-800 mb-2">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={zelle.name}
                    onChange={(e) =>
                      setZelle({ ...zelle, name: e.target.value })
                    }
                    placeholder="e.g. HAFTOM"
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                  <p className="text-xs text-primary-600 mt-1">
                    Name that will appear in the payment instructions
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary-800 mb-2">
                    Zelle Email
                  </label>
                  <input
                    type="email"
                    value={zelle.email}
                    onChange={(e) =>
                      setZelle({ ...zelle, email: e.target.value })
                    }
                    placeholder="zelle@example.com"
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary-800 mb-2">
                    Zelle Phone
                  </label>
                  <input
                    type="tel"
                    value={zelle.phone}
                    onChange={(e) =>
                      setZelle({ ...zelle, phone: e.target.value })
                    }
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                  <p className="text-xs text-primary-600 mt-1">
                    Phone number associated with your Zelle account
                  </p>
                </div>
              </motion.div>
            )}

            {activeGateway === "cashApp" && (
              <motion.div
                key="cashApp"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {activeGateway === "cashApp" && (
                  <>
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-green-900 font-semibold mb-2">
                        Cash App Configuration
                      </p>
                      <p className="text-xs text-green-700">
                        Add your Cash App tag and QR code so users can send manual payments.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-primary-800 mb-2">
                        Cash App Tag *
                      </label>
                      <input
                        type="text"
                        value={cashApp.cashTag}
                        onChange={(e) =>
                          setCashApp({ ...cashApp, cashTag: e.target.value })
                        }
                        placeholder="$yourcashtag"
                        className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-primary-800 mb-2">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        value={cashApp.name}
                        onChange={(e) =>
                          setCashApp({ ...cashApp, name: e.target.value })
                        }
                        placeholder="e.g. Haftom"
                        className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-primary-800 mb-2">
                        Cash App QR Code
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleQrCodeUpload(e, "cashApp")}
                        disabled={uploadingQr}
                        className="block w-full text-xs text-primary-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                      <input
                        type="text"
                        value={cashApp.qrCodeImage || ""}
                        onChange={(e) =>
                          setCashApp({ ...cashApp, qrCodeImage: e.target.value })
                        }
                        placeholder="https://.../cashapp-qr.png"
                        className="w-full mt-2 px-4 py-2 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none text-sm"
                      />
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {activeGateway === "other" && (
              <motion.div
                key="other"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-primary-800 mb-2">
                    Gateway Name
                  </label>
                  <input
                    type="text"
                    value={other.name}
                    onChange={(e) =>
                      setOther({ ...other, name: e.target.value })
                    }
                    placeholder="e.g. Razorpay, Flutterwave"
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary-800 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={other.apiKey}
                    onChange={(e) =>
                      setOther({ ...other, apiKey: e.target.value })
                    }
                    placeholder="api_key_***"
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary-800 mb-2">
                    Webhook Secret (optional)
                  </label>
                  <input
                    type="password"
                    value={other.webhookSecret}
                    onChange={(e) =>
                      setOther({ ...other, webhookSecret: e.target.value })
                    }
                    placeholder="webhook_secret_***"
                    className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-tertiary-500 outline-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-secondary-500 text-white font-semibold rounded-lg hover:bg-secondary-600 transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>

          {message && (
            <p className="text-sm text-primary-700 mt-2" role="status">
              {message}
            </p>
          )}
        </form>
      )}
    </motion.div>
  );
};

export default PaymentSettings;
