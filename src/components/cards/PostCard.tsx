import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ViewabilityConfig, ViewToken, Dimensions, FlatList, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import { Post, User, Media } from "../../types/index";
import { useRouter, usePathname } from 'expo-router';
import { usePost } from '@/context/PostContext';
import { useMediaPlayback } from '@/context/MediaPlaybackContext';
import { useFocusEffect } from '@react-navigation/native';

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
  navigationType?: 'comments' | 'createComment';
  showInteractions?: boolean;
  onLike?: (postId: number, currentlyLiked: boolean) => Promise<void>;
  onComment?: (postId: number) => void;
  onRepost?: (postId: number) => Promise<void>;
  onShare?: (postId: number, postCaption: string | null | undefined, mediaUrl: string | undefined) => Promise<void>;
  isVisible?: boolean;
  onCarouselItemChanged?: (postId: number, mediaId: number, isVisible: boolean) => void;
}

export function PostCard({ post, navigationType = 'comments', showInteractions = true, isVisible = false, onCarouselItemChanged, onLike, onComment, onRepost, onShare }: PostCardProps) {
  const [isLiked, setIsLiked] = useState<boolean>(post.hasLiked);
  const [likeCount, setLikeCount] = useState<number>(post.likeCount);
  const [isMuted, setIsMuted] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<Video | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { visiblePostId, activeScreen, setVisiblePostId, handleLike: contextHandleLike, handleComment: contextHandleComment, handleRepost: contextHandleRepost, handleShare: contextHandleShare } = usePost();
  const { isPlaybackAllowed, pauseAllVideos } = useMediaPlayback();

  const handleLikePress = async () => {
    if (!post) return;
    setIsLiked(prev => !prev);
    setLikeCount(prev => (isLiked ? prev - 1 : prev + 1));
    if (onLike) {
      await onLike(post.id, isLiked);
    } else {
      await contextHandleLike(post.id.toString(), isLiked);
    }
  };

  const handleCommentPress = () => {
    if (!post) return;
    if (videoRef.current) {
      videoRef.current.pauseAsync().catch(console.error);
    }
    pauseAllVideos();
    if (onComment) {
      onComment(post.id);
    } else {
      if (navigationType === 'comments') {
        router.push({
          pathname: '/(protected)/(comments)/comments',
          params: { postId: post.id.toString() }
        });
      } else {
        router.push({
          pathname: '/(protected)/(comments)/createcomment',
          params: { postId: post.id.toString() }
        });
      }
    }
  };

  const handleRepostPress = async () => {
    if (!post) return;
    if (onRepost) {
      await onRepost(post.id);
    } else {
      await contextHandleRepost(post.id.toString());
    }
  };

  const handleSharePress = async () => {
    if (!post) return;
    if (onShare) {
      await onShare(post.id, post.caption, post.media?.[0]?.url);
    } else {
      await contextHandleShare(post.id.toString(), post.caption ?? '', post.media?.[0]?.url);
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pauseAsync();
        videoRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current || !post || !post.media?.[currentIndex]) return;

    const isCurrentScreen = activeScreen === pathname;
    const shouldPlay = visiblePostId === (post?.id?.toString() ?? null) && isCurrentScreen && isPlaybackAllowed;

    if (shouldPlay) {
      videoRef.current.playAsync().catch(console.error);
    } else {
      videoRef.current.pauseAsync().catch(console.error);
    }
  }, [visiblePostId, post?.id, currentIndex, activeScreen, pathname, isPlaybackAllowed, post]);

  useEffect(() => {
    if (post) {
      setVisiblePostId(post.id.toString());
    }
    return () => {
      setVisiblePostId(null);
      if (videoRef.current) {
        videoRef.current.pauseAsync().catch(err => console.error('Error pausing video on cleanup:', err));
      }
    };
  }, [post?.id, setVisiblePostId, post]);

  const handleCarouselScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / Dimensions.get('window').width);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      if (onCarouselItemChanged && post && post.media?.[newIndex]) {
        onCarouselItemChanged(post.id, post.media[newIndex].id, true);
      }
    }
  };

  const renderMedia = (media: Media) => {
    if (!media) return null;
    if (media.mediaType === 2) { // Video
      const mediaStyle = (post?.media?.length ?? 0) > 1
        ? {
          width: 170,
          height: Math.round(170 * (687 / 523)),
        }
        : {
          width: 300,
          height: media.width && media.height
            ? Math.min(media.height * (300 / media.width), 400)
            : 400,
          maxWidth: 300,
          maxHeight: 400,
          marginLeft: (post?.media?.length ?? 0) > 1 ? 0 : -34,
        };

      return (
        <View className="relative items-center justify-center rounded-xl overflow-hidden">
          <Video
            ref={videoRef}
            source={{ uri: media.url }}
            className="rounded-xl"
            style={mediaStyle}
            resizeMode={post.media.length > 1 ? ResizeMode.COVER : ResizeMode.CONTAIN}
            isLooping
            shouldPlay={visiblePostId === post?.id?.toString()}
            isMuted={isMuted}
            useNativeControls={false}
          />
          <TouchableOpacity
            onPress={toggleMute}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 items-center justify-center z-10"
          >
            <Ionicons
              name={isMuted ? "volume-mute" : "volume-high"}
              size={16}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      );
    }

    // Image
    const mediaStyle = post.media.length > 1
      ? {
        width: 150,
        height: Math.round(150 * (687 / 523)),
      }
      : {
        width: 300,
        height: media.width && media.height
          ? Math.min(media.height * (300 / media.width), 400)
          : 400,
        maxWidth: 300,
        maxHeight: 400,
      };

    return (
      <View className="relative items-center justify-center rounded-xl overflow-hidden">
        <Image
          source={{ uri: media.url }}
          className="rounded-xl"
          style={mediaStyle}
          resizeMode={post.media.length > 1 ? "cover" : "contain"}
          alt="Post media"
        />
      </View>
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
        <View className="flex-1 flex-col -mt-1">
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

          {/* Caption */}
          {post.caption && (
            <Text className="text-gray-900 text-lg">
              {renderCaptionWithHashtags(post.caption)}
            </Text>
          )}
        </View>
      </View>

      <CardContent className="px-0 py-0 ml-14">
        {post.media && post.media.length > 0 && (
          <View className="relative">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
              onMomentumScrollEnd={(event) => {
                const newIndex = Math.round(event.nativeEvent.contentOffset.x / (event.nativeEvent.layoutMeasurement.width + 8));
                setCurrentIndex(newIndex);
              }}
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

      <CardFooter className="px-4 py-3 ml-14 my-2">
        {showInteractions ? (
          <View className="flex-row items-center justify-between w-full ">
            <View className="flex-row items-center gap-8">
              <TouchableOpacity
                onPress={handleLikePress}
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
                onPress={handleCommentPress}
                className="flex-row items-center gap-2"
              >
                <Ionicons name="chatbubble-outline" size={20} color="#6b7280" className="dark:text-gray-400" />
                {post.commentCount > 0 && (
                  <Text className="text-gray-600 dark:text-gray-400 text-sm">{post.commentCount}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRepostPress}
                className="flex-row items-center gap-2"
              >
                <Ionicons name="repeat-outline" size={20} color="#6b7280" className="dark:text-gray-400" />
                {post.repostCount > 0 && (
                  <Text className="text-gray-600 dark:text-gray-400 text-sm">{post.repostCount}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSharePress}
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
        ) : null}
      </CardFooter>
    </Card>
  );
}