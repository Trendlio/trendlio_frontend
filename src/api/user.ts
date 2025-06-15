import api from "./axiosConfig";
import { User, PaginatedResponse, Post } from "../types/index";

export const UserAPI = {
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>("/users/me");
    return response.data;
  },

  getUserProfile: async (userId: number): Promise<User> => {
    const response = await api.get<User>(`/users/profile/${userId}`);
    return response.data;
  },

  getUserProfileByUsername: async (username: string): Promise<User> => {
    const response = await api.get<User>(`/users/profile/username/${username}`);
    return response.data;
  },

  updateUserProfile: async (
    userId: number,
    userData: Partial<User>
  ): Promise<User> => {
    const response = await api.put<User>(`/users/profile/${userId}`, userData);
    return response.data;
  },

  uploadAvatar: async (formData: FormData): Promise<User> => {
    const response = await api.post<User>("/users/me/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
      },
      params: {
        userId: formData.get("userId"),
      },
    });
    return response.data;
  },

  searchUsers: async (
    query: string,
    page = 0,
    size = 10
  ): Promise<{
    content: User[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await api.get(
      `/users/search?query=${query}&page=${page}&size=${size}`
    );
    return response.data;
  },

  getRandomUsers: async (
    page = 0,
    size = 10
  ): Promise<{
    content: User[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await api.get(
      `/follow/recommended?userId=1&page=${page}&size=${size}`
    );
    return response.data;
  },

  getUserPosts: async (
    userId: number,
    currentUserId: number,
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<Post>> => {
    const response = await api.get<PaginatedResponse<Post>>(
      `/posts/user/${userId}?currentUserId=${currentUserId}&page=${page}&size=${size}`
    );
    return response.data;
  },

  getUserReposts: async (
    userId: number,
    currentUserId: number,
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<Post>> => {
    const response = await api.get<PaginatedResponse<Post>>(
      `/repost/user/${userId}?currentUserId=${currentUserId}&page=${page}&size=${size}`
    );
    return response.data;
  },

  getUserReplies: async (
    userId: number,
    currentUserId: number,
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<Post>> => {
    const response = await api.get<PaginatedResponse<Post>>(
      `/posts/user/${userId}/replies?currentUserId=${currentUserId}&page=${page}&size=${size}`
    );
    return response.data;
  },
};
