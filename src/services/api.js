const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.leskickit.com/api";

// Helper function to get auth token from localStorage
const getToken = () => {
  return localStorage.getItem("token");
};

// Helper function to filter out undefined, null, and empty string values from params
const filterParams = (params) => {
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      acc[key] = value;
    }
    return acc;
  }, {});
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Check if response is ok before trying to parse JSON
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // If JSON parsing fails, it might be a network error or empty response
      if (!response.ok) {
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`
        );
      }
      throw new Error("Invalid response from server");
    }

    if (!response.ok) {
      // Include status code and full error data in the error
      const errorMessage =
        data.error ||
        data.message ||
        `Error: ${response.status} ${response.statusText}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        `Cannot connect to server. Please make sure the backend is running at ${API_BASE_URL}`
      );
    }
    // Re-throw other errors
    throw error;
  }
};

// Auth API calls
export const authAPI = {
  register: async (userData) => {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  setPassword: async ({ token, email, password }) => {
    return apiRequest("/auth/set-password", {
      method: "POST",
      body: JSON.stringify({
        token,
        password,
        ...(email ? { email } : {}),
      }),
    });
  },

  forgotPassword: async (identifier) => {
    return apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ identifier }),
    });
  },

  checkAvailability: async (data) => {
    return apiRequest("/auth/check-availability", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  sendRegistrationOtp: async (email) => {
    return apiRequest("/auth/send-registration-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  verifyRegistrationOtp: async (email, otp) => {
    return apiRequest("/auth/verify-registration-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  },

  login: async (identifier, password) => {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
  },

  getCurrentUser: async () => {
    return apiRequest("/auth/me");
  },
};

// User API calls
export const userAPI = {
  getAllUsers: async () => {
    return apiRequest("/users");
  },

  getUserById: async (id) => {
    return apiRequest(`/users/${id}`);
  },

  updateUser: async (id, userData) => {
    return apiRequest(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async (id) => {
    return apiRequest(`/users/${id}`, {
      method: "DELETE",
    });
  },

  getUsersByRole: async (role) => {
    return apiRequest(`/users/role/${role}`);
  },

  suspendUser: async (id, reason) => {
    return apiRequest(`/users/${id}/suspend`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  unsuspendUser: async (id) => {
    return apiRequest(`/users/${id}/unsuspend`, {
      method: "POST",
    });
  },
};

// Payments API calls
export const paymentAPI = {
  createSession: async ({
    amount,
    currency = "usd",
    email,
    userId,
    registrationType,
    metadata,
  }) => {
    return apiRequest("/payments/session", {
      method: "POST",
      body: JSON.stringify({
        amount,
        currency,
        email,
        userId,
        registrationType,
        metadata,
      }),
    });
  },
  verifySession: async (sessionId) => {
    return apiRequest(`/payments/session/${sessionId}`);
  },
  getStripePublishableKey: async () => {
    return apiRequest("/payments/stripe/publishable-key");
  },
  getZelleInfo: async () => {
    return apiRequest("/payments/zelle/info");
  },
  getCashAppInfo: async () => {
    return apiRequest("/payments/cash-app/info");
  },
  createTournamentPaymentIntent: async (data) => {
    return apiRequest("/payments/tournament/payment-intent", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  createShopPaymentIntent: async (data) => {
    return apiRequest("/payments/shop/payment-intent", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getRegistrationFee: async () => {
    return apiRequest("/payments/registration-fee");
  },
  getRegistrationFeeSettings: async () => {
    return apiRequest("/payments/admin/registration-fee");
  },
  saveRegistrationFee: async (registrationFee) => {
    return apiRequest("/payments/admin/registration-fee", {
      method: "POST",
      body: JSON.stringify({ registrationFee }),
    });
  },
  getPaymentSettings: async () => {
    return apiRequest("/payments/admin/payment-settings");
  },
  savePaymentSettings: async (settings) => {
    return apiRequest("/payments/admin/payment-settings", {
      method: "POST",
      body: JSON.stringify(settings),
    });
  },
  saveSettings: async (settings) => {
    return apiRequest("/payments/admin/payment-settings", {
      method: "POST",
      body: JSON.stringify(settings),
    });
  },
  createTournamentCheckout: async (data) => {
    return apiRequest("/payments/checkout/tournament", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateTournamentPayment: async (data) => {
    return apiRequest("/payments/tournament/update-payment", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Tournament API calls with in-memory request deduplication
const tournamentsCache = new Map();

export const tournamentAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const cacheKey = queryString || "default";
    const cached = tournamentsCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < 30000) {
      return cached.data;
    }
    const data = await apiRequest(`/tournaments${queryString ? `?${queryString}` : ""}`);
    tournamentsCache.set(cacheKey, { data, timestamp: now });
    return data;
  },

  getById: async (id) => {
    return apiRequest(`/tournaments/${id}`);
  },

  create: async (tournamentData) => {
    tournamentsCache.clear();
    return apiRequest("/tournaments", {
      method: "POST",
      body: JSON.stringify(tournamentData),
    });
  },

  update: async (id, tournamentData) => {
    tournamentsCache.clear();
    return apiRequest(`/tournaments/${id}`, {
      method: "PUT",
      body: JSON.stringify(tournamentData),
    });
  },

  delete: async (id) => {
    tournamentsCache.clear();
    return apiRequest(`/tournaments/${id}`, {
      method: "DELETE",
    });
  },

  promote: async (id) => {
    return apiRequest(`/tournaments/${id}/promote`, {
      method: "POST",
    });
  },

  register: async (id, registrationData) => {
    return apiRequest(`/tournaments/${id}/register`, {
      method: "POST",
      body: JSON.stringify(registrationData),
    });
  },

  getMyTournaments: async () => {
    return apiRequest("/tournaments/my-tournaments");
  },
};

// Match API calls
export const matchAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/matches${queryString ? `?${queryString}` : ""}`);
  },

  getById: async (id) => {
    return apiRequest(`/matches/${id}`);
  },

  create: async (matchData) => {
    return apiRequest("/matches", {
      method: "POST",
      body: JSON.stringify(matchData),
    });
  },

  update: async (id, matchData) => {
    return apiRequest(`/matches/${id}`, {
      method: "PUT",
      body: JSON.stringify(matchData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/matches/${id}`, {
      method: "DELETE",
    });
  },

  updateResult: async (id, team1Score, team2Score) => {
    return apiRequest(`/matches/${id}/result`, {
      method: "POST",
      body: JSON.stringify({ team1Score, team2Score }),
    });
  },

  promote: async (id) => {
    return apiRequest(`/matches/${id}/promote`, {
      method: "POST",
    });
  },

  getMyMatches: async () => {
    return apiRequest("/matches/my-matches");
  },
};

// Non-profit activities API calls
export const nonprofitAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/nonprofit${queryString ? `?${queryString}` : ""}`);
  },

  getById: async (id) => {
    return apiRequest(`/nonprofit/${id}`);
  },

  create: async (data) => {
    return apiRequest("/nonprofit", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return apiRequest(`/nonprofit/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  remove: async (id) => {
    return apiRequest(`/nonprofit/${id}`, {
      method: "DELETE",
    });
  },

  join: async (id) => {
    return apiRequest(`/nonprofit/${id}/join`, {
      method: "POST",
    });
  },

  getMine: async () => {
    return apiRequest("/nonprofit/mine");
  },
};

export const communityImpactAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(
      `/community-impact${queryString ? `?${queryString}` : ""}`
    );
  },

  getById: async (id) => {
    return apiRequest(`/community-impact/${id}`);
  },

  create: async (data) => {
    return apiRequest("/community-impact", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return apiRequest(`/community-impact/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  remove: async (id) => {
    return apiRequest(`/community-impact/${id}`, {
      method: "DELETE",
    });
  },
};

// Notification API calls
export const notificationAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/notifications${queryString ? `?${queryString}` : ""}`);
  },

  getUnreadCount: async () => {
    return apiRequest("/notifications/unread-count");
  },

  markAsRead: async (id) => {
    return apiRequest(`/notifications/${id}/read`, {
      method: "PUT",
    });
  },

  markAllAsRead: async () => {
    return apiRequest("/notifications/read-all", {
      method: "PUT",
    });
  },

  delete: async (id) => {
    return apiRequest(`/notifications/${id}`, {
      method: "DELETE",
    });
  },
};

// Management announcement API calls
export const announcementAPI = {
  getManagementAnnouncements: async () => {
    return apiRequest("/announcements/management");
  },

  createManagementAnnouncement: async ({ title, message }) => {
    return apiRequest("/announcements/management", {
      method: "POST",
      body: JSON.stringify({ title, message }),
    });
  },
};

// Team API calls
export const teamAPI = {
  getMyTeam: async () => {
    return apiRequest("/teams/my-team");
  },

  inviteMember: async (teamId, memberData) => {
    return apiRequest(`/teams/${teamId}/invite-member`, {
      method: "POST",
      body: JSON.stringify(memberData),
    });
  },

  sendTeamMessage: async (teamId, message) => {
    return apiRequest(`/teams/${teamId}/message`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },

  getTeamMessages: async (teamId) => {
    return apiRequest(`/teams/${teamId}/messages`);
  },

  getTeamAnnouncements: async (teamId) => {
    return apiRequest(`/teams/${teamId}/announcements`);
  },

  createTeamAnnouncement: async (teamId, { title, message }) => {
    return apiRequest(`/teams/${teamId}/announcements`, {
      method: "POST",
      body: JSON.stringify({ title, message }),
    });
  },

  addMember: async (teamId, userId) => {
    return apiRequest(`/teams/${teamId}/members`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },

  removeMember: async (teamId, memberId) => {
    return apiRequest(`/teams/${teamId}/members/${memberId}`, {
      method: "DELETE",
    });
  },

  getAllTeams: async () => {
    return apiRequest("/teams");
  },

  requestToJoin: async (teamId, message) => {
    return apiRequest(`/teams/${teamId}/join-request`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },

  getJoinRequests: async () => {
    return apiRequest("/teams/join-requests");
  },

  acceptJoinRequest: async (requestId) => {
    return apiRequest(`/teams/join-requests/${requestId}/accept`, {
      method: "POST",
    });
  },

  rejectJoinRequest: async (requestId) => {
    return apiRequest(`/teams/join-requests/${requestId}/reject`, {
      method: "POST",
    });
  },
};

// Admin API calls
export const adminAPI = {
  getStats: async () => {
    return apiRequest("/admin/stats");
  },

  getAnalytics: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/analytics?${queryString}`);
  },

  getEventAnalytics: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/analytics/events?${queryString}`);
  },

  getParticipantTracking: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/analytics/participants?${queryString}`);
  },

  getReports: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/reports?${queryString}`);
  },

  generateReport: async (type, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/reports/${type}?${queryString}`);
  },

  exportReport: async (type, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/reports/${type}/export?${queryString}`);
  },

  getBranding: async () => {
    return apiRequest("/admin/settings/branding");
  },

  saveBranding: async (branding) => {
    return apiRequest("/admin/settings/branding", {
      method: "POST",
      body: JSON.stringify(branding),
    });
  },

  getContactInfo: async () => {
    return apiRequest("/admin/settings/contact");
  },

  saveContactInfo: async (contactInfo) => {
    return apiRequest("/admin/settings/contact", {
      method: "POST",
      body: JSON.stringify(contactInfo),
    });
  },

  getAllTeams: async () => {
    return apiRequest("/admin/teams");
  },

  getTeamById: async (teamId) => {
    return apiRequest(`/admin/teams/${teamId}`);
  },

  getAllPlayers: async () => {
    return apiRequest("/admin/players");
  },

  getPlayersWithoutTeam: async () => {
    return apiRequest("/admin/players/without-team");
  },

  createTeam: async (teamData) => {
    return apiRequest("/admin/teams", {
      method: "POST",
      body: JSON.stringify(teamData),
    });
  },

  assignPlayersToTeam: async (teamId, playerIds) => {
    return apiRequest(`/admin/teams/${teamId}/members`, {
      method: "PUT",
      body: JSON.stringify({ playerIds }),
    });
  },

  getStripePayments: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(
      `/admin/payments/stripe${queryString ? `?${queryString}` : ""}`
    );
  },

  getProductOrderAnalytics: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(
      `/admin/analytics/products-orders${queryString ? `?${queryString}` : ""}`
    );
  },

  getRealtimeMonitoring: async () => {
    return apiRequest("/admin/monitoring/realtime");
  },
};

// Media API calls
export const mediaAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/media${queryString ? `?${queryString}` : ""}`);
  },

  getById: async (id) => {
    return apiRequest(`/media/${id}`);
  },

  getStats: async () => {
    return apiRequest("/media/stats");
  },

  // Media meta (Themes)
  getThemes: async () => {
    return apiRequest("/media/themes");
  },

  createTheme: async (themeData) => {
    return apiRequest("/media/themes", {
      method: "POST",
      body: JSON.stringify(themeData),
    });
  },

  updateTheme: async (id, themeData) => {
    return apiRequest(`/media/themes/${id}`, {
      method: "PUT",
      body: JSON.stringify(themeData),
    });
  },

  deleteTheme: async (id) => {
    return apiRequest(`/media/themes/${id}`, {
      method: "DELETE",
    });
  },

  // Media meta (Categories)
  getCategories: async () => {
    return apiRequest("/media/categories");
  },

  createCategory: async (categoryData) => {
    return apiRequest("/media/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  },

  updateCategory: async (id, categoryData) => {
    return apiRequest(`/media/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
    });
  },

  deleteCategory: async (id) => {
    return apiRequest(`/media/categories/${id}`, {
      method: "DELETE",
    });
  },

  uploadImage: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);

    console.log("Uploading image to:", `${API_BASE_URL}/media/upload`);
    console.log("File details:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    const response = await fetch(`${API_BASE_URL}/media/upload`, {
      method: "POST",
      headers: {
        // Don't set Content-Type header - let browser set it with boundary for FormData
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    console.log("Upload response status:", response.status);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.error("Upload error response:", data);
      const error = new Error(
        data.message ||
          `Upload failed: ${response.status} ${response.statusText}`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    const result = await response.json();
    console.log("Upload success, result:", result);
    return result;
  },

  uploadFile: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/media/upload`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const error = new Error(
        data.message || `Upload failed: ${response.status} ${response.statusText}`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return response.json();
  },

  uploadVideo: async (file) => {
    return mediaAPI.uploadFile(file);
  },

  create: async (mediaData) => {
    return apiRequest("/media", {
      method: "POST",
      body: JSON.stringify(mediaData),
    });
  },

  update: async (id, mediaData) => {
    return apiRequest(`/media/${id}`, {
      method: "PUT",
      body: JSON.stringify(mediaData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/media/${id}`, {
      method: "DELETE",
    });
  },

  toggleVisibility: async (id) => {
    return apiRequest(`/media/${id}/visibility`, {
      method: "PUT",
    });
  },

  toggleFeatured: async (id) => {
    return apiRequest(`/media/${id}/feature`, {
      method: "PUT",
    });
  },

  like: async (id) => {
    return apiRequest(`/media/${id}/like`, {
      method: "PUT",
    });
  },

  bulkDelete: async (ids) => {
    return apiRequest("/media/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  },
};

// Contact API calls
export const contactAPI = {
  submit: async (formData) => {
    return apiRequest("/contact", {
      method: "POST",
      body: JSON.stringify(formData),
    });
  },

  getInfo: async () => {
    return apiRequest("/contact/info");
  },

  // Admin methods
  getAll: async (params = {}) => {
    const filteredParams = filterParams(params);
    const queryString = new URLSearchParams(filteredParams).toString();
    return apiRequest(
      `/admin/contact-messages${queryString ? `?${queryString}` : ""}`
    );
  },

  getById: async (id) => {
    return apiRequest(`/admin/contact-messages/${id}`);
  },

  updateStatus: async (id, status, adminNotes) => {
    return apiRequest(`/admin/contact-messages/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, adminNotes }),
    });
  },

  delete: async (id) => {
    return apiRequest(`/admin/contact-messages/${id}`, {
      method: "DELETE",
    });
  },

  getStats: async () => {
    return apiRequest("/admin/contact-messages/stats");
  },
};

// Shop API calls
export const shopAPI = {
  // Products
  getProducts: async (params = {}) => {
    const filteredParams = filterParams(params);
    const queryString = new URLSearchParams(filteredParams).toString();
    return apiRequest(`/shop/products${queryString ? `?${queryString}` : ""}`);
  },

  getProduct: async (id) => {
    return apiRequest(`/shop/products/${id}`);
  },

  createProduct: async (productData) => {
    return apiRequest("/shop/products", {
      method: "POST",
      body: JSON.stringify(productData),
    });
  },

  updateProduct: async (id, productData) => {
    return apiRequest(`/shop/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
  },

  deleteProduct: async (id) => {
    return apiRequest(`/shop/products/${id}`, {
      method: "DELETE",
    });
  },

  bulkUpdateProducts: async (ids, updates) => {
    return apiRequest("/shop/products/bulk-update", {
      method: "POST",
      body: JSON.stringify({ ids, updates }),
    });
  },

  // Orders
  getOrders: async (params = {}) => {
    const filteredParams = filterParams(params);
    const queryString = new URLSearchParams(filteredParams).toString();
    return apiRequest(`/shop/orders${queryString ? `?${queryString}` : ""}`);
  },

  getOrder: async (id) => {
    return apiRequest(`/shop/orders/${id}`);
  },

  createOrder: async (orderData) => {
    return apiRequest("/shop/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  },

  updateOrderStatus: async (id, status, reason) => {
    return apiRequest(`/shop/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, reason }),
    });
  },

  // Admin Orders
  getAdminOrders: async (params = {}) => {
    const filteredParams = filterParams(params);
    const queryString = new URLSearchParams(filteredParams).toString();
    return apiRequest(
      `/shop/admin/orders${queryString ? `?${queryString}` : ""}`
    );
  },

  updateAdminOrder: async (id, updates) => {
    return apiRequest(`/shop/admin/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  verifyZellePayment: async (orderId, verificationNotes) => {
    return apiRequest(`/shop/admin/orders/${orderId}/verify-zelle`, {
      method: "POST",
      body: JSON.stringify({ verificationNotes }),
    });
  },

  getPendingZellePayments: async (params = {}) => {
    const filteredParams = filterParams(params);
    const queryString = new URLSearchParams(filteredParams).toString();
    return apiRequest(
      `/shop/admin/orders/pending-zelle${queryString ? `?${queryString}` : ""}`
    );
  },

  getPendingZelleTournamentPayments: async (params = {}) => {
    const filteredParams = filterParams(params);
    const queryString = new URLSearchParams(filteredParams).toString();
    return apiRequest(
      `/tournaments/admin/pending-zelle-payments${
        queryString ? `?${queryString}` : ""
      }`
    );
  },

  getAllZelleTournamentPayments: async (params = {}) => {
    const filteredParams = filterParams(params);
    const queryString = new URLSearchParams(filteredParams).toString();
    return apiRequest(
      `/tournaments/admin/zelle-payments${
        queryString ? `?${queryString}` : ""
      }`
    );
  },

  verifyZelleTournamentPayment: async (
    tournamentId,
    registrationId,
    verificationNotes,
    registrationType
  ) => {
    return apiRequest(
      `/tournaments/admin/${tournamentId}/verify-zelle/${registrationId}`,
      {
        method: "POST",
        body: JSON.stringify({ verificationNotes, registrationType }),
      }
    );
  },

  // Coupons
  validateCoupon: async (code, cartTotal) => {
    return apiRequest("/shop/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code, cartTotal }),
    });
  },

  getAdminCoupons: async (params = {}) => {
    const filteredParams = filterParams(params);
    const queryString = new URLSearchParams(filteredParams).toString();
    return apiRequest(
      `/shop/admin/coupons${queryString ? `?${queryString}` : ""}`
    );
  },

  createCoupon: async (couponData) => {
    return apiRequest("/shop/admin/coupons", {
      method: "POST",
      body: JSON.stringify(couponData),
    });
  },

  updateCoupon: async (id, couponData) => {
    return apiRequest(`/shop/admin/coupons/${id}`, {
      method: "PUT",
      body: JSON.stringify(couponData),
    });
  },

  deleteCoupon: async (id) => {
    return apiRequest(`/shop/admin/coupons/${id}`, {
      method: "DELETE",
    });
  },

  // Stats
  getShopStats: async () => {
    return apiRequest("/shop/admin/stats");
  },

  // Checkout
  createCheckoutSession: async (checkoutData) => {
    return apiRequest("/payments/checkout/products", {
      method: "POST",
      body: JSON.stringify(checkoutData),
    });
  },
};

// Testimonial API calls
export const testimonialAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/testimonials${queryString ? `?${queryString}` : ""}`);
  },

  getById: async (id) => {
    return apiRequest(`/testimonials/${id}`);
  },

  // Admin methods
  getAllAdmin: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(
      `/testimonials/admin/all${queryString ? `?${queryString}` : ""}`
    );
  },

  create: async (testimonialData) => {
    return apiRequest("/testimonials", {
      method: "POST",
      body: JSON.stringify(testimonialData),
    });
  },

  update: async (id, testimonialData) => {
    return apiRequest(`/testimonials/${id}`, {
      method: "PUT",
      body: JSON.stringify(testimonialData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/testimonials/${id}`, {
      method: "DELETE",
    });
  },
};

export default apiRequest;
