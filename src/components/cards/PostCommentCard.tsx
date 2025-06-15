import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ViewabilityConfig, ViewToken, Dimensions, FlatList, ScrollView } from 'react-native';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import { Post, User, Media } from "../../types/index";
import { usePathname, useRouter } from 'expo-router';
import { MediaPlayer } from '../media/MediaPlayer';
import { usePost } from '@/context/PostContext';

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

interface PostCardProps {
  post: Post;
  onLike: (postId: number, currentlyLiked: boolean) => void;
  onComment: (postId: number) => void;
  onRepost: (postId: number) => void;
  onShare: (postId: number, postCaption: string | null | undefined, mediaUrl: string | undefined) => void;
  isVisible: boolean;
  navigationType?: 'comments' | 'createComment';
  showInteractions?: boolean;
}

export function PostCommentCard({ post, onLike, onComment, onRepost, onShare, isVisible, navigationType = 'comments', showInteractions = true }: PostCardProps) {
  const [isLiked, setIsLiked] = useState<boolean>(post.hasLiked);
  const [likeCount, setLikeCount] = useState<number>(post.likeCount);
  const [isMuted, setIsMuted] = useState(true);
  const [videoDurations, setVideoDurations] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef<Record<number, Video | null>>({});
  const carouselRef = useRef<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { visiblePostId, setVisiblePostId } = usePost();

  const handleLike = () => {
    setIsLiked(prev => !prev);
    setLikeCount(prev => (isLiked ? prev - 1 : prev + 1));
    onLike(post.id, isLiked);
  };

  const handleComment = (postId: number) => {
    console.log('Navigation type:', navigationType);

    if (navigationType === 'comments') {
      console.log('Navigating to comments screen');
      router.push({
        pathname: '/(protected)/(comments)/comments',
        params: { postId: postId }
      });
    } else {
      console.log('Navigating to create comment screen');
      router.push({
        pathname: '/(protected)/(comments)/createcomment',
        params: { postId: postId }
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const formatDuration = (durationMs: number): string => {
    const durationSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVideoLoad = (mediaId: number, status: AVPlaybackStatus) => {
    if (status.isLoaded && status.durationMillis !== undefined) {
      const duration = Number(status.durationMillis);
      if (!isNaN(duration)) {
        setVideoDurations(prev => {
          const newDurations = { ...prev };
          newDurations[mediaId] = duration;
          return newDurations;
        });
      }
    }
  };

  // Use effect to manage video playback when currentIndex or isVisible changes
  useEffect(() => {
    if (!post.media || post.media.length === 0) return;

    const currentMedia = post.media[currentIndex];
    if (!currentMedia) return;

    // Only play video if the post is visible and the current media is a video
    const isCurrentVideo = currentMedia.mediaType === 2;
    const shouldPlay = isVisible && isCurrentVideo;

    Object.entries(videoRefs.current).forEach(([mediaIdStr, videoRef]) => {
      const mediaId = Number(mediaIdStr);
      if (!videoRef) return;

      if (shouldPlay && mediaId === currentMedia.id) {
        videoRef.playAsync().catch(err => console.error('Error playing video:', err));
      } else {
        videoRef.pauseAsync().catch(err => console.error('Error pausing video:', err));
      }
    });
  }, [currentIndex, post.media, isVisible]);

  // Set this post as visible when it comes into view
  useEffect(() => {
    if (isVisible) {
      setVisiblePostId(post.id.toString());
    }
    return () => {
      if (isVisible) {
        setVisiblePostId(null);
      }
    };
  }, [post.id, isVisible, setVisiblePostId]);

  const renderMedia = (media: Media) => {
    return (
      <MediaPlayer
        media={media}
        postId={post.id.toString()}
        isMultipleItems={post.media.length > 1}
        currentIndex={currentIndex}
        totalItems={post.media.length}
      />
    );
  };

  const renderCaptionWithHashtags = (caption: string) => {
    const parts = caption.split(/(\s#[a-zA-Z0-9_]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith(' #')) {
        return <Text key={index} className="text-blue-500 dark:text-blue-400 font-medium">{part.trim()}</Text>;
      }
      return <Text key={index} className="text-gray-900 dark:text-white">{part}</Text>;
    });
  };

  return (
    <Card
      className="w-full max-w-md mx-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none"
    >
      {/* <CardHeader className="px-4 pt-4 pb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.user.profilePicUrl || undefined} alt={post.user.username} />
                <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                  {post.user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <TouchableOpacity
                onPress={() => console.log('Follow user:', post.user.username)}
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-blue-500 items-center justify-center border-2 border-white dark:border-black"
              >
                <Ionicons name="add" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-gray-900 dark:text-white font-semibold text-sm">{post.user.username}</Text>
              {post.user.isVerified && (
                <View className="h-4 w-4 rounded-full bg-blue-500 items-center justify-center">
                  <Text className="text-white text-[10px]">✓</Text>
                </View>
              )}
              <Text className="text-gray-500 dark:text-gray-400 text-sm">• {dayjs(post.takenAt).fromNow(true)}</Text>
            </View>
          </View>
        </View>

        {post.caption && (
          <View className="mt-3">
            <Text className="text-gray-900 dark:text-white text-sm leading-5">
              {renderCaptionWithHashtags(post.caption)}
            </Text>
          </View>
        )}
      </CardHeader> */}
      <View className="flex-row items-start mb-4 px-4 pt-4 gap-1">
        {/* Profile Picture + Follow Button */}
        <View className="mr-3 relative">
          <Image
            source={{ uri: post.user.profilePicUrl || 'https://via.placeholder.com/40' }}
            className="w-10 h-10 rounded-full"
          />
          <TouchableOpacity
            onPress={() => console.log('Follow user:', post.user.username)}
            className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-blue-500 items-center justify-center border-2 border-white dark:border-black"
          >
            <Ionicons name="add" size={12} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Username, Verified Badge, Timestamp, and Caption */}
        <View className="flex-1 flex-col space-y-2">
          {/* Username + Verified + Timestamp */}
          <View className="flex-row items-center space-x-2">
            <Text className="text-gray-900 font-semibold text-lg">{post.user.username}</Text>
            {post.user.isVerified && (
              <View className="h-4 w-4 rounded-full bg-blue-500 items-center justify-center">
                <Text className="text-white text-[10px]">✓</Text>
              </View>
            )}
            <Text className="text-gray-400 text-md">{" "} {dayjs(post.takenAt).fromNow(true)}</Text>
          </View>
        </View>

      </View>
      {/* Caption */}
      <View className="flex-1 flex-row mx-5">
        {post.caption && (
          <Text className="text-gray-900 text-lg">
            {renderCaptionWithHashtags(post.caption)}
          </Text>
        )}
      </View>

      <CardContent className="px-0 py-0 mx-2">
        {post.media && post.media.length > 0 && (
          <View className="relative">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
            >
              {post.media.map((media, index) => (
                <View key={media.id} className="relative">
                  {renderMedia(media)}
                  {post.media.length > 1 && (
                    <View className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded">
                      <Text className="text-white text-xs">
                        {index + 1}/{post.media.length}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </CardContent>

      <CardFooter className="px-4 py-3 mx-2 my-2">
        <View className="flex-row items-center justify-between w-full ">
          <View className="flex-row items-center gap-8">
            <TouchableOpacity
              onPress={handleLike}
              className="flex-row items-center gap-2"
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={20}
                color={isLiked ? "#ef4444" : "#6b7280"}
                className="dark:text-gray-400"
              />
              <Text className="text-gray-600 dark:text-gray-400 text-sm">{likeCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleComment(post.id)}
              className="flex-row items-center gap-2"
            >
              <Ionicons name="chatbubble-outline" size={20} color="#6b7280" className="dark:text-gray-400" />
              {post.commentCount > 0 && (
                <Text className="text-gray-600 dark:text-gray-400 text-sm">{post.commentCount}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onRepost(post.id)}
              className="flex-row items-center gap-2"
            >
              <Ionicons name="repeat-outline" size={20} color="#6b7280" className="dark:text-gray-400" />
              {post.repostCount > 0 && (
                <Text className="text-gray-600 dark:text-gray-400 text-sm">{post.repostCount}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onShare(post.id, post.caption, post.media[0]?.url)}
              className="flex-row items-center gap-2"
            >
              <Ionicons name="paper-plane-outline" size={20} color="#6b7280" className="dark:text-gray-400" />
              {post.shareCount > 0 && (
                <Text className="text-gray-600 dark:text-gray-400 text-sm">{post.shareCount}</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="h-8 w-8 items-center justify-center">
            <Ionicons name="ellipsis-horizontal" size={20} color="#6b7280" className="dark:text-gray-400" />
          </TouchableOpacity>
        </View>
      </CardFooter>
    </Card>
  );
}