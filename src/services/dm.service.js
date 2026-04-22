import api from "./api";

export const dmService = {
  // === Conversations ===

  /** Create or get existing conversation with a user */
  createOrGetConversation: (userId) => api.post("/dms", { userId }),

  /** Get list of conversations */
  getConversations: (params) => api.get("/dms", { params }),

  // === Messages ===

  /** Get messages in a conversation */
  getMessages: (conversationId, params) =>
    api.get(`/dms/${conversationId}/messages`, { params }),

  /** Send message via REST (fallback when WS unavailable) */
  sendMessage: (conversationId, data) =>
    api.post(`/dms/${conversationId}/messages`, data),

  /** Mark conversation as read */
  markAsRead: (conversationId) => api.post(`/dms/${conversationId}/read`),

  // === Block ===

  blockUser: (userId) => api.post(`/dms/block/${userId}`),
  unblockUser: (userId) => api.delete(`/dms/block/${userId}`),
  getBlockedUsers: () => api.get("/dms/blocked/list"),

  // === User Search ===

  searchUsers: (query) => api.get("/users/search", { params: { q: query } }),
  getUserProfile: (userId) => api.get(`/users/${userId}`),
  getUserStatus: (userId) => api.get(`/users/${userId}/status`),
};
