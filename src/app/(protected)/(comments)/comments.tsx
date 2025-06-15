import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard, FlatList, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Post, Comment } from '../../../types';
import { PostCard } from '../../../components/cards/PostCard';
import { CommentCard } from '../../../components/cards/CommentCard';
import { PostAPI } from '../../../api/post';
import { CommentAPI } from '../../../api/comment';
import { useAuth } from '../../../context/AuthContext';
import { toast, useToast } from '../../../components/ui/use-toast';
import { PostCommentCard } from '../../../components/cards/PostCommentCard';
import { usePost } from '@/context/PostContext';
import { useFocusEffect } from '@react-navigation/native';

export default function CommentsScreen() {
  const { postId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<{ commentId: number | null; username: string | null }>({ commentId: null, username: null });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPostAndComments = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('User ID is required');
      }

      const fetchedPost = await PostAPI.getPost(id, user.id);
      setPost(fetchedPost);

      const fetchedComments = await CommentAPI.getPostComments(id, user?.id);
      setComments(fetchedComments.content);

    } catch (err: any) {
      console.error('Error fetching post and comments:', err);
      setError(err.message || 'Failed to fetch post and comments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchPostAndComments(Number(postId));
    }
  }, [postId, user?.id]);

  const handleBack = () => {
    router.back();
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup when screen loses focus
      };
    }, [])
  );

  const handleLikePost = async (postId: number, currentlyLiked: boolean) => {
    try {
      if (!user?.id) {
        throw new Error('User ID is required');
      }
      if (currentlyLiked) {
        await PostAPI.unlikePost(postId, user.id);
      } else {
        await PostAPI.likePost(postId, user.id);
      }
    } catch (err) {
      console.error('Error toggling like status:', err);
    }
    console.log(`Post ${postId} liked: ${!currentlyLiked}`);
  };

  const handleCommentPost = (postId: number) => {
    console.log('Attempting to navigate to createcomment with postId:', postId);
    Keyboard.dismiss();
    const path = `/createcomment?postId=${postId}`;
    console.log('Navigation path:', path);

    try {
      router.push(path);
      console.log('Navigation initiated');
    } catch (error) {
      console.error('Navigation failed:', error);
    }
  };

  const handleRepostPost = async (postId: number) => {
    console.log(`Post ${postId} reposted`);
    try {
      if (!user?.id) {
        throw new Error('User ID is required');
      }
      await PostAPI.repostPost(postId, user?.id);
    } catch (err) {
      console.error('Error reposting:', err);
    }
  };

  const handleSharePost = async (postId: number, postCaption: string | null | undefined, mediaUrl: string | undefined) => {
    console.log(`Post ${postId} shared: ${postCaption}, ${mediaUrl}`);
    try {
      if (!user?.id) {
        throw new Error('User ID is required');
      }
      await PostAPI.sharePost(postId, user?.id);

      // Create a more descriptive share message
      const shareMessage = [
        postCaption,
        mediaUrl ? 'Check out this media! ' + mediaUrl : '',
        'Shared from Trendlio'
      ].filter(Boolean).join('\n');

      // Use React Native Share API
      const shareOptions = {
        title: 'Trendlio Post',
        message: shareMessage,
        url: mediaUrl, // Optional URL to share
      };

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (err) {
      console.error('Error sharing post:', err);
      Alert.alert(
        'Share Error',
        'Failed to share the post. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLikeComment = async (commentId: number, currentlyLiked: boolean) => {
    try {
      if (!user?.id) {
        throw new Error('User ID is required');
      }
      if (currentlyLiked) {

        await CommentAPI.unlikeComment(commentId, user?.id);
      } else {
        await CommentAPI.likeComment(commentId, user?.id);
      }

      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId
            ? {
              ...comment,
              hasLiked: !currentlyLiked,
              likeCount: currentlyLiked ? comment.likeCount - 1 : comment.likeCount + 1
            }
            : comment
        )
      );
    } catch (error) {
      console.error('Error handling comment like/unlike:', error);
      toast({
        message: "Failed to update like status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReplyComment = (commentId: number, username: string) => {
    setReplyingTo({ commentId, username });
    setNewCommentText(`@${username} `);
  };

  const handleRepostComment = (commentId: number) => {
    console.log(`Comment ${commentId} reposted`);
    // Call your actual API here if needed for comment repost
    // await CommentAPI.repostComment(commentId, user?.id?. || ''); // Assuming repostComment exists in CommentAPI
  };

  const handleShareComment = (commentId: number, commentText: string) => {
    console.log(`Comment ${commentId} shared: ${commentText}`);
    // Call your actual API here if needed for comment share
    // await CommentAPI.shareComment(commentId, user?.id?. || ''); // Assuming shareComment exists in CommentAPI
  };

  const handleSubmitComment = async () => {
    if (newCommentText.trim() === '') return;

    try {
      if (!user?.id) {
        throw new Error('User ID is required');
      }
      const parentCommentId = replyingTo.commentId ? replyingTo.commentId : undefined;
      const newComment = await CommentAPI.createComment(
        Number(postId),
        user?.id,
        { text: newCommentText, parentCommentId: parentCommentId }
      );

      if (replyingTo.commentId) {
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === replyingTo.commentId
              ? { ...comment, replies: [...(comment.replies || []), newComment] }
              : comment
          )
        );
      } else {
        setComments(prevComments => [...prevComments, newComment]);
      }

      setNewCommentText('');
      setReplyingTo({ commentId: null, username: null });
      console.log('New comment submitted!');
    } catch (error) {
      console.error('Error submitting comment:', error);
      setError('Failed to submit comment.');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <Text className="text-red-500">Error: {error}</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <Text className="text-gray-500">Post not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white dark:bg-black"
    >
      <View className="flex-row items-center p-4 border-b border-gray-200 dark:border-gray-800">
        <TouchableOpacity onPress={handleBack} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#fff" className="dark:text-white" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 dark:text-white">Thread</Text>
      </View>

      <FlatList
        data={comments}
        renderItem={({ item: comment }) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            onLike={handleLikeComment}
            onReply={handleReplyComment}
            onRepost={handleRepostComment}
            onShare={handleShareComment}
          />
        )}
        keyExtractor={(comment) => comment.id.toString()}
        ListHeaderComponent={
          <PostCard
            post={post}
            onLike={handleLikePost}
            onComment={handleCommentPost}
            onRepost={handleRepostPost}
            onShare={handleSharePost}
            navigationType="createComment"
          />
        }
        ListEmptyComponent={
          <Text className="text-gray-500 dark:text-gray-400 text-center mt-4">No comments yet.</Text>
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
        initialNumToRender={5}
        keyboardShouldPersistTaps="handled"
      />

      <View className="border-t border-gray-200 dark:border-gray-800 p-4">
        {replyingTo.username && (
          <View className="flex-row items-center mb-2">
            <Text className="text-gray-600 dark:text-gray-400 text-sm">Replying to {replyingTo.username}</Text>
            <TouchableOpacity onPress={() => setReplyingTo({ commentId: null, username: null })} className="ml-2">
              <Ionicons name="close-circle" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
        )}
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-4 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800"
            placeholder={replyingTo.username ? `Add a reply to ${replyingTo.username}...` : "Add a comment..."}
            placeholderTextColor="#9ca3af"
            value={newCommentText}
            onChangeText={setNewCommentText}
            multiline
          />
          <TouchableOpacity
            onPress={handleSubmitComment}
            className="ml-3 bg-blue-500 rounded-full h-10 w-10 items-center justify-center"
            disabled={newCommentText.trim() === ''}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}