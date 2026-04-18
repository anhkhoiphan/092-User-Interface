import api from "./api";

export const memberService = {
  // Get space members
  getSpaceMembers: (spaceId) => api.get(`/spaces/${spaceId}/members`),

  // Add member to space
  addSpaceMember: (spaceId, userId) =>
    api.post(`/spaces/${spaceId}/members`, { userId }),

  // Remove member from space
  removeSpaceMember: (spaceId, userId) =>
    api.delete(`/spaces/${spaceId}/members/${userId}`),

  // Get member role
  getMemberRole: (spaceId, userId) =>
    api.get(`/spaces/${spaceId}/members/${userId}/role`),

  // Update member role
  updateMemberRole: (spaceId, userId, role) =>
    api.patch(`/spaces/${spaceId}/members/${userId}/role`, { role }),

  // Get online status
  getOnlineStatus: (userId) => api.get(`/users/${userId}/status`),

  // Get room members
  getRoomMembers: (roomId) => api.get(`/rooms/${roomId}/members`),

  // Get member activity (last active, message count, etc.)
  getMemberActivity: (spaceId, userId) =>
    api.get(`/spaces/${spaceId}/members/${userId}/activity`),

  // Get pending invitations
  getPendingInvitations: (spaceId) => api.get(`/spaces/${spaceId}/invitations`),

  // Send invitation
  sendInvitation: (spaceId, email) =>
    api.post(`/spaces/${spaceId}/invite`, { email }),

  // Cancel invitation
  cancelInvitation: (spaceId, invitationId) =>
    api.delete(`/spaces/${spaceId}/invitations/${invitationId}`),

  // Accept invitation
  acceptInvitation: (token) => api.post(`/spaces/invite/accept`, { token }),

  // Get member list with filters
  searchMembers: (spaceId, query) =>
    api.get(`/spaces/${spaceId}/members/search`, { params: { q: query } }),
};
