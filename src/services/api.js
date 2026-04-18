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
  ? sessionStorage.getItem("accessToken")
  : null;

export const setAccessToken = (token) => {
  accessToken = token;
  if (token && typeof window !== "undefined") {
    sessionStorage.setItem("accessToken", token);
  } else if (typeof window !== "undefined") {
    sessionStorage.removeItem("accessToken");
  }
};

export const clearAccessToken = () => {
  accessToken = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("accessToken");
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
