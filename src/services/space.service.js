import api from "./api";

export const spaceService = {
  // Get all spaces
  getAll: () => api.get("/spaces"),

  // Get space by ID
  getById: (id) => api.get(`/spaces/${id}`),

  // Create new space
  create: (data) => api.post("/spaces", data),

  // Update space
  update: (id, data) => api.patch(`/spaces/${id}`, data),

  // Delete space
  delete: (id) => api.delete(`/spaces/${id}`),

  // Get rooms in a space
  getRooms: (id) => api.get(`/spaces/${id}/rooms`),

  // Upload space icon/image
  uploadIcon: (id, file) => {
    const formData = new FormData();
    formData.append("icon", file);
    return api.post(`/spaces/${id}/icon`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Remove space icon
  removeIcon: (id) => api.delete(`/spaces/${id}/icon`),

  // Get space members
  getMembers: (id) => api.get(`/spaces/${id}/members`),

  // Add member to space
  addMember: (id, userId) => api.post(`/spaces/${id}/members`, { userId }),

  // Remove member from space
  removeMember: (id, userId) => api.delete(`/spaces/${id}/members/${userId}`),

  // Update member role in space
  updateMemberRole: (id, userId, role) =>
    api.patch(`/spaces/${id}/members/${userId}/role`, { role }),

  // Generate invite code/link
  generateInviteCode: (id) => api.post(`/spaces/${id}/invite`),

  // Join space by invite code
  joinByInviteCode: (code) => api.post(`/spaces/join/${code}`),

  // Get space settings
  getSettings: (id) => api.get(`/spaces/${id}/settings`),

  // Update space settings
  updateSettings: (id, data) => api.patch(`/spaces/${id}/settings`, data),

  // Leave space
  leave: (id) => api.post(`/spaces/${id}/leave`),

  // Get space statistics
  getStats: (id) => api.get(`/spaces/${id}/stats`),

  // Search spaces
  search: (query) => api.get("/spaces/search", { params: { q: query } }),
};
