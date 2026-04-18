import { createSlice } from "@reduxjs/toolkit";

const getInitialTheme = () => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true; // default to dark mode
  }
  return true; // default to dark mode for SSR
};

const initialState = {
  isDark: getInitialTheme(),
};

const applyTheme = (isDark) => {
  if (typeof window !== "undefined") {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.isDark = !state.isDark;
      applyTheme(state.isDark);
    },
    setTheme: (state, action) => {
      state.isDark = action.payload === "dark";
      applyTheme(state.isDark);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;

// Apply theme on initial load
applyTheme(initialState.isDark);

export default themeSlice.reducer;
