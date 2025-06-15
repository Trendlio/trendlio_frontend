import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Placeholder for a video player component
interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, thumbnailUrl }) => {
  return (
    <View className="w-full h-52 bg-gray-900 justify-center items-center rounded-lg my-2">
      <Text className="text-white">Video Player Placeholder</Text>
      <Text className="text-gray-400 text-xs mt-1">{videoUrl}</Text>
    </View>
  );
};

export default VideoPlayer; 