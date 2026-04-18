import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { authService } from "../../services/auth.service";
import { setAccessToken, clearAccessToken } from "../../services/api";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const getInitialAuth = () => {
  return { user: null, isAuthenticated: false };
};

export const initializeAuth = createAsyncThunk("auth/initialize", async () => {
  if (typeof window === "undefined") {
    return { user: null, isAuthenticated: false };
  }

  const savedUser = localStorage.getItem("auth_user");
  const savedToken = sessionStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  // Còn cả accessToken và user trong cùng tab (chưa đóng tab)
  if (savedUser && savedToken) {
    setAccessToken(savedToken);
    return { user: JSON.parse(savedUser), isAuthenticated: true };
  }

  // Mất accessToken (đóng tab/browser) nhưng còn cả refreshToken + user
  // → gọi silent refresh để lấy accessToken mới
  if (savedUser && refreshToken) {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { withCredentials: true },
      );
      console.log("[initializeAuth] refresh response:", data);
      const user = JSON.parse(savedUser);
      setAccessToken(data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("auth_user", JSON.stringify(user));
      return { user, isAuthenticated: true };
    } catch (err) {
      console.error(
        "[initializeAuth] silent refresh failed:",
        err.response?.status,
        err.response?.data || err.message,
      );
      clearAccessToken();
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("auth_user");
      return { user: null, isAuthenticated: false };
    }
  }

  // Còn refreshToken nhưng mất user data → bắt đăng nhập lại, không gọi API vô ích
  if (refreshToken) {
    localStorage.removeItem("refreshToken");
  }

  return { user: null, isAuthenticated: false };
});

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await authService.login({ email, password });
      // Map displayName -> name for backward compatibility with existing UI
      const user = { ...data.user, name: data.user.displayName };
      setAccessToken(data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("auth_user", JSON.stringify(user));
      return { user };
    } catch (err) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        (status === 429
          ? "Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau 1 giờ."
          : err.code === "ERR_NETWORK" || !err.response
            ? "Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend hoặc mạng."
            : err.message) ||
        "Đăng nhập thất bại";
      return rejectWithValue(msg);
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async ({ displayName, email, password, avatar }, { rejectWithValue }) => {
    try {
      const payload = { displayName, email, password };
      if (avatar) payload.avatar = avatar;
      const { data } = await authService.register(payload);
      const user = { ...data.user, name: data.user.displayName };
      setAccessToken(data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("auth_user", JSON.stringify(user));
      return { user };
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK" || !err.response
          ? "Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend hoặc mạng."
          : err.message) ||
        "Đăng ký thất bại";
      return rejectWithValue(msg);
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  // Fire-and-forget: clear client state immediately, let API run in background
  clearAccessToken();
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("auth_user");
  localStorage.removeItem("userName");
  localStorage.removeItem("userBio");
  localStorage.removeItem("userAvatar");
  localStorage.removeItem("usernameColor");

  try {
    authService.logout();
  } catch {
    // Ignore API errors
  }
});

export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authService.getProfile();
      const user = { ...data.user, name: data.user.displayName };
      localStorage.setItem("auth_user", JSON.stringify(user));
      return user;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Không thể lấy thông tin tài khoản";
      return rejectWithValue(msg);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    ...getInitialAuth(),
    loading: false,
    error: null,
    initialized: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateProfileSuccess: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = action.payload.user;
        state.isAuthenticated = action.payload.isAuthenticated;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = false;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, updateProfileSuccess } = authSlice.actions;
export default authSlice.reducer;
