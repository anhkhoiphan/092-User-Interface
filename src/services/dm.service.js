import api from "./api";

export const dmService = {
  // === Conversations ===

  /** Create or get existing conversation with a user */
  createOrGetConversation: (userId) => api.post("/dms", { userId }),

  /** Get list of conversations */
  getConversations: async (params) => {
    const response = await api.get("/dms", { params });
    console.log("[dmService.getConversations] API response:", {
      count: response.data?.data?.length || response.data?.conversations?.length || response.data?.length || 0,
      data: response.data,
    });
    return response;
  },

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

  // 🆕 Batch status — one call for multiple users (replaces getUserStatus polling)
  getUsersStatus: (userIds) => api.post("/users/status", { userIds }),

  // ❌ DEPRECATED: Use WebSocket + getUsersStatus instead
  // getUserStatus: (userId) => api.get(`/users/${userId}/status`),
};
