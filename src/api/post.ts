import api from "./axiosConfig";
import { Post, Comment, User } from "../types/index";

export const PostAPI = {
  createPost: async (
    userId: number,
    postData: Partial<Post>
  ): Promise<Post> => {
    const response = await api.post<Post>(`/posts?userId=${userId}`, postData);
    return response.data;
  },

  getPost: async (postId: number, currentUserId: number): Promise<Post> => {
    const response = await api.get<Post>(
      `/posts/${postId}?currentUserId=${currentUserId}`
    );
    return response.data;
  },

  getUserPosts: async (
    userId: number,
    currentUserId: number,
    page = 0,
    size = 10
  ): Promise<{
    content: Post[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await api.get(
      `/posts/user/${userId}?currentUserId=${currentUserId}&page=${page}&size=${size}`
    );
    return response.data;
  },

  getPostReplies: async (
    postId: number,
    currentUserId: number,
    page = 0,
    size = 10
  ): Promise<{
    content: Post[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await api.get(
      `/posts/${postId}/replies?currentUserId=${currentUserId}&page=${page}&size=${size}`
    );
    return response.data;
  },

  likePost: async (postId: number, userId: number): Promise<void> => {
    await api.post(`/posts/${postId}/like?userId=${userId}`);
  },

  unlikePost: async (postId: number, userId: number): Promise<void> => {
    await api.post(`/posts/${postId}/unlike?userId=${userId}`);
  },

  getPostLikes: async (
    postId: number,
    page = 0,
    size = 10
  ): Promise<{
    content: User[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await api.get(
      `/posts/${postId}/likes?page=${page}&size=${size}`
    );
    return response.data;
  },

  addComment: async (
    postId: number,
    userId: number,
    commentData: { text: string; parentCommentId?: string }
  ): Promise<Comment> => {
    const response = await api.post<Comment>(
      `/posts/${postId}/comment?userId=${userId}`,
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
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await api.get(
      `/posts/${postId}/comments?currentUserId=${currentUserId}&page=${page}&size=${size}`
    );
    return response.data;
  },

  deletePost: async (postId: number, userId: number): Promise<void> => {
    await api.delete(`/posts/${postId}?userId=${userId}`);
  },

  getTimeline: async (
    userId: number,
    page = 0,
    size = 10
  ): Promise<{
    content: Post[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await api.get(
      `/posts/timeline?userId=${userId}&page=${page}&size=${size}`
    );
    return response.data;
  },

  getExploreFeed: async (
    userId: number,
    page = 0,
    size = 10
  ): Promise<{
    content: Post[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await api.get(
      `/posts/explore?userId=${userId}&page=${page}&size=${size}`
    );
    return response.data;
  },

  repostPost: async (postId: number, userId: number): Promise<void> => {
    await api.post(`/repost/post/${postId}?userId=${userId}`);
  },

  sharePost: async (postId: number, userId: number): Promise<void> => {
    await api.post(`/share/post/${postId}?userId=${userId}`);
  },
};
