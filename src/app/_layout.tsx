import '../../global.css';

import { Stack, useSegments, router, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider as CustomThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { MediaPlaybackProvider } from '@/context/MediaPlaybackContext';
import { PostProvider } from '../context/PostContext';

const myTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: 'white',
    card: '#101010',
  },
};

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const inAuthGroup = segments[0] === '(auth)';
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && !inAuthGroup) {
        // Redirect to tabs if authenticated and not in auth group
        router.replace('/(protected)/(tabs)');
      } else if (!isAuthenticated && inAuthGroup) {
        // Do nothing if not authenticated and already in auth group
      } else if (!isAuthenticated && !inAuthGroup) {
        // Redirect to sign-in if not authenticated and not in auth group
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, isLoading, inAuthGroup]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: myTheme.colors.card }}>
      <Stack>
        <Stack.Screen name="(protected)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MediaPlaybackProvider>
          <PostProvider>
            <CustomThemeProvider>
              <NotificationProvider>
                <ThemeProvider value={myTheme}>
                  <RootLayoutNav />
                </ThemeProvider>
              </NotificationProvider>
            </CustomThemeProvider>
          </PostProvider>
        </MediaPlaybackProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
