import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import { Comment, User } from '../../types';

dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

dayjs.updateLocale('en', {
  relativeTime: {
    future: "in %s",
    past: "%s",
    s: 'a few secs',
    m: '1m',
    mm: '%dm',
    h: '1h',
    hh: '%dh',
    d: '1d',
    dd: '%dd',
    M: '1mo',
    MM: '%dmo',
    y: '1y',
    yy: '%dy'
  }
});

interface CommentCardProps {
  comment: Comment;
  onLike: (commentId: number, currentlyLiked: boolean) => void;
  onReply: (commentId: number, username: string) => void;
  onRepost: (commentId: number) => void;
  onShare: (commentId: number, commentText: string) => void;
}

export function CommentCard({ comment, onLike, onReply, onRepost, onShare }: CommentCardProps) {
  const [isLiked, setIsLiked] = useState<boolean>(comment.hasLiked);
  const [likeCount, setLikeCount] = useState<number>(comment.likeCount);

  const handleLike = () => {
    setIsLiked(prev => !prev);
    setLikeCount(prev => (isLiked ? prev - 1 : prev + 1));
    onLike(comment.id, isLiked);
  };

  const renderCommentTextWithHashtags = (text: string) => {
    const parts = text.split(/(\s#[a-zA-Z0-9_]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith(' #')) {
        return <Text key={index} className="text-blue-500 dark:text-blue-400 font-medium">{part.trim()}</Text>;
      }
      return <Text key={index} className="text-gray-900 dark:text-white">{part}</Text>;
    });
  };

  return (
    <View className="flex-row items-start py-3 px-4 border-b border-gray-200 dark:border-gray-800">
      <Image
        source={{ uri: comment.user.profilePicUrl || 'https://via.placeholder.com/40' }}
        className="w-8 h-8 rounded-full mr-3"
      />
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center">
            <Text className="text-gray-900 dark:text-white font-semibold text-sm">{comment.user.username}</Text>
            {comment.user.isVerified && (
              <View className="ml-1 h-3 w-3 rounded-full bg-blue-500 items-center justify-center">
                <Text className="text-white text-[8px]">✓</Text>
              </View>
            )}
            <Text className="text-gray-500 dark:text-gray-400 text-xs ml-2">• {dayjs(comment.createdAt).fromNow(true)}</Text>
          </View>
        </View>
        <Text className="text-gray-900 dark:text-white text-sm mb-2">
          {renderCommentTextWithHashtags(comment.text)}
        </Text>

        <View className="flex-row items-center gap-6">
          <TouchableOpacity
            onPress={handleLike}
            className="flex-row items-center gap-1"
            accessibilityRole="button"
            accessibilityLabel={isLiked ? "Unlike comment" : "Like comment"}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={16}
              color={isLiked ? "#ef4444" : "#6b7280"}
            />
            <Text className="text-gray-600 dark:text-gray-400 text-xs">{likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onReply(comment.id, comment.user.username)}
            className="flex-row items-center gap-1"
            accessibilityRole="button"
            accessibilityLabel="Reply to comment"
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#6b7280" />
            <Text className="text-gray-600 dark:text-gray-400 text-xs">{comment.replyCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onRepost(comment.id)}
            className="flex-row items-center gap-1"
            accessibilityRole="button"
            accessibilityLabel="Repost comment"
            activeOpacity={0.7}
          >
            <Ionicons name="repeat-outline" size={16} color="#6b7280" />
            {comment.repostCount > 0 && <Text className="text-gray-600 dark:text-gray-400 text-xs">{comment.repostCount}</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onShare(comment.id, comment.text)}
            className="flex-row items-center gap-1"
            accessibilityRole="button"
            accessibilityLabel="Share comment"
            activeOpacity={0.7}
          >
            <Ionicons name="paper-plane-outline" size={16} color="#6b7280" />
            {comment.shareCount > 0 && <Text className="text-gray-600 dark:text-gray-400 text-xs">{comment.shareCount}</Text>}
          </TouchableOpacity>
        </View>

        {comment.replies && comment.replies.length > 0 && (
          <View className="ml-6 mt-3">
            {comment.replies.map(reply => (
              <CommentCard
                key={reply.id}
                comment={reply}
                onLike={onLike}
                onReply={onReply}
                onRepost={onRepost}
                onShare={onShare}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}