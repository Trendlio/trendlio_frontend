import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator, Text, TouchableOpacity, ViewToken } from 'react-native';
import { PostCard } from '@/components/cards/PostCard';
import { Post } from '@/types';
import { usePost } from '@/context/PostContext';
import { useFocusEffect } from '@react-navigation/native';
import { usePathname, router } from 'expo-router';
import { useMediaPlayback } from '@/context/MediaPlaybackContext';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
  const { posts, setVisiblePostId, fetchPosts } = usePost();
  const flatListRef = useRef<FlatList>(null);
  const pathname = usePathname();
  const { setActiveScreen, setIsPlaybackAllowed } = useMediaPlayback();

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const currentPost = viewableItems[0].item as Post;
      setVisiblePostId(currentPost.id.toString());
    } else {
      setVisiblePostId(null);
    }
  }).current;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await fetchPosts(activeTab);
    } catch (error) {
      console.error('Error refreshing posts:', error);
      setError('Failed to refresh posts. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, fetchPosts]);

  // Fetch posts when the screen mounts or when the active tab changes
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchPosts(activeTab);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError('Failed to load posts. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, [activeTab, fetchPosts]);

  useEffect(() => {
    return () => {
      setIsPlaybackAllowed(false);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      setActiveScreen(pathname);
      setIsPlaybackAllowed(true);
      return () => {
        setActiveScreen(null);
        setIsPlaybackAllowed(false);
      };
    }, [pathname])
  );

  const renderItem = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      navigationType="comments"
      showInteractions={true}
    />
  );

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-white dark:bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white dark:bg-black justify-center items-center p-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-blue-500 px-4 py-2 rounded-lg"
          onPress={() => fetchPosts(activeTab)}
        >
          <Text className="text-white font-bold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <View className="flex-row justify-around py-2 border-b border-gray-200 dark:border-gray-800 mb-4">
        <TouchableOpacity
          className={`px-5 py-2 rounded-full ${activeTab === 'forYou' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
          onPress={() => setActiveTab('forYou')}
        >
          <Text className={`font-bold ${activeTab === 'forYou' ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
            For you
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`px-5 py-2 rounded-full ${activeTab === 'following' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
          onPress={() => setActiveTab('following')}
        >
          <Text className={`font-bold ${activeTab === 'following' ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
            Following
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#000']}
            tintColor="#000"
          />
        }
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        onEndReached={() => {
          // Load more posts here
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center py-8">
            <Text className="text-gray-500 dark:text-gray-400 text-center">
              No posts to show. Pull down to refresh.
            </Text>
          </View>
        )}
        ListFooterComponent={() => (
          <View className="py-4">
            <ActivityIndicator size="small" color="#000" />
          </View>
        )}
      />
    </View>
  );
}