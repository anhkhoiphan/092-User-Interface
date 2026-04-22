import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true,
});

let accessToken = typeof window !== "undefined"
  ? localStorage.getItem("access_token")
  : null;

let refreshTimer = null;

// Parse JWT token to get expiration time
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Schedule token refresh before expiration
function scheduleTokenRefresh(token) {
  // Clear existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  if (!token) return;

  const decoded = parseJwt(token);
  if (!decoded?.exp) return;

  const expiresAt = decoded.exp * 1000; // Convert to milliseconds
  const now = Date.now();
  const refreshBefore = 60 * 1000; // Refresh 60 seconds before expiration
  const timeUntilRefresh = expiresAt - now - refreshBefore;

  if (timeUntilRefresh <= 0) {
    // Token already expired or about to expire, refresh immediately
    silentRefresh();
    return;
  }

  refreshTimer = setTimeout(() => {
    silentRefresh();
  }, timeUntilRefresh);
}

// Silent refresh token
async function silentRefresh() {
  try {
    const rawToken = typeof window !== "undefined"
      ? localStorage.getItem("refreshToken")
      : null;

    let refreshToken = rawToken;
    if (rawToken && rawToken.startsWith("{")) {
      try {
        const parsed = JSON.parse(rawToken);
        if (parsed && typeof parsed === "object" && parsed.refreshToken) {
          refreshToken = parsed.refreshToken;
        }
      } catch {
        // ignore
      }
    }

    if (!refreshToken) {
      clearAccessToken();
      return;
    }

    const { data } = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { withCredentials: true }
    );

    setAccessToken(data.accessToken);
    if (typeof window !== "undefined") {
      localStorage.setItem("refreshToken", data.refreshToken);
    }
  } catch {
    clearAccessToken();
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }
}

export const setAccessToken = (token) => {
  accessToken = token;
  if (token && typeof window !== "undefined") {
    localStorage.setItem("access_token", token);
    scheduleTokenRefresh(token);
  } else if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  }
};

export const clearAccessToken = () => {
  accessToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
  }
};

export const clearAuth = () => {
  clearAccessToken();
  if (typeof window !== "undefined") {
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("auth_user");
    if (window.location.pathname !== "/") {
      window.location.replace("/");
    }
  }
};

api.interceptors.request.use(
  (config) => {
    const publicPaths = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/forgot-password"];
    const isPublic = publicPaths.some((p) => config.url?.includes(p));
    if (accessToken && !isPublic) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    const publicPaths = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/forgot-password"];
    const isPublic = publicPaths.some((p) => original.url?.includes(p));

    if (status === 401 && !original._retry && !isPublic) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const rawToken =
          typeof window !== "undefined"
            ? localStorage.getItem("refreshToken")
            : null;

        let refreshToken = rawToken;
        if (rawToken && rawToken.startsWith("{")) {
          try {
            const parsed = JSON.parse(rawToken);
            if (parsed && typeof parsed === "object" && parsed.refreshToken) {
              refreshToken = parsed.refreshToken;
            }
          } catch {
            // ignore
          }
        }

        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        setAccessToken(data.accessToken);
        if (typeof window !== "undefined") {
          localStorage.setItem("refreshToken", data.refreshToken);
        }

        onRefreshed(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        clearAuth();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
