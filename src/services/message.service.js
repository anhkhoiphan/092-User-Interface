import api from "./api";

export const messageService = {
  // Get messages in a room
  getMessages: (roomId, params) =>
    api.get(`/rooms/${roomId}/messages`, { params }),

  // Send message
  sendMessage: (roomId, data) => api.post(`/rooms/${roomId}/messages`, data),

  // Update message
  updateMessage: (roomId, messageId, data) =>
    api.patch(`/rooms/${roomId}/messages/${messageId}`, data),

  // Delete message
  deleteMessage: (roomId, messageId) =>
    api.delete(`/rooms/${roomId}/messages/${messageId}`),

  // Add reaction
  addReaction: (roomId, messageId, emoji) =>
    api.post(`/rooms/${roomId}/messages/${messageId}/reactions`, { emoji }),

  // Remove reaction
  removeReaction: (roomId, messageId, emoji) =>
    api.delete(`/rooms/${roomId}/messages/${messageId}/reactions/${emoji}`),

  // Reply to message
  reply: (roomId, data) => api.post(`/rooms/${roomId}/messages/reply`, data),

  // Upload file/attachment with message
  uploadFile: (roomId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/rooms/${roomId}/messages/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Pin a message
  pinMessage: (roomId, messageId) =>
    api.post(`/rooms/${roomId}/messages/${messageId}/pin`),

  // Unpin a message
  unpinMessage: (roomId, messageId) =>
    api.delete(`/rooms/${roomId}/messages/${messageId}/pin`),

  // Get pinned messages
  getPinnedMessages: (roomId) => api.get(`/rooms/${roomId}/messages/pinned`),

  // Mark messages as read
  markAsRead: (roomId) => api.post(`/rooms/${roomId}/messages/read`),

  // Get unread message count
  getUnreadCount: (roomId) => api.get(`/rooms/${roomId}/messages/unread-count`),

  // Get message by ID
  getById: (roomId, messageId) =>
    api.get(`/rooms/${roomId}/messages/${messageId}`),

  // Forward message to another room
  forwardMessage: (roomId, messageId, targetRoomId) =>
    api.post(`/rooms/${roomId}/messages/${messageId}/forward`, {
      targetRoomId,
    }),

  // Get message thread/replies
  getThread: (roomId, messageId, params) =>
    api.get(`/rooms/${roomId}/messages/${messageId}/thread`, { params }),

  // Send message with thread reply
  sendThreadReply: (roomId, messageId, data) =>
    api.post(`/rooms/${roomId}/messages/${messageId}/thread`, data),

  // Search messages in a room
  search: (roomId, query) =>
    api.get(`/rooms/${roomId}/messages/search`, { params: { q: query } }),

  // Get message history (for infinite scroll)
  getHistory: (roomId, params) =>
    api.get(`/rooms/${roomId}/messages/history`, { params }),
};
