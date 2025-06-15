import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '@/types/index';
import { UserAPI } from '@/api/user';
import { Link, useRouter } from 'expo-router';

const UserCard = ({ user, onFollowToggle }: { user: User; onFollowToggle: (userId: string, isFollowing: boolean) => void }) => {
  const formatFollowerCount = (count: number | undefined) => {
    const safeCount = count ?? 0;
    if (safeCount >= 1000000) {
      return (safeCount / 1000000).toFixed(1) + 'M followers';
    } else if (safeCount >= 1000) {
      return (safeCount / 1000).toFixed(1) + 'K followers';
    }
    return safeCount + ' followers';
  };

  if (!user) return null;

  return (
    <View className="flex-row items-center justify-between px-4 border-b border-gray-800">
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
        onPress={() => onFollowToggle(user.id?.toString() ?? '0', user.isFollowing ?? false)}
      >
        <Text className={`font-bold ${user.isFollowing ? 'text-white' : 'text-black'}`}>
          {user.isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchUsers = async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (query && query.length > 0) {
        response = await UserAPI.searchUsers(query);
      } else {
        response = await UserAPI.getRandomUsers();
      }
      setSearchResults(response.content);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);


  const handleFollowToggle = (userId: string, isFollowing: boolean) => {
    console.log(`Toggling follow for user ${userId}. Currently following: ${isFollowing}`);
    setSearchResults(prevResults =>
      prevResults.map(user =>
        user.id.toString() === userId ? { ...user, isFollowing: !isFollowing } : user
      )
    );
  };

  return (
    <View className="flex-1 bg-black pt-1.5">
      <Text className="text-white text-3xl font-bold ml-4 mb-4">Search</Text>
      <Link
        href={{ pathname: "Search/results", params: { query: searchText } }}
        asChild
      >
        <TouchableOpacity
          className="flex-row items-center bg-gray-800 rounded-lg mx-4 px-3 py-2 mb-4"
        >
          <Ionicons name="search" size={20} color="#9CA3AF" className="mr-2" />
          <Text className="text-gray-400 text-base">Search</Text>
        </TouchableOpacity>
      </Link>

      {error && <Text className="text-red-500 text-center text-lg mt-4">{error}</Text>}

      {loading ? (
        <ActivityIndicator size="large" color="#fff" className="mt-8" />
      ) : (
        <FlatList
          data={searchResults}
          renderItem={({ item }) => <UserCard user={item} onFollowToggle={handleFollowToggle} />}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
} 