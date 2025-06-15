import api from "./axiosConfig";
import { Comment } from "@/types/index";

export const CommentAPI = {
  createComment: async (
    postId: number,
    userId: number,
    commentData: {
      text: string;
      parentCommentId?: number;
      mentions?: string[];
      hashtags?: string[];
    }
  ): Promise<Comment> => {
    const response = await api.post<Comment>(
      `/comments/post/${postId}?userId=${userId}`,
      commentData
    );
    return response.data;
  },

  getPostComments: async (
    postId: number,
    currentUserId: number,
    page = 0,
    size = 10
  ): Promise<{
    content: Comment[];
    pageable: { pageNumber: number; pageSize: number };
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await api.get(
      `/comments/post/${postId}?currentUserId=${currentUserId}&page=${page}&size=${size}`
    );
    return response.data;
  },

  getCommentReplies: async (
    commentId: number,
    currentUserId: number
  ): Promise<Comment[]> => {
    const response = await api.get<Comment[]>(
      `/comments/${commentId}/replies?currentUserId=${currentUserId}`
    );
    return response.data;
  },

  likeComment: async (commentId: number, userId: number): Promise<void> => {
    await api.post(`/comments/${commentId}/like?userId=${userId}`);
  },

  unlikeComment: async (commentId: number, userId: number): Promise<void> => {
    await api.post(`/comments/${commentId}/unlike?userId=${userId}`);
  },

  repostComment: async (commentId: number, userId: number): Promise<void> => {
    await api.post(`/comments/${commentId}/repost?userId=${userId}`);
  },

  shareComment: async (commentId: number, userId: number): Promise<void> => {
    await api.post(`/comments/${commentId}/share?userId=${userId}`);
  },

  updateComment: async (
    commentId: number,
    userId: number,
    newText: string
  ): Promise<void> => {
    await api.put(`/comments/${commentId}?userId=${userId}`, newText);
  },

  deleteComment: async (commentId: number, userId: number): Promise<void> => {
    await api.delete(`/comments/${commentId}?userId=${userId}`);
  },

  hideComment: async (
    commentId: number,
    moderatorId: number
  ): Promise<void> => {
    await api.post(`/comments/${commentId}/hide?moderatorId=${moderatorId}`);
  },

  unhideComment: async (
    commentId: number,
    moderatorId: number
  ): Promise<void> => {
    await api.post(`/comments/${commentId}/unhide?moderatorId=${moderatorId}`);
  },
};
