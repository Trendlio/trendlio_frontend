import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthAPI } from '@/api/auth';

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;

export default function VerifyEmailScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const params = useLocalSearchParams<{ token?: string }>();

  const { control, handleSubmit, formState: { errors } } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      token: params.token || '',
    },
  });

  const onSubmit = async (data: VerifyEmailFormData) => {
    try {
      setIsLoading(true);
      setError('');
      await AuthAPI.verifyEmail(data.token);
      setSuccess(true);
    } catch (err) {
      setError('Email verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <View className="flex-1 bg-black p-4 justify-center">
        <Text className="text-2xl font-bold text-white mb-4 text-center">Email Verified!</Text>
        <Text className="text-gray-400 text-center mb-8">
          Your email has been successfully verified. You can now log in to your account.
        </Text>
        <Link href="/login" className="text-blue-500 text-center">
          Go to Login
        </Link>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black p-4 justify-center">
      <Text className="text-3xl font-bold text-white mb-8 text-center">Verify Your Email</Text>

      <View className="flex gap-4">
        <Controller
          control={control}
          name="token"
          render={({ field: { onChange, value } }) => (
            <View>
              <TextInput
                className="bg-gray-800 text-white p-4 rounded-lg"
                placeholder="Verification Code"
                placeholderTextColor="#666"
                autoCapitalize="none"
                onChangeText={onChange}
                value={value}
              />
              {errors.token && (
                <Text className="text-red-500 mt-1">{errors.token.message}</Text>
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
            <Text className="text-white text-center font-semibold">Verify Email</Text>
          )}
        </TouchableOpacity>

        <Link href="/login" className="text-blue-500 text-center text-lg">
          Back to Login
        </Link>
      </View>
    </View>
  );
} 