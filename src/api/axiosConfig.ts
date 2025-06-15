import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import getEnvVars from "../../config";

const baseURL = getEnvVars.apiUrl;

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // Handle token refresh if 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (!refreshToken) {
          // No refresh token, logout
          await AsyncStorage.multiRemove(["token", "refreshToken"]);
          return Promise.reject(error);
        }

        // Request new token
        const res = await axios.post(`${baseURL}/auth/refresh-token`, {
          refreshToken,
        });

        if (res.status === 200) {
          await AsyncStorage.setItem("token", res.data.accessToken);
          api.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${res.data.accessToken}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, logout
        await AsyncStorage.multiRemove(["token", "refreshToken"]);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
