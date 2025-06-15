import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, FlatList, ViewToken, Alert, Animated, Image, Keyboard, KeyboardEvent, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, usePathname } from 'expo-router';
import { Post, Comment } from '../../../types';
import { PostCard } from '../../../components/cards/PostCard';
import { CommentCard } from '../../../components/cards/CommentCard';
import { PostAPI } from '../../../api/post';
import { CommentAPI } from '../../../api/comment';
import { useAuth } from '../../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useCameraPermissions } from 'expo-camera';
import { Audio, Video, ResizeMode } from 'expo-av';
import { useToast } from '../../../components/ui/use-toast';
import { uploadMediaToCloudinary } from '../../../config/cloudinary';
import * as FileSystem from 'expo-file-system';
import { Media } from '../../../types';
import { useFocusEffect } from '@react-navigation/native';

interface MediaAsset {
  uri: string;
  type: string;
  width?: number;
  height?: number;
  duration?: number;
}

export default function CreateCommentScreen() {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset[]>([]);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [visibleVideoIndex, setVisibleVideoIndex] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const buttonPosition = useRef(new Animated.Value(0)).current;
  const { postId } = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<{ commentId: number | null; username: string | null }>({ commentId: null, username: null });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const pathname = usePathname();

  const fetchPostAndComments = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      if (!user?.id) {
        throw new Error('User ID is required');
      }
      const fetchedPost = await PostAPI.getPost(id, user?.id);
      setPost(fetchedPost);

      const fetchedComments = await CommentAPI.getPostComments(id, user?.id);
      setComments(fetchedComments.content);

    } catch (err: any) {
      console.error('Error fetching post and comments:', err);
      setError(err.message || 'Failed to fetch post and comments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('CreateComment screen mounted');
    console.log('Received postId:', postId);
    if (postId) {
      fetchPostAndComments(Number(postId));
    }
  }, [postId, user?.id]);

  const handleLikePost = (pId: number, currentlyLiked: boolean) => {
    setPost(prevPost => {
      if (!prevPost) return null;
      return {
        ...prevPost,
        hasLiked: !currentlyLiked,
        likeCount: currentlyLiked ? prevPost.likeCount - 1 : prevPost.likeCount + 1,
      };
    });
    // Call your actual API here if needed for like/unlike
    // await PostAPI.toggleLikePost(pId, user?.id);
    console.log(`Post ${pId} liked: ${!currentlyLiked}`);
  };

  useEffect(() => {
    return () => {
      setVisibleVideoIndex(null);
    };
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const visibleVideoItem = viewableItems.find(item =>
      item.isViewable &&
      selectedMedia[item.index as number]?.type === 'video'
    );

    if (visibleVideoItem) {
      setVisibleVideoIndex(visibleVideoItem.index as number);
    } else {
      setVisibleVideoIndex(null);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300
  }).current;

  const requestGalleryPermission = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photos to continue. You may need to create a development build for full functionality.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting gallery permission:', error);
      toast({
        message: "Failed to request gallery permission. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleCameraPermission = async () => {
    try {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your camera to continue.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      toast({
        message: "Failed to request camera permission. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleMediaSelection = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;

    const mediaAssets: MediaAsset[] = result.assets.map(asset => ({
      uri: asset.uri,
      type: asset.type || 'image',
      width: asset.width,
      height: asset.height,
      duration: asset.duration || undefined,
    }));

    setSelectedMedia(mediaAssets);
  };

  const handleGalleryPress = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.7,
        exif: false,
        base64: false,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
        videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
        videoMaxDuration: 60,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });

      if (!result.canceled && result.assets.length > 0) {
        // Process assets in smaller batches to prevent memory issues
        const batchSize = 2; // Reduced batch size
        const mediaAssets: MediaAsset[] = [];

        for (let i = 0; i < result.assets.length; i += batchSize) {
          const batch = result.assets.slice(i, i + batchSize);
          const batchAssets = batch.map(asset => ({
            uri: asset.uri,
            type: asset.type || 'image',
            width: asset.width,
            height: asset.height,
            duration: asset.duration || undefined,
          }));
          mediaAssets.push(...batchAssets);

          // Increased delay between batches
          if (i + batchSize < result.assets.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        setSelectedMedia(mediaAssets);
      }
    } catch (error) {
      console.error('Error picking media:', error);

      if (error instanceof Error && error.message.includes('OutOfMemoryError')) {
        toast({
          message: "Not enough memory to process these files. Please try selecting fewer files or lower resolution media.",
          variant: "destructive"
        });
      } else {
        toast({
          message: "Failed to access gallery. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleCameraPress = async () => {
    const hasPermission = await handleCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const mediaAsset: MediaAsset = {
          uri: asset.uri,
          type: asset.type || 'image',
          width: asset.width,
          height: asset.height,
          duration: asset.duration || undefined,
        };

        setSelectedMedia(prev => [...prev, mediaAsset]);
      }
    } catch (error) {
      console.error('Error capturing media:', error);
      toast({
        message: "Failed to access camera. Please try again.",
        variant: "destructive"
      });
    }
  };

  const requestAudioPermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your microphone to continue.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting audio permission:', error);
      toast({
        message: "Failed to request audio permission. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleAudioPress = async () => {
    const hasPermission = await requestAudioPermission();
    if (!hasPermission) return;

    try {
      if (isRecording) {
        // Stop recording
        if (recording) {
          await recording.stopAndUnloadAsync();
          const uri = recording.getURI();
          setRecording(null);
          setIsRecording(false);

          // TODO: Handle the recorded audio file
          console.log('Recording stopped, audio file:', uri);
          toast({
            message: "Audio recording completed!",
            variant: "default"
          });
        }
      } else {
        // Start recording
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        setRecording(newRecording);
        setIsRecording(true);
        toast({
          message: "Recording started...",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error handling audio:', error);
      toast({
        message: "Failed to handle audio recording. Please try again.",
        variant: "destructive"
      });
      setIsRecording(false);
      setRecording(null);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
    if (visibleVideoIndex === index) {
      setVisibleVideoIndex(null);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && selectedMedia.length === 0) return;

    setIsLoading(true);
    try {
      let mediaUrls: string[] = [];
      let mediaDimensions: { width: number; height: number; duration?: number }[] = [];
      let mediaType = 11; // Default to text post

      if (selectedMedia.length > 0) {
        // Upload all media to Cloudinary
        const uploadPromises = selectedMedia.map(media =>
          uploadMediaToCloudinary(
            media.uri,
            media.type,
            media.width,
            media.height,
            media.duration
          )
        );

        const uploadResults = await Promise.all(uploadPromises);
        const validResults = uploadResults.filter((result): result is NonNullable<typeof result> => result !== null);

        if (validResults.length > 0) {
          mediaUrls = validResults.map(result => result.url);
          mediaDimensions = validResults.map(result => ({
            width: result.width,
            height: result.height,
            duration: result.duration
          }));
          mediaType = validResults.length > 1 ? 3 : (validResults[0].type === 'video' ? 2 : 1);
        }
      }
      if (!user?.id) {
        throw new Error('User ID is required');
      }
      // Create post with media
      await PostAPI.createPost(user?.id, {
        caption: content,
        mediaType,
        takenAt: new Date().toISOString(),
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        mediaDimensions: mediaDimensions.length > 0 ? mediaDimensions : undefined
      });

      toast({
        message: "Post created successfully!",
        variant: "default"
      });
      router.back();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        message: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderMediaItem = ({ item: media, index }: { item: MediaAsset; index: number }) => {
    const isMultipleItems = selectedMedia.length > 1;
    const mediaStyle = isMultipleItems
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
      <View className="relative items-center mr-3 justify-center rounded-xl overflow-hidden">
        {media.type === 'video' ? (
          <Video
            source={{ uri: media.uri }}
            className="rounded-xl"
            style={mediaStyle}
            useNativeControls
            resizeMode={isMultipleItems ? ResizeMode.COVER : ResizeMode.CONTAIN}
            isLooping
            shouldPlay={visibleVideoIndex === index}
            isMuted={false}
          />
        ) : (
          <Image
            source={{ uri: media.uri }}
            className="rounded-xl"
            style={mediaStyle}
            resizeMode={isMultipleItems ? "cover" : "contain"}
            alt={`Media item ${index + 1}`}
          />
        )}
        <TouchableOpacity
          className="absolute top-1 right-1 bg-black/50 rounded-full z-10"
          onPress={() => removeMedia(index)}
        >
          <Ionicons name="close-circle" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);

        // Scroll to ensure content is visible when keyboard appears
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);

        Animated.timing(buttonPosition, {
          toValue: -(e.endCoordinates.height - 60),
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
        Animated.timing(buttonPosition, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleCommentPost = (pId: number) => {
    router.push({
      pathname: '/(protected)/(comments)/createcomment',
      params: { postId: pId }
    });
  };

  const handleSubmitComment = async () => {
    if (newCommentText.trim() === '') return;

    try {
      if (!user?.id) {
        throw new Error('User ID is required');
      }
      const parentCommentId = replyingTo.commentId ? replyingTo.commentId : undefined;
      const newComment = await CommentAPI.createComment(
        Number(postId),
        user?.id,
        { text: newCommentText, parentCommentId: parentCommentId }
      );

      if (replyingTo.commentId) {
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === replyingTo.commentId
              ? { ...comment, replies: [...(comment.replies || []), newComment] }
              : comment
          )
        );
      } else {
        setComments(prevComments => [...prevComments, newComment]);
      }

      setNewCommentText('');
      setReplyingTo({ commentId: null, username: null });
      console.log('New comment submitted!');
    } catch (error) {
      console.error('Error submitting comment:', error);
      setError('Failed to submit comment.');
    }
  };

  // Clear visible post when screen mounts and unmounts
  useEffect(() => {
    return () => {
      setVisibleVideoIndex(null);
    };
  }, []);

  // Clear visible post when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        setVisibleVideoIndex(null);
      };
    }, [])
  );

  const handleBack = () => {
    setVisibleVideoIndex(null);
    router.back();
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <Text className="text-red-500">Error: {error}</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <Text className="text-gray-500">Post not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-black"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={{ flex: 1 }}
    >
      <View className="flex-row items-center p-4 border-b border-gray-200 dark:border-gray-800">
        <TouchableOpacity onPress={handleBack} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#fff" className="dark:text-white" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 dark:text-white">Reply</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: isKeyboardVisible ? keyboardHeight + 60 : 60
        }}
        onContentSizeChange={() => {
          if (isKeyboardVisible) {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        }}
      >
        <PostCard
          post={post}
          navigationType="createComment"
          showInteractions={false}
        />

        <View className="p-4">
          <View className="flex-row items-center mb-4">
            <View className='mr-2'>
              <Image
                source={{ uri: user?.profilePicUrl || 'https://via.placeholder.com/40' }}
                className="w-10 h-10 rounded-full mr-2.5"
                alt={`${user?.username || 'User'}'s profile picture`}
              />
            </View>
            <View className='flex-col flex-1'>
              <View className="flex-row space-x-2 justify-normal align-middle">
                <Text className="text-white text-lg font-bold">{user?.username || 'User'}</Text>
                <TouchableOpacity onPress={() => { }}>
                  <Text className="text-gray-500 text-lg"> {" > "}Add topic</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                placeholder={`Reply to ${post?.user.username}...`}
                placeholderTextColor="#666"
                className="text-white text-lg py-0 text-top"
                multiline
                value={content}
                onChangeText={setContent}
                autoFocus
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 100);
                }}
              />
            </View>
          </View>

          {selectedMedia.length > 0 && (
            <View className="my-2.5 rounded-lg overflow-hidden ml-14">
              <FlatList
                ref={flatListRef}
                data={selectedMedia}
                renderItem={renderMediaItem}
                keyExtractor={(_, index) => index.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
              />
            </View>
          )}

          <View className="flex-row gap-5 my-1 ml-14">
            <TouchableOpacity className="py-2 px-0" onPress={handleGalleryPress}>
              <Ionicons name="image-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity className="py-2 px-0" onPress={handleCameraPress}>
              <Ionicons name="camera-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity className="py-2 px-0">
              <Ionicons name="gift-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              className={`py-2 px-0 ${isRecording ? 'bg-red-500/10' : ''}`}
              onPress={handleAudioPress}
            >
              <Ionicons
                name={isRecording ? "stop" : "mic"}
                size={24}
                color={isRecording ? "#ef4444" : "#fff"}
              />
            </TouchableOpacity>
            <TouchableOpacity className="py-2 px-0">
              <Ionicons name="location-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="flex-row items-center mt-5">
            <View className='mx-2'>
              <Image
                source={{ uri: user?.profilePicUrl || 'https://via.placeholder.com/40' }}
                className="w-6 h-6 rounded-full mr-2.5"
                alt={`${user?.username || 'User'}'s profile picture`}
              />
            </View>
            <Text className="text-gray-500 text-base ml-3">Add another reply</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Animated.View
        className="flex-row items-center justify-between p-4 border-t border-gray-800 bg-black"
        style={{
          position: 'absolute',
          bottom: isKeyboardVisible ? keyboardHeight : 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <Text className="text-gray-500 text-sm">Anyone can reply</Text>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <TouchableOpacity
            className={`py-2 px-5 rounded-full ${!content.trim() ? 'bg-gray-800' : 'bg-white'}`}
            onPress={handlePost}
            disabled={!content.trim() || isLoading}
          >
            <Text className={`font-bold ${!content.trim() ? 'text-gray-500' : 'text-black'}`}>
              Post
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}