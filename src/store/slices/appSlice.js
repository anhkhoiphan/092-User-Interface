import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeView: "messages",
  activeSpace: "toan-cao-cap",
  activeRoom: null,
  searchQuery: "",
  isSettings: false,
  // 🆕 App-level loading state for initial data fetch on F5
  appLoading: false,
  appLoadingPhase: "idle", // 'idle' | 'auth' | 'conversations' | 'spaces' | 'rooms' | 'members' | 'messages' | 'complete'
  appLoadingError: null,
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
      state.activeRoom = null;
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
    },
    cancelCreateSpace: (state) => {
      state.activeView = "space";
    },
    navigateToDashboard: (state) => {
      state.activeView = "dashboard";
      state.isSettings = false;
    },
    // 🆕 App loading state reducers
    setAppLoading: (state, action) => {
      state.appLoading = action.payload;
    },
    setAppLoadingPhase: (state, action) => {
      state.appLoadingPhase = action.payload;
    },
    setAppLoadingError: (state, action) => {
      state.appLoadingError = action.payload;
    },
    resetAppLoading: (state) => {
      state.appLoading = false;
      state.appLoadingPhase = "idle";
      state.appLoadingError = null;
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
  navigateToDashboard,
  // 🆕 App loading exports
  setAppLoading,
  setAppLoadingPhase,
  setAppLoadingError,
  resetAppLoading,
} = appSlice.actions;

export default appSlice.reducer;
