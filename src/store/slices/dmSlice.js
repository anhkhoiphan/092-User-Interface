import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { dmService } from "../../services/dm.service";
import { spaceService } from "../../services/space.service";
import { messageService } from "../../services/message.service";
import socketService from "../../services/socket.service";
import { logout } from "./authSlice";
import {
  setAppLoading,
  setAppLoadingPhase,
  setAppLoadingError,
} from "./appSlice";
import { getCachedMessages, hasCache, getCachedConversations, hasConversationsCache } from "../messageCache";

// ==================== Async Thunks ====================

export const fetchConversations = createAsyncThunk(
  "dm/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      console.log("%c[fetchConversations] ➡️  Thunk started", "color: #3b82f6; font-weight: bold;");
      const thunkStart = performance.now();
      const { data } = await dmService.getConversations({ page: 1, limit: 100 });
      const result = data.data || data.conversations || data || [];
      const elapsed = Math.round(performance.now() - thunkStart);
      console.log(`%c[fetchConversations] ✅ Thunk completed in ${elapsed}ms`, "color: #22c55e; font-weight: bold;", {
        count: result.length,
        ids: result.map((c) => c.id),
        firstConversation: result[0] ? {
          id: result[0].id,
          otherUser: result[0].other_user?.display_name || result[0].other_user?.username,
          lastMessage: result[0].last_message?.content?.substring(0, 50),
          unreadCount: result[0].unread_count,
        } : null,
      });
      return result;
    } catch (err) {
      console.error("%c[fetchConversations] ❌ Error:", "color: #ef4444; font-weight: bold;", err);
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải danh sách trò chuyện",
      );
    }
  },
);

export const createOrGetConversation = createAsyncThunk(
  "dm/createOrGetConversation",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await dmService.createOrGetConversation(userId);
      return data.data || data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Không thể tạo cuộc trò chuyện",
      );
    }
  },
);

export const fetchMessages = createAsyncThunk(
  "dm/fetchMessages",
  async ({ conversationId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const { data } = await dmService.getMessages(conversationId, {
        page,
        limit,
      });
      return {
        conversationId,
        messages: data.data || data.messages || data || [],
        meta: data.meta || null,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải tin nhắn",
      );
    }
  },
);

export const markConversationAsRead = createAsyncThunk(
  "dm/markAsRead",
  async (conversationId, { rejectWithValue }) => {
    try {
      await dmService.markAsRead(conversationId);
      return conversationId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Không thể đánh dấu đã đọc",
      );
    }
  },
);

export const preloadAllData = createAsyncThunk(
  "dm/preloadAll",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setAppLoading(true));
      dispatch(setAppLoadingPhase("conversations"));

      console.log("%c[preloadAllData] >> Bắt đầu preload...", "color: #8b5cf6; font-weight: bold; font-size: 13px;");
      const preloadStart = performance.now();

      // ─── Phase 1: Fetch conversations + spaces song song ───
      const [conversations, spacesResponse] = await Promise.allSettled([
        dispatch(fetchConversations()).unwrap(),
        spaceService.getAllWithRooms(),
      ]);

      const spaces =
        spacesResponse.status === "fulfilled"
          ? (spacesResponse.value.data?.data || spacesResponse.value.data?.spaces || spacesResponse.value.data || [])
          : [];

      const roomsMap = {};
      spaces.forEach((space) => {
        if (space.rooms && Array.isArray(space.rooms)) {
          roomsMap[space.id] = space.rooms;
        }
      });

      // ─── Phase 2: Join all DM rooms via WebSocket ───
      const convList = conversations.status === "fulfilled" ? conversations.value : [];
      convList.forEach((conv) => {
        socketService.joinDM(conv.id);
      });

      const elapsed = Math.round(performance.now() - preloadStart);
      console.log(`%c[preloadAllData] << Hoàn tất preload trong ${elapsed}ms`, "color: #8b5cf6; font-weight: bold; font-size: 13px;", {
        conversations: convList.length,
        spaces: spaces.length,
      });

      dispatch(setAppLoadingPhase("complete"));
      dispatch(setAppLoading(false));

      return {
        conversations: convList,
        spaces,
        roomsMap,
        members: [],
        dmMessages: [],
        roomMessages: [],
      };
    } catch (err) {
      console.error("[preloadAllData] Preload failed:", err);
      dispatch(setAppLoading(false));
      dispatch(setAppLoadingError(err.response?.data?.message || "Không thể tải dữ liệu"));
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải dữ liệu",
      );
    }
  },
);

// 🆕 Preload all DM data: conversations + messages + join all WS rooms (legacy, kept for compatibility)
export const preloadDMData = createAsyncThunk(
  "dm/preload",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // ─── Phase 1: Fetch all conversations ───
      dispatch(setPreloadPhase("conversations"));

      const convResponse = await dmService.getConversations({ page: 1, limit: 100 });
      const conversations =
        convResponse.data?.data ||
        convResponse.data?.conversations ||
        convResponse.data ||
        [];

      // Dispatch conversations into Redux
      dispatch(setConversationsPreloaded(conversations));

      // ─── Phase 2: Fetch messages for all conversations ───
      dispatch(setPreloadPhase("messages"));

      const messagePromises = conversations.map(async (conv) => {
        try {
          const msgResponse = await dmService.getMessages(conv.id, {
            page: 1,
            limit: 50,
          });
          const messages =
            msgResponse.data?.data ||
            msgResponse.data?.messages ||
            msgResponse.data ||
            [];

          return {
            conversationId: conv.id,
            messages,
          };
        } catch (err) {
          console.warn(
            `[preloadDMData] Failed to fetch messages for ${conv.id}:`,
            err,
          );
          return { conversationId: conv.id, messages: [] };
        }
      });

      const allMessages = await Promise.allSettled(messagePromises);

      // Dispatch all messages into Redux
      allMessages.forEach((result) => {
        if (result.status === "fulfilled") {
          dispatch(setMessagesPreloaded(result.value));
        }
      });

      // ─── Phase 3: Join all DM rooms via WebSocket ───
      conversations.forEach((conv) => {
        socketService.joinDM(conv.id);
      });

      dispatch(setPreloadPhase("complete"));

      return {
        conversationCount: conversations.length,
        messageCounts: allMessages.map((m) => ({
          conversationId: m.value?.conversationId,
          count: m.value?.messages?.length || 0,
        })),
      };
    } catch (err) {
      console.error("[preloadDMData] Preload failed:", err);
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải dữ liệu tin nhắn",
      );
    }
  },
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
  // 🆕 Preload state
  preloadComplete: false,
  preloadPhase: "idle", // 'idle' | 'conversations' | 'messages' | 'complete'
  preloadError: null,
  // 🆕 Total unread count for sidebar badge
  totalUnreadCount: 0,
  // 🆕 Track last read message per conversation
  lastReadMessageId: {},
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
      // Match by tempId first, then by content + sender_id
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
          // If real message already exists, just remove the pending one
          messages.splice(pendingIndex, 1);
        } else {
          // Replace pending message with real one
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

    prependMessages: (state, action) => {
      const { conversationId, messages } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      const existingIds = new Set(
        state.messages[conversationId].map((m) => m.id),
      );
      const newMessages = messages.filter((m) => !existingIds.has(m.id));
      state.messages[conversationId] = [
        ...newMessages,
        ...state.messages[conversationId],
      ];
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
        state.typing[conversationId] = {
          userId,
          isTyping,
          timestamp: Date.now(),
        };
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
      state.onlineUsers = (action.payload || []).map(String);
    },

    updateUserStatus: (state, action) => {
      const { userId, status } = action.payload;
      const userIdStr = String(userId);
      // Update online users list
      if (status === "online") {
        if (!state.onlineUsers.includes(userIdStr)) {
          state.onlineUsers.push(userIdStr);
        }
      } else {
        state.onlineUsers = state.onlineUsers.filter((id) => String(id) !== userIdStr);
      }
      // Update conversation other_user status
      state.conversations = state.conversations.map((conv) => {
        if (conv.other_user?.id === userId || String(conv.other_user?.id) === userIdStr) {
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
          unread_count: unreadCount ?? state.conversations[idx].unread_count,
        };
        // Move to top
        const conv = state.conversations.splice(idx, 1)[0];
        state.conversations.unshift(conv);
      }

      // Sync unreadCounts and totalUnreadCount if unreadCount is explicitly provided
      if (typeof unreadCount === "number") {
        const prevCount = state.unreadCounts[conversationId] || 0;
        state.unreadCounts[conversationId] = unreadCount;
        // Recalculate total by replacing the previous count with the new one
        state.totalUnreadCount = Object.values(state.unreadCounts).reduce(
          (a, b) => a + b,
          0,
        );
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

    // Load messages from localStorage cache
    loadMessagesFromCache: (state, action) => {
      const { conversationId } = action.payload;
      if (!conversationId) return;
      // Skip if already loaded in Redux
      if (state.messages[conversationId]?.length > 0) return;

      const cached = getCachedMessages("dm", conversationId);
      if (cached && cached.messages.length > 0) {
        state.messages[conversationId] = cached.messages;
        state.fetchedConversations[conversationId] = true;
      }
    },

    // Load conversations list from localStorage cache
    loadConversationsFromCache: (state) => {
      // Skip if already loaded in Redux
      if (state.conversations.length > 0 || state.conversationsFetched) return;

      const cached = getCachedConversations();
      if (cached && cached.conversations.length > 0) {
        // Load cached messages for each conversation to ensure lastMessage is correct
        const conversationsWithUpdatedLastMessage = cached.conversations.map((conv) => {
          const msgCache = getCachedMessages("dm", conv.id);
          if (msgCache && msgCache.messages.length > 0) {
            // Find latest message from cache
            const latestMsg = [...msgCache.messages].sort((a, b) => {
              const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return tB - tA;
            })[0];

            // Update last_message in conversation if cached message is newer
            const cachedLastTime = latestMsg?.created_at ? new Date(latestMsg.created_at).getTime() : 0;
            const convLastTime = conv.last_message?.created_at ? new Date(conv.last_message.created_at).getTime() : 0;

            if (latestMsg && cachedLastTime >= convLastTime) {
              return {
                ...conv,
                last_message: {
                  id: latestMsg.id,
                  content: latestMsg.content,
                  created_at: latestMsg.created_at,
                  sender_id: latestMsg.sender_id,
                },
              };
            }
          }
          return conv;
        });

        state.conversations = conversationsWithUpdatedLastMessage;
        state.conversationsFetched = true;

        // Also load messages into messages map
        cached.conversations.forEach((conv) => {
          const msgCache = getCachedMessages("dm", conv.id);
          if (msgCache && msgCache.messages.length > 0) {
            state.messages[conv.id] = msgCache.messages;
            state.fetchedConversations[conv.id] = true;
          }
        });
      }
    },

    setConversationsFetched: (state, action) => {
      state.conversationsFetched = action.payload;
    },

    markConversationAsFetched: (state, action) => {
      state.fetchedConversations[action.payload] = true;
    },

    resetDMState: () => initialState,

    replaceTempConversation: (state, action) => {
      const { tempId, realConversation } = action.payload;

      // Update conversations list — avoid duplicates
      const existingIdx = state.conversations.findIndex((c) => c.id === realConversation.id);
      if (existingIdx !== -1) {
        // Real conversation already exists (e.g. from WebSocket or API race)
        // Just update it in place
        state.conversations[existingIdx] = realConversation;
      } else {
        const tempIdx = state.conversations.findIndex((c) => c.id === tempId);
        if (tempIdx !== -1) {
          state.conversations[tempIdx] = realConversation;
        } else {
          state.conversations.unshift(realConversation);
        }
      }

      // Update active conversation if it matches
      if (state.activeConversationId === tempId) {
        state.activeConversationId = realConversation.id;
        state.activeConversation = realConversation;
      }

      // Move messages from tempId to realId
      if (state.messages[tempId]) {
        state.messages[realConversation.id] = state.messages[tempId].map(
          (m) => ({
            ...m,
            conversation_id: realConversation.id,
          }),
        );
        delete state.messages[tempId];
      }

      // Move typing state
      if (state.typing[tempId]) {
        state.typing[realConversation.id] = state.typing[tempId];
        delete state.typing[tempId];
      }
    },

    clearError: (state) => {
      state.error = null;
      state.messagesError = null;
    },

    // 🆕 Preload reducers
    setPreloadPhase: (state, action) => {
      state.preloadPhase = action.payload;
    },

    setConversationsPreloaded: (state, action) => {
      state.conversations = action.payload;
      state.conversationsFetched = true;
    },

    setMessagesPreloaded: (state, action) => {
      const { conversationId, messages } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }

      // Merge with existing messages (from WebSocket), dedupe
      const existingIds = new Set(
        state.messages[conversationId].map((m) => m.id),
      );
      const newMessages = messages.filter((m) => !existingIds.has(m.id));
      state.messages[conversationId] = [
        ...state.messages[conversationId],
        ...newMessages,
      ];

      // Mark as fetched
      state.fetchedConversations[conversationId] = true;
    },

    setPreloadComplete: (state) => {
      state.preloadComplete = true;
    },

    resetPreloadState: (state) => {
      state.preloadComplete = false;
      state.preloadPhase = "idle";
      state.preloadError = null;
    },

    // 🆕 Unread tracking reducers
    incrementUnreadCount: (state, action) => {
      const { conversationId } = action.payload;
      const current = state.unreadCounts[conversationId] || 0;
      state.unreadCounts[conversationId] = current + 1;

      // Update total
      state.totalUnreadCount = Object.values(state.unreadCounts).reduce(
        (a, b) => a + b,
        0,
      );

      // Also update in conversations array for DMList display
      const idx = state.conversations.findIndex((c) => c.id === conversationId);
      if (idx !== -1) {
        state.conversations[idx].unread_count =
          (state.conversations[idx].unread_count || 0) + 1;
      }
    },

    // 🆕 Add a new conversation to the list (e.g. when receiving a message from a new conversation)
    addConversation: (state, action) => {
      const conv = action.payload;
      const exists = state.conversations.find((c) => c.id === conv.id);
      if (!exists) {
        state.conversations.unshift(conv);
      }
    },

    clearUnreadCount: (state, action) => {
      const { conversationId } = action.payload;
      delete state.unreadCounts[conversationId];

      // Update total
      state.totalUnreadCount = Object.values(state.unreadCounts).reduce(
        (a, b) => a + b,
        0,
      );

      // Also clear in conversations array
      const idx = state.conversations.findIndex((c) => c.id === conversationId);
      if (idx !== -1) {
        state.conversations[idx].unread_count = 0;
      }
    },

    setLastReadMessageId: (state, action) => {
      const { conversationId, messageId } = action.payload;
      state.lastReadMessageId[conversationId] = messageId;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchConversations
      .addCase(fetchConversations.pending, (state) => {
        // Skip loading skeleton if we have cached conversations
        const hasCachedConvs = hasConversationsCache();
        state.loading = !hasCachedConvs;
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
        // NOTE: We do NOT add to conversations here.
        // The caller (ChatArea) handles this via replaceTempConversation
        // to avoid duplicates when swapping temp -> real conversation.
        state.activeConversationId = conv.id;
        state.activeConversation = conv;
      })
      .addCase(createOrGetConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchMessages
      .addCase(fetchMessages.pending, (state, action) => {
        const { conversationId } = action.meta.arg || {};
        // Always show loading skeleton when fetching messages
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
        let existing = state.messages[conversationId];

        // Remove pending messages if they are already confirmed in the API response
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
        const idx = state.conversations.findIndex(
          (c) => c.id === conversationId,
        );
        if (idx !== -1) {
          state.conversations[idx].unread_count = 0;
        }
        state.unreadCounts[conversationId] = 0;
      })
      // 🆕 preloadAllData
      .addCase(preloadAllData.pending, (state) => {
        state.preloadPhase = "conversations";
        state.preloadError = null;
      })
      .addCase(preloadAllData.fulfilled, (state, action) => {
        state.preloadComplete = true;
        state.preloadPhase = "complete";
        // Set conversations from payload
        state.conversations = action.payload.conversations;
        state.conversationsFetched = true;
      })
      .addCase(preloadAllData.rejected, (state, action) => {
        state.preloadError = action.payload;
        state.preloadPhase = "idle";
      })
      // 🆕 preloadDMData (legacy)
      .addCase(preloadDMData.pending, (state) => {
        state.preloadPhase = "conversations";
        state.preloadError = null;
      })
      .addCase(preloadDMData.fulfilled, (state) => {
        state.preloadComplete = true;
        state.preloadPhase = "complete";
      })
      .addCase(preloadDMData.rejected, (state, action) => {
        state.preloadError = action.payload;
        state.preloadPhase = "idle";
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
  replaceTempConversation,
  resetDMState,
  clearError,
  // 🆕 Preload exports
  setPreloadPhase,
  setConversationsPreloaded,
  setMessagesPreloaded,
  setPreloadComplete,
  resetPreloadState,
  // 🆕 Unread tracking exports
  incrementUnreadCount,
  clearUnreadCount,
  setLastReadMessageId,
  addConversation,
  // 🆕 Cache exports
  loadMessagesFromCache,
  loadConversationsFromCache,
} = dmSlice.actions;

export default dmSlice.reducer;
