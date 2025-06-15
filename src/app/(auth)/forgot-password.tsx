import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthAPI } from '@/api/auth';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setError('');
      await AuthAPI.requestPasswordReset(data.email);
      setSuccess(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <View className="flex-1 bg-black p-4 justify-center">
        <Text className="text-2xl font-bold text-white mb-4 text-center">Check Your Email</Text>
        <Text className="text-gray-400 text-center mb-8">
          We've sent password reset instructions to your email address.
        </Text>
        <Link href="/login" className="text-blue-500 text-center">
          Return to Login
        </Link>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black p-4 justify-center">
      <Text className="text-3xl font-bold text-white mb-8 text-center">Reset Password</Text>

      <View className="flex gap-4">
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

        {error ? <Text className="text-red-500 text-center">{error}</Text> : null}

        <TouchableOpacity
          className="bg-blue-500 p-4 rounded-lg"
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold">Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <Link href="/login" className="text-blue-500 text-center text-lg">
          Back to Login
        </Link>
      </View>
    </View>
  );
} 