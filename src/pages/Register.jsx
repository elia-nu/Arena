import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoMailOutline,
  IoShieldCheckmarkOutline,
  IoPersonOutline,
  IoArrowBack,
  IoCheckmarkCircle,
} from "react-icons/io5";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../components/NotificationProvider";
import { paymentAPI, authAPI } from "../services/api";

const COUNTRY_CODE_OPTIONS = [
  "+1",
  "+44",
  "+91",
  "+251",
  "+234",
  "+254",
  "+27",
  "+20",
];

const STEPS = [
  { id: "email", label: "Email", icon: IoMailOutline },
  { id: "otp", label: "Verify", icon: IoShieldCheckmarkOutline },
  { id: "details", label: "Details", icon: IoPersonOutline },
];

const splitPhoneNumber = (phone = "") => {
  const trimmedPhone = phone.trim();
  const matchedCode = COUNTRY_CODE_OPTIONS.find((code) =>
    trimmedPhone.startsWith(code),
  );

  if (!matchedCode) {
    return { countryCode: "+1", localNumber: trimmedPhone };
  }

  return {
    countryCode: matchedCode,
    localNumber: trimmedPhone.slice(matchedCode.length).trim(),
  };
};

const combinePhoneNumber = (countryCode, localNumber) =>
  `${countryCode}${localNumber ? ` ${localNumber}` : ""}`.trim();

const validateDob = (dob) => {
  if (!dob) {
    return "Date of birth is required";
  }

  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) {
    return "Please provide a valid date of birth";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);

  if (parsed >= today) {
    return "Date of birth must be in the past";
  }

  return null;
};

const calculateAge = (dob) => {
  if (!dob) return null;
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const m = today.getMonth() - parsed.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < parsed.getDate())) {
    age--;
  }
  return age;
};

const maskEmail = (email = "") => {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"•".repeat(Math.max(local.length - 2, 3))}@${domain}`;
};

const Register = () => {
  const [step, setStep] = useState("email");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [emailVerificationToken, setEmailVerificationToken] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef([]);

  const [registrationType, setRegistrationType] = useState("individual");
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    dob: "",
    guardianName: "",
    guardianPhone: "",
    guardianConsent: false,
  });
  const [teamData, setTeamData] = useState({
    teamName: "",
    teamMembers: [
      {
        phone: "",
        email: "",
        firstName: "",
        lastName: "",
        dob: "",
        password: "",
      },
    ],
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationFee, setRegistrationFee] = useState(0);
  const [processingSessionId, setProcessingSessionId] = useState(null);
  const { register } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchRegistrationFee = async () => {
      try {
        const data = await paymentAPI.getRegistrationFee();
        setRegistrationFee(data.registrationFee || 0);
      } catch (error) {
        console.error("Error fetching registration fee:", error);
        setRegistrationFee(0);
      }
    };
    fetchRegistrationFee();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setTimeout(
      () => setResendCooldown((prev) => Math.max(prev - 1, 0)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Restore verification after Stripe return so registration can complete
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const paymentSuccess = searchParams.get("payment");
    if (sessionId && paymentSuccess === "success") {
      const pending = localStorage.getItem("pendingRegistration");
      if (pending) {
        try {
          const stored = JSON.parse(pending);
          if (stored.emailVerificationToken && stored.verifiedEmail) {
            setEmailVerificationToken(stored.emailVerificationToken);
            setVerifiedEmail(stored.verifiedEmail);
            setFormData((prev) => ({
              ...prev,
              email: stored.verifiedEmail,
              ...(stored.registrationType === "individual"
                ? stored.registrationData
                : {}),
            }));
            if (stored.registrationType === "team") {
              setTeamData({
                teamName: stored.registrationData.teamName,
                teamMembers: stored.registrationData.teamMembers,
              });
            }
            setRegistrationType(stored.registrationType || "individual");
            setStep("details");
          }
        } catch (error) {
          console.error("Error restoring verification state:", error);
        }
      }
    }
  }, [searchParams]);

  const validateEmail = (email) => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
  };

  const validateIndividualForm = () => {
    const newErrors = {};

    if (!verifiedEmail || !validateEmail(verifiedEmail)) {
      newErrors.email = "Please verify your email first";
    }

    const individualPhone = formData.phone?.trim() || "";
    if (!individualPhone || individualPhone.length < 8) {
      newErrors.phone = "Phone is required (include country code, e.g. +251…)";
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.firstName || formData.firstName.trim().length < 1) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName || formData.lastName.trim().length < 1) {
      newErrors.lastName = "Last name is required";
    }

    const dobError = validateDob(formData.dob);
    if (dobError) {
      newErrors.dob = dobError;
    } else {
      const age = calculateAge(formData.dob);
      if (age !== null && age < 18) {
        if (!formData.guardianName || formData.guardianName.trim().length < 2) {
          newErrors.guardianName = "Parent/Guardian full name is required for minors";
        }
        if (!formData.guardianPhone || formData.guardianPhone.trim().length < 8) {
          newErrors.guardianPhone = "Parent/Guardian emergency phone is required";
        }
        if (!formData.guardianConsent) {
          newErrors.guardianConsent = "Parent/Guardian consent is required to register";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateTeamForm = () => {
    const newErrors = {};

    if (!teamData.teamName || teamData.teamName.trim().length < 2) {
      newErrors.teamName = "Team name must be at least 2 characters";
    }

    if (teamData.teamMembers.length < 2) {
      newErrors.teamMembers = "Team must have at least 2 members";
    }

    if (teamData.teamMembers.length > 7) {
      newErrors.teamMembers = "Team cannot have more than 7 members";
    }

    const memberEmails = new Set();
    const memberPhones = new Set();

    teamData.teamMembers.forEach((member, index) => {
      const phoneKey = member.phone?.trim().replace(/\s/g, "") || "";
      if (!phoneKey || phoneKey.length < 8) {
        newErrors[`member_${index}_phone`] =
          "Phone is required (include country code, e.g. +251…)";
      }

      const emailTrim = member.email?.trim();
      if (index === 0) {
        if (!verifiedEmail) {
          newErrors[`member_${index}_email`] = "Verify your email first";
        }
      } else if (emailTrim && !validateEmail(emailTrim)) {
        newErrors[`member_${index}_email`] = "Invalid email address";
      }

      if (!member.firstName || member.firstName.trim().length < 1) {
        newErrors[`member_${index}_firstName`] = "First name is required";
      }

      if (!member.lastName || member.lastName.trim().length < 1) {
        newErrors[`member_${index}_lastName`] = "Last name is required";
      }

      const memberDobError = validateDob(member.dob);
      if (memberDobError) {
        newErrors[`member_${index}_dob`] = memberDobError;
      }

      if (index === 0) {
        if (!member.password || member.password.length < 6) {
          newErrors[`member_${index}_password`] =
            "Password must be at least 6 characters";
        }
      }

      const emailLower = (index === 0 ? verifiedEmail : emailTrim)?.toLowerCase();

      if (phoneKey && memberPhones.has(phoneKey)) {
        newErrors[`member_${index}_phone`] = "Duplicate phone number";
      }
      if (phoneKey) memberPhones.add(phoneKey);

      if (emailLower && memberEmails.has(emailLower)) {
        newErrors[`member_${index}_email`] = "Duplicate email address";
      }
      if (emailLower) memberEmails.add(emailLower);
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const paymentSuccess = searchParams.get("payment");

    if (
      sessionId &&
      paymentSuccess === "success" &&
      !isSubmitting &&
      processingSessionId !== sessionId
    ) {
      const processedSessions = JSON.parse(
        localStorage.getItem("processedPaymentSessions") || "[]",
      );

      if (processedSessions.includes(sessionId)) {
        showSuccess("Registration completed! Redirecting...");
        setTimeout(() => navigate("/"), 1000);
        return;
      }

      setProcessingSessionId(sessionId);
      processedSessions.push(sessionId);
      localStorage.setItem(
        "processedPaymentSessions",
        JSON.stringify(processedSessions.slice(-10)),
      );

      const pendingRegistration = localStorage.getItem("pendingRegistration");
      if (pendingRegistration) {
        try {
          const stored = JSON.parse(pendingRegistration);
          if (Date.now() - stored.timestamp < 24 * 60 * 60 * 1000) {
            if (stored.registrationType === "individual") {
              setFormData(stored.registrationData);
              setRegistrationType("individual");
            } else {
              setTeamData({
                teamName: stored.registrationData.teamName,
                teamMembers: stored.registrationData.teamMembers,
              });
              setRegistrationType("team");
            }
            if (stored.emailVerificationToken) {
              setEmailVerificationToken(stored.emailVerificationToken);
            }
            if (stored.verifiedEmail) {
              setVerifiedEmail(stored.verifiedEmail);
            }
            setStep("details");
          }
        } catch (error) {
          console.error("Error restoring registration data:", error);
        }
      }
      handlePaymentSuccess(sessionId);
    }
  }, [searchParams, isSubmitting, processingSessionId]);

  const handlePaymentSuccess = async (sessionId) => {
    try {
      setIsSubmitting(true);

      const paymentResult = await paymentAPI.verifySession(sessionId);

      if (paymentResult.success && paymentResult.paymentStatus === "paid") {
        const pendingRegistration = localStorage.getItem("pendingRegistration");
        let registrationData;
        let storedToken = emailVerificationToken;

        if (pendingRegistration) {
          try {
            const stored = JSON.parse(pendingRegistration);
            registrationData = stored.registrationData;
            storedToken =
              stored.emailVerificationToken || emailVerificationToken;
          } catch (error) {
            console.error("Error parsing stored registration data:", error);
          }
        }

        if (!registrationData) {
          if (registrationType === "individual") {
            const { confirmPassword, ...userData } = formData;
            registrationData = {
              registrationType: "individual",
              ...userData,
              email: verifiedEmail,
            };
          } else {
            registrationData = {
              registrationType: "team",
              teamName: teamData.teamName,
              teamMembers: teamData.teamMembers.map((m, i) =>
                i === 0 ? { ...m, email: verifiedEmail } : m,
              ),
            };
          }
        }

        registrationData.registrationFee = registrationFee;
        registrationData.paymentSessionId = sessionId;
        registrationData.emailVerificationToken = storedToken;

        const result = await register(registrationData);

        if (result.success) {
          localStorage.removeItem("pendingRegistration");
          setProcessingSessionId(null);

          showSuccess(
            registrationType === "individual"
              ? "Registration and payment successful! Welcome!"
              : "Team registration and payment successful! Welcome!",
          );

          setTimeout(() => {
            navigate("/");
          }, 1500);
        } else {
          if (result.error && result.error.includes("already exists")) {
            const processedSessions = JSON.parse(
              localStorage.getItem("processedPaymentSessions") || "[]",
            );

            if (processedSessions.includes(sessionId)) {
              showSuccess(
                "Registration completed! Your account has been created. Redirecting...",
              );
              setTimeout(() => {
                navigate("/login");
              }, 2000);
            } else {
              showError(
                "This email or phone is already registered. Please try logging in instead.",
              );
              setTimeout(() => {
                navigate("/login");
              }, 2000);
            }
          } else {
            setProcessingSessionId(null);
            showError(result.error || "Registration failed. Please try again.");
          }
        }
      } else {
        showError("Payment verification failed. Please try again.");
      }
    } catch (error) {
      console.error("Error in handlePaymentSuccess:", error);
      showError(
        error.message || "Payment verification failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    const email = formData.email.trim().toLowerCase();

    if (!email || !validateEmail(email)) {
      setErrors({ email: "Please provide a valid email address" });
      showError("Please provide a valid email address");
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await authAPI.sendRegistrationOtp(email);
      setVerifiedEmail("");
      setEmailVerificationToken("");
      setOtpDigits(["", "", "", "", "", ""]);
      setResendCooldown(result.cooldownSeconds || 60);
      setStep("otp");
      showSuccess("Verification code sent! Check your inbox.");
      setTimeout(() => otpRefs.current[0]?.focus(), 200);
    } catch (error) {
      if (error.status === 429 && error.data?.retryAfter) {
        setResendCooldown(error.data.retryAfter);
        showError(error.message);
      } else {
        showError(error.message || "Failed to send verification code");
      }
      if (error.data?.message?.includes("already exists")) {
        setErrors({ email: error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const otp = otpDigits.join("");
    const email = formData.email.trim().toLowerCase();

    if (!/^\d{6}$/.test(otp)) {
      setErrors({ otp: "Enter the 6-digit code from your email" });
      showError("Enter the 6-digit code from your email");
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await authAPI.verifyRegistrationOtp(email, otp);
      setVerifiedEmail(result.email);
      setEmailVerificationToken(result.emailVerificationToken);
      setFormData((prev) => ({ ...prev, email: result.email }));
      setTeamData((prev) => ({
        ...prev,
        teamMembers: prev.teamMembers.map((m, i) =>
          i === 0 ? { ...m, email: result.email } : m,
        ),
      }));
      setStep("details");
      showSuccess("Email verified! Complete your profile.");
    } catch (error) {
      setErrors({ otp: error.message });
      showError(error.message || "Invalid verification code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = cleaned;
    setOtpDigits(next);
    if (errors.otp) setErrors({ ...errors, otp: null });

    if (cleaned && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (cleaned && index === 5 && next.every((d) => d)) {
      // Auto-submit when last digit filled
      setTimeout(() => {
        const form = document.getElementById("otp-form");
        form?.requestSubmit();
      }, 50);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || "";
    }
    setOtpDigits(next);
    const focusIndex = Math.min(pasted.length, 5);
    otpRefs.current[focusIndex]?.focus();
    if (pasted.length === 6) {
      setTimeout(() => {
        document.getElementById("otp-form")?.requestSubmit();
      }, 50);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailVerificationToken || !verifiedEmail) {
      showError("Please verify your email before continuing");
      setStep("email");
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const isValid =
      registrationType === "individual"
        ? validateIndividualForm()
        : validateTeamForm();

    if (!isValid) {
      showError("Please fix the errors in the form");
      setIsSubmitting(false);
      return;
    }

    try {
      let registrationData;
      const individualPhone = formData.phone?.trim() || "";
      const teamName = teamData.teamName?.trim() || "";

      if (registrationType === "individual") {
        const { confirmPassword, ...userData } = formData;
        registrationData = {
          registrationType: "individual",
          ...userData,
          email: verifiedEmail,
          phone: individualPhone,
          registrationFee: registrationFee > 0 ? registrationFee : 0,
          emailVerificationToken,
        };
      } else {
        registrationData = {
          registrationType: "team",
          teamName,
          teamMembers: teamData.teamMembers.map((m, i) =>
            i === 0 ? { ...m, email: verifiedEmail } : m,
          ),
          registrationFee: registrationFee > 0 ? registrationFee : 0,
          emailVerificationToken,
        };
      }

      try {
        const availabilityCheck = await authAPI.checkAvailability({
          email: verifiedEmail,
          phone:
            registrationType === "individual" ? individualPhone : undefined,
          teamName: registrationType === "team" ? teamName : undefined,
          teamMembers:
            registrationType === "team" ? registrationData.teamMembers : undefined,
        });

        if (!availabilityCheck.available) {
          if (availabilityCheck.errors) {
            setErrors(availabilityCheck.errors);
            const errorMessages = Object.values(availabilityCheck.errors);
            showError(
              `Registration failed: ${errorMessages.join(
                ", ",
              )}. Please use different credentials.`,
            );
          } else {
            showError(
              "Email or phone already exists. Please use different credentials.",
            );
          }
          setIsSubmitting(false);
          return;
        }
      } catch (availabilityError) {
        if (availabilityError.status === 400 && availabilityError.data) {
          if (availabilityError.data.errors) {
            setErrors(availabilityError.data.errors);
            const errorMessages = Object.values(availabilityError.data.errors);
            showError(
              `Registration failed: ${errorMessages.join(
                ", ",
              )}. Please use different credentials.`,
            );
          } else {
            showError(
              availabilityError.data.message ||
                "Email or phone already exists. Please use different credentials.",
            );
          }
          setIsSubmitting(false);
          return;
        }

        showError(
          "Unable to verify account availability. Please try again or contact support.",
        );
        setIsSubmitting(false);
        return;
      }

      if (registrationFee > 0) {
        localStorage.setItem(
          "pendingRegistration",
          JSON.stringify({
            registrationData,
            registrationType,
            emailVerificationToken,
            verifiedEmail,
            timestamp: Date.now(),
          }),
        );

        const paymentSession = await paymentAPI.createSession({
          amount: registrationFee,
          currency: "usd",
          email: verifiedEmail,
          registrationType,
          // Never send passwords or verification tokens to Stripe
          metadata: {
            registrationType,
            email: verifiedEmail,
          },
        });

        if (paymentSession.checkoutUrl) {
          window.location.href = paymentSession.checkoutUrl;
          return;
        }
      }

      const result = await register(registrationData);

      if (result.success) {
        showSuccess(
          registrationType === "individual"
            ? "Registration successful! Welcome!"
            : "Team registered successfully! Welcome!",
        );
        navigate("/");
      } else {
        if (result.data?.requiresPayment) {
          localStorage.setItem(
            "pendingRegistration",
            JSON.stringify({
              registrationData,
              registrationType,
              emailVerificationToken,
              verifiedEmail,
              timestamp: Date.now(),
            }),
          );
          window.location.href = result.data.checkoutUrl;
        } else {
          showError(result.error || "Registration failed. Please try again.");
        }
      }
    } catch (error) {
      showError(error.message || "Registration failed. Please try again.");
    }

    setIsSubmitting(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleTeamDataChange = (field, value) => {
    setTeamData({
      ...teamData,
      [field]: value,
    });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleTeamMemberChange = (index, field, value) => {
    const updated = [...teamData.teamMembers];
    updated[index][field] = value;
    setTeamData({ ...teamData, teamMembers: updated });
    const errorKey = `member_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors({ ...errors, [errorKey]: null });
    }
  };

  const handleTeamMemberPhoneChange = (index, countryCode, localNumber) => {
    handleTeamMemberChange(
      index,
      "phone",
      combinePhoneNumber(countryCode, localNumber),
    );
  };

  const addTeamMember = () => {
    if (teamData.teamMembers.length >= 7) {
      showError("Team cannot have more than 7 members");
      return;
    }
    setTeamData({
      ...teamData,
      teamMembers: [
        ...teamData.teamMembers,
        {
          phone: "",
          email: "",
          firstName: "",
          lastName: "",
          dob: "",
          password: "",
        },
      ],
    });
  };

  const removeTeamMember = (index) => {
    if (teamData.teamMembers.length <= 2) {
      showError("Team must have at least 2 members");
      return;
    }
    setTeamData({
      ...teamData,
      teamMembers: teamData.teamMembers.filter((_, i) => i !== index),
    });
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const inputClass = (hasError) =>
    `w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-secondary-400/30 outline-none transition-all duration-300 ${
      hasError
        ? "border-red-400"
        : "border-white/20 focus:border-secondary-400"
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden pt-30">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2831&auto=format&fit=crop"
          alt="Soccer Field Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950/90 via-primary-950/80 to-primary-950/90" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full space-y-8 relative z-10"
      >
        <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="text-center mb-8">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-secondary-400 text-sm font-semibold tracking-[0.2em] uppercase mb-2"
              >
                Les Kick&apos;t
              </motion.p>
              <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                Create Account
              </h2>
              <p className="text-white/80">
                {step === "email" && "Start with your email address"}
                {step === "otp" && "Enter the code we sent you"}
                {step === "details" && "Tell us about yourself"}
              </p>
              {registrationFee > 0 && step === "details" && (
                <div className="mt-4 p-3 bg-secondary-500/20 backdrop-blur-sm border-2 border-secondary-400/30 rounded-lg inline-block">
                  <p className="text-sm text-white">
                    Registration Fee:{" "}
                    <span className="font-bold text-secondary-400 text-lg">
                      ${registrationFee}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Step progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between gap-2">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const done = i < stepIndex;
                  const active = i === stepIndex;
                  return (
                    <div key={s.id} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1.5">
                        <motion.div
                          animate={{
                            scale: active ? 1.08 : 1,
                            backgroundColor: done || active ? "#fe5723" : "rgba(255,255,255,0.1)",
                          }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                            done || active
                              ? "border-secondary-400 text-primary-950"
                              : "border-white/20 text-white/50"
                          }`}
                        >
                          {done ? (
                            <IoCheckmarkCircle className="text-xl" />
                          ) : (
                            <Icon className="text-lg" />
                          )}
                        </motion.div>
                        <span
                          className={`text-xs font-medium hidden sm:block ${
                            active || done ? "text-secondary-400" : "text-white/40"
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className="flex-1 h-0.5 mx-2 mb-5 sm:mb-6 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            className="h-full bg-secondary-500"
                            initial={false}
                            animate={{ width: done ? "100%" : "0%" }}
                            transition={{ duration: 0.4 }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* STEP 1: Email */}
              {step === "email" && (
                <motion.form
                  key="email"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                  onSubmit={handleSendOtp}
                >
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <IoMailOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-xl" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className={`${inputClass(errors.email)} pl-12`}
                        placeholder="you@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-2 text-xs text-red-300">{errors.email}</p>
                    )}
                    <p className="mt-3 text-xs text-white/60 leading-relaxed">
                      We&apos;ll send a one-time code to verify it&apos;s really you
                      before you finish signing up.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-semibold text-primary-950 bg-gradient-to-r from-secondary-400 via-secondary-500 to-secondary-400 hover:from-secondary-500 hover:via-secondary-600 hover:to-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Sending code..." : "Send verification code"}
                  </button>

                  <div className="text-center">
                    <p className="text-sm text-white">
                      Already have an account?{" "}
                      <Link
                        to="/login"
                        className="font-medium text-secondary-400 hover:text-secondary-300 transition-colors"
                      >
                        Sign in
                      </Link>
                    </p>
                  </div>
                </motion.form>
              )}

              {/* STEP 2: OTP */}
              {step === "otp" && (
                <motion.form
                  key="otp"
                  id="otp-form"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                  onSubmit={handleVerifyOtp}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setOtpDigits(["", "", "", "", "", ""]);
                      setErrors({});
                    }}
                    className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
                  >
                    <IoArrowBack />
                    Change email
                  </button>

                  <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center">
                    <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-secondary-500/20 border border-secondary-400/30 flex items-center justify-center">
                      <IoShieldCheckmarkOutline className="text-3xl text-secondary-400" />
                    </div>
                    <p className="text-white/90 text-sm mb-1">
                      Code sent to
                    </p>
                    <p className="text-secondary-400 font-semibold mb-6">
                      {maskEmail(formData.email)}
                    </p>

                    <div
                      className="flex justify-center gap-2 sm:gap-3"
                      onPaste={handleOtpPaste}
                    >
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            otpRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          autoComplete={index === 0 ? "one-time-code" : "off"}
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className={`w-11 h-14 sm:w-12 sm:h-14 text-center text-2xl font-bold rounded-xl bg-white/10 border-2 text-white outline-none transition-all duration-200 focus:border-secondary-400 focus:ring-2 focus:ring-secondary-400/30 ${
                            errors.otp ? "border-red-400" : "border-white/20"
                          }`}
                          aria-label={`Digit ${index + 1}`}
                        />
                      ))}
                    </div>
                    {errors.otp && (
                      <p className="mt-3 text-xs text-red-300">{errors.otp}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || otpDigits.join("").length !== 6}
                    className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-semibold text-primary-950 bg-gradient-to-r from-secondary-400 via-secondary-500 to-secondary-400 hover:from-secondary-500 hover:via-secondary-600 hover:to-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Verifying..." : "Verify email"}
                  </button>

                  <div className="text-center">
                    <p className="text-sm text-white/70">
                      Didn&apos;t get the code?{" "}
                      {resendCooldown > 0 ? (
                        <span className="text-white/50">
                          Resend in {resendCooldown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSubmitting}
                          className="font-medium text-secondary-400 hover:text-secondary-300 transition-colors disabled:opacity-50"
                        >
                          Resend code
                        </button>
                      )}
                    </p>
                  </div>
                </motion.form>
              )}

              {/* STEP 3: Details */}
              {step === "details" && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 px-4 py-3">
                    <IoCheckmarkCircle className="text-emerald-400 text-xl shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-emerald-300/80 uppercase tracking-wide font-semibold">
                        Email verified
                      </p>
                      <p className="text-sm text-white truncate">{verifiedEmail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setVerifiedEmail("");
                        setEmailVerificationToken("");
                        setOtpDigits(["", "", "", "", "", ""]);
                      }}
                      className="ml-auto text-xs text-white/60 hover:text-white shrink-0"
                    >
                      Change
                    </button>
                  </div>

                  <div className="mb-6">
                    <div className="flex bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
                      <button
                        type="button"
                        onClick={() => {
                          setRegistrationType("individual");
                          setErrors({});
                        }}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-300 ${
                          registrationType === "individual"
                            ? "bg-secondary-500 text-primary-950 shadow-lg"
                            : "text-white/80 hover:text-white"
                        }`}
                      >
                        Individual
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRegistrationType("team");
                          setErrors({});
                          setTeamData((prev) => ({
                            ...prev,
                            teamMembers: prev.teamMembers.map((m, i) =>
                              i === 0 ? { ...m, email: verifiedEmail } : m,
                            ),
                          }));
                        }}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-300 ${
                          registrationType === "team"
                            ? "bg-secondary-500 text-primary-950 shadow-lg"
                            : "text-white/80 hover:text-white"
                        }`}
                      >
                        Team
                      </button>
                    </div>
                  </div>

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <AnimatePresence mode="wait">
                      {registrationType === "individual" ? (
                        <motion.div
                          key="individual"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor="firstName"
                                className="block text-sm font-medium text-white mb-2"
                              >
                                First Name *
                              </label>
                              <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                className={inputClass(errors.firstName)}
                                placeholder="John"
                              />
                              {errors.firstName && (
                                <p className="mt-1 text-xs text-red-300">
                                  {errors.firstName}
                                </p>
                              )}
                            </div>

                            <div>
                              <label
                                htmlFor="lastName"
                                className="block text-sm font-medium text-white mb-2"
                              >
                                Last Name *
                              </label>
                              <input
                                id="lastName"
                                name="lastName"
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                                className={inputClass(errors.lastName)}
                                placeholder="Doe"
                              />
                              {errors.lastName && (
                                <p className="mt-1 text-xs text-red-300">
                                  {errors.lastName}
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="dob"
                              className="block text-sm font-medium text-white mb-2"
                            >
                              Date of Birth *
                            </label>
                            <input
                              id="dob"
                              name="dob"
                              type="date"
                              required
                              value={formData.dob}
                              onChange={handleChange}
                              max={new Date().toISOString().split("T")[0]}
                              className={`${inputClass(errors.dob)} [color-scheme:dark]`}
                            />
                            {errors.dob && (
                              <p className="mt-1 text-xs text-red-300">
                                {errors.dob}
                              </p>
                            )}
                          </div>

                          {calculateAge(formData.dob) !== null &&
                            calculateAge(formData.dob) < 18 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 space-y-3"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-400 text-primary-950">
                                    Youth Registration (Under 18)
                                  </span>
                                </div>
                                <p className="text-xs text-white/80">
                                  Participants under 18 require parent or legal
                                  guardian details and consent to participate.
                                </p>
                                <div>
                                  <label
                                    htmlFor="guardianName"
                                    className="block text-xs font-medium text-white mb-1"
                                  >
                                    Parent / Guardian Full Name *
                                  </label>
                                  <input
                                    id="guardianName"
                                    name="guardianName"
                                    type="text"
                                    value={formData.guardianName}
                                    onChange={handleChange}
                                    className={inputClass(errors.guardianName)}
                                    placeholder="Guardian Full Name"
                                  />
                                  {errors.guardianName && (
                                    <p className="mt-1 text-xs text-red-300">
                                      {errors.guardianName}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <label
                                    htmlFor="guardianPhone"
                                    className="block text-xs font-medium text-white mb-1"
                                  >
                                    Parent / Guardian Emergency Phone *
                                  </label>
                                  <input
                                    id="guardianPhone"
                                    name="guardianPhone"
                                    type="tel"
                                    value={formData.guardianPhone}
                                    onChange={handleChange}
                                    className={inputClass(errors.guardianPhone)}
                                    placeholder="+1 (555) 000-0000"
                                  />
                                  {errors.guardianPhone && (
                                    <p className="mt-1 text-xs text-red-300">
                                      {errors.guardianPhone}
                                    </p>
                                  )}
                                </div>
                                <div className="pt-1">
                                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-white/90">
                                    <input
                                      type="checkbox"
                                      name="guardianConsent"
                                      checked={formData.guardianConsent}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          guardianConsent: e.target.checked,
                                        }))
                                      }
                                      className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 text-secondary-500 focus:ring-secondary-500"
                                    />
                                    <span>
                                      I am the parent/legal guardian and grant
                                      permission for this participant to
                                      register and participate in Les
                                      Kick&apos;t events. *
                                    </span>
                                  </label>
                                  {errors.guardianConsent && (
                                    <p className="mt-1 text-xs text-red-300">
                                      {errors.guardianConsent}
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            )}

                          <div>
                            <label
                              htmlFor="phone"
                              className="block text-sm font-medium text-white mb-2"
                            >
                              Phone *
                            </label>
                            {(() => {
                              const { countryCode, localNumber } =
                                splitPhoneNumber(formData.phone);
                              return (
                                <div className="flex gap-2">
                                  <select
                                    value={countryCode}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        phone: combinePhoneNumber(
                                          e.target.value,
                                          localNumber,
                                        ),
                                      }))
                                    }
                                    className="w-24 px-2 py-3 text-sm bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg text-white focus:ring-2 focus:ring-secondary-400/30 outline-none transition-all focus:border-secondary-400"
                                  >
                                    {COUNTRY_CODE_OPTIONS.map((code) => (
                                      <option
                                        key={code}
                                        value={code}
                                        className="text-gray-900"
                                      >
                                        {code}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    required
                                    value={localNumber}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        phone: combinePhoneNumber(
                                          countryCode,
                                          e.target.value,
                                        ),
                                      }))
                                    }
                                    className={`flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border-2 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-secondary-400/30 outline-none transition-all duration-300 ${
                                      errors.phone
                                        ? "border-red-400"
                                        : "border-white/20 focus:border-secondary-400"
                                    }`}
                                    placeholder="912345678"
                                  />
                                </div>
                              );
                            })()}
                            {errors.phone && (
                              <p className="mt-1 text-xs text-red-300">
                                {errors.phone}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor="password"
                              className="block text-sm font-medium text-white mb-2"
                            >
                              Password *
                            </label>
                            <input
                              id="password"
                              name="password"
                              type="password"
                              autoComplete="new-password"
                              required
                              value={formData.password}
                              onChange={handleChange}
                              className={inputClass(errors.password)}
                              placeholder="••••••••"
                              minLength={6}
                            />
                            {errors.password ? (
                              <p className="mt-1 text-xs text-red-300">
                                {errors.password}
                              </p>
                            ) : (
                              <p className="mt-1 text-xs text-white/70">
                                Must be at least 6 characters
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor="confirmPassword"
                              className="block text-sm font-medium text-white mb-2"
                            >
                              Confirm Password *
                            </label>
                            <input
                              id="confirmPassword"
                              name="confirmPassword"
                              type="password"
                              autoComplete="new-password"
                              required
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              className={inputClass(errors.confirmPassword)}
                              placeholder="••••••••"
                              minLength={6}
                            />
                            {errors.confirmPassword && (
                              <p className="mt-1 text-xs text-red-300">
                                {errors.confirmPassword}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="team"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          <div>
                            <label
                              htmlFor="teamName"
                              className="block text-sm font-medium text-white mb-2"
                            >
                              Team Name *
                            </label>
                            <input
                              id="teamName"
                              name="teamName"
                              type="text"
                              required
                              value={teamData.teamName}
                              onChange={(e) =>
                                handleTeamDataChange("teamName", e.target.value)
                              }
                              className={inputClass(errors.teamName)}
                              placeholder="Team Awesome"
                              minLength={2}
                            />
                            {errors.teamName && (
                              <p className="mt-1 text-xs text-red-300">
                                {errors.teamName}
                              </p>
                            )}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                              <label className="block text-sm font-semibold text-white">
                                Team Members * (Minimum 5, Maximum 7)
                              </label>
                              <button
                                type="button"
                                onClick={addTeamMember}
                                disabled={teamData.teamMembers.length >= 7}
                                className="px-4 py-2 bg-secondary-500 text-primary-950 font-semibold rounded-lg text-sm hover:bg-secondary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                + Add Member
                              </button>
                            </div>
                            {errors.teamMembers && (
                              <p className="mb-2 text-xs text-red-300">
                                {errors.teamMembers}
                              </p>
                            )}

                            <div className="space-y-4">
                              {teamData.teamMembers.map((member, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="p-4 border-2 border-white/20 rounded-lg bg-white/5 backdrop-blur-sm"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-secondary-500">
                                      {index === 0
                                        ? "Team Leader"
                                        : `Member ${index}`}
                                    </h4>
                                    {index > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => removeTeamMember(index)}
                                        className="text-red-300 hover:text-red-200 text-sm font-medium"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-white mb-1">
                                        First Name *
                                      </label>
                                      <input
                                        type="text"
                                        required
                                        value={member.firstName}
                                        onChange={(e) =>
                                          handleTeamMemberChange(
                                            index,
                                            "firstName",
                                            e.target.value,
                                          )
                                        }
                                        className={`w-full px-3 py-2 text-sm bg-white/10 backdrop-blur-sm border-2 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-secondary-400/30 outline-none transition-all ${
                                          errors[`member_${index}_firstName`]
                                            ? "border-red-400"
                                            : "border-white/20 focus:border-secondary-400"
                                        }`}
                                        placeholder="John"
                                      />
                                      {errors[`member_${index}_firstName`] && (
                                        <p className="mt-1 text-xs text-red-300">
                                          {errors[`member_${index}_firstName`]}
                                        </p>
                                      )}
                                    </div>

                                    <div>
                                      <label className="block text-xs font-medium text-white mb-1">
                                        Last Name *
                                      </label>
                                      <input
                                        type="text"
                                        required
                                        value={member.lastName}
                                        onChange={(e) =>
                                          handleTeamMemberChange(
                                            index,
                                            "lastName",
                                            e.target.value,
                                          )
                                        }
                                        className={`w-full px-3 py-2 text-sm bg-white/10 backdrop-blur-sm border-2 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-secondary-400/30 outline-none transition-all ${
                                          errors[`member_${index}_lastName`]
                                            ? "border-red-400"
                                            : "border-white/20 focus:border-secondary-400"
                                        }`}
                                        placeholder="Doe"
                                      />
                                      {errors[`member_${index}_lastName`] && (
                                        <p className="mt-1 text-xs text-red-300">
                                          {errors[`member_${index}_lastName`]}
                                        </p>
                                      )}
                                    </div>

                                    <div>
                                      <label className="block text-xs font-medium text-white mb-1">
                                        Date of Birth *
                                      </label>
                                      <input
                                        type="date"
                                        required
                                        value={member.dob}
                                        onChange={(e) =>
                                          handleTeamMemberChange(
                                            index,
                                            "dob",
                                            e.target.value,
                                          )
                                        }
                                        max={
                                          new Date()
                                            .toISOString()
                                            .split("T")[0]
                                        }
                                        className={`w-full px-3 py-2 text-sm bg-white/10 backdrop-blur-sm border-2 rounded-lg text-white focus:ring-2 focus:ring-secondary-400/30 outline-none transition-all [color-scheme:dark] ${
                                          errors[`member_${index}_dob`]
                                            ? "border-red-400"
                                            : "border-white/20 focus:border-secondary-400"
                                        }`}
                                      />
                                      {errors[`member_${index}_dob`] && (
                                        <p className="mt-1 text-xs text-red-300">
                                          {errors[`member_${index}_dob`]}
                                        </p>
                                      )}
                                    </div>

                                    <div className="min-w-0">
                                      <label className="block text-xs font-medium text-white mb-1">
                                        Phone *
                                      </label>
                                      {(() => {
                                        const { countryCode, localNumber } =
                                          splitPhoneNumber(member.phone);
                                        return (
                                          <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                                            <select
                                              value={countryCode}
                                              onChange={(e) =>
                                                handleTeamMemberPhoneChange(
                                                  index,
                                                  e.target.value,
                                                  localNumber,
                                                )
                                              }
                                              className="w-full sm:w-24 px-2 py-2 text-sm bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg text-white focus:ring-2 focus:ring-secondary-400/30 outline-none transition-all focus:border-secondary-400"
                                            >
                                              {COUNTRY_CODE_OPTIONS.map(
                                                (code) => (
                                                  <option
                                                    key={code}
                                                    value={code}
                                                    className="text-gray-900"
                                                  >
                                                    {code}
                                                  </option>
                                                ),
                                              )}
                                            </select>
                                            <input
                                              type="tel"
                                              required
                                              value={localNumber}
                                              onChange={(e) =>
                                                handleTeamMemberPhoneChange(
                                                  index,
                                                  countryCode,
                                                  e.target.value,
                                                )
                                              }
                                              className={`flex-1 min-w-0 w-full px-3 py-2 text-sm bg-white/10 backdrop-blur-sm border-2 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-secondary-400/30 outline-none transition-all ${
                                                errors[`member_${index}_phone`]
                                                  ? "border-red-400"
                                                  : "border-white/20 focus:border-secondary-400"
                                              }`}
                                              placeholder="912345678"
                                            />
                                          </div>
                                        );
                                      })()}
                                      {errors[`member_${index}_phone`] && (
                                        <p className="mt-1 text-xs text-red-300">
                                          {errors[`member_${index}_phone`]}
                                        </p>
                                      )}
                                    </div>

                                    <div className="lg:col-span-2">
                                      <label className="block text-xs font-medium text-white mb-1">
                                        {index === 0
                                          ? "Email (verified) *"
                                          : "Email (optional)"}
                                      </label>
                                      <input
                                        type="email"
                                        value={
                                          index === 0
                                            ? verifiedEmail
                                            : member.email
                                        }
                                        disabled={index === 0}
                                        onChange={(e) =>
                                          handleTeamMemberChange(
                                            index,
                                            "email",
                                            e.target.value,
                                          )
                                        }
                                        className={`w-full px-3 py-2 text-sm bg-white/10 backdrop-blur-sm border-2 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-secondary-400/30 outline-none transition-all ${
                                          index === 0
                                            ? "opacity-70 cursor-not-allowed border-emerald-400/40"
                                            : errors[`member_${index}_email`]
                                              ? "border-red-400"
                                              : "border-white/20 focus:border-secondary-400"
                                        }`}
                                        placeholder="john@example.com"
                                      />
                                      {errors[`member_${index}_email`] && (
                                        <p className="mt-1 text-xs text-red-300">
                                          {errors[`member_${index}_email`]}
                                        </p>
                                      )}
                                    </div>

                                    {index === 0 && (
                                      <div className="lg:col-span-2">
                                        <label className="block text-xs font-medium text-white mb-1">
                                          Password (Team Leader) *
                                        </label>
                                        <input
                                          type="password"
                                          required
                                          value={member.password}
                                          onChange={(e) =>
                                            handleTeamMemberChange(
                                              index,
                                              "password",
                                              e.target.value,
                                            )
                                          }
                                          className={`w-full px-3 py-2 text-sm bg-white/10 backdrop-blur-sm border-2 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-secondary-400/30 outline-none transition-all ${
                                            errors[`member_${index}_password`]
                                              ? "border-red-400"
                                              : "border-white/20 focus:border-secondary-400"
                                          }`}
                                          placeholder="••••••••"
                                          minLength={6}
                                        />
                                        {errors[
                                          `member_${index}_password`
                                        ] && (
                                          <p className="mt-1 text-xs text-red-300">
                                            {
                                              errors[
                                                `member_${index}_password`
                                              ]
                                            }
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <p className="text-xs text-white/70 text-center">
                      By registering you agree to our{" "}
                      <Link
                        to="/terms"
                        target="_blank"
                        className="text-secondary-400 underline hover:text-secondary-300"
                      >
                        Terms &amp; Conditions
                      </Link>{" "}
                      and{" "}
                      <Link
                        to="/privacy"
                        target="_blank"
                        className="text-secondary-400 underline hover:text-secondary-300"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </p>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-semibold text-primary-950 bg-gradient-to-r from-secondary-400 via-secondary-500 to-secondary-400 hover:from-secondary-500 hover:via-secondary-600 hover:to-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting
                        ? registrationType === "individual"
                          ? "Creating account..."
                          : "Registering team..."
                        : registrationType === "individual"
                          ? "Create Account"
                          : "Register Team"}
                    </button>

                    <div className="text-center">
                      <p className="text-sm text-white">
                        Already have an account?{" "}
                        <Link
                          to="/login"
                          className="font-medium text-secondary-400 hover:text-secondary-300 transition-colors"
                        >
                          Sign in
                        </Link>
                      </p>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
