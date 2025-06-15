import api from "./axiosConfig";
import { Hashtag } from "@/types/index";

export const HashtagAPI = {
  processHashtags: async (
    postId: number,
    hashtags: string[]
  ): Promise<void> => {
    await api.post(`/hashtags/process?postId=${postId}`, hashtags);
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
      `/hashtags/search?query=${query}&page=${page}&size=${size}`
    );
    return response.data;
  },
};
