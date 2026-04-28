import axios from "axios";

const AGENT_API_URL =
  import.meta.env.VITE_AGENT_API_URL || "http://localhost:8000";

const agentApi = axios.create({
  baseURL: AGENT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 300000, // Agent can take up to 5 minutes
});

export const agentService = {
  /**
   * Send a query to the Study Group Assistant Agent
   * @param {string} conversationId - ID of the current conversation/room
   * @param {string} senderId - Current user ID or name
   * @param {string} query - The user's question/message
   */
  chat: async (conversationId, senderId, query) => {
    const { data } = await agentApi.post("/api/v1/chat", {
      conversation_id: conversationId,
      sender_id: senderId,
      query,
    });
    return data;
  },
};

export default agentService;
