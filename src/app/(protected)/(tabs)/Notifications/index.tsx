import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { NotificationAPI } from '@/api/notification';
import { Notification } from '@/types';

const NotificationItem = ({ notification, onPress }: { notification: Notification; onPress: () => void }) => {
  const getNotificationIcon = () => {
    switch (notification.notificationType) {
      case 'like':
        return <Ionicons name="heart" size={24} color="#EF4444" />;
      case 'comment':
        return <Ionicons name="chatbubble" size={24} color="#3B82F6" />;
      case 'follow':
      case 'follow_request':
      case 'follow_request_approved':
        return <Ionicons name="person-add" size={24} color="#10B981" />;
      case 'repost':
        return <Ionicons name="repeat" size={24} color="#8B5CF6" />;
      case 'share':
        return <Ionicons name="share-social" size={24} color="#F59E0B" />;
      default:
        return null;
    }
  };

  const getNotificationText = () => {
    switch (notification.notificationType) {
      case 'like':
        return notification.post ? 'liked your post' : 'liked your comment';
      case 'comment':
        return `commented: "${notification.comment?.text}"`;
      case 'follow':
        return 'started following you';
      case 'follow_request':
        return 'requested to follow you';
      case 'follow_request_approved':
        return 'approved your follow request';
      case 'repost':
        return 'reposted your post';
      case 'share':
        return 'shared your post';
      default:
        return '';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-start p-4 border-b border-gray-800 ${!notification.isRead ? 'bg-gray-900/50' : ''}`}
    >
      <View className="mr-3">
        <Image
          source={{ uri: notification.actor.profilePicUrl || 'https://via.placeholder.com/50' }}
          className="w-12 h-12 rounded-full"
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="text-white font-bold mr-1">{notification.actor.username}</Text>
          {notification.actor.verifiedAccount && (
            <Ionicons name="checkmark-circle" size={16} color="#3182CE" />
          )}
          <Text className="text-gray-400 ml-1">{getNotificationText()}</Text>
        </View>
        {notification.post && (
          <Text className="text-gray-400 text-sm mb-1" numberOfLines={2}>
            {notification.post.caption}
          </Text>
        )}
        <Text className="text-gray-500 text-xs">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </Text>
      </View>
      <View className="ml-2">
        {getNotificationIcon()}
      </View>
    </TouchableOpacity>
  );
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async (pageNum: number = 0, shouldRefresh: boolean = false) => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      const response = await NotificationAPI.getNotifications(
        currentUser.id,
        pageNum,
        20
      );

      if (shouldRefresh) {
        setNotifications(response.content);
      } else {
        setNotifications(prev => [...prev, ...response.content]);
      }

      setHasMore(response.content.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications();
    }
  }, [currentUser?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(0, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!currentUser?.id) return;

    try {
      await NotificationAPI.markAsRead(
        currentUser.id,
        notification.id
      );

      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );

      // Navigate based on notification type
      if (notification.post) {
        router.push(`/post/${notification.post.id}`);
      } else if (notification.notificationType === 'follow' ||
        notification.notificationType === 'follow_request' ||
        notification.notificationType === 'follow_request_approved') {
        router.push(`/profile/${notification.actor.id}`);
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser?.id) return;

    try {
      await NotificationAPI.markAllAsRead(currentUser.id);
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <View className="flex-1 bg-black pt-12">
      <View className="flex-row items-center justify-between px-4 mb-4">
        <Text className="text-white text-3xl font-bold">Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllAsRead}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handleNotificationPress(item)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
          />
        }
        ListFooterComponent={
          loading && !refreshing ? (
            <ActivityIndicator size="small" color="#fff" className="mt-4" />
          ) : null
        }
        ListEmptyComponent={
          !loading && !refreshing ? (
            <View className="flex-1 items-center justify-center mt-8">
              <Text className="text-gray-400 text-lg">No notifications yet</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
} 