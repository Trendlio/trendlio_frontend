import { Stack } from 'expo-router';

export default function EditProfileLayout() {
  return (
    <Stack screenOptions={{
      presentation: 'modal',
      headerShown: false,
    }} />
  );
}
