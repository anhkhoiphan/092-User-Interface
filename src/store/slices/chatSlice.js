import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  replyTo: null,
  editMessage: null,
  selectedUser: null,
  selectedDMUser: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setReplyTo: (state, action) => {
      state.replyTo = action.payload;
    },
    cancelReply: (state) => {
      state.replyTo = null;
    },
    setEditMessage: (state, action) => {
      state.editMessage = action.payload;
    },
    cancelEdit: (state) => {
      state.editMessage = null;
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    setSelectedDMUser: (state, action) => {
      state.selectedDMUser = action.payload;
    },
    clearSelectedDMUser: (state) => {
      state.selectedDMUser = null;
    },
    sendMessageToUser: (state, action) => {
      state.selectedUser = null;
      // Additional logic for navigating to DM can be added here
    },
  },
});

export const {
  setReplyTo,
  cancelReply,
  setEditMessage,
  cancelEdit,
  setSelectedUser,
  clearSelectedUser,
  setSelectedDMUser,
  clearSelectedDMUser,
  sendMessageToUser,
} = chatSlice.actions;

export default chatSlice.reducer;
