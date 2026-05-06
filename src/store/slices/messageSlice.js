import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { messageService } from "../../services/message.service";
import { logout } from "./authSlice";
import { getCachedMessages, hasCache } from "../messageCache";

// ==================== Async Thunks ====================

// Normalize API message format to unified format (same as DM)
function normalizeRoomMessage(msg) {
  return {
    id: msg.id,
    sender: {
      id: msg.author?.id || msg.user_id || msg.senderId,
      display_name: msg.author?.display_name || msg.author?.username || msg.sender_name || "Unknown",
      avatar_url: msg.author?.avatar_url || null,
    },
    sender_id: msg.author?.id || msg.user_id || msg.senderId,
    content: msg.content,
    created_at: msg.created_at,
    is_pinned: msg.is_pinned || false,
    reply_to_id: msg.reply_to_id || null,
  };
}

export const fetchRoomMessages = createAsyncThunk(
  "message/fetchRoomMessages",
  async ({ roomId, page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      console.log(`[fetchRoomMessages] roomId: ${roomId}, page: ${page}`);
      const { data } = await messageService.getMessages(roomId, { page, limit });
      const rawMessages = data.data || data.messages || data || [];
      const messages = rawMessages.map(normalizeRoomMessage);
      console.log(`[fetchRoomMessages] Got ${messages.length} messages for ${roomId}`);
      return {
        roomId,
        messages,
        meta: data.meta || null,
        page,
      };
    } catch (err) {
      console.error("[fetchRoomMessages] Error:", err.response?.data || err.message);
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải tin nhắn",
      );
    }
  },
);

// Preload messages for all rooms in spaces
export const preloadRoomMessages = createAsyncThunk(
  "message/preload",
  async (roomIds, { dispatch, rejectWithValue }) => {
    try {
      console.log("[preloadRoomMessages] Preloading for rooms:", roomIds);
      const promises = roomIds.map(async (roomId) => {
        try {
          const { data } = await messageService.getMessages(roomId, { page: 1, limit: 50 });
          const rawMessages = data.data || data.messages || data || [];
          const messages = rawMessages.map(normalizeRoomMessage);
          return { roomId, messages };
        } catch (err) {
          console.warn(`[preloadRoomMessages] Failed for ${roomId}:`, err.message);
          return { roomId, messages: [] };
        }
      });

      const results = await Promise.allSettled(promises);
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          dispatch(setRoomMessagesPreloaded(result.value));
        }
      });

      console.log("[preloadRoomMessages] Done");
      return { count: results.length };
    } catch (err) {
      return rejectWithValue("Không thể tải tin nhắn phòng");
    }
  },
);

// ==================== Slice ====================

const initialState = {
  messages: {}, // { [roomId]: RoomMessage[] }
  fetchedRooms: {}, // { [roomId]: boolean }
  loading: false,
  messagesLoading: false,
  error: null,
  messagesError: null,
};

const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    // Real-time message from WebSocket
    addMessage: (state, action) => {
      const { roomId, message } = action.payload;
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      const messages = state.messages[roomId];

      // Check if this is a real message replacing a pending one
      let pendingIndex = -1;
      if (message.tempId) {
        pendingIndex = messages.findIndex(
          (m) => m.pending && m.id === message.tempId,
        );
      }
      if (pendingIndex === -1) {
        pendingIndex = messages.findIndex(
          (m) =>
            m.pending &&
            m.sender_id === message.sender_id &&
            m.content === message.content,
        );
      }
      if (pendingIndex !== -1) {
        const exists = messages.some((m) => m.id === message.id);
        if (exists) {
          messages.splice(pendingIndex, 1);
        } else {
          messages[pendingIndex] = { ...message, pending: false, failed: false };
        }
        return;
      }

      // Dedupe by id
      const exists = messages.some((m) => m.id === message.id);
      if (!exists) {
        messages.push(message);
      }
    },

    clearMessages: (state, action) => {
      const { roomId } = action.payload;
      if (state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      delete state.fetchedRooms[roomId];
    },

    // Load messages from localStorage cache
    loadMessagesFromCache: (state, action) => {
      const { roomId } = action.payload;
      if (!roomId) return;
      // Skip if already loaded in Redux
      if (state.messages[roomId]?.length > 0) return;

      const cached = getCachedMessages("room", roomId);
      if (cached && cached.messages.length > 0) {
        state.messages[roomId] = cached.messages;
        state.fetchedRooms[roomId] = true;
      }
    },

    // Preloaded messages (from bulk fetch)
    setRoomMessagesPreloaded: (state, action) => {
      const { roomId, messages } = action.payload;
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      // Merge with existing, dedupe by id
      const existingIds = new Set(state.messages[roomId].map((m) => m.id));
      const newMessages = messages.filter((m) => !existingIds.has(m.id));
      state.messages[roomId] = [...state.messages[roomId], ...newMessages];
      state.fetchedRooms[roomId] = true;
    },

    // Prepend older messages (pagination)
    prependRoomMessages: (state, action) => {
      const { roomId, messages } = action.payload;
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      const existingIds = new Set(state.messages[roomId].map((m) => m.id));
      const newMessages = messages.filter((m) => !existingIds.has(m.id));
      state.messages[roomId] = [...newMessages, ...state.messages[roomId]];
    },

    updateMessage: (state, action) => {
      const { roomId, messageId, updates } = action.payload;
      const list = state.messages[roomId];
      if (!list) return;
      const idx = list.findIndex((m) => m.id === messageId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchRoomMessages
      .addCase(fetchRoomMessages.pending, (state, action) => {
        const { roomId } = action.meta.arg || {};
        // Always show loading skeleton when fetching messages
        state.messagesLoading = true;
        state.messagesError = null;
      })
      .addCase(fetchRoomMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        const { roomId, messages, page } = action.payload;
        if (!state.messages[roomId]) {
          state.messages[roomId] = [];
        }

        // Remove pending messages if they are already confirmed in the API response
        let existing = state.messages[roomId];
        existing = existing.filter((ex) => {
          if (ex.pending) {
            const isMatchInApi = messages.some(
              (m) => m.sender_id === ex.sender_id && m.content === ex.content,
            );
            return !isMatchInApi;
          }
          return true;
        });

        const existingIds = new Set(existing.map((m) => m.id));
        const newMessages = messages.filter((m) => !existingIds.has(m.id));

        if (page === 1) {
          // Page 1: merge new messages into existing
          state.messages[roomId] = [...existing, ...newMessages];
        } else {
          // Page > 1: prepend older messages
          state.messages[roomId] = [...newMessages, ...existing];
        }
        if (page === 1) {
          state.fetchedRooms[roomId] = true;
        }
      })
      .addCase(fetchRoomMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.messagesError = action.payload;
      })
      // Reset on logout
      .addCase(logout.fulfilled, () => initialState)
      .addCase(logout.rejected, () => initialState);
  },
});

export const {
  addMessage,
  clearMessages,
  setRoomMessagesPreloaded,
  prependRoomMessages,
  updateMessage,
  loadMessagesFromCache,
} = messageSlice.actions;

export default messageSlice.reducer;
