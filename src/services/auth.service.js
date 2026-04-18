import api from "./api";

export const authService = {
  // Login
  login: (credentials) => api.post("/auth/login", credentials),

  // Register
  register: (data) => api.post("/auth/register", data),

  // Logout
  logout: () => api.post("/auth/logout"),

  // Refresh token
  refreshToken: (refreshToken) => api.post("/auth/refresh", { refreshToken }),

  // Get current user profile
  getProfile: () => api.get("/auth/profile"),

  // Update profile
  updateProfile: (data) => api.patch("/auth/profile", data),

  // Change password
  changePassword: (data) => api.post("/auth/change-password", data),
};
