import api from "./axiosConfig";
import { User } from "../types";

export const FollowAPI = {
  follow: async (followerId: number, followingId: number): Promise<void> => {
    await api.post(
      `/follow/follow?followerId=${followerId}&followingId=${followingId}`
    );
  },

  unfollow: async (followerId: number, followingId: number): Promise<void> => {
    await api.post(
      `/follow/unfollow?followerId=${followerId}&followingId=${followingId}`
    );
  },

  approveFollow: async (userId: number, followerId: number): Promise<void> => {
    await api.post(`/follow/approve?userId=${userId}&followerId=${followerId}`);
  },

  rejectFollow: async (userId: number, followerId: number): Promise<void> => {
    await api.post(`/follow/reject?userId=${userId}&followerId=${followerId}`);
  },

  getFollowers: async (
    userId: number,
    page = 0,
    size = 10
  ): Promise<{
    content: User[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await api.get(
      `/follow/followers?userId=${userId}&page=${page}&size=${size}`
    );
    return response.data;
  },

  getFollowing: async (
    userId: number,
    page = 0,
    size = 10
  ): Promise<{
    content: User[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await api.get(
      `/follow/following?userId=${userId}&page=${page}&size=${size}`
    );
    return response.data;
  },

  getPendingFollows: async (
    userId: number,
    page = 0,
    size = 10
  ): Promise<{
    content: User[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await api.get(
      `/follow/pending?userId=${userId}&page=${page}&size=${size}`
    );
    return response.data;
  },

  muteUser: async (userId: number, targetUserId: number): Promise<void> => {
    await api.post(
      `/follow/mute?userId=${userId}&targetUserId=${targetUserId}`
    );
  },

  unmuteUser: async (userId: number, targetUserId: number): Promise<void> => {
    await api.post(
      `/follow/unmute?userId=${userId}&targetUserId=${targetUserId}`
    );
  },

  blockUser: async (userId: number, targetUserId: number): Promise<void> => {
    await api.post(
      `/follow/block?userId=${userId}&targetUserId=${targetUserId}`
    );
  },

  unblockUser: async (userId: number, targetUserId: number): Promise<void> => {
    await api.post(
      `/follow/unblock?userId=${userId}&targetUserId=${targetUserId}`
    );
  },

  getRecommendedUsers: async (
    userId: number,
    page = 0,
    size = 10
  ): Promise<{
    content: User[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await api.get(
      `/follow/recommended?userId=${userId}&page=${page}&size=${size}`
    );
    return response.data;
  },

  isFollowing: async (
    followerId: number,
    followingId: number
  ): Promise<boolean> => {
    const response = await api.get<boolean>(
      `/follow/is-following?followerId=${followerId}&followingId=${followingId}`
    );
    return response.data;
  },
};
