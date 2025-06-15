import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const auth = useAuth();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError('');
      await auth.login(data.email, data.password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black p-4 justify-center">
      <Text className="text-3xl font-bold text-white mb-8 text-center p-2">Welcome Back</Text>

      <View className=" flex gap-4">
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
            <Text className="text-white text-center font-semibold">Login</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center space-x-2">
          <Text className="text-gray-400 text-lg">Don't have an account?{" "}</Text>
          <Link href="/register" className="text-blue-500 text-lg">
            Sign up
          </Link>
        </View>

        <Link href="/forgot-password" className="text-blue-500 text-center text-lg">
          Forgot Password?
        </Link>
      </View>
    </View>
  );
} 