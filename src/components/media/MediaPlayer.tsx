import React, { useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Media } from '../../types';
import { useMediaPlayback } from '@/context/MediaPlaybackContext';

interface MediaPlayerProps {
  media: Media;
  postId: number;
  isMultipleItems?: boolean;
  currentIndex?: number;
  totalItems?: number;
}

export function MediaPlayer({ media, postId, isMultipleItems = false, currentIndex, totalItems }: MediaPlayerProps) {
  const videoRef = useRef<Video | null>(null);
  const [isMuted, setIsMuted] = React.useState(true);
  const [videoDuration, setVideoDuration] = React.useState<number | null>(null);
  const { registerVideoRef, unregisterVideoRef, activePostId, activeMediaId } = useMediaPlayback();

  // Force play video when mounted
  useEffect(() => {
    if (media.mediaType !== 2) return;

    const playVideo = async () => {
      try {
        if (videoRef.current) {
          await videoRef.current.playAsync();
        }
      } catch (error) {
        console.error('Error playing video:', error);
      }
    };

    // Register video and play immediately
    registerVideoRef(postId, media.id, videoRef.current);
    playVideo();

    return () => {
      if (media.mediaType === 2) {
        unregisterVideoRef(postId, media.id);
      }
    };
  }, [media.mediaType, media.id, postId]);

  const toggleMute = () => setIsMuted(prev => !prev);

  const formatDuration = (durationMs: number): string => {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = ((durationMs % 60000) / 1000).toFixed(0).padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleVideoLoad = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.durationMillis) {
      setVideoDuration(status.durationMillis);
      // Play video when it loads
      videoRef.current?.playAsync().catch(() => { });
    }
  };

  // Video rendering
  if (media.mediaType === 2) {
    const mediaStyle = isMultipleItems
      ? { width: 170, height: Math.round(170 * (687 / 523)) }
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
        <Video
          ref={videoRef}
          source={{ uri: media.url }}
          className="rounded-xl"
          style={mediaStyle}
          resizeMode={isMultipleItems ? ResizeMode.COVER : ResizeMode.CONTAIN}
          isLooping
          shouldPlay={true}
          isMuted={isMuted}
          useNativeControls={false}
          onLoad={handleVideoLoad}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded && !status.isPlaying) {
              videoRef.current?.playAsync().catch(() => { });
            }
          }}
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
        {videoDuration && (
          <View className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded z-10">
            <Text className="text-white text-xs">
              {formatDuration(videoDuration)}
            </Text>
          </View>
        )}
        {isMultipleItems && currentIndex !== undefined && totalItems && (
          <View className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded">
            <Text className="text-white text-xs">
              {currentIndex + 1}/{totalItems}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Image rendering
  const mediaStyle = isMultipleItems
    ? { width: 150, height: Math.round(150 * (687 / 523)) }
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
        resizeMode={isMultipleItems ? "cover" : "contain"}
        alt="Post media"
      />
    </View>
  );
}