import { configureStore } from "@reduxjs/toolkit";
import appReducer from "./slices/appSlice";
import themeReducer from "./slices/themeSlice";
import chatReducer from "./slices/chatSlice";
import memberReducer from "./slices/memberSlice";
import messageReducer from "./slices/messageSlice";
import authReducer from "./slices/authSlice";
import dmReducer from "./slices/dmSlice";
import spaceReducer from "./slices/spaceSlice";
import {
  setCachedMessages,
  setCachedConversations,
  setCachedSpaces,
  setCachedMembers,
} from "./messageCache";

/**
 * Middleware tự động lưu messages vào localStorage
 * Chỉ intercept các action thay đổi messages để tránh performance issue
 */
const messageCacheMiddleware = (storeAPI) => (next) => (action) => {
  const result = next(action);

  // Auto-save DM messages to cache
  if (
    action.type === "dm/addMessage" ||
    action.type === "dm/prependMessages" ||
    action.type === "dm/setMessagesPreloaded" ||
    action.type === "dm/fetchMessages/fulfilled"
  ) {
    const { dm } = storeAPI.getState();
    const conversationId = action.payload?.conversationId;
    if (conversationId && dm.messages[conversationId]) {
      setCachedMessages("dm", conversationId, dm.messages[conversationId]);
    }
    // Also save all conversations on bulk operations
    if (action.type === "dm/setMessagesPreloaded" || action.type === "dm/fetchMessages/fulfilled") {
      Object.entries(dm.messages).forEach(([id, messages]) => {
        setCachedMessages("dm", id, messages);
      });
    }
  }

  // Auto-save room messages to cache
  if (
    action.type === "message/addMessage" ||
    action.type === "message/prependRoomMessages" ||
    action.type === "message/setRoomMessagesPreloaded" ||
    action.type === "message/fetchRoomMessages/fulfilled"
  ) {
    const { message } = storeAPI.getState();
    const roomId = action.payload?.roomId;
    if (roomId && message.messages[roomId]) {
      setCachedMessages("room", roomId, message.messages[roomId]);
    }
    // Also save all rooms on bulk operations
    if (action.type === "message/setRoomMessagesPreloaded" || action.type === "message/fetchRoomMessages/fulfilled") {
      Object.entries(message.messages).forEach(([id, messages]) => {
        setCachedMessages("room", id, messages);
      });
    }
  }

  // Auto-save conversations list to cache
  if (
    action.type === "dm/fetchConversations/fulfilled" ||
    action.type === "dm/setConversationsPreloaded" ||
    action.type === "dm/addConversation" ||
    action.type === "dm/replaceTempConversation" ||
    action.type === "dm/updateConversationLastMessage"
  ) {
    const { dm } = storeAPI.getState();
    if (dm.conversations && dm.conversations.length > 0) {
      setCachedConversations(dm.conversations);
    }
  }

  // Auto-save spaces and rooms to cache
  if (
    action.type === "space/fetchSpaces/fulfilled" ||
    action.type === "space/createSpace/fulfilled" ||
    action.type === "space/joinSpaceByInvite/fulfilled" ||
    action.type === "space/addSpace"
  ) {
    const { space } = storeAPI.getState();
    if (space.spaces && space.spaces.length > 0) {
      setCachedSpaces(space.spaces, space.roomsMap);
    }
  }

  // Auto-save members to cache
  if (
    action.type === "space/fetchSpaceMembers/fulfilled"
  ) {
    const { space } = storeAPI.getState();
    if (space.membersMap && Object.keys(space.membersMap).length > 0) {
      setCachedMembers(space.membersMap);
    }
  }

  return result;
};

export const store = configureStore({
  reducer: {
    app: appReducer,
    theme: themeReducer,
    chat: chatReducer,
    member: memberReducer,
    message: messageReducer,
    auth: authReducer,
    dm: dmReducer,
    space: spaceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(messageCacheMiddleware),
});
