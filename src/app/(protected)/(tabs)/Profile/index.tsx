import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView, Dimensions, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { UserAPI } from '@/api/user';
import { User, Post, Comment } from '@/types';
import { PostCard } from '@/components/cards/PostCard';
import { CommentCard } from '@/components/cards/CommentCard';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

type ProfileTab = 'threads' | 'replies' | 'media' | 'reposts' | 'feeds';

const profileCompletionItems = [
  {
    id: 'create_thread',
    icon: 'create-outline',
    title: 'Create thread',
    description: "Say what's on your mind or share a recent highlight.",
    buttonText: 'Create',
    completed: false,
  },
  {
    id: 'follow_profiles',
    icon: 'checkmark',
    title: 'Follow 10 profiles',
    description: 'Fill your feed with threads that interest you.',
    buttonText: 'Done',
    completed: true,
  },
  {
    id: 'add_profile_photo',
    icon: 'checkmark',
    title: 'Add profile photo',
    description: 'Make it easier for people to recognise you.',
    buttonText: 'Done',
    completed: true,
  },
  {
    id: 'add_bio',
    icon: 'checkmark',
    title: 'Add bio',
    description: "Introduce yourself and tell people what you're into.",
    buttonText: 'Done',
    completed: true,
  },
];

export default function ProfileScreen() {
  const { user: currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userReposts, setUserReposts] = useState<Post[]>([]);
  const [userReplies, setUserReplies] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('threads');
  const router = useRouter();

  // Add a computed value for media posts
  const mediaPosts = userPosts.filter(post => post.mediaType === 1 || post.mediaType === 2);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (currentUser?.id) {
        try {
          const [profileResponse, postsResponse, repostsResponse, repliesResponse] = await Promise.all([
            UserAPI.getUserProfile(currentUser.id),
            UserAPI.getUserPosts(currentUser.id, currentUser.id),
            UserAPI.getUserReposts(currentUser.id, currentUser.id),
            UserAPI.getUserReplies(currentUser.id, currentUser.id),
          ]);
          console.log('Reposts Response:', repostsResponse);
          setUserProfile(profileResponse);
          setUserPosts(postsResponse.content);
          setUserReposts(repostsResponse.content);
          setUserReplies(repliesResponse.content);
          console.log('User Reposts State:', repostsResponse.content);
        } catch (error) {
          console.error('Error fetching profile data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfileData();
  }, [currentUser?.id]);

  useEffect(() => {
    console.log('Active Tab Changed:', activeTab);
  }, [activeTab]);

  const formatCount = (count: number | undefined) => {
    const safeCount = count !== undefined ? count : 0;
    if (safeCount >= 1000000) {
      return (safeCount / 1000000).toFixed(1) + 'M';
    } else if (safeCount >= 1000) {
      return (safeCount / 1000).toFixed(1) + 'K';
    }
    return safeCount;
  };

  const renderProfileCompletion = () => {
    const remainingItems = profileCompletionItems.filter(item => !item.completed);
    if (remainingItems.length === 0) return null;

    return (
      <View className="mt-4 mb-6">
        <View className="flex-row justify-between items-center mb-3 px-4">
          <Text className="text-white text-lg font-bold">Finish your profile</Text>
          <Text className="text-gray-500">{remainingItems.length} left</Text>
        </View>
        <FlatList
          data={remainingItems}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={{ width: width * 0.45, marginRight: 10, marginLeft: item.id === remainingItems[0].id ? 16 : 0 }}
              className="bg-gray-800 rounded-lg p-4 justify-between"
            >
              <Ionicons name={item.icon as any} size={24} color="#9CA3AF" className="mb-2" />
              <Text className="text-white font-bold text-base mb-1">{item.title}</Text>
              <Text className="text-gray-400 text-sm mb-3">{item.description}</Text>
              <TouchableOpacity className="bg-gray-700 px-4 py-2 rounded-lg">
                <Text className="text-white font-bold text-center">{item.buttonText}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    );
  };

  const renderTabContent = () => {
    console.log('Active Tab:', activeTab);
    console.log('User Reposts Length:', userReposts.length);

    switch (activeTab) {
      case 'threads':
        return userPosts.length > 0 ? (
          <FlatList
            data={userPosts}
            keyExtractor={(item) => `threads-${item.id}`}
            renderItem={({ item }) => (
              <PostCard
                post={item}
                onLike={async (postId, currentlyLiked) => { /* Implement like logic */ }}
                onComment={async (postId) => { /* Implement comment logic */ }}
                onRepost={async (postId) => { /* Implement repost logic */ }}
                onShare={async (postId, postCaption, mediaUrl) => { /* Implement share logic */ }}
                isVisible={true}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <View className="items-center justify-center py-12">
            <Ionicons name="document-text-outline" size={50} color="#9CA3AF" />
            <Text className="text-gray-400 text-lg mt-4">You haven't posted any threads yet.</Text>
          </View>
        );
      case 'replies':
        return (
          <FlatList
            data={userReplies}
            keyExtractor={(item) => `replies-${item.id}`}
            renderItem={({ item }) => (
              <View className="mb-4">
                <PostCard
                  post={item}
                  onLike={async (postId, currentlyLiked) => { /* Implement like logic */ }}
                  onComment={async (postId) => { /* Implement comment logic */ }}
                  onRepost={async (postId) => { /* Implement repost logic */ }}
                  onShare={async (postId, postCaption, mediaUrl) => { /* Implement share logic */ }}
                  isVisible={true}
                  showInteractions={false}
                />
                <View className="bg-gray-900">
                  {item.comments?.map(comment => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      onLike={async (commentId, currentlyLiked) => { /* Implement like logic */ }}
                      onReply={async (commentId, username) => { /* Implement reply logic */ }}
                      onRepost={async (commentId) => { /* Implement repost logic */ }}
                      onShare={async (commentId, commentText) => { /* Implement share logic */ }}
                    />
                  ))}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Ionicons name="chatbubbles-outline" size={50} color="#9CA3AF" />
                <Text className="text-gray-400 text-lg mt-4">You haven't replied to any threads yet.</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        );
      case 'media':
        return (
          <View className="items-center justify-center py-12">
            <Ionicons name="image-outline" size={50} color="#9CA3AF" />
            <Text className="text-gray-400 text-lg mt-4">You haven't posted any media threads yet.</Text>
          </View>
        );
      case 'reposts':
        console.log('Rendering Reposts Tab');
        return userReposts.length > 0 ? (
          <FlatList
            data={userReposts}
            keyExtractor={(item) => `reposts-${item.id}`}
            renderItem={({ item }) => {
              console.log('Rendering Repost Item:', item.id);
              return (
                <PostCard
                  post={item}
                  onLike={async (postId, currentlyLiked) => { /* Implement like logic */ }}
                  onComment={async (postId) => { /* Implement comment logic */ }}
                  onRepost={async (postId) => { /* Implement repost logic */ }}
                  onShare={async (postId, postCaption, mediaUrl) => { /* Implement share logic */ }}
                  isVisible={true}
                  showInteractions={false}
                />
              );
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <View className="items-center justify-center py-12">
            <Ionicons name="repeat-outline" size={50} color="#9CA3AF" />
            <Text className="text-gray-400 text-lg mt-4">You haven't reposted any threads yet.</Text>
          </View>
        );
      case 'feeds':
        return (
          <View className="items-center justify-center py-12">
            <Ionicons name="add-circle-outline" size={50} color="#9CA3AF" />
            <Text className="text-gray-400 text-lg mt-4 text-center">Handpick people and topics to make your perfect feed.</Text>
            <TouchableOpacity className="bg-gray-700 px-6 py-3 rounded-lg mt-4">
              <Text className="text-white font-bold text-center">Create</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <Text className="text-red-500 text-lg">Failed to load profile.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <FlatList
        data={
          activeTab === 'threads' ? userPosts :
            activeTab === 'reposts' ? userReposts :
              activeTab === 'replies' ? userReplies :
                activeTab === 'media' ? mediaPosts :
                  []
        }
        keyExtractor={(item) => `${activeTab}-${item.id}`}
        renderItem={({ item }) => {
          if (activeTab === 'replies') {
            return (
              <View className="mb-4">
                <PostCard
                  post={item}
                  onLike={async () => { }}
                  onComment={async () => { }}
                  onRepost={async () => { }}
                  onShare={async () => { }}
                  isVisible={true}
                  showInteractions={false}
                />
                <View className="bg-gray-900">
                  {item.comments?.map(comment => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      onLike={async () => { }}
                      onReply={async () => { }}
                      onRepost={async () => { }}
                      onShare={async () => { }}
                    />
                  ))}
                </View>
              </View>
            );
          }
          return (
            <PostCard
              post={item}
              onLike={async () => { }}
              onComment={async () => { }}
              onRepost={async () => { }}
              onShare={async () => { }}
              isVisible={true}
              showInteractions={activeTab === 'threads'}
            />
          );
        }}
        ListHeaderComponent={
          <View className="px-4 pt-4">
            {/* Top profile info */}
            <View className="flex-row justify-between items-center mb-4">
              <Ionicons name="globe-outline" size={24} color="#fff" />
              <View className="flex-row">
                <Ionicons name="bar-chart-outline" size={24} color="#fff" className="mr-4" />
                <Ionicons name="logo-instagram" size={24} color="#fff" className="mr-4" />
                <Ionicons name="menu-outline" size={24} color="#fff" />
              </View>
            </View>

            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-white text-3xl font-bold">{userProfile.fullName || userProfile.username}</Text>
                <Text className="text-gray-400 text-base">{userProfile.username}</Text>
                {userProfile.bio && <Text className="text-white text-base mt-2">{userProfile.bio}</Text>}
                <Text className="text-gray-500 text-sm mt-1">{formatCount(userProfile.followerCount)} followers</Text>
              </View>
              <Image
                source={{ uri: userProfile.profilePicUrl || 'https://via.placeholder.com/100' }}
                className="w-24 h-24 rounded-full"
              />
            </View>

            <View className="flex-row justify-between mt-4 mb-2">
              <TouchableOpacity className="flex-1 bg-gray-800 py-2 rounded-lg mr-2 items-center justify-center"
                onPress={() => router.push('/(edit_profile)')}
              >
                <Text className="text-white font-bold">Edit profile</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-gray-800 py-2 rounded-lg ml-2 items-center justify-center">
                <Text className="text-white font-bold">Share profile</Text>
              </TouchableOpacity>
            </View>

            {renderProfileCompletion()}

            <View className="flex-row border-b border-gray-800 mt-4">
              {["threads", "replies", "media", "reposts", "feeds"].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  className={`flex-1 items-center py-3 ${activeTab === tab ? 'border-b-2 border-white' : ''}`}
                  onPress={() => {
                    console.log('Tab Pressed:', tab);
                    setActiveTab(tab as ProfileTab);
                  }}
                >
                  <Text className={`font-bold text-base ${activeTab === tab ? 'text-white' : 'text-gray-500'}`}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeTab !== 'threads' && activeTab !== 'reposts' && activeTab !== 'media' && activeTab !== 'replies' && (
              <View className="items-center justify-center py-12">
                <Ionicons
                  name="add-circle-outline"
                  size={50}
                  color="#9CA3AF"
                />
                <Text className="text-gray-400 text-lg mt-4 text-center">
                  {activeTab === 'feeds'
                    ? 'Handpick people and topics to make your perfect feed.'
                    : `You haven't ${activeTab}ed any threads yet.`}
                </Text>
                {activeTab === 'feeds' && (
                  <TouchableOpacity className="bg-gray-700 px-6 py-3 rounded-lg mt-4">
                    <Text className="text-white font-bold text-center">Create</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          activeTab === 'threads' ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="document-text-outline" size={50} color="#9CA3AF" />
              <Text className="text-gray-400 text-lg mt-4">You haven't posted any threads yet.</Text>
            </View>
          ) : activeTab === 'reposts' ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="repeat-outline" size={50} color="#9CA3AF" />
              <Text className="text-gray-400 text-lg mt-4">You haven't reposted any threads yet.</Text>
            </View>
          ) : activeTab === 'media' ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="image-outline" size={50} color="#9CA3AF" />
              <Text className="text-gray-400 text-lg mt-4">You haven't posted any media threads yet.</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
} 