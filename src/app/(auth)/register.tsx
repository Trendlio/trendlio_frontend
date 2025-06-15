import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthAPI } from '@/api/auth';

const registerSchema = z.object({
  fullname: z.string().min(3, 'Username must be at least 3 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError('');
      await AuthAPI.register(data);
      router.replace('/verify-email');
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black p-4 justify-center">
      <Text className="text-3xl font-bold text-white mb-8 text-center">Create Account</Text>

      <View className="flex gap-4">

        <Controller
          control={control}
          name="fullname"
          render={({ field: { onChange, value } }) => (
            <View>
              <TextInput
                className="bg-gray-800 text-white p-4 rounded-lg"
                placeholder="Fullname"
                placeholderTextColor="#666"
                autoCapitalize="none"
                onChangeText={onChange}
                value={value}
              />
              {errors.username && (
                <Text className="text-red-500 mt-1">{errors.username.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, value } }) => (
            <View>
              <TextInput
                className="bg-gray-800 text-white p-4 rounded-lg"
                placeholder="Username"
                placeholderTextColor="#666"
                autoCapitalize="none"
                onChangeText={onChange}
                value={value}
              />
              {errors.username && (
                <Text className="text-red-500 mt-1">{errors.username.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <View>
              <TextInput
                className="bg-gray-800 text-white p-4 rounded-lg"
                placeholder="Email"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={onChange}
                value={value}
              />
              {errors.email && (
                <Text className="text-red-500 mt-1">{errors.email.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <View>
              <TextInput
                className="bg-gray-800 text-white p-4 rounded-lg"
                placeholder="Password"
                placeholderTextColor="#666"
                secureTextEntry
                onChangeText={onChange}
                value={value}
              />
              {errors.password && (
                <Text className="text-red-500 mt-1">{errors.password.message}</Text>
              )}
            </View>
          )}
        />

        {error ? <Text className="text-red-500 text-center">{error}</Text> : null}

        <TouchableOpacity
          className="bg-blue-500 p-4 rounded-lg"
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold">Sign Up</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center space-x-2">
          <Text className="text-gray-400 text-lg">Already have an account?{" "}</Text>
          <Link href="/login" className="text-blue-500 text-lg">
            Login
          </Link>
        </View>
      </View>
    </View>
  );
} 