import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { agentService } from "../../services/agent.service";

// ==================== Async Thunks ====================

export const sendAgentMessage = createAsyncThunk(
  "agent/sendMessage",
  async ({ conversationId, senderId, query }, { rejectWithValue }) => {
    try {
      const data = await agentService.chat(conversationId, senderId, query);
      return {
        conversationId,
        answer: data.answer,
        processingTime: data.processing_time,
        originalQuery: query,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Agent không phản hồi. Vui lòng thử lại.",
      );
    }
  },
);

// Remove zero-width characters that may be inserted by contentEditable
function sanitizeContentEditable(text) {
  return text
    .replace(/\u200B/g, "") // zero-width space
    .replace(/\uFEFF/g, "") // zero-width no-break space
    .replace(/\u200C/g, "") // zero-width non-joiner
    .replace(/\u200D/g, ""); // zero-width joiner
}

// Check if a message starts with @agent
export function isAgentMention(content) {
  const clean = sanitizeContentEditable(content).trim().toLowerCase();
  return clean.startsWith("@agent");
}

// Extract query from @agent message
export function extractAgentQuery(content) {
  const clean = sanitizeContentEditable(content).trim();
  const lower = clean.toLowerCase();
  if (lower.startsWith("@agent ")) {
    return clean.slice(7).trim();
  }
  if (lower === "@agent") {
    return "";
  }
  return null;
}

// ==================== Slice ====================

const initialState = {
  // Messages by conversationId (including "agent-dm" for dedicated agent chat)
  messages: {},
  // Typing state per conversation
  typing: {},
  // Loading state per conversation
  loading: {},
  // Error state per conversation
  errors: {},
};

const agentSlice = createSlice({
  name: "agent",
  initialState,
  reducers: {
    // Add a user message to agent chat (optimistic)
    addUserMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(message);
    },

    // Add agent response
    addAgentResponse: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(message);
    },

    // Set agent typing state
    setAgentTyping: (state, action) => {
      const { conversationId, isTyping } = action.payload;
      if (isTyping) {
        state.typing[conversationId] = { isTyping: true, timestamp: Date.now() };
      } else {
        delete state.typing[conversationId];
      }
    },

    // Clear agent messages for a conversation
    clearAgentMessages: (state, action) => {
      delete state.messages[action.payload];
      delete state.typing[action.payload];
      delete state.loading[action.payload];
      delete state.errors[action.payload];
    },

    // Clear all agent state
    resetAgentState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendAgentMessage.pending, (state, action) => {
        const { conversationId } = action.meta.arg;
        state.loading[conversationId] = true;
        delete state.errors[conversationId];
        // Set typing indicator
        state.typing[conversationId] = {
          isTyping: true,
          timestamp: Date.now(),
        };
      })
      .addCase(sendAgentMessage.fulfilled, (state, action) => {
        const { conversationId, answer, originalQuery } = action.payload;
        state.loading[conversationId] = false;
        delete state.typing[conversationId];

        // Add agent response message
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        state.messages[conversationId].push({
          id: `agent-${Date.now()}`,
          content: answer,
          sender: "Agent",
          sender_id: "agent",
          isBot: true,
          isOwn: false,
          avatar: "🤖",
          timestamp: Date.now(),
          created_at: new Date().toISOString(),
          replyTo: originalQuery,
        });
      })
      .addCase(sendAgentMessage.rejected, (state, action) => {
        const { conversationId } = action.meta.arg;
        state.loading[conversationId] = false;
        delete state.typing[conversationId];
        state.errors[conversationId] = action.payload;

        // Add error message as agent response
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        state.messages[conversationId].push({
          id: `agent-error-${Date.now()}`,
          content: `❌ ${action.payload}`,
          sender: "Agent",
          sender_id: "agent",
          isBot: true,
          isOwn: false,
          avatar: "🤖",
          timestamp: Date.now(),
          created_at: new Date().toISOString(),
          isError: true,
        });
      });
  },
});

export const {
  addUserMessage,
  addAgentResponse,
  setAgentTyping,
  clearAgentMessages,
  resetAgentState,
} = agentSlice.actions;

export default agentSlice.reducer;
