import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { User, Post } from '@/types/index';
import { SearchAPI } from '@/api/search';
import { PostCard } from '@/components/cards/PostCard';
import { useAuth } from '@/context/AuthContext';
import { usePost } from '@/context/PostContext';

const UserCard = ({ user }: { user: User }) => {
  if (!user) return null;

  const formatFollowerCount = (count: number | undefined) => {
    const safeCount = count ?? 0;
    if (safeCount >= 1000000) {
      return (safeCount / 1000000).toFixed(1) + 'M followers';
    } else if (safeCount >= 1000) {
      return (safeCount / 1000).toFixed(1) + 'K followers';
    }
    return safeCount + ' followers';
  };

  return (
    <View className="flex-row items-center justify-between py-3 px-4 border-b border-gray-800">
      <View className="flex-row items-center">
        <Image
          source={{ uri: user.profilePicUrl ?? 'https://via.placeholder.com/50' }}
          className="w-12 h-12 rounded-full mr-3"
        />
        <View>
          <View className="flex-row items-center">
            <Text className="text-white font-bold text-base">{user.username ?? 'Unknown User'}</Text>
            {user.verifiedAccount && (
              <Ionicons name="checkmark-circle" size={16} color="#3182CE" className="ml-1" />
            )}
          </View>
          <Text className="text-gray-400 text-sm">{user.fullName ?? user.username ?? 'No Name'}</Text>
          <Text className="text-gray-400 text-sm">{formatFollowerCount(user.followerCount)}</Text>
        </View>
      </View>
      <TouchableOpacity
        className={`py-2 px-4 rounded-lg ${user.isFollowing ? 'bg-gray-700' : 'bg-white'}`}
        onPress={() => { /* Implement follow/unfollow logic */ }}
      >
        <Text className={`font-bold ${user.isFollowing ? 'text-white' : 'text-black'}`}>
          {user.isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function SearchResultsScreen() {
  const navigation = useNavigation();
  const { query } = useLocalSearchParams();
  const [searchText, setSearchText] = useState(query as string ?? '');
  const [searchResults, setSearchResults] = useState<(User | Post)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const { handleLike, handleComment, handleRepost, handleShare } = usePost();

  const fetchSearchResults = async (searchQuery: string) => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [usersResponse, postsResponse] = await Promise.all([
        SearchAPI.searchUsers(searchQuery),
        SearchAPI.searchPosts(searchQuery, currentUser?.id ?? 0),
      ]);

      const combinedResults: (User | Post)[] = [];
      if (usersResponse?.content) {
        combinedResults.push(...usersResponse.content);
      }
      if (postsResponse?.content) {
        combinedResults.push(...postsResponse.content);
      }

      setSearchResults(combinedResults);
    } catch (err) {
      console.error("Error fetching search results:", err);
      setError("Failed to fetch search results.");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      fetchSearchResults(query as string);
    }
  }, [query, currentUser?.id]);

  const handleSearchInputChange = (text: string) => {
    setSearchText(text);
    if (text.length > 0) {
      fetchSearchResults(text);
    } else {
      setSearchResults([]);
    }
  };

  const renderItem = ({ item }: { item: User | Post }) => {
    if (!item) return null;

    // Type guard to check if item is a User
    const isUser = (item: User | Post): item is User => {
      return 'username' in item && typeof item.username === 'string';
    };

    // Type guard to check if item is a Post
    const isPost = (item: User | Post): item is Post => {
      return 'caption' in item && typeof item.caption === 'string';
    };

    if (isUser(item)) {
      return <UserCard user={item} />;
    } else if (isPost(item)) {
      return (
        <PostCard
          post={item}
          navigationType="comments"
          showInteractions={true}
          isVisible={true}
          onLike={async (postId: number, currentlyLiked: boolean) => {
            await handleLike(postId.toString(), currentlyLiked);
          }}
          onComment={async (postId: number) => {
            handleComment(postId.toString());
          }}
          onRepost={async (postId: number) => {
            await handleRepost(postId.toString());
          }}
          onShare={async (postId: number, postCaption: string | null | undefined, mediaUrl: string | undefined) => {
            await handleShare(postId.toString(), postCaption ?? '', mediaUrl);
          }}
          onCarouselItemChanged={(postId, mediaId, isVisible) => {
            // Handle carousel item change if needed
          }}
        />
      );
    }
    return null;
  };

  const getItemKey = (item: User | Post): string => {
    if (!item) return '';

    if ('username' in item) {
      return `user-${item.id}`;
    } else if ('caption' in item) {
      return `post-${item.id}`;
    }
    return '';
  };

  return (
    <SafeAreaView className="flex-1 bg-black pt-12">
      <View className="flex-row items-center bg-gray-800 rounded-lg mx-4 px-3 py-2 mb-4">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2">
          <Ionicons name="arrow-back" size={24} color="#9CA3AF" />
        </TouchableOpacity>
        <TextInput
          className="flex-1 text-white text-base"
          placeholder="Search"
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={handleSearchInputChange}
        />
        <TouchableOpacity className="ml-2">
          <Ionicons name="options" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {error && <Text className="text-red-500 text-center text-lg mt-4">{error}</Text>}

      {loading ? (
        <ActivityIndicator size="large" color="#fff" className="mt-8" />
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderItem}
          keyExtractor={getItemKey}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
} 