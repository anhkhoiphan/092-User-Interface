import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { dmService } from "../../services/dm.service";
import { logout } from "./authSlice";

// ==================== Async Thunks ====================

export const fetchConversations = createAsyncThunk(
  "dm/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      console.log("[fetchConversations] Calling API...");
      const { data } = await dmService.getConversations({ page: 1, limit: 20 });
      const result = data.data || data.conversations || data || [];
      console.log("[fetchConversations] Result:", { count: result.length, ids: result.map(c => c.id) });
      return result;
    } catch (err) {
      console.error("[fetchConversations] Error:", err);
      return rejectWithValue(err.response?.data?.message || "Không thể tải danh sách trò chuyện");
    }
  }
);

export const createOrGetConversation = createAsyncThunk(
  "dm/createOrGetConversation",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await dmService.createOrGetConversation(userId);
      return data.data || data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Không thể tạo cuộc trò chuyện");
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "dm/fetchMessages",
  async ({ conversationId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const { data } = await dmService.getMessages(conversationId, { page, limit });
      return {
        conversationId,
        messages: data.data || data.messages || data || [],
        meta: data.meta || null,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Không thể tải tin nhắn");
    }
  }
);

export const markConversationAsRead = createAsyncThunk(
  "dm/markAsRead",
  async (conversationId, { rejectWithValue }) => {
    try {
      await dmService.markAsRead(conversationId);
      return conversationId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Không thể đánh dấu đã đọc");
    }
  }
);

// ==================== Slice ====================

const initialState = {
  conversations: [],
  messages: {}, // { [conversationId]: DMMessage[] }
  activeConversationId: null,
  activeConversation: null,
  typing: {}, // { [conversationId]: { userId, isTyping, timestamp } }
  onlineUsers: [],
  unreadCounts: {}, // { [conversationId]: number }
  fetchedConversations: {}, // { [conversationId]: boolean } Track which conversations have been fetched (page 1)
  conversationsFetched: false, // Track if conversations list has been fetched at least once
  loading: false,
  messagesLoading: false,
  error: null,
  messagesError: null,
};

const dmSlice = createSlice({
  name: "dm",
  initialState,
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload?.id || null;
      state.activeConversation = action.payload || null;
      state.messagesLoading = false; // Reset loading when switching conversations
    },

    clearActiveConversation: (state) => {
      state.activeConversationId = null;
      state.activeConversation = null;
    },

    addMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      const messages = state.messages[conversationId];
      
      // Check if this is a real message replacing a pending one
      const pendingIndex = messages.findIndex(
        (m) => m.pending && m.sender_id === message.sender_id && m.content === message.content
      );
      if (pendingIndex !== -1) {
        // Replace pending message with real one
        messages[pendingIndex] = { ...message, pending: false };
        return;
      }
      
      // Dedupe by id
      const exists = messages.some((m) => m.id === message.id);
      if (!exists) {
        messages.push(message);
      }
    },

    prependMessages: (state, action) => {
      const { conversationId, messages } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      const existingIds = new Set(state.messages[conversationId].map((m) => m.id));
      const newMessages = messages.filter((m) => !existingIds.has(m.id));
      state.messages[conversationId] = [...newMessages, ...state.messages[conversationId]];
    },

    updateMessage: (state, action) => {
      const { conversationId, messageId, updates } = action.payload;
      const list = state.messages[conversationId];
      if (!list) return;
      const idx = list.findIndex((m) => m.id === messageId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
      }
    },

    setTyping: (state, action) => {
      const { conversationId, userId, isTyping } = action.payload;
      if (isTyping) {
        state.typing[conversationId] = { userId, isTyping, timestamp: Date.now() };
      } else {
        if (state.typing[conversationId]?.userId === userId) {
          delete state.typing[conversationId];
        }
      }
    },

    clearTyping: (state, action) => {
      delete state.typing[action.payload];
    },

    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },

    updateUserStatus: (state, action) => {
      const { userId, status } = action.payload;
      // Update online users list
      if (status === "online") {
        if (!state.onlineUsers.includes(userId)) {
          state.onlineUsers.push(userId);
        }
      } else {
        state.onlineUsers = state.onlineUsers.filter((id) => id !== userId);
      }
      // Update conversation other_user status
      state.conversations = state.conversations.map((conv) => {
        if (conv.other_user?.id === userId) {
          return { ...conv, other_user: { ...conv.other_user, status } };
        }
        return conv;
      });
    },

    updateUserProfile: (state, action) => {
      const { userId, updates } = action.payload;
      // Update other_user in conversations if exists
      state.conversations = state.conversations.map((conv) => {
        if (conv.other_user?.id === userId) {
          return { ...conv, other_user: { ...conv.other_user, ...updates } };
        }
        return conv;
      });
      // Update activeConversation if matches
      if (state.activeConversation?.other_user?.id === userId) {
        state.activeConversation = {
          ...state.activeConversation,
          other_user: { ...state.activeConversation.other_user, ...updates },
        };
      }
    },

    updateConversationLastMessage: (state, action) => {
      const { conversationId, message, unreadCount } = action.payload;
      const idx = state.conversations.findIndex((c) => c.id === conversationId);
      if (idx !== -1) {
        state.conversations[idx] = {
          ...state.conversations[idx],
          last_message: message,
          unread_count: unreadCount ?? state.conversations[idx].unread_count + 1,
        };
        // Move to top
        const conv = state.conversations.splice(idx, 1)[0];
        state.conversations.unshift(conv);
      }
    },

    setUnreadCount: (state, action) => {
      const { conversationId, count } = action.payload;
      const idx = state.conversations.findIndex((c) => c.id === conversationId);
      if (idx !== -1) {
        state.conversations[idx].unread_count = count;
      }
      state.unreadCounts[conversationId] = count;
    },

    clearMessages: (state, action) => {
      delete state.messages[action.payload];
      delete state.fetchedConversations[action.payload];
    },

    setConversationsFetched: (state, action) => {
      state.conversationsFetched = action.payload;
    },

    markConversationAsFetched: (state, action) => {
      state.fetchedConversations[action.payload] = true;
    },

    resetDMState: () => initialState,

    clearError: (state) => {
      state.error = null;
      state.messagesError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchConversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
        state.conversationsFetched = true;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createOrGetConversation
      .addCase(createOrGetConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrGetConversation.fulfilled, (state, action) => {
        state.loading = false;
        const conv = action.payload;
        const exists = state.conversations.find((c) => c.id === conv.id);
        if (!exists) {
          state.conversations.unshift(conv);
        }
        state.activeConversationId = conv.id;
        state.activeConversation = conv;
      })
      .addCase(createOrGetConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchMessages
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true;
        state.messagesError = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        const { conversationId, messages, meta } = action.payload;
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        const page = meta?.page || 1;
        const existing = state.messages[conversationId];
        const existingIds = new Set(existing.map((m) => m.id));
        const newMessages = messages.filter((m) => !existingIds.has(m.id));

        if (page === 1) {
          // Initial load: merge new messages into existing
          // Keep ALL existing messages (including real ones from WebSocket)
          // Only add messages from API that don't already exist
          state.messages[conversationId] = [...existing, ...newMessages];
        } else {
          // Load more: prepend older messages
          state.messages[conversationId] = [...newMessages, ...existing];
        }

        // Mark this conversation as fetched (page 1)
        state.fetchedConversations[conversationId] = true;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.messagesError = action.payload;
      })
      // markConversationAsRead
      .addCase(markConversationAsRead.fulfilled, (state, action) => {
        const conversationId = action.payload;
        const idx = state.conversations.findIndex((c) => c.id === conversationId);
        if (idx !== -1) {
          state.conversations[idx].unread_count = 0;
        }
        state.unreadCounts[conversationId] = 0;
      })
      // Reset on logout
      .addCase(logout.fulfilled, () => initialState)
      .addCase(logout.rejected, () => initialState);
  },
});

export const {
  setActiveConversation,
  clearActiveConversation,
  addMessage,
  prependMessages,
  updateMessage,
  setTyping,
  clearTyping,
  setOnlineUsers,
  updateUserStatus,
  updateUserProfile,
  updateConversationLastMessage,
  setUnreadCount,
  clearMessages,
  markConversationAsFetched,
  setConversationsFetched,
  resetDMState,
  clearError,
} = dmSlice.actions;

export default dmSlice.reducer;
