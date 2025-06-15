import api from "./axiosConfig";
import { Notification, PaginatedResponse } from "@/types";

export const NotificationAPI = {
  getNotifications: async (
    userId: number,
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<Notification>> => {
    const response = await api.get<PaginatedResponse<Notification>>(
      `/notifications?userId=${userId}&page=${page}&size=${size}`
    );
    return response.data;
  },

  getUnreadNotifications: async (
    userId: number,
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<Notification>> => {
    const response = await api.get<PaginatedResponse<Notification>>(
      `/notifications/unread?userId=${userId}&page=${page}&size=${size}`
    );
    return response.data;
  },

  getUnreadCount: async (userId: number): Promise<number> => {
    const response = await api.get<number>(
      `/notifications/unread-count?userId=${userId}`
    );
    return response.data;
  },

  markAsRead: async (userId: number, notificationId: number): Promise<void> => {
    await api.post(
      `/notifications/mark-read?userId=${userId}&notificationId=${notificationId}`
    );
  },

  markAllAsRead: async (userId: number): Promise<void> => {
    await api.post(`/notifications/mark-all-read?userId=${userId}`);
  },

  deleteNotification: async (
    userId: number,
    notificationId: number
  ): Promise<void> => {
    await api.delete(`/notifications/${userId}/${notificationId}`);
  },
};
