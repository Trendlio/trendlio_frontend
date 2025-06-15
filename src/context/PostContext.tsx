import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Post } from '@/types';
import { PostAPI } from '@/api/post';
import { CommentAPI } from '@/api/comment';
import { useAuth } from './AuthContext';
import { Share } from 'react-native';

interface PostContextType {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  visiblePostId: string | null;
  setVisiblePostId: (id: string | null) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  handleLike: (postId: string, isLiked: boolean) => Promise<void>;
  handleComment: (postId: string) => void;
  handleRepost: (postId: string) => Promise<void>;
  handleShare: (postId: string, caption: string, mediaUrl?: string) => Promise<void>;
  cleanup: () => void;
  fetchPosts: (type: 'forYou' | 'following') => Promise<void>;
  activeScreen: string | null;
  setActiveScreen: (screen: string | null) => void;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export function PostProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [visiblePostId, setVisiblePostId] = useState<string | null>(null);
  const [activeScreen, setActiveScreen] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch posts based on type (forYou or following)
  const fetchPosts = useCallback(async (type: 'forYou' | 'following') => {
    if (!user?.id) return;

    try {
      const response = type === 'forYou'
        ? await PostAPI.getTimeline(user.id)
        : await PostAPI.getExploreFeed(user.id);
      setPosts(response.content);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }, [user?.id]);

  // Update a specific post in the posts array
  const updatePost = useCallback((postId: string, updates: Partial<Post>) => {
    setPosts(currentPosts =>
      currentPosts.map(post =>
        post.id.toString() === postId
          ? { ...post, ...updates }
          : post
      )
    );
  }, []);

  // Handle post like/unlike
  const handleLike = useCallback(async (postId: string, isLiked: boolean) => {
    if (!user?.id) return;

    try {
      if (isLiked) {
        await PostAPI.unlikePost(postId, user.id.toString());
      } else {
        await PostAPI.likePost(postId, user.id.toString());
      }
      updatePost(postId, {
        hasLiked: !isLiked,
        likeCount: (posts.find(p => p.id.toString() === postId)?.likeCount || 0) + (isLiked ? -1 : 1)
      });
    } catch (error) {
      console.error('Error handling like:', error);
    }
  }, [user?.id, posts, updatePost]);

  // Handle comment navigation
  const handleComment = useCallback((postId: string) => {
    // This is handled by navigation
  }, []);

  // Handle repost
  const handleRepost = useCallback(async (postId: string) => {
    if (!user?.id) return;

    try {
      await PostAPI.repostPost(postId, user.id.toString());
      updatePost(postId, {
        repostCount: (posts.find(p => p.id.toString() === postId)?.repostCount || 0) + 1
      });
    } catch (error) {
      console.error('Error handling repost:', error);
    }
  }, [user?.id, posts, updatePost]);

  // Handle share
  const handleShare = useCallback(async (postId: string, caption: string, mediaUrl?: string) => {
    if (!user?.id) return;

    try {
      const shareMessage = [
        caption,
        mediaUrl ? "Shared with media" : "",
        "Shared from Trendlio"
      ].filter(Boolean).join("\n\n");

      await Share.share({
        message: shareMessage,
        title: "Trendlio Post"
      });

      await PostAPI.sharePost(postId, user.id.toString());
      updatePost(postId, {
        shareCount: (posts.find(p => p.id.toString() === postId)?.shareCount || 0) + 1
      });
    } catch (error) {
      console.error('Error handling share:', error);
    }
  }, [user?.id, posts, updatePost]);

  // Refresh a specific post
  const refreshPost = useCallback(async (postId: string) => {
    if (!user?.id) return;

    try {
      const updatedPost = await PostAPI.getPost(postId, user.id);
      updatePost(postId, updatedPost);
    } catch (error) {
      console.error('Error refreshing post:', error);
    }
  }, [user?.id, updatePost]);

  // Effect to stop media playback when visible post changes
  useEffect(() => {
    // This effect will be used by components to handle media playback
    console.log('Visible post changed to:', visiblePostId);
  }, [visiblePostId]);

  // Initial fetch when PostProvider mounts
  useEffect(() => {
    if (user?.id) {
      fetchPosts('forYou');
    }
  }, [user?.id, fetchPosts]);

  const cleanup = useCallback(() => {
    // Only clear the visiblePostId to stop video playback
    setVisiblePostId(null);
  }, []);

  const value: PostContextType = {
    posts,
    setPosts,
    visiblePostId,
    setVisiblePostId,
    updatePost,
    handleLike,
    handleComment,
    handleRepost,
    handleShare,
    cleanup,
    fetchPosts,
    activeScreen,
    setActiveScreen,
  };

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
}

export function usePost() {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return context;
}