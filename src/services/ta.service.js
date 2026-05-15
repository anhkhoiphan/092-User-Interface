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
   * Phân tích real-time signals từ chat messages
   */
  analyzeAtRiskSignals: async (spaceId, hours = 168) => {
    const response = await api.post(`/ta/at-risk/analyze?spaceId=${spaceId}&hours=${hours}`);
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
    console.log('=== approveSummary DEBUG ===');
    console.log('draftId:', draftId, 'type:', typeof draftId);
    console.log('spaceId:', spaceId, 'type:', typeof spaceId);
    console.log('URL:', `/ta/summary-queue/${draftId}/approve?spaceId=${spaceId}`);

    if (!draftId || !spaceId) {
      throw new Error(`Invalid IDs: draftId=${draftId}, spaceId=${spaceId}`);
    }

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
   * Cập nhật bản thảo tóm tắt
   */
  updateSummaryDraft: async (draftId, spaceId, updates) => {
    const response = await api.patch(`/ta/summary-queue/${draftId}?spaceId=${spaceId}`, updates);
    return response.data;
  },

  /**
   * Gửi tin nhắn riêng thông minh (Agent)
   */
  sendSmartMessage: async (spaceId, dto) => {
    const response = await api.post(`/ta/send-smart-message?spaceId=${spaceId}`, dto);
    return response.data;
  },

  /**
   * AI: Gọi Agent Chat (Tóm tắt hội thoại thực tế)
   */
  callAgentChat: async (spaceId, query, senderId) => {
    console.log('[TA Service] callAgentChat:', {
      spaceId,
      senderId,
      queryLength: query?.length
    });

    try {
      const response = await api.post('/ta/agent/chat', { spaceId, query, senderId });
      console.log('[TA Service] callAgentChat success:', response.data);
      return response.data;
    } catch (error) {
      console.error('[TA Service] callAgentChat error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  /**
   * AI: Gọi Agent với File (PDF/Ảnh)
   */
  callAgentWithFile: async (spaceId, query, senderId, file, conversationId) => {
    console.log('[TA Service] callAgentWithFile:', {
      spaceId,
      senderId,
      fileName: file?.name,
      fileSize: file?.size,
      conversationId
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('query', query);
    formData.append('senderId', senderId);
    if (conversationId) {
      formData.append('conversationId', conversationId);
    }

    const url = `/ta/agent/chat-with-file?spaceId=${spaceId}&query=${encodeURIComponent(query)}&senderId=${encodeURIComponent(senderId)}`;
    if (conversationId) {
      url += `&conversationId=${encodeURIComponent(conversationId)}`;
    }

    try {
      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000
      });
      console.log('[TA Service] callAgentWithFile success:', response.data);
      return response.data;
    } catch (error) {
      console.error('[TA Service] callAgentWithFile error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  /**
   * AI: Tạo biểu đồ từ phân tích chat (FastAPI endpoint)
   */
  summaryChart: async (conversationId, query, senderId) => {
    const response = await api.post('/api/v1/summary_chart', {
      conversation_id: conversationId,
      query,
      sender_id: senderId
    });
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
   * Index PDF vào Qdrant
   */
  indexPdf: async (spaceId, conversationId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('spaceId', spaceId);
    formData.append('conversationId', conversationId);
    const response = await api.post('/ta/agent/index-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 180000
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
   * AI: Tạo bản thảo tin nhắn thông minh dựa trên context rủi ro
   */
  generateSmartMessage: async (snapshotId, tone, config = {}) => {
    const { instruction = '', pronouns = '', taName = '' } = config;
    const response = await api.get(`/ta/agent/smart-message/${snapshotId}`, {
      params: { tone, instruction, pronouns, taName }
    });
    return response.data;
  },

  /**
   * Tạo bản thảo tóm tắt (Dùng cho AI Agent hoặc Mock)
   */
  createSummaryDraft: async (dto) => {
    const response = await api.post('/ta/summary-queue/draft', dto);
    return response.data;
  },

  // ==========================================
  // QUIZ ENDPOINTS
  // ==========================================

  /**
   * AI: Tạo quiz từ bài giảng
   */
  generateQuiz: async (dto) => {
    const response = await api.post('/ta/quiz/generate', dto);
    return response.data;
  },

  listQuizzes: async (spaceId) => {
    const response = await api.get('/ta/quizzes', { params: { spaceId } });
    return response.data;
  },

  /**
   * Lấy quiz chi tiết (edit mode)
   */
  getQuiz: async (quizId) => {
    const response = await api.get(`/ta/quiz/${quizId}`);
    return response.data;
  },

  /**
   * Cập nhật quiz
   */
  updateQuiz: async (quizId, dto) => {
    const response = await api.put(`/ta/quiz/${quizId}`, dto);
    return response.data;
  },

  /**
   * Gửi quiz vào chat
   */
  sendQuiz: async (quizId, dto) => {
    const response = await api.post(`/ta/quiz/${quizId}/send`, dto);
    return response.data;
  },

  /**
   * Lấy quiz cho học viên làm
   */
  getQuizForStudent: async (quizId) => {
    const response = await api.get(`/ta/quiz/${quizId}/student`);
    return response.data;
  },

  /**
   * Submit quiz attempt
   */
  submitQuizAttempt: async (quizId, dto) => {
    const response = await api.post(`/ta/quiz/${quizId}/submit`, dto);
    return response.data;
  },

  /**
   * Lấy quiz summary (TA)
   */
  getQuizSummary: async (quizId) => {
    const response = await api.get(`/ta/quiz/${quizId}/summary`);
    return response.data;
  }
};

export default taService;
