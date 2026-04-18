import api from "./api";

export const dmService = {
  // Get all DM conversations
  getConversations: () => api.get("/dms"),

  // Get DM conversation with user
  getConversation: (userId) => api.get(`/dms/${userId}`),

  // Send DM message
  sendMessage: (userId, data) => api.post(`/dms/${userId}/messages`, data),

  // Get DM messages
  getMessages: (userId, params) =>
    api.get(`/dms/${userId}/messages`, { params }),

  // Search users for DM
  searchUsers: (query) => api.get("/users/search", { params: { q: query } }),

  // Get user profile
  getUserProfile: (userId) => api.get(`/users/${userId}`),

  // Get user online status
  getUserStatus: (userId) => api.get(`/users/${userId}/status`),

  // Mark DM as read
  markAsRead: (userId) => api.post(`/dms/${userId}/read`),

  // Get unread DM count
  getUnreadCount: () => api.get("/dms/unread-count"),

  // Block user
  blockUser: (userId) => api.post(`/users/${userId}/block`),

  // Unblock user
  unblockUser: (userId) => api.delete(`/users/${userId}/block`),

  // Get blocked users
  getBlockedUsers: () => api.get("/users/blocked"),
};
