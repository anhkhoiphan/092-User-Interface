import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Store user-sent messages by room/chat ID
  userMessages: {},
};

const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const { roomId, message } = action.payload;
      if (!state.userMessages[roomId]) {
        state.userMessages[roomId] = [];
      }
      state.userMessages[roomId].push(message);
    },
    clearMessages: (state, action) => {
      const { roomId } = action.payload;
      if (state.userMessages[roomId]) {
        state.userMessages[roomId] = [];
      }
    },
  },
});

export const { addMessage, clearMessages } = messageSlice.actions;
export default messageSlice.reducer;
