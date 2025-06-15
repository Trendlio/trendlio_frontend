import api from "./axiosConfig";
import { User } from "../types";
import { UserAPI } from "./user";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface AuthResponseData {
  user?: User;
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
}

interface ReactivationData {
  email: string;
  token: string;
  newPassword: string;
}

export const AuthAPI = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    const response = await api.post<AuthResponseData>(
      "/auth/login",
      credentials
    );
    await AsyncStorage.setItem("refreshToken", response.data.refreshToken);
    await AsyncStorage.setItem("token", response.data.accessToken);
    if (response.data.user) {
      return response.data.user;
    } else {
      return await UserAPI.getCurrentUser();
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>("/auth/me");
    return response.data;
  },

  register: async (data: RegisterData): Promise<boolean> => {
    await api.post<{ message: string }>("/auth/signup", data);
    return true;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
    await AsyncStorage.multiRemove(["token", "refreshToken"]);
  },

  requestPasswordReset: async (email: string): Promise<boolean> => {
    await api.post<{ message: string }>("/auth/password-reset-request", {
      email,
    });
    return true;
  },

  resetPassword: async (
    token: string,
    newPassword: string
  ): Promise<boolean> => {
    await api.post<{ message: string }>("/auth/password-reset-confirm", {
      token,
      newPassword: newPassword,
    });
    return true;
  },

  verifyEmail: async (token: string): Promise<boolean> => {
    await api.get(`/auth/verify-email?token=${token}`);
    return true;
  },

  checkToken: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return false;
    await api.get("/auth/validate-token");
    return true;
  },

  deactivateUser: async (userId: string): Promise<void> => {
    await api.post(`/auth/deactivate/${userId}`);
  },

  reactivateUser: async (userId: string): Promise<void> => {
    await api.post(`/auth/reactivate/${userId}`);
  },

  suspendUser: async (userId: string, reason: string): Promise<void> => {
    await api.post(`/auth/suspend/${userId}`, { reason });
  },

  requestAccountReactivation: async (email: string): Promise<void> => {
    await api.post(`/auth/account/reactivation-request?email=${email}`);
  },

  reactive: async (data: ReactivationData): Promise<void> => {
    await api.post(`/auth/account/reactivate`, data);
  },
};
