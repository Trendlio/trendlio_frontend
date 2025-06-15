import { Stack } from 'expo-router';
import { MediaPlaybackProvider } from '@/context/MediaPlaybackContext';

export default function ProtectedLayout() {
  return (
    <MediaPlaybackProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(edit_profile)"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(comments)/comments"
          options={{
            headerShown: false,
            title: 'Comments'
          }}
        />
        <Stack.Screen
          name="(comments)/createcomment"
          options={{
            headerShown: false,
            title: 'Create Comment'
          }}
        />
        {/* Add other protected routes here if they are not part of the tabs */}
      </Stack>
    </MediaPlaybackProvider>
  );
} 