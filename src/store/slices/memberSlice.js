import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  memberSearchQuery: "",
  selectedMember: null,
};

const memberSlice = createSlice({
  name: "member",
  initialState,
  reducers: {
    setMemberSearchQuery: (state, action) => {
      state.memberSearchQuery = action.payload;
    },
    setSelectedMember: (state, action) => {
      state.selectedMember = action.payload;
    },
    clearSelectedMember: (state) => {
      state.selectedMember = null;
    },
    navigateToDM: (state, action) => {
      state.selectedMember = null;
      // Additional logic for navigating to DM can be added here
    },
  },
});

export const {
  setMemberSearchQuery,
  setSelectedMember,
  clearSelectedMember,
  navigateToDM,
} = memberSlice.actions;

export default memberSlice.reducer;
