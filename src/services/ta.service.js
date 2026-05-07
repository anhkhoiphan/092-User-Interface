import api from './api';

const taService = {
  /**
   * Quét học viên có nguy cơ
   */
  scanAtRisk: async (spaceId) => {
    const response = await api.post(`/ta/scan-at-risk?spaceId=${spaceId}`);
    return response.data;
  },

  /**
   * Lấy danh sách học viên có nguy cơ
   */
  getAtRiskList: async (spaceId) => {
    const response = await api.get(`/ta/at-risk?spaceId=${spaceId}`);
    return response.data;
  },

  /**
   * Giải quyết cảnh báo
   */
  resolveAlert: async (snapshotId, spaceId) => {
    const response = await api.post(`/ta/at-risk/${snapshotId}/resolve?spaceId=${spaceId}`);
    return response.data;
  },

  /**
   * Lấy hàng chờ duyệt tóm tắt
   */
  getSummaryQueue: async (spaceId) => {
    const response = await api.get(`/ta/summary-queue?spaceId=${spaceId}`);
    return response.data;
  },

  /**
   * Duyệt bản tóm tắt
   */
  approveSummary: async (draftId, spaceId) => {
    const response = await api.post(`/ta/summary-queue/${draftId}/approve?spaceId=${spaceId}`);
    return response.data;
  },

  /**
   * Lấy nhật ký hành động
   */
  getActionLogs: async (spaceId) => {
    const response = await api.get(`/ta/action-logs?spaceId=${spaceId}`);
    return response.data;
  },

  /**
   * Lấy bộ Context cho Agent
   */
  getAtRiskContext: async (snapshotId, spaceId) => {
    const response = await api.get(`/ta/at-risk-context/${snapshotId}?spaceId=${spaceId}`);
    return response.data;
  },
  /**
   * Tải lên slide bài giảng
   */
  uploadSlide: async (spaceId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/ta/upload-slide?spaceId=${spaceId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Đặt lịch gửi bản tóm tắt
   */
  scheduleSummary: async (draftId, spaceId, scheduledAt) => {
    const response = await api.post(`/ta/summary-queue/${draftId}/schedule?spaceId=${spaceId}`, {
      scheduled_at: scheduledAt
    });
    return response.data;
  },

  /**
   * Hủy đặt lịch gửi
   */
  cancelSchedule: async (draftId, spaceId) => {
    const response = await api.post(`/ta/summary-queue/${draftId}/cancel-schedule?spaceId=${spaceId}`);
    return response.data;
  },

  /**
   * Tạo bản thảo tóm tắt (Dùng cho AI Agent hoặc Mock)
   */
  createSummaryDraft: async (dto) => {
    const response = await api.post('/ta/summary-queue/draft', dto);
    return response.data;
  }
};

export default taService;
