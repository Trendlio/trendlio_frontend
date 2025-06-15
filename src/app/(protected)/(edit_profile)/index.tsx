import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, Image, SafeAreaView, TextInput, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { UserAPI } from '@/api/user';
import { User } from '@/types';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [newProfilePic, setNewProfilePic] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (currentUser?.id) {
        try {
          const profileResponse = await UserAPI.getUserProfile(currentUser.id);
          setUserProfile(profileResponse);
          setEditedName(profileResponse.fullName || '');
          setEditedBio(profileResponse.bio || '');
        } catch (error) {
          console.error('Error fetching profile data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfileData();
  }, [currentUser?.id]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setNewProfilePic(result.assets[0].uri);
    }
  };

  const handleDone = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      const updates: Partial<User> = {};

      if (editedName !== userProfile?.fullName) {
        updates.fullName = editedName;
      }
      if (editedBio !== userProfile?.bio) {
        updates.bio = editedBio;
      }

      if (Object.keys(updates).length > 0) {
        await UserAPI.updateUserProfile(currentUser.id, updates);
      }

      if (newProfilePic) {
        try {
          const formData = new FormData();
          // @ts-ignore - React Native specific FormData type
          formData.append('file', {
            uri: Platform.OS === 'ios' ? newProfilePic.replace('file://', '') : newProfilePic,
            type: 'image/jpeg',
            name: 'profile.jpg',
          });
          formData.append('userId', currentUser.id.toString());

          console.log('Uploading avatar with formData:', {
            uri: Platform.OS === 'ios' ? newProfilePic.replace('file://', '') : newProfilePic,
            type: 'image/jpeg',
            name: 'profile.jpg',
            userId: currentUser.id
          });

          const response = await UserAPI.uploadAvatar(formData);
          console.log('Avatar upload response:', response);
        } catch (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          throw uploadError;
        }
      }

      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show error to user
      Alert.alert(
        'Error',
        'Failed to update profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-800">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close-outline" size={30} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Edit profile</Text>
        <TouchableOpacity onPress={handleDone} disabled={loading}>
          <Text className="text-white text-lg font-bold">{loading ? 'Saving...' : 'Done'}</Text>
        </TouchableOpacity>
      </View>

      <View className="p-4">
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-1 mr-4">
            <Text className="text-white text-lg font-bold">Name</Text>
            {isEditingName ? (
              <TextInput
                className="text-white text-base mt-1"
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
                autoFocus
                onBlur={() => setIsEditingName(false)}
              />
            ) : (
              <TouchableOpacity onPress={() => setIsEditingName(true)}>
                <View className="flex-row items-center mt-1">
                  <Text className="text-white text-base">{userProfile?.fullName}</Text>
                  <Text className="text-gray-400 text-base ml-2">({userProfile?.username})</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={pickImage}>
            <Image
              source={{ uri: newProfilePic || userProfile?.profilePicUrl || 'https://via.placeholder.com/100' }}
              className="w-20 h-20 rounded-full"
            />
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className="text-white text-lg font-bold">Bio</Text>
          {isEditingBio ? (
            <TextInput
              className="text-white text-base mt-1"
              value={editedBio}
              onChangeText={setEditedBio}
              placeholder="Write a bio"
              placeholderTextColor="#9CA3AF"
              multiline
              autoFocus
              onBlur={() => setIsEditingBio(false)}
            />
          ) : (
            <TouchableOpacity onPress={() => setIsEditingBio(true)}>
              <Text className="text-white text-base mt-1">
                {userProfile?.bio || 'Add a bio'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View>
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-lg font-bold">Private profile</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={privateProfile ? "#f5dd4b" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={setPrivateProfile}
              value={privateProfile}
            />
          </View>
          <Text className="text-gray-400 text-sm mt-1">
            If you switch to private, only followers can see your threads. Your replies will be visible to
            followers and individual profiles you reply to.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
