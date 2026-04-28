import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeView: "messages",
  activeSpace: "toan-cao-cap",
  activeRoom: null,
  searchQuery: "",
  isSettings: false,
  isAgentChat: false,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setActiveView: (state, action) => {
      state.activeView = action.payload;
    },
    setActiveSpace: (state, action) => {
      state.activeSpace = action.payload;
    },
    setActiveRoom: (state, action) => {
      state.activeRoom = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setIsSettings: (state, action) => {
      state.isSettings = action.payload;
    },
    openSettings: (state) => {
      state.isSettings = true;
    },
    closeSettings: (state) => {
      state.isSettings = false;
    },
    navigateToSpace: (state, action) => {
      state.activeView = "space";
      state.activeSpace = action.payload;
      state.isSettings = false;
    },
    navigateToMessages: (state) => {
      state.activeView = "messages";
      state.activeRoom = null;
      state.isSettings = false;
    },
    openCreateSpace: (state) => {
      state.activeView = "createSpace";
      state.isSettings = false;
      state.isAgentChat = false;
    },
    cancelCreateSpace: (state) => {
      state.activeView = "space";
    },
    openAgentChat: (state) => {
      state.isAgentChat = true;
      state.isSettings = false;
      state.activeView = "messages";
      state.activeRoom = "agent-dm";
    },
    closeAgentChat: (state) => {
      state.isAgentChat = false;
      state.activeRoom = null;
    },
  },
});

export const {
  setActiveView,
  setActiveSpace,
  setActiveRoom,
  setSearchQuery,
  setIsSettings,
  openSettings,
  closeSettings,
  navigateToSpace,
  navigateToMessages,
  openCreateSpace,
  cancelCreateSpace,
  openAgentChat,
  closeAgentChat,
} = appSlice.actions;

export default appSlice.reducer;
