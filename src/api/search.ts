import api from "./axiosConfig";
import { User, Post, Hashtag } from "@/types/index";

export const SearchAPI = {
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
      `/search/users?query=${query}&page=${page}&size=${size}`
    );
    return response.data;
  },

  searchHashtags: async (
    query: string,
    page = 0,
    size = 10
  ): Promise<{
    content: Hashtag[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await api.get(
      `/search/hashtags?query=${query}&page=${page}&size=${size}`
    );
    return response.data;
  },

  searchPosts: async (
    query: string,
    currentUserId: number,
    page = 0,
    size = 10
  ): Promise<{
    content: Post[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await api.get(
      `/search/posts?query=${query}&currentUserId=${currentUserId}&page=${page}&size=${size}`
    );
    return response.data;
  },

  searchByHashtag: async (
    hashtag: string,
    currentUserId: number,
    page = 0,
    size = 10
  ): Promise<{
    content: Post[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await api.get(
      `/search/hashtag/${hashtag}?currentUserId=${currentUserId}&page=${page}&size=${size}`
    );
    return response.data;
  },
};
