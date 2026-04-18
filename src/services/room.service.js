import api from "./api";

export const roomService = {
  // Create room in a space
  create: (spaceId, data) => api.post(`/spaces/${spaceId}/rooms`, data),

  // Get room details
  getById: (roomId) => api.get(`/rooms/${roomId}`),

  // Update room
  update: (roomId, data) => api.patch(`/rooms/${roomId}`, data),

  // Delete room
  delete: (roomId) => api.delete(`/rooms/${roomId}`),

  // Get members in a room
  getMembers: (roomId) => api.get(`/rooms/${roomId}/members`),

  // Add member to room
  addMember: (roomId, userId) =>
    api.post(`/rooms/${roomId}/members`, { userId }),

  // Remove member from room
  removeMember: (roomId, userId) =>
    api.delete(`/rooms/${roomId}/members/${userId}`),

  // Get room settings
  getSettings: (roomId) => api.get(`/rooms/${roomId}/settings`),

  // Update room settings
  updateSettings: (roomId, data) =>
    api.patch(`/rooms/${roomId}/settings`, data),

  // Get room statistics (message count, active users, etc.)
  getStats: (roomId) => api.get(`/rooms/${roomId}/stats`),
};
